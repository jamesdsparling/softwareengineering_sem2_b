// Req statements
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
// const { emitWarning } = require('process');

// node-express setup
const app = express();
const port = 3000;

// pass.txt should be in root directory containing ONLY 1 LINE with the password for postgres
const buffer = fs.readFileSync("pass.txt");

// DB connection client setup
const client = new Client({
    user: "defaultuser",
    host: "localhost",
    database: "SoftEng",
    password: buffer.toString(), // pass.txt (See gitignore commit messages)
    port: 5432,
});
client.connect();

// Parse urlencoded payloads
app.use(
    express.urlencoded({
        // Allow body objects of any type
        extended: true,
    })
);

// Initialize public folder for unauthenticated access to some files
// Removes the need for manual file serving of unsecured pages & stylesheets
app.use(express.static("public"));

// Setup client sessions to allow persistent logins so long as the server is not restarted
app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true,
    })
);

// TEMPORARY CODE!!!!
// Probably replace with an index type page once it has been made
// Displayed page MUST offer a link to sign in/up 
app.get("/", function(req, res) {
    res.redirect("/Homepage.html"); // redirect("/index") ??? or maybe always attempt dashboard and redirect to index if not logged in
});

// Handle root address. Page served varies depending 
app.get("/dashboard", function(req, res) {
    //Check if logged in
    if (req.session.loggedin) {
        //Check if admin
        if (req.session.admin) {
            // Logged in && admin
            res.sendFile(path.join(__dirname, "/AdminPages/AdminViewMain.html"));
        } else {
            // Logged in && !admin
            res.sendFile(path.join(__dirname, "/UserPages/UserView.html"));
        }
    } else {
        // Not logged in (not admin obviously)
        // Could possibly direct to index page but I like this implementation as users can bookmark the dashboard for easy access
        res.redirect("signin.html");
    }
});

app.get("/tickets", function(req, res) {
    res.sendFile(path.join(__dirname, "/UserPages/ManageTickets.html"))
})

app.post("/api/auth/signin", function(req, res) {
    // Ensure input fields not empty
    if (req.body.email && req.body.password) {
        // Query id and password for user with given email
        client.query("SELECT profile_id, pass FROM profile WHERE email = $1", [req.body.email], (err, dbRes) => {
            if (err) {
                // Branch most likely reached if database is offline or connection interrupted
                // Possibly want a formatted error but for now a stack trace is more useful
                console.log(err.stack)
            } else {
                // Really bad code here. Rushed. Very insecure. Will change later 
                if (dbRes.rows[0] && req.body.password == dbRes.rows[0].pass) { // Plain text password checking :( TODO
                    console.log("Sigining in: " + req.body.email);

                    // express-session setup
                    req.session.loggedin = true;
                    req.session.email = req.body.email;

                    // Assuming admin has id 0. Works so long as only ever one admin.
                    // Might be worth storing this info in the database so that the admin user can be changed easily. Will look into this.
                    if (dbRes.rows[0].profile_id == 1) {
                        console.log("Signed in as admin user")
                        req.session.admin = true;
                    } else {
                        req.session.admin = false;
                    }

                    res.redirect("/dashboard");
                } else {
                    // Causes a redirect for now. Form resubmission is an issue and not a good UX
                    // Will look in to some kind of jquery implementation instead
                    res.send("Incorrect email or password")
                }
            }
        });

    }
});

app.post("/api/auth/signout", function(req, res) {
    console.log("Signing out: " + req.session.email);
    // Destroy login session.
    req.session.destroy();
    // See above comment about dashboard redirect. 
    // DO NOT CHANGE THIS PLEASE, CHANGE THE GET LISTENER INSTEAD
    res.redirect("/");
});

app.post("/api/auth/signup", function(req, res) {
    // Just make sure they entered an email & password.
    // Don't really care about any of the other data yet.
    // firstname / lastname / phonenumber also available in req.body
    if (req.body.email && req.body.password) {
        client.query("INSERT INTO profile(email, pass) VALUES ($1, $2) RETURNING *", [req.body.email, req.body.password], (err, dbRes) => {
            if (err) {
                // Most common error. User already exists.
                if (err.constraint == 'profile_email_key') {
                    // Just redirects for now, will be fixed alongside sign in incorrect password resubmission
                    res.send("User with email " + req.body.email + " already exists.")
                } else {
                    // Other errors printed to console as a stack trace
                    console.log(err.stack);
                }
            } else {
                console.log("New user created")
                    // Log the new user to the console
                console.log(dbRes.rows[0])

                // Automatically logs in the user. No need to go back to signin.html anymore.
                req.session.loggedin = true;
                req.session.email = req.body.email;

                // Attempt a dashboard redirect
                // If login was unsuccessful this wil re-redirect to signin. (Possibly user has cookies disabled??)
                res.redirect('/dashboard');
            }
        })
    }
})

app.listen(port, () => console.log("listening"));