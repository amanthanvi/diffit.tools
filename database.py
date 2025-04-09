from sqlalchemy import Column, String, Text, DateTime, create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os

# Create a database in the project directory
DB_URL = "sqlite:///./diffit.db"

# Create engine and session
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base model
Base = declarative_base()


class DiffResult(Base):
    """Model for storing diff results"""

    __tablename__ = "diff_results"

    id = Column(String, primary_key=True, index=True)
    content = Column(Text, nullable=False)  # The HTML diff content
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime)  # Optionally set an expiration date
    title = Column(String, nullable=True)  # Optionally add a title

    def __repr__(self):
        return f"<DiffResult(id='{self.id}', created_at='{self.created_at}')>"


# Create tables
Base.metadata.create_all(bind=engine)


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
