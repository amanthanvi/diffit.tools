from sqlalchemy.orm import Session
import datetime
from . import database


def create_diff(
    db: Session,
    diff_id: str,
    content: str,
    expiration_days: int = 30,
    title: str = None,
):
    """Create a new diff result in the database"""
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=expiration_days)
    db_diff = database.DiffResult(
        id=diff_id, content=content, expires_at=expires_at, title=title
    )
    db.add(db_diff)
    db.commit()
    db.refresh(db_diff)
    return db_diff


def get_diff(db: Session, diff_id: str):
    """Get a diff result by ID"""
    return (
        db.query(database.DiffResult).filter(database.DiffResult.id == diff_id).first()
    )


def cleanup_expired_diffs(db: Session):
    """Delete expired diff results"""
    now = datetime.datetime.utcnow()
    expired = (
        db.query(database.DiffResult).filter(database.DiffResult.expires_at < now).all()
    )
    for diff in expired:
        db.delete(diff)
    db.commit()
    return len(expired)
