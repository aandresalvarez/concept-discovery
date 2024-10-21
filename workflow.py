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
def generate_synonyms(term: str, language: str, context: str) -> List[Message]:
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
    Only medical meanings are considered. If there is only one meaning or very similar meanings, return a single result.
    """
    return [
        ell.system(
            f"""You will be asked to explain a potentially ambiguous medical term in a specified language, either provided by the user or chosen by the assistant.

            Follow these steps:
            1. Identify the medical term from the user input.
            2. Provide only medical-related meanings or interpretations of the term in that language.
            3. If the term has multiple distinct medical meanings, provide each one clearly, ensuring that the definitions are not redundant.
            4. If the term has only one possible medical meaning, still return it within a JSON array.
            5. Do not include disambiguation options for non-medical uses of the term.

            Examples:
            Polish: "Zawał" can mean either myocardial infarction (heart attack) or cerebral infarction (stroke), depending on the affected organ.
            Spanish: "Constipado" can refer to both a cold (nasal congestion) or constipation, leading to confusion between respiratory and digestive symptoms.
            German: "Schlaganfall" is generally used for a stroke, but in older or colloquial usage, it can also imply a sudden fainting or seizure-like episode.
            Russian: "Инфаркт" (infarkt) is commonly used for a heart attack (myocardial infarction) but can also refer to any type of infarction (e.g., pulmonary infarction, brain infarction).
            Italian: "Colpo" in medical terms can mean colpo di calore (heatstroke) or colpo di frusta (whiplash). The word "colpo" generally means a blow or strike, which can be used in different contexts within medicine.
            French: "Crise" can refer to a seizure (crise d'épilepsie), an attack (crise cardiaque for a heart attack), or a crisis (such as a psychological crisis or anxiety attack).
            Portuguese: "Infarto" can mean both myocardial infarction (heart attack) or infarction in other organs (such as a pulmonary or cerebral infarction), depending on the context.
            Spanish: "Derrame" can mean a cerebral hemorrhage (brain bleed or stroke) or pleural effusion (fluid around the lungs), affecting different organs but sharing the concept of fluid leakage.
            German: "Schock" can refer to both cardiogenic shock (a severe condition due to heart failure) and psychological shock (an acute stress response).
            English/Spanish: The word "stroke" in English primarily refers to a cerebrovascular accident (CVA), while the Spanish word "golpe" (literal translation for stroke) can mean a blow or trauma, implying injury in various body parts depending on context.
            French: "Infarctus" can refer to a heart attack (myocardial infarction) or a broader infarction (tissue death due to lack of blood flow), applicable to different organs like the brain or lungs.
            Italian: "Crisi" can mean an epileptic seizure (crisi epilettica), a cardiac crisis (crisi cardiaca), or a psychological crisis, making it a multi-context medical term.
            Dutch: "Infarct" is a general term for tissue death due to lack of blood supply and can refer to heart, brain, or other organ infarctions.
            Russian: "Остановка" (ostanovka) can refer to the stopping of any organ’s function, like cardiac arrest or respiratory arrest, but also general cessation, such as halting a process.
            Spanish: "Paro" can mean cardiac arrest (paro cardíaco) or respiratory arrest (paro respiratorio); "paro" simply means stopping.
            Portuguese: "Crise" can refer to a seizure, an asthma attack (crise asmática), or a cardiac crisis, making it applicable in various contexts.
            Japanese: "ショック" (Shokku) can mean either cardiogenic shock or psychological shock, depending on the medical context.
            Chinese (Simplified): "中风" (Zhōngfēng) can refer to a cerebrovascular accident (stroke) or apoplexy, based on historical and contextual usage.
            Arabic: "أزمة" (Azmah) can denote either an asthma attack or a psychological crisis within medical discussions.

            Your output should be formatted as a JSON array of objects, with each object representing a unique medical meaning of the term.

            ```json
            [
              {{
                "term": "<The medical term>",
                "definition": "<Definition of the medical term in {language}>",
                "usage": "<How the medical term is used in {language}>",
                "context": "<Medical context or specialty where the term is commonly used in {language}>",
                "category": "<Category of the medical term, e.g., disease, condition, etc., in {language}>"
              }}
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
        - nativeName: The native name of the language

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


# # Example usage:
# result = get_language_info("Ruso")
# language_info = result.parsed
# print(
#     f"Name: {language_info.name}, Code: {language_info.code}, Native Name: {language_info.nativeName}"
# )
