import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "VidyAstra AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretkey_please_change_in_production_vidyastra"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./vidyastra.db"
    
    # AI Integration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")

    class Config:
        env_file = ".env"

settings = Settings()
