const express = require('express');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getDepartments);
router.get('/:id', getDepartment);
router.post('/', authorize('ADMIN'), createDepartment);
router.put('/:id', authorize('ADMIN'), updateDepartment);
router.delete('/:id', authorize('ADMIN'), deleteDepartment);

module.exports = router;
