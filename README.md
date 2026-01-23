# S3 File Manager

A web-based AWS S3 File Manager built using Python Flask and boto3. This application provides a file explorer-like interface to manage S3 buckets, folders, and files.

## Features

- **List S3 Contents**: Browse buckets and navigate through folders
- **Bucket Management**: Create and delete S3 buckets
- **Folder Management**: Create and delete folders within buckets
- **File Operations**: Upload, download, delete, copy, move, and rename files
- **User-Friendly UI**: File explorer interface with sidebar, breadcrumbs, and context menus

## Tech Stack

- **Backend**: Python, Flask
- **AWS SDK**: boto3
- **Frontend**: HTML, CSS, JavaScript

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure AWS credentials (see below)
4. Run the application:
   ```bash
   python app.py
   ```
5. Open http://localhost:5000 in your browser

## AWS Configuration

**Important**: The app requires AWS credentials to function. If you see "AWS credentials not configured" message, follow these steps:

### Option 1: AWS CLI (Recommended)
```bash
pip install awscli
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region name (e.g., us-east-1, ap-south-1)
- Default output format (json)

### Option 2: Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=your_region
```

### Option 3: Credentials File
Create `~/.aws/credentials`:
```
[default]
aws_access_key_id = your_access_key
aws_secret_access_key = your_secret_key
```

And `~/.aws/config`:
```
[default]
region = your_region
```

## Required Permissions
Your AWS user/role needs these S3 permissions:
- `s3:ListAllMyBuckets`
- `s3:CreateBucket`
- `s3:DeleteBucket`
- `s3:ListBucket`
- `s3:GetObject`
- `s3:PutObject`
- `s3:DeleteObject`
- `s3:CopyObject`

## Usage

- **Buckets**: View all buckets in the sidebar. Click the "+" button to create a new bucket.
- **Navigation**: Click on a bucket to view its contents. Double-click folders to navigate.
- **File Operations**:
  - Upload: Click "Upload" button or drag files
  - Download: Double-click files or use context menu
  - Delete: Select items and use context menu or toolbar
  - Copy/Move: Select items, right-click, choose action
  - Rename: Select item, right-click, rename

## API Endpoints

- `GET /buckets` - List all buckets
- `GET /objects?bucket=<bucket>&prefix=<prefix>` - List objects in bucket
- `POST /bucket/create` - Create bucket
- `POST /bucket/delete` - Delete bucket
- `POST /folder/create` - Create folder
- `POST /folder/delete` - Delete folder
- `POST /upload` - Upload file
- `POST /file/delete` - Delete file
- `POST /copy` - Copy file
- `POST /move` - Move file
- `GET /download?bucket=<bucket>&key=<key>` - Download file
Frontend: HTML, CSS, JavaScript (Vanilla)
Cloud: AWS S3


Project Structure
s3-manager/
│
├── app.py                # Flask application
├── s3_utils.py           # AWS S3 utility functions
├── templates/
│   └── index.html        # Web UI
├── venv/                 # Python virtual environment
└── README.md


Prerequisites
Python 3.8+
AWS activated account


Provide:
AWS Access Key ID
AWS Secret Access Key
Region (example: ap-south-1)


Installation & Setup
Clone the repository
git clone https://github.com/your-username/s3-file-manager.git
cd s3-file-manager


Create and activate virtual environment
python -m venv venv
source venv/bin/activate


Install dependencies
pip install flask boto3


Run the application
python app.py


Open browser and visit
http://127.0.0.1:5000


API Endpoints
Method	Endpoint	    Description
GET	    /buckets	    List S3 buckets
GET	    /objects	    List objects in a bucket
POST	/bucket/create	Create bucket
POST	/bucket/delete	Delete bucket
POST	/folder/create	Create folder
POST	/folder/delete	Delete folder
POST	/upload	Upload  file
POST	/file/delete	Delete file
POST	/copy	        Copy file
POST	/move	        Move file


Author
Manjunatha