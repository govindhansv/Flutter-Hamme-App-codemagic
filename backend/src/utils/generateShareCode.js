const crypto = require('crypto');

function generateShareCode(name = 'user') {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 10) || 'user';
  return `${base}-${crypto.randomBytes(3).toString('hex')}`;
}

module.exports = generateShareCode;