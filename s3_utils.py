import boto3
from botocore.exceptions import ClientError

s3 = boto3.client("s3")


def list_buckets():
    response = s3.list_buckets()
    return [bucket["Name"] for bucket in response["Buckets"]]


def list_objects(bucket_name, prefix=""):
    response = s3.list_objects_v2(
        Bucket=bucket_name,
        Prefix=prefix,
        Delimiter="/"
    )

    folders = []
    files = []

    if "CommonPrefixes" in response:
        for p in response["CommonPrefixes"]:
            folders.append(p["Prefix"])

    if "Contents" in response:
        for obj in response["Contents"]:
            if obj["Key"] != prefix:
                files.append(obj["Key"])

    return folders, files



def create_bucket(bucket_name, region="ap-south-1"):
    try:
        s3.create_bucket(
            Bucket=bucket_name,
            CreateBucketConfiguration={
                "LocationConstraint": region
            }
        )
    except ClientError as e:
        raise Exception(e.response["Error"]["Message"])

def delete_bucket(bucket_name):
    s3.delete_bucket(Bucket=bucket_name)



def create_folder(bucket_name, folder_name):
    if not folder_name.endswith("/"):
        folder_name += "/"
    if folder_exists(bucket_name, folder_name):
        raise Exception(f"Folder '{folder_name}' already exists in bucket '{bucket_name}'")
    s3.put_object(Bucket=bucket_name, Key=folder_name)


def delete_folder(bucket_name, folder_name):
    objects = s3.list_objects_v2(
        Bucket=bucket_name,
        Prefix=folder_name
    )

    if "Contents" in objects:
        delete_items = [{"Key": obj["Key"]} for obj in objects["Contents"]]
        s3.delete_objects(
            Bucket=bucket_name,
            Delete={"Objects": delete_items}
        )

def upload_file(bucket_name, file, key):
    # Extract folder from key
    folder_prefix = "/".join(key.split("/")[:-1])
    if folder_prefix and not folder_exists(bucket_name, folder_prefix):
        raise Exception(f"Folder '{folder_prefix}' does not exist in bucket '{bucket_name}'")
    s3.upload_fileobj(file, bucket_name, key)



def delete_file(bucket_name, key):
    s3.delete_object(Bucket=bucket_name, Key=key)


def copy_file(src_bucket, src_key, dest_bucket, dest_key):
    if not object_exists(src_bucket, src_key):
        raise Exception(f"Source file '{src_key}' does not exist in bucket '{src_bucket}'")
    
    # Check destination folder exists
    dest_folder = "/".join(dest_key.split("/")[:-1])
    if dest_folder and not folder_exists(dest_bucket, dest_folder):
        raise Exception(f"Destination folder '{dest_folder}' does not exist in bucket '{dest_bucket}'")

    copy_source = {"Bucket": src_bucket, "Key": src_key}
    s3.copy_object(CopySource=copy_source, Bucket=dest_bucket, Key=dest_key)


def move_file(src_bucket, src_key, dest_bucket, dest_key):
    copy_file(src_bucket, src_key, dest_bucket, dest_key)
    delete_file(src_bucket, src_key)

def folder_exists(bucket_name, folder_name):
    if not folder_name.endswith("/"):
        folder_name += "/"
    response = s3.list_objects_v2(
        Bucket=bucket_name,
        Prefix=folder_name,
        MaxKeys=1
    )
    return "Contents" in response


def bucket_exists(bucket):
    try:
        s3.head_bucket(Bucket=bucket)
        return True
    except ClientError:
        return False


def object_exists(bucket, key):
    try:
        s3.head_object(Bucket=bucket, Key=key)
        return True
    except ClientError:
        return False
