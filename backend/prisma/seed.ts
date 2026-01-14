import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据库...');

  // 1. 创建管理员账号
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      realName: '超级管理员',
      role: 'superadmin',
      status: 1,
    },
  });
  console.log('✅ 管理员账号已创建:', admin.username);

  // 2. 初始化 bet_type_settings
  const betTypeSettings = [
    {
      betType: 'multiple',
      name: '倍数',
      odds: 1.95,
      minBet: 100,
      maxBet: 100000,
      feeRate: 0.03,  // 3% (每100倍收3元)
      isEnabled: true,
      sortOrder: 1,
      description: '赔率1.95',
    },
    {
      betType: 'big',
      name: '大',
      odds: 1.95,
      minBet: 100,
      maxBet: 100000,
      feeRate: 0.03,  // 不单独收费，仅用于组合
      isEnabled: true,
      sortOrder: 2,
      description: '总和≥14',
    },
    {
      betType: 'small',
      name: '小',
      odds: 1.95,
      minBet: 100,
      maxBet: 100000,
      feeRate: 0.03,  // 不单独收费，仅用于组合
      isEnabled: true,
      sortOrder: 3,
      description: '总和≤13',
    },
    {
      betType: 'odd',
      name: '单',
      odds: 1.95,
      minBet: 100,
      maxBet: 100000,
      feeRate: 0.03,  // 不单独收费，仅用于组合
      isEnabled: true,
      sortOrder: 4,
      description: '总和为单数',
    },
    {
      betType: 'even',
      name: '双',
      odds: 1.95,
      minBet: 100,
      maxBet: 100000,
      feeRate: 0.03,  // 不单独收费，仅用于组合
      isEnabled: true,
      sortOrder: 5,
      description: '总和为双数',
    },
    {
      betType: 'big_odd',
      name: '大单',
      odds: 1.95,
      minBet: 100,
      maxBet: 100000,
      feeRate: 0.05,  // 5% (每100本金收5元，组合下注)
      isEnabled: true,
      sortOrder: 6,
      description: '总和≥14且为单数',
    },
    {
      betType: 'big_even',
      name: '大双',
      odds: 1.95,
      minBet: 100,
      maxBet: 100000,
      feeRate: 0.05,  // 5% (组合下注)
      isEnabled: true,
      sortOrder: 7,
      description: '总和≥14且为双数',
    },
    {
      betType: 'small_odd',
      name: '小单',
      odds: 1.95,
      minBet: 100,
      maxBet: 100000,
      feeRate: 0.05,  // 5% (组合下注)
      isEnabled: true,
      sortOrder: 8,
      description: '总和≤13且为单数',
    },
    {
      betType: 'small_even',
      name: '小双',
      odds: 1.95,
      minBet: 100,
      maxBet: 100000,
      feeRate: 0.05,  // 5% (组合下注)
      isEnabled: true,
      sortOrder: 9,
      description: '总和≤13且为双数',
    },
  ];

  for (const setting of betTypeSettings) {
    await prisma.betTypeSetting.upsert({
      where: { betType: setting.betType },
      update: setting,
      create: setting,
    });
  }
  console.log('✅ 模式设置(Bet Type Settings)已初始化');

  // 3. 初始化系统设置
  const systemSettings = [
    // ===== 核心开关 =====
    {
      settingKey: 'game_enabled',
      settingName: '游戏开关',
      settingValue: 'true',
      description: '控制是否允许用户下注',
      valueType: 'boolean',
    },
    {
      settingKey: 'auto_settle_enabled',
      settingName: '自动结算开关',
      settingValue: 'true',
      description: '开奖后自动结算下注，关闭后需手动结算',
      valueType: 'boolean',
    },
    {
      settingKey: 'maintenance_mode',
      settingName: '维护模式',
      settingValue: 'false',
      description: '开启后系统进入维护状态',
      valueType: 'boolean',
    },
    
    // ===== 网站信息 =====
    {
      settingKey: 'site_title',
      settingName: '网站标题',
      settingValue: '计分系统',
      description: '网站名称，显示在H5首页和浏览器标题栏',
      valueType: 'string',
    },
    {
      settingKey: 'site_subtitle',
      settingName: '网站副标题',
      settingValue: '一分耕耘，一分收获',
      description: '网站副标题，显示在H5首页',
      valueType: 'string',
    },
    {
      settingKey: 'system_notice',
      settingName: '系统公告',
      settingValue: '',
      description: '显示在H5首页的公告信息，为空则不显示',
      valueType: 'string',
    },
    
    // ===== 开奖与封盘配置 =====
    {
      settingKey: 'draw_interval',
      settingName: '开奖间隔时间',
      settingValue: '210',
      description: '两期开奖之间的间隔时间（秒），默认210秒=3.5分钟',
      valueType: 'number',
    },
    {
      settingKey: 'close_before_draw',
      settingName: '封盘时间',
      settingValue: '30',
      description: '开奖前多少秒封盘（0表示不封盘），默认30秒',
      valueType: 'number',
    },
    
    // ===== Telegram 通知配置 =====
    {
      settingKey: 'telegram_enabled',
      settingName: 'Telegram通知开关',
      settingValue: 'false',
      description: '是否开启Telegram下注通知',
      valueType: 'boolean',
    },
    {
      settingKey: 'telegram_bot_token',
      settingName: 'Telegram Bot Token',
      settingValue: '',
      description: 'Telegram机器人的Token，从@BotFather获取',
      valueType: 'string',
    },
    {
      settingKey: 'telegram_chat_id',
      settingName: 'Telegram Chat ID',
      settingValue: '',
      description: '接收通知的群组或频道ID',
      valueType: 'string',
    },
    {
      settingKey: 'telegram_report_rate',
      settingName: 'Telegram上报汇率',
      settingValue: '100',
      description: '金额除以此值后上报（如100表示1元=100积分）',
      valueType: 'number',
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { settingKey: setting.settingKey },
      update: setting,
      create: setting,
    });
  }
  console.log('✅ 系统设置(System Settings)已初始化');

  // 4. 创建测试用户
  const testUserPassword = await bcrypt.hash('123456', 10);
  const testUser = await prisma.user.upsert({
    where: { username: 'test' },
    update: {},
    create: {
      username: 'test',
      password: testUserPassword,
      nickname: '测试用户',
      points: 10000,
      status: 1, // 1 = active
    },
  });
  console.log('✅ 测试用户已创建:', testUser.username, '积分:', testUser.points);

  console.log('🎉 数据库初始化完成！');
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
