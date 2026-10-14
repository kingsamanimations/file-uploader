import express from "express";
import { isAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";



// Helper for downloading
function downloadUrl(url) {
    return url.replace("/upload/", "/upload/fl_attachment/");
}


const router = express.Router();

// 1 to 30 days, or null if invalid
function parseDays(value) {
    const match = /^(\d+)d$/.exec(String(value).trim());
    if (!match) return null;
    const days = Number(match[1]);
    return days >= 1 && days <= 30 ? days : null; 
}

// Finding owned folders
async function findOwnedFolder(req) {
    return prisma.folder.findFirst({
        where: { id: Number(req.params.folderId), userId: req.user.id },
    });
}

// Owner routes when logged in
router.get("/folders/:folderId/share", isAuth, async (req, res, next) => {
    try {
        const folder = await findOwnedFolder(req);
        if (!folder) return res.status(404).send("Folder not found");
        res.render("share-form", { folder, error: null });
    } catch (err) {
      next(err);  
    }
})

router.post("/folders/:folderId/share", isAuth, async (req, res, next) => {
    try {
        const folder = await findOwnedFolder(req);
        if (!folder) return res.status(404).send("Folder not found");

        const days = parseDays(req.body.duration);
        if (!days) {
            return res.status(400).render("share-form", {
                folder,
                error: "Enter a duration like 1d, 10d, or 30d (1 to 30 days).",
            });
        }

        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        const link = await prisma.shareLink.create({
            data: { folderId: folder.id, expiresAt },
        });

        const url = `${req.protocol}://${req.get("host")}/share/${link.id}`;
        res.render("share-created", { folder, url, expiresAt });
    } catch (err) {
        next(err)
    }
});

// Public routes
async function findValidLink(shareId) {
    const link = await prisma.shareLink.findUnique({
        where: { id: shareId },
        include: { folder: { include: { files: true } } },
    });
    if (!link || link.expiresAt < new Date()) return null;
    return link;
}

router.get("/share/:shareId", async (req, res, next) => {
    try {
        const link = await findValidLink(req.params.shareId);
        if (!link) return res.status(404).send("This link is either invalid or expired");
        res.render("shared-folder.ejs", { link, folder: link.folder });
    } catch (err) {
      next(err);  
    }
})

router.get("/share/:shareId/files/:fileId/download", async (req, res, next) => {
    try {
        const link = await findValidLink(req.params.shareId);
        if (!link) return res.status(404).send("This link is either invalid or expired");
        
        // Only files inside the share folder can be fetched
        const file = link.folder.files.find((f) => f.id === Number(req.params.fileId));
        
        if (!file) return res.status(404).send("File not found");

        res.redirect(downloadUrl(file.url));
    } catch (err) {
      next(err);  
    }
});

export default router;