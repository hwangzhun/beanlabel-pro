// 设计页面认证配置
export const AUTH_CONFIG = {
  // 设计页面密码 - 可通过环境变量 VITE_DESIGN_PASSWORD 覆盖
  designPassword: import.meta.env.VITE_DESIGN_PASSWORD || '司马',
  
  // Cookie 有效期（天）
  cookieExpireDays: 7,
  
  // Cookie 名称
  cookieName: 'beanlabel_design_auth',
  
  // 认证标识（用于验证 Cookie 有效性）
  authToken: 'authenticated'
};
