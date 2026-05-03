const authRedirect = (req, res, next) => {
    // If the user has a valid token and accesses an auth page, automatically log them out 
    // by clearing the cookie, as per the requirement to securely prevent backward navigation.
    if (req.cookies && req.cookies.token) {
        res.clearCookie("token");
        return res.redirect("/session-expired");
    }
    next();
};

module.exports = { authRedirect };
