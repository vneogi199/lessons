"""Receipt-only S3 event lab. A receipt is the entire effect, not a work-completion flag."""
import hashlib
import json
import os
from urllib.parse import unquote_plus


def record(event, table, bucket):
    records = event.get("Records")
    if not isinstance(records, list) or not 1 <= len(records) <= 10:
        raise ValueError("bounded S3 records required")
    accepted = duplicates = 0
    for item in records:
        source = item["s3"]
        obj = source["object"]
        key = unquote_plus(obj["key"])
        version = obj.get("versionId")
        if (item.get("eventSource") != "aws:s3" or not item.get("eventName", "").startswith("ObjectCreated:")
                or source["bucket"]["name"] != bucket or not key.startswith("fixtures/")
                or not isinstance(version, str) or version in {"", "null"} or len(key) > 1024):
            raise ValueError("unexpected or unversioned source")
        identity = hashlib.sha256(json.dumps([bucket, key, version]).encode()).hexdigest()
        try:
            table.put_item(Item={"id": identity, "bucket": bucket, "key": key, "version": version},
                           ConditionExpression="attribute_not_exists(id)")
            accepted += 1
        except Exception as exc:
            if getattr(exc, "response", {}).get("Error", {}).get("Code") != "ConditionalCheckFailedException":
                raise
            duplicates += 1
    return {"accepted": accepted, "duplicates": duplicates}


def handler(event, context):
    import boto3
    from botocore.config import Config
    table = boto3.resource("dynamodb", config=Config(connect_timeout=1, read_timeout=2,
        retries={"total_max_attempts": 1})).Table(os.environ["RECEIPT_TABLE"])
    return record(event, table, os.environ["SOURCE_BUCKET"])
