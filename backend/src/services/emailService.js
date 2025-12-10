const transporter = require('../config/email');
const prisma = require('../config/database');

const getEmailTemplate = (asset, daysLeft) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const statusText = daysLeft > 0
    ? `sẽ hết hạn sau ${daysLeft} ngày`
    : daysLeft === 0
      ? 'hết hạn hôm nay'
      : `đã hết hạn ${Math.abs(daysLeft)} ngày`;

  const subject = `[Cảnh báo bản quyền] ${asset.name} ${statusText}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .header {
      background-color: ${daysLeft < 0 ? '#d32f2f' : daysLeft <= 30 ? '#f57c00' : '#1976d2'};
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: white;
      padding: 20px;
      border-radius: 0 0 5px 5px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .info-table td {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    .info-table td:first-child {
      font-weight: bold;
      width: 40%;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #1976d2;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚠️ Thông báo hết hạn bản quyền phần mềm</h2>
    </div>
    <div class="content">
      <p>Kính gửi: ${asset.department?.name || 'Quý phòng ban'},</p>

      <p>Hệ thống nhắc nhở: Bản quyền/hợp đồng phần mềm <strong>${asset.name}</strong> ${statusText}.</p>

      <table class="info-table">
        <tr>
          <td>Phần mềm:</td>
          <td><strong>${asset.name}</strong></td>
        </tr>
        <tr>
          <td>Phòng ban:</td>
          <td>${asset.department?.name || 'Chưa xác định'}</td>
        </tr>
        <tr>
          <td>Ngày hết hạn:</td>
          <td><strong>${new Date(asset.expireDate).toLocaleDateString('vi-VN')}</strong></td>
        </tr>
        ${asset.contractNumber ? `
        <tr>
          <td>Số hợp đồng:</td>
          <td>${asset.contractNumber}</td>
        </tr>
        ` : ''}
        ${asset.vendorName ? `
        <tr>
          <td>Nhà cung cấp:</td>
          <td>${asset.vendorName}</td>
        </tr>
        ` : ''}
        ${asset.costYear ? `
        <tr>
          <td>Kinh phí:</td>
          <td>${parseFloat(asset.costYear).toLocaleString('vi-VN')} ${asset.currency}</td>
        </tr>
        ` : ''}
        ${asset.responsibleUser ? `
        <tr>
          <td>Người phụ trách:</td>
          <td>${asset.responsibleUser.fullName} (${asset.responsibleUser.email})</td>
        </tr>
        ` : ''}
      </table>

      <p>Vui lòng kiểm tra và thực hiện gia hạn kịp thời để đảm bảo hoạt động liên tục.</p>

      <a href="${frontendUrl}/software-assets/${asset.id}" class="button">
        Xem chi tiết & cập nhật
      </a>

      <div class="footer">
        <p>Email này được gửi tự động từ Hệ thống quản lý bản quyền phần mềm.</p>
        <p>Vui lòng không trả lời email này.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
};

const sendExpiryReminder = async (asset, notificationType = 'UPCOMING_EXPIRY') => {
  try {
    const today = new Date();
    const expireDate = new Date(asset.expireDate);
    const daysLeft = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));

    const { subject, html } = getEmailTemplate(asset, daysLeft);

    // Prepare recipients
    const recipients = [];

    if (asset.responsibleUser?.email) {
      recipients.push(asset.responsibleUser.email);
    }

    if (asset.department?.emailGroup) {
      recipients.push(asset.department.emailGroup);
    }

    if (recipients.length === 0) {
      throw new Error('Không có địa chỉ email để gửi');
    }

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipients.join(', '),
      subject,
      html,
    });

    // Log notification
    await prisma.notification.create({
      data: {
        softwareAssetId: asset.id,
        type: notificationType,
        remindBeforeDays: Math.max(daysLeft, 0),
        status: 'SENT',
        sentAt: new Date(),
        emailSubject: subject,
        emailTo: recipients.join(', '),
      },
    });

    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Send email error:', error);

    // Log failed notification
    await prisma.notification.create({
      data: {
        softwareAssetId: asset.id,
        type: notificationType,
        remindBeforeDays: 0,
        status: 'FAILED',
        errorMessage: error.message,
      },
    });

    throw error;
  }
};

const sendBulkReminders = async (assets) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const asset of assets) {
    try {
      await sendExpiryReminder(asset);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        assetId: asset.id,
        assetName: asset.name,
        error: error.message,
      });
    }
  }

  return results;
};

module.exports = {
  sendExpiryReminder,
  sendBulkReminders,
};
