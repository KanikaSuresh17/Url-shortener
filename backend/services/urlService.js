require('dotenv').config();
const validator = require('validator');
const Url = require('../models/urlModel');
const Visit = require('../models/visitModel');
const User = require('../models/userModel');
const sequelize = require('../config/db');
const generateShortCode = require('../utils/generateShortCode');

async function createShortUrl(originalUrl, userId) {
  // Validate URL format
  // Ensure protocol is included or prepend http/https if missing, or use validator with require_protocol
  let formattedUrl = originalUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'http://' + formattedUrl;
  }

  if (!validator.isURL(formattedUrl, { require_protocol: true })) {
    throw { status: 400, message: 'Invalid URL format' };
  }

  const shortCode = await generateShortCode();
  const urlRecord = await Url.create({
    originalUrl: formattedUrl,
    shortCode,
    userId,
  });

  const urlJson = urlRecord.toJSON();
  urlJson.shortUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/${shortCode}`;
  return urlJson;
}

async function getUrlsByUserId(userId) {
  const urls = await Url.findAll({
    where: { userId },
    attributes: {
      include: [
        [
          sequelize.literal(`(
            SELECT MAX("timestamp")
            FROM "visits" AS "visit"
            WHERE "visit"."urlId" = "Url"."id"
          )`),
          'lastVisited'
        ]
      ]
    },
    order: [['createdAt', 'DESC']],
  });
  return urls.map(url => {
    const urlJson = url.toJSON();
    urlJson.shortUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/${url.shortCode}`;
    return urlJson;
  });
}

async function deleteUrl(id, userId) {
  const url = await Url.findOne({ where: { id, userId } });
  if (!url) {
    throw { status: 404, message: 'URL not found or unauthorized' };
  }
  await url.destroy();
  return { message: 'URL deleted successfully' };
}

async function getUrlAnalytics(id, userId, isAdmin = false) {
  const query = isAdmin ? { id } : { id, userId };
  const url = await Url.findOne({ where: query });
  if (!url) {
    throw { status: 404, message: 'URL not found or unauthorized' };
  }

  const totalClicks = await Visit.count({ where: { urlId: id } });
  const lastVisit = await Visit.findOne({
    where: { urlId: id },
    order: [['timestamp', 'DESC']],
  });
  const recentVisits = await Visit.findAll({
    where: { urlId: id },
    order: [['timestamp', 'DESC']],
    limit: 10,
  });

  const urlJson = url.toJSON();
  urlJson.shortUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/${url.shortCode}`;

  return {
    url: urlJson,
    totalClicks,
    lastVisited: lastVisit ? lastVisit.timestamp : null,
    recentVisits,
  };
}

async function redirectShortCode(shortCode, ip, userAgent) {
  const url = await Url.findOne({ where: { shortCode } });
  if (!url) {
    throw { status: 404, message: 'Short URL not found' };
  }

  // Increment clicks
  url.clicks += 1;
  await url.save();

  // Create visit record
  await Visit.create({
    urlId: url.id,
    ip,
    userAgent,
  });

  return {
    originalUrl: url.originalUrl,
    urlId: url.id,
    shortCode: url.shortCode,
    clicks: url.clicks,
  };
}

// Admin Services
async function getAllUrlsAdmin() {
  const urls = await Url.findAll({
    attributes: {
      include: [
        [
          sequelize.literal(`(
            SELECT MAX("timestamp")
            FROM "visits" AS "visit"
            WHERE "visit"."urlId" = "Url"."id"
          )`),
          'lastVisited'
        ]
      ]
    },
    include: [{
      model: User,
      attributes: ['email'],
    }],
    order: [['createdAt', 'DESC']],
  });
  return urls.map(url => {
    const urlJson = url.toJSON();
    urlJson.shortUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/${url.shortCode}`;
    return urlJson;
  });
}

async function adminDeleteUrl(id) {
  const url = await Url.findOne({ where: { id } });
  if (!url) {
    throw { status: 404, message: 'URL not found' };
  }
  await url.destroy();
  return { message: 'URL deleted by admin successfully' };
}

module.exports = {
  createShortUrl,
  getUrlsByUserId,
  deleteUrl,
  getUrlAnalytics,
  redirectShortCode,
  getAllUrlsAdmin,
  adminDeleteUrl,
};
