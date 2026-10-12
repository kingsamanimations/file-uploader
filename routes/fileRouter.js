import express from "express";
import multer from "multer";
import { isAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { uploadBuffer } from "../lib/cloudinary.js"


// A router for the file uploading
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/folders/:folderId/upload", isAuth, async (req, res, next) => {
    try {
        const folder = await prisma.folder.findFirst({
            where: {
                id: Number(req.params.folderId),
                userId: req.user.id,
            },
        });

        if (!folder) {
            return res.status(404).send("Folder not found");
        }

        res.render("upload-form", { folder });
    } catch (err) {
        next(err);
    }
});

router.post("/folders/:folderId/upload", isAuth, upload.single("file"), async (req, res, next) => {
    try {
        const folder = await prisma.folder.findFirst({
            where: {
                id: Number(req.params.folderId),
                // Preventing upload to someone else's account
                userId: req.user.id,
            },
        });

        if (!folder) {
            return res.status(404).send("Folder not found");
        }

        const result = await uploadBuffer(req.file.buffer, `file-uploader/${req.user.id}`);

        await prisma.file.create({
            data: {
                filename: req.file.originalname,
                url: result.secure_url,
                publicId: result.public_id,
                path: req.file.path,
                size: req.file.size,
                userId: req.user.id,
                folderId: folder.id,
                path: string
            },
        });

        res.redirect(`/folders/${folder.id}`);
    } catch (err) {
        next(err);
    }
});

// For download route
router.get("/files/:fileId/download", isAuth, async (req, res, next) => {
    try {
        const file = await prisma.file.findUnique({
            where: {
                id: Number(req.params.fileId),
                userId: req.user.id,
            },
        });

        if (!file) {
            return res.status(404).send("File not found");
        }

        res.redirect(file.url);
    } catch (err) {
        next(err);
    }
});

// File details
router.get("/files/:fileId", isAuth, async (req, res, next) => {
    try {
        const file = await prisma.file.findUnique({
            where: {
                id: Number(req.params.fileId),
                userId: req.user.id,
            },
        });

        if (!file) {
            return res.status(404).send("File not found");
        }

        res.render("file-details", { file });
    } catch (err) {
        next(err);
    }
});

export default router;