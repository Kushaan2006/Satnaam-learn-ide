import { compileQueue } from "../queues/compileQueue.js";
import { compileQueueEvents } from "../queues/compileQueueEvents.js";

export const compileRequestController = async (req, res) => {
  try {
    // const response = await fetch(
    //   `${process.env.COMPILER_SERVICE_URL}/api/compile`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${process.env.COMPILER_SERVICE_API_KEY}`,
    //     },
    //     body: JSON.stringify(req.body),
    //   },
    // );
    // const data = await response.json();

    const job = await compileQueue.add("compile", req.body, {
      removeOnComplete: true,
      removeOnFail: true,
    });
    console.log("Sent Job into Queue");

    const result = await job.waitUntilFinished(compileQueueEvents);
    console.log("Job completed");

    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Compiler service unreachable",
    });
  }
};
