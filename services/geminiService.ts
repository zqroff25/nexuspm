import { GoogleGenAI, Tool } from "@google/genai";
import { Message, MessageRole, Source, ToolId, Attachment } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_INSTRUCTION = `You are NexusPM, an advanced AI Product Management Workstation. 
Your goal is to assist Product Owners and Managers with strategic research, PRD creation, and workflow visualization.

Tone & Style:
- Professional, concise, and data-driven.
- **Formatting:** Use Markdown tables for comparisons. Use Bullet points for lists. Use H3 (###) for section headers.
- **Charts:** When explaining user flows or technical architecture, ALWAYS generate a Mermaid.js diagram in a \`\`\`mermaid code block.
`;

export const sendMessageToGemini = async (
  history: Message[],
  userMessage: string,
  activeTool: ToolId | null,
  attachments: Attachment[] = [],
  customInstruction: string = "" 
): Promise<{ text: string; sources: Source[]; attachments: Attachment[] }> => {
  try {
    // Prepare the content parts (Text + Images)
    const parts: any[] = [{ text: userMessage }];
    attachments.forEach(att => {
        const base64Data = att.content.split(',')[1];
        if (base64Data) {
            parts.push({
                inlineData: {
                    mimeType: att.mimeType,
                    data: base64Data
                }
            });
        }
    });

    let result;

    // --- BRANCH 1: Image Generation (Stateless / Direct Generation) ---
    // We use generateContent directly for Image Gen to avoid chat history interference 
    // which often causes the model to chat instead of generating images.
    if (activeTool === 'image-gen') {
        result = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
                 // No tools, no system instruction needed for pure generation.
            }
        });
    } 
    // --- BRANCH 2: Standard Chat (Stateful) ---
    else {
        let model = 'gemini-3-flash-preview';
        let tools: Tool[] | undefined = [{ googleSearch: {} }];
        let systemInstruction = BASE_INSTRUCTION;

        // Apply User's Custom Instruction / Persona if it exists
        if (customInstruction && customInstruction.trim() !== "") {
            systemInstruction = `
IMPORTANT: The user has provided specific custom instructions for your persona and behavior. 
You MUST prioritize these instructions above standard tone settings where applicable.

USER CUSTOM INSTRUCTIONS:
"${customInstruction}"

---
CORE SYSTEM INSTRUCTIONS:
${BASE_INSTRUCTION}
`;
        }

        // Tailor instructions based on Active Tool (Text-based tools)
        if (activeTool === 'competitor') {
            systemInstruction += `\n\nACTIVE MODE: COMPETITOR ANALYSIS
            - You are now a Market Research Specialist.
            - SEARCH MANDATORY: You MUST use Google Search to find real-time data about competitors.
            - OUTPUT: Create a comparison table (Price, Features, Target Audience, Pros/Cons).
            - Focus on direct competitors for the user's specific query.`;
        } else if (activeTool === 'prd' || activeTool === 'project-arch') {
            systemInstruction += `\n\nACTIVE MODE: PRD & ARCHITECTURE
            - You are now a Senior Product Manager & Technical Architect.
            - OUTPUT: Structured PRD format (Problem, Goals, User Stories, Acceptance Criteria, Tech Stack).
            - Create Mermaid diagrams for User Flows or Entity Relationships.`;
        } else if (activeTool === 'benchmark') {
            systemInstruction += `\n\nACTIVE MODE: BENCHMARKING
            - You are now a UX Researcher.
            - Find "Best-in-class" examples for the specific flow requested.
            - Cite specific apps/websites that do this well.`;
        } else if (activeTool === 'swot') {
            systemInstruction += `\n\nACTIVE MODE: SWOT ANALYSIS
            - Perform a detailed SWOT analysis based on the user's input.`;
        }

        // Convert history to format expected by Gemini
        const recentHistory = history.slice(-10).map(msg => ({
            role: msg.role === MessageRole.User ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const chat = ai.chats.create({
            model: model,
            config: {
                systemInstruction: systemInstruction,
                tools: tools,
            },
            history: recentHistory,
        });

        result = await chat.sendMessage({ 
            message: parts
        });
    }
    
    // --- Process Response (Common for both branches) ---
    let text = "";
    const generatedAttachments: Attachment[] = [];
    const sources: Source[] = [];

    const candidates = result.candidates;
    if (candidates && candidates.length > 0) {
        const content = candidates[0].content;
        
        // 1. Extract Grounding Metadata (Sources)
        const groundingChunks = candidates[0].groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            groundingChunks.forEach((chunk: any) => {
                if (chunk.web) {
                    const uri = chunk.web.uri;
                    const hostname = new URL(uri).hostname.replace('www.', '');
                    if (!hostname.includes('google.') && !hostname.includes('bing.') && !hostname.includes('yahoo.')) {
                        sources.push({
                            title: chunk.web.title || hostname,
                            url: uri,
                            sourceName: hostname,
                            image: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/400/250`
                        });
                    }
                }
            });
        }

        // 2. Extract Text and Inline Images
        if (content && content.parts) {
            for (const part of content.parts) {
                if (part.text) {
                    text += part.text;
                } else if (part.inlineData) {
                    // This is a generated image
                    generatedAttachments.push({
                        type: 'image',
                        content: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                        name: 'Generated Image',
                        mimeType: part.inlineData.mimeType
                    });
                }
            }
        }
    }

    // Fallback text if image was generated but no text description
    if (!text && generatedAttachments.length > 0) {
        text = "İşte oluşturulan görsel:";
    } else if (!text) {
        text = "Bir yanıt oluşturulamadı.";
    }

    return { text, sources, attachments: generatedAttachments };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "Üzgünüm, işleminizi gerçekleştirirken bir hata oluştu. Lütfen tekrar deneyin.",
      sources: [],
      attachments: []
    };
  }
};

export const generateFinalDocument = async (
  history: Message[], 
  activeTool: ToolId | null
): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    // Prepare conversation context
    const conversationContext = history
      .filter(msg => msg.role !== MessageRole.User || msg.content)
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    let docType = "Proje Raporu";
    let structureInstruction = "";

    // Determine Document Type and Specific Headers based on Tool
    if (activeTool === 'prd' || activeTool === 'project-arch') {
      docType = "Ürün Gereksinim Dökümanı (PRD)";
      structureInstruction = `
         - <h2>1. Proje Amacı ve Vizyon</h2> (Neden bu ürünü yapıyoruz?)
         - <h2>2. Kapsam (Scope)</h2> (Dahil olanlar ve olmayanlar)
         - <h2>3. Hedef Kitle ve Personalar</h2>
         - <h2>4. Temel Özellikler ve Fonksiyonel Gereksinimler</h2> (Madde madde)
         - <h2>5. Kullanıcı Akışları (User Flows)</h2> (Kullanıcının sistemi kullanım adımları, Happy Path ve Edge Cases)
         - <h2>6. Kullanıcı Hikayeleri (User Stories)</h2>
         - <h2>7. Teknik Gereksinimler ve Mimari</h2>
         - <h2>8. Kabul Kriterleri (Acceptance Criteria)</h2>
      `;
    } else if (activeTool === 'competitor') {
      docType = "Rakip Analizi Raporu";
      structureInstruction = `
         - <h2>1. Pazar Genel Bakış</h2>
         - <h2>2. Rakip Karşılaştırma Matrisi</h2> (Tablo kullan)
         - <h2>3. Rakip Detayları ve Temel Özellikler</h2>
         - <h2>4. Fiyatlandırma Modelleri</h2>
         - <h2>5. Avantajlar ve Dezavantajlar</h2>
         - <h2>6. Stratejik Öneriler</h2>
      `;
    } else {
      // Default / General
      structureInstruction = `
         - <h2>1. Yönetici Özeti</h2>
         - <h2>2. Proje/Konu Detayları</h2>
         - <h2>3. Analiz Bulguları</h2>
         - <h2>4. Sonuç ve Öneriler</h2>
      `;
    }

    const prompt = `
      Aşağıdaki konuşma geçmişini detaylıca analiz et ve profesyonel bir **${docType}** oluştur.
      
      KRİTİK TALİMATLAR:
      1. **DİL:** Çıktı tamamen **TÜRKÇE** olmalıdır.
      2. **FORMAT:** Çıktıyı sadece temiz HTML kodu olarak, bir <div> etiketi içinde ver. **Asla Markdown sembolleri (**, ##, -) kullanma.**
      3. **YAPI:** Aşağıdaki başlık yapısını kesinlikle kullan:
         - <h1>[Proje/Konu Adı] - ${docType}</h1>
         ${structureInstruction}
         
      4. **STİL:** 
         - Paragraflar için <p> kullan.
         - Listeler için <ul> ve <li> kullan.
         - Tablolar için <table>, <tr>, <th>, <td> kullan. 
         - **ÖNEMLİ:** Tablolara veya hücrelere ASLA satır içi (inline) arka plan rengi (background-color) veya yazı rengi (color) verme. Sadece 'width="100%"' kullan. Tasarım CSS ile halledilecek.
         - **Kullanıcı Akışları** bölümünde, süreci adım adım (1., 2., 3. ...) detaylı bir liste olarak yaz.
      
      5. **İÇERİK:** 
         - Konuşmadaki dağınık bilgileri birleştir, eksik yerleri profesyonel varsayımlarla doldur.
         
      6. **KOD BLOKLARI:** Çıktıyı \`\`\`html blokları içine alma. Sadece raw string döndür.
      
      Konuşma Geçmişi:
      ${conversationContext}
    `;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const result = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    let text = result.text || "<p>Doküman oluşturulamadı.</p>";
    
    // Clean up if the model accidentally wrapped it in code blocks
    text = text.replace(/```html/g, '').replace(/```/g, '').trim();

    return text;

  } catch (error) {
    console.error("Doc Gen Error:", error);
    return "<h1>Hata</h1><p>Doküman oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.</p>";
  }
};