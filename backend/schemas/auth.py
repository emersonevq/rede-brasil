from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=6)

class CheckUsernameRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
