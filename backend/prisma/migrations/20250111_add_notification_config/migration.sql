-- Add notification configuration fields to software_assets table
ALTER TABLE software_assets
ADD COLUMN notification_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN notification_frequency VARCHAR(20) NOT NULL DEFAULT 'MILESTONES',
ADD COLUMN notification_start_days INTEGER NOT NULL DEFAULT 90,
ADD COLUMN notification_channels TEXT NOT NULL DEFAULT 'EMAIL',
ADD COLUMN notification_webhook_url TEXT,
ADD COLUMN notification_custom_schedule TEXT,
ADD COLUMN last_notification_sent_at TIMESTAMP;

-- Add comment for notification_frequency
COMMENT ON COLUMN software_assets.notification_frequency IS 'DAILY, WEEKLY, MILESTONES, or CUSTOM';

-- Add comment for notification_channels
COMMENT ON COLUMN software_assets.notification_channels IS 'Comma-separated list: EMAIL,WEBHOOK,TELEGRAM,ZALO';
