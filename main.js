
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
    res.render("homeScreen");
});

app.post("/play", (req,res) => {
    let {world} = req.body;
    const variables = {
        path: path,
        world:world
    }
    res.render("open",variables);
});

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
