const express = require("express");
const app = express();
port = 8001;

const db = require("./config/database");
const userModel = require("./models/user");
const postModel = require("./models/post");

const cookieParser = require("cookie-parser");
const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const isLogedin = (req, res, next) => {
  try {
    if (!req.cookies.token) {
      res.redirect("/login");
      return;
    }
    const data = jwt.verify(req.cookies.token, "abcdef", (err, decoded) => {
      if (err) {
        res.redirect("/login");
        return;
      }
      return decoded;
    });
    if (data) {
      req.user = data;
      next();
    }
  } catch (err) {
    console.log(err);
  }
};

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/logout", async (req, res) => {
  try {
    res.clearCookie("token");
    res.redirect("/login");
  } catch (err) {
    console.log(err);
  }
});
app.get("/blogs", isLogedin, async (req, res) => {
  console.log(req.user);
  res.render("blogs");
});

app.post("/addUser", async (req, res) => {
  const { username, name, email, age, password } = req.body;

  const user = await userModel.findOne({ email });
  if (user) return res.status(400).send("User already exist!");

  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await userModel.create({ username, name, email, age, password: hash });

    const token = jwt.sign({ email, userid: user._id }, "abcdef");
    res.cookie("token", token);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).send("User Not exist!");

    const result = bcrypt.compare(password, user.password);
    if (!result) return res.redirect("/login");

    res.status(200);
    const token = jwt.sign({ email, userid: user._id }, "abcdef", { expiresIn: "1m" });
    res.cookie("token", token);
    res.redirect("/blogs");
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, (err) => {
  if (!err) console.log("Server is running on http://localhost:" + port);
});
