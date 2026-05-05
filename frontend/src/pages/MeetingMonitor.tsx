"""会议监控页面"""
import React, { useState, useEffect } from 'react'
import { Card, List, Tag, Button, Space, Timeline, message } from 'antd'
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  CheckOutlined, 
  CloseOutlined 
} from '@ant-design/icons'
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
      await axios.post(`/api/intervention/meetings/${meetingId}/${action}`)
      message.success(`${action} 成功`)
      fetchMeetings()
    } catch (error) {
      message.error(`${action} 失败`)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={meetings}
        loading={loading}
        renderItem={meeting => (
          <List.Item>
            <Card 
              title={`会议 ${meeting.id}`}
              extra={<Tag color={meeting.status === 'running' ? 'green' : 'blue'}>{meeting.status}</Tag>}
            >
              <p>场景: {meeting.scene_name}</p>
              <p>阶段: {meeting.current_stage}</p>
              
              <Space>
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
                  </>
                )}
                {meeting.status !== 'paused' && (
                  <Button 
                    size="small" 
                    onClick={() => handleAction(meeting.id, 'pause')}
                  >
                    <PauseCircleOutlined /> 暂停
                  </Button>
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