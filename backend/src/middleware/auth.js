const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Không tìm thấy token xác thực' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { department: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị khóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Xác thực thất bại' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Chưa xác thực' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
