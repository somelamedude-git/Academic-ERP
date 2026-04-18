from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


class QuestionType(str, Enum):
    MCQ = "MCQ"
    FILL_BLANKS = "FILL_BLANKS"
    TRUE_FALSE = "TRUE_FALSE"
    DESCRIPTIVE = "DESCRIPTIVE"


class AssessmentType(str, Enum):
    QUIZ = "QUIZ"
    EXAM = "EXAM"


class IndexMaterialRequest(BaseModel):
    course_id: str
    material_id: str
    title: str = Field(min_length=2, max_length=200)
    material_url: Optional[str] = None
    local_file_path: Optional[str] = None

    @model_validator(mode="after")
    def validate_source(self):
        if not self.material_url and not self.local_file_path:
            raise ValueError("Either material_url or local_file_path is required")
        return self


class IndexMaterialResponse(BaseModel):
    success: bool = True
    course_id: str
    material_id: str
    title: str
    chunks_indexed: int


class GenerateAssessmentRequest(BaseModel):
    course_id: str
    material_id: str
    assessment_type: AssessmentType
    title: str = Field(min_length=2, max_length=200)
    question_count: int = Field(ge=1, le=100)
    question_types: List[QuestionType] = Field(min_length=1)
    faculty_format_instructions: str = Field(
        default="",
        description="Any custom pattern/Instructions from faculty",
    )
    topic_hint: str = ""
    difficulty: str = "medium"
    marks_per_question: int = Field(default=1, ge=1, le=50)
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)
    top_k: Optional[int] = Field(default=None, ge=1, le=20)


class GeneratedQuestion(BaseModel):
    question_type: QuestionType
    question_text: str
    options: List[str] = Field(default_factory=list)
    correct_answer: str
    explanation: str = ""
    marks: int
    source_chunk_ids: List[str] = Field(default_factory=list)


class GenerateAssessmentResponse(BaseModel):
    success: bool = True
    course_id: str
    material_id: str
    assessment_type: AssessmentType
    title: str
    questions: List[GeneratedQuestion]
