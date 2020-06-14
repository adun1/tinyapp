const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: [
    'supersecretstringthatshouldideallybesavednotincodebutforsuresuperlong',
    'anotherlongone']

  //Cookie Options
  // maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set("view engine", "ejs");

//needed to remove default data as it will be incompatible with new structure
const urlDatabase = {};

const users = {};

const urlsForUser = function(id) {
  let soln = {};
  for (const urlId in urlDatabase) {
    if (urlDatabase[urlId].user_id === id) {
      soln[urlId] = urlDatabase[urlId];
    }
  }
  return soln;
};

const verifyPassword = function(user_id, password, database) {
  //check if user exists before checking password
  const user = database[user_id];
  if (!user) {
    return false;
  }
  return bcrypt.compareSync(password, user.password);
};

//refactured to make it modular
const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return undefined;
};

//refactured to make it modular
const checkIfUserExists = function(email, database) {
  if (getUserByEmail(email, database) === undefined) return false;
  return true;
};

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
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    res.status(403);
    res.end("Please Register or Login first");
  } else {
    const userUrlDatabase = urlsForUser(user_id);
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
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    res.status(403);
    res.end("Please sign in first");
    return;
  }

  const shortURL = req.params.shortURL;
  const userUrlDatabase = urlsForUser(user_id);
  if (!userUrlDatabase[shortURL]) {
    res.status(403);
    res.end("Please specify a url URL that belongs to you");
  } else {
    let templateVars = {shortURL, longURL: urlDatabase[shortURL].longURL, user};
    res.render('./urls_show', templateVars);
  }
  
  
});

app.get('/u/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400);
    res.end("Please specify an existing short URL");
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

app.get('/register', (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  let templateVars = {user};
  // console.log("req.session = ", req.session);
  res.render('./url_register', templateVars);
});

//created black login catch
app.get('/login', (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  let templateVars = {user};
  // console.log("req.session = ", req.session);
  res.render('./urls_login', templateVars);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>");
});

//note not checking for existing urls yet before adding
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
    // console.log('urlDatabase: ', urlDatabase);
    res.redirect('/urls');
  }
});

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
  //delete the cookie how do we clear cookie?
  req.session = null;
  res.redirect('/login');
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
    //not secure!!
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