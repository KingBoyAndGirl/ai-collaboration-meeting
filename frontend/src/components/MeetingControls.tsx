/** 会议控制组件 */
import React, { useState } from 'react'
import { Button, Input, Space, message, Modal } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  StopOutlined
} from '@ant-design/icons'
import { meetingApi } from '../services/api'

interface MeetingControlsProps {
  meetingId: string
  status: string
  onUpdate: () => void
}

const MeetingControls: React.FC<MeetingControlsProps> = ({ 
  meetingId, 
  status, 
  onUpdate 
}) => {
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  const handleAction = async (action: string) => {
    setLoading(action)
    try {
      switch (action) {
        case 'pause':
          await meetingApi.pause(meetingId)
          break
        case 'resume':
          await meetingApi.resume(meetingId)
          break
        case 'approve':
          await meetingApi.approve(meetingId)
          break
        case 'reject':
          await meetingApi.reject(meetingId)
          break
        case 'stop':
          await meetingApi.stop(meetingId)
          break
      }
      message.success(`${action} 成功`)
      onUpdate()
    } catch (error) {
      message.error(`${action} 失败`)
    } finally {
      setLoading(null)
    }
  }

  const handleFeedback = async () => {
    if (!feedback.trim()) return
    setLoading('feedback')
    try {
      await meetingApi.feedback(meetingId, feedback)
      message.success('反馈已发送')
      setFeedback('')
      setShowFeedbackModal(false)
      onUpdate()
    } catch (error) {
      message.error('反馈发送失败')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <Space>
        {status === 'running' && (
          <Button
            danger
            icon={<PauseCircleOutlined />}
            onClick={() => handleAction('pause')}
            loading={loading === 'pause'}
          >
            暂停
          </Button>
        )}
        
        {status === 'paused' && (
          <>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleAction('resume')}
              loading={loading === 'resume'}
            >
              恢复
            </Button>
            <Button
              danger
              icon={<StopOutlined />}
              onClick={() => handleAction('stop')}
              loading={loading === 'stop'}
            >
              停止
            </Button>
          </>
        )}

        {status === 'awaiting_approval' && (
          <>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleAction('approve')}
              loading={loading === 'approve'}
            >
              批准
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => handleAction('reject')}
              loading={loading === 'reject'}
            >
              驳回
            </Button>
          </>
        )}
      </Space>

      {status === 'running' && (
        <>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => setShowFeedbackModal(true)}
          >
            用户反馈
          </Button>
          
          <Modal
            title="用户反馈"
            open={showFeedbackModal}
            onOk={handleFeedback}
            onCancel={() => setShowFeedbackModal(false)}
            confirmLoading={loading === 'feedback'}
          >
            <Input.TextArea
              rows={4}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="输入反馈内容，AI 会在下一轮考虑"
            />
          </Modal>
        </>
      )}
    </div>
  )
}

export default MeetingControls