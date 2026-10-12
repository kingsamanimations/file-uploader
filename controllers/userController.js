import { body, validationResult, matchedData } from "express-validator";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";


// Extracting validator for users - one entry per field
const validateSignUp = [
    body("username").trim().notEmpty().withMessage("Username is required").isLength({ min: 3, max: 30 }).withMessage("Username name must be 3 to 30 characters long.").isAlphanumeric().withMessage("Username can only contain letters and numbers"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
    body("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords do not match!");
        }
        return true
    }),
];

const signUpGet = (req, res) => {
    res.render("sign-up-form", { errors: [], values: {} });
};

// Rules and Handler exported Together as an array
const signUpPost = [
    validateSignUp,
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            // Return form again with errors and what user typed
            return res.status(400).render("sign-up-form", {
                errors: errors.array(),
                values: req.body,
            });
        }

        try {
            const { username, password } = matchedData(req);
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.create(
                { data: { username, password: hashedPassword }
            });
            res.redirect("/log-in");

        } catch (err) {
             if (err.code === "P2002") {
                // Email already registered (unique validation)
                return res.status(400).render("sign-up-form", {
                    errors: [{ msg: "That username is already registered." }],
                    values: req.body,
                });
            }
            next(err);
            
        }
    },
];

// Exports for log in and log out
const logInGet = (req, res) => {
    const messages = req.session.messages || [];
    req.session.messages = [];
    res.render("log-in-form", { messages });
};

const logOut = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect("/");
    });
};

export default { logInGet, logOut, signUpGet, signUpPost };