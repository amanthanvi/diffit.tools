import difflib
import tempfile
import os
import re
import datetime
import html
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
    "table": ["class", "style"],
    "td": ["class", "nowrap", "style"],
    "th": ["class", "nowrap", "style"],
    "col": ["class", "width", "style"],
    "span": ["class", "style"],
    "div": ["class", "style"],
    "pre": ["class", "style"],
}


async def extract_file_content(file):
    """Extract text content from an uploaded file"""
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


def html_escape(text):
    """Escape HTML special characters"""
    return html.escape(text)


def custom_diff_renderer(
    text1, text2, diff_type="line", left_title="Text 1", right_title="Text 2"
):
    """Custom diff renderer with improved highlighting"""

    # Define hardcoded colors to ensure highlighting works
    add_bg_color = "#e6ffed"  # Light green
    add_text_color = "#24292e"  # Dark text for added content
    sub_bg_color = "#ffeef0"  # Light red
    sub_text_color = "#24292e"  # Dark text for deleted content

    # Handle different diff types
    if diff_type == "line":
        seq1 = text1.splitlines() or [""]
        seq2 = text2.splitlines() or [""]
    elif diff_type == "word":
        seq1 = text1.split() or [""]
        seq2 = text2.split() or [""]
    elif diff_type == "char":
        seq1 = list(text1) or [""]
        seq2 = list(text2) or [""]
    else:
        return "<p>Unsupported diff type</p>"

    # Generate the diff using difflib's SequenceMatcher
    matcher = difflib.SequenceMatcher(None, seq1, seq2)
    opcodes = matcher.get_opcodes()

    # Start building the HTML for the diff
    html_parts = [
        '<table class="diff diff-enhanced" style="width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;font-family:monospace;font-size:13px;margin:0;padding:0;">',
        "<colgroup>",
        '<col class="diff-col-number" style="width:40px" />',
        '<col class="diff-col-text" style="width:45%" />',
        '<col class="diff-col-number" style="width:40px" />',
        '<col class="diff-col-text" style="width:45%" />',
        "</colgroup>",
        "<thead>",
        "<tr>",
        f'<th class="diff-header-spacer" style="width:40px"></th>',
        f'<th class="diff-header-left" style="width:45%">{html_escape(left_title)}</th>',
        f'<th class="diff-header-spacer" style="width:40px"></th>',
        f'<th class="diff-header-right" style="width:45%">{html_escape(right_title)}</th>',
        "</tr>",
        "</thead>",
        "<tbody>",
    ]

    # Track line numbers
    line1 = 1
    line2 = 1

    # Process each diff section
    for tag, i1, i2, j1, j2 in opcodes:
        # Equal sections (same in both texts)
        if tag == "equal":
            for k in range(i2 - i1):
                html_parts.append("<tr>")
                html_parts.append(
                    f'<td class="diff_header line-number">{line1 + k}</td>'
                )
                html_parts.append(
                    f'<td style="width:45%;white-space:pre-wrap;">{html_escape(seq1[i1 + k])}</td>'
                )
                html_parts.append(
                    f'<td class="diff_header line-number">{line2 + k}</td>'
                )
                html_parts.append(
                    f'<td style="width:45%;white-space:pre-wrap;">{html_escape(seq2[j1 + k])}</td>'
                )
                html_parts.append("</tr>")
            line1 += i2 - i1
            line2 += j2 - j1

        # Replaced sections (different in both texts)
        elif tag == "replace":
            max_lines = max(i2 - i1, j2 - j1)
            for k in range(max_lines):
                html_parts.append("<tr>")

                # Left side (text1) - deleted content
                if k < (i2 - i1):
                    html_parts.append(
                        f'<td class="diff_header line-number">{line1 + k}</td>'
                    )
                    # Use direct color values instead of CSS variables
                    html_parts.append(
                        f'<td class="diff_sub" style="width:45%;white-space:pre-wrap;background-color:{sub_bg_color};color:{sub_text_color};">{html_escape(seq1[i1 + k])}</td>'
                    )
                else:
                    html_parts.append('<td class="diff_header line-number"></td>')
                    html_parts.append(
                        '<td style="width:45%;white-space:pre-wrap;"></td>'
                    )

                # Right side (text2) - added content
                if k < (j2 - j1):
                    html_parts.append(
                        f'<td class="diff_header line-number">{line2 + k}</td>'
                    )
                    # Use direct color values instead of CSS variables
                    html_parts.append(
                        f'<td class="diff_add" style="width:45%;white-space:pre-wrap;background-color:{add_bg_color};color:{add_text_color};">{html_escape(seq2[j1 + k])}</td>'
                    )
                else:
                    html_parts.append('<td class="diff_header line-number"></td>')
                    html_parts.append(
                        '<td style="width:45%;white-space:pre-wrap;"></td>'
                    )

                html_parts.append("</tr>")
            line1 += i2 - i1
            line2 += j2 - j1

        # Deleted sections (only in text1)
        elif tag == "delete":
            for k in range(i2 - i1):
                html_parts.append("<tr>")
                html_parts.append(
                    f'<td class="diff_header line-number">{line1 + k}</td>'
                )
                # Use direct color values instead of CSS variables
                html_parts.append(
                    f'<td class="diff_sub" style="width:45%;white-space:pre-wrap;background-color:{sub_bg_color};color:{sub_text_color};">{html_escape(seq1[i1 + k])}</td>'
                )
                html_parts.append('<td class="diff_header line-number"></td>')
                html_parts.append('<td style="width:45%;white-space:pre-wrap;"></td>')
                html_parts.append("</tr>")
            line1 += i2 - i1

        # Inserted sections (only in text2)
        elif tag == "insert":
            for k in range(j2 - j1):
                html_parts.append("<tr>")
                html_parts.append('<td class="diff_header line-number"></td>')
                html_parts.append('<td style="width:45%;white-space:pre-wrap;"></td>')
                html_parts.append(
                    f'<td class="diff_header line-number">{line2 + k}</td>'
                )
                # Use direct color values instead of CSS variables
                html_parts.append(
                    f'<td class="diff_add" style="width:45%;white-space:pre-wrap;background-color:{add_bg_color};color:{add_text_color};">{html_escape(seq2[j1 + k])}</td>'
                )
                html_parts.append("</tr>")
            line2 += j2 - j1

    # Close the HTML tags
    html_parts.append("</tbody>")
    html_parts.append("</table>")

    # Join the HTML parts and return
    return "\n".join(html_parts)


def generate_text_diff(text1, text2, diff_type="line"):
    """Generate HTML diff between two text strings with secure sanitization"""
    # Print input texts (truncated) for debugging
    print(f"Input text1 (first 50 chars): {text1[:50]}")
    print(f"Input text2 (first 50 chars): {text2[:50]}")
    print(f"Using diff_type: {diff_type}")

    # Use our custom diff renderer instead of difflib's HTML output
    diff_html = custom_diff_renderer(text1, text2, diff_type)

    # No need to enhance the HTML since we built it exactly how we want
    # But we still sanitize for security
    sanitized_html = sanitize_html(diff_html)

    return sanitized_html


def sanitize_html(html_content):
    """Sanitize HTML to prevent XSS attacks"""
    # Remove style tag completely
    html_content = re.sub(
        r'<style type="text/css">.*?</style>', "", html_content, flags=re.DOTALL
    )

    # Define allowed tags and attributes with essential styles allowed
    allowed_attributes = {
        "table": ["class", "style"],
        "td": ["class", "nowrap", "style"],
        "th": ["class", "nowrap", "style"],
        "col": ["class", "width", "style"],
        "span": ["class", "style"],
        "div": ["class", "style"],
        "pre": ["class", "style"],
    }

    # Safe whitelist of CSS properties that won't cause XSS
    safe_css_props = [
        "white-space",
        "word-break",
        "overflow-wrap",
        "word-wrap",
        "width",
        "height",
        "padding",
        "margin",
        "color",
        "background-color",
        "font-family",
        "font-size",
        "text-align",
        "vertical-align",
        "border",
    ]

    # Handle CSS sanitizer issue - use a try/except to handle bleach versions
    try:
        # For newer bleach versions with CSS sanitizer
        from bleach.css_sanitizer import CSSSanitizer

        css_sanitizer = CSSSanitizer(allowed_css_properties=safe_css_props)
        clean_html = bleach.clean(
            html_content,
            tags=ALLOWED_TAGS,
            attributes=allowed_attributes,
            css_sanitizer=css_sanitizer,
            strip=True,
        )
    except ImportError:
        # For older bleach versions without CSS sanitizer
        clean_html = bleach.clean(
            html_content, tags=ALLOWED_TAGS, attributes=allowed_attributes, strip=True
        )

    return clean_html


def enhance_diff_html(html_content):
    """Enhance the standard difflib HTML output with better styling and structure
    Note: This function is kept for compatibility but is less important with custom diff renderer
    """
    # Clean up any style tag that might interfere
    html_content = re.sub(
        r'<style type="text/css">.*?</style>', "", html_content, flags=re.DOTALL
    )

    # Replace the table class for our custom styling
    html_content = html_content.replace(
        '<table class="diff"', '<table class="diff diff-enhanced"'
    )

    # CRITICAL: Convert nowrap attribute to appropriate whitespace handling
    html_content = html_content.replace(
        ' nowrap="nowrap"', ' style="white-space:pre-wrap;"'
    )

    # Add wrapper div for content preservation
    for cell_type in ["diff_add", "diff_sub", "diff_chg"]:
        html_content = re.sub(
            f'<td class="{cell_type}"[^>]*>(.*?)</td>',
            f'<td class="{cell_type}" style="white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;"><div class="diff-content-wrapper">\\1</div></td>',
            html_content,
            flags=re.DOTALL,
        )

    return html_content


def html_to_pdf(html_content):
    """Convert HTML diff to PDF with proper formatting"""
    # Create a BytesIO object to store the PDF content
    pdf_buffer = BytesIO()

    # Extract title information - try to find the file names from the diff
    title_match = re.search(r"<th.*?>(.*?)</th>\s*<th.*?>(.*?)</th>", html_content)
    left_title = "Text 1"
    right_title = "Text 2"
    if title_match:
        left_title = title_match.group(1)
        right_title = title_match.group(2)

    # Create a completely new HTML structure for PDF to ensure proper rendering
    # This avoids relying on the existing HTML which might have formatting issues
    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Diff: {left_title} vs {right_title}</title>
        <style>
            @page {{
                size: A4 landscape;
                margin: 1.5cm;
            }}
            body {{
                font-family: 'DejaVu Sans', sans-serif;
                font-size: 10pt;
                line-height: 1.4;
                margin: 0;
                padding: 0;
                color: #333;
            }}
            h1 {{
                font-size: 18pt;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 1px solid #ccc;
                color: #444;
            }}
            table {{
                border-collapse: separate;
                border-spacing: 0;
                width: 100%;
                margin: 10px 0 20px 0;
                table-layout: fixed;
                font-family: 'DejaVu Sans Mono', monospace;
                font-size: 9pt;
            }}
            thead {{
                display: table-header-group;
            }}
            tbody {{
                display: table-row-group;
            }}
            th {{
                background-color: #f2f2f2;
                padding: 8px 10px;
                text-align: left;
                border-bottom: 1px solid #ddd;
                font-weight: bold;
                font-size: 10pt;
            }}
            .diff-header-left, .diff-header-right {{
                width: 45%;
                min-width: 200px;
            }}
            .diff-header-spacer {{
                width: 5%;
                min-width: 40px;
                max-width: 40px;
            }}
            td {{
                padding: 4px 6px;
                border-bottom: 1px solid #eee;
                vertical-align: top;
                word-wrap: break-word;
                overflow-wrap: break-word;
                white-space: pre-wrap;
            }}
            .line-number {{
                width: 5%;
                min-width: 40px;
                max-width: 40px;
                text-align: right;
                background-color: #f8f8f8;
                color: #999;
                padding-right: 8px;
                font-size: 8pt;
            }}
            .diff-content {{
                width: 45%;
                word-break: break-all;
            }}
            .diff_add {{
                background-color: #e6ffed;
                border-left: 2px solid #2cbe4e;
            }}
            .diff_sub {{
                background-color: #ffeef0;
                border-left: 2px solid #ff4d4f;
            }}
            .diff_chg {{
                background-color: #fff5b1;
                border-left: 2px solid #f6a33a;
            }}
            footer {{
                margin-top: 25px;
                border-top: 1px solid #eee;
                padding-top: 8px;
                font-size: 9pt;
                color: #666;
                text-align: center;
            }}
            @media print {{
                table {{ page-break-inside: auto; }}
                tr {{ page-break-inside: avoid; page-break-after: auto; }}
                thead {{ display: table-header-group; }}
                tfoot {{ display: table-footer-group; }}
            }}
        </style>
    </head>
    <body>
        <h1>Comparison: {left_title} vs {right_title}</h1>
        <!-- Extract just the table content from the original HTML and carefully reconstruct it -->
        {sanitize_html(html_content)}
        <footer>Generated by Diffit Tools on {datetime.date.today().strftime('%Y-%m-%d')}</footer>
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
    """Convert HTML diff to Markdown with proper formatting"""
    # Sanitize the HTML for security
    sanitized_html = sanitize_html(html_content)

    # Extract title information for header
    title_match = re.search(r"<th.*?>(.*?)</th>\s*<th.*?>(.*?)</th>", sanitized_html)
    left_title = "Text 1"
    right_title = "Text 2"
    if title_match:
        left_title = title_match.group(1)
        right_title = title_match.group(2)

    # Pre-process HTML to improve markdown output
    # First, simplify the HTML to make it more markdown-friendly
    processed_html = sanitized_html

    # Add explicit styles to help the converter identify content sections
    processed_html = re.sub(
        r'<td class="diff_add"[^>]*>(.*?)</td>',
        r'<td class="diff_add" data-diff-type="add">\1</td>',
        processed_html,
        flags=re.DOTALL,
    )
    processed_html = re.sub(
        r'<td class="diff_sub"[^>]*>(.*?)</td>',
        r'<td class="diff_sub" data-diff-type="sub">\1</td>',
        processed_html,
        flags=re.DOTALL,
    )
    processed_html = re.sub(
        r'<td class="diff_chg"[^>]*>(.*?)</td>',
        r'<td class="diff_chg" data-diff-type="chg">\1</td>',
        processed_html,
        flags=re.DOTALL,
    )

    # Configure html2text for better diffing output
    converter = html2text.HTML2Text()
    converter.ignore_links = False
    converter.bypass_tables = False
    converter.unicode_snob = (
        True  # Use Unicode characters rather than ASCII approximations
    )
    converter.body_width = 120  # Wide output to avoid wrapping
    converter.default_image_alt = "Diff"
    converter.single_line_break = True  # Avoid excess line breaks

    # Convert HTML to raw Markdown
    raw_markdown = converter.handle(processed_html)

    # Post-process the markdown to improve readability
    lines = raw_markdown.split("\n")
    cleaned_lines = []
    in_table = False
    table_separator_added = False

    for line in lines:
        # Skip empty lines and other non-essential content
        if not line.strip():
            if in_table and not table_separator_added:
                # Add a proper table separator line after the header row
                header_parts = lines[len(cleaned_lines) - 1].count("|") - 1
                if header_parts > 0:
                    separator = "| " + " --- |" * header_parts
                    cleaned_lines.append(separator)
                    table_separator_added = True
            continue

        # Handle table formatting
        if line.strip().startswith("|") and line.strip().endswith("|"):
            if not in_table:
                in_table = True
                table_separator_added = False

            # Clean up table formatting
            line = re.sub(r"\s{2,}", " ", line)  # Reduce multiple spaces
            line = re.sub(r"\| +", "| ", line)  # Normalize spaces after pipes
            line = re.sub(r" +\|", " |", line)  # Normalize spaces before pipes

        # If we're exiting a table
        elif in_table and not line.strip().startswith("|"):
            in_table = False
            cleaned_lines.append("")  # Add a blank line after tables

        # Improve diff markers for better readability
        if "[+" in line:
            line = line.replace("[+", "**[+")
            line = line.replace("+]", "+]**")
        if "[-" in line:
            line = line.replace("[-", "**[-")
            line = line.replace("-]", "-]**")

        # Skip lines with just dashes (often used as separators in raw HTML)
        if line.strip() == "---" and not in_table:
            continue

        cleaned_lines.append(line)

    processed_markdown = "\n".join(cleaned_lines)

    # Create the final markdown document with headers and metadata
    current_date = datetime.date.today().strftime("%Y-%m-%d")

    final_markdown = f"""# Diff Comparison: {left_title} vs {right_title}

Generated by Diffit Tools on {current_date}

---

## Diff Results

{processed_markdown}

"""

    return final_markdown
