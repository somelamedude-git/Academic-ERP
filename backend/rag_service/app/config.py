from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    rag_service_host: str = "0.0.0.0"
    rag_service_port: int = 8010
    rag_service_api_key: str = "change_me_internal_key"
    groq_api_key: str
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_model: str = "llama-3.3-70b-versatile"
    chroma_persist_dir: str = "./chroma_data"
    embed_model: str = "BAAI/bge-small-en-v1.5"
    default_top_k: int = 6


settings = Settings()
