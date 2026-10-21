import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface FullscreenPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * 桌面端全屏预览模态组件
 * - 仅在桌面端显示
 * - 移动端应使用独立路由页面
 */
export const FullscreenPreview: React.FC<FullscreenPreviewProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer
}) => {
  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 hidden md:flex flex-col bg-black"
      onClick={onClose}
    >
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-black/50 text-white shrink-0">
        <h3 className="font-bold text-lg">{title || '预览'}</h3>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </header>
      
      {/* Content */}
      <div 
        className="flex-1 overflow-auto flex items-center justify-center p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
      
      {/* Footer */}
      {footer && (
        <footer className="px-6 py-4 bg-black/50 text-center text-white/60 text-sm shrink-0">
          {footer}
        </footer>
      )}
    </div>
  );
};
