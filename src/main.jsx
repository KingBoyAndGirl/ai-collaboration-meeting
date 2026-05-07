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
    <div className="notification">
      <div className={`glass-card p-4 flex items-center gap-3 ${type === 'success' ? 'border-emerald-300' : 'border-blue-300'}`}>
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
function Navigation({ currentView, onViewChange }) {
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
          className={`nav-btn flex-1 ${currentView === item.id ? 'active' : ''}`}
        >
          <span className="mr-2">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  )
}

// 统计卡片
function StatCard({ icon, label, value, trend }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setCount(value), 300)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="stat-icon text-xl">{icon}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold text-gray-800">{count}</div>
        <div className="text-emerald-600 text-sm font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
          <span>↑</span> {trend}%
        </div>
      </div>
    </div>
  )
}

// 场景卡片
function SceneCard({ scene, onStart, onEdit }) {
  return (
    <div className="glass-card p-6 scene-card" onClick={() => onEdit(scene)}>
      <span className="scene-emoji">{scene.icon}</span>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{scene.name}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{scene.description}</p>
      <button
        className="btn-primary text-sm w-full"
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
    <div className="fixed inset-0 modal-overlay" onClick={onCancel}>
      <div className="glass w-full max-w-3xl mx-4 p-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {scene ? '编辑场景' : '新建场景'}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">场景名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="例：代码开发、产品设计、技术评审"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">场景描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              placeholder="描述这个场景的目的和流程"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-medium text-gray-700">Agent 配置</label>
              <button
                className="btn-glass text-sm"
                onClick={() => setAgents([...agents, { role: '', model: 'claude-sonnet-4', prompt: '' }])}
              >
                + 添加 Agent
              </button>
            </div>

            <div className="space-y-4">
              {agents.map((agent, i) => (
                <div key={i} className="glass-card p-4">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <input
                      type="text"
                      value={agent.role}
                      onChange={e => {
                        const newAgents = [...agents]
                        newAgents[i].role = e.target.value
                        setAgents(newAgents)
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      placeholder="角色名称"
                    />
                    <select
                      value={agent.model}
                      onChange={e => {
                        const newAgents = [...agents]
                        newAgents[i].model = e.target.value
                        setAgents(newAgents)
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    placeholder="角色提示词"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button className="btn-glass" onClick={onCancel}>取消</button>
          <button
            className="btn-primary"
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
    // 模拟会议流程
    const startMeeting = async () => {
      setStatus('preparing')
      await new Promise(r => setTimeout(r, 1000))

      setStatus('running')

      // 模拟 Agent 发言
      const agents = scene?.agents || [
        { role: '产品经理', model: 'claude-opus-4' },
        { role: '架构师', model: 'claude-opus-4' },
        { role: '开发者', model: 'claude-sonnet-4' }
      ]

      for (const agent of agents) {
        setCurrentAgent(agent)
        await new Promise(r => setTimeout(r, 1500))

        setMessages(prev => [...prev, {
          id: Date.now(),
          role: agent.role,
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

  return (
    <div className="fixed inset-0 modal-overlay" onClick={onComplete}>
      <div className="glass w-full max-w-4xl mx-4 h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">会议进行中</h2>
              <p className="text-sm text-gray-500">{scene?.name || '代码开发'} - {status === 'running' ? '讨论中' : status === 'preparing' ? '准备中' : '待审核'}</p>
            </div>
            <div className="flex items-center gap-3">
              {status === 'running' && (
                <div className="flex items-center gap-2 text-indigo-600">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">{currentAgent?.role} 发言中...</span>
                </div>
              )}
              <button className="btn-glass text-sm" onClick={onComplete}>结束会议</button>
            </div>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && status === 'preparing' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <LoadingDots />
                <p className="mt-4 text-gray-500">正在准备会议环境...</p>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                {msg.role[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800">{msg.role}</span>
                  <span className="text-xs text-gray-400">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="glass-card p-4">
                  <p className="text-gray-700">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 底部 */}
        {status === 'review' && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600">
                <span className="text-xl">✓</span>
                <span className="font-medium">会议讨论完成</span>
              </div>
              <div className="flex gap-3">
                <button className="btn-glass">导出记录</button>
                <button className="btn-primary">审核结果</button>
              </div>
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
    errors: 2,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">系统监控</h2>
        <span className="text-sm text-white/70">每 3 秒自动刷新</span>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-6 text-center">
          <div className="text-4xl font-bold text-indigo-600">{metrics.requests}</div>
          <div className="text-sm text-gray-500 mt-1">今日请求数</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-4xl font-bold text-emerald-600">{metrics.tokens.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">消耗 Tokens</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-4xl font-bold text-amber-600">${metrics.cost.toFixed(2)}</div>
          <div className="text-sm text-gray-500 mt-1">预计费用</div>
        </div>
      </div>

      {/* 资源使用 */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-gray-800 mb-4">资源使用</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">CPU 使用率</span>
              <span className="font-medium">{metrics.cpu.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${metrics.cpu}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">内存使用率</span>
              <span className="font-medium">{metrics.memory.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${metrics.memory}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 服务状态 */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-gray-800 mb-4">服务状态</h3>
        <div className="space-y-3">
          {[
            { name: 'API 服务', status: 'healthy', latency: '45ms' },
            { name: 'Claude 接口', status: 'healthy', latency: '1.2s' },
            { name: '数据库', status: 'healthy', latency: '12ms' },
            { name: '消息队列', status: 'warning', latency: '250ms' }
          ].map((svc, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  svc.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                <span className="text-gray-700">{svc.name}</span>
              </div>
              <span className="text-sm text-gray-500">{svc.latency}</span>
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

      {/* 头部 */}
      <header className="glass mb-8 mx-4 mt-4">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">AI 协作会议平台</h1>
              <p className="text-sm text-gray-500">人类当导演，AI当演员</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="btn-glass text-sm">
              帮助
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              👤
            </div>
          </div>
        </div>
      </header>

      {/* 导航 */}
      <div className="container mx-auto px-4">
        <Navigation
          currentView={currentView}
          onViewChange={setCurrentView}
        />

        {/* 首页 */}
        {currentView === 'home' && (
          <div className="animate-fadeInUp">
            {/* 欢迎区 */}
            <div className="glass p-8 mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">欢迎回来 👋</h2>
              <p className="text-gray-600 mb-6">准备好开始今天的 AI 协作了吗？</p>
              <div className="flex gap-4">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setCurrentScene(null)
                    setShowSceneEditor(true)
                  }}
                >
                  ✨ 开始新会议
                </button>
                <button className="btn-glass">
                  📖 查看文档
                </button>
              </div>
            </div>

            {/* 统计卡片 - 4列横向网格 */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard icon="📋" label="场景总数" value={scenes.length} trend={8} />
              <StatCard icon="🎤" label="会议次数" value={47} trend={12} />
              <StatCard icon="💬" label="消息总数" value={384} trend={23} />
              <StatCard icon="🤖" label="Agent 调用" value={156} trend={15} />
            </div>

            {/* 最近场景 */}
            <div className="glass p-6">
              <h3 className="section-title text-lg">最近使用的场景</h3>
              <div className="grid grid-cols-3 gap-4">
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
          <div className="animate-fadeInUp">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">场景管理</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setCurrentScene(null)
                  setShowSceneEditor(true)
                }}
              >
                + 新建场景
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
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
          <div className="animate-fadeInUp">
            <h2 className="text-2xl font-bold text-white mb-6">会议记录</h2>
            <div className="glass p-6">
              <p className="text-gray-500 text-center py-8">
                暂无会议记录，开始第一次会议吧 👆
              </p>
            </div>
          </div>
        )}

        {/* 监控面板 */}
        {currentView === 'monitor' && (
          <div className="animate-fadeInUp">
            <MonitorPanel />
          </div>
        )}
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