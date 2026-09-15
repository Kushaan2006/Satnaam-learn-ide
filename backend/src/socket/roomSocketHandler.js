import {
  createTeacherRoom,
  joinStudentRoom,
  removeUserFromRoom,
} from "../services/roomService.js";

export function roomSocketHandler(socket) {
  socket.data.roomId = null;
  socket.data.role = null;
  socket.data.username = null;

  socket.on("join-room", async (payload) => {
    if (socket.data.roomId) {
      socket.emit("join-error", "You are already in a room.");
      return;
    }
    if (!payload?.username || !payload?.role) {
      socket.emit("join-error", "Invalid room information.");
      return;
    }

    socket.data.username = payload.username;

    if (payload.role === "teacher") {
      const { roomId, recoveryToken } = await createTeacherRoom(socket.id);

      const joinedPayload = {
        ...payload,
        roomId,
        recoveryToken,
      };

      socket.data.roomId = roomId;
      socket.data.role = "teacher";

      socket.join(roomId);
      console.log(
        `${roomId} - Socket registered on ROOM ID (${socket.data.roomId}) on (${socket.data.role}): ${socket.data.username}`,
      );
      socket.emit("joined-room", joinedPayload);
      console.log(
        `${roomId} - Socket Joined ROOM (${socket.data.roomId}) on (${socket.data.role}): ${socket.data.username}`,
      );
      return;
    }

    if (payload.role === "student") {
      const roomId = payload.roomId?.trim().toUpperCase();

      if (!roomId) {
        socket.emit("join-error", "Room ID is required.");
        return;
      }

      const result = await joinStudentRoom(roomId, socket.id);

      if (result.error) {
        socket.emit("join-error", result.error);
        return;
      }

      const recoveryToken = result.recoveryToken;

      const joinedPayload = {
        ...payload,
        roomId,
        recoveryToken,
      };

      socket.data.roomId = roomId;
      socket.data.role = "student";

      socket.join(roomId);
      console.log(
        `${roomId} - Socket registered on ROOM ID on (${socket.data.role}): ${socket.data.username}`,
      );
      socket.emit("joined-room", joinedPayload);
      console.log(
        `${roomId} - Socket Joined ROOM on (${socket.data.role}): ${socket.data.username}`,
      );
      return;
    }

    socket.emit("join-error", "Invalid role.");
    console.log(
      `${socket.data.roomId} - JOIN ERROR FOR (${socket.data.role}): ${socket.data.username}`,
    );
  });

  socket.on("disconnect", () => {
    const { roomId, role } = socket.data;

    if (roomId && role) {
      removeUserFromRoom(roomId, role);
    }

    console.log(`Socket disconnected: ${socket.id}`);
  });
}
