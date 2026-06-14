const urlService = require('../services/urlService');

async function create(req, res, next) {
  try {
    const { originalUrl, longUrl } = req.body;
    const targetUrl = originalUrl || longUrl;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Original URL is required' });
    }

    const newUrl = await urlService.createShortUrl(targetUrl, req.userId);
    res.status(201).json(newUrl);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const urls = await urlService.getUrlsByUserId(req.userId);
    res.json(urls);
  } catch (err) {
    next(err);
  }
}

async function deleteUrl(req, res, next) {
  try {
    const { id } = req.params;
    const result = await urlService.deleteUrl(Number(id), req.userId);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

async function updateUrl(req, res, next) {
  try {
    const { id } = req.params;
    const { originalUrl } = req.body;
    if (!originalUrl) {
      return res.status(400).json({ error: 'New URL is required' });
    }
    const updated = await urlService.updateUrl(Number(id), req.userId, originalUrl);
    res.json(updated);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

async function getAnalytics(req, res, next) {
  try {
    const { id } = req.params;
    const isAdmin = req.userRole === 'admin';
    const analytics = await urlService.getUrlAnalytics(Number(id), req.userId, isAdmin);
    res.json(analytics);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

// Admin Controller Handlers
async function listAllAdmin(req, res, next) {
  try {
    const urls = await urlService.getAllUrlsAdmin();
    res.json(urls);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const { id } = req.params;
    const result = await urlService.adminDeleteUrl(Number(id));
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = {
  create,
  list,
  deleteUrl,
  updateUrl,
  getAnalytics,
  listAllAdmin,
  adminDelete,
};
