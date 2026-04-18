from fastapi import Depends, FastAPI, Header, HTTPException, status
from .config import settings
from .rag_pipeline import RagPipeline
from .schemas import (
    GenerateAssessmentRequest,
    GenerateAssessmentResponse,
    IndexMaterialRequest,
    IndexMaterialResponse,
)

app = FastAPI(title="Academic ERP RAG Service", version="1.0.0")
pipeline = RagPipeline()


def verify_api_key(x_rag_api_key: str = Header(default="")):
    if x_rag_api_key != settings.rag_service_api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid RAG service API key",
        )


@app.get("/health")
def health():
    return {"ok": True, "service": "rag_service"}


@app.post(
    "/v1/materials/index",
    response_model=IndexMaterialResponse,
    dependencies=[Depends(verify_api_key)],
)
def index_material(req: IndexMaterialRequest):
    try:
        return pipeline.index_material(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post(
    "/v1/assessments/generate",
    response_model=GenerateAssessmentResponse,
    dependencies=[Depends(verify_api_key)],
)
def generate_assessment(req: GenerateAssessmentRequest):
    try:
        return pipeline.generate_assessment(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
