# worflow.py
from traceback import print_exc
import ell
from typing import List, Optional
from ell.types import Message
from pydantic import BaseModel, Field
from enum import Enum
from athena_ohdsi_client import AthenaOHDSIAPI
import logging, json

# Configure logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)


# Data models for structured outputs
class Concept(BaseModel):
    concept_id: int
    concept_name: str
    vocabulary_id: str
    concept_code: str
    concept_class_id: str


# Data model for structured output of the table
class ConceptTable(BaseModel):
    headers: List[str] = [
        "ID", "Code", "Name", "Class", "Standard Concept", "Invalid Reason",
        "Domain", "Vocabulary"
    ]
    rows: List[List[str]]


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


class SynonymResult(BaseModel):
    synonym: str = Field(description="A synonym for the given term")
    relevance: float = Field(
        description="The relevance score of the synonym, between 0 and 1")


class SynonymResponse(BaseModel):
    synonyms: List[SynonymResult] = Field(
        description="List of synonyms with their relevance scores")


# LMP for generating synonyms
@ell.complex(model="gpt-4o-mini", response_format=SynonymResponse)
def generate_synonyms(term: str, language: str) -> List[Message]:
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


# LMP for concept disambiguation
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


# Main function for finding OMOP concept (not an LMP)
def find_omop_concept(
    chosen_term: str,
    language: str = "en",
    synonyms: Optional[List[str]] = None,
) -> str:  # Returns a JSON string
    """
    Finds the OMOP standard concept ID for a given medical term by directly calling Athena and returns a JSON string.
    """
    logger.debug(
        f"Starting find_omop_concept with term: {chosen_term}, synonyms: {synonyms}"
    )

    with AthenaOHDSIAPI() as api_client:
        try:
            # Construct the query string
            query = chosen_term
            if synonyms:
                query += " OR " + " OR ".join(synonyms)

            logger.debug(f"Constructed query: {query}")

            # Call the API
            logger.debug("Calling Athena API...")
            response = api_client.get_medical_concepts(
                query=query,
                page_size=20,  # Adjust as needed
            )

            if not response or not hasattr(response, "content"):
                logger.error("No valid content returned from Athena API.")
                return json.dumps({"error": "No concepts found."
                                   })  # Return JSON error message

            logger.debug("Athena API call successful.")

            # Convert the response to ConceptTableRow objects and then to a list of dictionaries
            concept_table_rows = [
                ConceptTableRow(
                    concept_id=concept.id,
                    name=concept.name,
                    domain=concept.domain,
                    vocabulary=concept.vocabulary,
                    standard_concept=concept.standardConcept,
                ).model_dump()  # Convert to dictionary
                for concept in response.content
            ]

            # Create the ConceptResponse dictionary
            concept_response = {"concepts": concept_table_rows}

            return json.dumps(concept_response, indent=2)  # Return JSON string

        except Exception as e:
            logger.exception(f"Error calling Athena API: {e}")
            return json.dumps({"error": str(e)})  # Return JSON error message


@ell.complex(model="gpt-4o-mini")
def format_concept_table(concepts_json: str):

    return [
        ell.system("""generate a well formated table with columns: id
code
name
className
standardConcept
invalidReason
domain
vocabulary"""),
        ell.user(f"createa table for : {concepts_json}.")
    ]


@ell.simple(model="gpt-4o-mini", temperature=0.0)
def translate(termed: str, language: str = "en"):
    """
    Translates a given term to the specified language. Only anser with the translated term and nothing else."""
    return f"{termed} trasnlated to {language} is : !"


@ell.complex(
    model="gpt-4o-mini",
    response_format=ConceptResponse)  # Use complex for structured output
def concept_lookup(term: str, language: str = "en") -> List[Message]:
    """
    Looks up a medical term in the OMOP database and returns structured concept information.
    """
    string_to_search = translate(term, "english")
    logger.debug(f"Received term: {term}, language: {language}")
    print(f"EL string tosearthc:::: {string_to_search}")
    concepts_json = find_omop_concept(string_to_search, language)

    try:
        # Attempt to parse the JSON. If it's an error, send it to the LMP to handle.
        json.loads(concepts_json)
        return [
            ell.system(f"""You are a medical information retrieval system. 
                You receive a JSON string containing medical concepts or an error message.
                If the input is valid concept data, translate the 'name', 'domain', 'vocabulary', and 'standardConcept' fields into {language} and then
                return the concepts as a structured list of ConceptTableRow objects. 
                If the input is an error message or no concepts are found, return an empty list, but still structure your response
                as a valid ConceptResponse.  Ensure all fields of ConceptResponse and ConceptTableRow are present, even if empty."""
                       ),
            ell.user(concepts_json)
        ]
    except json.JSONDecodeError:
        # If JSON parsing fails (likely an error message), handle it gracefully.
        return [
            ell.system(
                "You are a medical information retrieval system. You sometimes receive error messages instead of concept data. If you receive an error, return an empty list of concepts."
            ),
            ell.user(concepts_json)
        ]
