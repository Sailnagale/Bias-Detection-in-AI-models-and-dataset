import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ast

from inspector import inspect_dataset, get_correlation_matrix
from bias_detector import detect_biases
from fairness_metrics import calculate_fairness
from mitigator import mitigate_dataset

app = FastAPI(title="Bias Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Global in-memory storage for simplicity (not for production)
UPLOADED_DFS = {}

@app.get("/")
def read_root():
    return {"message": "Bias Detection API is running"}

@app.post("/api/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xlsx', '.json')):
        raise HTTPException(status_code=400, detail="Only CSV, Excel, and JSON files are supported.")
    
    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            try:
                df = pd.read_csv(io.BytesIO(contents))
            except UnicodeDecodeError:
                # Fallback for Windows CP1252 / Latin-1 encoded CSV files
                df = pd.read_csv(io.BytesIO(contents), encoding='latin1')
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(contents))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(contents))
            
        dataset_id = "current_dataset"
        UPLOADED_DFS[dataset_id] = df
        
        return {
            "message": "Upload successful", 
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "columns_list": list(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeRequest(BaseModel):
    dataset_id: str = "current_dataset"
    target_column: str = None
    sensitive_column: str = None

@app.post("/api/dataset/analyze")
def analyze_dataset(req: AnalyzeRequest):
    df = UPLOADED_DFS.get(req.dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    overview = inspect_dataset(df)
    correlations = get_correlation_matrix(df)
    
    biases = detect_biases(df, req.target_column, req.sensitive_column)
    
    fairness = None
    if req.target_column and req.sensitive_column:
        fairness = calculate_fairness(df, req.target_column, req.sensitive_column)
        
    return {
        "overview": overview,
        "correlations": correlations,
        "biases": biases,
        "fairness": fairness
    }

class MitigateRequest(BaseModel):
    dataset_id: str = "current_dataset"
    target_column: str
    sensitive_column: str
    strategies: list

@app.post("/api/dataset/mitigate")
def mitigate(req: MitigateRequest):
    df = UPLOADED_DFS.get(req.dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    try:
        mitigated_df = mitigate_dataset(df, req.target_column, req.sensitive_column, req.strategies)
        UPLOADED_DFS[req.dataset_id + "_mitigated"] = mitigated_df
        
        # Recalculate metrics on new df
        overview = inspect_dataset(mitigated_df)
        biases = detect_biases(mitigated_df, req.target_column, req.sensitive_column)
        fairness = calculate_fairness(mitigated_df, req.target_column, req.sensitive_column)
        
        return {
            "message": "Mitigation successful",
            "overview": overview,
            "biases": biases,
            "fairness": fairness,
            "mitigated_dataset_id": req.dataset_id + "_mitigated"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import Response

@app.get("/api/dataset/download/{dataset_id}")
def download_dataset(dataset_id: str):
    df = UPLOADED_DFS.get(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    csv_data = df.to_csv(index=False)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={dataset_id}.csv"}
    )

class ModelUrlRequest(BaseModel):
    model_url: str

import asyncio
import random

@app.post("/api/model/analyze-url")
async def analyze_model_url(req: ModelUrlRequest):
    if not req.model_url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL provided.")
    
    # Simulate scanning time
    await asyncio.sleep(2)
    
    # Generate mock results
    score = random.randint(55, 88)
    risk_level = "High" if score < 70 else ("Medium" if score < 85 else "Low")
    
    biases = []
    if score < 85:
        biases.append({
            "type": "Gender Bias in Output",
            "severity": "High" if score < 70 else "Medium",
            "explanation": "The model frequently assumes male pronouns for neutral professions (e.g., 'doctor', 'engineer')."
        })
    if score < 75:
        biases.append({
            "type": "Racial Sentiment Disparity",
            "severity": "High",
            "explanation": "Text generated for minority groups has slightly lower average sentiment scores compared to majority groups."
        })
        
    return {
        "score": score,
        "risk_level": risk_level,
        "biases": biases,
        "prompts_tested": 150,
        "url_scanned": req.model_url
    }
