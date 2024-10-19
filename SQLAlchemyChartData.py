# SQLAlchemyChartData.py

import os
import time
from typing import Dict, List, Tuple, Union
from datetime import datetime, timedelta
from collections import Counter

from sqlalchemy import (create_engine, Column, Integer, String, DateTime,
                        Boolean, func, ForeignKey)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.exc import SQLAlchemyError, OperationalError

from wordcloud import STOPWORDS  # Import STOPWORDS to filter common terms

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

# Define the initial languages
INITIAL_LANGUAGES = [
    {
        'code': 'en',
        'name': 'English',
        'native_name': 'English'
    },
    {
        'code': 'es',
        'name': 'Spanish',
        'native_name': 'Español'
    },
    {
        'code': 'fr',
        'name': 'French',
        'native_name': 'Français'
    },
    {
        'code': 'de',
        'name': 'German',
        'native_name': 'Deutsch'
    },
    {
        'code': 'it',
        'name': 'Italian',
        'native_name': 'Italiano'
    },
    {
        'code': 'pt',
        'name': 'Portuguese',
        'native_name': 'Português'
    },
    {
        'code': 'ru',
        'name': 'Russian',
        'native_name': 'Русский'
    },
    {
        'code': 'zh',
        'name': 'Chinese',
        'native_name': '中文'
    },
    {
        'code': 'ja',
        'name': 'Japanese',
        'native_name': '日本語'
    },
    {
        'code': 'ko',
        'name': 'Korean',
        'native_name': '한국어'
    },
    {
        'code': 'ar',
        'name': 'Arabic',
        'native_name': 'العربية'
    },
    {
        'code': 'hi',
        'name': 'Hindi',
        'native_name': 'हिन्दी'
    },
    {
        'code': 'pl',
        'name': 'Polish',
        'native_name': 'Polski'
    },
    {
        'code': 'tr',
        'name': 'Turkish',
        'native_name': 'Türkçe'
    },
]


class Language(Base):
    """
    ORM model representing a language.
    """
    __tablename__ = 'languages'
    id = Column(Integer, primary_key=True)
    code = Column(String(2), unique=True, nullable=False)  # ISO 639-1 code
    name = Column(String, nullable=False)
    native_name = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)


class Search(Base):
    """
    ORM model representing a user search action.
    """
    __tablename__ = 'searches'
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    language = Column(String, nullable=False)
    term = Column(String, nullable=False)
    led_to_concept_lookup = Column(Boolean, default=False)

    # Relationship to SelectedSynonym
    selected_synonyms = relationship("SelectedSynonym",
                                     back_populates="search")


class ViewedConcept(Base):
    """
    ORM model representing a viewed concept.
    """
    __tablename__ = 'viewed_concepts'
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    concept = Column(String, nullable=False)


class SelectedSynonym(Base):
    """
    ORM model representing a selected synonym by the user.
    """
    __tablename__ = 'selected_synonyms'
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    search_id = Column(Integer, ForeignKey('searches.id'), nullable=False)
    synonym = Column(String, nullable=False)

    # Relationship to Search
    search = relationship("Search", back_populates="selected_synonyms")


class SQLAlchemyChartData:
    """
    Data access and analytics class using SQLAlchemy.
    Provides methods to add data, retrieve analytics, and generate charts.
    """

    def __init__(self, db_url: str = None):
        """
        Initializes the database connection and session factory.
        """
        if db_url is None:
            db_url = os.environ.get('DATABASE_URL')
            if not db_url:
                raise ValueError("DATABASE_URL environment variable not set")

        # Ensure the database URL is in the correct format for SQLAlchemy
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)

        # Configure the engine with connection pool settings
        self.engine = create_engine(db_url,
                                    pool_size=5,
                                    max_overflow=10,
                                    pool_timeout=30,
                                    pool_recycle=1800,
                                    pool_pre_ping=True)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

        # Seed initial languages
        self.seed_initial_languages()

    def _handle_disconnects(func):
        """
        Decorator to handle database disconnections.
        Retries the database operation if a disconnect occurs.
        """

        def wrapper(self, *args, **kwargs):
            retries = 3
            delay = 5  # seconds
            for attempt in range(retries):
                try:
                    return func(self, *args, **kwargs)
                except OperationalError as e:
                    logger.warning(f"OperationalError encountered: {e}")
                    logger.info(
                        f"Retrying database operation ({attempt + 1}/{retries}) after {delay} seconds..."
                    )
                    time.sleep(delay)
                    self.engine.dispose()
                    self.engine = create_engine(self.engine.url,
                                                pool_size=5,
                                                max_overflow=10,
                                                pool_timeout=30,
                                                pool_recycle=1800,
                                                pool_pre_ping=True)
                    self.Session = sessionmaker(bind=self.engine)
                except SQLAlchemyError as e:
                    logger.error(f"SQLAlchemyError: {e}")
                    raise
                except Exception as e:
                    logger.exception(f"Unexpected error: {e}")
                    raise
            logger.error("Failed to perform database operation after retries")
            raise OperationalError(
                "Failed to reconnect to the database after multiple attempts")

        return wrapper

    @_handle_disconnects
    def seed_initial_languages(self):
        """
        Seeds the database with initial languages if they don't already exist.
        """
        with self.Session() as session:
            try:
                existing_codes = {
                    lang.code
                    for lang in session.query(Language.code).all()
                }
                new_languages = [
                    Language(name=lang['name'],
                             code=lang['code'],
                             native_name=lang['native_name'])
                    for lang in INITIAL_LANGUAGES
                    if lang['code'] not in existing_codes
                ]
                if new_languages:
                    session.add_all(new_languages)
                    session.commit()
                    logger.info(
                        f"Seeded initial languages: {[lang.code for lang in new_languages]}"
                    )
                else:
                    logger.info("Initial languages already seeded.")
            except SQLAlchemyError as e:
                session.rollback()
                logger.error(f"Failed to seed initial languages: {e}")
                raise

    @_handle_disconnects
    def add_search(self,
                   language: str,
                   term: str,
                   led_to_concept_lookup: bool = False) -> int:
        """
        Adds a new search record to the database.
        Returns the ID of the new search record.
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
                return new_search.id
            except SQLAlchemyError as e:
                session.rollback()
                logger.error(f"Failed to add new search: {e}")
                raise

    @_handle_disconnects
    def add_viewed_concept(self, concept: str) -> None:
        """
        Adds a new viewed concept record to the database.
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

    @_handle_disconnects
    def add_selected_synonym(self, search_id: int, synonym: str) -> None:
        """
        Adds a new selected synonym record to the database.
        """
        with self.Session() as session:
            try:
                new_selection = SelectedSynonym(search_id=search_id,
                                                synonym=synonym)
                session.add(new_selection)
                session.commit()
                logger.info(
                    f"Added selected synonym: '{synonym}' for search ID '{search_id}'"
                )
            except SQLAlchemyError as e:
                session.rollback()
                logger.error(f"Failed to add selected synonym: {e}")
                raise

    @_handle_disconnects
    def get_language_distribution(self) -> Dict[str, int]:
        """
        Retrieves the distribution of searches by language.
        """
        with self.Session() as session:
            try:
                languages = session.query(Search.language, func.count(
                    Search.id)).group_by(Search.language).all()
                languages_dict = {lang: count for lang, count in languages}
                logger.info("Retrieved language distribution")
                return languages_dict
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve language distribution: {e}")
                return {}

    @_handle_disconnects
    def get_total_searches(self) -> int:
        """
        Retrieves the total number of searches.
        """
        with self.Session() as session:
            try:
                total = session.query(func.count(Search.id)).scalar()
                total_searches = total or 0
                logger.info(f"Total searches retrieved: {total_searches}")
                return total_searches
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve total searches: {e}")
                return 0

    @_handle_disconnects
    def get_search_trend(self, days: int = 30) -> List[Tuple[str, int]]:
        """
        Retrieves the number of searches per day for the past specified number of days.
        """
        with self.Session() as session:
            try:
                start_date = datetime.utcnow() - timedelta(days=days)
                trend = session.query(func.date(
                    Search.timestamp), func.count(Search.id)).filter(
                        Search.timestamp >= start_date).group_by(
                            func.date(Search.timestamp)).order_by(
                                func.date(Search.timestamp)).all()
                trend_str = [(date_.strftime('%Y-%m-%d'), count)
                             for date_, count in trend]
                logger.info(f"Retrieved search trend for the last {days} days")
                return trend_str
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve search trend: {e}")
                return []

    @_handle_disconnects
    def get_common_search_terms(self, limit: int = 50) -> Dict[str, int]:
        """
        Retrieves the most common search terms, excluding stopwords.
        """
        with self.Session() as session:
            try:
                terms = session.query(Search.term).all()
                all_terms = [term.lower() for (term, ) in terms]
                term_counts = Counter(all_terms)
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

    @_handle_disconnects
    def get_concept_lookup_percentage(self) -> float:
        """
        Calculates the percentage of searches that led to a concept lookup.
        """
        total_searches = self.get_total_searches()
        if total_searches == 0:
            logger.warning(
                "Total searches is zero, cannot calculate percentage")
            return 0.0
        with self.Session() as session:
            try:
                concept_lookups = session.query(func.count(Search.id)).filter(
                    Search.led_to_concept_lookup.is_(True)).scalar()
                concept_lookups = concept_lookups or 0
                percentage = (concept_lookups / total_searches) * 100
                logger.info(
                    f"Calculated concept lookup percentage: {percentage:.2f}%")
                return percentage
            except SQLAlchemyError as e:
                logger.error(
                    f"Failed to calculate concept lookup percentage: {e}")
                return 0.0

    @_handle_disconnects
    def get_most_viewed_concepts(self, limit: int = 10) -> Dict[str, int]:
        """
        Retrieves the most viewed concepts.
        """
        with self.Session() as session:
            try:
                concepts = session.query(
                    ViewedConcept.concept,
                    func.count(ViewedConcept.id)).group_by(
                        ViewedConcept.concept).order_by(
                            func.count(
                                ViewedConcept.id).desc()).limit(limit).all()
                concepts_dict = {concept: count for concept, count in concepts}
                logger.info(f"Retrieved top {limit} most viewed concepts")
                return concepts_dict
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve most viewed concepts: {e}")
                return {}

    @_handle_disconnects
    def get_most_selected_synonyms(self, limit: int = 10) -> Dict[str, int]:
        """
        Retrieves the most selected synonyms.
        """
        with self.Session() as session:
            try:
                synonyms = session.query(
                    SelectedSynonym.synonym,
                    func.count(SelectedSynonym.id)).group_by(
                        SelectedSynonym.synonym).order_by(
                            func.count(
                                SelectedSynonym.id).desc()).limit(limit).all()
                synonyms_dict = {synonym: count for synonym, count in synonyms}
                logger.info(f"Retrieved top {limit} most selected synonyms")
                return synonyms_dict
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve most selected synonyms: {e}")
                return {}

    @_handle_disconnects
    def get_search_paths(self) -> List[Dict]:
        """
        Retrieves all searches and their selected synonyms.
        """
        with self.Session() as session:
            try:
                searches = session.query(Search).all()
                search_paths = []
                for search in searches:
                    selected_synonyms = [
                        syn.synonym for syn in search.selected_synonyms
                    ]
                    search_paths.append({
                        'term':
                        search.term,
                        'language':
                        search.language,
                        'timestamp':
                        search.timestamp.isoformat(),
                        'selected_synonyms':
                        selected_synonyms
                    })
                logger.info("Retrieved search paths")
                return search_paths
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve search paths: {e}")
                return []

    @_handle_disconnects
    def add_language(self, name: str, code: str, native_name: str) -> None:
        """
        Adds a new language to the database.
        """
        with self.Session() as session:
            try:
                new_language = Language(name=name,
                                        code=code.lower(),
                                        native_name=native_name)
                session.add(new_language)
                session.commit()
                logger.info(f"Added new language: {name} ({code})")
            except SQLAlchemyError as e:
                session.rollback()
                logger.error(f"Failed to add new language: {e}")
                raise

    @_handle_disconnects
    def get_language_by_code(self, code: str) -> Union[Language, None]:
        """
        Retrieves a language by its code.
        """
        with self.Session() as session:
            try:
                language = session.query(Language).filter_by(
                    code=code.lower()).first()
                return language
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve language: {e}")
                return None

    @_handle_disconnects
    def get_all_languages(self) -> List[Dict]:
        """
        Retrieves all languages.
        """
        with self.Session() as session:
            try:
                languages = session.query(Language).all()
                language_list = [{
                    "value": lang.code,
                    "label": lang.name,
                    "nativeName": lang.native_name
                } for lang in languages]
                logger.info("Retrieved all languages")
                return language_list
            except SQLAlchemyError as e:
                logger.error(f"Failed to retrieve languages: {e}")
                return []
