
const express = require('express');
const router = express.Router();
const { pool } = require('../config/dbConfig');
const bcrypt = require("bcrypt");




router.get("/", checkAuthenticated, (req, res) => {
    if (req.user.isadmin) {
        res.render("adminPanel");
    } else {
        res.redirect("/dashboard");
    }
});

router.post("/create", async (req, res) => {
    let { name, email, password, password2 } = req.body;

    let errors = [];

    console.log({
        name,
        email,
        password,
        password2
    });

    if (!name || !email || !password || !password2) {
        errors.push({ message: "Please enter all fields" });
    }

    if (password.length < 6) {
        errors.push({ message: "Password must be a least 6 characters long" });
    }

    if (password !== password2) {
        errors.push({ message: "Passwords do not match" });
    }

    if (errors.length > 0) {
        res.render("adminPanel", { errors, name, email, password, password2 });
    } else {
        hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
        // Validation passed
        pool.query(
            `SELECT * FROM users
            WHERE email = $1`,
            [email],
            (err, results) => {
                if (err) {
                    console.log(err);
                }
                if (results.rows.length > 0) {
                    errors.push({ message: "Email already registered" });
                    return res.render("adminPanel", { errors });
                } else {
                    pool.query(
                        `INSERT INTO users (username, password, email, isadmin, name)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id, password`,
                        [name, hashedPassword, email, false, name],
                        (err, results) => {
                            if (err) {
                                console.error(err)
                                throw err;
                            }
                            console.log(results.rows);
                            req.flash("success_msg", "You are now registered. Please log in");
                            res.redirect("/login");
                        }
                    );
                }
            }
        );
    }

});


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
};

module.exports = router;
