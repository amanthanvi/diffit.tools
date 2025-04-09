from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime
from . import database


def get_diff(db: Session, diff_id: str):
    """Get a diff by ID if it has not expired"""
    return (
        db.query(database.Diff)
        .filter(database.Diff.id == diff_id)
        .filter(database.Diff.expires_at > datetime.datetime.utcnow())
        .first()
    )


def create_diff(db: Session, diff_id: str, content: str, title: str = None):
    """Create a new diff entry"""
    db_diff = database.Diff(
        id=diff_id,
        title=title,
        content=content,
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=7),
    )
    db.add(db_diff)
    db.commit()
    db.refresh(db_diff)
    return db_diff


def cleanup_expired_diffs(db: Session):
    """Delete expired diffs"""
    db.query(database.Diff).filter(
        database.Diff.expires_at <= datetime.datetime.utcnow()
    ).delete()
    db.commit()
