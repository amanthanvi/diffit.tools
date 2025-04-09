import os
from sqlalchemy import Column, String, Text, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool  # Import NullPool for serverless environments
import datetime
import logging
from dotenv import load_dotenv

# Load environment variables from .env if available (for local development)
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("diffit.database")

# Determine environment and set up appropriate database connection
is_production = os.environ.get("VERCEL", "0") == "1"

DATABASE_URL = os.environ.get("DATABASE_URL")

if is_production and DATABASE_URL:
    # Production mode with Supabase PostgreSQL
    # Ensure that sslmode=require is appended (if not already present)
    if "sslmode" not in DATABASE_URL:
        connector = "?" if "?" not in DATABASE_URL else "&"
        DATABASE_URL = f"{DATABASE_URL}{connector}sslmode=require"

    logger.info("Using production database configuration with PostgreSQL")

    # For Vercel’s serverless environment, disable pooling with NullPool
    engine = create_engine(DATABASE_URL, poolclass=NullPool)

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
