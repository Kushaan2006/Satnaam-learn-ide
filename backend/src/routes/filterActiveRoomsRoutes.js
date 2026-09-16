import express from "express";
import { filterActiveRoomsController } from "../controllers/filterActiveRoutesController.js";
const router = express.Router();

router.post("/", filterActiveRoomsController);

export default router;
