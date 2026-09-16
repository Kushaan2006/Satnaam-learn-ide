import "dotenv/config";
import { createClient } from "redis";

export const roomRedisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

roomRedisClient.on("error", (err) => console.log("Redis Client Error", err));

export const connectRoomRedis = async () => {
  if (!roomRedisClient.isOpen) {
    await roomRedisClient.connect();
    console.log("Redis connected");
  }
};

// await redisClient.connect();

// await redisClient.set("foo", "bar");
// const result = await redisClient.get("foo");
// console.log(result); // >>> bar
