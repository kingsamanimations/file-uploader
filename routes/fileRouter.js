import express from "express";
import multer from "multer";
import { isAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { uploadBuffer } from "../lib/cloudinary.js"

// Helper for downloading
function downloadUrl(url) {
    return url.replace("/upload/", "/upload/fl_attachment/");
}

// A router for the file uploading
const router = express.Router();

// File Limits and a type filter to multer
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.minetype)) return cb(null, true);
        const err = new Error("That file type isn't allowed. Please use an image, pdf, gif, or text file");
        err.isValidation = true;
        cb(err);
    },
});

// Helper for showing errors on the form
function handleUpload(req, res, next) {
    upload.single("file")(req, res, async (err) => {
        if (!err) return next();
        if (!(err instanceof multer.MulterError) && !err.isValidation) return next(err);

        const message = 
          err.code === "LIMIT_FILE_SIZE"
          ? "That file is too large. The limit is 5 MB."
          : err.message;

        try {
            const folder = await prisma.folder.findFirst({
                where: { id: Number(req.params.folderId), userId: req.user.id },
            });
            if (!folder) return res.status(404).send("Folder not found");
            res.status(400).render("upload-form", { folder, error: message });
        } catch (e) {
            next(e);
        }
    });
}

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

router.post("/folders/:folderId/upload", isAuth, handleUpload, async (req, res, next) => {
    // Folder check against a missing file
    if (!req.file) {
        return res.status(400).render("upload-form", { folder, error: "Please choose a file." });
    }
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
                size: req.file.size,
                userId: req.user.id,
                folderId: folder.id,
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

        res.redirect(downloadUrl(file.url));
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