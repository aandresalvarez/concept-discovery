# main.py
from decimal import Context
import os
from typing import Union, List
from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from workflow import disambiguate, generate_synonyms, concept_lookup
import logging, json
import traceback

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DisambiguationResult(BaseModel):
    term: str
    definition: str
    usage: str
    context: str
    category: str


class SearchResponse(BaseModel):
    results: List[DisambiguationResult]


class SynonymResult(BaseModel):
    synonym: str = Field(description="A synonym for the given term")
    relevance: float = Field(
        description="The relevance score of the synonym, between 0 and 1")


class SynonymResponse(BaseModel):
    synonyms: List[SynonymResult] = Field(
        description="List of synonyms with their relevance scores")


class ConceptTableRow(BaseModel):
    concept_id: int
    code: str
    name: str
    class_name: str
    standard_concept: str
    invalid_reason: Union[str, None]
    domain: str
    vocabulary: str
    score: Union[float, None]


class ConceptTableResponse(BaseModel):
    concepts: List[ConceptTableRow]


class CreateLanguageRequest(BaseModel):
    name: str
    code: str
    native_name: str


class CreateLanguageResponse(BaseModel):
    success: bool
    message: str


@app.post("/api/create_language", response_model=CreateLanguageResponse)
async def create_language(request: CreateLanguageRequest):
    try:
        # Here you would typically interact with your database or language service
        # to create the new language. For this example, we'll just log the attempt.
        logger.info(
            f"Attempting to create new language: {request.name} ({request.code})"
        )

        # Simulate language creation
        # In a real application, you'd add the language to your database or language service
        success = True
        message = f"Successfully created language: {request.name} ({request.code})"

        # Log the successful creation
        logger.info(message)

        return CreateLanguageResponse(success=success, message=message)
    except Exception as e:
        logger.error(f"Failed to create language: {str(e)}")
        raise HTTPException(status_code=500,
                            detail=f"Failed to create language: {str(e)}")


@app.get("/api/concept_lookup")
async def get_concept_table(term: str, context: str, language: str):
    try:
        response = concept_lookup(term, context, language)
        concepts = response.parsed.concepts
        return {"concepts": [concept.model_dump() for concept in concepts]}
    except Exception as e:
        logger.error(f"An error occurred during concept lookup: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/synonyms", response_model=SynonymResponse)
async def get_synonyms(term: str = Query(..., min_length=1),
                       language: str = Query("en"),
                       context: str = Query(...)):
    try:
        response = generate_synonyms(term, language, context)
        synonym_response = response.parsed
        return synonym_response
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"An error occurred: {str(e)}")


@app.get("/api/search", response_model=SearchResponse)
async def search(term: str = Query(..., min_length=1),
                 language: str = Query("en")):
    logger.info(
        f"Received search request for term: {term}, language: {language}")
    try:
        logger.debug("Calling disambiguate function")
        response = disambiguate(term, language)

        logger.debug(f"Disambiguate function returned: {response}")

        # Since disambiguate returns a list of Messages
        # and the last message should contain the JSON response
        response_message = response.text
        response_message = response_message.strip().replace('```json',
                                                            '').replace(
                                                                '```', '')
        # Attempt to parse the response, handle potential errors
        try:
            # Access the text content of the response message
            results = json.loads(response_message)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Raw response: {response_message}")
            raise HTTPException(status_code=500,
                                detail="Failed to parse LLM response")

        # Validate and convert to DisambiguationResult objects
        disambiguation_results = []
        for result in results:
            try:
                disambiguation_results.append(DisambiguationResult(**result))
            except Exception as e:
                logger.warning(
                    f"Skipping invalid result: {result}, Error: {e}")

        logger.info(
            f"Returning {len(disambiguation_results)} disambiguation results")
        return SearchResponse(results=disambiguation_results)
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500,
                            detail=f"An error occurred: {str(e)}")


@app.get("/api")
def read_root():
    return {"Hello": "World"}


# Serve React frontend only if the dist directory exists
if os.path.exists("frontend/dist"):
    app.mount("/",
              StaticFiles(directory="frontend/dist", html=True),
              name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
