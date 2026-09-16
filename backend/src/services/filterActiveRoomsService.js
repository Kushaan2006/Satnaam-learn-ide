import { redisClient } from "../config/redisClient.js";

export default async function filterActiveRoomsService(sessions) {
  const activeSessions = [];

  for (const session of sessions) {
    const exists = await redisClient.exists(`room:${session.roomId}`);
    if (exists) activeSessions.push(session);
  }

  return activeSessions;
}
