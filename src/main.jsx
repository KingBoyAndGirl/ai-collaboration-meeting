import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// 主题管理 Hook
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || 'system'
  })

  useEffect(() => {
    const applyTheme = (t) => {
      if (t === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
      } else {
        document.documentElement.setAttribute('data-theme', t)
      }
    }

    applyTheme(theme)
    localStorage.setItem('theme', theme)

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  return [theme, setTheme]
}

// 主题切换组件 - 点击直接切换
function ThemeToggle({ theme, setTheme }) {
  const themes = [
    { value: 'dark', label: '夜间', icon: '🌙' },
    { value: 'light', label: '日间', icon: '☀️' },
    { value: 'system', label: '系统', icon: '💻' },
  ]

  const currentIndex = themes.findIndex(t => t.value === theme)
  const nextTheme = themes[(currentIndex + 1) % themes.length]
  const currentTheme = themes[currentIndex >= 0 ? currentIndex : 0]

  const handleClick = () => {
    setTheme(nextTheme.value)
  }

  return (
    <button
      className="theme-toggle-btn"
      onClick={handleClick}
      title={`当前: ${currentTheme.label} - 点击切换到${nextTheme.label}`}
    >
      {currentTheme.icon}
    </button>
  )
}

// 通知组件
function Notification({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`notification ${type}`}>
      <span style={{ fontSize: '18px' }}>{type === 'success' ? '✓' : 'ℹ'}</span>
      <span style={{ fontWeight: 500 }}>{message}</span>
    </div>
  )
}

// 顶部导航
function TopNav({ currentView, onViewChange, theme, setTheme }) {
  const navItems = [
    { id: 'home', label: '首页', icon: '🏠' },
    { id: 'scenes', label: '场景', icon: '📋' },
    { id: 'agents', label: 'Agent', icon: '🤖' },
    { id: 'meetings', label: '会议', icon: '💬' },
    { id: 'monitor', label: '监控', icon: '📊' },
  ]

  return (
    <nav className="top-nav">
      <div className="nav-container">
        <div className="nav-logo">
          <div className="nav-logo-icon">AI</div>
          <span>AI 协作会议</span>
        </div>
        
        <div className="nav-tabs">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`nav-tab ${currentView === item.id ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        
        <div className="nav-right">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <div className="nav-avatar">👤</div>
        </div>
      </div>
    </nav>
  )
}

// 统计卡片
function StatCard({ icon, label, value, color }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => setCount(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-value">{count}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

// 场景卡片
function SceneCard({ scene, onStart, onEdit, onDelete }) {
  return (
    <div className="scene-card" onClick={() => onEdit(scene)}>
      <div className="scene-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="scene-icon">{scene.icon}</div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }}
          onClick={(e) => { e.stopPropagation(); onDelete(scene.id); }}
          title="删除场景"
        >
          🗑️
        </button>
      </div>
      <h3 className="scene-name">{scene.name}</h3>
      <p className="scene-desc">{scene.description}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span>🤖 {scene.agents?.length || 0} 个 Agent</span>
      </div>
      <button
        className="btn btn-primary btn-full"
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
  const [icon, setIcon] = useState(scene?.icon || '💡')
  const [agents, setAgents] = useState(scene?.agents || [
    { role: '产品经理', model: 'claude-opus-4', prompt: '负责需求分析和功能定义' },
    { role: '架构师', model: 'claude-opus-4', prompt: '负责技术架构设计' },
    { role: '开发者', model: 'claude-sonnet-4', prompt: '负责代码实现' }
  ])
  const [errors, setErrors] = useState({})

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  const validate = () => {
    const newErrors = {}
    if (!name.trim()) newErrors.name = '场景名称为必填项'
    if (agents.length === 0) newErrors.agents = '至少需要配置一个 Agent'
    const emptyRoles = agents.filter(a => !a.role.trim())
    if (emptyRoles.length > 0) newErrors.agentRoles = '所有 Agent 必须填写角色名称'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validate()) {
      onSave({ ...scene, name, description, icon, agents })
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">
          {scene ? '编辑场景' : '新建场景'}
        </h2>

        <div className="form-group">
          <label className="form-label">
            场景名称 <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: null })) }}
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="例：代码开发、产品设计"
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">场景描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="input"
            placeholder="描述这个场景的目的和流程"
          />
        </div>

        <div className="form-group">
          <label className="form-label">场景图标</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['💡', '🎯', '🚀', '📱', '🏠', '⚙️', '🔧', '📊', '🎨', '💼', '🔬', '📚', '💻', '✍️', '📈', '🤖', '🧠', '🔐'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`btn ${icon === emoji ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '44px', height: '44px', fontSize: '20px', padding: 0 }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Agent 配置 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setAgents([...agents, { role: '', model: 'claude-sonnet-4', prompt: '' }])}
            >
              + 添加
            </button>
          </div>
          {errors.agents && <span className="form-error" style={{ display: 'block', marginBottom: '12px' }}>{errors.agents}</span>}
          {errors.agentRoles && <span className="form-error" style={{ display: 'block', marginBottom: '12px' }}>{errors.agentRoles}</span>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {agents.map((agent, i) => (
              <div key={i} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Agent #{i + 1}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)', padding: '2px 8px' }}
                    onClick={() => {
                      const newAgents = agents.filter((_, idx) => idx !== i)
                      setAgents(newAgents)
                      setErrors(prev => ({ ...prev, agents: null, agentRoles: null }))
                    }}
                  >
                    删除
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <input
                      type="text"
                      value={agent.role}
                      onChange={e => {
                        const newAgents = [...agents]
                        newAgents[i].role = e.target.value
                        setAgents(newAgents)
                        setErrors(prev => ({ ...prev, agentRoles: null }))
                      }}
                      className={`input ${!agent.role.trim() ? 'input-warning' : ''}`}
                      placeholder="角色名称 *"
                    />
                  </div>
                  <select
                    value={agent.executor || agent.model}
                    onChange={e => {
                      const newAgents = [...agents]
                      newAgents[i].executor = e.target.value
                      newAgents[i].model = e.target.value
                      setAgents(newAgents)
                    }}
                    className="input"
                    style={{ cursor: 'pointer' }}
                  >
                    <optgroup label="Hermes Agent">
                      <option value="hermes">🤖 Hermes Agent</option>
                    </optgroup>
                    <optgroup label="Claude">
                      <option value="claude_code">💻 Claude Code</option>
                      <option value="claude-opus-4">Claude Opus 4</option>
                      <option value="claude-sonnet-4">Claude Sonnet 4</option>
                    </optgroup>
                    <optgroup label="OpenAI">
                      <option value="openai">🔌 OpenAI</option>
                      <option value="gpt-4o">GPT-4o</option>
                    </optgroup>
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
                  className="input"
                  placeholder="角色提示词"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>取消</button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleSave}
          >
            保存场景
          </button>
        </div>
      </div>
    </div>
  )
}

// Agent 管理页面
function AgentManager({ agents, onAdd, onUpdate, onDelete }) {
  const [editingAgent, setEditingAgent] = useState(null)
  const [showForm, setShowForm] = useState(false)
  
  const defaultAgents = [
    { id: 'hermes', name: 'Hermes Agent', type: 'hermes', description: '本地 Hermes Agent，项目经理角色', status: 'active', config: { path: '/home/prodbox/.local/bin/hermes', model: 'auto-free' } },
    { id: 'claude_code', name: 'Claude Code', type: 'claude_code', description: '通过 AxonHub 调用 Claude', status: 'active', config: { axonhub_url: 'https://axonhub.nasw.heiyu.space/v1', model: 'auto-free' } },
    { id: 'openai', name: 'OpenAI', type: 'openai', description: '通过 AxonHub 调用 GPT 系列', status: 'active', config: { axonhub_url: 'https://axonhub.nasw.heiyu.space/v1', model: 'gpt-4o' } },
  ]
  
  const allAgents = [...defaultAgents, ...(agents || [])]
  
  const handleSave = (agent) => {
    if (editingAgent) {
      onUpdate(agent)
    } else {
      onAdd(agent)
    }
    setShowForm(false)
    setEditingAgent(null)
  }
  
  return (
    <div className="animate-fadeIn">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Agent 管理</h1>
          <p className="page-subtitle">配置和管理你的 AI Agent</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditingAgent(null); setShowForm(true) }}
        >
          + 添加 Agent
        </button>
      </div>
      
      <div className="agents-grid">
        {allAgents.map((agent) => (
          <div key={agent.id} className="agent-card">
            <div className="agent-header">
              <div className={`agent-icon ${
                agent.type === 'hermes' ? 'hermes' : 
                agent.type === 'claude_code' ? 'claude' : 
                agent.type === 'openai' ? 'openai' : 'custom'
              }`}>
                {agent.type === 'hermes' ? '🤖' : agent.type === 'claude_code' ? '💻' : agent.type === 'openai' ? '🔌' : '⚙️'}
              </div>
              {agent.status === 'active' && (
                <div className="agent-status">
                  <div className="agent-status-dot"></div>
                  运行中
                </div>
              )}
            </div>
            
            <h3 className="agent-name">{agent.name}</h3>
            <p className="agent-desc">{agent.description}</p>
            
            <div className="agent-meta">
              <span className="agent-tag">{agent.type}</span>
              <span className="agent-tag">{agent.config?.model || '默认'}</span>
            </div>
            
            <div className="agent-actions">
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => { setEditingAgent(agent); setShowForm(true) }}
              >
                编辑
              </button>
              {(agent.type === 'hermes' || agent.type === 'claude_code' || agent.type === 'openai') ? (
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} disabled>
                  内置
                </button>
              ) : (
                <button
                  className="btn btn-danger btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => onDelete(agent.id)}
                >
                  删除
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {showForm && (
        <AgentForm
          agent={editingAgent}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingAgent(null) }}
        />
      )}
    </div>
  )
}

// Agent 表单
function AgentForm({ agent, onSave, onCancel }) {
  const [name, setName] = useState(agent?.name || '')
  const [type, setType] = useState(agent?.type || 'hermes')
  const [description, setDescription] = useState(agent?.description || '')
  const [config, setConfig] = useState(agent?.config || { model: 'auto-free' })
  const [errors, setErrors] = useState({})
  
  const agentTypes = [
    { value: 'hermes', label: 'Hermes Agent', icon: '🤖', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' },
    { value: 'claude_code', label: 'Claude Code', icon: '💻', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' },
    { value: 'openai', label: 'OpenAI', icon: '🔌', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' },
    { value: 'custom', label: '自定义', icon: '⚙️', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.15)' },
  ]
  
  const validate = () => {
    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Agent 名称为必填项'
    if (!type) newErrors.type = '请选择 Agent 类型'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = () => {
    if (!validate()) return
    onSave({
      id: agent?.id,
      name,
      type,
      description,
      status: 'active',
      config
    })
  }
  
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">
          {agent ? '编辑 Agent' : '添加 Agent'}
        </h2>
        
        <div className="form-group">
          <label className="form-label">
            Agent 名称 <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: null })) }}
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="例：我的 Hermes Agent"
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Agent 类型 <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <div className="type-selector">
            {agentTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => { setType(t.value); setErrors(prev => ({ ...prev, type: null })) }}
                className={`type-option ${type === t.value ? 'selected' : ''}`}
                style={{
                  borderColor: type === t.value ? t.color : undefined,
                  background: type === t.value ? t.bgColor : undefined,
                  boxShadow: type === t.value ? `0 0 0 1px ${t.color}` : undefined
                }}
              >
                <span className="type-option-icon" style={{ 
                  background: t.bgColor,
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '20px'
                }}>{t.icon}</span>
                <span className="type-option-label" style={{ color: type === t.value ? t.color : 'var(--text-primary)' }}>{t.label}</span>
              </button>
            ))}
          </div>
          {errors.type && <span className="form-error">{errors.type}</span>}
        </div>
        
        <div className="form-group">
          <label className="form-label">描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="input"
            placeholder="描述这个 Agent 的用途"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">默认模型</label>
          <input
            type="text"
            value={config.model || ''}
            onChange={e => setConfig({ ...config, model: e.target.value })}
            className="input"
            placeholder="例：auto-free, claude-sonnet-4"
          />
        </div>
        
        {type === 'hermes' && (
          <div className="form-group">
            <label className="form-label">Hermes 路径</label>
            <input
              type="text"
              value={config.path || ''}
              onChange={e => setConfig({ ...config, path: e.target.value })}
              className="input"
              placeholder="/usr/local/bin/hermes"
            />
          </div>
        )}
        
        {(type === 'claude_code' || type === 'openai' || type === 'custom') && (
          <div className="form-group">
            <label className="form-label">API 端点</label>
            <input
              type="text"
              value={config.axonhub_url || config.api_url || ''}
              onChange={e => setConfig({ ...config, axonhub_url: e.target.value })}
              className="input"
              placeholder="https://api.example.com/v1"
            />
          </div>
        )}
        
        <div className="form-actions">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>取消</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>保存</button>
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
        
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
      
      await new Promise(r => setTimeout(r, 1000))
      setStatus('review')
    }

    startMeeting()
  }, [scene])

  return (
    <div className="modal-overlay" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ width: '100%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>{scene?.name || '会议进行中'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {status === 'preparing' ? '准备中...' : status === 'running' ? `${currentAgent?.role || 'Agent'} 发言中` : '会议完成'}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onComplete}>✕ 关闭</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg) => (
            <div key={msg.id} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>{msg.role}</span>
                <span className="agent-tag">{msg.model}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: 'auto' }}>
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>{msg.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {status === 'review' && (
          <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
              <span style={{ fontSize: '20px' }}>✓</span>
              <span style={{ fontWeight: 500 }}>会议讨论完成</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary">导出记录</button>
              <button className="btn btn-primary">审核结果</button>
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
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">系统监控</h1>
        <p className="page-subtitle">实时监控系统运行状态</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">📊</div>
          <div className="stat-value">{metrics.requests}</div>
          <div className="stat-label">今日请求数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💬</div>
          <div className="stat-value">{metrics.tokens.toLocaleString()}</div>
          <div className="stat-label">消耗 Tokens</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">💰</div>
          <div className="stat-value">${metrics.cost.toFixed(2)}</div>
          <div className="stat-label">预计费用</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pink">⚡</div>
          <div className="stat-value">{metrics.cpu.toFixed(0)}%</div>
          <div className="stat-label">CPU 使用率</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>服务状态</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {services.map((service) => (
            <div key={service.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: service.status === 'healthy' ? 'var(--success)' : 'var(--warning)' }}></div>
                <span>{service.name}</span>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>{service.latency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 主应用
const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:18602' 
  : `${window.location.protocol}//${window.location.hostname}`;

function App() {
  const [theme, setTheme] = useTheme()
  const [currentView, setCurrentView] = useState('home')
  const [notification, setNotification] = useState(null)
  const [showSceneEditor, setShowSceneEditor] = useState(false)
  const [showMeeting, setShowMeeting] = useState(false)
  const [currentScene, setCurrentScene] = useState(null)
  const [agents, setAgents] = useState([])
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(true)

  // 从 API 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const [scenesRes, agentsRes] = await Promise.all([
          fetch(`${API_BASE}/api/scenes`),
          fetch(`${API_BASE}/api/agents`)
        ])
        const scenesData = await scenesRes.json()
        const agentsData = await agentsRes.json()
        setScenes(scenesData.items || [])
        setAgents(agentsData.items || [])
      } catch (err) {
        console.error('加载数据失败:', err)
        showNotification('加载数据失败', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

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

  const handleSaveScene = async (sceneData) => {
    try {
      const isUpdate = !!sceneData.id
      const url = isUpdate ? `${API_BASE}/api/scenes/${sceneData.id}` : `${API_BASE}/api/scenes`
      const method = isUpdate ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sceneData.name,
          description: sceneData.description || '',
          icon: sceneData.icon || '💡',
          agents: sceneData.agents || []
        })
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || '保存失败')
      }
      
      const saved = await res.json()
      
      if (isUpdate) {
        setScenes(prev => prev.map(s => s.id === saved.id ? saved : s))
      } else {
        setScenes(prev => [saved, ...prev])
      }
      
      setShowSceneEditor(false)
      showNotification('场景已保存')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleCancelScene = useCallback(() => {
    setShowSceneEditor(false)
  }, [])

  const handleDeleteScene = async (sceneId) => {
    if (!confirm('确定删除这个场景？此操作不可恢复。')) return
    
    try {
      const res = await fetch(`${API_BASE}/api/scenes/${sceneId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      
      setScenes(prev => prev.filter(s => s.id !== sceneId))
      showNotification('场景已删除')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  // Agent CRUD
  const handleAddAgent = async (agentData) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentData.name,
          type: agentData.type,
          description: agentData.description || '',
          config: agentData.config || {}
        })
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || '添加失败')
      }
      
      const saved = await res.json()
      setAgents(prev => [saved, ...prev])
      showNotification('Agent 已添加')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleUpdateAgent = async (agentData) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents/${agentData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentData.name,
          type: agentData.type,
          description: agentData.description || '',
          config: agentData.config || {}
        })
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || '更新失败')
      }
      
      const saved = await res.json()
      setAgents(prev => prev.map(a => a.id === saved.id ? saved : a))
      showNotification('Agent 已更新')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleDeleteAgent = async (agentId) => {
    if (!confirm('确定删除这个 Agent？')) return
    
    try {
      const res = await fetch(`${API_BASE}/api/agents/${agentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      
      setAgents(prev => prev.filter(a => a.id !== agentId))
      showNotification('Agent 已删除')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  return (
    <div>
      <TopNav currentView={currentView} onViewChange={setCurrentView} theme={theme} setTheme={setTheme} />
      
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <main className="main-content">
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-title">加载中...</div>
          </div>
        ) : (<>
        {currentView === 'home' && (
          <div className="animate-fadeIn">
            <div className="page-header">
              <h1 className="page-title">欢迎回来 👋</h1>
              <p className="page-subtitle">准备好开始今天的 AI 协作了吗？</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">📋</div>
                <div className="stat-value">{scenes.length}</div>
                <div className="stat-label">场景总数</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">🎤</div>
                <div className="stat-value">0</div>
                <div className="stat-label">会议次数</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon amber">💬</div>
                <div className="stat-value">0</div>
                <div className="stat-label">消息总数</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon pink">🤖</div>
                <div className="stat-value">0</div>
                <div className="stat-label">Agent 调用</div>
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>最近使用的场景</h3>
            <div className="scenes-grid">
              {scenes.slice(0, 3).map(scene => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onStart={handleStartMeeting}
                  onEdit={handleEditScene}
                  onDelete={handleDeleteScene}
                />
              ))}
            </div>
          </div>
        )}

        {/* 场景列表 */}
        {currentView === 'scenes' && (
          <div className="animate-fadeIn">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="page-title">场景管理</h1>
                <p className="page-subtitle">创建和管理协作场景</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => { setCurrentScene(null); setShowSceneEditor(true) }}
              >
                + 新建场景
              </button>
            </div>

            <div className="scenes-grid">
              {scenes.map(scene => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onStart={handleStartMeeting}
                  onEdit={handleEditScene}
                  onDelete={handleDeleteScene}
                />
              ))}
            </div>
          </div>
        )}

        {/* Agent 管理 */}
        {currentView === 'agents' && (
          <AgentManager
            agents={agents}
            onAdd={handleAddAgent}
            onUpdate={handleUpdateAgent}
            onDelete={handleDeleteAgent}
          />
        )}

        {/* 会议列表 */}
        {currentView === 'meetings' && (
          <div className="animate-fadeIn">
            <div className="page-header">
              <h1 className="page-title">会议记录</h1>
              <p className="page-subtitle">查看历史会议记录</p>
            </div>
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <div className="empty-title">暂无会议记录</div>
              <p className="empty-desc">开始第一次会议吧</p>
              <button className="btn btn-primary" onClick={() => setCurrentView('scenes')}>浏览场景</button>
            </div>
          </div>
        )}

        {/* 监控面板 */}
        {currentView === 'monitor' && <MonitorPanel />}
        </>)}
      </main>

      {/* 场景编辑器弹窗 */}
      {showSceneEditor && (
        <SceneEditor
          scene={currentScene}
          onSave={handleSaveScene}
          onCancel={handleCancelScene}
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
