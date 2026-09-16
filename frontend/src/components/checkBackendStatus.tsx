import { useState } from "react";

export default function CheckBackendStatus() {
  const backendURL = import.meta.env.VITE_SERVER_URL;
  const [msg, setMsg] = useState("");
  // const [recvRes, setRecvRes] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleClick = async () => {
    try {
      setConnectionStatus("idle");
      const response = await fetch(`${backendURL}/api/health`);

      if (!response.ok) {
        throw new Error("Backed Connection Failed ;-;");
      }

      const data = await response.json();
      setMsg(data.message);
      setConnectionStatus("success");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMsg("Could not Connect to Backend");
      setConnectionStatus("error");
    }
  };

  return (
    <>
      <div>
        <button onClick={handleClick}>Ping Backend</button>
        <br></br>
        <p
          style={{
            color: connectionStatus === "success" ? "green" : "orange",
          }}
        >
          {msg}
        </p>
      </div>
    </>
  );
}
