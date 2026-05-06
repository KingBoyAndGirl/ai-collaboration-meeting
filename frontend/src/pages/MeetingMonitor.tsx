/** 会议监控页面 */
import React, { useState, useEffect } from 'react'
import { Card, List, Tag, Button, Space, message, Typography } from 'antd'
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  CheckOutlined, 
  CloseOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface Meeting {
  id: string
  scene_name: string
  status: string
  current_stage: number
}

export default function MeetingMonitor() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchMeetings = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/meetings')
      setMeetings(response.data.items)
    } catch (error) {
      message.error('加载会议失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetings()
    const interval = setInterval(fetchMeetings, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleAction = async (meetingId: string, action: string) => {
    try {
      if (action === 'view') {
        navigate(`/meetings/${meetingId}`)
        return
      }
      await axios.post(`/api/intervention/meetings/${meetingId}/${action}`)
      message.success(`${action} 成功`)
      fetchMeetings()
    } catch (error: any) {
      const detail = error.response?.data?.detail || `${action} 失败`
      message.error(detail)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'green'
      case 'completed': return 'blue'
      case 'failed': return 'red'
      case 'paused': return 'orange'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '进行中'
      case 'completed': return '已完成'
      case 'failed': return '失败'
      case 'paused': return '已暂停'
      default: return status
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={fetchMeetings} icon={<ReloadOutlined />}>
          刷新
        </Button>
        <Typography.Text type="secondary">
          自动刷新: 5秒
        </Typography.Text>
      </Space>

      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={meetings}
        loading={loading}
        locale={{ emptyText: '暂无会议' }}
        renderItem={meeting => (
          <List.Item>
            <Card 
              title={`会议 ${meeting.id}`}
              extra={<Tag color={getStatusColor(meeting.status)}>{getStatusText(meeting.status)}</Tag>}
            >
              <p>场景: {meeting.scene_name}</p>
              
              <Space>
                <Button 
                  size="small" 
                  onClick={() => handleAction(meeting.id, 'view')}
                >
                  查看详情
                </Button>

                {meeting.status === 'running' && (
                  <>
                    <Button 
                      size="small" 
                      onClick={() => handleAction(meeting.id, 'approve')}
                    >
                      <CheckOutlined /> 批准
                    </Button>
                    <Button 
                      size="small" 
                      danger
                      onClick={() => handleAction(meeting.id, 'reject')}
                    >
                      <CloseOutlined /> 驳回
                    </Button>
                    <Button 
                      size="small" 
                      onClick={() => handleAction(meeting.id, 'pause')}
                    >
                      <PauseCircleOutlined /> 暂停
                    </Button>
                  </>
                )}

                {meeting.status === 'paused' && (
                  <Button 
                    size="small" 
                    onClick={() => handleAction(meeting.id, 'resume')}
                  >
                    <PlayCircleOutlined /> 恢复
                  </Button>
                )}
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </div>
  )
}