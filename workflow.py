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
def generate_synonyms(term: str, language: str, context: str) -> List[Message]:
    """
    Generate synonyms for a given term in the specified language.
    """
    return [
        ell.system(
            f"""You are a medical language expert. Generate up to 5 synonyms for the given medical term given the provided context.
        Provide each synonym with a relevance score between 0 and 1, where 1 is highly relevant and 0 is less relevant. asuming the provided context"""
        ),
        ell.user(
            f"Generate synonyms for the medical term '{term}' in the context of '{context}' in {language}. "
        ),
        ell.user(
            f"if the term '{term}' with the context '{context}' is could valid in the provided language {language}, then add the term to the synonyms list."
        )
    ]


# LMP for concept disambiguation
@ell.complex(model="gpt-4o-mini")
def disambiguate(term: str, language: str = "en") -> str:
    """
    Return a list of possible meanings of a medical term, formatted as a JSON structure.
    Each meaning includes definition, usage, and medical context.
    The results will be in the specified language, defaulting to English if not specified.
    """
    return [
        ell.system(
            f"""Explain a potentially ambiguous medical term to a user in the specified language '{language}'. 
            For example, the Polish word "zawał" can mean either myocardial infarction or cerebral infarction,
            while the Spanish word "constipado" can refer to either a cold or constipation.
            Your output should be formatted as a JSON array of objects, where each object represents a possible meaning of the term.

- Do not include specific opinions.
- Limit explanations to possible definitions that can be understood in the language and cultural context.

# Steps

1. Identify the medical term to be explained.
2. Provide multiple possible meanings or interpretations of the term.
3. Ensure definitions are culturally and linguistically appropriate for the user's context.
4. Limit the explanations to factual, non-opinionated content.


            ```json
            {{
              "term": "<The medical term>",
              "definition": "<Definition of the medical term in {language}>",
              "usage": "<How the medical term is used. in {language}>",
              "context": "<Medical context or specialty where the term is commonly used in {language}>",
              "category": "<Category of the medical term. e.g. disease, condition, etc. in {language}>"
            }}
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
