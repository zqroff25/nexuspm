import React, { useEffect, useState } from 'react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isGenerating: boolean;
  title?: string;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose, content, isGenerating, title = "Döküman Önizleme" }) => {
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "Konuşma geçmişi analiz ediliyor...",
    "Kritik gereksinimler sentezleniyor...",
    "Format ve yapı oluşturuluyor...",
    "Son düzenlemeler yapılıyor..."
  ];

  useEffect(() => {
    if (isOpen && isGenerating) {
      setLoadingStep(0);
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isOpen, isGenerating]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>NexusPM - Export</title>');
      printWindow.document.write(`
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #111; line-height: 1.6; }
          h1 { color: #1456b8; font-size: 24px; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
          h2 { color: #333; font-size: 18px; margin-top: 25px; margin-bottom: 10px; }
          p { margin-bottom: 12px; font-size: 14px; }
          ul { margin-bottom: 15px; padding-left: 20px; }
          li { margin-bottom: 5px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
          th { background-color: #f3f4f6; text-align: left; padding: 8px; border: 1px solid #ddd; font-size: 13px; }
          td { padding: 8px; border: 1px solid #ddd; font-size: 13px; }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(content);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4 sm:p-8">
      
      {isGenerating ? (
        // LOADING STATE
        <div className="bg-white dark:bg-[#18181b] rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-white/20 flex flex-col items-center">
          <div className="relative w-16 h-16 mb-6">
             <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/10"></div>
             <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 animate-pulse">auto_awesome</span>
             </div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 text-center">Doküman Hazırlanıyor</h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 text-center min-h-[20px] transition-all duration-300">
            {loadingSteps[loadingStep]}
          </p>
        </div>
      ) : (
        // PREVIEW STATE (Full Modal, No floating Paper)
        <div className="bg-white dark:bg-[#111] rounded-xl w-full max-w-5xl h-[90vh] shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-fade-in">
          
          {/* Header */}
          <div className="h-16 bg-white dark:bg-[#111] border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <span className="material-symbols-outlined">description</span>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Kapat
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                PDF İndir / Yazdır
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-white dark:bg-[#111] custom-scrollbar">
            <div 
                id="doc-preview"
                className="max-w-4xl mx-auto"
                style={{ 
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: '1.7'
                }}
            >
                {/* Render HTML Content safely */}
                <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }} 
                />
            </div>
          </div>

        </div>
      )}

      {/* Inject custom styles for the generated HTML content within the preview */}
      <style>{`
        /* Light Mode Styles (Default) */
        #doc-preview h1 { color: #1456b8; font-size: 28px; font-weight: 800; border-bottom: 2px solid #eee; padding-bottom: 12px; margin-bottom: 24px; letter-spacing: -0.02em; }
        #doc-preview h2 { color: #111827; font-size: 20px; font-weight: 700; margin-top: 40px; margin-bottom: 16px; border-left: 4px solid #1456b8; padding-left: 12px; }
        #doc-preview h3 { color: #374151; font-size: 16px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; }
        #doc-preview p { margin-bottom: 16px; color: #374151; font-size: 15px; }
        #doc-preview ul { list-style-type: disc; padding-left: 24px; margin-bottom: 20px; color: #374151; }
        #doc-preview li { margin-bottom: 8px; font-size: 15px; }
        #doc-preview strong { font-weight: 600; color: #111827; }
        
        #doc-preview table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 24px 0; font-size: 14px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        #doc-preview th { background: #f9fafb; font-weight: 600; text-align: left; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; }
        #doc-preview td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #4b5563; vertical-align: top; }
        #doc-preview tr:last-child td { border-bottom: none; }
        #doc-preview tr:nth-child(even) { background-color: #f9fafb; }

        /* Dark Mode Overrides (Applied when parent has .dark class) */
        .dark #doc-preview h1 { color: #60a5fa; border-bottom-color: #374151; }
        .dark #doc-preview h2 { color: #f3f4f6; border-left-color: #60a5fa; }
        .dark #doc-preview h3 { color: #e5e7eb; }
        .dark #doc-preview p { color: #d1d5db; }
        .dark #doc-preview ul { color: #d1d5db; }
        .dark #doc-preview strong { color: #fff; }
        
        .dark #doc-preview table { border-color: #374151; }
        .dark #doc-preview th { background: #1f2937; color: #f3f4f6; border-bottom-color: #374151; }
        .dark #doc-preview td { border-bottom-color: #374151; color: #d1d5db; }
        .dark #doc-preview tr:nth-child(even) { background-color: #18181b; }
      `}</style>
    </div>
  );
};