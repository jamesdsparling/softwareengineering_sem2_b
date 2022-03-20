const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
// const { emitWarning } = require('process');

const app = express();
const port = 3000;

const buffer = fs.readFileSync("pass.txt");

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(express.static("public"));

app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true,
    })
);

app.get("/", function(req, res) {
    res.redirect("/main");
});

app.get("/main", function(req, res) {
    //Check if logged in
    if (req.session.loggedin) {
        if (req.session.admin) {
            res.sendFile(path.join(__dirname, "/private/adminDashboard.html"));
        } else {
            res.sendFile(path.join(__dirname, "/private/main.html"));
        }
    } else {
        res.redirect("signin.html");
    }
});

app.post("/api/auth/signin", function(req, res) {
    // Ensure input fields not empty
    if (req.body.email && req.body.password) {
        const client = new Client({
            user: "DefaultUser",
            host: "expertsoftware.duckdns.org",
            database: "SoftEng",
            password: buffer.toString(),
            port: 5432,
        });

        client.connect();
        client.query("SELECT profile_id, pass FROM profile WHERE email = $1", [req.body.email], (err, dbRes) => {
            if (err) {
                console.log(err.stack)
            } else {
                if (req.body.password == dbRes.rows[0].pass) {
                    console.log("Sigining in: " + req.body.email);
                    req.session.loggedin = true;
                    req.session.email = req.body.email;
                    if (dbRes.rows[0].profile_id == 'pf_0') {
                        console.log("Signed in as admin user")
                        req.session.admin = true;
                    } else {
                        req.session.admin = false;
                    }
                    res.redirect("/main");
                } else {
                    res.send("Incorrect password")
                }
            }
            client.end()
        });

    }
});

app.post("/api/auth/signout", function(req, res) {
    console.log("Signing out: " + req.session.email);
    res.redirect("/main");
    req.session.destroy();
});

app.listen(port, () => console.log("listening"));