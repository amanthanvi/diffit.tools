from fastapi import FastAPI, Request, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import uvicorn
import os
import uuid
from contextlib import asynccontextmanager
from . import diff_logic, database, crud


# Define the lifespan context manager before creating the app
@asynccontextmanager
async def lifespan(app):
    # Startup code
    db = database.SessionLocal()
    try:
        crud.cleanup_expired_diffs(db)
    finally:
        db.close()
    yield
    # Shutdown code (optional)
    # Any cleanup code would go here


app = FastAPI(title="Diffit Tools", lifespan=lifespan)

# Mount static files
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

# Set up templates
templates = Jinja2Templates(directory="frontend/templates")


@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    """Middleware to handle database session and cleanup expired diffs"""
    response = await call_next(request)
    return response


@app.on_event("startup")
async def startup_db_client():
    """Startup event to perform initial cleanup"""
    db = database.SessionLocal()
    try:
        crud.cleanup_expired_diffs(db)
    finally:
        db.close()


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/diff/text", response_class=HTMLResponse)
async def diff_text(
    request: Request,
    background_tasks: BackgroundTasks,
    text1: str = Form(...),
    text2: str = Form(...),
    diff_type: str = Form("line"),
    db: Session = Depends(database.get_db),
):
    """Compare two text inputs and return the diff result"""
    diff_html = diff_logic.generate_text_diff(text1, text2, diff_type)

    # Generate a unique ID and store in database
    diff_id = str(uuid.uuid4())
    crud.create_diff(db, diff_id, diff_html)

    # Schedule cleanup of expired diffs
    background_tasks.add_task(crud.cleanup_expired_diffs, db)

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "diff_result": diff_html,
            "share_url": f"/diff/share/{diff_id}",
        },
    )


@app.post("/diff/file", response_class=HTMLResponse)
async def diff_file(
    request: Request,
    background_tasks: BackgroundTasks,
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    diff_type: str = Form("line"),
    db: Session = Depends(database.get_db),
):
    """Compare two uploaded files and return the diff result"""
    text1 = await diff_logic.extract_file_content(file1)
    text2 = await diff_logic.extract_file_content(file2)

    diff_html = diff_logic.generate_text_diff(text1, text2, diff_type)

    # Generate a unique ID and store in database
    diff_id = str(uuid.uuid4())
    crud.create_diff(
        db, diff_id, diff_html, title=f"{file1.filename} vs {file2.filename}"
    )

    # Schedule cleanup of expired diffs
    background_tasks.add_task(crud.cleanup_expired_diffs, db)

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "diff_result": diff_html,
            "share_url": f"/diff/share/{diff_id}",
        },
    )


@app.post("/diff/pdf", response_class=HTMLResponse)
async def diff_pdf(
    request: Request,
    background_tasks: BackgroundTasks,
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    diff_type: str = Form("line"),
    db: Session = Depends(database.get_db),
):
    """Compare text extracted from two PDF files"""
    text1 = await diff_logic.extract_pdf_content(file1)
    text2 = await diff_logic.extract_pdf_content(file2)

    diff_html = diff_logic.generate_text_diff(text1, text2, diff_type)

    # Generate a unique ID and store in database
    diff_id = str(uuid.uuid4())
    crud.create_diff(
        db, diff_id, diff_html, title=f"{file1.filename} vs {file2.filename}"
    )

    # Schedule cleanup of expired diffs
    background_tasks.add_task(crud.cleanup_expired_diffs, db)

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "diff_result": diff_html,
            "share_url": f"/diff/share/{diff_id}",
        },
    )


@app.get("/diff/share/{diff_id}", response_class=HTMLResponse)
async def get_shared_diff(
    request: Request, diff_id: str, db: Session = Depends(database.get_db)
):
    """Retrieve a shared diff result by ID"""
    db_diff = crud.get_diff(db, diff_id)
    if not db_diff:
        return templates.TemplateResponse(
            "index.html",
            {"request": request, "error": "Shared diff not found or expired"},
        )

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "diff_result": db_diff.content,
            "share_url": f"/diff/share/{diff_id}",
            "title": db_diff.title,
        },
    )


@app.get("/export/{diff_id}/{format}")
async def export_diff(
    diff_id: str, format: str, db: Session = Depends(database.get_db)
):
    """Export diff result as PDF or Markdown"""
    db_diff = crud.get_diff(db, diff_id)
    if not db_diff:
        return {"error": "Diff not found or expired"}

    filename = f"diff_{diff_id}"
    if db_diff.title:
        # Create a safe filename
        filename = f"{db_diff.title.replace(' ', '_')[:30]}_{diff_id}"

    if format == "pdf":
        # Convert HTML to PDF
        pdf_bytes = diff_logic.html_to_pdf(db_diff.content)
        # Return PDF file
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}.pdf"},
        )
    elif format == "markdown":
        # Convert HTML to Markdown
        markdown_text = diff_logic.html_to_markdown(db_diff.content)
        # Return Markdown file
        return Response(
            content=markdown_text,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename={filename}.md"},
        )
    else:
        return {"error": "Unsupported export format"}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
