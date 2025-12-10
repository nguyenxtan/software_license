const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.renewalHistory.deleteMany();
  await prisma.importJobDetail.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.softwareAsset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Create departments
  const deptIT = await prisma.department.create({
    data: {
      name: 'Phòng CNTT',
      code: 'IT',
      emailGroup: 'it@company.com',
    },
  });

  const deptMarketing = await prisma.department.create({
    data: {
      name: 'Phòng Marketing',
      code: 'MKT',
      emailGroup: 'marketing@company.com',
    },
  });

  const deptFinance = await prisma.department.create({
    data: {
      name: 'Phòng Tài chính',
      code: 'FIN',
      emailGroup: 'finance@company.com',
    },
  });

  const deptHR = await prisma.department.create({
    data: {
      name: 'Phòng Nhân sự',
      code: 'HR',
      emailGroup: 'hr@company.com',
    },
  });

  console.log('Created departments');

  // Create users
  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash,
      fullName: 'Quản trị viên',
      email: 'admin@company.com',
      role: 'ADMIN',
      departmentId: deptIT.id,
    },
  });

  const itManager = await prisma.user.create({
    data: {
      username: 'it.manager',
      passwordHash,
      fullName: 'Nguyễn Văn A',
      email: 'it.manager@company.com',
      role: 'MANAGER',
      departmentId: deptIT.id,
    },
  });

  const mktManager = await prisma.user.create({
    data: {
      username: 'mkt.manager',
      passwordHash,
      fullName: 'Trần Thị B',
      email: 'mkt.manager@company.com',
      role: 'MANAGER',
      departmentId: deptMarketing.id,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      username: 'user1',
      passwordHash,
      fullName: 'Lê Văn C',
      email: 'user1@company.com',
      role: 'USER',
      departmentId: deptIT.id,
    },
  });

  console.log('Created users');

  // Create software assets
  const today = new Date();

  // Expiring soon (30 days)
  await prisma.softwareAsset.create({
    data: {
      name: 'Microsoft Office 365',
      costYear: 50000000,
      currency: 'VND',
      budgetYear: 2025,
      departmentId: deptIT.id,
      expireDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      note: 'License doanh nghiệp cho toàn công ty',
      need3MonthReminder: true,
      status: 'ACTIVE',
      responsibleUserId: itManager.id,
      vendorName: 'Microsoft',
      contractNumber: 'MS-2025-001',
      licenseType: 'Subscription',
      quantity: 200,
    },
  });

  // Expiring in 60 days
  await prisma.softwareAsset.create({
    data: {
      name: 'Adobe Creative Cloud',
      costYear: 30000000,
      currency: 'VND',
      budgetYear: 2025,
      departmentId: deptMarketing.id,
      expireDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
      note: 'License cho phòng Marketing',
      need3MonthReminder: true,
      status: 'ACTIVE',
      responsibleUserId: mktManager.id,
      vendorName: 'Adobe',
      contractNumber: 'ADOBE-2025-001',
      licenseType: 'Subscription',
      quantity: 20,
    },
  });

  // Expiring in 90 days
  await prisma.softwareAsset.create({
    data: {
      name: 'Zoom Business',
      costYear: 15000000,
      currency: 'VND',
      budgetYear: 2025,
      departmentId: deptIT.id,
      expireDate: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
      note: 'License họp online cho công ty',
      need3MonthReminder: true,
      status: 'ACTIVE',
      responsibleUserId: itManager.id,
      vendorName: 'Zoom',
      contractNumber: 'ZOOM-2025-001',
      licenseType: 'Subscription',
      quantity: 100,
    },
  });

  // Already expired
  await prisma.softwareAsset.create({
    data: {
      name: 'Antivirus Kaspersky',
      costYear: 8000000,
      currency: 'VND',
      budgetYear: 2025,
      departmentId: deptIT.id,
      expireDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      note: 'Đã hết hạn, cần gia hạn ngay',
      need3MonthReminder: true,
      status: 'EXPIRED',
      responsibleUserId: itManager.id,
      vendorName: 'Kaspersky',
      contractNumber: 'KAS-2024-001',
      licenseType: 'Subscription',
      quantity: 200,
    },
  });

  // Valid for long time
  await prisma.softwareAsset.create({
    data: {
      name: 'Slack Enterprise',
      costYear: 25000000,
      currency: 'VND',
      budgetYear: 2025,
      departmentId: deptIT.id,
      expireDate: new Date(today.getTime() + 200 * 24 * 60 * 60 * 1000),
      note: 'License giao tiếp nội bộ',
      need3MonthReminder: true,
      status: 'ACTIVE',
      responsibleUserId: itManager.id,
      vendorName: 'Slack',
      contractNumber: 'SLACK-2025-001',
      licenseType: 'Subscription',
      quantity: 150,
    },
  });

  await prisma.softwareAsset.create({
    data: {
      name: 'GitHub Enterprise',
      costYear: 40000000,
      currency: 'VND',
      budgetYear: 2025,
      departmentId: deptIT.id,
      expireDate: new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000),
      note: 'Source code management',
      need3MonthReminder: true,
      status: 'ACTIVE',
      responsibleUserId: itManager.id,
      vendorName: 'GitHub',
      contractNumber: 'GH-2025-001',
      licenseType: 'Subscription',
      quantity: 50,
    },
  });

  await prisma.softwareAsset.create({
    data: {
      name: 'Jira Software',
      costYear: 20000000,
      currency: 'VND',
      budgetYear: 2025,
      departmentId: deptIT.id,
      expireDate: new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000),
      note: 'Project management tool',
      need3MonthReminder: true,
      status: 'ACTIVE',
      responsibleUserId: itManager.id,
      vendorName: 'Atlassian',
      contractNumber: 'JIRA-2025-001',
      licenseType: 'Subscription',
      quantity: 100,
    },
  });

  await prisma.softwareAsset.create({
    data: {
      name: 'Google Workspace',
      costYear: 35000000,
      currency: 'VND',
      budgetYear: 2025,
      departmentId: deptIT.id,
      expireDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000),
      note: 'Email và workspace cho công ty',
      need3MonthReminder: true,
      status: 'ACTIVE',
      responsibleUserId: itManager.id,
      vendorName: 'Google',
      contractNumber: 'GWS-2025-001',
      licenseType: 'Subscription',
      quantity: 200,
    },
  });

  console.log('Created software assets');

  // Create some system configs
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'REMINDER_DAYS',
        value: '90,60,30,7,1',
        description: 'Số ngày nhắc trước khi hết hạn (cách nhau bởi dấu phẩy)',
      },
      {
        key: 'EMAIL_ENABLED',
        value: 'true',
        description: 'Bật/tắt gửi email tự động',
      },
    ],
  });

  console.log('Created system configs');

  console.log('✅ Database seeding completed!');
  console.log('\nDefault accounts:');
  console.log('1. Admin: username=admin, password=123456');
  console.log('2. IT Manager: username=it.manager, password=123456');
  console.log('3. Marketing Manager: username=mkt.manager, password=123456');
  console.log('4. User: username=user1, password=123456');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
