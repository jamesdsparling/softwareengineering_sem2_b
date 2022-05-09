// Req statements
const express = require("express");
const session = require("express-session");
const res = require("express/lib/response");
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

function presentWithAccess(client, public, user, admin) {
    app.get(client, function(req, res) {
        //Check if logged in
        if (req.session.loggedin) {
            //Check if admin
            if (req.session.admin) {
                // Logged in && admin
                res.sendFile(path.join(__dirname, admin));
            } else {
                // Logged in && !admin
                res.sendFile(path.join(__dirname, user));
            }
        } else {
            // Not logged in (not admin obviously)
            // Could possibly direct to index page but I like this implementation as users can bookmark the dashboard for easy access
            res.redirect(public);
        }
    });
}

function calculatePrice(hours) {
    switch (hours) {
        case 2:
            return 300;
        case 3:
            return 350;
        case 4:
            return 450;
        case 5:
            return 550;
        case 6:
            return 650;
        case 7:
            return 750;
        case 24:
            return 1500;
        case 48:
            return 2500;
        case 72:
            return 3500;
        case 96:
            return 4500;
        case 120:
            return 5500;
        case 144:
            return 6500;
        case 168:
            return 7500;
        case 192:
            return 8500;
        case 216:
            return 9500;
        case 240:
            return 10000;
        default:
            return 0;
    }
}

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
presentWithAccess(
    "/dashboard",
    "signin.html",
    "/UserPages/UserView.html",
    "/AdminPages/AdminViewMain.html"
);
presentWithAccess(
    "/tickets",
    "signin.html",
    "/UserPages/ManageTicket.html",
    "/AdminPages/AdminTicketReq.html"
);
presentWithAccess(
    "/help",
    "signin.html",
    "/UserPages/UserGetHelp.html",
    "/AdminPages/AdminViewMain.html"
);
presentWithAccess(
    "/addbalance",
    "signin.html",
    "/UserPages/AddBalance.html",
    "/AdminPages/AdminViewMain.html"
);
presentWithAccess(
    "/settings",
    "signin.html",
    "/UserPages/UserSettings.html",
    "/AdminPages/AdminViewMain.html"
);
presentWithAccess(
    "/messages",
    "signin.html",
    "/UserPages/UserMessages.html",
    "/AdminPages/AdminMessages.html"
);
presentWithAccess(
    "/map",
    "signin.html",
    "/UserPages/UserView.html",
    "/AdminPages/ManageMap.html"
);
presentWithAccess(
    "/modifyuser",
    "signin.html",
    "/UserPages/UserView.html",
    "/AdminPages/ModifyUser.html"
);

app.post("/api/auth/signin", function(req, res) {
    // Ensure input fields not empty
    if (req.body.email && req.body.password) {
        // Query id and password for user with given email
        client.query(
            "SELECT profile_id, pass FROM profiles WHERE email = $1", [req.body.email],
            (err, dbRes) => {
                if (err) {
                    // Branch most likely reached if database is offline or connection interrupted
                    // Possibly want a formatted error but for now a stack trace is more useful
                    console.log(err.stack);
                } else {
                    // Really bad code here. Rushed. Very insecure. Will change later
                    if (dbRes.rows[0] && req.body.password == dbRes.rows[0].pass) {
                        // Plain text password checking :( TODO
                        console.log("Sigining in: " + req.body.email);

                        // express-session setup
                        req.session.loggedin = true;
                        req.session.email = req.body.email;
                        req.session.profile_id = dbRes.rows[0].profile_id;

                        // Assuming admin has id 0. Works so long as only ever one admin.
                        // Might be worth storing this info in the database so that the admin user can be changed easily. Will look into this.
                        if (dbRes.rows[0].profile_id == 1) {
                            console.log("Signed in as admin user");
                            req.session.admin = true;
                        } else {
                            req.session.admin = false;
                        }

                        res.redirect("/dashboard");
                    } else {
                        // Causes a redirect for now. Form resubmission is an issue and not a good UX
                        // Will look in to some kind of jquery implementation instead
                        res.send("Incorrect email or password");
                    }
                }
            }
        );
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
        client.query(
            "INSERT INTO profiles(email, pass) VALUES ($1, $2) RETURNING *", [req.body.email, req.body.password],
            (err, dbRes) => {
                if (err) {
                    // Most common error. User already exists.
                    if (err.constraint == "profiles_email_key") {
                        // Just redirects for now, will be fixed alongside sign in incorrect password resubmission
                        res.send("User with email " + req.body.email + " already exists.");
                    } else {
                        // Other errors printed to console as a stack trace
                        console.log(err.stack);
                    }
                } else {
                    console.log("New user created");
                    // Log the new user to the console
                    console.log(dbRes.rows[0]);

                    // Automatically logs in the user. No need to go back to signin.html anymore.
                    // req.session.loggedin = true;
                    // req.session.email = req.body.email;

                    // Attempt a dashboard redirect
                    // If login was unsuccessful this wil re-redirect to signin. (Possibly user has cookies disabled??)
                    res.redirect("/");
                }
            }
        );
    }
});

app.post("/api/createTicket", function(req, res) {
    if ((req.session.profile_id, req.body.appt, req.body.hours, req.body.space_id)) {
        let price = calculatePrice(parseInt(req.body.hours))
            // client.query("SELECT balance FROM profile WHERE profile_id = $1", [req.session.profile_id], (err, dbRes) => {
            //         if (err) {
            //             console.log(err.stack);
            //         } else {
            //             if (dbRes.rows[0].balance >= price) {
        client.query("UPDATE profiles SET balance = balance - $1 WHERE profile_id = $2", [price, req.session.profile_id], (err, dbRes) => {
                if (err) {
                    if (err.constraint = "profiles_balance_check") {
                        console.log("Fatal error: user too broke")
                    } else {
                        console.log(err.stack);
                    }
                } else {
                    client.query("INSERT INTO tickets(profile_id, space_id, requested_time, stay_hours) VALUES ($1, $2, $3, $4) RETURNING *", [req.session.profile_id, req.body.space_id, req.body.appt, req.body.hours], (err, dbRes) => {
                        if (err) {
                            console.log(err.stack)
                        } else {
                            console.log("New ticket booked")
                            console.log(dbRes.rows)
                            res.redirect("/tickets")
                        }
                    })
                }
            })
            //         } else {
            //             console.log("Fatal error: user too broke");
            //         }
            //     }
            // })
    }
});

app.post("/api/me/updatePlate", function(req, res) {
    if (req.body.registration_plate) {
        client.query(
            "UPDATE profiles SET registration_plate = $1 WHERE profile_id = $2 RETURNING *", [req.body.registration_plate, req.session.profile_id],
            (err, dbRes) => {
                if (err) {
                    console.log(err.stack);
                } else {
                    console.log("Registration plate updated");
                    console.log(dbRes.rows[0]);
                    res.redirect("back");
                }
            }
        );
    }
});

app.post("/api/admin/updateTicketStatus", function(req, res) {
    if (req.session.admin) {
        if ((req.body.ticket_id, req.body.is_accepted)) {
            console.log(req.body.is_accepted)
            if (req.body.is_accepted == "true") {
                client.query(
                    "UPDATE tickets SET is_accepted = true WHERE ticket_id = $1 RETURNING *", [req.body.ticket_id],
                    (err, dbRes) => {
                        if (err) {
                            console.log(err.stack);
                        } else {
                            console.log("Ticket status updated");
                            console.log(dbRes.rows[0]);
                            res.redirect("/dashboard");
                        }
                    }
                );
            } else {
                client.query(
                    "DELETE FROM tickets WHERE ticket_id = $1 RETURNING *", [req.body.ticket_id],
                    (err, dbRes) => {
                        if (err) {
                            console.log(err.stack);
                        } else {
                            console.log("ticket status updated");
                            console.log(dbRes.rows[0]);
                            res.redirect("/dashboard");
                        }
                    }
                );
            }
        }
    }
});

app.post("/api/me/tickets", function(req, res) {
    client.query(
        "SELECT ticket_id, start_time, end_time FROM tickets WHERE tickets.profile_id = $1", [req.session.profile_id],
        (err, dbRes) => {
            if (err) {
                console.log(err.stack);
            } else {
                res.send(dbRes.rows);
            }
        }
    );
});

app.post("/api/me/profiles", function(req, res) {
    client.query(
        "SELECT cardnum FROM profiles WHERE tickets.profile_id = $1", [req.session.profile_id],
        (err, dbRes) => {
            if (err) {
                console.log(err.stack);
            } else {
                res.send(dbRes.rows);
            }
        }
    );
});

app.post("/api/admin/tickets", function(req, res) {
    if (req.session.admin) {
        client.query(
            "SELECT ticket_id, start_time, end_time, is_accepted FROM tickets",
            (err, dbRes) => {
                if (err) {
                    console.log(err.stack);
                } else {
                    res.send(dbRes.rows);
                }
            }
        );
    }
});

// app.post("/api/me/messages", function(req, res) {
//     client.query(
//         "SELECT * FROM messages WHERE from_profile = $1 OR to_profile = $1", [req.session.profile_id],
//         (err, dbRes) => {
//             if (err) {
//                 console.log(err.stack);
//             } else {
//                 res.send(dbRes.rows);
//             }
//         }
//     );
// });

// app.post("/api/sendMessage", function(req, res) {
//     if (req.body.message) {
//         client.query(
//             "INSERT INTO messages(message, from_profiles, to_profiles) VALUES ($1, $2, $3) RETURNING *", [req.body.message, req.session.profile_id, 1],
//             (err, dbRes) => {
//                 if (err) {
//                     console.log(err.stack);
//                 } else {
//                     console.log("Sent message");
//                     console.log(dbRes.rows[0]);
//                     res.redirect("/dashboard");
//                 }
//             }
//         );
//     }
// });

// app.post("/api/admin/sendMessage", function(req, res) {
//     if (req.session.admin) {
//         if ((req.body.message, to_profile)) {
//             client.query(
//                 "INSERT INTO messages(message, from_profile, to_profiles) VALUES ($1, $2, $3) RETURNING *", [req.body.message, 1, req.body.to_profiles],
//                 (err, dbRes) => {
//                     if (err) {
//                         console.log(err.stack);
//                     } else {
//                         console.log("Sent message");
//                         console.log(dbRes.rows[0]);
//                         res.redirect("/dashboard");
//                     }
//                 }
//             );
//         }
//     }
// });

app.post("/api/admin/updateProfile", function(req, res) {
    if (req.session.admin) {
        if (req.body.profile_id) {
            if (req.body.email) {
                updateProfile("email", req.body.email, req.body.profile_id);
            }
            if (req.body.pass) {
                updateProfile("pass", req.body.pass, req.body.profile_id);
            }
        }
    }
});

// app.post("/api/getSpaces")

function updateProfile(profile_id, field, value) {
    client.query(
        "UPDATE profiles SET $1 = $2 WHERE profile_id = $2 RETURNING *", [field, value, profile_id],
        (err, dbRes) => {
            if (err) {
                console.log(err.stack);
            } else {
                console.log("Profile updated");
                console.log(dbRes.rows[0]);
                res.redirect("/dashboard");
            }
        }
    );
}

app.listen(port, () => console.log("listening"));
