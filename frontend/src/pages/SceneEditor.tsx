/** 场景编辑器页面 */
import React, { useState } from 'react'
import { Card, Form, Input, Button, Select, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { sceneApi } from '../services/api'

export default function SceneEditor() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const scene = await sceneApi.create({
        name: values.name,
        description: values.description,
        version: '1.0',
        roles: values.roles || [],
        stages: values.stages || []
      })
      message.success('场景创建成功')
      navigate('/')
    } catch (error) {
      message.error('创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <Card title="创建场景">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="场景名称" rules={[{ required: true }]}>
            <Input placeholder="例如: 代码审查会议" />
          </Form.Item>

          <Form.Item name="description" label="场景描述" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="描述这个场景的用途" />
          </Form.Item>

          <Form.Item name="roles" label="角色 (JSON)">
            <Input.TextArea 
              rows={4} 
              placeholder='[{"id": "reviewer", "name": "审查员", "description": "审查代码", "executor": "hermes"}]'
            />
          </Form.Item>

          <Form.Item name="stages" label="阶段 (JSON)">
            <Input.TextArea 
              rows={4} 
              placeholder='[{"id": "review", "type": "review", "roles": ["reviewer"], "moderator": "reviewer", "max_rounds": 2}]'
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建场景
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}