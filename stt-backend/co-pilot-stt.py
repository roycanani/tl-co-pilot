import speech_recognition as sr
from pydub import AudioSegment
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


def mp3_to_text(mp3_path, channel):
    logging.info(f"Processing file: {mp3_path}")

    # Convert MP3 to WAV
    print(mp3_path)
    audio = AudioSegment.from_mp3(mp3_path)
    wav_path = mp3_path.replace(".mp3", ".wav")
    audio.export(wav_path, format="wav")

    # Recognize speech
    recognizer = sr.Recognizer()
    with sr.AudioFile(wav_path) as source:
        audio_data = recognizer.record(source)

    try:
        text = recognizer.recognize_google(audio_data)
        logging.info(f"Transcription successful: {text}")
    except sr.UnknownValueError:
        text = "Speech not recognized"
        logging.warning("Speech not recognized")
    except sr.RequestError:
        text = "Error with recognition service"
        logging.error("Error with recognition service")

    # Publish the text to RabbitMQ
    message = json.dumps({"file": mp3_path, "transcription": text})
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
