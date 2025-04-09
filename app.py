from fastapi import (
    FastAPI,
    Request,
    UploadFile,
    File,
    Form,
    Depends,
    HTTPException,
    BackgroundTasks,
)
from fastapi.responses import HTMLResponse, Response, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
import uvicorn
import os
import uuid
import secrets
import logging
import json
from contextlib import asynccontextmanager
import diff_logic, database, crud


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("diffit.app")

# Determine environment
is_production = os.environ.get("VERCEL", "0") == "1"

# Configure session security (cookie-based for Vercel)
SESSION_SETTINGS = {
    "session_cookie": "diffit_session",
    "max_age": 3600,  # 1 hour
    "same_site": "lax",  # Protects against CSRF
    "https_only": is_production,  # Only require HTTPS in production
}


# Get or generate secure secret key
def get_secret_key():
    # Try to get from environment variable (preferred method for production)
    env_key = os.environ.get("SESSION_SECRET_KEY")
    if env_key:
        return env_key

    # Generate a new key if none exists
    new_key = secrets.token_hex(32)  # 256-bit random key

    # In production, warn about auto-generated keys
    if is_production:
        logger.warning(
            "SECURITY WARNING: Auto-generating session key in production environment. "
            "This is not recommended. Please set the SESSION_SECRET_KEY environment variable."
        )

    return new_key


# Simplified lifespan for Vercel serverless environment
@asynccontextmanager
async def lifespan(app):
    # Startup code (minimal for serverless)
    yield
    # No shutdown code needed for serverless


app = FastAPI(title="Diffit Tools", lifespan=lifespan)

# Add session middleware with secure settings
app.add_middleware(SessionMiddleware, secret_key=get_secret_key(), **SESSION_SETTINGS)

# Determine the base directory
base_dir = os.path.dirname(os.path.abspath(__file__))
# Mount static files
app.mount(
    "/static", StaticFiles(directory=os.path.join(base_dir, "static")), name="static"
)

# Set up templates with absolute path
templates = Jinja2Templates(directory=os.path.join(base_dir, "templates"))


# Basic health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}


# Direct favicon route
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Handle direct favicon requests"""
    return FileResponse(os.path.join(base_dir, "static", "favicon.ico"))


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
    try:
        # Set reasonable limits for text size
        MAX_TEXT_LENGTH = 100000  # 100KB
        if len(text1) > MAX_TEXT_LENGTH or len(text2) > MAX_TEXT_LENGTH:
            return templates.TemplateResponse(
                "index.html",
                {
                    "request": request,
                    "error": "Text is too large. Please limit to 100KB per input.",
                    "text1": text1[:1000] + "..." if len(text1) > 1000 else text1,
                    "text2": text2[:1000] + "..." if len(text2) > 1000 else text2,
                },
            )

        diff_html = diff_logic.generate_text_diff(text1, text2, diff_type)

        # Generate a unique ID and store in database
        diff_id = str(uuid.uuid4())
        crud.create_diff(db, diff_id, diff_html)

        # Store text in session for re-use
        request.session["text1"] = text1
        request.session["text2"] = text2

        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "diff_result": diff_html,
                "share_url": f"/diff/share/{diff_id}",
                "text1": text1,
                "text2": text2,
                "selected_diff_type": diff_type,
            },
        )
    except Exception as e:
        logger.error(f"Error generating text diff: {e}")
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "error": "An error occurred while processing your request.",
                "text1": text1,
                "text2": text2,
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
    try:
        # File size validation - Vercel has 4.5MB limit for serverless
        MAX_FILE_SIZE = 4 * 1024 * 1024  # 4MB

        # Read files in memory (safer for serverless)
        content1 = await file1.read()
        content2 = await file2.read()

        if len(content1) > MAX_FILE_SIZE or len(content2) > MAX_FILE_SIZE:
            return templates.TemplateResponse(
                "index.html",
                {
                    "request": request,
                    "error": f"File size exceeds the 4MB limit. Please use smaller files.",
                },
            )

        # Extract text from files
        text1 = await diff_logic.extract_file_content_from_bytes(
            content1, file1.filename
        )
        text2 = await diff_logic.extract_file_content_from_bytes(
            content2, file2.filename
        )

        # Store file contents in session for later use
        request.session["file1_content"] = text1
        request.session["file2_content"] = text2
        request.session["file1_name"] = file1.filename
        request.session["file2_name"] = file2.filename
        request.session["file_type"] = "file"  # Track source type

        diff_html = diff_logic.generate_text_diff(text1, text2, diff_type)

        # Generate a unique ID and store in database
        diff_id = str(uuid.uuid4())
        crud.create_diff(
            db, diff_id, diff_html, title=f"{file1.filename} vs {file2.filename}"
        )

        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "diff_result": diff_html,
                "share_url": f"/diff/share/{diff_id}",
                "selected_diff_type": diff_type,
                "has_stored_files": True,
                "file1_name": file1.filename,
                "file2_name": file2.filename,
            },
        )
    except Exception as e:
        logger.error(f"Error processing file diff: {e}")
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "error": "An error occurred while processing your files. Please try again.",
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
    try:
        # File size validation - Vercel has 4.5MB limit for serverless
        MAX_FILE_SIZE = 4 * 1024 * 1024  # 4MB

        # Read files in memory (safer for serverless)
        content1 = await file1.read()
        content2 = await file2.read()

        if len(content1) > MAX_FILE_SIZE or len(content2) > MAX_FILE_SIZE:
            return templates.TemplateResponse(
                "index.html",
                {
                    "request": request,
                    "error": f"PDF size exceeds the 4MB limit. Please use smaller files.",
                },
            )

        # Extract text from PDF bytes
        text1 = await diff_logic.extract_pdf_content_from_bytes(content1)
        text2 = await diff_logic.extract_pdf_content_from_bytes(content2)

        # Store PDF contents in session for later use
        request.session["file1_content"] = text1
        request.session["file2_content"] = text2
        request.session["file1_name"] = file1.filename
        request.session["file2_name"] = file2.filename
        request.session["file_type"] = "pdf"  # Track source type

        diff_html = diff_logic.generate_text_diff(text1, text2, diff_type)

        # Generate a unique ID and store in database
        diff_id = str(uuid.uuid4())
        crud.create_diff(
            db, diff_id, diff_html, title=f"{file1.filename} vs {file2.filename}"
        )

        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "diff_result": diff_html,
                "share_url": f"/diff/share/{diff_id}",
                "selected_diff_type": diff_type,
                "has_stored_files": True,
                "file1_name": file1.filename,
                "file2_name": file2.filename,
            },
        )
    except Exception as e:
        logger.error(f"Error processing PDF diff: {e}")
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "error": "An error occurred while processing your PDFs. Please try again.",
            },
        )


@app.post("/diff/change-type", response_class=HTMLResponse)
async def change_diff_type(
    request: Request,
    background_tasks: BackgroundTasks,
    diff_type: str = Form(...),
    db: Session = Depends(database.get_db),
):
    """Change diff type using stored file contents"""
    try:
        # Check if we have stored file contents
        if (
            "file1_content" not in request.session
            or "file2_content" not in request.session
        ):
            # Try text content instead
            if "text1" in request.session and "text2" in request.session:
                text1 = request.session["text1"]
                text2 = request.session["text2"]
                file_type = "text"
                file1_name = "Text 1"
                file2_name = "Text 2"
            else:
                return templates.TemplateResponse(
                    "index.html",
                    {
                        "request": request,
                        "error": "No stored content found. Please upload files or enter text again.",
                    },
                )
        else:
            # Retrieve stored content and metadata
            text1 = request.session["file1_content"]
            text2 = request.session["file2_content"]
            file1_name = request.session.get("file1_name", "File 1")
            file2_name = request.session.get("file2_name", "File 2")
            file_type = request.session.get("file_type", "file")

        # Generate new diff with selected type
        diff_html = diff_logic.generate_text_diff(text1, text2, diff_type)

        # Generate a unique ID and store in database
        diff_id = str(uuid.uuid4())
        crud.create_diff(db, diff_id, diff_html, title=f"{file1_name} vs {file2_name}")

        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "diff_result": diff_html,
                "share_url": f"/diff/share/{diff_id}",
                "selected_diff_type": diff_type,
                "has_stored_files": file_type != "text",
                "file1_name": file1_name,
                "file2_name": file2_name,
                "file_type": file_type,
                "text1": text1 if file_type == "text" else None,
                "text2": text2 if file_type == "text" else None,
            },
        )
    except Exception as e:
        logger.error(f"Error changing diff type: {e}")
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "error": "An error occurred while changing diff type. Please try again.",
            },
        )


@app.get("/diff/share/{diff_id}", response_class=HTMLResponse)
async def get_shared_diff(
    request: Request, diff_id: str, db: Session = Depends(database.get_db)
):
    """Retrieve a shared diff result by ID"""
    try:
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
    except Exception as e:
        logger.error(f"Error retrieving shared diff {diff_id}: {e}")
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "error": "An error occurred while retrieving the shared diff.",
            },
        )


@app.get("/export/{diff_id}/{format}")
async def export_diff(
    diff_id: str, format: str, db: Session = Depends(database.get_db)
):
    """Export diff result as PDF or Markdown"""
    try:
        db_diff = crud.get_diff(db, diff_id)
        if not db_diff:
            return {"error": "Diff not found or expired"}

        filename = f"diff_{diff_id}"
        if db_diff.title:
            # Create a safe filename
            filename = f"{db_diff.title.replace(' ', '_')[:30]}_{diff_id}"

        if format == "pdf":
            # Return a message that PDF is handled client-side
            # This is a fallback for users with JavaScript disabled
            return Response(
                content="PDF export is now handled in your browser. If you're seeing this message, please ensure JavaScript is enabled.",
                media_type="text/plain",
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
    except Exception as e:
        logger.error(f"Error exporting diff {diff_id} to {format}: {e}")
        return {"error": "An error occurred during export. Please try again."}
