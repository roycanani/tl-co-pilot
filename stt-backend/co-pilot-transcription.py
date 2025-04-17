import pika
import json
import time
import os
import logging
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# RabbitMQ connection parameters
AMQP_URL = os.getenv("AMQP_URL")
TRANSCRIPTIONS_QUEUE = os.getenv("TRANSCRIPTIONS_QUEUE", "transcriptions")

params = pika.URLParameters(AMQP_URL)


def connect_rabbitmq():
    while True:
        try:
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            channel.queue_declare(queue=TRANSCRIPTIONS_QUEUE)
            return connection, channel
        except pika.exceptions.AMQPConnectionError:
            logging.error("Connection failed, retrying in 5 seconds...")
            time.sleep(5)


def callback(ch, method, properties, body):
    message = json.loads(body)
    logging.info(f"Received message: {message}")
    transcription = message.get("transcription")
    if transcription:
        requests.post(
            "http://localhost:8000/process", json={"transcript": transcription}
        )
        # transcription = mp3_to_text(file_path, ch)
        # logging.info(f"Processed file: {file_path}\nTranscription: {transcription}")
        print(f"Processed file: {transcription}")


if __name__ == "__main__":
    # Connect to RabbitMQ
    connection, channel = connect_rabbitmq()
    try:
        logging.info("Waiting for messages. To exit press CTRL+C")
        channel.basic_consume(
            queue=TRANSCRIPTIONS_QUEUE, on_message_callback=callback, auto_ack=True
        )
        channel.start_consuming()
    except pika.exceptions.AMQPConnectionError:
        logging.error("Lost connection to RabbitMQ, reconnecting...")
        time.sleep(5)
