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


@ell.simple(model="gpt-4o-mini")
def disambiguate(term: str) -> List[Message]:
    """
    Return a list of possible meanings of a medical term, formatted in Markdown.
    """
    return [
        ell.system(
            """You are a helpful medical assistant. Explain a potentially ambiguous medical term to a user.
            Format your output as a list of markdown code blocks, each containing a possible interpretation of the term.
            Each interpretation should include the following:

            ```markdown
            ## Term: <The medical term>
            ## Definition: <Definition of the term>
            ## Category: <Category the term belongs to, e.g., Symptom, Diagnosis, Procedure, etc.>
            ```
            """),
        ell.user(f"Disambiguate the following medical term: {term}"),
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
def generate_synonyms(prompt: str) -> List[str]:
    """Generates synonyms for a given term using an LLM."""
    return prompt


@ell.simple(model="gpt-4o-mini")
def testurl(prompt: str) -> List[str]:
    """Generates synonyms for a given term using an LLM."""
    return f"Say hello to {prompt}!"
