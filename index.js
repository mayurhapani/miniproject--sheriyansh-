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
  const user = await userModel.findOne({ email: req.user.email }).populate("posts");
  res.render("blogs", { user });
});
app.get("/like/:id", isLogedin, async (req, res) => {
  const post = await postModel.findOne({ _id: req.params.id }).populate("user");

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }

  await post.save();
  res.redirect("/blogs");
});
app.get("/delete/:id", isLogedin, async (req, res) => {
  try {
    const postId = req.params.id;
    const userEmail = req.user.email;

    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).send("Post not found");
    }

    if (post.userId != req.user._id) {
      return res.status(403).send("Unauthorized");
    }

    const user = await userModel.findOne({ email: userEmail });
    const postIndex = user.posts.indexOf(postId);
    if (postIndex > -1) {
      user.posts.splice(postIndex, 1);
    } else {
      return res.status(404).send("Post not found in user's posts");
    }

    await postModel.findByIdAndDelete(postId);
    await user.save();

    res.redirect("/blogs");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/editPost/:id", isLogedin, async (req, res) => {
  const post = await postModel.findOne({ _id: req.params.id }).populate("user");
  res.render("edit", { post });
});

// app.get("/delete/:id", isLogedin, async (req, res) => {
//   try {
//     const post = await postModel.findOne({ _id: req.params.id });
//     const user = await userModel.findOne({ email: req.user.email });
//     user.posts.splice(user.posts.indexOf(req.params.id), 1);
//     await postModel.findOneAndDelete({ _id: req.params.id });
//     await user.save();
//     res.redirect("/blogs");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Internal Server Error");
//   }
// });

app.post("/addUser", async (req, res) => {
  const { username, name, email, age, password } = req.body;

  const user = await userModel.findOne({ email });
  if (user) return res.status(400).send("User already exist!");

  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await userModel.create({ username, name, email, age, password: hash });

    const token = jwt.sign({ email, userid: user._id }, "abcdef");
    res.cookie("token", token);
    res.redirect("/login");
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
    const token = jwt.sign({ email, userid: user._id }, "abcdef", { expiresIn: "24h" });
    res.cookie("token", token);
    res.redirect("/blogs");
  } catch (err) {
    console.log(err);
  }
});

app.post("/post", isLogedin, async (req, res) => {
  try {
    const { content } = req.body;
    const user = await userModel.findOne({ email: req.user.email });

    let post = await postModel.create({
      user: user._id,
      content,
    });

    user.posts.push(post._id);
    await user.save();

    res.redirect("/blogs");
  } catch (err) {
    console.log(err);
  }
});
app.post("/editPost/:id", isLogedin, async (req, res) => {
  try {
    const post = await postModel.findOneAndUpdate(
      { _id: req.params.id },
      { content: req.body.content }
    );

    res.redirect("/blogs");
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, (err) => {
  if (!err) console.log("Server is running on http://localhost:" + port);
});
