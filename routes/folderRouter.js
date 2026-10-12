import express from "express";
import folderController from "../controllers/folderController.js";
import { isAuth } from "../middleware/auth.js";

const router = express.Router();

// Router for the folder controller - With get and post
router.get("/", isAuth, folderController.getFolders);

router.post("/", isAuth, folderController.createFolder);

// Folder details
router.get("/:folderId", isAuth, folderController.getFolder);

export default router;