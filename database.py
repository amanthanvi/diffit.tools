import os
from sqlalchemy import Column, String, Text, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("diffit.database")

# Determine environment and set up appropriate database connection
is_production = os.environ.get("VERCEL", "0") == "1"

if is_production:
    # Production mode with Supabase PostgreSQL
    # First try to fetch a complete DATABASE_URL from the environment
    DATABASE_URL = os.environ.get("DATABASE_URL")

    # If DATABASE_URL is not provided, construct it from individual parameters
    if not DATABASE_URL:
        # Fetch individual environment variables (ensure these keys match your .env file)
        USER = os.getenv("user")
        PASSWORD = os.getenv("password")
        HOST = os.getenv("host")
        PORT = os.getenv("port")
        DBNAME = os.getenv("dbname")

        # Construct the SQLAlchemy connection string with SSL mode required
        DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"

    logger.info("Using production database configuration with PostgreSQL")

    # Create the SQLAlchemy engine with production settings
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,  # Reconnect every 5 minutes
    )

    # Test the connection
    try:
        with engine.connect() as connection:
            logger.info("Database connection successful!")
    except Exception as e:
        logger.error(f"Failed to connect to the database: {e}")
else:
    # Local development mode with SQLite
    logger.info("Using local development database with SQLite")
    DATABASE_URL = "sqlite:///./diffit.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base model for declarative class definitions
Base = declarative_base()


# Define your models
class Diff(Base):
    """Model for storing diff results"""

    __tablename__ = "diffs"

    id = Column(String, primary_key=True, index=True)
    content = Column(Text, nullable=False)  # The HTML diff content
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime)  # Optionally set an expiration date
    title = Column(String, nullable=True)  # Optionally add a title

    def __repr__(self):
        return f"<Diff(id='{self.id}', created_at='{self.created_at}')>"


# Create tables using the engine
def create_tables():
    Base.metadata.create_all(bind=engine)


# Initialize database tables
create_tables()


# Database dependency function for sessions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
