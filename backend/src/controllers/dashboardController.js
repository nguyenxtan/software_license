const prisma = require('../config/database');

const getSummary = async (req, res) => {
  try {
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    // Get counts
    const [
      totalAssets,
      activeAssets,
      expiringSoon,
      expired,
      renewedThisMonth,
      assetsByStatus,
      assetsByDepartment,
      expiringByMonth,
    ] = await Promise.all([
      // Total all assets
      prisma.softwareAsset.count(),

      // Active assets only
      prisma.softwareAsset.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      // Expiring in next 3 months
      prisma.softwareAsset.count({
        where: {
          status: 'ACTIVE',
          expireDate: {
            gte: today,
            lte: threeMonthsFromNow,
          },
        },
      }),

      // Already expired
      prisma.softwareAsset.count({
        where: {
          OR: [
            { status: 'EXPIRED' },
            {
              status: 'ACTIVE',
              expireDate: {
                lt: today,
              },
            },
          ],
        },
      }),

      // Renewed this month
      prisma.renewalHistory.count({
        where: {
          actionType: 'RENEW',
          actionDate: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
          },
        },
      }),

      // Assets by status
      prisma.softwareAsset.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Assets by department with total cost
      prisma.softwareAsset.groupBy({
        by: ['departmentId'],
        _count: true,
        _sum: {
          costYear: true,
        },
      }),

      // Get next 12 months expiration data
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', expire_date) as month,
          COUNT(*) as count
        FROM software_assets
        WHERE expire_date >= ${today}
        AND expire_date <= ${new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())}
        AND status IN ('ACTIVE', 'RENEWED_PENDING')
        GROUP BY DATE_TRUNC('month', expire_date)
        ORDER BY month
      `,
    ]);

    // Get department names
    const departmentIds = assetsByDepartment
      .map(d => d.departmentId)
      .filter(id => id !== null);

    const departments = await prisma.department.findMany({
      where: {
        id: {
          in: departmentIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const departmentMap = {};
    departments.forEach(dept => {
      departmentMap[dept.id] = dept.name;
    });

    // Format department data
    const formattedDepartmentData = assetsByDepartment.map(item => ({
      department: item.departmentId ? departmentMap[item.departmentId] : 'Chưa phân bổ',
      count: item._count,
      totalCost: item._sum.costYear ? parseFloat(item._sum.costYear) : 0,
    }));

    // Get upcoming expiry list
    const upcomingExpiry = await prisma.softwareAsset.findMany({
      where: {
        status: 'ACTIVE',
        expireDate: {
          gte: today,
          lte: threeMonthsFromNow,
        },
      },
      take: 10,
      orderBy: {
        expireDate: 'asc',
      },
      include: {
        department: true,
        responsibleUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    res.json({
      total: totalAssets,
      active: activeAssets,
      expiring: expiringSoon,
      expired: expired,
      renewedThisMonth: renewedThisMonth,
      assetsByStatus: assetsByStatus.map(item => ({
        status: item.status,
        count: item._count,
      })),
      assetsByDepartment: formattedDepartmentData,
      expiringByMonth: expiringByMonth.map(item => ({
        month: item.month,
        count: Number(item.count),
      })),
      upcomingExpiry,
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ error: 'Lấy thống kê dashboard thất bại' });
  }
};

const getExpiringAssets = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const assets = await prisma.softwareAsset.findMany({
      where: {
        status: 'ACTIVE',
        expireDate: {
          gte: today,
          lte: futureDate,
        },
      },
      orderBy: {
        expireDate: 'asc',
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

    res.json(assets);
  } catch (error) {
    console.error('Get expiring assets error:', error);
    res.status(500).json({ error: 'Lấy danh sách phần mềm sắp hết hạn thất bại' });
  }
};

module.exports = {
  getSummary,
  getExpiringAssets,
};
