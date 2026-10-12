// Reusable guard for the join button
export function isAuth (req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/log-in");
};

/* exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.is_admin) return next();
    res.status(403).send("Forbidden");
}; */