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

var nodemailer = require("nodemailer");

// pass.txt should be in root directory containing ONLY 1 LINE with the password for postgres
const dbPass = fs.readFileSync("pass.txt");

// DB connection client setup
const client = new Client({
    user: "defaultuser",
    host: "localhost",
    database: "SoftEng",
    password: dbPass.toString(), // pass.txt (See gitignore commit messages)
    port: 5432,
});
client.connect();

const emailPass = fs.readFileSync("emailPass.txt");

var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "james.sparling.test.email@gmail.com",
        pass: emailPass.toString(),
    },
});

function presentWithAccess(link, public, user, admin) {
    app.get(link, function (req, res) {
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
            res.redirect("/signin.html");
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
app.get("/", function (req, res) {
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

app.post("/api/auth/signin", function (req, res) {
    // Ensure input fields not empty
    if (req.body.email && req.body.password) {
        // Query id and password for user with given email
        client.query(
            "SELECT profile_id, pass FROM profiles WHERE email = $1",
            [req.body.email],
            (err, dbRes) => {
                if (err) {
                    // Branch most likely reached if database is offline or connection interrupted
                    // Possibly want a formatted error but for now a stack trace is more useful
                    console.log(err.stack);
                } else {
                    // Really bad code here. Rushed. Very insecure. Will change later
                    if (
                        dbRes.rows[0] &&
                        req.body.password == dbRes.rows[0].pass
                    ) {
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
                        console.log("Incorrect email or password");
                        res.send(
                            'Incorrect email or password <br> <a href="/signin.html"><- go back</a>'
                        );
                    }
                }
            }
        );
    }
});

function signOut(req, res) {
    if (req.session.loggedin == true) {
        console.log("Signing out: " + req.session.email);
        // Destroy login session.
        req.session.destroy();
        // See above comment about dashboard redirect.
        // DO NOT CHANGE THIS PLEASE, CHANGE THE GET LISTENER INSTEAD
    }
    res.redirect("/signin.html");
}

app.post("/api/auth/signout", function (req, res) {
    signOut(req, res);
});

app.get("/signout", function (req, res) {
    signOut(req, res);
});

app.post("/api/auth/signup", function (req, res) {
    // Just make sure they entered an email & password.
    // Don't really care about any of the other data yet.
    // firstname / lastname / phonenumber also available in req.body
    if (req.body.email && req.body.password && req.body.password2) {
        if (req.body.password == req.body.password2) {
            client.query(
                "INSERT INTO profiles(email, pass) VALUES ($1, $2) RETURNING *",
                [req.body.email, req.body.password],
                (err, dbRes) => {
                    if (err) {
                        // Most common error. User already exists.
                        if (err.constraint == "profiles_email_key") {
                            // Just redirects for now, will be fixed alongside sign in incorrect password resubmission
                            console.log("User with email already exists");
                            res.send(
                                "User with email " +
                                    req.body.email +
                                    ' already exists. <br> <a href="/signup.html"><- go back</a>'
                            );
                        } else {
                            // Other errors printed to console as a stack trace
                            console.log(err.stack);
                        }
                    } else {
                        console.log("New user created");
                        // Log the new user to the console
                        console.log(dbRes.rows[0]);

                        var mailOptions = {
                            from: "james.sparling.test.email@gmail.com",
                            to: dbRes.rows[0].email,
                            subject: "Parking account created!",
                            text:
                                "You have successfully created an account with the email: " +
                                dbRes.rows[0].email,
                        };

                        transporter.sendMail(
                            mailOptions,
                            function (error, info) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log("Email sent: " + info.response);
                                }
                            }
                        );

                        // Temporary solution. User is still created even if continue is not pressed.
                        res.send(
                            'By clicking continue you agree to accept our <a href="/privacy.html">privacy permissions</a> <br> <a href="/">Continue...</a>'
                        );
                    }
                }
            );
        } else {
            console.log("Passwords do not match!");
            res.send(
                'Passwords do not match! <br> <a href="/signup.html"><- go back</a>'
            );
        }
    }
});

app.post("/api/createTicket", function (req, res) {
    if (
        (req.session.profile_id,
        req.body.appt,
        req.body.hours,
        req.body.space_id)
    ) {
        let price = calculatePrice(parseInt(req.body.hours));
        // client.query("SELECT balance FROM profile WHERE profile_id = $1", [req.session.profile_id], (err, dbRes) => {
        //         if (err) {
        //             console.log(err.stack);
        //         } else {
        //             if (dbRes.rows[0].balance >= price) {

        client.query(
            "SELECT balance FROM profiles WHERE profile_id = $1",
            [req.session.profile_id],
            (err, dbRes) => {
                if (err) {
                    console.log(err.stack);
                } else {
                    if (dbRes.rows[0].balance < price) {
                        console.log("Error: user too broke");
                        res.send(
                            "Balance not sufficient. Please add £" +
                                String((price - dbRes.rows[0].balance) / 100) +
                                " to your account"
                        );
                    } else {
                        client.query(
                            "INSERT INTO tickets(profile_id, space_id, requested_time, stay_hours) VALUES ($1, $2, $3, $4) RETURNING *",
                            [
                                req.session.profile_id,
                                req.body.space_id,
                                req.body.appt,
                                req.body.hours,
                            ],
                            (err, dbRes) => {
                                if (err) {
                                    if (
                                        err.constraint ==
                                        "tickets_int4range_tsrange_excl"
                                    ) {
                                        console.log("Booking conflict");

                                        let appt_date = new Date(req.body.appt);
                                        let appt_end = new Date(
                                            appt_date.getTime() +
                                                req.body.hours * 60 * 60 * 1000
                                        );

                                        getAvailableSpaces(
                                            appt_date,
                                            appt_end,
                                            (freeSpaces) => {
                                                res.send(
                                                    "Sorry, this space is already booked in this time. <br> The following spaces are available at this time though: " +
                                                        freeSpaces.toString() +
                                                        '<br> <a href="/dashboard"><- go back</a>'
                                                );
                                            }
                                        );
                                        
                                    } else {
                                        console.log(err.stack);
                                    }
                                } else {
                                    let booking = dbRes.rows[0];
                                    client.query(
                                        "UPDATE profiles SET balance = balance - $1 WHERE profile_id = $2",
                                        [price, req.session.profile_id],
                                        (err, dbRes) => {
                                            if (err) {
                                                console.log(err.stack);
                                            } else {
                                                console.log(
                                                    "New ticket booked"
                                                );
                                                console.log(booking);
                                                res.send("success");
                                            }
                                        }
                                    );
                                }
                            }
                        );
                    }
                }
            }
        );

        //         } else {
        //             console.log("Fatal error: user too broke");
        //         }
        //     }
        // })
    }
});

function tsrangeOverlap(a_start, a_end, b_start, b_end) {
    if (a_start <= b_start && b_start <= a_end) return true; // b starts in a
    if (a_start <= b_end && b_end <= a_end) return true; // b ends in a
    if (b_start < a_start && a_end < b_end) return true; // a in b
    return false;
}

function getAvailableSpaces(appt_date, appt_end, closure) {
    client.query("SELECT space_id FROM parking_spaces", (err, dbRes) => {
        if (err) {
            console.log(err.stack);
        } else {
            var freeSpaces = dbRes.rows.map((row) => {
                return row.space_id;
            });

            client.query(
                "SELECT space_id, requested_time, end_time FROM tickets",
                (err, dbRes) => {
                    // err & dbRes overridden as no longer needed
                    if (err) {
                        console.log(err.stack);
                    } else {
                        dbRes.rows.forEach((ticket) => {
                            let ticket_start = new Date(ticket.requested_time);
                            let ticket_end = new Date(ticket.end_time);

                            if (
                                tsrangeOverlap(
                                    appt_date,
                                    appt_end,
                                    ticket_start,
                                    ticket_end
                                ) == true
                            ) {
                                let index = freeSpaces.indexOf(ticket.space_id);
                                if (index > -1) {
                                    console.log(
                                        "Space not available: " +
                                            ticket.space_id
                                    );
                                    freeSpaces.splice(index, 1);
                                }
                            }
                        });
                        closure(freeSpaces);
                    }
                }
            );
        }
    });
}

app.post("/api/getAvailableSpaces", function (req, res) {
    if ((req.body.appt, req.body.hours)) {
        let appt_date = new Date(req.body.appt);
        let appt_end = new Date(
            appt_date.getTime() + req.body.hours * 60 * 60 * 1000
        );

        getAvailableSpaces(appt_date, appt_end, (freeSpaces) => {
            console.log(freeSpaces);
            res.send(freeSpaces);
        });
    }
});

app.post("/api/me/updatePlate", function (req, res) {
    if (req.session.loggedin == true) {
        if (req.body.registration_plate) {
            client.query(
                "UPDATE profiles SET registration_plate = $1 WHERE profile_id = $2 RETURNING *",
                [req.body.registration_plate, req.session.profile_id],
                (err, dbRes) => {
                    if (err) {
                        console.log(err.stack);
                    } else {
                        console.log("Registration plate updated");
                        console.log(dbRes.rows[0]);
                        res.send("success");
                    }
                }
            );
        }
    }
});

app.post("/api/admin/updateTicketStatus", function (req, res) {
    if (req.session.admin == true) {
        if ((req.body.ticket_id, req.body.is_accepted)) {
            console.log(req.body.is_accepted);
            if (req.body.is_accepted == "true") {
                client.query(
                    "UPDATE tickets SET is_accepted = true WHERE ticket_id = $1 RETURNING *",
                    [req.body.ticket_id],
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
                    "DELETE FROM tickets WHERE ticket_id = $1 RETURNING *",
                    [req.body.ticket_id],
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

app.post("/api/me/tickets", function (req, res) {
    if (req.session.loggedin == true) {
        client.query(
            "SELECT ticket_id, space_id, requested_time, stay_hours FROM tickets WHERE tickets.profile_id = $1",
            [req.session.profile_id],
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

app.post("/api/me/profiles", function (req, res) {
    if (req.session.loggedin == true) {
        client.query(
            "SELECT cardnum FROM profiles WHERE tickets.profile_id = $1",
            [req.session.profile_id],
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

app.post("/api/admin/tickets", function (req, res) {
    if (req.session.admin == true) {
        client.query(
            "SELECT ticket_id, requested_time, stay_hours, is_accepted, space_id FROM tickets",
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

app.post("/api/admin/updateProfile", function (req, res) {
    if (req.session.admin == true) {
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

function updateProfile(profile_id, field, value) {
    client.query(
        "UPDATE profiles SET $1 = $2 WHERE profile_id = $2 RETURNING *",
        [field, value, profile_id],
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
