import React, { useEffect, useState } from 'react';

interface ProcessingIndicatorProps {
  activeTool: string | null;
}

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ activeTool }) => {
  const [step, setStep] = useState(0);

  const steps = activeTool === 'deep-search' || activeTool === 'competitor' 
    ? ['Web kaynakları taranıyor...', 'Veriler toplanıyor...', 'Rakipler analiz ediliyor...', 'Rapor oluşturuluyor...']
    : activeTool === 'image-gen'
    ? ['Prompt optimize ediliyor...', 'Flux modeli hazırlanıyor...', 'Görsel işleniyor...', 'Tamamlanıyor...']
    : activeTool === 'project-arch' || activeTool === 'prd'
    ? ['Gereksinimler inceleniyor...', 'User story\'ler oluşturuluyor...', 'Teknik detaylar yazılıyor...', 'Formatlanıyor...']
    : ['Bağlam inceleniyor...', 'Bilgi bankası taranıyor...', 'Yanıt üretiliyor...'];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1800); // Change text every 1.8 seconds

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex flex-col gap-3 w-full max-w-md animate-fade-in p-4 bg-white/50 dark:bg-[#18181b]/50 rounded-xl border border-slate-100 dark:border-white/5 backdrop-blur-sm">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-gray-400">
        <span>{steps[step]}</span>
        <span>{Math.min(((step + 1) / steps.length) * 100, 95).toFixed(0)}%</span>
      </div>
      
      {/* Progress Bar Track */}
      <div className="h-1.5 w-full bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
        {/* Animated Fill */}
        <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out relative"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        >
            <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite] w-full h-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}></div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
