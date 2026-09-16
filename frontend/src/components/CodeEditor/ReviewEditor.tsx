import CodeMirror, { oneDark } from "@uiw/react-codemirror";
import { useEffect } from "react";
import { socket } from "../../services/socket";
import { cpp } from "@codemirror/lang-cpp";
import type { Role } from "../../types/session.types";

type ReviewEditorProps = {
  reviewCode: string;
  setReviewCode: React.Dispatch<React.SetStateAction<string>>;
  details: { username: string; roomId: string; role: Role };
};

export default function ReviewEditor({
  reviewCode,
  setReviewCode,
  details,
}: ReviewEditorProps) {
  useEffect(() => {
    const handleReviewCodeUpdated = ({
      code,
      roomId,
      username,
      role,
    }: {
      code: string;
      roomId: string;
      username: string;
      role: string;
    }) => {
      setReviewCode(code);
      const key = `coderoom:${details.roomId}:${details.role}`;

      const oldData = JSON.parse(localStorage.getItem(key) || "{}");

      localStorage.setItem(
        key,
        JSON.stringify({
          ...oldData,
          teacherCode: code,
        }),
      );
      console.log(`${roomId} - Review sent by (${role}): ${username}`);
    };

    socket.on("review-code-updated", handleReviewCodeUpdated);

    return () => {
      socket.off("review-code-updated", handleReviewCodeUpdated);
    };
  }, []);

  const handleReviewCodeChange = (value: string) => {
    if (details.role !== "teacher") {
      return;
    }

    setReviewCode(value);

    socket.emit("review-code-update", value);
    const key = `coderoom:${details.roomId}:${details.role}`;

    const oldData = JSON.parse(localStorage.getItem(key) || "{}");

    localStorage.setItem(
      key,
      JSON.stringify({
        ...oldData,
        teacherCode: value,
      }),
    );
    console.log(
      `${details.roomId} - Review code edited by: ${details.username}`,
    );
  };

  return (
    <>
      <article className="flex min-h-125 flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
        <header className="flex items-center justify-between border-b border-base-300 px-4 py-3">
          <div>
            <h2 className="font-semibold">Review Workspace</h2>

            <p className="text-xs text-base-content/60">
              {details.role === "teacher" ? "Editable" : "Read only"}
            </p>
          </div>

          <span
            className={`badge badge-sm ${
              details.role === "teacher" ? "badge-success" : "badge-ghost"
            }`}
          >
            {details.role === "teacher" ? "Editing" : "Viewing"}
          </span>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          <CodeMirror
            value={reviewCode}
            height="100%"
            minHeight="500px"
            theme={oneDark}
            extensions={[cpp()]}
            editable={details.role === "teacher"}
            onChange={handleReviewCodeChange}
            className="h-full"
          />
        </div>
      </article>
    </>
  );
}
