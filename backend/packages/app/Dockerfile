FROM python:3.12-slim

# Install FFmpeg and system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files and source code
# Note: Source must be present for uv sync since this is an editable package install
COPY pyproject.toml README.md .python-version ./
COPY src/ src/

# Install dependencies
RUN uv sync --no-dev

# Create data directory
RUN mkdir -p /tmp/data

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DATA_DIR=/tmp/data

# Expose port
EXPOSE 8000

# Run the application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
