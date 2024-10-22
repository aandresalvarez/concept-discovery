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


class LanguageInfo(BaseModel):
    name: str = Field(description="The English name of the language")
    code: str = Field(description="The ISO 639-1 code of the language")
    nativeName: str = Field(description="The native name of the language")


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
@ell.complex(model="gpt-4o-mini",
             temperature=0.7,
             response_format=SynonymResponse)
def generate_synonyms_old(term: str, language: str, context: str) -> List[Message]:
    """
    Generate contextually relevant and medically accurate synonyms for a given medical term in the specified language.
    Each synonym will include a relevance score from 0 to 1, where 1 represents the highest relevance.
    """
    return [
        ell.system(
            f"""You are a medical language expert tasked with generating synonyms for a medical term. 
            The synonyms should be specific to the medical context and language provided. Follow these instructions:

            1. Generate up to 5 synonyms for the term '{term}' based on the provided medical context '{context}' in the language '{language}'.
            2. Ensure all synonyms are appropriate for the specified medical field or condition, avoiding non-medical or overly general terms.
            3. If the term '{term}' itself is commonly used and relevant in this context, include it as one of the synonyms.
            4. Each synonym should include a relevance score between 0 and 1. A score of 1 means the synonym is highly relevant to the medical context, and 0 indicates low relevance.
            5. If there are limited appropriate synonyms due to the specificity of the term, provide fewer than 5 and ensure they are medically precise.
            6. Avoid overly broad or non-specialized terms that could create confusion in the context of '{context}'."""
        ),
        ell.user(
            f"Generate up to 5 medical synonyms for the term '{term}' in the context of '{context}' and the language '{language}', with relevance scores for each."
        )
    ]


# LMP for concept disambiguation
@ell.complex(model="gpt-4o-mini", temperature=0.7)
def disambiguate(term: str, language: str = "en") -> str:
    """
    Return a list of possible meanings of a medical term, formatted as a JSON structure.
    Each meaning includes definition, usage, and medical context.
    The results will be in the specified language, defaulting to English if not specified.
    Returns all valid medical interpretations of the exact term, regardless of number.
    """
    return [
        ell.system(
            f"""You will be asked to explain a potentially ambiguous medical term in a specified language, either provided by the user or chosen by the assistant.

            Follow these steps:
            1. Identify ALL distinct medical meanings of the exact term provided.
            2. Include every valid medical interpretation, whether there are 2, 3, or more meanings.
            3. Keep the term exactly the same across all interpretations.
            4. Do not break down composite terms into components.
            5. Do not create entries for related terms or components.
            6. Only include medical-related meanings of the exact term.

            Examples of proper disambiguation with multiple meanings:

            French "Crise":
            [
              {{
                "term": "Crise",
                "definition": "Episode d'activité cérébrale anormale (crise d'épilepsie)",
                "usage": "Utilisé pour décrire une manifestation soudaine de l'épilepsie",
                "context": "Neurologie, où l'on traite les troubles neurologiques",
                "category": "Episode aigu"
              }},
              {{
                "term": "Crise",
                "definition": "Episode aigu d'anxiété ou de panique (crise d'angoisse)",
                "usage": "Utilisé pour décrire un épisode intense d'anxiété",
                "context": "Psychiatrie, où l'on traite les troubles mentaux",
                "category": "Episode aigu"
              }},
              {{
                "term": "Crise",
                "definition": "Attaque cardiaque soudaine (crise cardiaque)",
                "usage": "Utilisé pour décrire un événement cardiovasculaire aigu",
                "context": "Cardiologie, où l'on traite les maladies du cœur",
                "category": "Episode aigu"
              }},
              {{
                "term": "Crise",
                "definition": "Episode aigu d'asthme (crise d'asthme)",
                "usage": "Utilisé pour décrire une difficulté respiratoire aiguë",
                "context": "Pneumologie, où l'on traite les maladies respiratoires",
                "category": "Episode aigu"
              }}
            ]

            Spanish "Ataque":
            [
              {{
                "term": "Ataque",
                "definition": "Episodio agudo de origen cardíaco (ataque cardíaco)",
                "usage": "Se utiliza para describir un infarto de miocardio",
                "context": "Cardiología, donde se tratan enfermedades del corazón",
                "category": "Emergencia médica"
              }},
              {{
                "term": "Ataque",
                "definition": "Episodio convulsivo (ataque epiléptico)",
                "usage": "Se utiliza para describir una crisis epiléptica",
                "context": "Neurología, donde se tratan trastornos neurológicos",
                "category": "Episodio agudo"
              }},
              {{
                "term": "Ataque",
                "definition": "Episodio agudo de ansiedad (ataque de pánico)",
                "usage": "Se utiliza para describir una crisis de ansiedad severa",
                "context": "Psiquiatría, donde se tratan trastornos mentales",
                "category": "Episodio agudo"
              }}
            ]

            German "Schock":
            [
              {{
                "term": "Schock",
                "definition": "Akutes Kreislaufversagen (kardiogener Schock)",
                "usage": "Beschreibt einen lebensbedrohlichen Zustand mit Herzversagen",
                "context": "Kardiologie und Notfallmedizin",
                "category": "Akutzustand"
              }},
              {{
                "term": "Schock",
                "definition": "Psychische Reaktion auf ein Trauma (psychischer Schock)",
                "usage": "Beschreibt eine akute Stressreaktion",
                "context": "Psychiatrie und Psychologie",
                "category": "Psychischer Zustand"
              }},
              {{
                "term": "Schock",
                "definition": "Allergische Reaktion (anaphylaktischer Schock)",
                "usage": "Beschreibt eine schwere allergische Reaktion",
                "context": "Allergologie und Notfallmedizin",
                "category": "Akutzustand"
              }}
            ]

            Your output should be formatted as a JSON array of objects, with each object representing a distinct meaning of the exact same term:

            ```json
            [
              {{
                "term": "<The exact medical term>",
                "definition": "<First meaning of the term in {language}>",
                "usage": "<How the term is used in this meaning in {language}>",
                "context": "<Medical context for this meaning in {language}>",
                "category": "<Category for this meaning in {language}>"
              }},
              {{
                "term": "<The exact same medical term>",
                "definition": "<Second meaning of the term in {language}>",
                "usage": "<How the term is used in this meaning in {language}>",
                "context": "<Medical context for this meaning in {language}>",
                "category": "<Category for this meaning in {language}>"
              }},
              {{
                "term": "<The exact same medical term>",
                "definition": "<Third meaning of the term in {language}>",
                "usage": "<How the term is used in this meaning in {language}>",
                "context": "<Medical context for this meaning in {language}>",
                "category": "<Category for this meaning in {language}>"
              }}
              ... additional meanings as needed ...
            ]
            ```
            """),
        ell.user(
            f"Disambiguate the following medical term in {language}: {term}")
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
def translate(term: str, context: str, language: str = "en") -> str:
    """
    Translates the given medical term or synonym into the specified language, taking the provided medical context into account.
    The translation will ensure that the term is contextually accurate based on the medical meaning from the disambiguation step.
    Only respond with the translated term and nothing else.
    """
    return [
        ell.system(
            f"""You are a medical language expert. Your task is to translate medical terms while considering the specific medical context provided.

            1. Translate the term '{term}' into the language '{language}'.
            2. The translation must be contextually accurate according to the medical context: '{context}'.
            3. Only provide the translated term, ensuring that it aligns with the medical usage in the specified context.
            4. Do not provide any additional explanations or responses beyond the translated term.

            Example format:
            "<translated term>"
            """),
        ell.user(
            f"Translate the term '{term}' considering the medical context '{context}' into the language '{language}'."
        )
    ]


@ell.complex(
    model="gpt-4o-mini",
    response_format=ConceptResponse)  # Use complex for structured output
def concept_lookup(term: str,
                   context: str,
                   language: str = "en") -> List[Message]:
    """
    Looks up a medical term in the OMOP database and returns structured concept information.
    """
    string_to_search = translate(term, context, "english")
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


@ell.complex(model="gpt-4o-mini",
             temperature=0.0,
             response_format=LanguageInfo)
def get_language_info(input_text: str) -> List[Message]:
    return [
        ell.system("""
        You are a language information expert. Given an input text that could be a language name,
        ISO code, or native name of a language, provide the language's information.

        The input could be in any of these formats:
        - English name (e.g., "Arabic")
        - Native name (e.g., "العربية")
        - ISO 639-1 code (e.g., "ar")
        - Or any other recognizable form of the language name

        Return the information as a LanguageInfo object with the following fields:
        - name: The English name of the language
        - code: The ISO 639-1 code of the language
        - nativeName: The native name of the language, Capitalized the first letter

        Example of the resulting structure:
        {
            "name": "Arabic",
            "code": "ar",
            "nativeName": "العربية"
        }

        Ensure all fields are filled with accurate information.
        If you're unsure about any information, provide your best estimate.
        If the input is not recognizable as a language, return information for English as a default.
        """),
        ell.user(f"Provide language information for the input: {input_text}")
    ]


@ell.complex(model="gpt-4o-mini",
     temperature=0.7,
     response_format=SynonymResponse)
def generate_synonyms(term: str, language: str, context: str) -> List[Message]:
    """
    Generate contextually relevant and medically accurate synonyms for a given medical term in the specified language.
    The original term is always included as one of the synonyms with relevance 1.0.
    Only includes closely related medical synonyms specific to the provided context.
    Each synonym includes a relevance score from 0 to 1, where 1 represents the highest relevance.
    """
    return [
    ell.system(
        f"""You are a medical language expert tasked with generating synonyms for a medical term.
        Follow these strict guidelines:
    
        1. ALWAYS include the exact term '{term}' as the first synonym with a relevance score of 1.0.
    
        2. Generate ONLY synonyms that are:
           - Strictly medical in nature
           - Specific to the provided context '{context}'
           - Commonly used in the specified language '{language}'
           - Very closely related in meaning
    
        3. Limit additional synonyms to a maximum of 4 (plus the original term).
    
        4. Score relevance based on these criteria:
           - 1.0: Exact term or perfect synonyms (identical meaning)
           - 0.9-0.99: Very close synonyms (nearly identical meaning)
           - 0.8-0.89: Close synonyms with slight variation in usage
           - Below 0.8: Do not include as not close enough
    
        5. Do NOT include:
           - Terms with different medical meanings
           - General language synonyms not specific to medical usage
           - Related terms that aren't true synonyms
           - Terms from other medical contexts
    
        Examples:
    
        Input: term="acute respiratory infection", language="en", context="respiratory disease"
        {{
          "synonyms": [
            {{"synonym": "acute respiratory infection", "relevance": 1.0}},
            {{"synonym": "acute respiratory tract infection", "relevance": 0.95}},
            {{"synonym": "acute respiratory illness", "relevance": 0.90}}
          ]
        }}
    
        Input: term="hipertensión", language="es", context="cardiología"
        {{
          "synonyms": [
            {{"synonym": "hipertensión", "relevance": 1.0}},
            {{"synonym": "hipertensión arterial", "relevance": 0.95}},
            {{"synonym": "presión arterial alta", "relevance": 0.90}},
            {{"synonym": "HTA", "relevance": 0.85}}
          ]
        }}
    
        Input: term="migräne", language="de", context="neurologie"
        {{
          "synonyms": [
            {{"synonym": "migräne", "relevance": 1.0}},
            {{"synonym": "migränekopfschmerz", "relevance": 0.95}},
            {{"synonym": "hemikranie", "relevance": 0.85}}
          ]
        }}
    
        Consider only the provided term, language, and context when generating synonyms. Ensure all synonyms are valid medical terms that preserve the exact medical meaning specified in the context."""
    ),
    ell.user(
        f"Generate medical synonyms for the term '{term}' in the context of '{context}' and the language '{language}', ensuring to include the exact term and only closely related medical synonyms specific to this context."
    )
    ]