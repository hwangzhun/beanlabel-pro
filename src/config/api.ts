// API 配置
export const API_CONFIG = {
  // 开发环境使用本地服务器，生产环境需要修改为实际服务器地址
  // 默认端口从 3001 改为 2001，对应后端服务新的默认端口
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:2001',
  endpoints: {
    templates: '/api/templates',
    health: '/api/health',
  },
  // 请求超时时间（毫秒）
  timeout: 10000,
};

// 硅基流动API配置
export const SILICONFLOW_CONFIG = {
  // API Base URL
  baseURL: 'https://api.siliconflow.cn/v1',
  // API Key（从 .env.local 文件中的 VITE_SILICONFLOW_API_KEY 环境变量获取）
  // 请复制 .env.example 为 .env.local 并填入您的 API Key
  apiKey: import.meta.env.VITE_SILICONFLOW_API_KEY || '',
  // 模型名称
  model: 'Qwen/Qwen3-8B',
  // 请求超时时间（毫秒）
  timeout: 30000,
};

// 构建完整的 API URL
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.baseURL}${endpoint}`;
}





