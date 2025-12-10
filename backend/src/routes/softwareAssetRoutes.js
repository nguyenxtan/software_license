const express = require('express');
const {
  getSoftwareAssets,
  getSoftwareAsset,
  createSoftwareAsset,
  updateSoftwareAsset,
  deleteSoftwareAsset,
  completeRenewal,
  sendReminderEmail,
} = require('../controllers/softwareAssetController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getSoftwareAssets);
router.get('/:id', getSoftwareAsset);
router.post('/', authorize('ADMIN', 'MANAGER'), createSoftwareAsset);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateSoftwareAsset);
router.delete('/:id', authorize('ADMIN'), deleteSoftwareAsset);
router.post('/:id/complete-renewal', authorize('ADMIN', 'MANAGER'), completeRenewal);
router.post('/:id/send-reminder', authorize('ADMIN', 'MANAGER'), sendReminderEmail);

module.exports = router;
