import json
import os
import tempfile
from urllib.parse import urlparse

import requests
from openai import OpenAI
from llama_index.core import SimpleDirectoryReader
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

from .config import settings
from .chroma_store import ChromaStore
from .schemas import (
    GenerateAssessmentRequest,
    GenerateAssessmentResponse,
    GeneratedQuestion,
    IndexMaterialRequest,
    IndexMaterialResponse,
)


class RagPipeline:
    def __init__(self):
        self.store = ChromaStore(settings.chroma_persist_dir)
        self.embed_model = HuggingFaceEmbedding(model_name=settings.embed_model)
        self.llm_client = OpenAI(api_key=settings.groq_api_key, base_url=settings.groq_base_url)

    def _download_to_temp(self, url: str) -> str:
        parsed = urlparse(url)
        suffix = os.path.splitext(parsed.path)[1] or ".pdf"
        with requests.get(url, stream=True, timeout=90) as response:
            response.raise_for_status()
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        f.write(chunk)
                return f.name

    def index_material(self, req: IndexMaterialRequest) -> IndexMaterialResponse:
        temp_file = None
        file_path = req.local_file_path
        try:
            if req.material_url:
                temp_file = self._download_to_temp(req.material_url)
                file_path = temp_file
            if not file_path or not os.path.exists(file_path):
                raise FileNotFoundError("Material file not found")
            documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
            for d in documents:
                d.metadata = d.metadata or {}
                d.metadata.update(
                    {
                        "course_id": req.course_id,
                        "material_id": req.material_id,
                        "title": req.title,
                    }
                )
            self.store.upsert_index_from_documents(
                course_id=req.course_id,
                material_id=req.material_id,
                documents=documents,
                embed_model=self.embed_model,
                replace_existing=True,
            )
            return IndexMaterialResponse(
                course_id=req.course_id,
                material_id=req.material_id,
                title=req.title,
                chunks_indexed=len(documents),
            )
        finally:
            if temp_file and os.path.exists(temp_file):
                os.remove(temp_file)

    def generate_assessment(self, req: GenerateAssessmentRequest) -> GenerateAssessmentResponse:
        top_k = req.top_k or settings.default_top_k
        index = self.store.load_index(req.course_id, req.material_id, self.embed_model)
        retrieval_query = (
            f"Generate {req.assessment_type.value} questions for {req.title}."
            f"Topic hint:{req.topic_hint} . Difficulty:{req.difficulty}."
            f"Question types:{','.join([qt.value for qt in req.question_types])}."
        )
        retriever = index.as_retriever(
            similarity_top_k=top_k,
            vector_store_kwargs={"where": None},
        )
        nodes = retriever.retrieve(retrieval_query)
        if not nodes:
            raise ValueError("No relevant material chunks found. Index material first.")
        context_chunks = []
        for i, node in enumerate(nodes, start=1):
            context_chunks.append(
                {
                    "chunk_id": f"C{i}",
                    "text": node.get_content(),
                    "score": float(getattr(node, "score", 0.0) or 0.0),
                }
            )
        system_prompt = (
            "You are an assessment generator. Use ONLY the provided context chunks. "
            "Do not use external knowledge. If context is insufficient, return fewer questions. "
            "Return strictly valid JSON."
        )
        user_prompt = {
            "task": "Generate assessment questions from context only.",
            "constraints": {
                "assessment_type": req.assessment_type.value,
                "title": req.title,
                "question_count": req.question_count,
                "question_types": [qt.value for qt in req.question_types],
                "difficulty": req.difficulty,
                "marks_per_question": req.marks_per_question,
                "faculty_format_instructions": req.faculty_format_instructions,
            },
            "output_schema": {
                "questions": [
                    {
                        "question_type": "MCQ|FILL_BLANKS|TRUE_FALSE|DESCRIPTIVE",
                        "question_text": "string",
                        "options": ["string"],
                        "correct_answer": "string",
                        "explanation": "string",
                        "marks": "int",
                        "source_chunk_ids": ["C1", "C2"],
                    }
                ]
            },
            "context_chunks": context_chunks,
        }
        response = self.llm_client.chat.completions.create(
            model=settings.groq_model,
            temperature=req.temperature,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_prompt)},
            ],
        )
        raw = response.choices[0].message.content or "{}"
        payload = json.loads(raw)
        questions_raw = payload.get("questions", [])
        questions = [
            GeneratedQuestion(**{**q, "marks": req.marks_per_question})
            for q in questions_raw
        ]
        return GenerateAssessmentResponse(
            course_id=req.course_id,
            material_id=req.material_id,
            assessment_type=req.assessment_type,
            title=req.title,
            questions=questions,
        )
