const { verify } = require('../utils/jwt');

function auth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'unauthorized' });

  try {
    req.user = verify(token);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = auth;
