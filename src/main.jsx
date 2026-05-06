import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// 导航组件
function Navigation({ currentView, onViewChange }) {
  const navItems = [
    { id: 'home', label: '首页', icon: '🏠', desc: '概览与统计' },
    { id: 'scenes', label: '场景', icon: '📋', desc: '管理协作场景' },
    { id: 'meetings', label: '会议', icon: '🎤', desc: '启动和管理' },
    { id: 'monitor', label: '监控', icon: '📊', desc: '实时监控' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3 mb-8">
      {navItems.map((item, index) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`card p-4 text-left transition-all animate-fadeIn ${
            currentView === item.id
              ? 'ring-2 ring-[var(--primary)] shadow-md'
              : 'hover:shadow-md'
          }`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="text-2xl mb-2">{item.icon}</div>
          <div className="font-semibold text-sm">{item.label}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">{item.desc}</div>
        </button>
      ))}
    </div>
  )
}

// 统计卡片
function StatCard({ icon, label, value, trend, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
    </div>
  )
}

// 首页
function Home() {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 欢迎区域 */}
      <div className="gradient-primary rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">欢迎回来 👋</h1>
        <p className="text-white/90 mb-6 max-w-md">
          AI 协作会议平台 - 让人类当导演，AI当演员，通过会议协作完成任何任务
        </p>
        <div className="flex gap-3">
          <button className="bg-white text-[var(--primary)] px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition">
            开始新会议
          </button>
          <button className="bg-white/20 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-white/30 transition">
            查看文档
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="📋" label="场景总数" value="12" trend={8} />
        <StatCard icon="🎤" label="会议次数" value="48" trend={12} />
        <StatCard icon="💬" label="消息总数" value="1,234" trend={23} />
        <StatCard icon="🤖" label="Agent 调用" value="3,456" trend={15} />
      </div>

      {/* 最近场景 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">最近使用的场景</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 1, name: '代码开发', desc: '多角色协作完成代码开发', emoji: '💻' },
            { id: 2, name: '内容创作', desc: '创作优质内容', emoji: '✍️' },
            { id: 3, name: '商业分析', desc: '市场分析和决策', emoji: '📊' },
          ].map((scene, index) => (
            <div key={scene.id} className="card p-5 animate-fadeIn" style={{ animationDelay: `${index * 0.15}s` }}>
              <div className="text-2xl mb-3">{scene.emoji}</div>
              <h3 className="font-semibold mb-1">{scene.name}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">{scene.desc}</p>
              <button className="mt-4 text-sm text-[var(--primary)] font-medium hover:underline">
                开始会议 →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 快速开始 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-semibold mb-3">🚀 快速开始</h3>
          <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
            <li className="flex items-start">
              <span className="mr-2 mt-1">1.</span>
              <span>选择一个预置场景或创建自定义场景</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1">2.</span>
              <span>配置角色和 Agent</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1">3.</span>
              <span>启动会议，AI 开始协作讨论</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1">4.</span>
              <span>查看产出物并下载</span>
            </li>
          </ul>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold mb-3">💡 使用提示</h3>
          <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
            <li className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>可以随时介入 AI 讨论，提供反馈</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>支持暂停和恢复会议</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>可以导出 Markdown 格式的产出物</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>支持多 Agent 并行讨论</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// 场景列表
function SceneList() {
  const [scenes] = useState([
    { id: 1, name: '代码开发', desc: '多角色协作完成代码开发', emoji: '💻', updated: '2小时前' },
    { id: 2, name: '内容创作', desc: '创作优质内容', emoji: '✍️', updated: '1天前' },
    { id: 3, name: '商业分析', desc: '市场分析和决策', emoji: '📊', updated: '3天前' },
    { id: 4, name: '产品设计', desc: '产品需求分析和设计', emoji: '🎨', updated: '1周前' },
    { id: 5, name: '技术调研', desc: '技术方案调研和评估', emoji: '🔬', updated: '2周前' },
    { id: 6, name: '文档撰写', desc: '技术文档撰写', emoji: '📝', updated: '1月前' },
  ])

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">场景管理</h2>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">创建和管理 AI 协作场景</p>
        </div>
        <button className="btn-primary">
          + 新建场景
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map((scene, index) => (
          <div 
            key={scene.id} 
            className="card p-5 cursor-pointer animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{scene.emoji}</span>
              <span className="text-xs text-[var(--muted-foreground)]">{scene.updated}</span>
            </div>
            <h3 className="font-semibold mb-1">{scene.name}</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">{scene.desc}</p>
            <button className="text-sm text-[var(--primary)] font-medium hover:underline">
              开始会议 →
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// 会议大厅
function MeetingHall() {
  const [meetings] = useState([
    { id: 1, name: '用户管理系统开发', status: '进行中', agents: 3, progress: 65 },
    { id: 2, name: 'API 文档撰写', status: '已完成', agents: 2, progress: 100 },
    { id: 3, name: '市场调研分析', status: '已暂停', agents: 4, progress: 30 },
  ])

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">会议大厅</h2>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">启动和管理 AI 会议</p>
        </div>
        <button className="btn-primary">
          开始新会议
        </button>
      </div>

      <div className="space-y-3">
        {meetings.map((meeting, index) => (
          <div 
            key={meeting.id} 
            className="card p-5 animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{meeting.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    meeting.status === '进行中' ? 'bg-blue-50 text-blue-600' :
                    meeting.status === '已完成' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {meeting.status}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {meeting.agents} 个 Agent
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{meeting.progress}%</div>
                <div className="w-24 bg-gray-100 rounded-full h-2 mt-2">
                  <div 
                    className="bg-[var(--primary)] rounded-full h-2 transition-all"
                    style={{ width: `${meeting.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 监控页面
function Monitor() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold">实时监控</h2>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">监控会议状态和 Agent 活动</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">📊 系统状态</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Agent 在线</span>
              <span className="text-sm font-medium text-emerald-600">4/4</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">进行中会议</span>
              <span className="text-sm font-medium">2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">今日消息</span>
              <span className="text-sm font-medium">128</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">⚡ 最近活动</h3>
          <div className="space-y-3">
            {[
              { time: '10:30', text: 'Agent 完成代码审查', type: 'success' },
              { time: '10:15', text: '新会议启动', type: 'info' },
              { time: '10:00', text: '系统维护完成', type: 'warning' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`w-2 h-2 mt-2 rounded-full ${
                  activity.type === 'success' ? 'bg-emerald-500' :
                  activity.type === 'info' ? 'bg-blue-500' : 'bg-amber-500'
                }`} />
                <div>
                  <div className="text-sm">{activity.text}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 主应用
function App() {
  const [view, setView] = useState('home')

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
              AI
            </div>
            <h1 className="text-xl font-bold">协作会议平台</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="btn-secondary text-sm">
              帮助文档
            </button>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
              U
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Navigation currentView={view} onViewChange={setView} />
        
        {view === 'home' && <Home />}
        {view === 'scenes' && <SceneList />}
        {view === 'meetings' && <MeetingHall />}
        {view === 'monitor' && <Monitor />}
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)