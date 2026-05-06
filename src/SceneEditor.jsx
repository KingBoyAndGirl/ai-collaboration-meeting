import React, { useState } from 'react'

export default function SceneEditor() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [roles, setRoles] = useState([''])
  const [stages, setStages] = useState(['需求分析', '设计方案'])

  const addRole = () => setRoles([...roles, ''])
  const updateRole = (i, v) => setRoles(roles.map((r, idx) => idx === i ? v : r))
  const removeRole = (i) => setRoles(roles.filter((_, idx) => idx !== i))

  const generateYAML = () => {
    return `name: "${name}"
description: "${description}"
roles:
${roles.map(r => `  - name: "${r}"`).join('\n')}
stages:
${stages.map(s => `  - ${s}`).join('\n')}`
  }

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h2>📝 场景编辑器</h2>
      
      <div style={{ marginBottom: 12 }}>
        <label>场景名称</label>
        <input 
          value={name} 
          onChange={e => setName(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>描述</label>
        <textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)}
          rows={2}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>角色</label>
        {roles.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <input 
              value={r} 
              onChange={e => updateRole(i, e.target.value)}
              placeholder={`角色 ${i + 1}`}
            />
            <button onClick={() => removeRole(i)}>✕</button>
          </div>
        ))}
        <button onClick={addRole}>+ 添加角色</button>
      </div>

      <details style={{ marginBottom: 12 }}>
        <summary>生成的 YAML</summary>
        <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
          {generateYAML()}
        </pre>
      </details>
    </div>
  )
}