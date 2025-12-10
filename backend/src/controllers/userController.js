const prisma = require('../config/database');
const { hashPassword } = require('../utils/password');

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, departmentId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          department: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Lấy danh sách người dùng thất bại' });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        department: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Lấy thông tin người dùng thất bại' });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, fullName, email, role, departmentId } = req.body;

    if (!username || !password || !fullName || !email) {
      return res.status(400).json({
        error: 'Tên đăng nhập, mật khẩu, họ tên và email là bắt buộc',
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        fullName,
        email,
        role: role || 'USER',
        departmentId: departmentId || null,
        authProvider: 'LOCAL',
      },
      include: {
        department: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        department: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Tên đăng nhập hoặc email đã tồn tại' });
    }
    res.status(500).json({ error: 'Tạo người dùng thất bại' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, departmentId, isActive, password } = req.body;

    const updateData = {
      fullName,
      email,
      role,
      departmentId,
      isActive,
    };

    // Update password if provided
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        department: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email đã tồn tại' });
    }
    res.status(500).json({ error: 'Cập nhật người dùng thất bại' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Không thể xóa tài khoản của chính mình' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    res.status(500).json({ error: 'Xóa người dùng thất bại' });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
