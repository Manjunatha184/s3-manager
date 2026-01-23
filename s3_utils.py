import boto3
from botocore.exceptions import ClientError

region = boto3.session.Session().region_name or 'us-east-1'
s3 = boto3.client("s3", region_name=region)


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



def create_bucket(bucket_name):
    try:
        if region == 'us-east-1':
            s3.create_bucket(Bucket=bucket_name)
        else:
            s3.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={
                    "LocationConstraint": region
                }
            )
    except ClientError as e:
        raise Exception(e.response["Error"]["Message"])

def delete_bucket(bucket_name):
    try:
        s3.head_bucket(Bucket=bucket_name)

        response = s3.list_objects_v2(Bucket=bucket_name, MaxKeys=1)
        if "Contents" in response:
            raise Exception("Bucket is not empty")

        s3.delete_bucket(Bucket=bucket_name)

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "404":
            raise Exception("Bucket does not exist")
        else:
            raise Exception(e.response["Error"]["Message"])




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
    s3.upload_fileobj(file, bucket_name, key)



def delete_file(bucket_name, key):
    s3.delete_object(Bucket=bucket_name, Key=key)


def copy_file(src_bucket, src_key, dest_bucket, dest_key):
    if not object_exists(src_bucket, src_key):
        raise Exception(f"Source file '{src_key}' does not exist in bucket '{src_bucket}'")
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


def get_download_url(bucket, key, expiration=3600):
    try:
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        raise Exception(e.response["Error"]["Message"])
