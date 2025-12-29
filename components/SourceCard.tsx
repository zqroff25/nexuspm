import React from 'react';
import { Source } from '../types';

interface SourceCardProps {
  source: Source;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source }) => {
  // Extract a clean domain for display if sourceName isn't pretty
  const domain = source.sourceName || new URL(source.url).hostname.replace('www.', '');
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=32`;

  return (
    <a 
      href={source.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block group/card relative bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col"
    >
      <div className="h-24 w-full bg-slate-100 dark:bg-gray-800 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-white dark:from-gray-800 dark:to-gray-700 opacity-50"></div>
        <div 
          className="w-full h-full bg-cover bg-center grayscale group-hover/card:grayscale-0 transition-all duration-500 opacity-60 group-hover/card:opacity-100" 
          style={{ backgroundImage: `url('${source.image || 'https://picsum.photos/200/100'}')` }}
        ></div>
        <div className="absolute inset-0 bg-[#1456b8]/10 dark:bg-blue-500/10 mix-blend-overlay"></div>
      </div>
      <div className="p-3 flex items-center gap-2 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#18181b] grow transition-colors">
        <img 
          src={faviconUrl} 
          alt="favicon" 
          className="w-4 h-4 rounded-full bg-slate-200 dark:bg-gray-700 shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/16' }} 
        />
        <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 truncate">{source.title}</span>
      </div>
    </a>
  );
};
