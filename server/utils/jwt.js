const jwt = require('jsonwebtoken');

// Payload is intentionally minimal — just the id. Never embed username/email
// here: they can go stale between when the token was issued and when it's
// read, so routes must always re-fetch the user from the DB.
function sign(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d'
  });
}

function verify(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { sign, verify };
