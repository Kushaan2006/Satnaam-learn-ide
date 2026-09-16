import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { JoinRoomPayload, Role } from "../../types/session.types";

type SavedSession = {
  key: string;
  roomId: string;
  role: Role;
};

export default function SavedSessions() {
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  const navigate = useNavigate();

  const getSavedSessions = () => {
    const sessions: SavedSession[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (!key?.startsWith("coderoom:")) continue;

      const [, roomId, role] = key.split(":");

      sessions.push({
        key,
        roomId,
        role: role as Role,
      });
    }

    return sessions;
  };

  // const filterActiveSessions = async () => {
  //   try {
  //     const savedSessions = getSavedSessions();

  //     if (savedSessions.length === 0) {
  //       return;
  //     }

  //     const response = await fetch(
  //       `${import.meta.env.VITE_SERVER_URL}/api/filterActiveRooms`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           sessions: savedSessions,
  //         }),
  //       },
  //     );

  //     const activeSessions = await response.json();

  //     console.log("Active sessions:", activeSessions);

  //     setSessions(activeSessions);
  //   } catch (error) {
  //     console.log("Failed loading saved sessions:", error);
  //   }
  // };

  // useEffect(() => {
  //   async function loadSessions() {
  //     try {
  //       const savedSessions = getSavedSessions();

  //       if (savedSessions.length === 0) {
  //         return;
  //       }

  //       const response = await fetch(
  //         `${import.meta.env.VITE_SERVER_URL}/api/filterActiveRooms`,
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({
  //             sessions: savedSessions,
  //           }),
  //         },
  //       );

  //       const activeSessions = await response.json();

  //       console.log("Active sessions:", activeSessions);

  //       setSessions(activeSessions);
  //     } catch (error) {
  //       console.log("Failed loading saved sessions:", error);
  //     }
  //   }

  //   loadSessions();
  // }, []);

  useEffect(() => {
    async function loadSessions() {
      try {
        const savedSessions = getSavedSessions();
        console.log("Saved Sessions: ", savedSessions);

        if (savedSessions.length === 0) {
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/api/filterActiveRooms`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessions: savedSessions,
            }),
          },
        );

        const data = await response.json();

        console.log("Active sessions:", data.activeSessions);

        setSessions(data.activeSessions);
      } catch (error) {
        console.log("Failed loading saved sessions:", error);
      }
    }

    loadSessions();
  }, []);

  const handleResume = (session: SavedSession) => {
    const savedData = JSON.parse(localStorage.getItem(session.key) || "{}");

    const payload: JoinRoomPayload = {
      username: savedData.username ?? "Recovered User",

      roomId: session.roomId,

      role: session.role,

      recoveryToken: savedData.recoveryToken,
    };

    navigate(`/session/${session.roomId}`, {
      state: {
        ...payload,
        isRecovery: true,
      },
    });
  };

  if (sessions.length === 0) {
    return null;
  }

  return (
    <section className="card bg-base-100 shadow-md p-4 mb-4">
      <h2 className="font-bold text-lg mb-3">Saved Sessions</h2>

      <div className="flex flex-col gap-2">
        {sessions.map((session) => (
          <button
            key={session.key}
            className="btn btn-outline justify-between"
            onClick={() => handleResume(session)}
          >
            <span>{session.roomId}</span>

            <span className="capitalize">{session.role}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
