terraform {
  required_version = ">= 1.10, < 2.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0, < 7.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.7, < 3.0"
    }
  }
  backend "s3" {}
}

variable "region" { type = string }
variable "account_id" { type = string }
variable "name" {
  type = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{5,24}$", var.name))
    error_message = "Use a unique lowercase lab name between 6 and 25 characters."
  }
}
variable "ami_id" { type = string }
variable "postgres_version" { type = string }
variable "postgres_parameter_family" { type = string }
variable "azs" {
  type = list(string)
  validation {
    condition     = length(var.azs) == 2 && length(distinct(var.azs)) == 2
    error_message = "Select two distinct supported availability zones."
  }
}
variable "protect_database" {
  type    = bool
  default = true
}
variable "final_snapshot_id" { type = string }

provider "aws" {
  region              = var.region
  allowed_account_ids = [var.account_id]
  default_tags {
    tags = { Project = var.name, ManagedBy = "lesson-terraform" }
  }
}

resource "aws_vpc" "lab" {
  cidr_block           = "10.82.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}
resource "aws_subnet" "private" {
  count                   = 2
  vpc_id                  = aws_vpc.lab.id
  cidr_block              = cidrsubnet(aws_vpc.lab.cidr_block, 8, count.index)
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = false
}
resource "aws_route_table" "private" { vpc_id = aws_vpc.lab.id }
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
# No internet gateway/default route/NAT. Approved endpoints supply required AWS access.
resource "aws_security_group" "vm" {
  name   = "${var.name}-vm"
  vpc_id = aws_vpc.lab.id
}
resource "aws_security_group" "db" {
  name   = "${var.name}-db"
  vpc_id = aws_vpc.lab.id
}
resource "aws_security_group" "endpoints" {
  name   = "${var.name}-endpoints"
  vpc_id = aws_vpc.lab.id
}
resource "aws_vpc_security_group_ingress_rule" "db_from_vm" {
  security_group_id            = aws_security_group.db.id
  referenced_security_group_id = aws_security_group.vm.id
  ip_protocol                 = "tcp"
  from_port                   = 5432
  to_port                     = 5432
}
resource "aws_vpc_security_group_egress_rule" "vm_to_db" {
  security_group_id            = aws_security_group.vm.id
  referenced_security_group_id = aws_security_group.db.id
  ip_protocol                 = "tcp"
  from_port                   = 5432
  to_port                     = 5432
}
resource "aws_vpc_security_group_ingress_rule" "endpoints_from_vm" {
  security_group_id            = aws_security_group.endpoints.id
  referenced_security_group_id = aws_security_group.vm.id
  ip_protocol                 = "tcp"
  from_port                   = 443
  to_port                     = 443
}
resource "aws_vpc_security_group_egress_rule" "vm_to_endpoints" {
  security_group_id            = aws_security_group.vm.id
  referenced_security_group_id = aws_security_group.endpoints.id
  ip_protocol                 = "tcp"
  from_port                   = 443
  to_port                     = 443
}
resource "aws_vpc_endpoint" "interface" {
  for_each            = toset(["ssm", "ssmmessages", "secretsmanager"])
  vpc_id              = aws_vpc.lab.id
  service_name        = "com.amazonaws.${var.region}.${each.value}"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.endpoints.id]
}
resource "aws_vpc_endpoint" "s3" {
  vpc_id          = aws_vpc.lab.id
  service_name    = "com.amazonaws.${var.region}.s3"
  route_table_ids = [aws_route_table.private.id]
  policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect = "Allow", Principal = "*", Action = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
    Resource = [aws_s3_bucket.documents.arn, "${aws_s3_bucket.documents.arn}/*"]
  }] })
}
resource "aws_vpc_security_group_egress_rule" "vm_to_s3" {
  security_group_id = aws_security_group.vm.id
  prefix_list_id    = aws_vpc_endpoint.s3.prefix_list_id
  ip_protocol      = "tcp"
  from_port        = 443
  to_port          = 443
}
resource "aws_iam_role" "vm" {
  name = "${var.name}-vm"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }, Action = "sts:AssumeRole"
  }] })
}
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.vm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
resource "aws_iam_instance_profile" "vm" {
  name = "${var.name}-vm"
  role = aws_iam_role.vm.name
}
resource "aws_iam_role_policy" "vm_fixture_read" {
  role = aws_iam_role.vm.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = "s3:GetObject", Resource = "${aws_s3_bucket.documents.arn}/fixtures/*" }
  ] })
}
resource "aws_instance" "vm" {
  ami                         = var.ami_id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.private[0].id
  associate_public_ip_address = false
  vpc_security_group_ids      = [aws_security_group.vm.id]
  iam_instance_profile        = aws_iam_instance_profile.vm.name
  metadata_options {
    http_tokens = "required"
  }
  root_block_device {
    encrypted = true
  }
  depends_on = [aws_vpc_endpoint.interface, aws_iam_role_policy_attachment.ssm]
}
resource "aws_db_subnet_group" "lab" {
  name       = var.name
  subnet_ids = aws_subnet.private[*].id
}
resource "aws_db_parameter_group" "lab" {
  name   = var.name
  family = var.postgres_parameter_family
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}
resource "aws_db_instance" "lab" {
  identifier                    = var.name
  engine                        = "postgres"
  engine_version                = var.postgres_version
  instance_class                = "db.t3.micro"
  allocated_storage             = 20
  storage_encrypted             = true
  db_name                       = "lesson"
  username                      = "lessonadmin"
  manage_master_user_password    = true
  publicly_accessible           = false
  db_subnet_group_name           = aws_db_subnet_group.lab.name
  vpc_security_group_ids         = [aws_security_group.db.id]
  parameter_group_name          = aws_db_parameter_group.lab.name
  backup_retention_period       = 7
  deletion_protection           = var.protect_database
  skip_final_snapshot           = false
  final_snapshot_identifier     = var.final_snapshot_id
  copy_tags_to_snapshot          = true
}
resource "aws_s3_bucket" "documents" {
  bucket        = "${var.name}-${var.account_id}"
  force_destroy = false
}
resource "aws_s3_bucket_public_access_block" "documents" {
  bucket                  = aws_s3_bucket.documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration { status = "Enabled" }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}
resource "aws_s3_bucket_policy" "tls" {
  bucket = aws_s3_bucket.documents.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect = "Deny", Principal = "*", Action = "s3:*",
    Resource = [aws_s3_bucket.documents.arn, "${aws_s3_bucket.documents.arn}/*"],
    Condition = { Bool = { "aws:SecureTransport" = "false" } }
  }] })
}
resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule {
    id     = "synthetic-fixtures-only"
    status = "Enabled"
    filter { prefix = "fixtures/" }
    expiration { days = 30 }
    noncurrent_version_expiration { noncurrent_days = 30 }
    abort_incomplete_multipart_upload { days_after_initiation = 1 }
  }
  depends_on = [aws_s3_bucket_versioning.documents]
}
resource "aws_dynamodb_table" "receipts" {
  name         = "${var.name}-receipts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  point_in_time_recovery { enabled = true }
}
resource "aws_iam_role" "events" {
  name = "${var.name}-events"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole"
  }] })
}
resource "aws_cloudwatch_log_group" "events" {
  name              = "/aws/lambda/${var.name}-events"
  retention_in_days = 7
}
resource "aws_iam_role_policy" "events" {
  role = aws_iam_role.events.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = "dynamodb:PutItem", Resource = aws_dynamodb_table.receipts.arn },
    { Effect = "Allow", Action = "sqs:SendMessage", Resource = aws_sqs_queue.failures.arn },
    { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "${aws_cloudwatch_log_group.events.arn}:*" }
  ] })
}
resource "aws_sqs_queue" "failures" {
  name                      = "${var.name}-event-failures"
  sqs_managed_sse_enabled    = true
  message_retention_seconds = 1209600
}
data "archive_file" "events" {
  type        = "zip"
  source_file = "${path.module}/event_handler.py"
  output_path = "${path.module}/event-handler.zip"
}
resource "aws_lambda_function" "events" {
  function_name    = "${var.name}-events"
  role             = aws_iam_role.events.arn
  runtime          = "python3.12"
  handler          = "event_handler.handler"
  filename         = data.archive_file.events.output_path
  source_code_hash = data.archive_file.events.output_base64sha256
  timeout          = 10
  memory_size      = 128
  reserved_concurrent_executions = 2
  environment {
    variables = { RECEIPT_TABLE = aws_dynamodb_table.receipts.name, SOURCE_BUCKET = aws_s3_bucket.documents.id }
  }
  depends_on = [aws_iam_role_policy.events]
}
resource "aws_lambda_permission" "s3" {
  statement_id   = "OwnedBucketOnly"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.events.function_name
  principal      = "s3.amazonaws.com"
  source_arn     = aws_s3_bucket.documents.arn
  source_account = var.account_id
}
resource "aws_lambda_function_event_invoke_config" "events" {
  function_name                = aws_lambda_function.events.function_name
  maximum_event_age_in_seconds  = 60
  maximum_retry_attempts        = 2
  destination_config {
    on_failure { destination = aws_sqs_queue.failures.arn }
  }
}
resource "aws_s3_bucket_notification" "documents" {
  bucket = aws_s3_bucket.documents.id
  lambda_function {
    lambda_function_arn = aws_lambda_function.events.arn
    events             = ["s3:ObjectCreated:*"]
    filter_prefix      = "fixtures/"
  }
  depends_on = [aws_lambda_permission.s3, aws_s3_bucket_versioning.documents]
}
output "owned_resources" {
  value = { vm = aws_instance.vm.id, db = aws_db_instance.lab.identifier,
    db_host = aws_db_instance.lab.address, bucket = aws_s3_bucket.documents.id,
    receipts = aws_dynamodb_table.receipts.name, lambda = aws_lambda_function.events.function_name,
    vpc = aws_vpc.lab.id, db_security_group = aws_security_group.db.id }
}
