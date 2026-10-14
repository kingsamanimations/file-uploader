import "dotenv/config";
import path from "node:path";
import express from "express";
import session from "express-session";
import passport from "passport";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { prisma } from "./lib/prisma.js";
import "./config/passport.js";
import userRouter from "./routes/userRouter.js";
import fileRouter from "./routes/fileRouter.js";
import folderRouter from "./routes/folderRouter.js";
import shareRouter from "./routes/shareRouter.js";

const app = express();
app.set("views", path.join(import.meta.dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
    }),
}));

app.use(passport.initialize());
app.use(passport.session());


// Acces to the current user variable in all views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use("/", userRouter);

//NEW: Added file router for uploading files
app.use("/", fileRouter);

//NEW: Added folder router for uploading files
app.use("/folders", folderRouter);

//NEW: Added share router for sharing files
app.use("/", shareRouter);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).send("Something broke!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}!`);
});