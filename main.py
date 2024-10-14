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
    name: str
    domain: str
    vocabulary: str
    standard_concept: str


class ConceptTableResponse(BaseModel):
    concepts: List[ConceptTableRow]


@app.get("/api/concept_lookup")
async def get_concept_table(term: str, language: str):
    try:
        response = concept_lookup(term, language)
        concepts = response.parsed.concepts  # Access the parsed concepts
        return {
            "concepts": [concept.model_dump() for concept in concepts]
        }  # Use model_dump for dictionaries
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
        print(f"\n\n\n\n\n EL responseAAAA: {response.text} \n\n\n\n\n\n")
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


@app.get("/api/test")
def test1(name: str):
    return testurl(name)


@app.get("/api/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


# Serve React frontend only if the dist directory exists
if os.path.exists("frontend/dist"):
    app.mount("/",
              StaticFiles(directory="frontend/dist", html=True),
              name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
