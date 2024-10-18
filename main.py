# main.py
from typing import Union, List, Dict, Tuple
from datetime import datetime
from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from enum import Enum
import logging
import os
import json
import traceback

# Import necessary functions from your workflow module
from workflow import disambiguate, generate_synonyms, concept_lookup

# Import the SQLAlchemyChartData class
from SQLAlchemyChartData import SQLAlchemyChartData

# Initialize logging
logging.basicConfig(
    level=logging.INFO,  # Adjust the logging level as needed
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("app.log"),
              logging.StreamHandler()])
logger = logging.getLogger(__name__)

# Initialize SQLAlchemyChartData
chart_data = SQLAlchemyChartData()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define Pydantic models for requests and responses


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


# Define an enumeration for metric types
class MetricType(str, Enum):
    language_distribution = "language_distribution"
    total_searches = "total_searches"
    search_trend = "search_trend"
    common_search_terms = "common_search_terms"
    concept_lookup_percentage = "concept_lookup_percentage"
    most_viewed_concepts = "most_viewed_concepts"


# Define the response model for metrics data
class MetricsDataResponse(BaseModel):
    language_distribution: Dict[str, int] = None
    total_searches: int = None
    search_trend: List[Tuple[str, int]] = None  # Dates as strings
    common_search_terms: Dict[str, int] = None
    concept_lookup_percentage: float = None
    most_viewed_concepts: Dict[str, int] = None


# API Endpoints


@app.post("/api/create_language", response_model=CreateLanguageResponse)
async def create_language(request: CreateLanguageRequest):
    """
    Endpoint to create a new language.
    """
    try:
        logger.info(
            f"Attempting to create new language: {request.name} ({request.code})"
        )
        # Simulate language creation logic
        success = True
        message = f"Successfully created language: {request.name} ({request.code})"
        logger.info(message)
        return CreateLanguageResponse(success=success, message=message)
    except Exception as e:
        logger.error(f"Failed to create language: {e}")
        raise HTTPException(status_code=500,
                            detail=f"Failed to create language: {e}")


@app.get("/api/concept_lookup")
async def get_concept_table(term: str, context: str, language: str):
    """
    Endpoint to perform concept lookup.
    """
    try:
        response = concept_lookup(term, context, language)
        concepts = response.parsed.concepts

        # Record the concept lookup in the metrics
        chart_data.add_search(language=language,
                              term=term,
                              led_to_concept_lookup=True)
        for concept in concepts:
            chart_data.add_viewed_concept(concept=concept.name)

        return {"concepts": [concept.dict() for concept in concepts]}
    except Exception as e:
        logger.error(f"An error occurred during concept lookup: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/synonyms", response_model=SynonymResponse)
async def get_synonyms(term: str = Query(..., min_length=1),
                       language: str = Query("en"),
                       context: str = Query(...)):
    """
    Endpoint to get synonyms for a given term.
    """
    try:
        response = generate_synonyms(term, language, context)
        synonym_response = response.parsed

        # Record the search in the metrics
        chart_data.add_search(language=language,
                              term=term,
                              led_to_concept_lookup=False)

        return synonym_response
    except Exception as e:
        logger.error(f"An error occurred during synonym generation: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@app.get("/api/search", response_model=SearchResponse)
async def search(term: str = Query(..., min_length=1),
                 language: str = Query("en")):
    """
    Endpoint to perform a search and disambiguation.
    """
    logger.info(
        f"Received search request for term: {term}, language: {language}")
    try:
        logger.debug("Calling disambiguate function")
        response = disambiguate(term, language)

        logger.debug(f"Disambiguate function returned: {response}")

        # Extract and parse the response
        response_message = response.text.strip().replace('```json',
                                                         '').replace(
                                                             '```', '')
        try:
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

        # Record the search in the metrics
        chart_data.add_search(language=language,
                              term=term,
                              led_to_concept_lookup=False)

        logger.info(
            f"Returning {len(disambiguation_results)} disambiguation results")
        return SearchResponse(results=disambiguation_results)
    except Exception as e:
        logger.error(f"An error occurred during search: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


@app.get("/api")
def read_root():
    """
    Root endpoint for health check.
    """
    return {"Hello": "World"}


# Metrics Endpoints


@app.get("/api/metrics", response_model=MetricsDataResponse)
async def get_all_metrics():
    """
     Endpoint to retrieve all metrics data.
     """
    try:
        language_distribution = chart_data.get_language_distribution()
        total_searches = chart_data.get_total_searches()
        search_trend = chart_data.get_search_trend()
        # Use date_ directly if it's already a string
        # Remove the .strftime() call
        search_trend = [(date_, count) for date_, count in search_trend]
        common_search_terms = chart_data.get_common_search_terms()
        concept_lookup_percentage = chart_data.get_concept_lookup_percentage()
        most_viewed_concepts = chart_data.get_most_viewed_concepts()

        logger.info("Retrieved all metrics data")

        return MetricsDataResponse(
            language_distribution=language_distribution,
            total_searches=total_searches,
            search_trend=search_trend,
            common_search_terms=common_search_terms,
            concept_lookup_percentage=concept_lookup_percentage,
            most_viewed_concepts=most_viewed_concepts)
    except Exception as e:
        logger.error(f"Failed to retrieve metrics data: {e}")
        raise HTTPException(status_code=500,
                            detail="Failed to retrieve metrics data")


@app.get("/api/metrics/{metric_type}")
async def get_metric(metric_type: MetricType):
    """
    Endpoint to retrieve specific metric data.
    """
    try:
        metric_functions = {
            MetricType.language_distribution:
            (chart_data.get_language_distribution, "language_distribution"),
            MetricType.total_searches: (chart_data.get_total_searches,
                                        "total_searches"),
            MetricType.search_trend: (chart_data.get_search_trend,
                                      "search_trend"),
            MetricType.common_search_terms:
            (chart_data.get_common_search_terms, "common_search_terms"),
            MetricType.concept_lookup_percentage:
            (chart_data.get_concept_lookup_percentage,
             "concept_lookup_percentage"),
            MetricType.most_viewed_concepts:
            (chart_data.get_most_viewed_concepts, "most_viewed_concepts"),
        }

        if metric_type not in metric_functions:
            logger.warning(f"Invalid metric type requested: {metric_type}")
            raise HTTPException(status_code=400, detail="Invalid metric type")

        function, key = metric_functions[metric_type]
        data = function()

        # Remove .strftime() call since date_ is already a string
        if metric_type == MetricType.search_trend:
            data = [(date_, count) for date_, count in data]

        result = {key: data}

        logger.info(f"Retrieved data for metric type: {metric_type}")
        return result
    except Exception as e:
        logger.error(f"Failed to retrieve data for metric {metric_type}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve data for metric {metric_type}")


# Serve React frontend only if the dist directory exists
if os.path.exists("frontend/dist"):
    app.mount("/",
              StaticFiles(directory="frontend/dist", html=True),
              name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
