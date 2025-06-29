from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Demo: In-memory MPIN (in production, use a DB)
VALID_MPIN = "1234"

class MPINRequest(BaseModel):
    mpin: str

@app.post("/api/verify-mpin")
async def verify_mpin(data: MPINRequest):
    if data.mpin == VALID_MPIN:
        return {"success": True}
    return {"success": False, "error": "Invalid MPIN"}

class TelephonyRequest(BaseModel):
    phoneNumber: str
    clientName: str

@app.post("/api/start-telephony-call")
async def start_telephony_call(data: TelephonyRequest):
    # Here you would integrate with your telephony provider (e.g., Twilio)
    # For demo, just return success
    if data.phoneNumber and data.clientName:
        return {"success": True, "message": "Call initiated"}
    return {"success": False, "error": "Missing phone number or client name"} 