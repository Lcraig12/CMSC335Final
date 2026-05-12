const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const crypto = require('crypto');

require("dotenv").config({ path: path.resolve(__dirname, ".env")});

const portNum = 5001;
const uri = process.env.MONGO_CONNECTION_STRING;
const app = express();
const Player = require("./model/Player");

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(uri)
    .then(() => {
        console.log("connected to MongoDB via Mongoose");
        app.listen(portNum, () => { 
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

app.get("/createPlayer", (req, res) => { res.render("createPlayer", { error: null }); });

app.post("/createPlayer", async (req, res) => { 
    try { 
        const formUsername = req.body.username;
        const formPassword = req.body.password;

        const existingPlayer = await Player.findOne({ username: formUsername });
        if (existingPlayer) { 
            return res.render("createPlayer", { error: "Username already taken. Try another!" });
        }

        const hashedPassword = hashWord(formUsername, formPassword);
        const player = new Player({ username: formUsername, password: hashedPassword, worlds: JSON.stringify([]) });
        await player.save();

        res.cookie("username", formUsername);
        res.redirect("/worldList");
    } catch (e) {
        console.error(e);
        res.status(500).send("Server Error: " + e.message);
    }
});

app.get("/returningPlayer", (req, res) => { res.render("returningPlayer"); });

app.post("/returningPlayer", async (req,res) => {
    try { 
        const formUsername = req.body.username;
        const formPassword = req.body.password;
        const player = await Player.findOne({ username: formUsername });

        if (!player) {
            return res.render("returningPlayer", {error: "Player not found!"});
        }

        if (player.password === hashWord(formUsername,formPassword)) {
            res.cookie("username", formUsername);
            res.redirect("/worldList");
        } else {
            return res.render("returningPlayer", { error: "Wrong Password. Try again." });
        }
    } catch (e) { 
        res.send("Server Error");
    }
});

app.get("/worldList", async (req, res) => {
    const username = req.cookies.username;

    if (!username) { 
        return res.redirect("/returningPlayer");
    }

    const player = await Player.findOne({username: username });
    if (!player) return res.redirect("/returningPlayer");
    const worlds = JSON.parse(player.worlds);
    const variable = {player: player,
				worlds: player.worlds,
				wl: getTableFromWorlds(player.worlds, player.username)
				}
    res.render("worldList", variable);
});

app.post("/worldList", async (req, res) => {
    const username = req.body.username;

    if (!username) { 
        return res.redirect("/returningPlayer");
    }

    const player = await Player.findOne({username: username });
    if (!player) return res.redirect("/returningPlayer");
    const worlds = JSON.parse(player.worlds);
	const variable = {player: player,
				worlds: worlds,
				wl: getTableFromWorlds(player.worlds, player.username)
				}
    res.render("worldList", variable);
});

app.post("/play", (req, res) => {
    let { worldname, username, world, newness } = req.body;
    const worldObject = {
        isNew: newness,
        name: worldname,
        world: world,
        username: username
    };
    res.render("open", {
        path: path,
        world: JSON.stringify(worldObject)
    });
});

function getTableFromWorlds(worlds, username) {

    const wv = JSON.parse(worlds);
    let ret = "";
    wv.forEach((e) => {
        const nw = { isNew: false, name: e.name, world: e.world, username: username };
        //console.log(e)
        console.log(e.name);
        ret = ret.concat(`<br>${e.name}<form method="post" action="/play"><input type="text" hidden value="${e.name}" name="worldname">
		<input type="text" hidden value="${username}" name="username">
		<input type="text" hidden value="${e.world}" name="world">
		<input type="text" hidden value="false" name="newness">
		<button type="submit">Play World</button></form>`);
    });
    //ret = ret.concat("</table>");
    return ret;
}

// this function hashes the password (uses the username as a salt because we aren't storing the salt in the database (which is not necessarily a bad thing))
function hashWord(username, password) {//username is used for extra noise
	const hash = crypto.createHash('sha256');
	return hash.update(username.concat(password)).digest('utf8');
}

app.post("/home", async (req,res) => { //this is specifically for when the game gets saved.
    let {world, worldname, username} = req.body;
    //console.log(req.body);
    //this is where database stuff has to happen.

	const player = await Player.findOne({username: username });

    if (!player) {
        console.error(`Player ${username} not found in database.`);
        return res.status(404).send("Player not found");
    }

    let gs = player.worlds;
    let gso = JSON.parse(gs);
    let findex = -1;
    for (let i = 0; i < gso.length; i++) {
		if(gso[i].name === worldname) {
		    findex = i;
		}
    }
    if (findex == -1) {
		//console.error(`Error: Could not find world ${name} in files of user ${username}`);
		gso.push({
			name: worldname,
			world: world
		});
    } else {
		gso[findex].world = world;//this is the part of the code that actually saves it
    }
    let g2 = JSON.stringify(gso);
	
    player.worlds = g2;
    player.markModified('worlds');
	await player.save();
	const variable = {player: player,
				worlds: gso,
				wl: getTableFromWorlds(g2, player.username)
				}
    res.render("worldList", variable);
     //I'm not sure if going directly to home with no fields is correct but that's a problem for later.
});

