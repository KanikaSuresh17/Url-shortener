const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// All routes here are protected by authMiddleware
router.use(authMiddleware);

// Standard User Endpoints
router.post('/', urlController.create);
router.get('/', urlController.list);
router.delete('/:id', urlController.deleteUrl);
router.get('/:id/analytics', urlController.getAnalytics);

// Admin-only Endpoints
router.get('/all', requireAdmin, urlController.listAllAdmin);
router.delete('/admin/:id', requireAdmin, urlController.adminDelete);

module.exports = router;
