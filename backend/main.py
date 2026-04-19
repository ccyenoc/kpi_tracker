from fastapi import FastAPI
from fastapi.middleware.cors import CORSMisddleware

app = FastAPI()

# Allow React (VERY IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/user")
def get_user():
    return {
        "name": "Jane Staff",
        "role": "Staff"
    }