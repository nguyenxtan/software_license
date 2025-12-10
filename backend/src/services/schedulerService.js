const cron = require('node-cron');
const prisma = require('../config/database');
const emailService = require('./emailService');

const REMINDER_DAYS = [90, 60, 30, 7, 1, 0]; // Days before expiry to send reminders

const checkAndSendReminders = async () => {
  console.log('Running scheduled reminder check...', new Date().toISOString());

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active assets that need reminders
    const assets = await prisma.softwareAsset.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'RENEWED_PENDING'],
        },
        need3MonthReminder: true,
      },
      include: {
        department: true,
        responsibleUser: true,
        notifications: true,
      },
    });

    console.log(`Found ${assets.length} assets to check`);

    const remindersToSend = [];

    for (const asset of assets) {
      const expireDate = new Date(asset.expireDate);
      expireDate.setHours(0, 0, 0, 0);

      const daysLeft = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));

      // Check if we should send a reminder for this asset
      for (const reminderDay of REMINDER_DAYS) {
        if (daysLeft === reminderDay) {
          // Check if we already sent a reminder for this milestone
          const existingNotification = asset.notifications.find(
            n => n.remindBeforeDays === reminderDay && n.status === 'SENT'
          );

          if (!existingNotification) {
            remindersToSend.push({
              asset,
              daysLeft: reminderDay,
            });
          }
        }
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
    };

    for (const { asset, daysLeft } of remindersToSend) {
      try {
        await emailService.sendExpiryReminder(
          asset,
          daysLeft < 0 ? 'EXPIRED' : 'UPCOMING_EXPIRY'
        );
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
};
