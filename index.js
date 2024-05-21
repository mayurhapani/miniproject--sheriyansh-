const express = require("express");
const db = require("./config/database");
const app = express();
port = 8001;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {});

app.listen(8002, (err) => {
  if (!err) console.log("Server is running on http://localhost:" + port);
});
