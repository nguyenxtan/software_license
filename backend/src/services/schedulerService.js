const cron = require('node-cron');
const prisma = require('../config/database');
const emailService = require('./emailService');
const webhookService = require('./webhookService');

const MILESTONE_DAYS = [90, 60, 30, 7, 1, 0]; // Days before expiry for MILESTONES mode

const checkAndSendReminders = async () => {
  console.log('Running scheduled reminder check...', new Date().toISOString());

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active assets with notifications enabled
    const assets = await prisma.softwareAsset.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'RENEWED_PENDING'],
        },
        notificationEnabled: true,
      },
      include: {
        department: true,
        responsibleUser: true,
        notifications: true,
      },
    });

    console.log(`Found ${assets.length} assets with notifications enabled`);

    const remindersToSend = [];

    for (const asset of assets) {
      const expireDate = new Date(asset.expireDate);
      expireDate.setHours(0, 0, 0, 0);

      const daysLeft = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));

      // Check if notification should be sent based on frequency
      const shouldSend = shouldSendNotification(asset, daysLeft, today);

      if (shouldSend) {
        remindersToSend.push({
          asset,
          daysLeft,
        });
      }

      // Update status if expired
      if (daysLeft < 0 && asset.status !== 'EXPIRED') {
        await prisma.softwareAsset.update({
          where: { id: asset.id },
          data: { status: 'EXPIRED' },
        });
      }
    }

    console.log(`Sending ${remindersToSend.length} reminders`);

    // Send reminders
    const results = {
      success: 0,
      failed: 0,
      errors: [],
      channelResults: {
        email: 0,
        webhook: 0,
        telegram: 0,
        zalo: 0,
      },
    };

    for (const { asset, daysLeft } of remindersToSend) {
      try {
        const channels = (asset.notificationChannels || 'EMAIL').split(',').map(c => c.trim());

        // Send via enabled channels
        for (const channel of channels) {
          try {
            if (channel === 'EMAIL') {
              await emailService.sendExpiryReminder(
                asset,
                daysLeft < 0 ? 'EXPIRED' : 'UPCOMING_EXPIRY'
              );
              results.channelResults.email++;
            } else if (channel === 'WEBHOOK' && asset.notificationWebhookUrl) {
              await webhookService.sendWebhookNotification(
                asset,
                daysLeft,
                asset.notificationWebhookUrl
              );
              results.channelResults.webhook++;
            } else if (channel === 'TELEGRAM') {
              // TODO: Implement Telegram notification
              console.log('Telegram notification not implemented yet');
            } else if (channel === 'ZALO') {
              // TODO: Implement Zalo notification
              console.log('Zalo notification not implemented yet');
            }
          } catch (channelError) {
            console.error(`Error sending via ${channel}:`, channelError.message);
          }
        }

        // Update last notification sent timestamp
        await prisma.softwareAsset.update({
          where: { id: asset.id },
          data: { lastNotificationSentAt: new Date() },
        });

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

    console.log('Reminder check completed:', results);
    return results;
  } catch (error) {
    console.error('Error in scheduled reminder check:', error);
    throw error;
  }
};

/**
 * Determine if notification should be sent based on frequency setting
 */
const shouldSendNotification = (asset, daysLeft, today) => {
  const { notificationFrequency, notificationStartDays, lastNotificationSentAt } = asset;

  // Check if within notification window
  if (daysLeft > notificationStartDays || daysLeft < -30) {
    return false; // Outside notification window
  }

  // Check last sent date to prevent spam
  if (lastNotificationSentAt) {
    const lastSent = new Date(lastNotificationSentAt);
    lastSent.setHours(0, 0, 0, 0);

    const daysSinceLastNotification = Math.ceil((today - lastSent) / (1000 * 60 * 60 * 24));

    switch (notificationFrequency) {
      case 'DAILY':
        if (daysSinceLastNotification < 1) return false;
        break;
      case 'WEEKLY':
        if (daysSinceLastNotification < 7) return false;
        break;
      case 'MILESTONES':
        // For milestones, check if already sent for this specific day
        if (daysSinceLastNotification < 1) return false;
        break;
      case 'CUSTOM':
        // For custom, always check cron schedule (handled separately)
        break;
    }
  }

  // Check frequency-specific logic
  switch (notificationFrequency) {
    case 'DAILY':
      return true; // Send daily within window

    case 'WEEKLY':
      // Send only on Mondays
      return today.getDay() === 1;

    case 'MILESTONES':
      // Send only at specific milestones
      return MILESTONE_DAYS.includes(daysLeft);

    case 'CUSTOM':
      // For custom, cron schedule determines timing
      // This would need more complex cron parsing logic
      return true;

    default:
      return false;
  }
};

const startScheduler = () => {
  // Run every day at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    try {
      await checkAndSendReminders();
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });

  console.log('Scheduler started - will run daily at 1:00 AM');

  // Optional: Run immediately on startup for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode - running reminder check once on startup');
    setTimeout(() => {
      checkAndSendReminders().catch(console.error);
    }, 5000); // Wait 5 seconds after startup
  }
};

module.exports = {
  startScheduler,
  checkAndSendReminders,
  shouldSendNotification,
};
