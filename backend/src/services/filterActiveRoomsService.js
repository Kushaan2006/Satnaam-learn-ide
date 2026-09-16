import { roomRedisClient } from "../config/roomRedisClient.js";

export default async function filterActiveRoomsService(sessions) {
  const activeSessions = [];

  for (const session of sessions) {
    const exists = await roomRedisClient.exists(`room:${session.roomId}`);
    if (exists) activeSessions.push(session);
  }

  return activeSessions;
}
