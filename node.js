const fs = require("fs")
const buffer = fs.readFileSync("pass.txt")

const { Pool, Client } = require('pg')

const pool = new Pool({
    user: 'DefaultUser',
    host: 'expertsoftware.duckdns.org',
    database: 'SoftEng',
    password: buffer.toString,
    port: 5432,
})

pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res)
    pool.end()
})

const client = new Client({
    user: 'DefaultUser',
    host: 'expertsoftware.duckdns.org',
    database: 'SoftEng',
    password: buffer.toString,
    port: 5432,
})

client.connect()

client.query('SELECT NOW()', (err, res) => {
    console.log(err, res)
    client.end()
})