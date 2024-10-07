# athena_ohdsi_client/models.py

from typing import List, Optional
from pydantic import BaseModel


class Concept(BaseModel):
    id: int
    code: str
    name: str
    className: str
    standardConcept: Optional[str] = None
    invalidReason: Optional[str] = None
    domain: Optional[str] = None
    vocabulary: Optional[str] = None
    score: Optional[str] = None


class RelationshipDetail(BaseModel):
    targetConceptId: int
    targetConceptName: str
    targetVocabularyId: str
    relationshipId: str
    relationshipName: str


class RelationshipItem(BaseModel):
    relationshipName: str
    relationships: List[RelationshipDetail]


class ConceptRelationship(BaseModel):
    count: int
    items: List[RelationshipItem]


class MedicalConceptsResponse(BaseModel):
    size: int
    number: int
    numberOfElements: int
    empty: bool
    content: List[Concept]
