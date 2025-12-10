const express = require('express');
const multer = require('multer');
const {
  downloadTemplate,
  uploadExcel,
  getImportJobs,
  getImportJob,
  exportExcel,
} = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
    }
  },
});

router.use(authenticate);

router.get('/template', downloadTemplate);
router.post('/import', authorize('ADMIN', 'MANAGER'), upload.single('file'), uploadExcel);
router.get('/jobs', getImportJobs);
router.get('/jobs/:id', getImportJob);
router.get('/export', exportExcel);

module.exports = router;
