# athena_ohdsi_client/api_client.py

import os
import logging
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Optional
from pydantic import ValidationError
from .models import MedicalConceptsResponse, ConceptRelationship

# Configure logging with different levels and handlers
logger = logging.getLogger(__name__)
logger.setLevel(
    logging.DEBUG)  # Set to DEBUG for detailed logs; change as needed

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


class AthenaOHDSIAPI:
    """
    A robust client for interacting with the Athena OHDSI Concepts API using Pydantic for data validation.
    """

    def __init__(self,
                 base_url: str = "https://athena.ohdsi.org/api/v1",
                 api_key: Optional[str] = None,
                 retries: int = 3,
                 backoff_factor: float = 0.3,
                 status_forcelist: list = [500, 502, 503, 504],
                 session_timeout: Optional[int] = None):  # noqa: ARG002
        """
        Initializes the API client with enhanced configurations.

        :param base_url: The base URL for the Athena OHDSI API.
        :param api_key: Optional API key for authentication. If not provided, no Authorization header is set.
        :param retries: Total number of retry attempts for transient errors.
        :param backoff_factor: A backoff factor to apply between attempts after the second try.
        :param status_forcelist: A set of HTTP status codes that we should force a retry on.
        :param session_timeout: Timeout for API requests in seconds.
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.mount(
            'https://',
            HTTPAdapter(
                max_retries=Retry(total=3,
                                  backoff_factor=0.3,
                                  status_forcelist=[500, 502, 503, 504])))

        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'AthenaOHDSIAPIClient/1.0'
        }

        if api_key:
            headers['Authorization'] = f"Bearer {api_key}"
            logger.info("Authorization header set with provided API key.")
        else:
            logger.info(
                "No API key provided; Authorization header will not be set.")

        self.session.headers.update(headers)

        # Setup retry strategy
        retry_strategy = Retry(total=retries,
                               backoff_factor=backoff_factor,
                               status_forcelist=status_forcelist,
                               allowed_methods=["HEAD", "GET", "OPTIONS"])
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

        logger.debug(
            f"AthenaOHDSIAPI initialized with base_url: {self.base_url}")

    def get_medical_concepts(
            self,
            query: str,
            page_size: Optional[int] = None,
            page: Optional[int] = None,
            standard_concept: Optional[str] = None,
            domain: Optional[str] = None,
            vocabulary: Optional[str] = None) -> MedicalConceptsResponse:
        """
        Retrieves medical concepts based on various criteria.

        :param query: Search term for concepts (required).
        :param page_size: Number of results per page (optional).
        :param page: Page number (optional).
        :param standard_concept: Filter for standard concepts (optional).
        :param domain: Domain of the concepts (optional).
        :param vocabulary: Vocabulary source of the concepts (optional).
        :return: A MedicalConceptsResponse object containing the response data.
        :raises: requests.HTTPError for HTTP-related errors.
                 ValueError for data validation errors.
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

        logger.info(f"Fetching medical concepts with params: {params}")
        try:
            response = self.session.get(endpoint, params=params)
            response.raise_for_status()
            data = response.json()
            logger.debug(f"Medical Concepts Response JSON: {data}")
            return MedicalConceptsResponse.parse_obj(data)
        except requests.exceptions.Timeout:
            logger.error("Request timed out.")
            raise
        except requests.exceptions.ConnectionError:
            logger.error("Connection error occurred.")
            raise
        except requests.exceptions.HTTPError as http_err:
            logger.error(
                f"HTTP error occurred: {http_err} - Response: {response.text}")
            raise
        except ValidationError as ve:
            logger.error(f"Data validation error: {ve}")
            raise ValueError(f"Invalid response structure: {ve}")
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
            raise

    def get_concept_relationships(self,
                                  concept_id: int) -> ConceptRelationship:
        """
        Retrieves relationships associated with a specific concept ID.

        :param concept_id: Unique identifier of the concept (required).
        :return: A ConceptRelationship object containing the relationship details.
        :raises: requests.HTTPError for HTTP-related errors.
                 ValueError for data validation errors.
        """
        endpoint = f"{self.base_url}/concepts/{concept_id}/relationships"
        logger.info(f"Fetching relationships for Concept ID: {concept_id}")
        try:
            response = self.session.get(endpoint)
            response.raise_for_status()
            data = response.json()
            logger.debug(f"Concept Relationships Response JSON: {data}")
            return ConceptRelationship.parse_obj(data)
        except requests.exceptions.Timeout:
            logger.error("Request timed out.")
            raise
        except requests.exceptions.ConnectionError:
            logger.error("Connection error occurred.")
            raise
        except requests.exceptions.HTTPError as http_err:
            logger.error(
                f"HTTP error occurred: {http_err} - Response: {response.text}")
            raise
        except ValidationError as ve:
            logger.error(f"Data validation error: {ve}")
            raise ValueError(f"Invalid response structure: {ve}")
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
            raise

    def close(self):
        """
        Closes the underlying HTTP session.
        """
        logger.info("Closing the HTTP session.")
        self.session.close()

    def __enter__(self):
        """
        Enables usage of the class as a context manager.
        """
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        """
        Ensures the session is closed when exiting the context.
        """
        self.close()
