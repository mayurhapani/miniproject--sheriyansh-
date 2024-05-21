const express = require("express");
const app = express();
port = 8001;

const db = require("./config/database");
const userModel = require("./models/user");
const cookieParser = require("cookie-parser");
const multer = require("multer");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/addUser", async (req, res) => {
  console.log(req.body);

  const { username, name, email, age, password } = req.body;

  try {
    await userModel.create({ username, name, email, age, password });
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, (err) => {
  if (!err) console.log("Server is running on http://localhost:" + port);
});
