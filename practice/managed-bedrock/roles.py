"""Return reviewable policy documents; never create roles or grant permissions."""
from provision import validate


def policies(config, knowledge_base_id=None):
    import re
    c = validate(config)
    if knowledge_base_id is not None and not re.fullmatch(r"[A-Za-z0-9]{10}", knowledge_base_id):
        raise ValueError("use the actual created knowledge base ID")
    kb_arn = f"arn:aws:bedrock:{c['region']}:{c['account']}:knowledge-base/{knowledge_base_id}"
    def policy(statements):
        return {"Version": "2012-10-17", "Statement": statements}
    def allow(actions, resources, **extra):
        return {"Effect": "Allow", "Action": actions, "Resource": resources, **extra}
    result = {
        "kb": policy([
            allow(["bedrock:InvokeModel"], [c["embedding_model_arn"]]),
            allow(["s3:ListBucket"], ["arn:aws:s3:::" + c["bucket"]], Condition={
                "StringLike": {"s3:prefix": [c["prefix"] + "*"]}}),
            allow(["s3:GetObject"], ["arn:aws:s3:::" + c["bucket"] + "/" + c["prefix"] + "*"]),
            allow(["aoss:APIAccessAll"], [c["collection_arn"]])]),
        }
    if knowledge_base_id is not None:
        result["agent"] = policy([allow(["bedrock:InvokeModel"], [c["agent_model_arn"]]),
                                  allow(["bedrock:Retrieve"], [kb_arn])])
    return result


def trust(account, region, kind, identifier="*"):
    if kind not in {"agent", "knowledge-base"}:
        raise ValueError("unsupported trust kind")
    return {"Version": "2012-10-17", "Statement": [{"Effect": "Allow",
        "Principal": {"Service": "bedrock.amazonaws.com"}, "Action": "sts:AssumeRole",
        "Condition": {"StringEquals": {"aws:SourceAccount": account},
                      "ArnLike": {"aws:SourceArn": f"arn:aws:bedrock:{region}:{account}:{kind}/{identifier}"}}}]}
