import crypto from "crypto";
import { roomRedisClient } from "../config/roomRedisClient.js";

function createRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createUniqueRoomId() {
  let roomId = createRoomId();

  while (await roomRedisClient.exists(`room:${roomId}`)) {
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

  console.log("Teacher recovery token created");

  await roomRedisClient.hSet(`room:${roomId}`, {
    teacherTokenHash: recoverTokenHash,
    studentTokenHash: "",
    teacherConnected: "true",
    studentConnected: "false",
  });

  console.log("Room+Teacher Created");

  return { roomId, recoveryToken };
}

export async function joinStudentRoom(roomId, studentSocketId) {
  const room = await roomRedisClient.hGetAll(`room:${roomId}`);

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

  console.log("Student Recovery Token Created");

  await roomRedisClient.hSet(`room:${roomId}`, {
    studentTokenHash: recoveryTokenHash,
    studentConnected: "true",
  });

  console.log("Student data added to database");

  return {
    room,
    recoveryToken,
  };
}

export async function removeUserFromRoom(roomId, role) {
  const room = await roomRedisClient.hGetAll(`room:${roomId}`);

  if (Object.keys(room).length === 0) {
    return;
  }

  if (role === "teacher") {
    await roomRedisClient.hSet(`room:${roomId}`, {
      teacherConnected: "false",
    });
  }

  if (role === "student") {
    await roomRedisClient.hSet(`room:${roomId}`, {
      studentConnected: "false",
    });
  }

  console.log(`Set ${role}'s connected status to false`);

  const updatedRoom = await roomRedisClient.hGetAll(`room:${roomId}`);
  const bothDisconnected =
    updatedRoom.teacherConnected === "false" &&
    updatedRoom.studentConnected === "false";
  console.log("checking room connection status");

  if (bothDisconnected) {
    await roomRedisClient.expire(`room:${roomId}`, 7 * 60);
    console.log("Expiry timer statred of 7mins on Room: ", roomId);
  }
}

export async function rejoinRoom(roomId, role, recoveryToken) {
  const room = await roomRedisClient.hGetAll(`room:${roomId}`);

  if (Object.keys(room).length === 0) {
    console.log(`Rejoin Room: ${roomId} no longer exists`);

    return {
      error: "Room no longer exists.",
    };
  }

  const recoveryTokenHash = crypto
    .createHash("sha256")
    .update(recoveryToken)
    .digest("hex");

  const storedTokenHash =
    role === "teacher" ? room.teacherTokenHash : room.studentTokenHash;

  console.log(`Rejoin Room: validating tokens for ${role}`);

  if (recoveryTokenHash !== storedTokenHash) {
    console.log(`Rejoin Room: failure managing tokens`);
    return {
      error: "Invalid recovery token.",
    };
  }

  await roomRedisClient.hSet(`room:${roomId}`, {
    [role === "teacher" ? "teacherConnected" : "studentConnected"]: "true",
  });

  console.log(`Tokens Matched in ${roomId} for ${role}`);

  await roomRedisClient.persist(`room:${roomId}`);

  console.log(`Reset ${roomId} expiry timer`);

  await roomRedisClient.hSet(`room:${roomId}`, {
    [`${role}Connected`]: "true",
  });

  console.log(`Set ${role}'s connection status in ${roomId} to connected`);

  return {
    roomId,
    role,
  };
}

// export { createTeacherRoom, joinStudentRoom, removeUserFromRoom };
