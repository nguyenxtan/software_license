const excelService = require('../services/excelService');
const prisma = require('../config/database');

const downloadTemplate = async (req, res) => {
  try {
    const buffer = excelService.generateTemplate();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template-import-phan-mem.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ error: 'Tải template thất bại' });
  }
};

const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file để upload' });
    }

    const result = await excelService.importFromExcel(req.file.buffer, req.user.id);

    res.json({
      message: 'Upload thành công',
      importJob: result.importJob,
      summary: {
        total: result.results.total,
        success: result.results.success,
        failed: result.results.failed,
      },
      errors: result.results.errors,
    });
  } catch (error) {
    console.error('Upload Excel error:', error);
    res.status(500).json({ error: 'Upload file thất bại' });
  }
};

const getImportJobs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      prisma.importJob.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { uploadedAt: 'desc' },
        include: {
          uploadedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.importJob.count(),
    ]);

    res.json({
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get import jobs error:', error);
    res.status(500).json({ error: 'Lấy danh sách import thất bại' });
  }
};

const getImportJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.importJob.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        details: {
          orderBy: { rowNumber: 'asc' },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Không tìm thấy import job' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get import job error:', error);
    res.status(500).json({ error: 'Lấy thông tin import job thất bại' });
  }
};

const exportExcel = async (req, res) => {
  try {
    const filters = {
      departmentId: req.query.departmentId,
      status: req.query.status,
      expireFrom: req.query.expireFrom,
      expireTo: req.query.expireTo,
    };

    const buffer = await excelService.exportToExcel(filters);

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=danh-sach-phan-mem-${timestamp}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ error: 'Xuất Excel thất bại' });
  }
};

module.exports = {
  downloadTemplate,
  uploadExcel,
  getImportJobs,
  getImportJob,
  exportExcel,
};
