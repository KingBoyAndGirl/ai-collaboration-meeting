import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// 通知组件
function Notification({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed top-6 right-6 z-50 animate-slideUp">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl ${
        type === 'success' 
          ? 'bg-emerald-500/20 border border-emerald-500/30' 
          : 'bg-blue-500/20 border border-blue-500/30'
      }`}>
        <span className="text-xl">{type === 'success' ? '✓' : 'ℹ'}</span>
        <span className="font-medium text-white">{message}</span>
      </div>
    </div>
  )
}

// 导航组件
function Navigation({ currentView, onViewChange }) {
  const navItems = [
    { id: 'home', label: '首页', icon: '🏠' },
    { id: 'scenes', label: '场景', icon: '📋' },
    { id: 'meetings', label: '会议', icon: '🎤' },
    { id: 'monitor', label: '监控', icon: '📊' },
  ]

  return (
    <div className="flex gap-2 p-1.5 dark-glass rounded-2xl mb-6">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`nav-tab flex-1 justify-center ${currentView === item.id ? 'active' : ''}`}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
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
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div className={`stat-icon ${color}`}>{icon}</div>
        <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
          <span>↑</span>
          <span>{trend}%</span>
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{count}</div>
      <div className="text-sm text-white/50">{label}</div>
    </div>
  )
}

// 场景卡片
function SceneCard({ scene, onStart, onEdit }) {
  return (
    <div className="scene-card" onClick={() => onEdit(scene)}>
      <span className="scene-emoji">{scene.icon}</span>
      <h3 className="text-lg font-semibold text-white mb-2">{scene.name}</h3>
      <p className="text-sm text-white/50 mb-5 line-clamp-2">{scene.description}</p>
      <button
        className="gradient-btn w-full text-sm"
        onClick={(e) => { e.stopPropagation(); onStart(scene); }}
      >
        开始会议 →
      </button>
    </div>
  )
}

// 场景编辑器
function SceneEditor({ scene, onSave, onCancel }) {
  const [name, setName] = useState(scene?.name || '')
  const [description, setDescription] = useState(scene?.description || '')
  const [agents, setAgents] = useState(scene?.agents || [
    { role: '产品经理', model: 'claude-opus-4', prompt: '负责需求分析和功能定义' },
    { role: '架构师', model: 'claude-opus-4', prompt: '负责技术架构设计' },
    { role: '开发者', model: 'claude-sonnet-4', prompt: '负责代码实现' }
  ])

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">
          {scene ? '编辑场景' : '新建场景'}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">场景名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="dark-input"
              placeholder="例：代码开发、产品设计、技术评审"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">场景描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="dark-input min-h-[100px] resize-none"
              placeholder="描述这个场景的目的和流程"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-medium text-white/70">Agent 配置</label>
              <button
                className="glass-btn text-sm"
                onClick={() => setAgents([...agents, { role: '', model: 'claude-sonnet-4', prompt: '' }])}
              >
                + 添加 Agent
              </button>
            </div>

            <div className="space-y-4">
              {agents.map((agent, i) => (
                <div key={i} className="dark-card p-4">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <input
                      type="text"
                      value={agent.role}
                      onChange={e => {
                        const newAgents = [...agents]
                        newAgents[i].role = e.target.value
                        setAgents(newAgents)
                      }}
                      className="dark-input"
                      placeholder="角色名称"
                    />
                    <select
                      value={agent.model}
                      onChange={e => {
                        const newAgents = [...agents]
                        newAgents[i].model = e.target.value
                        setAgents(newAgents)
                      }}
                      className="dark-input"
                    >
                      <option value="claude-opus-4">Claude Opus</option>
                      <option value="claude-sonnet-4">Claude Sonnet</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={agent.prompt}
                    onChange={e => {
                      const newAgents = [...agents]
                      newAgents[i].prompt = e.target.value
                      setAgents(newAgents)
                    }}
                    className="dark-input"
                    placeholder="角色提示词"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button className="glass-btn" onClick={onCancel}>取消</button>
          <button
            className="gradient-btn"
            onClick={() => onSave({ ...scene, name, description, agents })}
          >
            保存场景
          </button>
        </div>
      </div>
    </div>
  )
}

// 会议大厅
function MeetingHall({ scene, onComplete }) {
  const [status, setStatus] = useState('preparing')
  const [messages, setMessages] = useState([])
  const [currentAgent, setCurrentAgent] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const startMeeting = async () => {
      setStatus('preparing')
      await new Promise(r => setTimeout(r, 1500))
      setStatus('running')

      const agents = scene?.agents || [
        { role: '产品经理', model: 'claude-opus-4' },
        { role: '架构师', model: 'claude-opus-4' },
        { role: '开发者', model: 'claude-sonnet-4' }
      ]

      for (const agent of agents) {
        setCurrentAgent(agent)
        await new Promise(r => setTimeout(r, 2000))

        setMessages(prev => [...prev, {
          id: Date.now(),
          role: agent.role,
          model: agent.model,
          content: `我是${agent.role}，使用 ${agent.model}。我正在分析需求并准备提出建议...`,
          timestamp: new Date()
        }])
      }

      setStatus('review')
      setCurrentAgent(null)
    }

    startMeeting()
  }, [scene])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const avatarColors = {
    '产品经理': 'bg-purple-500/30 text-purple-300',
    '架构师': 'bg-cyan-500/30 text-cyan-300',
    '开发者': 'bg-emerald-500/30 text-emerald-300'
  }

  return (
    <div className="modal-overlay" onClick={onComplete}>
      <div className="modal-content max-w-4xl" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">会议进行中</h2>
            <p className="text-sm text-white/50 mt-1">
              {scene?.name || '代码开发'} · {status === 'running' ? '讨论中' : status === 'preparing' ? '准备中' : '待审核'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {status === 'running' && currentAgent && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <div className="status-dot active"></div>
                <span>{currentAgent.role} 发言中...</span>
              </div>
            )}
            <button className="glass-btn text-sm" onClick={onComplete}>结束会议</button>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-6">
          {messages.length === 0 && status === 'preparing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white/50">正在准备会议环境...</p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className="flex gap-4 animate-fadeIn">
              <div className={`message-avatar ${avatarColors[msg.role] || 'bg-white/10 text-white/70'}`}>
                {msg.role[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-medium text-white">{msg.role}</span>
                  <span className="badge badge-purple text-xs">{msg.model}</span>
                  <span className="text-xs text-white/30">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-bubble">
                  <p className="text-white/80">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 底部 */}
        {status === 'review' && (
          <div className="pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="text-xl">✓</span>
              <span className="font-medium">会议讨论完成</span>
            </div>
            <div className="flex gap-3">
              <button className="glass-btn">导出记录</button>
              <button className="gradient-btn">审核结果</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 监控面板
function MonitorPanel() {
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 62,
    requests: 128,
    tokens: 45000,
    cost: 12.5
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(20, Math.min(80, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(40, Math.min(90, prev.memory + (Math.random() - 0.5) * 5)),
        requests: prev.requests + Math.floor(Math.random() * 5)
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const services = [
    { name: 'API 服务', status: 'healthy', latency: '45ms' },
    { name: 'Claude 接口', status: 'healthy', latency: '1.2s' },
    { name: '数据库', status: 'healthy', latency: '12ms' },
    { name: '消息队列', status: 'warning', latency: '250ms' }
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold text-white">系统监控</h2>

      {/* 概览卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card text-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {metrics.requests}
          </div>
          <div className="text-sm text-white/50 mt-2">今日请求数</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            {metrics.tokens.toLocaleString()}
          </div>
          <div className="text-sm text-white/50 mt-2">消耗 Tokens</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            ${metrics.cost.toFixed(2)}
          </div>
          <div className="text-sm text-white/50 mt-2">预计费用</div>
        </div>
      </div>

      {/* 资源使用 */}
      <div className="dark-glass p-6">
        <h3 className="font-semibold text-white mb-5">资源使用</h3>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">CPU 使用率</span>
              <span className="text-white font-medium">{metrics.cpu.toFixed(1)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${metrics.cpu}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">内存使用率</span>
              <span className="text-white font-medium">{metrics.memory.toFixed(1)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${metrics.memory}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 服务状态 */}
      <div className="dark-glass p-6">
        <h3 className="font-semibold text-white mb-5">服务状态</h3>
        <div className="space-y-4">
          {services.map((svc, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`status-dot ${svc.status === 'healthy' ? 'active' : 'warning'}`} />
                <span className="text-white/80">{svc.name}</span>
              </div>
              <span className="text-sm text-white/40">{svc.latency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 主应用
function App() {
  const [currentView, setCurrentView] = useState('home')
  const [notification, setNotification] = useState(null)
  const [showSceneEditor, setShowSceneEditor] = useState(false)
  const [showMeeting, setShowMeeting] = useState(false)
  const [currentScene, setCurrentScene] = useState(null)
  const [scenes, setScenes] = useState([
    { id: 1, name: '代码开发', icon: '💻', description: '需求分析 → 架构设计 → 代码实现 → 测试验证', agents: [
      { role: '产品经理', model: 'claude-opus-4', prompt: '负责需求分析和功能定义' },
      { role: '架构师', model: 'claude-opus-4', prompt: '负责技术架构设计' },
      { role: '开发者', model: 'claude-sonnet-4', prompt: '负责代码实现' }
    ]},
    { id: 2, name: '内容创作', icon: '✍️', description: '选题策划 → 大纲生成 → 内容撰写 → 审核发布', agents: [
      { role: '策划编辑', model: 'claude-opus-4', prompt: '负责选题和大纲' },
      { role: '内容作者', model: 'claude-sonnet-4', prompt: '负责内容撰写' }
    ]},
    { id: 3, name: '商业分析', icon: '📊', description: '数据收集 → 市场分析 → 竞品研究 → 报告生成', agents: [
      { role: '数据分析师', model: 'claude-opus-4', prompt: '负责数据收集和分析' },
      { role: '行业专家', model: 'gpt-4o', prompt: '负责行业洞察' }
    ]}
  ])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
  }

  const handleStartMeeting = (scene) => {
    setCurrentScene(scene)
    setShowMeeting(true)
  }

  const handleEditScene = (scene) => {
    setCurrentScene(scene)
    setShowSceneEditor(true)
  }

  const handleSaveScene = (sceneData) => {
    if (sceneData.id) {
      setScenes(prev => prev.map(s => s.id === sceneData.id ? sceneData : s))
    } else {
      setScenes(prev => [...prev, { ...sceneData, id: Date.now() }])
    }
    setShowSceneEditor(false)
    showNotification('场景已保存')
  }

  return (
    <div className="min-h-screen">
      {/* 通知 */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="dark-container">
        {/* 头部 */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI 协作会议平台</h1>
              <p className="text-sm text-white/40">人类当导演，AI当演员</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="glass-btn text-sm">帮助</button>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform">
              👤
            </div>
          </div>
        </header>

        {/* 导航 */}
        <Navigation currentView={currentView} onViewChange={setCurrentView} />

        {/* 首页 */}
        {currentView === 'home' && (
          <div className="animate-fadeIn">
            {/* 欢迎区 */}
            <div className="dark-glass p-8 mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">欢迎回来 👋</h2>
              <p className="text-white/50 mb-6">准备好开始今天的 AI 协作了吗？</p>
              <div className="flex gap-4">
                <button
                  className="gradient-btn"
                  onClick={() => {
                    setCurrentScene(null)
                    setShowSceneEditor(true)
                  }}
                >
                  ✨ 开始新会议
                </button>
                <button className="glass-btn">
                  📖 查看文档
                </button>
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="mb-6 stat-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px'}}>
              <StatCard icon="📋" label="场景总数" value={scenes.length} trend={8} color="purple" />
              <StatCard icon="🎤" label="会议次数" value={47} trend={12} color="pink" />
              <StatCard icon="💬" label="消息总数" value={384} trend={23} color="cyan" />
              <StatCard icon="🤖" label="Agent 调用" value={156} trend={15} color="amber" />
            </div>

            {/* 最近场景 */}
            <div className="dark-glass p-6">
              <h3 className="text-lg font-semibold text-white mb-5">最近使用的场景</h3>
              <div className="scene-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'}}>
                {scenes.map(scene => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    onStart={handleStartMeeting}
                    onEdit={handleEditScene}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 场景列表 */}
        {currentView === 'scenes' && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">场景管理</h2>
              <button
                className="gradient-btn"
                onClick={() => {
                  setCurrentScene(null)
                  setShowSceneEditor(true)
                }}
              >
                + 新建场景
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 scene-grid">
              {scenes.map(scene => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onStart={handleStartMeeting}
                  onEdit={handleEditScene}
                />
              ))}
            </div>
          </div>
        )}

        {/* 会议列表 */}
        {currentView === 'meetings' && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-6">会议记录</h2>
            <div className="dark-glass p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-white/50">暂无会议记录，开始第一次会议吧</p>
            </div>
          </div>
        )}

        {/* 监控面板 */}
        {currentView === 'monitor' && <MonitorPanel />}
      </div>

      {/* 场景编辑器弹窗 */}
      {showSceneEditor && (
        <SceneEditor
          scene={currentScene}
          onSave={handleSaveScene}
          onCancel={() => setShowSceneEditor(false)}
        />
      )}

      {/* 会议大厅弹窗 */}
      {showMeeting && (
        <MeetingHall
          scene={currentScene}
          onComplete={() => {
            setShowMeeting(false)
            showNotification('会议已完成')
          }}
        />
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)