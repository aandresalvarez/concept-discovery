import os
from typing import Union, List
from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from workflow import testurl, disambiguate
import logging
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
    category: str


class SearchResponse(BaseModel):
    results: List[DisambiguationResult]


@app.get("/api/search", response_model=SearchResponse)
async def search(term: str = Query(..., min_length=1),
                 language: str = Query("en")):
    logger.info(
        f"Received search request for term: {term}, language: {language}")
    try:
        logger.debug("Calling disambiguate function")
        response = disambiguate(term)
        logger.debug(f"Disambiguate function returned: {response}")

        if not isinstance(response, str):
            logger.error(
                f"Unexpected response type from disambiguate function: {type(response)}"
            )
            raise ValueError(
                "Unexpected response type from disambiguate function")

        # Parse the markdown content
        results = []
        current_result = {}
        for line in response.split('\n'):
            logger.debug(f"Processing line: {line}")
            if line.startswith('## Term:'):
                if current_result:
                    logger.debug(f"Adding result: {current_result}")
                    results.append(DisambiguationResult(**current_result))
                    current_result = {}
                current_result['term'] = line.split(':', 1)[1].strip()
            elif line.startswith('## Definition:'):
                current_result['definition'] = line.split(':', 1)[1].strip()
            elif line.startswith('## Category:'):
                current_result['category'] = line.split(':', 1)[1].strip()

        if current_result:
            logger.debug(f"Adding final result: {current_result}")
            results.append(DisambiguationResult(**current_result))

        if not results:
            logger.warning(f"No results found for term: {term}")
            return SearchResponse(results=[])

        logger.info(f"Returning {len(results)} disambiguation results")
        return SearchResponse(results=results)
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
