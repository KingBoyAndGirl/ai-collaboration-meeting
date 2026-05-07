import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// 动画延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 通知组件
function Notification({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 animate-fadeIn">
      <div className={`glass-card p-4 flex items-center gap-3 ${
        type === 'success' ? 'border-emerald-300' : 'border-blue-300'
      }`}>
        <span className="text-2xl">{type === 'success' ? '✓' : 'ℹ'}</span>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  )
}

// 加载动画
function LoadingDots() {
  return (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// 导航组件
function Navigation({ currentView, onViewChange, loading }) {
  const navItems = [
    { id: 'home', label: '首页', icon: '🏠', emoji: '✨' },
    { id: 'scenes', label: '场景', icon: '📋', emoji: '🎯' },
    { id: 'meetings', label: '会议', icon: '🎤', emoji: '🚀' },
    { id: 'monitor', label: '监控', icon: '📊', emoji: '📈' },
  ]

  return (
    <div className="glass mb-6 p-2 flex gap-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          disabled={loading}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            currentView === item.id
              ? 'bg-white text-[var(--primary)] shadow-lg transform scale-105'
              : 'text-white/90 hover:bg-white/20'
          }`}
        >
          {loading ? (
            <LoadingDots />
          ) : (
            <>
              <span className="text-xl">{currentView === item.id ? item.emoji : item.icon}</span>
              <span>{item.label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  )
}

// 统计卡片
function StatCard({ icon, label, value, trend, color }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setCount(value), 300)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold">{count.toLocaleString()}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
      {trend && (
        <span className={`text-xs px-2 py-1 rounded-full ${
          trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
        }`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  )
}

// 首页
function Home({ onAction }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 欢迎区域 */}
      <div className="glass p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">欢迎回来 👋</h1>
        <p className="text-white/90 mb-6 max-w-md">
          让人类当导演，AI当演员，通过会议协作完成任何任务
        </p>
        <div className="flex gap-3">
          <button 
            className="btn-glass"
            onClick={() => onAction('new-meeting')}
          >
            开始新会议
          </button>
          <button 
            className="bg-white/20 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-white/30 transition"
            onClick={() => onAction('docs')}
          >
            查看文档
          </button>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="📋" label="场景总数" value={12} trend={8} />
        <StatCard icon="🎤" label="会议次数" value={48} trend={12} />
        <StatCard icon="💬" label="消息总数" value={1234} trend={23} />
        <StatCard icon="🤖" label="Agent 调用" value={3456} trend={15} />
      </div>

      {/* 最近场景 */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">最近使用的场景</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 1, name: '代码开发', emoji: '💻', desc: '多角色协作完成代码开发' },
            { id: 2, name: '内容创作', emoji: '✍️', desc: '创作优质内容' },
            { id: 3, name: '商业分析', emoji: '📊', desc: '市场分析和决策' },
          ].map(scene => (
            <div 
              key={scene.id} 
              className="glass-card p-5 cursor-pointer"
              onClick={() => onAction('start-scene', scene.id)}
            >
              <div className="text-3xl mb-3">{scene.emoji}</div>
              <h3 className="font-semibold mb-1">{scene.name}</h3>
              <p className="text-sm text-gray-500">{scene.desc}</p>
              <button className="mt-4 text-sm text-[var(--primary)] font-medium">
                开始会议 →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 场景列表
function SceneList({ onAction }) {
  const scenes = [
    { id: 1, name: '代码开发', emoji: '💻', desc: '多角色协作完成代码开发', updated: '2小时前' },
    { id: 2, name: '内容创作', emoji: '✍️', desc: '创作优质内容', updated: '1天前' },
    { id: 3, name: '商业分析', emoji: '📊', desc: '市场分析和决策', updated: '3天前' },
    { id: 4, name: '产品设计', emoji: '🎨', desc: '产品需求分析和设计', updated: '1周前' },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">场景管理</h2>
          <p className="text-white/70 text-sm mt-1">创建和管理 AI 协作场景</p>
        </div>
        <button 
          className="btn-gradient"
          onClick={() => onAction('create-scene')}
        >
          + 新建场景
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map(scene => (
          <div 
            key={scene.id} 
            className="glass-card p-5 cursor-pointer"
            onClick={() => onAction('select-scene', scene.id)}
          >
            <div className="text-3xl mb-3">{scene.emoji}</div>
            <h3 className="font-semibold mb-1">{scene.name}</h3>
            <p className="text-sm text-gray-500 mb-3">{scene.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{scene.updated}</span>
              <button className="text-sm text-[var(--primary)] font-medium">
                开始会议 →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 会议大厅
function MeetingHall({ onAction }) {
  const meetings = [
    { id: 1, name: '用户管理系统开发', status: 'running', agents: 3, progress: 65 },
    { id: 2, name: 'API 文档撰写', status: 'completed', agents: 2, progress: 100 },
    { id: 3, name: '市场调研分析', status: 'paused', agents: 4, progress: 30 },
  ]

  const statusConfig = {
    running: { label: '进行中', color: 'bg-blue-100 text-blue-600', icon: '▶' },
    completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-600', icon: '✓' },
    paused: { label: '已暂停', color: 'bg-amber-100 text-amber-600', icon: '⏸' },
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">会议大厅</h2>
          <p className="text-white/70 text-sm mt-1">启动和管理 AI 会议</p>
        </div>
        <button 
          className="btn-gradient"
          onClick={() => onAction('new-meeting')}
        >
          开始新会议
        </button>
      </div>

      <div className="space-y-3">
        {meetings.map(meeting => {
          const status = statusConfig[meeting.status]
          return (
            <div 
              key={meeting.id} 
              className="glass-card p-5 cursor-pointer"
              onClick={() => onAction('view-meeting', meeting.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{meeting.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {meeting.agents} 个 Agent
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{meeting.progress}%</div>
                  <div className="w-24 bg-white/50 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] rounded-full h-2 transition-all"
                      style={{ width: `${meeting.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 监控页面
function Monitor({ onAction }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white">实时监控</h2>
        <p className="text-white/70 text-sm mt-1">监控会议状态和 Agent 活动</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">📊 系统状态</h3>
          <div className="space-y-4">
            {[
              { label: 'Agent 在线', value: '4/4', status: 'success' },
              { label: '进行中会议', value: '2', status: 'info' },
              { label: '今日消息', value: '128', status: 'info' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className={`text-sm font-medium ${
                  item.status === 'success' ? 'text-emerald-600' : 'text-blue-600'
                }`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
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
                  <div className="text-xs text-gray-400">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 创建会议模态框
function CreateMeetingModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({})

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="glass p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">创建新会议</h3>
        
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">会议名称</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 rounded-xl bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="输入会议名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">选择场景</label>
              <div className="grid grid-cols-2 gap-2">
                {['代码开发', '内容创作', '商业分析', '产品设计'].map(scene => (
                  <button key={scene} className="py-2 px-3 rounded-xl bg-white/30 hover:bg-white/50 transition">
                    {scene}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="btn-glass">取消</button>
              <button onClick={() => setStep(2)} className="btn-gradient">下一步</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-gray-600">确认创建会议？</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setStep(1)} className="btn-glass">返回</button>
              <button onClick={onSubmit} className="btn-gradient">创建</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 主应用
function App() {
  const [view, setView] = useState('home')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const handleAction = async (action, data) => {
    setLoading(true)
    await delay(500)
    setLoading(false)

    switch (action) {
      case 'new-meeting':
        setShowModal(true)
        break
      case 'create-scene':
        setNotification({ message: '场景创建成功！', type: 'success' })
        break
      case 'start-scene':
        setNotification({ message: '会议启动成功！', type: 'success' })
        break
      default:
        break
    }
  }

  return (
    <div className="min-h-screen">
      <header className="glass">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-2xl shadow-lg">
              🤖
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI 协作会议平台</h1>
              <p className="text-sm text-white/70">人类当导演，AI当演员</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="btn-glass text-sm">
              帮助
            </button>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
              U
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Navigation currentView={view} onViewChange={setView} loading={loading} />
        
        {view === 'home' && <Home onAction={handleAction} />}
        {view === 'scenes' && <SceneList onAction={handleAction} />}
        {view === 'meetings' && <MeetingHall onAction={handleAction} />}
        {view === 'monitor' && <Monitor onAction={handleAction} />}
      </main>

      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {showModal && (
        <CreateMeetingModal 
          onClose={() => setShowModal(false)}
          onSubmit={() => {
            setShowModal(false)
            setNotification({ message: '会议创建成功！', type: 'success' })
          }}
        />
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)