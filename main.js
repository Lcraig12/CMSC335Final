
const fs = require("fs");
const express = require("express");
const path = require("path");

const portNum = 5001;

const app = express();
 
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));

app.listen(portNum, () => { 
    console.log(`Web server started and running at http://localhost:${portNum}\n`);
});

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/play", (req,res) => {
    let {world} = req.body;
    const variables = {
        path: path,
        world:world
    }
    res.render("open",variables);
});
