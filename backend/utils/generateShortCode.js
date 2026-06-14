const Url = require('../models/urlModel');

async function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    code = '';
    // Generate length of 5 characters
    const length = 5;
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const existing = await Url.findOne({ where: { shortCode: code } });
    if (!existing) {
      isUnique = true;
    }
  }

  return code;
}

module.exports = generateShortCode;
