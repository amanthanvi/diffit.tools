import difflib
import tempfile
import os
import re
from typing import Optional, Tuple, List
import aiofiles
from pdfminer.high_level import extract_text
import weasyprint
import html2text
from io import BytesIO
import bleach

# Allowed tags for sanitized HTML
ALLOWED_TAGS = [
    "table",
    "tbody",
    "tr",
    "td",
    "th",
    "thead",
    "colgroup",
    "col",
    "span",
    "div",
    "pre",
    "br",
]

# Allowed attributes for sanitized HTML
ALLOWED_ATTRIBUTES = {
    "table": ["class"],
    "td": ["class", "nowrap"],
    "th": ["class", "nowrap"],
    "col": ["class", "width"],
    "span": ["class"],
    "div": ["class"],
}


async def extract_file_content(file):
    """Extract text content from an uploaded file"""
    # No changes to this function
    content = ""
    temp_file_path = None

    try:
        # Create a temporary file
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            temp_file_path = temp.name

        # Write the uploaded file content to the temporary file
        async with aiofiles.open(temp_file_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)

        # For text files, read as string
        async with aiofiles.open(
            temp_file_path, "r", encoding="utf-8", errors="ignore"
        ) as f:
            content = await f.read()

    except Exception as e:
        content = f"Error extracting content: {str(e)}"
    finally:
        # Clean up the temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

    return content


async def extract_pdf_content(file):
    """Extract text content from a PDF file using pdfminer.six"""
    # No changes to this function
    content = ""
    temp_file_path = None

    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
            temp_file_path = temp.name

        # Write the uploaded file content to the temporary file
        async with aiofiles.open(temp_file_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)

        # Extract text using pdfminer.six
        content = extract_text(temp_file_path)

    except Exception as e:
        content = f"Error extracting PDF content: {str(e)}"
    finally:
        # Clean up the temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

    return content


def generate_text_diff(text1, text2, diff_type="line"):
    """Generate HTML diff between two text strings with secure sanitization"""
    if diff_type == "line":
        # Line-by-line diff
        lines1 = text1.splitlines()
        lines2 = text2.splitlines()
        differ = difflib.HtmlDiff()
        diff_html = differ.make_file(lines1, lines2, "Text 1", "Text 2")

    elif diff_type == "word":
        # Word-by-word diff
        words1 = text1.split()
        words2 = text2.split()
        differ = difflib.HtmlDiff()
        diff_html = differ.make_file(words1, words2, "Text 1", "Text 2")

    elif diff_type == "char":
        # Character-by-character diff
        chars1 = list(text1)
        chars2 = list(text2)
        differ = difflib.HtmlDiff()
        diff_html = differ.make_file(chars1, chars2, "Text 1", "Text 2")

    else:
        return "<p>Unsupported diff type</p>"

    # Safely enhance and sanitize the HTML
    diff_html = enhance_diff_html(diff_html)
    sanitized_html = sanitize_html(diff_html)

    return sanitized_html


def sanitize_html(html_content):
    """Sanitize HTML to prevent XSS attacks"""
    # Remove style tag completely
    html_content = re.sub(
        r'<style type="text/css">.*?</style>', "", html_content, flags=re.DOTALL
    )

    # Clean the HTML with bleach
    clean_html = bleach.clean(
        html_content, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True
    )

    return clean_html


def enhance_diff_html(html_content):
    """Enhance the standard difflib HTML output with better styling"""
    # Add a class to the diff table for our CSS to target
    html_content = html_content.replace(
        '<table class="diff"', '<table class="diff diff-enhanced"'
    )

    # Add semantic classes for different cell types
    html_content = html_content.replace(
        '<td class="diff_header"', '<td class="diff_header line-number"'
    )

    # Do not modify the actual content structure - let CSS handle the styling
    return html_content


def html_to_pdf(html_content):
    """Convert HTML diff to PDF

    Uses WeasyPrint to convert HTML content to a PDF document

    Args:
        html_content: The HTML diff content to convert

    Returns:
        bytes: The PDF document as bytes
    """
    # Create a BytesIO object to store the PDF content
    pdf_buffer = BytesIO()

    # We sanitize the HTML before conversion for security
    sanitized_html = sanitize_html(html_content)

    # Add minimal styling to improve PDF readability
    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Diff Result</title>
        <style>
            body {{ font-family: sans-serif; font-size: 10pt; }}
            table {{ border-collapse: collapse; width: 100%; }}
            th {{ background-color: #f2f2f2; padding: 8px; text-align: left; border: 1px solid #ddd; }}
            td {{ padding: 8px; border: 1px solid #ddd; white-space: pre-wrap; }}
            .diff_add {{ background-color: #aaffaa; }}
            .diff_chg {{ background-color: #ffff77; }}
            .diff_sub {{ background-color: #ffaaaa; }}
            .line-number {{ width: 50px; text-align: right; background-color: #f5f5f5; }}
        </style>
    </head>
    <body>
        {sanitized_html}
    </body>
    </html>
    """

    # Convert HTML to PDF
    weasyprint.HTML(string=styled_html).write_pdf(pdf_buffer)

    # Get the PDF content
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()

    return pdf_bytes


def html_to_markdown(html_content):
    """Convert HTML diff to Markdown

    Uses html2text to convert the HTML diff output to Markdown format

    Args:
        html_content: The HTML diff content to convert

    Returns:
        str: The Markdown text
    """
    # Sanitize the HTML for security
    sanitized_html = sanitize_html(html_content)

    # Configure html2text
    converter = html2text.HTML2Text()
    converter.ignore_links = False
    converter.bypass_tables = False
    converter.default_image_alt = "Diff Image"

    # Convert HTML to Markdown
    markdown_text = converter.handle(sanitized_html)

    # Add a title
    markdown_text = f"# Diff Result\n\n{markdown_text}"

    return markdown_text
