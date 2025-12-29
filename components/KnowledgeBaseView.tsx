import React, { useState, useEffect } from 'react';

interface KnowledgeBaseViewProps {
  savedInstruction: string;
  onSave: (instruction: string) => void;
  onNavigateBack: () => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ savedInstruction, onSave, onNavigateBack }) => {
  const [text, setText] = useState(savedInstruction);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setText(savedInstruction);
  }, [savedInstruction]);

  const handleSave = () => {
    onSave(text);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-8 animate-fade-in bg-background-off dark:bg-black h-full flex flex-col items-center">
      
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-dark dark:text-white mb-2">Knowledge Base & Persona</h2>
            <p className="text-slate-med dark:text-gray-400">
              AI modelinin davranışlarını, tonunu ve önceliklerini özelleştirin.
            </p>
          </div>
          <button 
            onClick={onNavigateBack}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            Dashboard'a Dön
          </button>
        </div>

        {/* Info Card */}
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
            <span className="material-symbols-outlined">psychology</span>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-1">Nasıl Çalışır?</h4>
            <p className="text-sm text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
              Buraya gireceğiniz metin, Nexus PO ile yaptığınız <strong>her sohbetin başlangıcına</strong> eklenir. 
              Örneğin, "Sen kıdemli bir FinTech ürün yöneticisisin, cevapların her zaman teknik derinlik içermeli" 
              gibi bir talimat girerek AI'ın kişiliğini sabitleyebilirsiniz. Boş bırakırsanız standart mod çalışır.
            </p>
          </div>
        </div>

        {/* Text Area Card */}
        <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-6 relative group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>tune</span>
              Özel Sistem Talimatı (System Prompt)
            </label>
            {isSaved && (
              <span className="text-green-600 dark:text-green-400 text-sm font-medium animate-fade-in flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Kaydedildi
              </span>
            )}
          </div>

          <textarea
            className="w-full h-64 p-4 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:bg-white dark:focus:bg-black focus:border-primary dark:focus:border-blue-500 text-slate-800 dark:text-gray-200 text-sm leading-relaxed transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600 font-mono"
            placeholder="Örnek: Sen Nexus PO'sun. Cevapların her zaman madde işaretli olmalı. Kullanıcıya 'Siz' diye hitap et. Teknik terimleri İngilizce kullan..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>

          <div className="mt-6 flex justify-end gap-3">
             <button
               onClick={() => setText('')}
               className="px-5 py-2.5 text-slate-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-sm font-medium transition-colors"
             >
               Temizle
             </button>
             <button
               onClick={handleSave}
               className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
             >
               <span className="material-symbols-outlined text-[18px]">save</span>
               Ayarları Kaydet
             </button>
          </div>
        </div>

        {/* Preset Suggestions */}
        <div className="mt-10">
          <h3 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-4">Hızlı Başlangıç Şablonları</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setText("Sen agresif büyüme odaklı bir 'Growth Product Manager'sın. Her cevabında mutlaka A/B testi önerileri, huniler (funnels) ve dönüşüm oranlarını (conversion rates) artırmaya yönelik stratejiler sunmalısın.")}
              className="p-4 text-left border border-slate-200 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/5 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all group bg-white/50 dark:bg-[#18181b]"
            >
              <div className="font-semibold text-slate-800 dark:text-white mb-1 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">Growth Hacker</div>
              <div className="text-xs text-slate-500 dark:text-gray-500">Dönüşüm, metrikler ve A/B testleri odaklı.</div>
            </button>
            <button 
              onClick={() => setText("Sen titiz bir 'Technical Product Manager'sın. Kullanıcı deneyiminden çok API mimarisi, veritabanı şemaları, performans kısıtları ve güvenlik gereksinimlerine odaklanmalısın. Cevapların teknik detay içermeli.")}
              className="p-4 text-left border border-slate-200 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/5 hover:border-orange-300 dark:hover:border-orange-500/50 transition-all group bg-white/50 dark:bg-[#18181b]"
            >
              <div className="font-semibold text-slate-800 dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Technical PM</div>
              <div className="text-xs text-slate-500 dark:text-gray-500">API, Veritabanı ve Mimari odaklı.</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
