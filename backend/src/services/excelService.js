const XLSX = require('xlsx');
const prisma = require('../config/database');

const generateTemplate = () => {
  const templateData = [
    {
      'STT': 1,
      'Phần mềm': 'Ví dụ: Microsoft Office 365',
      'Kinh phí năm 2025 (VNĐ)': 10000000,
      'Đơn vị sử dụng': 'Phòng CNTT',
      'Thời hạn (dd/mm/yyyy)': '31/12/2025',
      'Ghi chú': 'Ghi chú nếu có',
      'Nhắc trước 3 tháng (Y/N)': 'Y',
      'Nhà cung cấp': 'Microsoft',
      'Số hợp đồng': 'HD-2025-001',
      'Loại license': 'Subscription',
      'Số lượng': 100,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // STT
    { wch: 30 }, // Phần mềm
    { wch: 20 }, // Kinh phí
    { wch: 20 }, // Đơn vị sử dụng
    { wch: 20 }, // Thời hạn
    { wch: 30 }, // Ghi chú
    { wch: 20 }, // Nhắc trước 3 tháng
    { wch: 20 }, // Nhà cung cấp
    { wch: 15 }, // Số hợp đồng
    { wch: 15 }, // Loại license
    { wch: 10 }, // Số lượng
  ];

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const parseExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  return data;
};

const parseDate = (dateValue) => {
  if (!dateValue) return null;

  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue;
  }

  // If it's an Excel serial number
  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const days = Math.floor(dateValue);
    return new Date(excelEpoch.getTime() + days * 86400000);
  }

  // If it's a string in dd/mm/yyyy format
  if (typeof dateValue === 'string') {
    const parts = dateValue.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }

  return null;
};

const validateRow = (row, rowNumber) => {
  const errors = [];

  if (!row['Phần mềm']) {
    errors.push('Thiếu tên phần mềm');
  }

  const expireDate = parseDate(row['Thời hạn (dd/mm/yyyy)']);
  if (!expireDate || isNaN(expireDate.getTime())) {
    errors.push('Thời hạn không hợp lệ');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const importFromExcel = async (buffer, userId) => {
  try {
    const data = parseExcelFile(buffer);
    const totalRows = data.length;
    const results = {
      total: totalRows,
      success: 0,
      failed: 0,
      errors: [],
    };

    // Get all departments for mapping
    const departments = await prisma.department.findMany();
    const departmentMap = {};
    departments.forEach(dept => {
      departmentMap[dept.name.toLowerCase()] = dept.id;
    });

    const importJobDetails = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel row number (1-indexed + header)

      const validation = validateRow(row, rowNumber);
      if (!validation.isValid) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          errors: validation.errors,
          data: row,
        });
        importJobDetails.push({
          rowNumber,
          rawData: JSON.stringify(row),
          status: 'FAILED',
          errorMessage: validation.errors.join(', '),
        });
        continue;
      }

      try {
        // Find department ID
        const deptName = row['Đơn vị sử dụng']?.toLowerCase() || '';
        const departmentId = departmentMap[deptName] || null;

        const assetData = {
          stt: row['STT'] || null,
          name: row['Phần mềm'],
          costYear: row['Kinh phí năm 2025 (VNĐ)'] || null,
          currency: 'VND',
          budgetYear: 2025,
          departmentId,
          expireDate: parseDate(row['Thời hạn (dd/mm/yyyy)']),
          note: row['Ghi chú'] || null,
          need3MonthReminder: row['Nhắc trước 3 tháng (Y/N)']?.toUpperCase() === 'Y',
          vendorName: row['Nhà cung cấp'] || null,
          contractNumber: row['Số hợp đồng'] || null,
          licenseType: row['Loại license'] || null,
          quantity: row['Số lượng'] || null,
          status: 'ACTIVE',
        };

        await prisma.softwareAsset.create({
          data: assetData,
        });

        results.success++;
        importJobDetails.push({
          rowNumber,
          rawData: JSON.stringify(row),
          status: 'SUCCESS',
          errorMessage: null,
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          errors: [error.message],
          data: row,
        });
        importJobDetails.push({
          rowNumber,
          rawData: JSON.stringify(row),
          status: 'FAILED',
          errorMessage: error.message,
        });
      }
    }

    // Create import job record
    const importJob = await prisma.importJob.create({
      data: {
        fileName: 'import.xlsx',
        uploadedByUserId: userId,
        totalRows,
        successRows: results.success,
        failedRows: results.failed,
        status: results.failed === 0 ? 'SUCCESS' : results.success === 0 ? 'FAILED' : 'PARTIAL',
        errorLog: results.errors.length > 0 ? JSON.stringify(results.errors) : null,
        details: {
          create: importJobDetails,
        },
      },
      include: {
        details: true,
      },
    });

    return {
      importJob,
      results,
    };
  } catch (error) {
    console.error('Import from Excel error:', error);
    throw error;
  }
};

const exportToExcel = async (filters = {}) => {
  const where = {};

  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.expireFrom || filters.expireTo) {
    where.expireDate = {};
    if (filters.expireFrom) where.expireDate.gte = new Date(filters.expireFrom);
    if (filters.expireTo) where.expireDate.lte = new Date(filters.expireTo);
  }

  const assets = await prisma.softwareAsset.findMany({
    where,
    include: {
      department: true,
      responsibleUser: true,
    },
    orderBy: { expireDate: 'asc' },
  });

  const exportData = assets.map((asset, index) => ({
    'STT': index + 1,
    'Phần mềm': asset.name,
    'Kinh phí năm': asset.costYear ? parseFloat(asset.costYear) : '',
    'Đơn vị tiền': asset.currency,
    'Phòng ban': asset.department?.name || '',
    'Thời hạn': asset.expireDate.toLocaleDateString('vi-VN'),
    'Trạng thái': asset.status,
    'Ghi chú': asset.note || '',
    'Nhắc trước 3 tháng': asset.need3MonthReminder ? 'Y' : 'N',
    'Nhà cung cấp': asset.vendorName || '',
    'Số hợp đồng': asset.contractNumber || '',
    'Loại license': asset.licenseType || '',
    'Số lượng': asset.quantity || '',
    'Người phụ trách': asset.responsibleUser?.fullName || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách bản quyền');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
  generateTemplate,
  importFromExcel,
  exportToExcel,
};
