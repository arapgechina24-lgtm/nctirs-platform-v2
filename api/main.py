import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import predict, surveillance

app = FastAPI(
    title="NCTIRS AI-Backend",
    description="Python FastAPI backend serving AI models for the NCTIRS platform.",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"], # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api/v1/predict", tags=["Predictive Models"])
app.include_router(surveillance.router, prefix="/api/v1/surveillance", tags=["Surveillance"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "NCTIRS AI-Backend"}

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
