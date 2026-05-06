// 场景列表页面
import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CodeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

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
    const interval = setInterval(fetchScenes, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleCreate = () => {
    setEditingScene(null)
    form.resetFields()
    form.setFieldsValue({ version: '1.0' })
    setModalVisible(true)
  }

  const handleEdit = (scene: Scene) => {
    setEditingScene(scene)
    form.setFieldsValue(scene)
    setModalVisible(true)
  }

  const handleDelete = async (sceneId: string) => {
    try {
      await axios.delete(`/api/scenes/${sceneId}`)
      message.success('删除成功')
      fetchScenes()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleRun = (sceneName: string) => {
    navigate(`/meetings`, { state: { sceneName } })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingScene) {
        await axios.put(`/api/scenes/${editingScene.id}`, values)
        message.success('更新成功')
      } else {
        await axios.post('/api/scenes', {
          ...values,
          roles: [],
          stages: []
        })
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
      render: (_: any, record: Scene) => (
        <>
          <Button 
            type="link" 
            onClick={() => handleRun(record.name)}
            title="运行会议"
          >
            <CodeOutlined /> 运行
          </Button>
          <Button type="link" onClick={() => handleEdit(record)}>
            <EditOutlined /> 编辑
          </Button>
          <Popconfirm
            title="确认删除?"
            onConfirm={() => handleDelete(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button type="link" danger>
              <DeleteOutlined /> 删除
            </Button>
          </Popconfirm>
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
      
      <Table 
        dataSource={scenes} 
        columns={columns} 
        loading={loading}
        rowKey="id"
      />

      <Modal
        title={editingScene ? '编辑场景' : '新建场景'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          {!editingScene && (
            <Form.Item name="id" label="ID" rules={[{ required: true, pattern: /^[a-z0-9-]+$/ }]}>
              <Input placeholder="场景ID (小写字母和横杠)" />
            </Form.Item>
          )}
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="场景名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="场景描述" />
          </Form.Item>
          <Form.Item name="version" label="版本" rules={[{ required: true }]}>
            <Input defaultValue="1.0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}