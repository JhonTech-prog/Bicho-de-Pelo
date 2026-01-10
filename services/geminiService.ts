
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async simulateSefazResponse(saleData: any) {
    try {
      const prompt = `Simule uma resposta de autorização da SEFAZ-PB (Paraíba) para uma NFC-e com os seguintes dados: ${JSON.stringify(saleData)}. Retorne um JSON com: nProt (número do protocolo), cStat (100 para sucesso), xMotivo (Autorizado o uso da NF-e), chNFe (chave de acesso simulada de 44 dígitos).`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      
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
