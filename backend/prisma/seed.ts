import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  // 1. 创建默认管理员
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      realName: '系统管理员',
      role: 'superadmin',
      status: 1,
    },
  });
  console.log('✅ 创建默认管理员:', admin.username);

  // 2. 初始化下注设置
  const betSettings = [
    {
      settingKey: 'multiple_fee_rate',
      settingValue: '3',
      settingName: '倍数下注手续费比例',
      description: '每100为3',
      valueType: 'number',
    },
    {
      settingKey: 'multiple_fee_base',
      settingValue: '100',
      settingName: '倍数下注手续费基数',
      description: '基数为100',
      valueType: 'number',
    },
    {
      settingKey: 'combo_fee_rate',
      settingValue: '5',
      settingName: '组合下注手续费比例',
      description: '每100为5',
      valueType: 'number',
    },
    {
      settingKey: 'combo_fee_base',
      settingValue: '100',
      settingName: '组合下注手续费基数',
      description: '基数为100',
      valueType: 'number',
    },
    {
      settingKey: 'min_bet_amount',
      settingValue: '10',
      settingName: '最小下注金额',
      description: '单次最小下注积分',
      valueType: 'number',
    },
    {
      settingKey: 'max_bet_amount',
      settingValue: '10000',
      settingName: '最大下注金额',
      description: '单次最大下注积分',
      valueType: 'number',
    },
    {
      settingKey: 'max_bets_per_issue',
      settingValue: '10',
      settingName: '单期最大下注次数',
      description: '每个用户每期最多下注次数',
      valueType: 'number',
    },
    {
      settingKey: 'multiple_loss_rate',
      settingValue: '0.8',
      settingName: '倍数下注不回本损失比例',
      description: '不回本时损失比例',
      valueType: 'number',
    },
  ];

  for (const setting of betSettings) {
    await prisma.betSetting.upsert({
      where: { settingKey: setting.settingKey },
      update: {},
      create: setting,
    });
  }
  console.log('✅ 初始化下注设置:', betSettings.length, '条');

  // 3. 初始化系统设置
  const systemSettings = [
    {
      settingKey: 'game_enabled',
      settingValue: 'true',
      settingName: '游戏开启状态',
      description: '是否允许用户下注',
      valueType: 'boolean',
    },
    {
      settingKey: 'maintenance_mode',
      settingValue: 'false',
      settingName: '维护模式',
      description: '开启后用户无法访问',
      valueType: 'boolean',
    },
    {
      settingKey: 'system_notice',
      settingValue: '欢迎使用计分系统！',
      settingName: '系统公告',
      description: '首页显示的公告内容',
      valueType: 'string',
    },
    {
      settingKey: 'lottery_data_source',
      settingValue: 'http://localhost:8081/userApi/Lott',
      settingName: '开奖数据源地址',
      description: '从旧系统获取开奖数据的API地址',
      valueType: 'string',
    },
    {
      settingKey: 'auto_settle_enabled',
      settingValue: 'true',
      settingName: '自动结算开关',
      description: '是否自动结算开奖结果',
      valueType: 'boolean',
    },
    {
      settingKey: 'draw_interval',
      settingValue: '210',
      settingName: '开奖间隔时间',
      description: '两次开奖之间的间隔（秒），默认210秒（3.5分钟）',
      valueType: 'number',
    },
    {
      settingKey: 'close_before_draw',
      settingValue: '30',
      settingName: '封盘时间',
      description: '开奖前多少秒封盘（禁止下注），0表示不封盘，默认30秒',
      valueType: 'number',
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { settingKey: setting.settingKey },
      update: {},
      create: setting,
    });
  }
  console.log('✅ 初始化系统设置:', systemSettings.length, '条');

  // 4. 创建测试用户（可选）
  if (process.env.NODE_ENV === 'development') {
    const testUserPassword = await bcrypt.hash('123456', 10);
    const testUsers = [
      {
        username: 'user001',
        password: testUserPassword,
        nickname: '测试用户1',
        points: 5000,
      },
      {
        username: 'user002',
        password: testUserPassword,
        nickname: '测试用户2',
        points: 3000,
      },
    ];

    for (const userData of testUsers) {
      await prisma.user.upsert({
        where: { username: userData.username },
        update: {},
        create: userData,
      });
    }
    console.log('✅ 创建测试用户:', testUsers.length, '个');
  }

  console.log('✅ 数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

