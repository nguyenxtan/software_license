const prisma = require('../config/database');
const emailService = require('../services/emailService');

const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          softwareAsset: {
            include: {
              department: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Lấy danh sách thông báo thất bại' });
  }
};

const resendNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        softwareAsset: {
          include: {
            department: true,
            responsibleUser: true,
          },
        },
      },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Không tìm thấy thông báo' });
    }

    await emailService.sendExpiryReminder(
      notification.softwareAsset,
      notification.type
    );

    res.json({ message: 'Đã gửi lại email thành công' });
  } catch (error) {
    console.error('Resend notification error:', error);
    res.status(500).json({ error: 'Gửi lại email thất bại' });
  }
};

module.exports = {
  getNotifications,
  resendNotification,
};
