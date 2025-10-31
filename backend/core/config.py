import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env from backend/.env
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

class Settings(BaseModel):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-change-me")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24)))

    @property
    def DB_PATH(self) -> Path:
        return Path(__file__).resolve().parent.parent / "app.db"

    @property
    def DATABASE_URL(self) -> str:
        env_db = os.getenv("DATABASE_URL")
        if env_db:
            return env_db
        return f"sqlite:///{self.DB_PATH}"

settings = Settings()
