import { prisma } from "../lib/prisma.js";

// Controllers for file folders
const getFolders = async (req, res, next) => {
    try {
        const folders = await prisma.folder.findMany({
            where: {
                userId: req.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.render("folders", { folders });
    } catch (err) {
        next (err);
    }
};

const createFolder = async (req, res, next) => {
    try {
        const { name } = req.body;
        
        await prisma.folder.create({
            data: {
                name,
                userId: req.user.id,
            },
        });

        res.redirect("/folders");
    } catch (err) {
        next (err);
    }

};

const getFolder = async (req, res, next) => {
    try {
        const folder = await prisma.folder.findFirst({
            where: {
                id: Number(req.params.folderId),
                userId: req.user.id,
            },
            include: {
                files: true,
            },
        });

        if (!folder) {
            return res.status(404).send("Folder not found");
        }

        res.render("folder", { folder });
    } catch (err) {
        next (err);
    }
};

export default {
    getFolders,
    createFolder,
    getFolder,
};
