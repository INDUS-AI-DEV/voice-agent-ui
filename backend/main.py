import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson.json_util import dumps
from dotenv import load_dotenv
from datetime import datetime
import uuid

load_dotenv()

app = FastAPI()

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient("mongodb+srv://aaryanreegmi39:fWx0HUwhuSPZLUn9@cluster0.3etrp2b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["MRE-outbound"]
collection = db["transcript"]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/get-call-ids")
async def get_call_ids(skip: int = 0, limit: int = 10):
    call_ids = collection.find({}, {"user_details.call_id": 1, "user_id": 1, "_id": 0}).skip(skip).limit(limit)
    return {doc["user_details"]["call_id"]: doc["user_id"] for doc in call_ids}

@app.get("/get-conversation/{call_id}")
async def get_conversation(call_id: str):
    document = collection.find_one({"user_details.call_id": call_id})
    if document:
        return dumps(document)
    return {"error": "Conversation not found"}

@app.post("/add-test-call")
async def add_test_call(request: Request):
    data = await request.json()
    client_name = data.get("clientName", "Test User")
    call_id = str(uuid.uuid4())
    now = datetime.utcnow()
    doc = {
        "user_details": {
            "call_id": call_id,
            "name": client_name,
            "phone_number": data.get("phoneNumber", "N/A"),
        },
        "user_id": call_id,
        "session_start": {"$date": now.isoformat()},
        "session_end": {"$date": now.isoformat()},
        "session_history": {"items": []},
        "ordered": False,
        "order_details": None
    }
    collection.insert_one(doc)
    return {"success": True, "call_id": call_id} 