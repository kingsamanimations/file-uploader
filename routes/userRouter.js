import express from "express";
import passport from "passport";
import userController from "../controllers/userController.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.render("index");
});

// Router for the user controller - With get and post
router.get("/log-in", userController.logInGet);
router.post(
    "/log-in",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/log-in",
        failureMessage: true,
    })
);
router.get("/log-out", userController.logOut);

router.get("/sign-up", userController.signUpGet);
router.post("/sign-up", userController.signUpPost);


export default router;