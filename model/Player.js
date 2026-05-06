const mongoose = require("mongoose");
const {Schema, model } = mongoose;

 const playerSchema = new Schema ({
    usernam: String,
    password: String,
    worlds: Map
 }); 

 const Player = model ("playerSchema", playerSchema);

 