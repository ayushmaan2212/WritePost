var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/PostWeb");

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  age: Number,
  email: String,
  password: String,
  posts:{
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Post",
    default: []
  },
});

module.exports = mongoose.model("user", userSchema);
