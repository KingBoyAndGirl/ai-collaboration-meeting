import React from 'react'
import { Routes, Route, Link, useParams } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import { 
  FileTextOutlined, 
  VideoCameraOutlined, 
  PlusOutlined
} from '@ant-design/icons'
import SceneList from './pages/SceneList'
import SceneEditor from './pages/SceneEditor'
import MeetingMonitor from './pages/MeetingMonitor'
import MeetingDetail from './pages/MeetingDetail'

const { Header, Content, Footer, Sider } = Layout

function MeetingDetailWrapper() {
  const { id } = useParams<{ id: string }>()
  if (!id) return null
  return <MeetingDetail meetingId={id} />
}

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)' }} />
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['scenes']}>
          <Menu.Item key="scenes" icon={<FileTextOutlined />}>
            <Link to="/">场景管理</Link>
          </Menu.Item>
          <Menu.Item key="create-scene" icon={<PlusOutlined />}>
            <Link to="/scenes/create">创建场景</Link>
          </Menu.Item>
          <Menu.Item key="meetings" icon={<VideoCameraOutlined />}>
            <Link to="/meetings">会议列表</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: 0 }} />
        <Content style={{ margin: '24px 16px 0' }}>
          <Routes>
            <Route path="/" element={<SceneList />} />
            <Route path="/scenes/create" element={<SceneEditor />} />
            <Route path="/meetings" element={<MeetingMonitor />} />
            <Route path="/meetings/:id" element={<MeetingDetailWrapper />} />
          </Routes>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          AI Meeting Platform © 2026
        </Footer>
      </Layout>
    </Layout>
  )
}

export default App