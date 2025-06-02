FROM python:3.9-slim

WORKDIR /app

# Install required system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    flac \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*


# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Run the co-pilot-stt.py script
CMD ["python", "co-pilot-stt.py"]