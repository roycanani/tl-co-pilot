import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
console.log(
  `REDIS_CLUSTER_NODES not set. Attempting to connect to standalone Redis at ${redisHost}:${redisPort}`
);
export const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  // password: process.env.REDIS_PASSWORD,
  // tls: process.env.REDIS_TLS_ENABLED === 'true' ? {} : undefined,
  // showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
});
redisClient.on("connect", () => {
  console.log(
    `Successfully connected to standalone Redis at ${redisHost}:${redisPort}`
  );
});

redisClient.on("error", (err) => {
  // This will catch errors from both Cluster and standalone instances
  console.error("Redis Client Error (Cluster or Standalone):", err);
  // Consider a more robust error handling strategy for production
});
