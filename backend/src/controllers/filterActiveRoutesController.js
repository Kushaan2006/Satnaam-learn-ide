import filterActiveRoomsService from "../services/filterActiveRoomsService.js";

export const filterActiveRoomsController = async (req, res) => {
  const { sessions } = req.body;
  if (!sessions) return res.status(401).json({ error: "No Session Found" });
  const activeSessions = await filterActiveRoomsService(sessions);
  if (!activeSessions)
    return res.status(401).json({ error: "No active session found" });
  return res.status(200).json({ activeSessions });
};
