/** 产出物查看器组件 */
import React, { useState, useEffect } from 'react'
import { Card, Tabs, Button, message, List, Tag, Spin } from 'antd'
import { DownloadOutlined, FileOutlined } from '@ant-design/icons'
import { outputApi, OutputInfo } from '../services/api'

interface OutputViewerProps {
  meetingId: string
}

const OutputViewer: React.FC<OutputViewerProps> = ({ meetingId }) => {
  const [outputs, setOutputs] = useState<OutputInfo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadOutputs()
  }, [meetingId])

  const loadOutputs = async () => {
    setLoading(true)
    try {
      const data = await outputApi.list()
      setOutputs(data)
    } catch (error) {
      message.error('加载产出物失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (filename: string) => {
    window.open(outputApi.download(filename), '_blank')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  if (loading) {
    return <Spin tip="加载产出物中..." />
  }

  return (
    <Card title="产出物" bordered={false}>
      <Tabs defaultActiveKey="list">
        <Tabs.TabPane tab="文件列表" key="list">
          <List
            dataSource={outputs}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(item.filename)}
                  >
                    下载
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<FileOutlined style={{ fontSize: 24 }} />}
                  title={item.filename}
                  description={
                    <>
                      <Tag>{item.filename.split('.').pop()?.toUpperCase()}</Tag>
                      <span style={{ marginLeft: 8 }}>
                        {formatFileSize(item.size)}
                      </span>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="会议记录" key="record">
          <p>会议记录功能开发中...</p>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  )
}

export default OutputViewer