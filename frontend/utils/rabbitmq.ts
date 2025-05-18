import amqp from "amqplib";

const AMQP_URL = process.env.AMQP_URL;
const AUDIO_FILES_QUEUE = process.env.AUDIO_FILES_QUEUE || "audio_files";

interface MessagePayload {
  file: string;
  user_id: string;
}

async function connectRabbitMQ(): Promise<{
  connection: amqp.ChannelModel;
  channel: amqp.Channel;
} | null> {
  try {
    if (!AMQP_URL) {
      console.error("AMQP_URL not found in environment variables");
      return null;
    }
    console.info("Connecting to RabbitMQ...");
    const connection = await amqp.connect(AMQP_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(AUDIO_FILES_QUEUE, { durable: false }); // durable: true if you want the queue to survive broker restarts
    console.info("Successfully connected to RabbitMQ and asserted queue");
    return { connection, channel };
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
    // Implement retry logic if needed, similar to the Python example
    return null;
  }
}

export async function sendFileForTranscription(
  filePath: string,
  userId: string
): Promise<boolean> {
  const connectionDetails = await connectRabbitMQ();

  if (!connectionDetails) {
    console.error("Could not establish RabbitMQ connection.");
    return false;
  }

  const { connection, channel } = connectionDetails;

  try {
    const message: MessagePayload = { file: filePath, user_id: userId };
    const messageBuffer = Buffer.from(JSON.stringify(message));

    channel.sendToQueue(AUDIO_FILES_QUEUE, messageBuffer);
    console.info(
      `Sent ${filePath} for transcription to queue ${AUDIO_FILES_QUEUE}`
    );

    await channel.close();
    await connection.close();
    return true;
  } catch (error) {
    console.error(`Error sending message: ${error}`);
    if (channel)
      await channel
        .close()
        .catch((err) => console.error("Error closing channel:", err));
    if (connection)
      await connection
        .close()
        .catch((err) => console.error("Error closing connection:", err));
    return false;
  }
}
