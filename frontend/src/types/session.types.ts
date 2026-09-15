export type Role = "student" | "teacher";

export interface JoinRoomPayload {
  username: string;
  roomId: string;
  role: Role;
  recoveryToken?: string;
}

export interface CodeSelection {
  fromLine: number;
  toLine: number;
  selectedText: string;
}

export type ReviewColor = "red" | "yellow" | "green";

export interface ReviewHighlight {
  id: string;
  from: number;
  to: number;
  color: ReviewColor;
}