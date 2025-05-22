import amqp from "amqplib";

const AMQP_URL = process.env.AMQP_URL;
const AUDIO_FILES_QUEUE = process.env.AUDIO_FILES_QUEUE || "transcriptions";
const TRANSCRIPTION_ANALYS_QUEUE =
  process.env.TRANSCRIPTIONS_QUEUE || "transcriptions";

interface STTMessagePayload {
  file: string;
  user_id: string;
}

interface AnalysMessagePayload {
  transcription: string;
  user_id: string;
}

async function connectRabbitMQ(queue: string): Promise<{
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
    await channel.assertQueue(queue, { durable: false }); // durable: true if you want the queue to survive broker restarts
    console.info("Successfully connected to RabbitMQ and asserted queue");
    return { connection, channel };
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
    // Implement retry logic if needed, similar to the Python example
    return null;
  }
}

export async function sendTranscriptionForAnalyse(
  transcription: string,
  userId: string
): Promise<boolean> {
  const connectionDetails = await connectRabbitMQ(TRANSCRIPTION_ANALYS_QUEUE);
  console.log(
    "Transcription for analyse",
    transcription,
    TRANSCRIPTION_ANALYS_QUEUE
  );
  console.log(process.env);
  console.log(process.env.TRANSCRIPTIONS_QUEUE);

  if (!connectionDetails) {
    console.error("Could not establish RabbitMQ connection.");
    return false;
  }

  const { connection, channel } = connectionDetails;

  try {
    const message: AnalysMessagePayload = {
      transcription: transcription,
      user_id: userId,
    };
    const messageBuffer = Buffer.from(JSON.stringify(message));

    channel.sendToQueue(TRANSCRIPTION_ANALYS_QUEUE, messageBuffer);
    console.info(
      `Sent for transcription analys to queue ${TRANSCRIPTION_ANALYS_QUEUE}`
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

export async function sendFileForSTT(
  filePath: string,
  userId: string
): Promise<boolean> {
  const connectionDetails = await connectRabbitMQ(AUDIO_FILES_QUEUE);
  console.log("File for STT", filePath, AUDIO_FILES_QUEUE);

  if (!connectionDetails) {
    console.error("Could not establish RabbitMQ connection.");
    return false;
  }

  const { connection, channel } = connectionDetails;

  try {
    const message: STTMessagePayload = { file: filePath, user_id: userId };
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
