import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// 导航组件 - 美化版
function Navigation({ currentView, onViewChange }) {
  const navItems = [
    { id: 'home', label: '首页', icon: '🏠' },
    { id: 'scenes', label: '场景管理', icon: '📋' },
    { id: 'meetings', label: '会议大厅', icon: '🎤' },
    { id: 'monitor', label: '会议监控', icon: '📊' },
  ]

  return (
    <nav className="flex flex-wrap gap-3 mb-8">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`flex items-center px-5 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 ${
            currentView === item.id
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span className="mr-2 text-lg">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}

// 场景列表页 - 美化版
function SceneList({ onSceneSelect }) {
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">场景管理</h2>
        <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition">
          + 新建场景
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map(scene => (
          <div 
            key={scene.id}
            onClick={() => onSceneSelect(scene.id)}
            className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl cursor-pointer transition-all transform hover:-translate-y-1"
          >
            <h3 className="text-xl font-semibold mb-3 text-gray-900">{scene.name}</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{scene.desc}</p>
            <div className="text-xs text-gray-500">{scene.updated}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 会议大厅 - 美化版
function MeetingHall() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">会议大厅</h2>
        <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition">
          开始新会议
        </button>
      </div>

      <div className="text-center py-20">
        <div className="text-6xl mb-4">🎤</div>
        <p className="text-gray-500 text-lg">暂无会议，点击"开始新会议"创建</p>
      </div>
    </div>
  )
}

// 首页 - 美化版
function Home() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">欢迎使用 AI 协作会议平台</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
          <h3 className="text-xl font-semibold mb-3 text-gray-900">🚀 快速开始</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">从预置场景开始您的 AI 协作之旅，让 AI 助手帮助您完成任务</p>
          <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition">
            选择场景
          </button>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-8 border border-gray-100">
          <h3 className="text-xl font-semibold mb-3 text-gray-900">📊 最近活动</h3>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">🤖 AI 协作会议平台</h1>
          <p className="text-gray-600 mt-2">人类当导演，AI当演员 - 用 AI 智能完成任何任务</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <Navigation currentView={view} onViewChange={setView} />
        
        <div className="animate-fadeIn">
          {view === 'home' && <Home />}
          {view === 'scenes' && <SceneList onSceneSelect={(id) => console.log('选择场景:', id)} />}
          {view === 'meetings' && <MeetingHall />}
          {view === 'monitor' && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <h3 className="text-xl font-semibold mb-4">📊 会议监控</h3>
              <p className="text-gray-600">请选择会议或前往会议大厅</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)