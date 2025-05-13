import speech_recognition as sr
from pydub import AudioSegment
import pika
import json
import time
import os
import logging
import tempfile
from google.cloud import storage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# RabbitMQ connection parameters
AMQP_URL = os.getenv("AMQP_URL")
TRANSCRIPTIONS_QUEUE = os.getenv("TRANSCRIPTIONS_QUEUE", "transcriptions")
AUDIO_FILES_QUEUE = os.getenv("AUDIO_FILES_QUEUE", "audio_files")

params = pika.URLParameters(AMQP_URL)


def connect_rabbitmq():
    while True:
        try:
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            channel.queue_declare(queue=TRANSCRIPTIONS_QUEUE)
            channel.queue_declare(queue=AUDIO_FILES_QUEUE)
            return connection, channel
        except pika.exceptions.AMQPConnectionError:
            logging.error("Connection failed, retrying in 5 seconds...")
            time.sleep(5)


def mp3_to_text(gcs_uri, channel):  # Changed mp3_path to gcs_uri
    logging.info(f"Processing file from GCS: {gcs_uri}")

    # Initialize GCS client
    storage_client = storage.Client()

    # Parse GCS URI
    if not gcs_uri.startswith("gs://"):
        logging.error(f"Invalid GCS URI: {gcs_uri}. It must start with 'gs://'")
        return "Error: Invalid GCS URI"

    bucket_name, blob_name = gcs_uri.replace("gs://", "").split("/", 1)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    text = "Error processing file"
    temp_dir = tempfile.mkdtemp()
    local_audio_path = os.path.join(temp_dir, os.path.basename(blob_name))

    try:
        # Download file from GCS
        blob.download_to_filename(local_audio_path)
        logging.info(f"Successfully downloaded {gcs_uri} to {local_audio_path}")

        file_extension = os.path.splitext(local_audio_path)[1].lower()
        wav_path = local_audio_path

        if file_extension == ".mp3":
            # Convert MP3 to WAV
            audio = AudioSegment.from_mp3(local_audio_path)
            wav_path = os.path.join(
                temp_dir, os.path.basename(local_audio_path).replace(".mp3", ".wav")
            )
            audio.export(wav_path, format="wav")
            logging.info(f"Converted {local_audio_path} to {wav_path}")
        elif file_extension != ".wav":
            logging.error(
                f"Unsupported file format: {file_extension}. Only .mp3 and .wav are supported."
            )
            return f"Error: Unsupported file format {file_extension}"

        # Recognize speech
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)

        try:
            text = recognizer.recognize_google(audio_data)
            logging.info(f"Transcription successful: {text}")
        except sr.UnknownValueError:
            text = "Speech not recognized"
            logging.warning(f"Speech not recognized for {gcs_uri}")
        except sr.RequestError as e:
            text = "Error with recognition service"
            logging.error(f"Error with recognition service for {gcs_uri}: {e}")

    except Exception as e:
        logging.error(f"An error occurred processing {gcs_uri}: {e}")
        text = f"Error processing file: {e}"
    finally:
        # Clean up temporary files
        try:
            if os.path.exists(local_audio_path):
                os.remove(local_audio_path)
            if wav_path != local_audio_path and os.path.exists(
                wav_path
            ):  # Check if wav_path is different and exists
                os.remove(wav_path)
            os.rmdir(temp_dir)
            logging.info(f"Cleaned up temporary files for {gcs_uri}")
        except Exception as e:
            logging.error(f"Error cleaning up temporary files for {gcs_uri}: {e}")

    # Publish the text to RabbitMQ
    message = json.dumps(
        {"file": gcs_uri, "transcription": text}
    )  # Use gcs_uri in the message
    channel.basic_publish(exchange="", routing_key=TRANSCRIPTIONS_QUEUE, body=message)

    return text


def callback(ch, method, properties, body):
    message = json.loads(body)
    logging.info(f"Received message: {message}")
    file_path = message.get("file")
    if file_path:
        transcription = mp3_to_text(file_path, ch)
        logging.info(f"Processed file: {file_path}\nTranscription: {transcription}")


while True:
    connection, channel = connect_rabbitmq()
    try:
        logging.info("Waiting for messages. To exit press CTRL+C")
        channel.basic_consume(
            queue=AUDIO_FILES_QUEUE, on_message_callback=callback, auto_ack=True
        )
        channel.start_consuming()
    except pika.exceptions.AMQPConnectionError:
        logging.error("Lost connection to RabbitMQ, reconnecting...")
        time.sleep(5)
