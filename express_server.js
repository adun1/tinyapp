const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//testing function required
function generateRandomString() {
  let temp = uuidv4().split('-')[0].slice(2,10);
  return temp;
}

app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  let templateVars = {urls: urlDatabase};
  res.render('./urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render("./urls_new");
});

app.get('/urls/:shortURL', (req, res) => {
  // console.log(req.params.shortURL);
  const shortURL = req.params.shortURL;
  let templateVars = {shortURL, longURL: urlDatabase[shortURL]};
  res.render('./urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>");
});

//note not checking for existing urls yet before adding
app.post('/urls', (req, res) => {
  const key = generateRandomString()
  urlDatabase[key] = req.body.longURL;
  res.redirect(`/urls/${key}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});