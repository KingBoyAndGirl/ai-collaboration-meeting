import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// 导航组件
function Navigation({ currentView, onViewChange }) {
  const navItems = [
    { id: 'home', label: '首页', icon: '🏠' },
    { id: 'scenes', label: '场景', icon: '📋' },
    { id: 'meetings', label: '会议', icon: '🎤' },
    { id: 'monitor', label: '监控', icon: '📊' },
  ]

  return (
    <div className="flex space-x-1 mb-6 bg-gray-100/70 p-1.5 rounded-xl">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`flex-1 flex items-center justify-center py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
            currentView === item.id
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:bg-white/60'
          }`}
        >
          <span className="mr-1.5">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  )
}

// 首页
function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-3 text-gradient">
          AI 协作会议平台
        </h1>
        <p className="text-gray-500 mb-6">人类当导演，AI当演员</p>
        <div className="flex justify-center space-x-3">
          <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium">
            开始使用
          </button>
          <button className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium">
            查看文档
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: '场景管理', desc: '创建和管理 AI 协作场景', icon: '📋' },
          { title: '会议大厅', desc: '启动和监控 AI 会议', icon: '🎤' },
          { title: '产出物', desc: '查看和下载会议结果', icon: '📦' },
        ].map(item => (
          <div key={item.title} className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
            <div className="text-2xl mb-3">{item.icon}</div>
            <h3 className="font-semibold mb-1">{item.title}</h3>
            <p className="text-gray-500 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// 场景列表
function SceneList() {
  const [scenes] = useState([
    { id: 'code-dev', name: '代码开发', desc: '多角色协作完成代码开发' },
    { id: 'content', name: '内容创作', desc: '创作优质内容' },
    { id: 'business', name: '商业分析', desc: '市场分析和决策' },
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">场景管理</h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          + 新建场景
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map(scene => (
          <div key={scene.id} className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
            <h3 className="font-semibold mb-1">{scene.name}</h3>
            <p className="text-gray-500 text-sm">{scene.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// 会议大厅
function MeetingHall() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">会议大厅</h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          开始新会议
        </button>
      </div>

      <div className="text-center py-12 text-gray-400">
        暂无会议
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
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gradient">🤖 AI 协作会议平台</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Navigation currentView={view} onViewChange={setView} />
        
        <div className="animate-fadeIn">
          {view === 'home' && <Home />}
          {view === 'scenes' && <SceneList />}
          {view === 'meetings' && <MeetingHall />}
          {view === 'monitor' && <div>监控页面</div>}
        </div>
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)