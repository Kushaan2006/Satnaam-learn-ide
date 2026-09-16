import { QueueEvents } from "bullmq";
import { compileReqQueueRedisClient } from "../config/compileReqQueueRedis.js";

export const compileQueueEvents = new QueueEvents("Satnaam-compileQueue", {
  connection: compileReqQueueRedisClient,
});
