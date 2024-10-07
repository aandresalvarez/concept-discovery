import ell
import requests
from typing import List, Optional
from ell.types import Message
from pydantic import BaseModel, Field
from enum import Enum
from pydantic import HttpUrl  # Add this import


# Data models for structured outputs and tool parameters
class WebSearchToolParams(BaseModel):
    query: str = Field(..., description="The search query")
    language: str = Field(..., description="The language of the query")


class AthenaLookupParams(BaseModel):
    concept_name: str = Field(description="Concept to search for in Athena")
    synonyms: Optional[List[str]] = Field(
        default_factory=list, description="Synonyms for the concept")


class SearchResult(BaseModel):
    title: str
    snippet: str
    link: HttpUrl  # Replace ell.HttpUrl with pydantic's HttpUrl


class Concept(BaseModel):
    concept_id: int
    concept_name: str
    vocabulary_id: str
    concept_code: str
    concept_class_id: str


class SynonymResult(BaseModel):
    synonym: str = Field(description="A synonym for the given term")
    relevance: float = Field(
        description="The relevance score of the synonym, between 0 and 1")


class SynonymResponse(BaseModel):
    synonyms: List[SynonymResult] = Field(
        description="List of synonyms with their relevance scores")


class ConceptTableRow(BaseModel):
    concept_id: int = Field(
        ..., description="The unique identifier for the concept")
    name: str = Field(..., description="The name of the concept")
    domain: str = Field(..., description="The domain of the concept")
    vocabulary: str = Field(
        ..., description="The vocabulary the concept belongs to")
    standard_concept: str = Field(
        ..., description="Whether the concept is a standard concept")


class ConceptResponse(BaseModel):
    concepts: List[ConceptTableRow]


@ell.complex(model="gpt-4o-mini", response_format=ConceptResponse)
def concept_lookup(term: str, language: str) -> List[ell.Message]:
    """You are a medical database expert. For the given medical term in {language}, 
    provide a list of up to 5 relevant concepts with their Concept ID, Name, Domain, Vocabulary, and Standard Concept status.
    Use realistic-looking data for demonstration purposes."""
    return [
        ell.system(
            f"Provide concept information for the medical term '{term}' in {language}."
        ),
    ]


@ell.complex(model="gpt-4o-mini", response_format=SynonymResponse)
def generate_synonyms(term: str, language: str) -> List[ell.Message]:
    """
    Generate synonyms for a given term in the specified language.
    """
    return [
        ell.system(
            f"""You are a medical language expert. Generate up to 5 synonyms for the given medical term in {language}.
        Provide each synonym with a relevance score between 0 and 1, where 1 is highly relevant and 0 is less relevant."""
        ),
        ell.user(
            f"Generate synonyms for the medical term '{term}' in {language}.")
    ]


@ell.simple(model="gpt-4o-mini")
def disambiguate(term: str, language: str = "en") -> List[Message]:
    """
    Return a list of possible meanings of a medical term, formatted in Markdown.
    The results will be in the specified language, defaulting to English if not specified.
    """
    return [
        ell.system(
            f"""You are a helpful medical assistant. Explain a potentially ambiguous medical term to a user in {language}.
            Format your output as a list of markdown code blocks, each containing a possible interpretation of the term.
            Each interpretation should include the following:

            ```markdown
            ## Term: <The medical term>
            ## Definition: <Definition of the term in {language}>
            ## Category: <Category the term belongs to, e.g., Symptom, Diagnosis, Procedure, etc. in {language}>
            ```
            """),
        ell.user(
            f"Disambiguate the following medical term in {language}: {term}"),
    ]


# Tools
@ell.tool(exempt_from_tracking=True)  # Exempting web search from tracking
def web_search(params: WebSearchToolParams) -> List[SearchResult]:
    """Performs a web search and returns the results."""
    # Replace with actual web search logic (e.g., using SerpApi or similar)
    # This example returns mock results
    results = [
        SearchResult(
            title=f"Result {i+1} for {params.query}",
            snippet="Mock snippet",
            link="http://example.com",
        ) for i in range(3)
    ]
    return results


@ell.tool()
def athena_lookup(params: AthenaLookupParams) -> List[Concept]:
    """Looks up a concept in Athena and returns matching concepts."""
    # Replace with actual Athena API call (using concept name or synonyms)
    ATHENA_API_BASE = (
        "your athena api url"  # Replace with the actual base URL
    )
    url = f"{ATHENA_API_BASE}/concepts?name={params.concept_name}"

    if params.synonyms:
        url += f"&synonyms={','.join(params.synonyms)}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        concept_data = response.json()  # Assumes JSON response
        concepts = [Concept(**concept) for concept in concept_data]
        return concepts

    except requests.exceptions.RequestException as e:
        print(f"Error calling Athena API: {e}")
        return []  # Return an empty list on failure


# Define language support (can be extended)
class Language(str, Enum):
    ENGLISH = "en"
    SPANISH = "es"
    POLISH = "pl"


# Main LMP
@ell.complex(model="gpt-4o-mini", tools=[athena_lookup])
def find_omop_concept(
    chosen_term: str,
    language: Language = Language.ENGLISH,
    synonyms: Optional[List[str]] = None,
) -> List[Concept]:
    """
    Finds the OMOP standard concept ID for a given medical term.
    """
    concepts = athena_lookup(
        AthenaLookupParams(concept_name=chosen_term, synonyms=synonyms))
    return concepts


@ell.simple(model="gpt-4o-mini")
def testurl(prompt: str) -> List[str]:
    """Generates synonyms for a given term using an LLM."""
    return f"Say hello to {prompt}!"
