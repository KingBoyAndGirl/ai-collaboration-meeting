import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// 动画样式注入
const style = document.createElement('style')
style.textContent = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
  .animate-pulse-slow { animation: pulse 2s infinite; }
`
document.head.appendChild(style)

// 导航组件 - 全新设计
function Navigation({ currentView, onViewChange }) {
  const navItems = [
    { id: 'home', label: '首页', icon: '🏠' },
    { id: 'scenes', label: '场景', icon: '📋' },
    { id: 'meetings', label: '会议', icon: '🎤' },
    { id: 'monitor', label: '监控', icon: '📊' },
  ]

  return (
    <div className="flex space-x-2 mb-8 bg-gray-100/50 p-2 rounded-2xl">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium transition-all ${
            currentView === item.id
              ? 'bg-white text-indigo-600 shadow-md'
              : 'text-gray-600 hover:bg-white/50'
          }`}
        >
          <span className="mr-2">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  )
}

// 首页 - 全新设计
function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          AI 协作会议平台
        </h1>
        <p className="text-gray-600 text-lg mb-8">人类当导演，AI当演员</p>
        <div className="flex justify-center space-x-4">
          <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition">
            开始使用
          </button>
          <button className="px-8 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">
            查看文档
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: '场景管理', desc: '创建和管理 AI 协作场景', icon: '📋' },
          { title: '会议大厅', desc: '启动和监控 AI 会议', icon: '🎤' },
          { title: '产出物', desc: '查看和下载会议结果', icon: '📦' },
        ].map(item => (
          <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition">
            <div className="text-3xl mb-4">{item.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// 场景列表 - 全新设计
function SceneList() {
  const [scenes, setScenes] = useState([])

  useEffect(() => {
    setScenes([
      { id: 'code-dev', name: '代码开发', desc: '多角色协作完成代码开发' },
      { id: 'content', name: '内容创作', desc: '创作优质内容' },
      { id: 'business', name: '商业分析', desc: '市场分析和决策' },
    ])
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">场景管理</h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          + 新建场景
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map(scene => (
          <div key={scene.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg cursor-pointer">
            <h3 className="font-semibold text-lg mb-2">{scene.name}</h3>
            <p className="text-gray-600 text-sm">{scene.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// 会议大厅 - 全新设计
function MeetingHall() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">会议大厅</h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          开始新会议
        </button>
      </div>

      <div className="text-center py-12 text-gray-500">
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
          <h1 className="text-2xl font-bold">🤖 AI 协作会议平台</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Navigation currentView={view} onViewChange={setView} />
        
        <div className="animate-fadeInUp">
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