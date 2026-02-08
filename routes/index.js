var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get("/", function (req, res) {
  res.render("index");
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.get("/profile", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ email: req.user.email }).populate("posts");
  res.render("profile", { user });
});





router.get("/like/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  if(post.likes.indexOf(req.user.userid) === -1){
    post.likes.push(req.user.userid);
  }
  else{
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }
  
  await post.save();
  res.redirect("/profile");
});

router.get("/edit/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  res.render("edit",{post});
});

router.post("/update/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOneAndUpdate({ _id: req.params.id },{content: req.body.content});
  res.redirect("/profile");
});

router.post("/post", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body;

  let newpost = await postModel.create({
    user: user._id,
    content,
  });
  user.posts.push(newpost._id);
  await user.save();
  res.redirect("/profile");
});

router.get("/delete/:id", isLoggedIn, async (req, res) => {
  await postModel.findByIdAndDelete(req.params.id);
  res.redirect("/profile");
});


router.post("/register", async (req, res) => {
  let { email, password, username, name, age } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        name,
        age,
        email,
        password: hash,
      });
      let token = jwt.sign({ email: email, userid: user._id }, "sceretekey");
      res.cookie("token", token);
      res.redirect("/profile");
    });
  });
});

router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) return res.status(500).send("Something went wrong!");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "sceretekey");
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else res.redirect("/login?error=Wrong password");
  });
});

router.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") res.redirect("/login");
  else {
    let data = jwt.verify(req.cookies.token, "sceretekey");
    req.user = data;
    next();
  }
}

module.exports = router;
