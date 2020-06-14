const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const urlsForUser = function(id, database) {
  let soln = {};
  for (const urlId in database) {
    if (database[urlId].user_id === id) {
      soln[urlId] = database[urlId];
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

const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return undefined;
};

const checkIfUserExists = function(email, database) {
  if (getUserByEmail(email, database) === undefined) return false;
  return true;
};

const generateRandomString = function() {
  let temp = uuidv4().split('-')[0].slice(2,10);
  return temp;
};

module.exports = {urlsForUser, verifyPassword, getUserByEmail, checkIfUserExists, generateRandomString};