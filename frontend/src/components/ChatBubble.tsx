/** 消息气泡组件 */
import React from 'react'
import { Avatar, Typography } from 'antd'
import {
  UserOutlined,
  RobotOutlined,
  CrownOutlined
} from '@ant-design/icons'
import { Message } from '../services/api'

interface ChatBubbleProps {
  message: Message
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const getAvatar = () => {
    switch (message.role) {
      case 'user':
        return <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
      case 'agent':
        return <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
      case 'moderator':
        return <Avatar icon={<CrownOutlined />} style={{ backgroundColor: '#faad14' }} />
      default:
        return <Avatar>{message.role_id[0]?.toUpperCase()}</Avatar>
    }
  }

  const getBubbleStyle = () => {
    switch (message.role) {
      case 'user':
        return {
          backgroundColor: '#e6f7ff',
          marginLeft: 'auto',
          maxWidth: '70%'
        }
      case 'agent':
        return {
          backgroundColor: '#f6ffed',
          marginRight: 'auto',
          maxWidth: '70%'
        }
      default:
        return {
          backgroundColor: '#fffbe6',
          marginRight: 'auto',
          maxWidth: '70%'
        }
    }
  }

  return (
    <div style={{
      display: 'flex',
      marginBottom: 12,
      alignItems: 'flex-start',
      gap: 8
    }}>
      {message.role !== 'user' && getAvatar()}
      <div style={{
        ...getBubbleStyle(),
        padding: 12,
        borderRadius: 8,
        position: 'relative'
      }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
          {message.role_id}
        </div>
        <Typography.Text copyable={{ text: message.content }}>
          {message.content}
        </Typography.Text>
        <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
      {message.role === 'user' && getAvatar()}
    </div>
  )
}

export default ChatBubble