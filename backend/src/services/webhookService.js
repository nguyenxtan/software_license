const axios = require('axios');

/**
 * Send notification via webhook (e.g., to N8N)
 * @param {Object} asset - Software asset object
 * @param {number} daysLeft - Days until expiration
 * @param {string} webhookUrl - Webhook URL to send to
 */
const sendWebhookNotification = async (asset, daysLeft, webhookUrl) => {
  try {
    const payload = {
      type: 'license_expiry_notification',
      timestamp: new Date().toISOString(),
      asset: {
        id: asset.id,
        name: asset.name,
        vendorName: asset.vendorName,
        licenseType: asset.licenseType,
        expireDate: asset.expireDate,
        status: asset.status,
      },
      daysLeft,
      department: asset.department ? {
        id: asset.department.id,
        name: asset.department.name,
      } : null,
      responsibleUser: asset.responsibleUser ? {
        id: asset.responsibleUser.id,
        fullName: asset.responsibleUser.fullName,
        email: asset.responsibleUser.email,
      } : null,
      message: generateMessage(asset.name, daysLeft),
      severity: getSeverity(daysLeft),
    };

    console.log(`Sending webhook notification to ${webhookUrl}:`, JSON.stringify(payload, null, 2));

    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Software-License-Manager/1.0',
      },
      timeout: 10000, // 10 seconds timeout
    });

    console.log(`Webhook sent successfully. Status: ${response.status}`);
    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error('Webhook notification error:', error.message);
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
    };
  }
};

/**
 * Generate notification message based on days left
 */
const generateMessage = (softwareName, daysLeft) => {
  if (daysLeft < 0) {
    return `⚠️ KHẨN CẤP: License "${softwareName}" đã hết hạn ${Math.abs(daysLeft)} ngày trước!`;
  } else if (daysLeft === 0) {
    return `🔴 HÔM NAY: License "${softwareName}" hết hạn hôm nay!`;
  } else if (daysLeft === 1) {
    return `🟠 NGÀY MAI: License "${softwareName}" sẽ hết hạn vào ngày mai!`;
  } else if (daysLeft <= 7) {
    return `🟡 CẢNH BÁO: License "${softwareName}" sẽ hết hạn trong ${daysLeft} ngày!`;
  } else if (daysLeft <= 30) {
    return `🟢 NHẮC NHỞ: License "${softwareName}" sẽ hết hạn trong ${daysLeft} ngày`;
  } else {
    return `ℹ️ THÔNG TIN: License "${softwareName}" sẽ hết hạn sau ${daysLeft} ngày`;
  }
};

/**
 * Get severity level based on days left
 */
const getSeverity = (daysLeft) => {
  if (daysLeft < 0) return 'CRITICAL';
  if (daysLeft === 0) return 'CRITICAL';
  if (daysLeft <= 7) return 'HIGH';
  if (daysLeft <= 30) return 'MEDIUM';
  return 'LOW';
};

/**
 * Send notifications to multiple webhooks
 */
const sendToMultipleWebhooks = async (asset, daysLeft, webhookUrls) => {
  const results = [];

  for (const url of webhookUrls) {
    const result = await sendWebhookNotification(asset, daysLeft, url);
    results.push({
      url,
      ...result,
    });
  }

  return results;
};

module.exports = {
  sendWebhookNotification,
  sendToMultipleWebhooks,
  generateMessage,
  getSeverity,
};
