from pydantic import BaseModel
from typing import Optional, List


class KPIAssignment(BaseModel):
    userId: str
    current: float = 0
    target: float


class KPICreate(BaseModel):
    title: str
    description: Optional[str] = None

    categoryId: Optional[str] = None
    categoryName: Optional[str] = None

    target: Optional[float] = None
    unit: Optional[str] = None
    frequency: Optional[str] = None

    deadline: Optional[str] = None

    assignedUserIds: List[str] = []
    kpiAssignments: List[KPIAssignment] = []

class KPIUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

    categoryId: Optional[str] = None
    categoryName: Optional[str] = None

    target: Optional[float] = None
    unit: Optional[str] = None
    frequency: Optional[str] = None

    deadline: Optional[str] = None
    status: Optional[str] = None

    assignedUserIds: Optional[List[str]] = None
    kpiAssignments: Optional[List[KPIAssignment]] = None

class KPISubmission(BaseModel):
    kpiId: str
    current: float
    notes: Optional[str] = ""








