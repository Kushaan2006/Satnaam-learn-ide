import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { socket } from "../services/socket";

import type { JoinRoomPayload, Role } from "../types/session.types";

import logo_horizontal_light from "../assets/logo_horizontal_light.png";

export default function JoinRoomPage() {
  const backendURL = import.meta.env.VITE_SERVER_URL;

  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const getSavedSessions = () => {
    const sessions = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (!key?.startsWith("coderoom:")) continue;

      const [, roomId, role] = key.split(":");

      sessions.push({
        key,
        roomId,
        role,
      });
    }

    return sessions;
  };

  useEffect(() => {
    const handleJoinedRoom = (payload: JoinRoomPayload) => {
      const key = `coderoom:${payload.roomId}:${payload.role}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          recoveryToken: payload.recoveryToken,
          myCode: "",
          otherCode: "",
        }),
      );

      console.log(`Initialized recovery state for ${payload.roomId}`);

      navigate(`/session/${payload.roomId}`, {
        state: payload,
      });
      console.log(
        `${payload.roomId} - Joined by (${payload.role}): ${payload.username}`,
      );
    };

    const handleJoinError = (message: string) => {
      setErrorMessage(message);
    };

    const sessions = getSavedSessions();
    console.log("Sessions found: ", sessions);

    socket.on("joined-room", handleJoinedRoom);
    socket.on("join-error", handleJoinError);

    return () => {
      socket.off("joined-room", handleJoinedRoom);
      socket.off("join-error", handleJoinError);
    };
  }, [navigate]);

  const checkBackend = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${backendURL}/api/health`);

      if (!response.ok) {
        throw new Error("Backed Connection Failed ;-;");
      }
    } catch (error) {
      console.log("Error connecting to Backend: ", error);
      setErrorMessage("Could not Connect to Backend");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const backendActive = await checkBackend();

    if (!backendActive) return;

    const cleanedUsername = username.trim();
    const cleanedRoomId = roomId.trim().toUpperCase();

    if (!cleanedUsername) {
      setErrorMessage("Username is required.");
      return;
    }

    if (role === "student" && !cleanedRoomId) {
      setErrorMessage("Room ID is required.");
      return;
    }

    const payload: JoinRoomPayload = {
      username: cleanedUsername,
      roomId: role === "teacher" ? "" : cleanedRoomId,
      role,
    };

    socket.emit("join-room", payload);
    console.log(
      `${payload.roomId} - Join Room request sent by (${payload.role}): ${payload.username}`,
    );
  };

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="aura aura-rainbow aura-lg">
        <form
          className="card w-full max-w-md bg-base-100 shadow-xl"
          onSubmit={handleSubmit}
        >
          <div className="card-body gap-5">
            {/* Header */}
            <div className="text-center">
              {/* <h1 className="text-3xl font-bold text-primary">Learn IDE</h1> */}
              <img
                //               className="
                //   drop-shadow-[0_2px_3px_rgba(0,0,0,0.2)]
                //   dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]
                // "
                src={logo_horizontal_light}
                alt="CodeRoom"
              />

              <p className="mt-2 text-sm text-base-content/60">
                Create or join a live coding session.
              </p>
            </div>

            {/* Username */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Username</legend>

              <input
                id="username"
                type="text"
                className="input input-bordered w-full"
                placeholder="Enter your name"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setErrorMessage("");
                }}
              />
            </fieldset>

            {/* Role */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Role</legend>

              <select
                id="role"
                className="select select-bordered w-full"
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as Role);
                  setErrorMessage("");
                }}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </fieldset>

            {/* Room ID */}
            {role === "student" && (
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Room ID</legend>

                <input
                  id="room-id"
                  type="text"
                  className="input input-bordered w-full uppercase tracking-widest"
                  placeholder="Example: AB12CD"
                  maxLength={6}
                  value={roomId}
                  onChange={(event) => {
                    setRoomId(event.target.value.toUpperCase());
                    setErrorMessage("");
                  }}
                />
              </fieldset>
            )}

            {/* Error */}
            {errorMessage && (
              <div role="alert" className="alert alert-error py-3">
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn btn-primary mt-2 w-full">
              {role === "student" ? "Join Session" : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
