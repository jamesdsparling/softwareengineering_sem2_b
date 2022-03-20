const express = require('express');
const session = require('express-session');
const path = require('path');
// const { emitWarning } = require('process');

const app = express()
const port = 3000;

app.use(express.urlencoded({
    extended: true
}))

// const { Client } = require('pg');
app.use(express.static('public'))

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));




app.get('/', function(req, res) {
    res.redirect('/main')
})

app.get('/main', function(req, res) {
    //Check if logged in
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, '/private/main.html'))
    } else {
        res.redirect('signin.html')
    }
})


app.post('/api/auth/signin', function(req, res) {
    // Ensure input fields not empty
    if (req.body.email && req.body.password) {
        console.log("Sigining in: " + req.session.email);
        req.session.loggedin = true;
        req.session.email = req.body.email;
        res.redirect('/main')
    }
})

app.post('/api/auth/signout', function(req, res) {
    console.log("Signing out: " + req.session.email)
    res.redirect('/main')
    req.session.destroy()
})

app.listen(port, () => console.log('listening'));