const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { department: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    if (user.authProvider !== 'LOCAL') {
      return res.status(401).json({ error: 'Tài khoản này sử dụng phương thức đăng nhập khác' });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken({ userId: user.id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Đăng nhập thất bại' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { department: true },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        lastLoginAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Lấy thông tin người dùng thất bại' });
  }
};

const logout = async (req, res) => {
  // With JWT, logout is handled on client side by removing the token
  // This endpoint is here for consistency and can be extended later
  res.json({ message: 'Đăng xuất thành công' });
};

module.exports = {
  login,
  getMe,
  logout,
};
