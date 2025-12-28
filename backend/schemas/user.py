from pydantic import BaseModel, EmailStr
from typing import Optional
from models.user import UserRole

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.ATTENDEE

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    interests: Optional[list[str]] = []

# Properties to receive via API on login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Properties to return via API
class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    old_password: str
    new_password: str
