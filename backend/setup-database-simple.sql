-- ============================================
-- 计分系统独立数据库设置脚本（简化版）
-- ============================================
-- 使用root用户，只创建数据库
-- 使用方法：mysql -u root -p < setup-database-simple.sql
-- ============================================

-- 创建独立数据库
CREATE DATABASE IF NOT EXISTS yunce_score_system 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 显示所有数据库
SHOW DATABASES;

-- ============================================
-- 配置信息
-- ============================================
-- 数据库名称：yunce_score_system
-- 
-- 在 .env 文件中使用（替换your_password为你的root密码）：
-- DATABASE_URL="mysql://root:your_password@localhost:3306/yunce_score_system"
-- ============================================



