import { CoffeeBean } from '../types';
import { getApiUrl, API_CONFIG } from '../config/api';

// API 请求辅助函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(endpoint);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw error;
  }
}

// 模板服务：直接使用后端 API，从 data/templates.json 读写数据
export const templateService = {
  // 获取所有模板（从后端 API 读取）
  getAll: async () => {
    try {
      const templates = await apiRequest<CoffeeBean[]>(
        API_CONFIG.endpoints.templates
      );
      return templates || [];
    } catch (error) {
      console.error('获取模板列表失败:', error);
      throw error;
    }
  },
  
  // 保存模板（保存到后端 API，写入 data/templates.json）
  save: async (bean: CoffeeBean) => {
    if (!bean.id) {
      throw new Error('模板 ID 不能为空');
    }

    try {
      const savedBean = await apiRequest<CoffeeBean>(
        API_CONFIG.endpoints.templates,
        {
          method: 'POST',
          body: JSON.stringify(bean),
        }
      );
      return savedBean;
    } catch (error) {
      console.error('保存模板失败:', error);
      throw error;
    }
  },

  // 删除模板（从后端 API 删除，更新 data/templates.json）
  delete: async (id: string) => {
    try {
      await apiRequest(API_CONFIG.endpoints.templates + `/${id}`, {
        method: 'DELETE',
      });
      return id;
    } catch (error) {
      console.error('删除模板失败:', error);
      throw error;
    }
  },

  // 根据 ID 获取模板（从后端 API 读取）
  getById: async (id: string) => {
    try {
      const template = await apiRequest<CoffeeBean>(
        API_CONFIG.endpoints.templates + `/${id}`
      );
      return template || null;
    } catch (error) {
      console.error('获取模板失败:', error);
      // 如果模板不存在，返回 null 而不是抛出错误
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },
};
