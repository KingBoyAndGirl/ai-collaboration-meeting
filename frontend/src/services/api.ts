/** API 客户端 */
import axios from 'axios'
import { message } from 'antd'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const apiKey = localStorage.getItem('api_key')
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    message.error(error.response?.data?.detail || '请求失败')
    return Promise.reject(error)
  }
)

// 类型定义
export interface Meeting {
  id: string
  scene_name: string
  status: string
  current_stage: number
  created_at: string
}

export interface Scene {
  id: string
  name: string
  description: string
  version: string
}

export interface Message {
  id: string
  role: 'user' | 'agent' | 'moderator'
  role_id: string
  content: string
  timestamp: string
}

// API 方法
export const meetingApi = {
  list: (params?: { status?: string; limit?: number }) => 
    api.get<Meeting[]>('/meetings', { params }),
  
  get: (id: string) => 
    api.get<Meeting>(`/meetings/${id}`),
  
  create: (data: { scene_name: string; variables?: Record<string, any> }) =>
    api.post<Meeting>('/meetings', data),
  
  start: (id: string) =>
    api.post(`/meetings/${id}/start`),
  
  pause: (id: string) =>
    api.post(`/meetings/${id}/pause`),
  
  resume: (id: string) =>
    api.post(`/meetings/${id}/resume`),
  
  approve: (id: string) =>
    api.post(`/meetings/${id}/approve`),
  
  reject: (id: string) =>
    api.post(`/meetings/${id}/reject`),
  
  stop: (id: string) =>
    api.post(`/meetings/${id}/stop`),
  
  feedback: (id: string, content: string) =>
    api.post(`/meetings/${id}/intervene`, { content }),
  
  getOutput: (id: string) =>
    api.get(`/meetings/${id}/output`),
}

export const sceneApi = {
  list: () => api.get<Scene[]>('/scenes'),
  
  get: (id: string) => api.get<Scene>(`/scenes/${id}`),
  
  create: (data: Partial<Scene>) =>
    api.post<Scene>('/scenes', data),
  
  update: (id: string, data: Partial<Scene>) =>
    api.put<Scene>(`/scenes/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/scenes/${id}`),
}

export const outputApi = {
  list: (params?: { format?: string; limit?: number }) =>
    api.get<OutputInfo[]>('/outputs', { params }),
  
  generate: (data: { meeting_id: string; format?: string }) =>
    api.post('/outputs/generate', data),
  
  cleanup: (days?: number, dryRun?: boolean) =>
    api.get('/outputs/cleanup', { params: { days, dry_run: dryRun } }),
  
  download: (filename: string) =>
    `${api.defaults.baseURL}/outputs/${filename}`,
}

export interface OutputInfo {
  filename: string
  size: number
  created_at: number
  url: string
}

export default api