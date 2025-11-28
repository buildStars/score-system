-- MySQL 初始化脚本
-- 此脚本会在 MySQL 容器首次启动时自动执行

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS score_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE score_system;

-- 设置时区
SET time_zone = '+08:00';

-- 输出信息
SELECT 'MySQL 初始化完成！' AS message;




