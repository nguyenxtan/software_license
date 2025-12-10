const express = require('express');
const {
  getNotifications,
  resendNotification,
} = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getNotifications);
router.post('/:id/resend', authorize('ADMIN', 'MANAGER'), resendNotification);

module.exports = router;
