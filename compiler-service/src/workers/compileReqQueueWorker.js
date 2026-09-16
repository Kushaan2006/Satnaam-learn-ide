import { Worker } from "bullmq";
import { compileReqQueueRedisClient } from "../config/compileReqQueueRedis.js";
import { compileCode } from "../controllers/compileController.js";
import { compileCodeService } from "../services/compilerControllerService.js";

console.log("Worker Listening");
export const compileReqQueueWorker = new Worker(
  "Satnaam-compileQueue",
  async (job) => {
    console.log("Got job: ", job.id);
    const { code, stdin, language } = job.data;

    const result = await compileCodeService(language, code, stdin);
    console.log(`${job.id} - completed`);

    return result;
  },
  {
    connection: compileReqQueueRedisClient,
    concurrency: 3,
  },
);
