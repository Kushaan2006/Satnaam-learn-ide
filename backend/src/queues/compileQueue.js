import { Queue } from "bullmq";
import { compileReqQueueRedisClient } from "../config/compileReqQueueRedis.js";

export const compileQueue = new Queue("Satnaam-compileQueue", {
  connection: compileReqQueueRedisClient,
});
