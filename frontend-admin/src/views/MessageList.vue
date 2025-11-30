<template>
  <div class="message-list-page">
    <el-card shadow="hover">
      <!-- 搜索和操作栏 -->
      <div class="toolbar">
        <div class="search-box">
          <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
            <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px" size="default">
              <el-option label="未读" value="unread" />
              <el-option label="已读" value="read" />
              <el-option label="已回复" value="replied" />
            </el-select>
            <el-input
              v-model="searchForm.keyword"
              placeholder="姓名/联系方式/内容"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" :icon="Search" @click="handleSearch">
              搜索
            </el-button>
          </div>
          <div style="display: flex; align-items: center; gap: 5px; justify-content: flex-end; flex-wrap: wrap;">
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            <el-button type="danger" :icon="Delete" @click="handleBatchDelete" :disabled="selectedIds.length === 0">
              批量删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-bar">
        <el-tag type="info" size="small">总计: {{ pagination.total }}</el-tag>
        <el-tag type="warning" size="small" v-if="unreadCount > 0">未读: {{ unreadCount }}</el-tag>
      </div>

      <!-- 表格 -->
      <div class="table-wrapper">
        <el-table
          :data="messageList"
          v-loading="loading"
          stripe
          size="small"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column prop="name" label="姓名" width="100" />
          
          <el-table-column prop="contact" label="联系方式" width="140" />
          
          <el-table-column prop="message" label="留言内容" min-width="200" show-overflow-tooltip />
          
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'unread'" type="danger" size="small">未读</el-tag>
              <el-tag v-else-if="row.status === 'read'" type="warning" size="small">已读</el-tag>
              <el-tag v-else-if="row.status === 'replied'" type="success" size="small">已回复</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="createdAt" label="提交时间" width="155">
            <template #default="{ row }">
              <span style="font-size: 12px;">{{ formatTime(row.createdAt) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button link type="primary" size="small" @click="handleView(row)">
                  查看
                </el-button>
                <el-button link type="success" size="small" @click="handleReply(row)" v-if="row.status !== 'replied'">
                  回复
                </el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchMessageList"
        @current-change="fetchMessageList"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="留言详情" width="90%" style="max-width: 600px;">
      <div v-if="currentMessage" class="message-detail">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="姓名" width="80px" label-align="right">{{ currentMessage.name }}</el-descriptions-item>
          <el-descriptions-item label="联系方式" width="80px" label-align="right">{{ currentMessage.contact }}</el-descriptions-item>
          <el-descriptions-item label="留言内容" width="80px" label-align="right">
            <div class="message-content">{{ currentMessage.message }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="状态" width="80px" label-align="right">
            <el-tag v-if="currentMessage.status === 'unread'" type="danger" size="small">未读</el-tag>
            <el-tag v-else-if="currentMessage.status === 'read'" type="warning" size="small">已读</el-tag>
            <el-tag v-else-if="currentMessage.status === 'replied'" type="success" size="small">已回复</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间" width="80px" label-align="right">
            <span style="font-size: 12px;">{{ formatTime(currentMessage.createdAt) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="管理员回复" width="80px" label-align="right" v-if="currentMessage.adminReply">
            <div class="admin-reply">{{ currentMessage.adminReply }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="回复时间" width="80px" label-align="right" v-if="currentMessage.repliedAt">
            <span style="font-size: 12px;">{{ formatTime(currentMessage.repliedAt) }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false" size="default">关闭</el-button>
        <el-button type="success" @click="handleReply(currentMessage!)" v-if="currentMessage && currentMessage.status !== 'replied'" size="default">
          回复
        </el-button>
      </template>
    </el-dialog>

    <!-- 回复对话框 -->
    <el-dialog v-model="replyDialogVisible" title="回复留言" width="90%" style="max-width: 600px;">
      <div v-if="currentMessage" class="reply-form">
        <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
          <template #title>
            <div style="font-size: 13px;">
              <div><strong>姓名：</strong>{{ currentMessage.name }}</div>
              <div><strong>联系方式：</strong>{{ currentMessage.contact }}</div>
            </div>
          </template>
          <div class="message-text" style="margin-top: 8px;">{{ currentMessage.message }}</div>
        </el-alert>
        
        <el-form :model="replyForm" ref="replyFormRef" :rules="replyRules" label-width="80px">
          <el-form-item label="回复内容" prop="adminReply">
            <el-input
              v-model="replyForm.adminReply"
              type="textarea"
              :rows="5"
              placeholder="请输入回复内容"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="replyDialogVisible = false" size="default">取消</el-button>
        <el-button type="primary" @click="handleSubmitReply" :loading="submitting" size="default">提交回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Search, Delete, Refresh } from '@element-plus/icons-vue'
import {
  getMessageList,
  getMessageDetail,
  replyMessage,
  deleteMessage,
  batchDeleteMessages,
  getUnreadCount,
  type Message
} from '@/api/message'
import dayjs from 'dayjs'

// 搜索表单
const searchForm = reactive({
  status: '',
  keyword: '',
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 数据列表
const messageList = ref<Message[]>([])
const loading = ref(false)
const selectedIds = ref<number[]>([])
const unreadCount = ref(0)

// 对话框
const viewDialogVisible = ref(false)
const replyDialogVisible = ref(false)
const currentMessage = ref<Message | null>(null)
const submitting = ref(false)

// 回复表单
const replyFormRef = ref<FormInstance>()
const replyForm = reactive({
  adminReply: '',
})
const replyRules: FormRules = {
  adminReply: [
    { required: true, message: '请输入回复内容', trigger: 'blur' }
  ]
}

/**
 * 获取留言列表
 */
const fetchMessageList = async () => {
  loading.value = true
  try {
    const res = await getMessageList({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    messageList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('获取留言列表失败:', error)
    ElMessage.error('获取留言列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 获取未读数量
 */
const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data.count
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

/**
 * 搜索
 */
const handleSearch = () => {
  pagination.page = 1
  fetchMessageList()
}

/**
 * 重置
 */
const handleReset = () => {
  searchForm.status = ''
  searchForm.keyword = ''
  pagination.page = 1
  fetchMessageList()
}

/**
 * 查看详情
 */
const handleView = async (row: Message) => {
  try {
    const res = await getMessageDetail(row.id)
    currentMessage.value = res.data
    viewDialogVisible.value = true
    // 刷新列表和未读数
    await Promise.all([fetchMessageList(), fetchUnreadCount()])
  } catch (error) {
    console.error('获取留言详情失败:', error)
    ElMessage.error('获取留言详情失败')
  }
}

/**
 * 回复
 */
const handleReply = (row: Message) => {
  currentMessage.value = row
  replyForm.adminReply = row.adminReply || ''
  replyDialogVisible.value = true
  viewDialogVisible.value = false
}

/**
 * 提交回复
 */
const handleSubmitReply = async () => {
  if (!replyFormRef.value || !currentMessage.value) return

  await replyFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      await replyMessage(currentMessage.value!.id, {
        adminReply: replyForm.adminReply,
      })
      ElMessage.success('回复成功')
      replyDialogVisible.value = false
      replyForm.adminReply = ''
      await Promise.all([fetchMessageList(), fetchUnreadCount()])
    } catch (error) {
      console.error('回复留言失败:', error)
      ElMessage.error('回复留言失败')
    } finally {
      submitting.value = false
    }
  })
}

/**
 * 删除
 */
const handleDelete = async (row: Message) => {
  try {
    await ElMessageBox.confirm('确定要删除这条留言吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteMessage(row.id)
    ElMessage.success('删除成功')
    await Promise.all([fetchMessageList(), fetchUnreadCount()])
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除留言失败:', error)
      ElMessage.error('删除留言失败')
    }
  }
}

/**
 * 批量删除
 */
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条留言吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await batchDeleteMessages(selectedIds.value)
    ElMessage.success('删除成功')
    selectedIds.value = []
    await Promise.all([fetchMessageList(), fetchUnreadCount()])
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

/**
 * 选择变化
 */
const handleSelectionChange = (selection: Message[]) => {
  selectedIds.value = selection.map(item => item.id)
}

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchMessageList()
  fetchUnreadCount()
})
</script>

<style scoped lang="scss">
.message-list-page {
  padding: 20px;

  @media (max-width: 768px) {
    padding: 10px;
  }
}

.toolbar {
  margin-bottom: 16px;

  .search-box {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;

      > div {
        width: 100%;
        justify-content: flex-start !important;
      }
    }
  }
}

.stats-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.table-wrapper {
  margin-top: 20px;
  overflow-x: auto;

  @media (max-width: 768px) {
    :deep(.el-table) {
      font-size: 12px;
    }
  }
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.message-detail {
  .message-content,
  .admin-reply {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.6;
  }
}

.reply-form {
  .message-text {
    padding: 8px;
    background: #fff;
    border-radius: 4px;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 13px;
    line-height: 1.6;
  }
}

// 移动端响应式分页
@media (max-width: 768px) {
  :deep(.el-pagination) {
    .el-pagination__sizes,
    .el-pagination__jump {
      display: none;
    }
  }
}
</style>

