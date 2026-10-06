import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { prisma } from "./lib/prisma.js";

import path from "node:path";
import express from "express";
//Storing reall session memory in a database I have
import { pgSession } from "connect-pg-simple"(session);

import passport from "passport";
import "./config/passport";
import userRouter from "./routes/userRouter";

import app from "express";

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


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
app.use(express.urlencoded({ extended: false }));


// Acces to the current user variable in all views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use("/", userRouter);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).send("Something broke!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}!`);
});