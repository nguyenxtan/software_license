const express = require('express');
const { getSummary, getExpiringAssets } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/expiring', getExpiringAssets);

module.exports = router;
