/** 阶段进度组件 */
import React from 'react'
import { Steps, Tag } from 'antd'
import {
  FileTextOutlined,
  BulbOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CodeOutlined
} from '@ant-design/icons'

interface Stage {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

interface StageProgressProps {
  stages: Stage[]
  currentStageIndex: number
}

const StageProgress: React.FC<StageProgressProps> = ({ stages, currentStageIndex }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'requirement': return <FileTextOutlined />
      case 'design': return <BulbOutlined />
      case 'review': return <SearchOutlined />
      case 'decision': return <CheckCircleOutlined />
      case 'output': return <CodeOutlined />
      default: return <FileTextOutlined />
    }
  }

  const getStatus = (index: number, stage: Stage) => {
    if (stage.status === 'completed') return 'finish'
    if (stage.status === 'failed') return 'error'
    if (index === currentStageIndex && stage.status === 'running') return 'process'
    return 'wait'
  }

  return (
    <Steps
      direction="vertical"
      size="small"
      current={currentStageIndex}
      items={stages.map((stage, index) => ({
        title: stage.id,
        status: getStatus(index, stage) as any,
        icon: getIcon(stage.type),
        description: (
          <Tag 
            color={
              stage.status === 'completed' ? 'green' :
              stage.status === 'running' ? 'blue' :
              stage.status === 'failed' ? 'red' : 'default'
            }
          >
            {stage.status === 'completed' ? '已完成' :
             stage.status === 'running' ? '进行中' :
             stage.status === 'failed' ? '失败' : '等待'}
          </Tag>
        )
      }))}
    />
  )
}

export default StageProgress