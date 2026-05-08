const mongoose = require("mongoose");
const {Schema, model } = mongoose;

const playerSchema = new Schema ({
   username: String,
   password: String,
   worlds: String
}); 

const Player = model("Player", playerSchema);
module.exports = Player;
