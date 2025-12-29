import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, MessageRole, Attachment } from '../types';
import { SourceCard } from './SourceCard';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === MessageRole.User;
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Initialize Mermaid if present
  useEffect(() => {
    if (message.content.includes('```mermaid') && mermaidRef.current) {
        // @ts-ignore
        if (window.mermaid) {
            // @ts-ignore
            window.mermaid.init(undefined, mermaidRef.current.querySelectorAll('.mermaid'));
        }
    }
  }, [message.content]);

  const renderContent = (text: string) => {
    // Split by Mermaid code blocks to render them separately
    const parts = text.split(/(```mermaid[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      // Handle Mermaid Blocks
      if (part.startsWith('```mermaid')) {
        const content = part.replace('```mermaid', '').replace('```', '').trim();
        return (
          <div key={index} className="my-6 p-4 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-lg overflow-x-auto shadow-sm" ref={mermaidRef}>
            <div className="mermaid flex justify-center">{content}</div>
          </div>
        );
      }

      // Handle standard Markdown (tables, lists, bold, etc.)
      return (
        <div key={index} className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {part}
          </ReactMarkdown>
        </div>
      );
    });
  };

  const getFileIconInfo = (mimeType: string) => {
    if (mimeType.includes('pdf')) return { icon: 'picture_as_pdf', color: 'text-red-500', label: 'PDF' };
    if (mimeType.includes('csv') || mimeType.includes('sheet') || mimeType.includes('excel')) return { icon: 'table_chart', color: 'text-green-500', label: 'CSV/XLS' };
    if (mimeType.includes('text') || mimeType.includes('plain')) return { icon: 'description', color: 'text-slate-500', label: 'TXT' };
    if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return { icon: 'code', color: 'text-yellow-500', label: 'CODE' };
    return { icon: 'insert_drive_file', color: 'text-blue-500', label: 'FILE' };
  };

  const renderAttachments = (attachments: Attachment[]) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4 w-full">
        {attachments.map((att, idx) => {
          if (att.type === 'image') {
            return (
              <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 max-w-[240px] max-h-[240px]">
                <img src={att.content} alt={att.name} className="w-full h-full object-cover" />
              </div>
            );
          } else {
            const { icon, color, label } = getFileIconInfo(att.mimeType);
            return (
              <div key={idx} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl min-w-[200px] max-w-full backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-white/10 transition-colors cursor-default">
                <div className={`w-10 h-10 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0`}>
                   <span className={`material-symbols-outlined ${color}`} style={{ fontSize: '24px' }}>{icon}</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                   <span className="text-sm font-semibold text-slate-700 dark:text-gray-200 truncate pr-2" title={att.name}>{att.name}</span>
                   <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
      {/* Avatar for AI */}
      {!isUser && (
        <div className="mr-4 mt-1 w-8 h-8 rounded-full bg-[#1456b8]/10 dark:bg-blue-500/20 border border-[#1456b8]/20 dark:border-blue-500/30 shrink-0 flex items-center justify-center self-start">
          <span className="material-symbols-outlined text-[#1456b8] dark:text-blue-400" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* User Avatar & Name only if User */}
        {isUser && (
           <div className="flex items-center gap-2 mb-1">
             <span className="text-xs font-medium text-slate-400 dark:text-gray-500">You</span>
             <img src="https://picsum.photos/seed/alex/100/100" className="w-8 h-8 rounded-full border border-slate-100 dark:border-gray-700" alt="User" />
           </div>
        )}

        {/* Message Bubble */}
        <div 
          className={`
            relative leading-relaxed shadow-sm transition-colors
            ${isUser 
              ? 'px-5 py-3.5 bg-[#1456b8]/5 dark:bg-blue-900/20 border border-[#1456b8]/10 dark:border-blue-500/10 rounded-2xl rounded-tr-sm text-[#172B4D] dark:text-gray-100 text-[15px]' 
              : 'w-full text-[#172B4D] dark:text-gray-100'
            }
          `}
        >
          {/* AI Header */}
          {!isUser && (
             <div className="flex items-center gap-2 mb-3">
               <span className="text-sm font-bold text-slate-dark dark:text-gray-100">Nexus AI</span>
               <span className="text-xs text-slate-400 dark:text-gray-500">{message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             </div>
          )}

          {/* Sources Grid (Only for AI) */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="w-full mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-slate-400 dark:text-gray-500" style={{ fontSize: '16px' }}>grid_view</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Research Sources</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {message.sources.map((source, idx) => (
                  <SourceCard key={idx} source={source} />
                ))}
              </div>
            </div>
          )}

          {/* Attachments (Displayed INSIDE the bubble, at the top) */}
          {message.attachments && renderAttachments(message.attachments)}

          {/* Text Content */}
          <div className={`${!isUser ? 'space-y-4' : ''}`}>
            {renderContent(message.content)}
          </div>

        </div>
      </div>
    </div>
  );
};
