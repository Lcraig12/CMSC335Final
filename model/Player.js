const mongoose = require("mongoose");
const {Schema, model } = mongoose;

const playerSchema = new Schema ({
   username: String,
   password: String,
   worlds: {type: Map, of: Schema.Types.Mixed, default: {}}
}); 

const Player = model("Player", playerSchema);
module.exports = Player;
