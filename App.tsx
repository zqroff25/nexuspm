import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { InputArea } from './components/InputArea';
import { ProcessingIndicator } from './components/ProcessingIndicator';
import { DocumentModal } from './components/DocumentModal';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { LandingPage } from './components/LandingPage';
import { Message, MessageRole, View, ToolId, Attachment, SavedChat } from './types';
import { sendMessageToGemini, generateFinalDocument } from './services/geminiService';

const App: React.FC = () => {
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [recentChats, setRecentChats] = useState<SavedChat[]>([]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // DEFAULT VIEW IS NOW LANDING
  const [currentView, setCurrentView] = useState<View>('landing');
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  
  // Custom Instruction (Persona) State
  const [customInstruction, setCustomInstruction] = useState<string>("");
  
  // State for Mode Switching Modal
  const [pendingMode, setPendingMode] = useState<ToolId | null>(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // State for Document Generation Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDocContent, setGeneratedDocContent] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Settings and History from LocalStorage on mount
  useEffect(() => {
    // Load Custom Instruction
    const savedInstruction = localStorage.getItem('nexus_custom_instruction');
    if (savedInstruction) {
      setCustomInstruction(savedInstruction);
    }

    // Load Recent Chats
    const savedChatsStr = localStorage.getItem('nexus_recent_chats');
    if (savedChatsStr) {
      try {
        const parsedChats: SavedChat[] = JSON.parse(savedChatsStr);
        // Date strings need to be converted back to Date objects for Messages
        const rehydratedChats = parsedChats.map(chat => ({
            ...chat,
            messages: chat.messages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }))
        }));
        setRecentChats(rehydratedChats);
      } catch (e) {
        console.error("Failed to parse recent chats", e);
      }
    }
  }, []);

  // Save Recent Chats to LocalStorage whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;

    // Define the updated chat object properties
    const lastMsg = messages[messages.length - 1];
    const firstUserMsg = messages.find(m => m.role === MessageRole.User);
    
    // Determine title (use first user message or tool name)
    let title = "Yeni Sohbet";
    if (firstUserMsg) {
        title = firstUserMsg.content.length > 40 
            ? firstUserMsg.content.substring(0, 40) + "..." 
            : firstUserMsg.content;
    } else if (activeTool) {
        title = activeTool.toUpperCase() + " Session";
    }

    const snippet = lastMsg 
        ? (lastMsg.content.length > 80 ? lastMsg.content.substring(0, 80) + "..." : lastMsg.content)
        : "No messages yet";

    setRecentChats(prevChats => {
        let updatedChats = [...prevChats];
        let chatIdToUse = currentChatId;

        // If this is a new session (no ID yet), generate one
        if (!chatIdToUse) {
            chatIdToUse = Date.now().toString();
            // IMPORTANT: We must update the state ID to prevent creating duplicates on next render
            setCurrentChatId(chatIdToUse);
        }

        const existingIndex = updatedChats.findIndex(c => c.id === chatIdToUse);

        const newChatData: SavedChat = {
            id: chatIdToUse,
            title: title,
            snippet: snippet,
            date: Date.now(),
            messages: messages,
            activeTool: activeTool
        };

        if (existingIndex !== -1) {
            // Update existing chat and move to top
            updatedChats.splice(existingIndex, 1);
            updatedChats.unshift(newChatData);
        } else {
            // Add new chat to top
            updatedChats.unshift(newChatData);
        }

        // Keep only max 5
        const trimmedChats = updatedChats.slice(0, 5);
        
        // Persist to localStorage
        localStorage.setItem('nexus_recent_chats', JSON.stringify(trimmedChats));
        
        return trimmedChats;
    });

  }, [messages]); // Dependency on messages triggers the save

  // Save Instruction Handler
  const handleSaveCustomInstruction = (text: string) => {
    setCustomInstruction(text);
    localStorage.setItem('nexus_custom_instruction', text);
  };

  useEffect(() => {
    // Check system preference on load
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: ligt)').matches) {
        setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (currentView === 'dashboard') {
        scrollToBottom();
    }
  }, [messages, isTyping, currentView]);

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (currentView !== 'dashboard') {
        setCurrentView('dashboard');
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.User,
      content: text,
      timestamp: new Date(),
      attachments: attachments
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
        // Pass customInstruction to the service
        const { text: responseText, sources, attachments: aiAttachments } = await sendMessageToGemini(messages, text, activeTool, attachments, customInstruction);
        
        const newAiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: MessageRole.Model,
            content: responseText,
            timestamp: new Date(),
            sources: sources,
            attachments: aiAttachments // Include generated images here
        };
        setMessages(prev => [...prev, newAiMsg]);
    } catch (e) {
        console.error(e);
    } finally {
        setIsTyping(false);
    }
  };

  // Centralized Mode Activation Logic
  const handleModeActivation = (toolId: ToolId) => {
    setActiveTool(toolId);
    
    let greeting = "";
    if (toolId === 'competitor') {
        greeting = "**Rakip Analizi Modu Aktif. 🚀**\n\nNexusPM olarak, pazar payını, kullanıcı deneyimini, fiyatlandırma stratejilerini ve teknik özellikleri derinlemesine incelemek için hazırım. \n\nAnalizi başlatmak için lütfen analiz etmek istediğiniz **ürün, sektör veya domain** ismini paylaşın:";
    } else if (toolId === 'prd') {
        greeting = "**PRD Asistanı Devrede. 📝**\n\nÜrün Gereksinim Dökümanını (PRD) oluşturmak için hazırım. User Stories, Kabul Kriterleri ve Teknik Gereksinimleri adım adım yapılandıracağım. \n\nHangi **özellik (feature)** veya **akış (flow)** için döküman yazacağız?";
    } else if (toolId === 'benchmark') {
        greeting = "**Benchmark Modu Aktif. 📊**\n\nGlobal en iyi örnekleri (Best-Practices) ve pazar standartlarını araştırmak için web tarayıcım hazır. \n\nİncelemek istediğiniz **UX pattern'i** veya **iş modeli** nedir?";
    }

    if (greeting) {
        const initialBotMsg: Message = {
            id: Date.now().toString(),
            role: MessageRole.Model,
            content: greeting,
            timestamp: new Date()
        };
        setMessages([initialBotMsg]);
        setCurrentChatId(null); // New mode starts a new chat context
    } else {
        setMessages([]); // Fallback
    }
    
    // Ensure we are in dashboard
    if (currentView !== 'dashboard') setCurrentView('dashboard');
  };

  // Logic to handle sidebar clicks with warning if chat exists
  const handleSidebarModeSelect = (mode: ToolId) => {
    if (activeTool === mode) return; // Already active

    if (messages.length > 0) {
        setPendingMode(mode);
        setShowSwitchModal(true);
    } else {
        handleModeActivation(mode);
    }
  };

  const confirmModeSwitch = () => {
    if (pendingMode) {
        handleModeActivation(pendingMode);
    }
    setShowSwitchModal(false);
    setPendingMode(null);
  };

  const cancelModeSwitch = () => {
    setShowSwitchModal(false);
    setPendingMode(null);
  };

  // Logic for Input Area Tool Toggle (doesn't reset chat, just toggles context)
  const handleToolToggle = (tool: ToolId) => {
    if (activeTool === tool) {
        setActiveTool(null);
    } else {
        setActiveTool(tool);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveTool(null);
    setCurrentChatId(null); // Reset ID ensures a new entry is created
    setCurrentView('dashboard');
    setIsTyping(false);
  };

  const handleLoadChat = (chat: SavedChat) => {
      setMessages(chat.messages);
      setActiveTool(chat.activeTool);
      setCurrentChatId(chat.id);
      setCurrentView('dashboard');
  };

  // --- Document Generation Logic ---
  const handleFinalizeDocument = async () => {
    if (messages.length === 0) return;

    setIsDocModalOpen(true);
    setIsGeneratingDoc(true);

    try {
        const htmlContent = await generateFinalDocument(messages, activeTool);
        setGeneratedDocContent(htmlContent);
    } catch (error) {
        console.error("Doc gen error", error);
        setGeneratedDocContent("<h1>Hata</h1><p>Döküman oluşturulamadı.</p>");
    } finally {
        setIsGeneratingDoc(false);
    }
  };

  // Check if there is actual user interaction (User has sent at least one message)
  // This prevents the button from being active when only the initial AI greeting is present.
  const hasUserInteraction = messages.some(msg => msg.role === MessageRole.User);

  // --- Views Content ---
  const renderDashboard = () => (
    <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth px-8 py-6 pb-32 h-full">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center -mt-16 animate-fade-in">
           <div className="w-20 h-20 bg-gradient-to-br from-[#1456b8] to-[#3b82f6] rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-blue-900/10 dark:shadow-blue-500/20">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '48px' }}>token</span>
           </div>
           <h1 className="text-4xl font-extrabold text-slate-dark dark:text-white mb-4 text-center tracking-tight">
             Merhaba, sana nasıl yardımcı olabilirim?
           </h1>
           <p className="text-slate-med dark:text-gray-400 text-lg max-w-2xl text-center mb-12 leading-relaxed">
             NexusPM; stratejik araştırma, dökümantasyon ve analiz süreçlerinde senin akıllı ortağın. Özel bir görev başlatmak için aşağıdan seçim yap.
           </p>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
              <button 
                onClick={() => handleModeActivation('competitor')}
                className="flex flex-col gap-3 p-5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-xl hover:border-[#1456b8]/50 dark:hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left group"
              >
                 <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#1456b8] dark:text-blue-400 group-hover:bg-[#1456b8] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">analytics</span>
                 </div>
                 <div>
                   <span className="block font-semibold text-slate-dark dark:text-gray-200 mb-1">Rakip Analizi</span>
                   <span className="text-sm text-slate-500 dark:text-gray-500">Doğrudan rakipleri ve özelliklerini karşılaştır.</span>
                 </div>
              </button>

              <button 
                 onClick={() => handleModeActivation('prd')}
                 className="flex flex-col gap-3 p-5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-xl hover:border-[#1456b8]/50 dark:hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left group"
              >
                 <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">description</span>
                 </div>
                 <div>
                   <span className="block font-semibold text-slate-dark dark:text-gray-200 mb-1">PRD Oluştur</span>
                   <span className="text-sm text-slate-500 dark:text-gray-500">Teknik döküman ve gereksinimleri yaz.</span>
                 </div>
              </button>

              <button 
                 onClick={() => handleModeActivation('benchmark')}
                 className="flex flex-col gap-3 p-5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-xl hover:border-[#1456b8]/50 dark:hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left group"
              >
                 <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">compare_arrows</span>
                 </div>
                 <div>
                   <span className="block font-semibold text-slate-dark dark:text-gray-200 mb-1">Benchmark Yap</span>
                   <span className="text-sm text-slate-500 dark:text-gray-500">En iyi örnekleri ve standartları incele.</span>
                 </div>
              </button>
           </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          
          {isTyping && (
             <div className="mt-4 mb-8">
                 <ProcessingIndicator activeTool={activeTool} />
             </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}
    </div>
  );

  const renderPlaceholderView = (title: string, icon: string, description: string) => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
       <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-slate-400 dark:text-gray-500" style={{ fontSize: '32px' }}>{icon}</span>
       </div>
       <h2 className="text-2xl font-bold text-slate-dark dark:text-white mb-2">{title}</h2>
       <p className="text-slate-med dark:text-gray-500 text-center max-w-md">{description}</p>
       <button 
         onClick={() => setCurrentView('dashboard')}
         className="mt-8 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all"
       >
         Back to Dashboard
       </button>
    </div>
  );

  const renderRecentChats = () => (
    <div className="flex-1 overflow-y-auto px-8 py-8 animate-fade-in">
       <div className="max-w-4xl mx-auto">
         <h2 className="text-3xl font-bold text-slate-dark dark:text-white mb-2">Recent Chats</h2>
         <p className="text-slate-med dark:text-gray-400 mb-8">Devam etmek veya incelemek için önceki bir oturumu seçin.</p>
         
         {recentChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 border-dashed">
                <span className="material-symbols-outlined text-slate-300 dark:text-gray-600 mb-4" style={{ fontSize: '48px' }}>history_toggle_off</span>
                <p className="text-slate-500 dark:text-gray-400 font-medium">Henüz kaydedilmiş sohbet yok.</p>
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className="mt-4 px-4 py-2 bg-white dark:bg-white/10 text-primary dark:text-blue-400 font-medium rounded-lg hover:shadow-md transition-all text-sm"
                >
                  Yeni bir sohbet başlat
                </button>
            </div>
         ) : (
            <div className="grid gap-4">
                {recentChats.map((chat) => (
                <div 
                    key={chat.id} 
                    onClick={() => handleLoadChat(chat)}
                    className="p-5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-xl hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-500/50 cursor-pointer transition-all group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 
                                ${chat.activeTool ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-gray-400'}`}>
                                <span className="material-symbols-outlined text-[18px]">
                                    {chat.activeTool === 'competitor' ? 'analytics' : 
                                     chat.activeTool === 'prd' ? 'description' : 
                                     chat.activeTool === 'benchmark' ? 'compare_arrows' : 'chat'}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-dark dark:text-gray-100 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                                {chat.title}
                            </h3>
                        </div>
                        <span className="text-xs font-medium text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-md">
                            {new Date(chat.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-2 pl-11 leading-relaxed">
                        {chat.snippet}
                    </p>
                </div>
                ))}
            </div>
         )}
       </div>
    </div>
  );

  // --- RENDER LANDING PAGE ---
  if (currentView === 'landing') {
      return (
          <div className="flex h-screen bg-background-off dark:bg-black transition-colors duration-300">
             <LandingPage onStart={() => setCurrentView('dashboard')} />
          </div>
      );
  }

  // --- MAIN APP RENDER ---
  return (
    <div className="flex h-screen bg-background-off dark:bg-black transition-colors duration-300">
      <Sidebar 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        currentView={currentView}
        onNavigate={setCurrentView}
        onSelectMode={handleSidebarModeSelect}
        activeTool={activeTool}
        onNewChat={handleNewChat}
      />
      
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white dark:bg-black transition-colors duration-300">
        {/* Header */}
        <header className="h-16 px-8 flex items-center justify-between sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-[#E5E7EB]/50 dark:border-white/10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <h2 className="text-slate-dark dark:text-white text-xl font-bold tracking-tight"></h2>
            <span className="px-2 py-0.5 rounded-full bg-silver-light dark:bg-white/10 text-xs font-medium text-slate-med dark:text-gray-400 border border-slate-200 dark:border-white/5">v2.4</span>
          </div>
          <div className="flex items-center gap-3">
            {/* <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 text-slate-dark dark:text-gray-300 text-sm font-medium transition-all hover:shadow-md active:scale-95">
              <span className="material-symbols-outlined text-slate-500 dark:text-gray-400" style={{ fontSize: '18px' }}>ios_share</span>
              Share
            </button>*/}
            <button 
              onClick={handleFinalizeDocument}
              disabled={!hasUserInteraction || isTyping}
              title={!hasUserInteraction ? "Önce bir konuşma başlatmalısınız." : "Konuşma geçmişinden döküman oluştur"}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm text-sm font-medium transition-all active:scale-95
                ${!hasUserInteraction || isTyping
                  ? 'bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-gray-600 border-slate-100 dark:border-white/5 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/90 text-white border-transparent hover:shadow-md'
                }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>article</span>
              Dokümanı Hazırla
            </button>
          </div>
        </header>

        {/* View Content */}
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'recent-chats' && renderRecentChats()}
        
        {/* Knowledge Base Replaced with New Component */}
        {currentView === 'knowledge-base' && (
            <KnowledgeBaseView 
                savedInstruction={customInstruction}
                onSave={handleSaveCustomInstruction}
                onNavigateBack={() => setCurrentView('dashboard')}
            />
        )}
        
        {currentView === 'projects' && renderPlaceholderView('Projects', 'folder_open', 'Manage your ongoing product initiatives, roadmaps, and sprint backlogs.')}

        {/* Input Area (Only visible on Dashboard) */}
        {currentView === 'dashboard' && (
           <InputArea 
             onSend={handleSendMessage} 
             disabled={isTyping} 
             activeTool={activeTool}
             onToggleTool={handleToolToggle}
            />
        )}
      </main>

      {/* Mode Switch Confirmation Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#18181b] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-white/10 transform transition-all scale-100">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
                    <span className="material-symbols-outlined">warning</span>
                </div>
                <h3 className="text-lg font-bold text-slate-dark dark:text-white mb-2">Mod Değiştirilsin mi?</h3>
                <p className="text-sm text-slate-med dark:text-gray-400 mb-6">
                    Yeni bir moda geçiş yapmak mevcut sohbet geçmişini sıfırlayacaktır. Devam etmek istediğine emin misin?
                </p>
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={cancelModeSwitch}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        İptal
                    </button>
                    <button 
                        onClick={confirmModeSwitch}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-blue-500/20 transition-all"
                    >
                        Evet, Değiştir
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Document Generation & Preview Modal */}
      <DocumentModal 
         isOpen={isDocModalOpen}
         onClose={() => setIsDocModalOpen(false)}
         isGenerating={isGeneratingDoc}
         content={generatedDocContent}
         title={activeTool === 'prd' ? "PRD Önizleme" : activeTool === 'competitor' ? "Rakip Analizi Raporu" : "Proje Raporu"}
      />
    </div>
  );
};

export default App;