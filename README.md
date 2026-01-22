S3 File Manager (Flask + AWS S3)


A simple web-based AWS S3 File Manager built using Python Flask and boto3.
This application allows you to manage S3 buckets, folders, and files through a basic web UI.


Tech Stack
Backend: Python, Flask
AWS SDK: boto3
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