"""场景列表页面"""
import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import axios from 'axios'

interface Scene {
  id: string
  name: string
  description: string
  version: string
}

export default function SceneList() {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingScene, setEditingScene] = useState<Scene | null>(null)
  const [form] = Form.useForm()

  const fetchScenes = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/scenes')
      setScenes(response.data.items)
    } catch (error) {
      message.error('加载场景失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScenes()
  }, [])

  const handleCreate = () => {
    setEditingScene(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (scene: Scene) => {
    setEditingScene(scene)
    form.setFieldsValue(scene)
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingScene) {
        // 更新
        await axios.put(`/api/scenes/${editingScene.id}`, values)
        message.success('更新成功')
      } else {
        // 创建
        await axios.post('/api/scenes', values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchScenes()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '版本', dataIndex: 'version', key: 'version' },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Scene) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            <EditOutlined /> 编辑
          </Button>
          <Button type="link" danger onClick={() => {}}>
            <DeleteOutlined /> 删除
          </Button>
        </>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleCreate}>
          <PlusOutlined /> 新建场景
        </Button>
      </div>
      
      <Table dataSource={scenes} columns={columns} loading={loading} />

      <Modal
        title={editingScene ? '编辑场景' : '新建场景'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" label="ID" rules={[{ required: true }]}>
            <Input disabled={!!editingScene} />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="version" label="版本" rules={[{ required: true }]}>
            <Input defaultValue="1.0.0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}