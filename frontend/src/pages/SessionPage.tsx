import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { socket } from "../services/socket";

import type { JoinRoomPayload } from "../types/session.types";
import RunButton from "../components/RunButton";
// import VoiceControls from "../components/voiceControls";
import VoiceControls from "../components/voiceControls";
import ReviewEditor from "../components/CodeEditor/ReviewEditor";
import StudentEditor from "../components/CodeEditor/StudentEditor";
import OutputWindow from "../components/Console/OutputWindow";
import InputArea from "../components/Console/InputArea";
export default function SessionPage() {
  interface ExecutionUpdate {
    isRunning: boolean;
    output: string;
  }

  const backendURL = import.meta.env.VITE_SERVER_URL;

  //CodeEditor States
  const [studentCode, setStudentCode] = useState("");
  const [reviewCode, setReviewCode] = useState("");

  //Console States
  const [stdin, setStdin] = useState(""); //input
  const [output, setOutput] = useState(""); //output

  //Run Button States
  const [isRunning, setIsRunning] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  type SessionDetails = JoinRoomPayload & {
    isRecovery?: boolean;
  };

  const details = location.state as SessionDetails | null;

  useEffect(() => {
    //ide- code updates

    //run button updates
    const handleRunningCodeUpdate = ({
      isRunning,
      output,
    }: ExecutionUpdate) => {
      setOutput(output);
      setIsRunning(isRunning);
    };

    socket.on("code-executed", handleRunningCodeUpdate);

    return () => {
      socket.off("code-executed", handleRunningCodeUpdate);
    };
  }, []);

  useEffect(() => {
    if (!details?.isRecovery || !details.recoveryToken) return;

    const key = `coderoom:${details.roomId}:${details.role}`;

    const savedData = JSON.parse(localStorage.getItem(key) || "{}");

    const handleRoomRestored = () => {
      const liveCode = savedData.studentCode || "";
      const reviewCode = savedData.teacherCode || "";

      // Show both cached versions
      setStudentCode(liveCode);
      setReviewCode(reviewCode);

      // Send only OWN code
      if (details.role === "student") {
        socket.emit("live-code-update", liveCode);
      }

      if (details.role === "teacher") {
        socket.emit("review-code-update", reviewCode);
      }
    };

    const handleRejoinError = (message: string) => {
      console.log("Rejoin failed:", message);
      navigate("/", {
        replace: true,
      });
    };

    // Listen FIRST
    socket.once("room-restored", handleRoomRestored);
    socket.once("rejoin-error", handleRejoinError);

    // Then ask backend to rejoin
    socket.emit("rejoin-room", details);

    return () => {
      socket.off("room-restored", handleRoomRestored);
      socket.off("rejoin-error", handleRejoinError);
    };
  }, [details, navigate]);

  if (!details) return <Navigate to="/" replace />;

  if (details.isRecovery && !details.recoveryToken)
    return <Navigate to="/" replace />;

  const updateExecution = ({ isRunning, output }: ExecutionUpdate) => {
    setIsRunning(isRunning);
    setOutput(output);

    socket.emit("code-running", { isRunning, output });
  };

  const runCode = async () => {
    // let out = "";
    try {
      updateExecution({ isRunning: true, output: "Running..." });
      const response = await fetch(`${backendURL}/api/compile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: "cpp",
          code: studentCode,
          stdin: stdin, //you can also write just stdin
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        updateExecution({
          isRunning: false,
          output: data.error || "Request failed.",
        });

        return;
      }

      if (!data.success) {
        updateExecution({
          isRunning: false,
          output: data.stderr || "Compilation failed.",
        });

        return;
      }

      updateExecution({
        isRunning: false,
        output: data.stdout || "Program finished with no output.",
      });

      console.log(
        `${details.roomId} - Code Execution Commanded By (${details.role}): ${details.username}`,
      );
      // out = data.stdout;
    } catch {
      updateExecution({
        isRunning: false,
        output: "Could not connect to the compiler service.",
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-base-200">
      {/* Top navbar */}
      <header className="navbar border-b border-base-300 bg-base-100 px-4 shadow-sm">
        <div className="flex-1">
          <div>
            <h1 className="text-xl font-bold">Learn IDE</h1>

            <p className="text-sm text-base-content/60">
              Room:
              <span className="ml-1 font-bold">{details.roomId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* <VoiceControls role={details.role} roomId={details.roomId} /> */}
          <VoiceControls
            roomId={details.roomId}
            username={details.username}
            role={details.role}
          />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{details.username}</p>
            <p className="text-xs capitalize text-base-content/60">
              {details.role}
            </p>
          </div>

          <div className="badge badge-primary capitalize">{details.role}</div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Editors */}
        <section className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Student editor */}
          <RunButton isRunning={isRunning} onRun={runCode} />
          <StudentEditor
            studentCode={studentCode}
            setStudentCode={setStudentCode}
            setReviewCode={setReviewCode}
            details={details}
          />

          {/* Review editor */}
          <ReviewEditor
            reviewCode={reviewCode}
            setReviewCode={setReviewCode}
            details={details}
          />
        </section>

        {/* Console */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Input */}
          <InputArea stdin={stdin} setStdin={setStdin} isRunning={isRunning} />

          {/* Output */}
          <OutputWindow isRunning={isRunning} output={output} />
        </section>
      </div>
    </main>
  );
}
