import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { Alert, Button, Card, Center, Loader, PasswordInput, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { AUTH_CONFIG } from '../config/auth';
import { getCookie, setCookie, deleteCookie } from '../utils/cookie';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 检查是否已认证
 */
export function isAuthenticated(): boolean {
  const token = getCookie(AUTH_CONFIG.cookieName);
  return token === AUTH_CONFIG.authToken;
}

/**
 * 退出登录
 */
export function logout(): void {
  deleteCookie(AUTH_CONFIG.cookieName);
}

/**
 * 设计页面密码保护组件
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 初始化时检查认证状态
  useEffect(() => {
    setIsAuthed(isAuthenticated());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 模拟短暂延迟，提升用户体验
    setTimeout(() => {
      if (password === AUTH_CONFIG.designPassword) {
        // 密码正确，设置 Cookie
        setCookie(AUTH_CONFIG.cookieName, AUTH_CONFIG.authToken, AUTH_CONFIG.cookieExpireDays);
        setIsAuthed(true);
      } else {
        setError('密码错误，请重试');
        setPassword('');
      }
      setIsLoading(false);
    }, 300);
  };

  const handleGoToPrint = () => {
    window.location.hash = '#/print';
  };

  if (isAuthed === null) return <Center mih="100dvh"><Loader aria-label="加载中" /></Center>;
  if (isAuthed) return <>{children}</>;
  return <div className="login-page">
    <Card withBorder radius="xl" padding="xl" shadow="sm" w="100%" maw={420}>
      <Stack gap="lg">
        <Stack align="center" gap="xs">
          <ThemeIcon size={56} radius="xl" variant="light"><Lock size={26} /></ThemeIcon>
          <Title order={1} size="h3" c="coffee.9">标签管理</Title>
          <Text size="sm" c="dimmed">输入密码，管理你的咖啡标签</Text>
        </Stack>
        <form onSubmit={handleSubmit}>
          <Stack>
            <PasswordInput label="请输入密码" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入管理密码" autoFocus disabled={isLoading} autoComplete="current-password" visibilityToggleButtonProps={{ 'aria-label': '显示或隐藏密码' }} />
            {error && <Alert color="red" role="alert">{error}</Alert>}
            <Button type="submit" fullWidth size="md" loading={isLoading} disabled={!password.trim()} rightSection={<ArrowRight size={17} />}>验证密码</Button>
          </Stack>
        </form>
        <Button variant="subtle" onClick={handleGoToPrint} rightSection={<ArrowRight size={15} />}>返回打印工作台</Button>
      </Stack>
    </Card>
  </div>;
};
