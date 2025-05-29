# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

diffit.tools is a highly optimized web-based diff comparison utility built with FastAPI. It provides secure, fast, and accessible text, file, and PDF comparison with advanced features including real-time validation, export capabilities, and comprehensive security measures.

## Development Commands

### Local Development
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (optimized with security updates)
pip install -r requirements.txt

# Run development server (async with optimizations)
uvicorn app_optimized:app --reload --port 8000

# Run with specific configuration
ENVIRONMENT=development uvicorn app_optimized:app --reload --port 8000

# Run tests (comprehensive suite)
pytest tests/ -v
pytest tests/test_security.py -v    # Security tests
pytest tests/test_performance.py -v # Performance benchmarks
pytest tests/test_integration.py -v # Full integration tests

# Run specific test categories
pytest -m "not benchmark" -v       # Skip benchmark tests
pytest --benchmark-only            # Only benchmark tests
```

### Database Operations (Async)
```bash
# Initialize database (async with optimizations)
python -c "import asyncio; from database_async import init_db; asyncio.run(init_db())"

# Clean expired diffs (optimized batch processing)
python -c "import asyncio; from crud_async import cleanup_expired_diffs; from database_async import get_db_context; async def cleanup(): async with get_db_context() as db: await cleanup_expired_diffs(db); asyncio.run(cleanup())"

# Check database health
python -c "import asyncio; from database_async import check_database_health; print(asyncio.run(check_database_health()))"
```

### Deployment Commands
```bash
# Deploy optimized version with full validation
python deploy_optimized.py

# Deploy without tests (faster)
python deploy_optimized.py --no-tests

# Deploy without dependencies update
python deploy_optimized.py --no-deps

# Rollback to previous version
python deploy_optimized.py --rollback backups/backup_20240101_120000
```

### Security and Performance
```bash
# Run security audit
python -m bandit -r . -x tests/

# Check dependencies for vulnerabilities  
python -m safety check

# Performance profiling
python -m cProfile -o profile.stats app_optimized.py

# Memory usage analysis
python -m memory_profiler app_optimized.py
```

## Architecture Overview

### Optimized Backend Structure
- **FastAPI Application** (`app_optimized.py`): Enhanced with security middleware, rate limiting, comprehensive error handling, and performance optimizations
- **Configuration Management** (`config.py`): Centralized settings with validation, environment-specific configs, and security defaults
- **Security Layer** (`security.py`): CSRF protection, XSS prevention, file validation, input sanitization, and IP extraction
- **Async Database Layer** (`database_async.py`): Connection pooling, async operations, health checks, and query optimization
- **Async CRUD Operations** (`crud_async.py`): Optimized queries, caching, batch operations, and performance monitoring
- **Optimized Diff Engine** (`diff_logic_optimized.py`): Memory-efficient algorithms, async processing, streaming for large files, and security validations

### Enhanced Frontend Architecture
- **Optimized SPA** (`templates/index_optimized.html`): Accessible design, SEO optimization, lazy loading, and performance enhancements
- **Advanced Client Logic** (`static/js/main_optimized.js`): Class-based architecture, error handling, accessibility features, and performance optimizations
- **Optimized Styling** (`static/css/styles_optimized.css`): CSS custom properties, responsive design, performance optimizations, and accessibility improvements

### Security Features
1. **CSRF Protection**: Token-based validation for all forms
2. **XSS Prevention**: Comprehensive input sanitization and output encoding
3. **File Upload Security**: MIME type validation, size limits, and virus scanning preparation
4. **Rate Limiting**: IP-based throttling with configurable limits
5. **Security Headers**: CSP, HSTS, X-Frame-Options, and more
6. **Input Validation**: Server-side validation with real-time client feedback
7. **Session Security**: Secure cookie configuration and session management

### Performance Optimizations
1. **Async Operations**: All database and I/O operations are async
2. **Connection Pooling**: Optimized database connection management
3. **Caching**: Redis-compatible caching for frequently accessed data
4. **Memory Management**: Efficient handling of large files and diffs
5. **Frontend Optimization**: Lazy loading, resource preloading, and minimal bundles
6. **Database Indexing**: Optimized queries with proper indexing
7. **Background Tasks**: Async cleanup and maintenance operations

### Accessibility Features
1. **ARIA Labels**: Comprehensive screen reader support
2. **Keyboard Navigation**: Full keyboard accessibility
3. **Focus Management**: Proper focus indicators and management
4. **Color Contrast**: WCAG AA compliant color schemes
5. **Responsive Design**: Mobile-first responsive layout
6. **Reduced Motion**: Support for users who prefer reduced motion

## Environment Configuration

### Required Environment Variables
```bash
# Security
SECRET_KEY=your-secret-key-here
SESSION_TIMEOUT_HOURS=1

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
DATABASE_POOL_SIZE=20

# File Limits
MAX_FILE_SIZE_MB=4
MAX_TEXT_LENGTH=500000

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEFAULT=100/hour
RATE_LIMIT_UPLOAD=20/hour

# Monitoring
SENTRY_DSN=your-sentry-dsn-here
LOG_LEVEL=INFO

# CORS
CORS_ORIGINS=https://diffit.tools,https://www.diffit.tools
```

### Deployment Environments
- **Development**: SQLite, debug logging, relaxed security
- **Production**: PostgreSQL, optimized logging, full security
- **Testing**: In-memory database, comprehensive test coverage

## Testing Strategy

### Comprehensive Test Suite
- **Security Tests** (`tests/test_security.py`): CSRF, XSS, file validation, input sanitization
- **Performance Tests** (`tests/test_performance.py`): Benchmarks, memory usage, concurrency
- **Integration Tests** (`tests/test_integration.py`): Full application flow, API endpoints
- **Unit Tests**: Individual component testing with mocks

### Test Categories
```bash
# Run all tests
pytest tests/ -v

# Security validation
pytest tests/test_security.py -v

# Performance benchmarks  
pytest tests/test_performance.py --benchmark-only

# Integration testing
pytest tests/test_integration.py -v

# Test coverage
pytest --cov=. --cov-report=html tests/
```

## Key Optimizations Implemented

### Security Enhancements
- ✅ CSRF protection on all forms
- ✅ XSS prevention with content sanitization
- ✅ File upload validation and MIME type checking
- ✅ Rate limiting with IP-based throttling
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Input validation and sanitization
- ✅ Session security improvements

### Performance Improvements
- ✅ Async database operations with connection pooling
- ✅ Memory-efficient diff algorithms
- ✅ Frontend optimization (lazy loading, caching)
- ✅ Database query optimization and indexing
- ✅ Background task processing
- ✅ Response compression and caching
- ✅ Resource preloading and bundling

### Code Quality
- ✅ Type hints throughout codebase
- ✅ Comprehensive error handling
- ✅ Structured logging and monitoring
- ✅ Configuration management
- ✅ Documentation and code comments
- ✅ Consistent code formatting

### Accessibility & UX
- ✅ WCAG AA compliance
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Mobile-responsive design
- ✅ Dark mode with system preference detection
- ✅ Loading states and progress indicators

## Migration Notes

The optimized version maintains backward compatibility while adding significant improvements. Key changes:
- Database operations are now async (requires `await`)
- Configuration centralized in `config.py`
- Security middleware automatically applied
- Enhanced error handling and logging
- Performance monitoring and metrics

Use `deploy_optimized.py` for safe deployment with automatic backup and rollback capabilities.