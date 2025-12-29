import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { ToolId, Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  disabled?: boolean;
  activeTool: ToolId | null;
  onToggleTool: (tool: ToolId) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled, activeTool, onToggleTool }) => {
  const [text, setText] = useState('');
  const [showTools, setShowTools] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const toolsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((text.trim() || attachments.length > 0) && !disabled) {
      onSend(text, attachments);
      setText('');
      setAttachments([]);
      setShowTools(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled) {
      handleSend();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      // Process files
      Array.from(event.target.files).forEach((file: File) => {
        const reader = new FileReader();
        // Read everything as DataURL (Base64) to simplify handling images and PDFs
        reader.readAsDataURL(file);
        reader.onload = () => {
          setAttachments(prev => [...prev, {
            type: file.type.startsWith('image/') ? 'image' : 'file',
            content: reader.result as string,
            name: file.name,
            mimeType: file.type
          }]);
        };
      });
      // Reset input so same file can be selected again if needed
      event.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Close tools menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setShowTools(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToolSelect = (tool: ToolId) => {
    onToggleTool(tool);
    setShowTools(false); 
  };

  const renderToolItem = (id: ToolId, label: string, desc: string, icon: string, color: string) => {
    const isActive = activeTool === id;
    const colorClasses = {
      blue:  isActive ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'hover:bg-slate-50 text-slate-600',
      pink:  isActive ? 'bg-pink-50 text-pink-700 shadow-sm ring-1 ring-pink-100' : 'hover:bg-slate-50 text-slate-600',
      orange: isActive ? 'bg-orange-50 text-orange-700 shadow-sm ring-1 ring-orange-100' : 'hover:bg-slate-50 text-slate-600',
      purple: isActive ? 'bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-100' : 'hover:bg-slate-50 text-slate-600',
      iconActive: {
        blue: 'bg-blue-100 text-blue-600',
        pink: 'bg-pink-100 text-pink-600',
        orange: 'bg-orange-100 text-orange-600',
        purple: 'bg-purple-100 text-purple-600',
      }
    };

    // @ts-ignore
    const activeIconClass = colorClasses.iconActive[color];

    return (
      <button 
        key={id}
        onClick={() => handleToolSelect(id)} 
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm transition-all mb-1 ${// @ts-ignore
          colorClasses[color]}`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? activeIconClass : 'bg-slate-100 text-slate-400'}`}>
           <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <div>
           <div className={`font-semibold text-xs ${isActive ? 'text-slate-900 dark:text-black' : 'text-slate-900 dark:text-white'}`}>{label}</div>
           <div className="text-[9px] text-slate-500 leading-tight dark:text-gray-400">{desc}</div>
        </div>
        {isActive && (
          <span className={`material-symbols-outlined ml-auto text-[16px] text-${color}-600`}>check_circle</span>
        )}
      </button>
    );
  };

  const getActiveColor = () => {
    if (activeTool === 'image-gen') return 'pink';
    if (activeTool === 'project-arch' || activeTool === 'prd') return 'orange';
    if (activeTool === 'deep-search' || activeTool === 'competitor') return 'blue';
    return 'blue';
  };
  
  const activeColor = getActiveColor();

  return (
    <div className="absolute bottom-6 left-0 right-0 px-8 flex justify-center z-30 pointer-events-none">
      <div className="w-[750px] max-w-full pointer-events-auto flex flex-col items-center gap-2">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 p-2 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10 shadow-sm animate-fade-in self-start ml-1">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group/att shrink-0">
                <div className="h-12 w-12 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm bg-slate-50 dark:bg-white/5 relative">
                  {att.type === 'image' ? (
                    <img src={att.content} alt={att.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center p-1 text-slate-500 dark:text-gray-400">
                      <span className="material-symbols-outlined text-sm">description</span>
                      <span className="text-[7px] truncate max-w-full text-center leading-none mt-0.5">{att.name}</span>
                    </div>
                  )}
                  {/* Remove Button */}
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover/att:opacity-100 hover:bg-red-500 transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[10px]">close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Input Bar */}
        <div className="w-full relative group">
           {/* Glow Effect - Made more visible (opacity-30 default) for separation on white */}
           <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-300/40 via-purple-300/40 to-pink-300/40 rounded-2xl opacity-100 group-hover:opacity-100 blur transition duration-500 -z-10`}></div>

           {/* Added stronger shadow: shadow-[0_0_20px_rgba(0,0,0,0.08)] */}
           <div className="relative flex items-center gap-1.5 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] dark:shadow-none rounded-[18px] pl-2 pr-2 py-1.5 h-[52px]">
            
            {/* Tools Button */}
            <div className="relative shrink-0" ref={toolsRef}>
              <button 
                onClick={() => setShowTools(!showTools)}
                className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${showTools ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                title="Modlar"
              >
                {activeTool && (
                  <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-${activeColor}-500`}></span>
                )}
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
              </button>

              {/* Tools Popup */}
              {showTools && (
                <div className="absolute bottom-full left-0 mb-3 w-64 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 dark:border-white/10 overflow-hidden animate-fade-in z-50 p-1.5">
                  <div className="px-3 py-2 border-b border-slate-100/50 dark:border-white/5 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Mod Seçimi</span>
                  </div>
                  {renderToolItem('deep-search', 'Derin Arama', 'İnternet tabanlı araştırma', 'globe_uk', 'blue')}
                  {renderToolItem('image-gen', 'Görsel Oluştur', 'Fal.ai Flux ile çizim', 'brush', 'pink')}
                  {renderToolItem('project-arch', 'Proje Oluştur', 'PRD, Kod ve Mimari', 'architecture', 'orange')}
                  {renderToolItem('swot', 'SWOT Analizi', 'Stratejik planlama', 'grid_view', 'purple')}
                </div>
              )}
            </div>

            {/* Add File Button */}
            <input 
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-9 flex items-center justify-center shrink-0 rounded-xl text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                title="Dosya Ekle"
            >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </button>

            {/* Separator */}
            <div className="h-5 w-px bg-slate-100 dark:bg-white/10 mx-1"></div>

            {/* Input Field */}
            <div className="flex-1 flex items-center min-w-0">
               {activeTool && (
                 <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md mr-2 text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap select-none
                     bg-${activeColor}-50 text-${activeColor}-600 border-${activeColor}-100 dark:bg-${activeColor}-900/30 dark:text-${activeColor}-400 dark:border-${activeColor}-500/20`}>
                   <span className="material-symbols-outlined text-[12px]">
                      {activeTool === 'deep-search' ? 'globe_uk' : activeTool === 'image-gen' ? 'brush' : activeTool === 'project-arch' ? 'architecture' : 'explore'}
                   </span>
                   <span>{activeTool.replace('-', ' ')}</span>
                 </div>
               )}

               <input 
                  className="w-full bg-transparent border-none text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 text-[15px] p-0"
                  placeholder={
                    disabled ? "NexusPM düşünüyor..." : 
                    activeTool === 'deep-search' ? "Araştırmak istediğin konuyu yaz..." : 
                    activeTool === 'image-gen' ? "Görseli tarif et..." : 
                    "NexusPM ile sohbet et..."
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={disabled}
                  autoFocus
               />
            </div>

            {/* Send Button */}
            <button 
                onClick={handleSend}
                disabled={(!text.trim() && attachments.length === 0) || disabled}
                className={`h-9 w-9 flex items-center justify-center shrink-0 rounded-xl transition-all transform active:scale-95 ml-1 
                  ${(!text.trim() && attachments.length === 0) || disabled
                    ? 'bg-slate-100 text-slate-300 dark:bg-white/5 dark:text-gray-600' 
                    : `bg-gradient-to-tr from-${activeColor}-600 to-${activeColor === 'orange' ? 'amber' : activeColor === 'pink' ? 'rose' : 'indigo'}-600 text-white shadow-md shadow-${activeColor}-200 dark:shadow-none`
                  }`}
            >
                <span className="material-symbols-outlined text-[20px]">
                    {activeTool === 'image-gen' ? 'draw' : 'arrow_upward'}
                </span>
            </button>
           </div>
           
           <div className="text-center mt-2 opacity-40 hover:opacity-100 transition-opacity">
              <p className="text-[9px] text-slate-400 dark:text-gray-700 font-medium">NexusPM v2.4</p>
           </div>
        </div>
      </div>
    </div>
  );
};