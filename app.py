from flask import Flask, request, jsonify, render_template
from botocore.exceptions import ClientError
import s3_utils

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

# LIST BUCKETS
@app.route("/buckets", methods=["GET"])
def get_buckets():
    try:
        buckets = s3_utils.list_buckets()
        return jsonify(buckets)
    except ClientError as e:
        return jsonify(error=str(e)), 500

# LIST OBJECTS IN BUCKET
@app.route("/objects", methods=["GET"])
def get_objects():
    bucket = request.args.get("bucket")
    prefix = request.args.get("prefix", "")
    if not s3_utils.bucket_exists(bucket):
        return jsonify(error="Bucket does not exist"), 404
    folders, files = s3_utils.list_objects(bucket, prefix)
    return jsonify({"folders": folders, "files": files})

# CREATE BUCKET
@app.route("/bucket/create", methods=["POST"])
def create_bucket():
    bucket_name = request.json.get("bucket")
    if not bucket_name:
        return jsonify(error="Bucket name required"), 400
    if s3_utils.bucket_exists(bucket_name):
        return jsonify(error="Bucket already exists"), 400
    try:
        s3_utils.create_bucket(bucket_name)
        return jsonify(message="Bucket created successfully"), 201
    except ClientError as e:
        return jsonify(error=str(e)), 400

# DELETE BUCKET
@app.route("/bucket/delete", methods=["POST"])
def delete_bucket():
    bucket_name = request.json.get("bucket")
    if not s3_utils.bucket_exists(bucket_name):
        return jsonify(error="Bucket does not exist"), 404
    try:
        s3_utils.delete_bucket(bucket_name)
        return jsonify(message="Bucket deleted")
    except ClientError as e:
        return jsonify(error=str(e)), 400

# CREATE FOLDER
@app.route("/folder/create", methods=["POST"])
def create_folder():
    bucket = request.json.get("bucket")
    folder = request.json.get("folder")
    if not bucket or not folder:
        return jsonify(error="Bucket and folder required"), 400
    if not s3_utils.bucket_exists(bucket):
        return jsonify(error="Bucket does not exist"), 404
    try:
        s3_utils.create_folder(bucket, folder)
        return jsonify(message="Folder created")
    except ClientError as e:
        return jsonify(error=str(e)), 400

# DELETE FOLDER
@app.route("/folder/delete", methods=["POST"])
def delete_folder():
    bucket = request.json.get("bucket")
    folder = request.json.get("folder")
    if not bucket or not folder:
        return jsonify(error="Bucket and folder required"), 400
    if not s3_utils.bucket_exists(bucket):
        return jsonify(error="Bucket does not exist"), 404
    folders, files = s3_utils.list_objects(bucket, folder)
    if not folders and not files:
        return jsonify(error="Folder does not exist"), 404
    try:
        s3_utils.delete_folder(bucket, folder)
        return jsonify(message="Folder deleted")
    except ClientError as e:
        return jsonify(error=str(e)), 400

# UPLOAD FILE
@app.route("/upload", methods=["POST"])
def upload():
    bucket = request.form.get("bucket")
    key = request.form.get("key")
    file = request.files.get("file")
    if not bucket or not key or not file:
        return jsonify(error="Bucket, key, and file required"), 400
    if not s3_utils.bucket_exists(bucket):
        return jsonify(error="Bucket does not exist"), 404
    try:
        s3_utils.upload_file(bucket, file, key)
        return jsonify(message="File uploaded")
    except ClientError as e:
        return jsonify(error=str(e)), 400

# DELETE FILE
@app.route("/file/delete", methods=["POST"])
def delete_file():
    bucket = request.json.get("bucket")
    key = request.json.get("key")
    if not bucket or not key:
        return jsonify(error="Bucket and key required"), 400
    if not s3_utils.bucket_exists(bucket):
        return jsonify(error="Bucket does not exist"), 404
    if not s3_utils.object_exists(bucket, key):
        return jsonify(error="File does not exist"), 404
    try:
        s3_utils.delete_file(bucket, key)
        return jsonify(message="File deleted")
    except ClientError as e:
        return jsonify(error=str(e)), 400

# COPY FILE
@app.route("/copy", methods=["POST"])
def copy():
    src_bucket = request.json.get("src_bucket")
    src_key = request.json.get("src_key")
    dest_bucket = request.json.get("dest_bucket")
    dest_key = request.json.get("dest_key")
    if not all([src_bucket, src_key, dest_bucket, dest_key]):
        return jsonify(error="All fields required"), 400
    if not s3_utils.bucket_exists(src_bucket):
        return jsonify(error="Source bucket does not exist"), 404
    if not s3_utils.bucket_exists(dest_bucket):
        return jsonify(error="Destination bucket does not exist"), 404
    if not s3_utils.object_exists(src_bucket, src_key):
        return jsonify(error="Source file does not exist"), 404
    try:
        s3_utils.copy_file(src_bucket, src_key, dest_bucket, dest_key)
        return jsonify(message="File copied")
    except ClientError as e:
        return jsonify(error=str(e)), 400

# MOVE FILE
@app.route("/move", methods=["POST"])
def move():
    src_bucket = request.json.get("src_bucket")
    src_key = request.json.get("src_key")
    dest_bucket = request.json.get("dest_bucket")
    dest_key = request.json.get("dest_key")
    if not all([src_bucket, src_key, dest_bucket, dest_key]):
        return jsonify(error="All fields required"), 400
    if not s3_utils.bucket_exists(src_bucket):
        return jsonify(error="Source bucket does not exist"), 404
    if not s3_utils.bucket_exists(dest_bucket):
        return jsonify(error="Destination bucket does not exist"), 404
    if not s3_utils.object_exists(src_bucket, src_key):
        return jsonify(error="Source file does not exist"), 404
    try:
        s3_utils.move_file(src_bucket, src_key, dest_bucket, dest_key)
        return jsonify(message="File moved")
    except ClientError as e:
        return jsonify(error=str(e)), 400


if __name__ == "__main__":
    app.run(debug=True)
