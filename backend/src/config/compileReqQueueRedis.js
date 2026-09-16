import "dotenv/config";
import Redis from "ioredis";

export const compileReqQueueRedisClient = new Redis(
  process.env.COMPILE_QUEUE_REDIS_URL,
  {
    maxRetriesPerRequest: null,
  },
);

compileReqQueueRedisClient.on("connect", () => {
  console.log("Compile_Req_Queue_Redis connected");
});

compileReqQueueRedisClient.on("error", (err) => {
  console.log("Compile_Req_Queue_Redis error: ", err);
});

// await client.set("foo", "bar");
// console.log(await client.get("foo"));
