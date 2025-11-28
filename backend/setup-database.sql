-- ============================================
-- 计分系统独立数据库设置脚本
-- ============================================
-- 用途：创建一个完全独立的数据库，避免和其他项目冲突
-- 使用方法：mysql -u root -p < setup-database.sql
-- ============================================

-- 1. 创建独立数据库
CREATE DATABASE IF NOT EXISTS yunce_score_system 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. 创建专用数据库用户（推荐）
CREATE USER IF NOT EXISTS 'score_user'@'localhost' IDENTIFIED BY 'ScorePass2024!';

-- 3. 授予权限
GRANT ALL PRIVILEGES ON yunce_score_system.* TO 'score_user'@'localhost';

-- 4. 刷新权限
FLUSH PRIVILEGES;

-- 5. 切换到新数据库
USE yunce_score_system;

-- 6. 显示信息
SELECT 
    '✅ 数据库创建成功！' as status,
    'yunce_score_system' as database_name,
    'score_user' as username;

-- ============================================
-- 配置信息
-- ============================================
-- 数据库名称：yunce_score_system
-- 用户名：score_user
-- 密码：ScorePass2024!
-- 
-- 在 .env 文件中使用：
-- DATABASE_URL="mysql://score_user:ScorePass2024!@localhost:3306/yunce_score_system"
-- ============================================



