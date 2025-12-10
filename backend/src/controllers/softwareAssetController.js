const prisma = require('../config/database');

const getSoftwareAssets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      departmentId,
      status,
      expireFrom,
      expireTo,
      sortBy = 'expireDate',
      sortOrder = 'asc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Search by name or contract number
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { vendorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by department
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by expire date range
    if (expireFrom || expireTo) {
      where.expireDate = {};
      if (expireFrom) where.expireDate.gte = new Date(expireFrom);
      if (expireTo) where.expireDate.lte = new Date(expireTo);
    }

    // For non-admin users, only show their department's assets
    if (req.user.role !== 'ADMIN' && req.user.departmentId) {
      where.departmentId = req.user.departmentId;
    }

    const [assets, total] = await Promise.all([
      prisma.softwareAsset.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          department: true,
          responsibleUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.softwareAsset.count({ where }),
    ]);

    res.json({
      data: assets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get software assets error:', error);
    res.status(500).json({ error: 'Lấy danh sách phần mềm thất bại' });
  }
};

const getSoftwareAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await prisma.softwareAsset.findUnique({
      where: { id },
      include: {
        department: true,
        responsibleUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        renewalHistory: {
          include: {
            performedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { actionDate: 'desc' },
        },
      },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Không tìm thấy phần mềm' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Get software asset error:', error);
    res.status(500).json({ error: 'Lấy thông tin phần mềm thất bại' });
  }
};

const createSoftwareAsset = async (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.name || !data.expireDate) {
      return res.status(400).json({ error: 'Tên phần mềm và thời hạn là bắt buộc' });
    }

    const asset = await prisma.softwareAsset.create({
      data: {
        ...data,
        expireDate: new Date(data.expireDate),
        nextExpireDate: data.nextExpireDate ? new Date(data.nextExpireDate) : null,
      },
      include: {
        department: true,
        responsibleUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(asset);
  } catch (error) {
    console.error('Create software asset error:', error);
    res.status(500).json({ error: 'Tạo phần mềm thất bại' });
  }
};

const updateSoftwareAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check if asset exists
    const existingAsset = await prisma.softwareAsset.findUnique({
      where: { id },
    });

    if (!existingAsset) {
      return res.status(404).json({ error: 'Không tìm thấy phần mềm' });
    }

    const asset = await prisma.softwareAsset.update({
      where: { id },
      data: {
        ...data,
        expireDate: data.expireDate ? new Date(data.expireDate) : undefined,
        nextExpireDate: data.nextExpireDate ? new Date(data.nextExpireDate) : undefined,
      },
      include: {
        department: true,
        responsibleUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.json(asset);
  } catch (error) {
    console.error('Update software asset error:', error);
    res.status(500).json({ error: 'Cập nhật phần mềm thất bại' });
  }
};

const deleteSoftwareAsset = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.softwareAsset.delete({
      where: { id },
    });

    res.json({ message: 'Xóa phần mềm thành công' });
  } catch (error) {
    console.error('Delete software asset error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Không tìm thấy phần mềm' });
    }
    res.status(500).json({ error: 'Xóa phần mềm thất bại' });
  }
};

const completeRenewal = async (req, res) => {
  try {
    const { id } = req.params;
    const { newExpireDate, cost, note } = req.body;

    if (!newExpireDate) {
      return res.status(400).json({ error: 'Ngày hết hạn mới là bắt buộc' });
    }

    const asset = await prisma.softwareAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Không tìm thấy phần mềm' });
    }

    // Create renewal history and update asset in a transaction
    const [renewalHistory, updatedAsset] = await prisma.$transaction([
      prisma.renewalHistory.create({
        data: {
          softwareAssetId: id,
          actionDate: new Date(),
          actionType: 'RENEW',
          oldExpireDate: asset.expireDate,
          newExpireDate: new Date(newExpireDate),
          cost: cost || null,
          performedByUserId: req.user.id,
          note: note || null,
        },
      }),
      prisma.softwareAsset.update({
        where: { id },
        data: {
          expireDate: new Date(newExpireDate),
          status: 'ACTIVE',
        },
        include: {
          department: true,
          responsibleUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    res.json({
      asset: updatedAsset,
      renewalHistory,
      message: 'Đã cập nhật thông tin gia hạn thành công',
    });
  } catch (error) {
    console.error('Complete renewal error:', error);
    res.status(500).json({ error: 'Cập nhật gia hạn thất bại' });
  }
};

const sendReminderEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const emailService = require('../services/emailService');

    const asset = await prisma.softwareAsset.findUnique({
      where: { id },
      include: {
        department: true,
        responsibleUser: true,
      },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Không tìm thấy phần mềm' });
    }

    await emailService.sendExpiryReminder(asset, 'CUSTOM');

    res.json({ message: 'Đã gửi email nhắc nhở thành công' });
  } catch (error) {
    console.error('Send reminder email error:', error);
    res.status(500).json({ error: 'Gửi email thất bại' });
  }
};

module.exports = {
  getSoftwareAssets,
  getSoftwareAsset,
  createSoftwareAsset,
  updateSoftwareAsset,
  deleteSoftwareAsset,
  completeRenewal,
  sendReminderEmail,
};
