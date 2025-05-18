from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings for the application."""

    amqp_url: str
    transcriptions_queue: str
    google_client_id: str
    google_client_secret: str

    # Google API scopes
    SCOPES: list[str] = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/tasks",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
