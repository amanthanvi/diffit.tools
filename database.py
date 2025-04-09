import os
from sqlalchemy import Column, String, Text, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import (
    NullPool,
)  # Use NullPool to disable connection pooling in serverless environments
import datetime
import logging
from dotenv import load_dotenv

# Load environment variables from .env file (used for local development)
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("diffit.database")

# Determine environment: Vercel sets the VERCEL variable to "1" in production.
is_production = os.environ.get("VERCEL", "0") == "1"

# Production: build DATABASE_URL from individual environment variables if not provided.
if is_production:
    # Try fetching DATABASE_URL first (if set), otherwise build it from parts.
    DATABASE_URL = os.environ.get("DATABASE_URL")
    if not DATABASE_URL:
        # Fetch individual variables from environment
        user = os.getenv("user")
        password = os.getenv("password")
        host = os.getenv("host")
        port = os.getenv("port")
        dbname = os.getenv("dbname")

        # Construct the connection string with SSL enforced
        DATABASE_URL = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{dbname}?sslmode=require"

    # Ensure sslmode is included (in case the provided value did not include it)
    if "sslmode" not in DATABASE_URL:
        connector = "?" if "?" not in DATABASE_URL else "&"
        DATABASE_URL = f"{DATABASE_URL}{connector}sslmode=require"

    logger.info("Using production database configuration with PostgreSQL")

    # Create engine with NullPool for serverless (Vercel) environment
    engine = create_engine(DATABASE_URL, poolclass=NullPool)

    # Test the connection
    try:
        with engine.connect() as connection:
            logger.info("Database connection successful!")
    except Exception as e:
        logger.error(f"Failed to connect to the database: {e}")
else:
    # Local development mode: use SQLite
    logger.info("Using local development database with SQLite")
    DATABASE_URL = "sqlite:///./diffit.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declare the base class for models
Base = declarative_base()


# Define your ORM model(s)
class Diff(Base):
    """Model for storing diff results."""

    __tablename__ = "diffs"

    id = Column(String, primary_key=True, index=True)
    content = Column(Text, nullable=False)  # The HTML diff content
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime)  # Optionally set an expiration date
    title = Column(String, nullable=True)  # Optionally add a title

    def __repr__(self):
        return f"<Diff(id='{self.id}', created_at='{self.created_at}')>"


# Function to create tables based on defined models
def create_tables():
    Base.metadata.create_all(bind=engine)


# Initialize tables (this creates tables if they do not already exist)
create_tables()


# Database dependency generator to manage sessions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
