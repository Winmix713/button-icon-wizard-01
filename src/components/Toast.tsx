import React from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, visible }) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="rounded-xl bg-white/90 text-black px-4 py-2 text-sm shadow-xl border border-black/10">
        {message}
      </div>
    </div>
  );
};

export default Toast;