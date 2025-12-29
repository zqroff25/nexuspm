import React from 'react';
import { View, ToolId } from '../types';

interface SidebarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  currentView: View;
  onNavigate: (view: View) => void;
  onSelectMode: (mode: ToolId) => void;
  onNewChat: () => void;
  activeTool: ToolId | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ isDarkMode, toggleTheme, currentView, onNavigate, onSelectMode, onNewChat, activeTool }) => {
  
  const getLinkClass = (view: View) => {
    const isActive = currentView === view;
    if (isActive) {
      return "flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1456b8]/10 dark:bg-blue-500/10 text-[#1456b8] dark:text-blue-400 group transition-colors cursor-pointer";
    }
    return "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-silver-light dark:hover:bg-white/5 text-slate-med dark:text-gray-400 hover:text-slate-dark dark:hover:text-white transition-colors group cursor-pointer";
  };

  const getModuleClass = (mode: ToolId) => {
    const isActive = activeTool === mode;
    return `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm font-medium ${
      isActive 
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
        : 'hover:bg-silver-light dark:hover:bg-white/5 text-slate-med dark:text-gray-400 hover:text-slate-dark dark:hover:text-white'
    }`;
  };

  return (
    <aside className="w-[260px] h-full bg-[#fbfcfd] dark:bg-[#09090b] border-r border-[#E5E7EB] dark:border-white/10 flex flex-col justify-between shrink-0 z-20 transition-all duration-300 hidden md:flex">
      {/* Top Section */}
      <div className="flex flex-col p-4 gap-6">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 px-2 cursor-pointer group select-none"
          title="Go to Landing Page"
        >
          <div className="bg-primary/10 dark:bg-blue-500/20 rounded-lg p-1.5 group-hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-primary dark:text-blue-400" style={{ fontSize: '24px' }}>token</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-slate-dark dark:text-white text-sm font-semibold tracking-tight group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">NexusPM</h1>
            <span className="text-slate-med dark:text-gray-500 text-[11px] font-medium uppercase tracking-wide">Professional</span>
          </div>
        </div>

        {/* New Chat Button */}
        <button 
          onClick={onNewChat}
          className="flex items-center justify-center gap-2 px-3 py-2.5 mx-1 rounded-lg bg-[#1456b8] hover:bg-[#1456b8]/90 text-white shadow-md shadow-blue-900/10 transition-all active:scale-95 group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform duration-300">add</span>
          <span className="text-sm font-semibold">Yeni Sohbet</span>
        </button>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1">
          <div onClick={() => onNavigate('dashboard')} className={getLinkClass('dashboard')}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </div>
          <div onClick={() => onNavigate('recent-chats')} className={getLinkClass('recent-chats')}>
            <span className="material-symbols-outlined group-hover:scale-105 transition-transform" style={{ fontSize: '20px' }}>history</span>
            <span className="text-sm font-medium">Recent Chats</span>
          </div>
          <div onClick={() => onNavigate('knowledge-base')} className={getLinkClass('knowledge-base')}>
            <span className="material-symbols-outlined group-hover:scale-105 transition-transform" style={{ fontSize: '20px' }}>library_books</span>
            <span className="text-sm font-medium">Knowledge Base</span>
          </div>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col p-4 gap-2 border-t border-[#E5E7EB]/50 dark:border-white/10">
        
        {/* Quick Modules */}
        <div className="mb-2 pb-2 border-b border-[#E5E7EB]/50 dark:border-white/5">
            <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hızlı Modüller</p>
            <div onClick={() => onSelectMode('competitor')} className={getModuleClass('competitor')}>
                <span className="material-symbols-outlined text-[18px]">analytics</span>
                <span>Rakip Analizi</span>
            </div>
            <div onClick={() => onSelectMode('prd')} className={getModuleClass('prd')}>
                <span className="material-symbols-outlined text-[18px]">description</span>
                <span>PRD Oluştur</span>
            </div>
            <div onClick={() => onSelectMode('benchmark')} className={getModuleClass('benchmark')}>
                <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
                <span>Benchmark</span>
            </div>
        </div>

        {/* Bottom Section 
        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-silver-light dark:hover:bg-white/5 text-slate-med dark:text-gray-400 hover:text-slate-dark dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
          <span className="text-sm font-medium">Settings</span>
        </a>
        <div className="flex items-center gap-3 px-3 py-2 mt-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
          <img 
            src="https://picsum.photos/seed/alex/100/100" 
            alt="User avatar" 
            className="w-8 h-8 rounded-full bg-center bg-cover border border-slate-200 dark:border-gray-700"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-dark dark:text-white">Alex Chen</span>
            <span className="text-xs text-slate-med dark:text-gray-500">Pro Member</span>
          </div>
        </div> */}
      </div>
    </aside>
  );
};