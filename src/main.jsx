import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// 导航组件
function Navigation({ currentView, onViewChange }) {
  const navItems = [
    { id: 'home', label: '首页', icon: '🏠' },
    { id: 'scenes', label: '场景管理', icon: '📋' },
    { id: 'meetings', label: '会议大厅', icon: '🎤' },
    { id: 'monitor', label: '会议监控', icon: '📊' },
  ]

  return (
    <nav className="flex space-x-2 mb-6">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            currentView === item.id
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="mr-2">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}

// 场景列表页
function SceneList({ onSceneSelect }) {
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟数据
    setTimeout(() => {
      setScenes([
        { id: 'code-dev', name: '代码开发会议', desc: '多角色协作完成代码开发', updated: '2小时前' },
        { id: 'content', name: '内容创作会议', desc: '创作优质内容', updated: '昨天' },
        { id: 'business', name: '商业分析会议', desc: '市场分析和决策', updated: '3天前' },
      ])
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">场景管理</h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          + 新建场景
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map(scene => (
          <div 
            key={scene.id}
            onClick={() => onSceneSelect(scene.id)}
            className="border rounded-xl p-6 hover:shadow-lg cursor-pointer transition"
          >
            <h3 className="text-lg font-semibold mb-2">{scene.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{scene.desc}</p>
            <div className="text-xs text-gray-500">{scene.updated}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 会议大厅
function MeetingHall() {
  const [meetings, setMeetings] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">会议大厅</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          开始新会议
        </button>
      </div>

      <div className="text-center py-12 text-gray-500">
        <p>暂无会议，点击"开始新会议"创建</p>
      </div>
    </div>
  )
}

// 首页
function Home() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">欢迎使用 AI 协作会议平台</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">🚀 快速开始</h3>
          <p className="text-gray-600 mb-4">从预置场景开始您的 AI 协作之旅</p>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
            选择场景
          </button>
        </div>
        <div className="border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">📊 最近活动</h3>
          <p className="text-gray-600">暂无活动记录</p>
        </div>
      </div>
    </div>
  )
}

// 主应用
function App() {
  const [view, setView] = useState('home')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">🤖 AI 协作会议平台</h1>
          <p className="text-gray-600 text-sm">人类当导演，AI当演员</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Navigation currentView={view} onViewChange={setView} />
        
        {view === 'home' && <Home />}
        {view === 'scenes' && <SceneList onSceneSelect={(id) => console.log('选择场景:', id)} />}
        {view === 'meetings' && <MeetingHall />}
        {view === 'monitor' && (
          <div className="border rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">📊 会议监控</h3>
            <p className="text-gray-600">请选择会议或前往会议大厅</p>
          </div>
        )}
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)