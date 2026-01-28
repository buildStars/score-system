-- 添加Telegram用户账号相关配置
-- 这些配置会通过SystemSetting表存储

-- API ID（从 https://my.telegram.org/apps 获取）
INSERT INTO system_settings (setting_key, setting_value, setting_name, description, value_type, created_at, updated_at)
VALUES ('telegram_user_api_id', '', 'Telegram用户API ID', '从 https://my.telegram.org/apps 获取的API ID', 'string', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- API Hash（从 https://my.telegram.org/apps 获取）
INSERT INTO system_settings (setting_key, setting_value, setting_name, description, value_type, created_at, updated_at)
VALUES ('telegram_user_api_hash', '', 'Telegram用户API Hash', '从 https://my.telegram.org/apps 获取的API Hash', 'string', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 手机号
INSERT INTO system_settings (setting_key, setting_value, setting_name, description, value_type, created_at, updated_at)
VALUES ('telegram_user_phone', '', 'Telegram用户手机号', '用于登录的Telegram账号手机号（包含国家代码，如：+8613800138000）', 'string', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Session字符串（登录后自动保存）
INSERT INTO system_settings (setting_key, setting_value, setting_name, description, value_type, created_at, updated_at)
VALUES ('telegram_user_session', '', 'Telegram用户Session', '登录后自动保存的Session字符串，用于保持登录状态', 'string', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 目标Chat ID（频道或群组ID）
INSERT INTO system_settings (setting_key, setting_value, setting_name, description, value_type, created_at, updated_at)
VALUES ('telegram_user_chat_id', '', 'Telegram用户目标Chat ID', '要转发消息到的频道或群组ID（可以是@channel_name或-1001234567890格式）', 'string', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 是否启用用户账号模式
INSERT INTO system_settings (setting_key, setting_value, setting_name, description, value_type, created_at, updated_at)
VALUES ('telegram_user_enabled', 'false', '启用Telegram用户账号', '是否启用Telegram用户账号模式（true/false）', 'string', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();
