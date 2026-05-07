const mongoose = require("mongoose");
const {Schema, model } = mongoose;

const playerSchema = new Schema ({
   username: String,
   password: String,
   worlds: Map //TODO might want to give more detail here - yaniv 
}); 

const Player = model("Player", playerSchema);
module.exports = Player;
