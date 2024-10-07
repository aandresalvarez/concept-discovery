# example.py

from athena_ohdsi_client import AthenaOHDSIAPI
import requests


def main():
    # Initialize the API client without passing the API key
    # This ensures no Authorization header is sent
    with AthenaOHDSIAPI() as api_client:
        try:
            # Example 1: Retrieve medical concepts with a search query
            concepts_response = api_client.get_medical_concepts(
                query="diabetes",
                page_size=10,
                page=1,
                standard_concept="Standard",
                domain="Condition",
                vocabulary="SNOMED")
            print("Medical Concepts Response:")
            for concept in concepts_response.content:
                print(f"- {concept.id}: {concept.name} ({concept.vocabulary})")

            # Example 2: Retrieve relationships for a specific concept ID
            concept_id = 4220821  # Replace with a valid concept ID from your successful curl response
            relationships_response = api_client.get_concept_relationships(
                concept_id)
            print(f"\nRelationships for Concept ID {concept_id}:")
            for item in relationships_response.items:
                print(f"Relationship Name: {item.relationshipName}")
                for relationship in item.relationships:
                    print(
                        f"  - {relationship.relationshipName} -> {relationship.targetConceptName} ({relationship.targetVocabularyId})"
                    )

        except requests.HTTPError as http_err:
            # Detailed error information is already printed in the client
            print(f"HTTP error occurred: {http_err}")  # Handle HTTP errors
        except ValueError as val_err:
            print(f"Data validation error: {val_err}"
                  )  # Handle validation errors
        except Exception as err:
            print(f"An unexpected error occurred: {err}"
                  )  # Handle other possible errors


if __name__ == "__main__":
    main()
