import express from "express";
import cors from "cors";

import healthRoutes from "./routes/healthRoutes.js";
import compileRequestRoutes from "./routes/compileRequestRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import filterActiveRoomsRoutes from "./routes/filterActiveRoomsRoutes.js";
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Learn IDE backend!",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/compile", compileRequestRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/filterActiveRooms", filterActiveRoomsRoutes);

export default app;
