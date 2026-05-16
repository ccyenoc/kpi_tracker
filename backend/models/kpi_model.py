from pydantic import BaseModel
from typing import Optional

class KPICreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    target: Optional[float] = None
    unit: Optional[str] = None
    frequency: Optional[str] = None
    assignedTo: Optional[str] = None
    deadline: Optional[str] = None


class KPIUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target: Optional[float] = None
    unit: Optional[str] = None
    frequency: Optional[str] = None
    assignedTo: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None