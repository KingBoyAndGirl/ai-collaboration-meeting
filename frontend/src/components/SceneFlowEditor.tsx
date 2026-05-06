/** ReactFlow 场景编辑器 */
import React, { useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import 'reactflow/dist/theme-default.css'
import { Card, Button, Space, message } from 'antd'
import { SaveOutlined, PlayOutlined, ReloadOutlined } from '@ant-design/icons'
import axios from 'axios'

// 节点组件
const StartNode = ({ data }: { data: any }) => (
  <div style={{ padding: 10, background: '#52c41a', color: 'white', borderRadius: 5 }}>
    开始
  </div>
)

const StageNode = ({ data }: { data: any }) => (
  <div style={{ padding: 10, background: '#1890ff', color: 'white', borderRadius: 5, minWidth: 120 }}>
    <div>{data.label}</div>
    <div style={{ fontSize: 12, opacity: 0.8 }}>{data.roles?.length || 0} roles</div>
  </div>
)

const EndNode = ({ data }: { data: any }) => (
  <div style={{ padding: 10, background: '#ff4d4f', color: 'white', borderRadius: 5 }}>
    结束
  </div>
)

const nodeTypes: NodeTypes = {
  start: StartNode,
  stage: StageNode,
  end: EndNode,
}

interface SceneFlowEditorProps {
  sceneId?: string
  onSave?: (scene: any) => void
}

const SceneFlowEditor: React.FC<SceneFlowEditorProps> = ({ sceneId, onSave }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    // 初始化流程图
    const initialNodes: Node[] = [
      {
        id: 'start',
        type: 'start',
        position: { x: 250, y: 50 },
        data: { label: '开始' },
      },
      {
        id: 'stage-1',
        type: 'stage',
        position: { x: 250, y: 150 },
        data: { label: '需求分析', roles: ['product', 'tech'] },
      },
      {
        id: 'stage-2',
        type: 'stage',
        position: { x: 250, y: 250 },
        data: { label: '设计方案', roles: ['architect', 'dev'] },
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 250, y: 350 },
        data: { label: '结束' },
      },
    ]

    const initialEdges: Edge[] = [
      { id: 'e1', source: 'start', target: 'stage-1' },
      { id: 'e2', source: 'stage-1', target: 'stage-2' },
      { id: 'e3', source: 'stage-2', target: 'end' },
    ]

    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [setNodes, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  const handleSave = async () => {
    try {
      // 将节点和边转换为场景格式
      const scene = {
        name: 'visual-scene',
        description: '通过 ReactFlow 创建的场景',
        version: '1.0',
        roles: [],
        stages: nodes
          .filter((n) => n.type === 'stage')
          .map((n, i) => ({
            id: n.id,
            type: 'requirement',
            roles: n.data.roles || [],
            moderator: n.data.roles?.[0] || 'user',
          })),
      }

      const resp = await axios.post('/api/scenes', scene)
      message.success('场景保存成功')
      onSave?.(resp.data)
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleRun = async () => {
    try {
      const resp = await axios.post('/api/meetings', { scene_name: 'visual-scene' })
      message.success(`会议创建: ${resp.data.id}`)
    } catch (error) {
      message.error('创建失败')
    }
  }

  return (
    <Card style={{ height: 600 }}>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            保存场景
          </Button>
          <Button icon={<PlayOutlined />} onClick={handleRun}>
            运行会议
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
            重置
          </Button>
        </Space>
      </div>

      <div style={{ height: 500, border: '1px solid #d9d9d9', borderRadius: 8 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </Card>
  )
}

export default SceneFlowEditor