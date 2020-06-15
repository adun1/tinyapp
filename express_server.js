const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const {urlsForUser, verifyPassword, getUserByEmail, checkIfUserExists, generateRandomString} = require('./helpers');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: [
    'supersecretstringthatshouldideallybesavednotincodebutforsuresuperlong',
    'anotherlongone']
}));
app.set("view engine", "ejs");

//needed to remove default data as it will be incompatible with new structure
const urlDatabase = {};

const users = {};

app.get('/', (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  //redirect unsigned users to login page
  if (!user) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/users.json', (req, res) => {
  res.json(users);
});

app.get('/urls', (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    res.status(403);
    res.end("Please Register or Login first");
  } else {
    const userUrlDatabase = urlsForUser(user_id, urlDatabase);
    let templateVars = {urls: userUrlDatabase, user};
    res.render('./urls_index', templateVars);
  }
});

//modify to only registered users
app.get('/urls/new', (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  
  //redirect unsigned users to login page
  if (!user) {
    res.redirect('/login');
  } else {
    let templateVars = {user};
    res.render("./urls_new", templateVars);
  }
});

// only show urls that belong to the user when they are logged in
app.get('/urls/:shortURL', (req, res) => {
  //check if user logged in
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    res.status(403);
    res.end("Please sign in first");
    return;
  }

  //show short url in database
  const shortURL = req.params.shortURL;
  const userUrlDatabase = urlsForUser(user_id, urlDatabase);
  if (!userUrlDatabase[shortURL]) {
    res.status(403);
    res.end("Please specify a url URL that belongs to you");
  } else {
    let templateVars = {shortURL, longURL: urlDatabase[shortURL].longURL, user};
    res.render('./urls_show', templateVars);
  }
  
  
});

//redirect to the logurl specified in the shortURL
app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400);
    res.end("Please specify an existing short URL");
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

//Registration page
app.get('/register', (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  let templateVars = {user};
  res.render('./url_register', templateVars);
});

//Signin page
app.get('/login', (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  let templateVars = {user};
  res.render('./urls_login', templateVars);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>");
});

//create a new url if logged in
app.post('/urls', (req, res) => {
  const key = generateRandomString();
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    res.status(403);
    res.end("User must be logged in!\n");
  } else {
    urlDatabase[key] = {longURL: req.body.longURL, user_id};
    res.redirect(`/urls/${key}`);
  }
});

//this route is used to modify an existing url
app.post('/urls/:id', (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  const key = req.params.id;
  if (!user) {
    res.status(403);
    res.end("User must be logged in!!\n");
  } else if (urlDatabase[key].user_id !== user_id) {
    res.status(403);
    res.end("User can only modify their own urls!!\n");
  } else {
    urlDatabase[key].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});

//delete a url if the user making the request owns it
app.post('/urls/:shortURL/delete', (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  const key = req.params.shortURL;
  if (!user) {
    res.status(403);
    res.end("User must be logged in!!!\n");
  } else if (urlDatabase[key].user_id !== user_id) {
    res.status(403);
    res.end("User can only delete their own urls!!!\n");
  } else {
    delete urlDatabase[key];
    res.redirect(`/urls`);
  }
  
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = getUserByEmail(email, users); //id could be undefined checks below

  //make sure the user exists and the provided password is correct
  if ((!checkIfUserExists(email, users)) || (!verifyPassword(id, password, users))) {
    res.status(403);
    res.end("Username and password incorrect");
  } else {
    req.session.user_id = id;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  //check if the id and email are valid
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if ((email === "") || (password === "")) {
    res.status(400);
    res.end("Email and Password required");
  } else if (checkIfUserExists(email, users)) {
    res.status(400);
    res.end("Account with email already exists");
  } else {
    const id = generateRandomString();
    users[id] = {id, email, password: hashedPassword};
    req.session.user_id = id;
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});