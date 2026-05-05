
const fs = require("fs");
const express = require("express");
const path = require("path");

process.stdin.setEncoding("utf8");

const portNum = 5001;

const app = express();
 
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));

console.log(`Web server started and running at http://localhost:${portNum}\n`);

app.get("/", (req, res) => {
    res.render("index");
})