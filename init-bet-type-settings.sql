-- 初始化下注类型设置
-- 使用 UTF-8 编码

SET NAMES utf8mb4;

TRUNCATE TABLE bet_type_settings;

INSERT INTO bet_type_settings (bet_type, name, odds, min_bet, max_bet, fee_rate, is_enabled, sort_order, description, created_at, updated_at) VALUES
('multiple', '倍数', 1.95, 100.00, 100000.00, 3.00, 1, 1, '中奖获得下注金额的1.95倍', NOW(), NOW()),
('big', '大', 1.95, 100.00, 100000.00, 3.00, 1, 2, '总和≥14', NOW(), NOW()),
('small', '小', 1.95, 100.00, 100000.00, 3.00, 1, 3, '总和≤13', NOW(), NOW()),
('odd', '单', 1.95, 100.00, 100000.00, 3.00, 1, 4, '总和为单数', NOW(), NOW()),
('even', '双', 1.95, 100.00, 100000.00, 3.00, 1, 5, '总和为双数', NOW(), NOW()),
('big_odd', '大单', 1.95, 100.00, 100000.00, 3.00, 1, 6, '总和≥14且为单数', NOW(), NOW()),
('big_even', '大双', 1.95, 100.00, 100000.00, 3.00, 1, 7, '总和≥14且为双数', NOW(), NOW()),
('small_odd', '小单', 1.95, 100.00, 100000.00, 3.00, 1, 8, '总和≤13且为单数', NOW(), NOW()),
('small_even', '小双', 1.95, 100.00, 100000.00, 3.00, 1, 9, '总和≤13且为双数', NOW(), NOW());

SELECT CONCAT('✅ 初始化完成，共 ', COUNT(*), ' 条数据') AS result FROM bet_type_settings;
SELECT bet_type, name, description FROM bet_type_settings;


