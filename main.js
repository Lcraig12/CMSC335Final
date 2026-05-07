

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const crtpyo = require('crypto'); //this is for storing passwords

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

app.get("/createPlayer", (req, res) => { res.render("createPlayer", {error: null}); });

app.post("/createPlayer", async (req, res) => { 
    try { 
        const formUsername = req.body.username;
        const formPassword = req.body.password;
        const formConfirmPassword = req.body.confirmPassword;

        const existingPlayer = await Player.findOne({username: formUsername});

        if (existingPlayer) { 
            return res.render("createPlayer", { error: "Username already taken. Try another!"});
        }

        const player = new Player({ username: formUsername, password: hashWord(formUsername, formPassword), worlds: new Map() });
        const savedPlayer = await player.save();
        console.log("Player saved to DB:", savedPlayer);

        res.cookie("username", formUsername);
        res.redirect("/worldList");

    } catch (e) {
        console.error(e);
        res.status(500).send("Server Error");
    }
});

app.get("/returningPlayer", (req, res) => { res.render("returningPlayer"); });

app.post("/returningPlayer", async (req,res) => {
    try { 
        const formUsername = req.body.username;
        const formPassword = req.body.password;
        const player = await findOne({ username: formUsername });

        if (!player) {
            return res.render("returningPlayer", {error: "Player not found!"});
        }

        if (password === hashWord(formUsername,formPassword)) {
            res.cookie("username", formUsername);
            res.redirect("/worldList");
        } else {
            res.render("returningPlayer", { error: "Wrong Password. Try again." });
        }
    } catch (e) { 
        res.send("Server Error");
    }
});

app.get("/createPlayer", (req, res) => { res.render("createPlayer"); });


app.post("/returningPlayer", (req, res) => { 
    try {
        const player = {
        username: req.body.username,
        password: req.body.password
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

    const player = await findOne({username: username });
    if (!player) return res.redirect("/returningPlayer");
    const worlds = Object.fromEntries(worlds);
    res.render("worldList", { player, worlds });

})


app.post("/play", (req,res) => {
    let {semiworld} = req.body;
    const variables = {
        path: path,
        world: {
			isNew: false,
			name: /*need to get*/,
			world: semiworld,
			username: /*need to get*/
		}
    }
    res.render("open",variables);
});


app.post("/home", async (req,res) => { //this is specifically for when the game gets saved.
    let {world,worldname,username} = req.body;
    //this is where database stuff has to happen.

	const player = await findOne({username: username });
    let gs = player.worlds;
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
	
    player.worlds = g2;

    res.render("homeScreen"); //I'm not sure if going directly to home with no fields is correct but that's a problem for later.
});


//this function takes the raw worlds from the table, the username, and the path, and returns a string containing the table that is ready to be
//inserted into an innerHTML element somewhere. -Ian Note: This is redundant now.
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


// this function hashes the password (uses the username as a salt because we aren't storing the salt in the database (which is not necessarily a bad thing))
function hashword(username, password) {//username is used for extra noise
	const hash = crypto.createHash('sha256');
	return hash.update(username.concat(password)).digest('utf8');
}
