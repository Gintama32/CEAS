from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
@app.get("/")
def root():
    return {"message": "Hello World"}

app.add_middleware(CORSMiddleware, 
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

@app.get("/api/v1/users")
def get_users():
    return {"message": "Users fetched successfully"}            