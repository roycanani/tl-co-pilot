import pika
import json
import time
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# RabbitMQ connection parameters
AMQP_URL = os.getenv("AMQP_URL")
if not AMQP_URL:
    logging.error("AMQP_URL not found in environment variables")
    exit(1)

AUDIO_FILES_QUEUE = os.getenv("AUDIO_FILES_QUEUE", "audio_files")

params = pika.URLParameters(AMQP_URL)


def connect_rabbitmq():
    """Establish connection to RabbitMQ server and return connection and channel"""
    while True:
        try:
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            channel.queue_declare(queue=AUDIO_FILES_QUEUE)
            return connection, channel
        except pika.exceptions.AMQPConnectionError:
            logging.error("Connection failed, retrying in 5 seconds...")
            time.sleep(5)


def send_file_for_transcription(file_path):
    """Send a file path to the audio_files queue for processing"""
    # Validate file exists
    if not os.path.exists(file_path):
        logging.error(f"File not found: {file_path}")
        return False

    # Validate file is an MP3
    if not file_path.endswith(".mp3"):
        logging.error(f"File must be in MP3 format: {file_path}")
        return False

    # Use absolute path to ensure correct processing
    abs_file_path = os.path.abspath(file_path)

    connection, channel = connect_rabbitmq()

    try:
        message = json.dumps({"file": abs_file_path})
        channel.basic_publish(exchange="", routing_key=AUDIO_FILES_QUEUE, body=message)
        logging.info(f"Sent {abs_file_path} for transcription")
        connection.close()
        return True
    except Exception as e:
        logging.error(f"Error sending message: {e}")
        connection.close()
        return False


# List of MP3 files to send for transcription
files_to_process = [
    # Add your file paths here, for example:
    "my_audio.mp3",
]

if __name__ == "__main__":
    success_count = 0

    for file_path in files_to_process:
        if send_file_for_transcription(file_path):
            success_count += 1

    logging.info(
        f"Successfully queued {success_count} of {len(files_to_process)} files for transcription"
    )
