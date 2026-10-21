import React, { useState, useEffect } from 'react';
import { DesktopView } from './components/DesktopView';
import { PrintView } from './components/PrintView';
import { AuthGuard } from './components/AuthGuard';
import { canNavigate } from './utils/navigationGuard';

function App() {
  const [route, setRoute] = useState(window.location.hash || window.location.pathname);

  useEffect(() => {
    // 默认路由到打印工作台
    if (!window.location.hash && window.location.pathname === '/') {
        window.location.hash = '#/print';
    }

    const onHashChange = () => {
      if (!canNavigate()) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search + (route.startsWith('#') ? route : ''));
        return;
      }
      setRoute(window.location.hash);
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [route]);

  const renderRoute = () => {
    if (route.startsWith('#/print') || route === '/print') {
        return <PrintView />;
    }
    if (route.startsWith('#/edit') || route === '/edit') {
        // 设计页面需要密码保护
        return (
          <AuthGuard>
            <DesktopView key={route} />
          </AuthGuard>
        );
    }
    // 默认回退到打印工作台
    return <PrintView />;
  };

  return (
    <>
      {renderRoute()}
    </>
  );
}

export default App;
