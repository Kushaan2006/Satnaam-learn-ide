import crypto from "crypto";
import { redisClient } from "../config/redisClient";

const rooms = new Map();

function createRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createUniqueRoomId() {
  let roomId = createRoomId();

  while (await redisClient.exists(`room:${roomId}`)) {
    roomId = createRoomId();
  }

  return roomId;
}

export async function createTeacherRoom(teacherSocketId) {
  const roomId = await createUniqueRoomId();
  const recoveryToken = crypto.randomBytes(32).toString("hex");

  const recoverTokenHash = crypto
    .createHash("sha256")
    .update(recoveryToken)
    .digest("hex");

  await redisClient.hSet(`room:${roomId}`, {
    teacherTokenHash: recoverTokenHash,
    studentTokenHash: "",
    teacherConnected: "true",
    studentConnected: "false",
  });

  return { roomId, recoveryToken };
}

export async function joinStudentRoom(roomId, studentSocketId) {
  const room = await redisClient.hGetAll(`room:${roomId}`);

  if (Object.keys(room).length === 0) {
    return {
      error: "Room is either not in session or does not exist.",
    };
  }

  if (room.studentTokenHash) {
    return {
      error: "Room already has a student.",
    };
  }

  const recoveryToken = crypto.randomBytes(32).toString("hex");

  const recoveryTokenHash = crypto
    .createHash("sha256")
    .update(recoveryToken)
    .digest("hex");

  await redisClient.hSet(`room:${roomId}`, {
    studentTokenHash: recoveryTokenHash,
    studentConnected: "true",
  });

  return {
    room,
    recoveryToken,
  };
}

export function removeUserFromRoom(roomId, role) {
  const room = rooms.get(roomId);

  if (!room) {
    return;
  }

  if (role === "teacher") {
    rooms.delete(roomId);
    return;
  }

  if (role === "student") {
    room.student = null;
  }
}

// export { createTeacherRoom, joinStudentRoom, removeUserFromRoom };
