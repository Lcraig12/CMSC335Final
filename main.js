

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

// load the .env
require("dotenv").config({ path: path.resolve(__dirname, ".env")});

//constants 
const portNum = 5001;
const uri = process.env.MONGO_CONNECTION_STRING;
const app = express();

//import model 
const Player = require("./model/Player");

// middleware and view engine
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(uri)
    .then(() => {
        console.log("connected to MongoDB via Mongoose");
        app.listen(portNum, async () => { 
            console.log(`Web server started and running at http://localhost:${portNum}\n`);
        });
    })
    .catch(err => console.error(err));

app.get("/", async (req, res) => {
    try {
        const response = await fetch("https://api.animechan.io/v1/quotes/random");
        const quote = await response.json();
        res.render("homeScreen", { quote: quote.data.content });
    } catch (e) {
        res.render("homeScreen", { quote: "Hmm, no advice for now..." }); 
    }
});

app.get("/returningPlayer", (req, res) => { res.render("returningPlayer"); });

app.post("/returningPlayer", async (req,res) => {
    try { 
        const formUsername = req.body.username;
        const formPassword = req.body.password;
        const player = await Player.findOne({ username: formUsername });

        if (!player) {
            return res.render("/returningPlayer", {error: "Player not found!"});
        }

        if (player.password === formPassword) {
            res.cookie("username", formUsername);
            res.redirect("/worldList");
        } else {
            res.render("returningPlayer", { error: "Wrong Password. Try again." });
        }
    } catch (e) {
        console.error(e);
        res.status(500).send("Server Error");
    }
});

app.get("/worldList", async (req, res) => {
    const username = req.cookies.username;

    if (!username) { 
        return res.redirect("/returningPlayer");
    }

    const player = await Player.findOne({username: username });
    const worlds = Object.fromEntries(player.worlds);
    res.render("worldList", { player, worlds });

})


app.post("/play", (req,res) => {
    let {world} = req.body;
    const variables = {
        path: path,
        world:world
    }
    res.render("open",variables);
});

/**
app.post("/home", (req,res) => { //this is specifically for when the game gets saved.
    let {world,worldname,username} = req.body;
    //this is where database stuff has to happen.
    let gs = // some code that gets the worlds vector from the database given the username IMPLEMENT THIS 
    let gso = JSON.parse(gs);
    let findex = -1;
    for (let i = 0; i < gso.length; i++) {
		if(gso[i].name === worldname) {
		    findex = i;
		}
    }
    if (findex == -1) {
		console.error(`Error: Could not find world ${worldname} in files of user ${username}`);
    } else {
		gso[findex].world = world;//this is the part of the code that actually saves it
    }
    let g2 = JSON.stringify(gso);
	
    // now we Need some code that will put g2 back in the database where gs was previously IMPLEMENT THIS TOO

    res.render("homeScreen"); //I'm not sure if going directly to home with no fields is correct but that's a problem for later.
});
*/

//this function takes the raw worlds from the table, the username, and the path, and returns a string containing the table that is ready to be
//inserted into an innerHTML element somewhere. -Ian
function getTableFromWorlds(worlds,username,path) {//this messed up formatting is what I get for writing this in notepad.
	const wv = JSON.parse(worlds);
	let ret = "<table>";
	wv.forEach((e)=>{
		const nw = {
			isNew: false,
			name: e.name,
			world: e.world,
			username: username
		};
		ret = ret.concat(`<tr><td>${e.name}<form method="post" action="${path}/play"><input type="text" hidden value="${JSON.stringify(nw)}" name="world"><button type="submit">Play World</button></form></tr></td>`);
		
	});
	ret = ret.concat("</table>");
	return ret;
}
