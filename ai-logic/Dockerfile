FROM python:3.13-slim

WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
# COPY . . # This would copy the 'src' folder into /app
COPY src/ . 
# This copies the content of 'src' into /app, making main.py available at /app/main.py

# Expose port for the API
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]