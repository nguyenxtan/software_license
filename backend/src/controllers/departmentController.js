const prisma = require('../config/database');

const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            softwareAssets: true,
          },
        },
      },
    });

    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Lấy danh sách phòng ban thất bại' });
  }
};

const getDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            softwareAssets: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ error: 'Không tìm thấy phòng ban' });
    }

    res.json(department);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Lấy thông tin phòng ban thất bại' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code, emailGroup } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Tên và mã phòng ban là bắt buộc' });
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        emailGroup,
      },
    });

    res.status(201).json(department);
  } catch (error) {
    console.error('Create department error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Tên hoặc mã phòng ban đã tồn tại' });
    }
    res.status(500).json({ error: 'Tạo phòng ban thất bại' });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, emailGroup } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        code,
        emailGroup,
      },
    });

    res.json(department);
  } catch (error) {
    console.error('Update department error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Không tìm thấy phòng ban' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Tên hoặc mã phòng ban đã tồn tại' });
    }
    res.status(500).json({ error: 'Cập nhật phòng ban thất bại' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department has users or assets
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            softwareAssets: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ error: 'Không tìm thấy phòng ban' });
    }

    if (department._count.users > 0 || department._count.softwareAssets > 0) {
      return res.status(400).json({
        error: 'Không thể xóa phòng ban có người dùng hoặc phần mềm',
      });
    }

    await prisma.department.delete({
      where: { id },
    });

    res.json({ message: 'Xóa phòng ban thành công' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Xóa phòng ban thất bại' });
  }
};

module.exports = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
