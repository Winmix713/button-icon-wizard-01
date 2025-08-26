import React from 'react';
import { FileCode, Braces, FileType, Layers } from 'lucide-react';
import { ConversionResults } from '../App';

interface CodeTabsProps {
  activeTab: keyof ConversionResults;
  onTabChange: (tab: keyof ConversionResults) => void;
}

const CodeTabs: React.FC<CodeTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'json' as const, label: 'JSON Info', icon: FileType },
    { id: 'html' as const, label: 'HTML', icon: null },
    { id: 'js' as const, label: 'JavaScript', icon: FileCode },
    { id: 'jsx' as const, label: 'JSX', icon: Braces },
    { id: 'css' as const, label: 'CSS', icon: FileType },
    { id: 'layers' as const, label: 'All layer CSS', icon: Layers },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`inline-flex items-center gap-2 text-xs rounded-xl px-3 py-2 border transition ${
              isActive
                ? 'bg-white/10 border-white/15 text-white'
                : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />}
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default CodeTabs;