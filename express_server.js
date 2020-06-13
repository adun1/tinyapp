const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

const verifyPassword = function(user_id, password) {
  console.log('verify password, user[user_id]', console.log(users[user_id]));
  return (users[user_id].password === password);
};

const findUser = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return undefined;
};

const checkIfUserExists = function(email) {
  if (findUser(email) === undefined) return false;
  return true;
};
//testing function required
const generateRandomString = function() {
  let temp = uuidv4().split('-')[0].slice(2,10);
  return temp;
};

app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/users.json', (req, res) => {
  res.json(users);
});

app.get('/urls', (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  let templateVars = {urls: urlDatabase, user};
  res.render('./urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  let templateVars = {user};
  res.render("./urls_new", templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  let templateVars = {shortURL, longURL: urlDatabase[shortURL], user};
  res.render('./urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  let templateVars = {user};
  // console.log("req.cookies = ", req.cookies);
  res.render('./url_register', templateVars);
});

//created black login catch
app.get('/login', (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  let templateVars = {user};
  // console.log("req.cookies = ", req.cookies);
  res.render('./urls_login', templateVars);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>");
});

//note not checking for existing urls yet before adding
app.post('/urls', (req, res) => {
  const key = generateRandomString();
  urlDatabase[key] = req.body.longURL;
  res.redirect(`/urls/${key}`);
});

//this route is used to modify an existing url
app.post('/urls/:id', (req, res) => {
  const key = req.params.id;
  urlDatabase[key] = req.body.longURL;
  // console.log('urlDatabase: ', urlDatabase);
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const key = req.params.shortURL;
  delete urlDatabase[key];
  res.redirect(`/urls`);
});

//need to update to check if user exists and password is correct
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = findUser(email); //id could be undefined checks below

  //make sure the user exists and the provided password is correct
  if ((!checkIfUserExists(email)) || (!verifyPassword(id, password))) {
    res.status(403);
    res.end("Username and password incorrect");
  } else {
    res.cookie('user_id', id);
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  //delete the cookie
  res.clearCookie('user_id', '');
  res.redirect('/urls');
});

//not checking that both email and pass supplied "" is allowed for emal and pass
app.post('/register', (req, res) => {
  //check if the id and email are value
  if ((req.body.email === "") || (req.body.password === "")) {
    res.status(400);
    res.end("Email and Password required");
  } else if (checkIfUserExists(req.body.email)) {
    res.status(400);
    //not secure!!
    res.end("Account with email already exists");
  } else {
    const id = generateRandomString();
    users[id] = {id, email: req.body.email, password: req.body.password};
    res.cookie('user_id', id);
  
    console.log("users = ", users);
    console.log("users[user_id] = ", users[id]);
  
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});