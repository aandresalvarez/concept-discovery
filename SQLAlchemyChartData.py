from typing import Dict, List, Tuple
from datetime import datetime, timedelta
from collections import Counter

from sqlalchemy import (create_engine, Column, Integer, String, DateTime,
                        Boolean, func)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

import plotly.graph_objects as go
from wordcloud import STOPWORDS
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.FileHandler("app.log"),
              logging.StreamHandler()])
logger = logging.getLogger(__name__)

# Create a base class for declarative class definitions
Base = declarative_base()


class Search(Base):
    """
    ORM model representing a user search action.
    """
    __tablename__ = 'searches'
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime,
                       default=datetime.utcnow)  # Record creation timestamp
    language = Column(String, nullable=False)  # Language used in the search
    term = Column(String, nullable=False)  # Search term entered by the user
    led_to_concept_lookup = Column(
        Boolean,
        default=False)  # Indicates if the search led to a concept lookup


class ViewedConcept(Base):
    """
    ORM model representing a viewed concept.
    """
    __tablename__ = 'viewed_concepts'
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime,
                       default=datetime.utcnow)  # Record creation timestamp
    concept = Column(String, nullable=False)  # Name of the concept viewed


class SQLAlchemyChartData:
    """
    Data access and analytics class using SQLAlchemy and Plotly.
    Provides methods to add data, retrieve analytics, and generate charts.
    """

    def __init__(self, db_url: str = "sqlite:///./medical_search_data.db"):
        """
        Initializes the database connection and session factory.
        """
        self.engine = create_engine(db_url)
        Base.metadata.create_all(
            self.engine)  # Create tables if they don't exist
        self.Session = sessionmaker(bind=self.engine)  # Session factory

    def add_search(self,
                   language: str,
                   term: str,
                   led_to_concept_lookup: bool = False) -> None:
        """
        Adds a new search record to the database.

        :param language: The language used in the search.
        :param term: The search term entered by the user.
        :param led_to_concept_lookup: Indicates if the search led to a concept lookup.
        """
        with self.Session() as session:
            try:
                new_search = Search(
                    language=language,
                    term=term,
                    led_to_concept_lookup=led_to_concept_lookup)
                session.add(new_search)
                session.commit()
                logger.info(
                    f"Added new search: '{term}' in language '{language}'")
            except SQLAlchemyError as e:
                session.rollback()
                logger.error(f"Failed to add new search: {e}")
                raise
            except Exception as e:
                session.rollback()
                logger.exception(
                    f"An unexpected error occurred while adding a search: {e}")
                raise

    def add_viewed_concept(self, concept: str) -> None:
        """
        Adds a new viewed concept record to the database.

        :param concept: The concept viewed by the user.
        """
        with self.Session() as session:
            try:
                new_view = ViewedConcept(concept=concept)
                session.add(new_view)
                session.commit()
                logger.info(f"Added viewed concept: '{concept}'")
            except SQLAlchemyError as e:
                session.rollback()
                logger.error(f"Failed to add viewed concept: {e}")
                raise
            except Exception as e:
                session.rollback()
                logger.exception(
                    f"An unexpected error occurred while adding a viewed concept: {e}"
                )
                raise

    def get_language_distribution(self) -> Dict[str, int]:
        """
        Retrieves the distribution of searches by language.

        :return: A dictionary with languages as keys and search counts as values.
        """
        with self.Session() as session:
            try:
                # Query the number of searches per language
                languages = session.query(Search.language, func.count(
                    Search.id)).group_by(Search.language).all()
                logger.info("Retrieved language distribution")
                return dict(languages)
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve language distribution: {e}")
                return {}
            except Exception as e:
                logger.exception(
                    f"An unexpected error occurred while retrieving language distribution: {e}"
                )
                return {}

    def get_total_searches(self) -> int:
        """
        Retrieves the total number of searches.

        :return: Total search count.
        """
        with self.Session() as session:
            try:
                total = session.query(func.count(Search.id)).scalar()
                total_searches = total or 0  # Return 0 if total is None
                logger.info(f"Total searches retrieved: {total_searches}")
                return total_searches
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve total searches: {e}")
                return 0
            except Exception as e:
                logger.exception(
                    f"An unexpected error occurred while retrieving total searches: {e}"
                )
                return 0

    def get_search_trend(self,
                         days: int = 30) -> List[Tuple[datetime.date, int]]:
        """
        Retrieves the number of searches per day for the past specified number of days.

        :param days: Number of days to include in the trend.
        :return: A list of tuples containing dates and search counts.
        """
        with self.Session() as session:
            try:
                start_date = datetime.utcnow() - timedelta(days=days)
                # Query the number of searches per day
                trend = session.query(func.date(
                    Search.timestamp), func.count(Search.id)).filter(
                        Search.timestamp >= start_date).group_by(
                            func.date(Search.timestamp)).order_by(
                                func.date(Search.timestamp)).all()
                logger.info(f"Retrieved search trend for the last {days} days")
                return trend
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve search trend: {e}")
                return []
            except Exception as e:
                logger.exception(
                    f"An unexpected error occurred while retrieving search trend: {e}"
                )
                return []

    def get_common_search_terms(self, limit: int = 50) -> Dict[str, int]:
        """
        Retrieves the most common search terms.

        :param limit: Maximum number of terms to return.
        :return: A dictionary with terms as keys and counts as values.
        """
        with self.Session() as session:
            try:
                # Retrieve all search terms
                terms = session.query(Search.term).all()
                # Flatten the list of terms
                all_terms = [term.lower() for (term, ) in terms]
                # Create a Counter object to count term frequencies
                term_counts = Counter(all_terms)
                # Remove stopwords and get the most common terms up to the limit
                filtered_terms = {
                    term: count
                    for term, count in term_counts.items()
                    if term not in STOPWORDS
                }
                common_terms = Counter(filtered_terms).most_common(limit)
                logger.info(f"Retrieved top {limit} common search terms")
                return dict(common_terms)
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve common search terms: {e}")
                return {}
            except Exception as e:
                logger.exception(
                    f"An unexpected error occurred while retrieving common search terms: {e}"
                )
                return {}

    def get_concept_lookup_percentage(self) -> float:
        """
        Calculates the percentage of searches that led to a concept lookup.

        :return: Percentage of searches leading to concept lookup.
        """
        total_searches = self.get_total_searches()
        if total_searches == 0:
            logger.warning(
                "Total searches is zero, cannot calculate percentage")
            return 0.0  # Avoid division by zero

        with self.Session() as session:
            try:
                # Count searches that led to a concept lookup
                concept_lookups = session.query(func.count(Search.id)).filter(
                    Search.led_to_concept_lookup.is_(True)).scalar()
                concept_lookups = concept_lookups or 0  # Handle None
                percentage = (concept_lookups / total_searches) * 100
                logger.info(
                    f"Calculated concept lookup percentage: {percentage:.2f}%")
                return percentage
            except SQLAlchemyError as e:
                logger.error(
                    f"Failed to calculate concept lookup percentage: {e}")
                return 0.0
            except Exception as e:
                logger.exception(
                    f"An unexpected error occurred while calculating concept lookup percentage: {e}"
                )
                return 0.0

    def get_most_viewed_concepts(self, limit: int = 10) -> Dict[str, int]:
        """
        Retrieves the most viewed concepts.

        :param limit: Maximum number of concepts to return.
        :return: A dictionary with concepts as keys and view counts as values.
        """
        with self.Session() as session:
            try:
                # Query the number of views per concept
                concepts = session.query(
                    ViewedConcept.concept,
                    func.count(ViewedConcept.id)).group_by(
                        ViewedConcept.concept).order_by(
                            func.count(
                                ViewedConcept.id).desc()).limit(limit).all()
                logger.info(f"Retrieved top {limit} most viewed concepts")
                return dict(concepts)
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve most viewed concepts: {e}")
                return {}
            except Exception as e:
                logger.exception(
                    f"An unexpected error occurred while retrieving most viewed concepts: {e}"
                )
                return {}

    def generate_language_distribution_chart(self) -> str:
        """
        Generates a pie chart showing the distribution of searches by language.

        :return: JSON representation of the chart.
        """
        try:
            data = self.get_language_distribution()
            if not data:
                logger.warning(
                    "No data available for language distribution chart")
                return ""

            labels = list(data.keys())
            values = list(data.values())

            fig = go.Figure(data=[go.Pie(labels=labels, values=values)])
            fig.update_layout(title_text='Language Distribution of Searches')
            logger.info("Generated language distribution chart")
            return fig.to_json()
        except Exception as e:
            logger.exception(
                f"Failed to generate language distribution chart: {e}")
            return ""

    def generate_search_trend_chart(self, days: int = 30) -> str:
        """
        Generates a line chart showing the search trend over the past specified days.

        :param days: Number of days to include in the trend.
        :return: JSON representation of the chart.
        """
        try:
            data = self.get_search_trend(days)
            if not data:
                logger.warning("No data available for search trend chart")
                return ""

            dates = [date_.strftime('%Y-%m-%d') for date_, _ in data]
            counts = [count for _, count in data]

            fig = go.Figure(
                data=[go.Scatter(x=dates, y=counts, mode='lines+markers')])
            fig.update_layout(title_text=f'Search Trend Over Last {days} Days',
                              xaxis_title='Date',
                              yaxis_title='Number of Searches')
            logger.info(
                f"Generated search trend chart for the last {days} days")
            return fig.to_json()
        except Exception as e:
            logger.exception(f"Failed to generate search trend chart: {e}")
            return ""

    def generate_common_search_terms_chart(self, limit: int = 10) -> str:
        """
        Generates a bar chart showing the most common search terms.

        :param limit: Maximum number of terms to include.
        :return: JSON representation of the chart.
        """
        try:
            data = self.get_common_search_terms(limit)
            if not data:
                logger.warning(
                    "No data available for common search terms chart")
                return ""

            terms = list(data.keys())
            counts = list(data.values())

            fig = go.Figure([go.Bar(x=counts, y=terms, orientation='h')])
            fig.update_layout(title_text=f'Top {limit} Common Search Terms',
                              xaxis_title='Number of Occurrences',
                              yaxis_title='Search Terms',
                              yaxis={'categoryorder': 'total ascending'})
            logger.info(
                f"Generated common search terms chart with top {limit} terms")
            return fig.to_json()
        except Exception as e:
            logger.exception(
                f"Failed to generate common search terms chart: {e}")
            return ""

    def generate_concept_lookup_percentage_chart(self) -> str:
        """
        Generates a gauge chart showing the percentage of searches leading to concept lookups.

        :return: JSON representation of the chart.
        """
        try:
            percentage = self.get_concept_lookup_percentage()

            fig = go.Figure(
                go.Indicator(
                    mode="gauge+number",
                    value=percentage,
                    title={'text': "% of Searches Leading to Concept Lookup"},
                    gauge={'axis': {
                        'range': [None, 100]
                    }}))
            logger.info("Generated concept lookup percentage chart")
            return fig.to_json()
        except Exception as e:
            logger.exception(
                f"Failed to generate concept lookup percentage chart: {e}")
            return ""

    def generate_most_viewed_concepts_chart(self, limit: int = 10) -> str:
        """
        Generates a bar chart showing the most viewed concepts.

        :param limit: Maximum number of concepts to include.
        :return: JSON representation of the chart.
        """
        try:
            data = self.get_most_viewed_concepts(limit)
            if not data:
                logger.warning(
                    "No data available for most viewed concepts chart")
                return ""

            concepts = list(data.keys())
            counts = list(data.values())

            fig = go.Figure(go.Bar(x=counts, y=concepts, orientation='h'))
            fig.update_layout(title_text=f'Top {limit} Most Viewed Concepts',
                              xaxis_title='Number of Views',
                              yaxis_title='Concepts',
                              yaxis={'categoryorder': 'total ascending'})
            logger.info(
                f"Generated most viewed concepts chart with top {limit} concepts"
            )
            return fig.to_json()
        except Exception as e:
            logger.exception(
                f"Failed to generate most viewed concepts chart: {e}")
            return ""
