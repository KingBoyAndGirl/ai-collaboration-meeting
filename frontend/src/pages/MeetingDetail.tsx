/** 会议详情页面 - 实时消息 */
import React, { useEffect, useState } from 'react'
import { Card, List, Tag, Button, Space, Input, message, Row, Col } from 'antd'
import { useMeetingWebSocket } from '../hooks/useWebSocket'
import ChatBubble from '../components/ChatBubble'
import StageProgress from '../components/StageProgress'
import MeetingControls from '../components/MeetingControls'
import { meetingApi } from '../services/api'

interface MeetingDetailProps {
  meetingId: string
}

interface Stage {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

interface Meeting {
  id: string
  status: string
  stages: Stage[]
  current_stage: number
}

export default function MeetingDetail({ meetingId }: MeetingDetailProps) {
  const { messages, connected } = useMeetingWebSocket(meetingId)
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchMeeting = async () => {
    setLoading(true)
    try {
      const data = await meetingApi.get(meetingId)
      setMeeting(data)
    } catch (error) {
      message.error('加载会议失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeeting()
    const interval = setInterval(fetchMeeting, 5000)
    return () => clearInterval(interval)
  }, [meetingId])

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={24}>
        {/* 左侧阶段进度 */}
        <Col span={6}>
          <Card title="会议阶段" bordered={false}>
            {meeting && (
              <StageProgress 
                stages={meeting.stages} 
                currentStageIndex={meeting.current_stage} 
              />
            )}
          </Card>
        </Col>

        {/* 右侧消息列表 */}
        <Col span={18}>
          <Card 
            title={`会议 ${meetingId}`}
            extra={
              meeting && (
                <MeetingControls 
                  meetingId={meetingId}
                  status={meeting.status}
                  onUpdate={fetchMeeting}
                />
              )
            }
          >
            <Space style={{ marginBottom: 16 }}>
              <Tag color={connected ? 'green' : 'red'}>
                {connected ? 'WebSocket 已连接' : 'WebSocket 未连接'}
              </Tag>
              <Tag color={meeting?.status === 'running' ? 'blue' : 'default'}>
                {meeting?.status || '加载中...'}
              </Tag>
            </Space>

            <List
              dataSource={messages}
              renderItem={msg => (
                <ChatBubble message={msg.data} />
              )}
              locale={{ emptyText: '等待消息...' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}