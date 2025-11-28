/**
 * JND28 API连接测试脚本
 * 运行方式: npx ts-node test-jnd28-connection.ts
 */

import axios from 'axios';
import * as https from 'https';

async function testJND28Connection() {
  console.log('🧪 开始测试JND28 API连接...\n');
  
  const apiUrl = 'https://c2api.canada28.vip/api/lotteryresult/result_jnd28';
  const params = {
    game_id: '7',
    page: '1',
    pageSize: '5',  // 获取5条数据用于测试
  };

  // 创建 https agent，忽略 SSL 证书验证
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    console.log('📡 请求URL:', apiUrl);
    console.log('📝 请求参数:', JSON.stringify(params, null, 2));
    console.log('⏱️  开始请求...\n');

    const startTime = Date.now();

    const response = await axios.get(apiUrl, {
      params,
      timeout: 15000,  // 15秒超时
      httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      validateStatus: (status) => status < 500,
    });

    const responseTime = Date.now() - startTime;

    console.log('✅ 请求成功！');
    console.log('⏱️  响应时间:', responseTime, 'ms');
    console.log('📊 HTTP状态码:', response.status);
    console.log('\n📦 响应数据结构:');
    console.log('─────────────────────────────────────');

    const data = response.data;

    if (data.error === 0) {
      console.log('✅ API状态: 正常 (error = 0)');
      console.log('📋 数据列表长度:', data.result_list?.length || 0);
      console.log('📊 总记录数:', data.total || 0);
      console.log('📄 当前页:', data.page || 0);

      if (data.current_info) {
        console.log('\n🎰 当前期信息:');
        console.log('  期号:', data.current_info.expect || data.current_info.fk_expect_id);
        console.log('  开奖时间:', data.current_info.opentime);
        console.log('  开奖号码:', `${data.current_info.code1}, ${data.current_info.code2}, ${data.current_info.code3}`);
        console.log('  和值:', data.current_info.he);
        console.log('  大小单双:', data.current_info.dxds);
      }

      if (data.next_info) {
        console.log('\n⏭️  下期信息:');
        console.log('  期号:', data.next_info.expect);
        console.log('  开奖时间:', data.next_info.opentime);
      }

      if (data.result_list && data.result_list.length > 0) {
        console.log('\n📜 最近开奖记录 (前3条):');
        console.log('─────────────────────────────────────');
        data.result_list.slice(0, 3).forEach((item: any, index: number) => {
          console.log(`\n${index + 1}. 期号: ${item.expect}`);
          console.log(`   开奖时间: ${item.datetime || item.opentime}`);
          console.log(`   开奖号码: ${item.code1}, ${item.code2}, ${item.code3}`);
          console.log(`   和值: ${item.he}`);
          console.log(`   大小单双: ${item.dxds || `${item.big ? '大' : '小'}${item.odd ? '单' : '双'}`}`);
        });
      }

      console.log('\n─────────────────────────────────────');
      console.log('✅ JND28 API 连接测试通过！');
      console.log('🎉 数据源可以正常使用');

    } else {
      console.log('❌ API返回错误:', data.error);
      console.log('错误信息:', data.msg || '未知错误');
      console.log('\n完整响应:', JSON.stringify(data, null, 2));
    }

  } catch (error: any) {
    console.log('❌ 连接失败！\n');
    
    if (error.code === 'ECONNABORTED') {
      console.log('⏱️  错误类型: 请求超时');
      console.log('建议: 增加 timeout 值或检查网络连接');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🌐 错误类型: DNS解析失败');
      console.log('建议: 检查域名是否正确，或检查DNS设置');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🚫 错误类型: 连接被拒绝');
      console.log('建议: 检查防火墙设置或API服务是否在线');
    } else if (error.response) {
      console.log('📡 错误类型: HTTP错误');
      console.log('HTTP状态码:', error.response.status);
      console.log('响应数据:', error.response.data);
    } else if (error.request) {
      console.log('📡 错误类型: 请求已发送但无响应');
      console.log('建议: 检查网络连接或API服务器状态');
    } else {
      console.log('❓ 错误类型: 未知错误');
      console.log('错误信息:', error.message);
    }

    console.log('\n完整错误:', error);
    process.exit(1);
  }
}

// 运行测试
testJND28Connection().then(() => {
  console.log('\n✅ 测试完成');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ 测试异常:', error);
  process.exit(1);
});

