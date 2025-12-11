const express = require('express');
const {
  getNotifications,
  resendNotification,
  testScheduler,
} = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getNotifications);
router.post('/:id/resend', authorize('ADMIN', 'MANAGER'), resendNotification);
router.post('/test-scheduler', authorize('ADMIN'), testScheduler);

module.exports = router;
