const basicAuth = require('basic-auth');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2000';

module.exports = function authMiddleware(req, res, next) {
  const credentials = basicAuth(req);

  if (!credentials || credentials.name !== ADMIN_USERNAME || credentials.pass !== ADMIN_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Login"');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
};