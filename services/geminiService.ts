
import { GoogleGenAI, Type } from "@google/genai";

export const geminiService = {
  async simulateSefazResponse(saleData: any) {
    // FIX: Always use process.env.API_KEY directly when initializing.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `Simule uma resposta de autorização da SEFAZ-PB (Paraíba) para uma NFC-e com os seguintes dados: ${JSON.stringify(saleData)}. Retorne um JSON com: nProt (número do protocolo), cStat (100 para sucesso), xMotivo (Autorizado o uso da NF-e), chNFe (chave de acesso simulada de 44 dígitos).`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // Adding a schema for more robust JSON parsing
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nProt: { type: Type.STRING },
              cStat: { type: Type.INTEGER },
              xMotivo: { type: Type.STRING },
              chNFe: { type: Type.STRING }
            },
            required: ["nProt", "cStat", "xMotivo", "chNFe"]
          }
        }
      });
      
      // FIX: Access response.text directly (it's a property).
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Gemini Error:", error);
      return { 
        cStat: 100, 
        xMotivo: "Autorizado o uso da NF-e (Simulado Offline)", 
        nProt: "123456789012345", 
        chNFe: "25" + Date.now().toString().padEnd(42, '0') 
      };
    }
  }
};
