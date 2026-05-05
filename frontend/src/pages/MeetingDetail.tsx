"""会议详情页面 - 实时消息"""
import React, { useEffect, useState } from 'react'
import { Card, List, Tag, Button, Space, Input, message } from 'antd'
import { useWebSocket } from '../hooks/useWebSocket'

interface MeetingDetailProps {
  meetingId: string
}

export default function MeetingDetail({ meetingId }: MeetingDetailProps) {
  const { messages, connected } = useWebSocket(meetingId)
  const [feedback, setFeedback] = useState("")

  const sendFeedback = async () => {
    try {
      await fetch(`/api/intervention/meetings/${meetingId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: feedback })
      })
      message.success('反馈已发送')
      setFeedback("")
    } catch (error) {
      message.error('发送失败')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title={`会议 ${meetingId}`}>
        <Space style={{ marginBottom: 16 }}>
          <Tag color={connected ? 'green' : 'red'}>
            {connected ? '已连接' : '未连接'}
          </Tag>
        </Space>

        <List
          dataSource={messages}
          renderItem={item => (
            <List.Item>
              <Card size="small" style={{ width: '100%' }}>
                <Tag color="blue">{item.data?.role_id || '系统'}</Tag>
                <p>{item.data?.content}</p>
              </Card>
            </List.Item>
          )}
        />

        <div style={{ marginTop: 24 }}>
          <Space>
            <Input.TextArea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="输入反馈..."
              rows={2}
              style={{ width: 300 }}
            />
            <Button onClick={sendFeedback} type="primary">
              发送反馈
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}