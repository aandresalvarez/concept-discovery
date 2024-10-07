# athena_ohdsi_client/api_client.py

import requests
from typing import Optional
from pydantic import ValidationError
from .models import MedicalConceptsResponse, ConceptRelationship
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AthenaOHDSIAPI:
    """
    A client for interacting with the Athena OHDSI Concepts API using Pydantic for data validation.
    """

    def __init__(self,
                 base_url: str = "https://athena.ohdsi.org/api/v1",
                 api_key: Optional[str] = None):
        """
        Initializes the API client with the specified base URL and optional API key.

        :param base_url: The base URL for the Athena OHDSI API.
        :param api_key: Optional API key for authentication. If not provided, no Authorization header is set.
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
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
        :raises: requests.HTTPError if the request fails.
                 ValueError if the response data is invalid.
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

        logger.info(f"GET {endpoint} with params {params}")
        response = self.session.get(endpoint, params=params)
        logger.info(f"Response Status Code: {response.status_code}")

        if response.status_code == 403:
            # Print detailed error information
            logger.error(f"403 Forbidden: {response.text}")
            response.raise_for_status()

        response.raise_for_status()
        try:
            data = response.json()
            logger.debug(f"Response JSON: {data}")
            return MedicalConceptsResponse.parse_obj(data)
        except ValidationError as ve:
            logger.error(f"Validation error: {ve}")
            raise ValueError(f"Invalid response structure: {ve}")

    def get_concept_relationships(self,
                                  concept_id: int) -> ConceptRelationship:
        """
        Retrieves relationships associated with a specific concept ID.

        :param concept_id: Unique identifier of the concept (required).
        :return: A ConceptRelationship object containing the relationship details.
        :raises: requests.HTTPError if the request fails.
                 ValueError if the response data is invalid.
        """
        endpoint = f"{self.base_url}/concepts/{concept_id}/relationships"
        logger.info(f"GET {endpoint}")
        response = self.session.get(endpoint)
        logger.info(f"Response Status Code: {response.status_code}")

        if response.status_code == 403:
            # Print detailed error information
            logger.error(f"403 Forbidden: {response.text}")
            response.raise_for_status()

        response.raise_for_status()
        try:
            data = response.json()
            logger.debug(f"Response JSON: {data}")
            return ConceptRelationship.parse_obj(data)
        except ValidationError as ve:
            logger.error(f"Validation error: {ve}")
            raise ValueError(f"Invalid response structure: {ve}")

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
