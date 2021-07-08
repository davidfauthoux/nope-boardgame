const express = require("express");
var bodyParser = require("body-parser");

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.get("/", (req, res) => {
  res.send(`<form method="post" action="/">
    <label>Url git : </label>
    <input type="text" id="path" name="path" required>
  </form>`);
});

/**
 app.get('/import', (req, res) => {
  res.redirect("http://localhost:8086/boardgame/cloneApp/import.html");
})**/

// parse the body
app.use(bodyParser.urlencoded({ extended: true }));

const shell = require("shelljs");
const path = "./";
// Access the parse results as request.body
app.post("/", function (request, response) {
  console.log(request.body.path);

  // go to the path and clone the project
  shell.cd(path);
  shell.exec("git clone " + request.body.path);
});