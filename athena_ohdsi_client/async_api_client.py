# athena_ohdsi_client/async_api_client.py

import asyncio
import logging
from typing import Optional

import aiohttp
from pydantic import ValidationError
from .models import MedicalConceptsResponse, ConceptRelationship

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(
    logging.DEBUG)  # Set to DEBUG for detailed logs; adjust as needed

# Create console handler with a higher log level
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)  # INFO level for general usage

# Create formatter and add it to the handlers
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)

# Add the handlers to the logger
if not logger.hasHandlers():
    logger.addHandler(ch)


class AsyncAthenaOHDSIAPI:
    """
    An asynchronous client for interacting with the Athena OHDSI Concepts API using Pydantic for data validation.
    """

    def __init__(self,
                 base_url: str = "https://athena.ohdsi.org/api/v1",
                 api_key: Optional[str] = None,
                 timeout: int = 10):
        """
        Initializes the asynchronous API client.

        :param base_url: The base URL for the Athena OHDSI API.
        :param api_key: Optional API key for authentication.
        :param timeout: Timeout for API requests in seconds.
        """
        self.base_url = base_url.rstrip('/')
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'AthenaOHDSIAsyncAPIClient/1.0'
        }
        if api_key:
            self.headers['Authorization'] = f"Bearer {api_key}"
            logger.info("Authorization header set with provided API key.")
        else:
            logger.info(
                "No API key provided; Authorization header will not be set.")

    async def get_medical_concepts(
            self,
            query: str,
            page_size: Optional[int] = None,
            page: Optional[int] = None,
            standard_concept: Optional[str] = None,
            domain: Optional[str] = None,
            vocabulary: Optional[str] = None) -> MedicalConceptsResponse:
        """
        Asynchronously retrieves medical concepts based on various criteria.

        :param query: Search term for concepts (required).
        :param page_size: Number of results per page (optional).
        :param page: Page number (optional).
        :param standard_concept: Filter for standard concepts (optional).
        :param domain: Domain of the concepts (optional).
        :param vocabulary: Vocabulary source of the concepts (optional).
        :return: A MedicalConceptsResponse object containing the response data.
        :raises: HTTP-related errors and ValidationError for data issues.
        """
        endpoint = f"{self.base_url}/concepts"
        params = {'query': query}

        if page_size is not None:
            params['pageSize'] = page_size
        if page is not None:
            params['page'] = page
        if standard_concept is not None:
            params['standardConcept'] = standard_concept
        if domain is not None:
            params['domain'] = domain
        if vocabulary is not None:
            params['vocabulary'] = vocabulary

        logger.info(
            f"Fetching medical concepts asynchronously with params: {params}")
        async with aiohttp.ClientSession(headers=self.headers,
                                         timeout=self.timeout) as session:
            try:
                async with session.get(endpoint, params=params) as response:
                    response.raise_for_status()
                    data = await response.json()
                    logger.debug(f"Medical Concepts Response JSON: {data}")
                    return MedicalConceptsResponse.parse_obj(data)
            except aiohttp.ClientResponseError as http_err:
                logger.error(
                    f"HTTP error occurred: {http_err} - Response: {await response.text()}"
                )
                raise
            except asyncio.TimeoutError:
                logger.error("Request timed out.")
                raise
            except aiohttp.ClientError as conn_err:
                logger.error(f"Connection error occurred: {conn_err}")
                raise
            except ValidationError as ve:
                logger.error(f"Data validation error: {ve}")
                raise ValueError(f"Invalid response structure: {ve}")
            except Exception as e:
                logger.error(f"An unexpected error occurred: {e}")
                raise

    async def get_concept_relationships(
            self, concept_id: int) -> ConceptRelationship:
        """
        Asynchronously retrieves relationships associated with a specific concept ID.

        :param concept_id: Unique identifier of the concept (required).
        :return: A ConceptRelationship object containing the relationship details.
        :raises: HTTP-related errors and ValidationError for data issues.
        """
        endpoint = f"{self.base_url}/concepts/{concept_id}/relationships"
        logger.info(
            f"Fetching relationships for Concept ID: {concept_id} asynchronously"
        )
        async with aiohttp.ClientSession(headers=self.headers,
                                         timeout=self.timeout) as session:
            try:
                async with session.get(endpoint) as response:
                    response.raise_for_status()
                    data = await response.json()
                    logger.debug(
                        f"Concept Relationships Response JSON: {data}")
                    return ConceptRelationship.parse_obj(data)
            except aiohttp.ClientResponseError as http_err:
                logger.error(
                    f"HTTP error occurred: {http_err} - Response: {await response.text()}"
                )
                raise
            except asyncio.TimeoutError:
                logger.error("Request timed out.")
                raise
            except aiohttp.ClientError as conn_err:
                logger.error(f"Connection error occurred: {conn_err}")
                raise
            except ValidationError as ve:
                logger.error(f"Data validation error: {ve}")
                raise ValueError(f"Invalid response structure: {ve}")
            except Exception as e:
                logger.error(f"An unexpected error occurred: {e}")
                raise

    async def close(self):
        """
        Placeholder for any cleanup if necessary in the future.
        Currently, aiohttp sessions are managed using context managers.
        """
        logger.info("AsyncAthenaOHDSIAPI client cleanup (if necessary).")
