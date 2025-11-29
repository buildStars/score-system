-- 修改 Bet 表的字段类型，让 fee 和 resultAmount 支持两位小数
-- 而 pointsBefore, pointsAfter 保持为整数
-- 执行此脚本前请备份数据库！

-- 1. 修改 fee 字段为 DECIMAL(10,2)
ALTER TABLE `bets` 
MODIFY COLUMN `fee` DECIMAL(10,2) NOT NULL DEFAULT 0 
COMMENT '手续费（保留两位小数）';

-- 2. 修改 resultAmount 字段为 DECIMAL(10,2)
ALTER TABLE `bets` 
MODIFY COLUMN `result_amount` DECIMAL(10,2) NULL 
COMMENT '结算金额（盈亏，保留两位小数）';

-- 注意：
-- - pointsBefore 和 pointsAfter 保持为 INT 类型（整数）
-- - amount (下注金额/倍数) 保持为 INT 类型（整数）
-- - 只有 fee 和 resultAmount 需要小数精度


