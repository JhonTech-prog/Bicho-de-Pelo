
import React, { useState } from 'react';
import { Coupon, CompanyInfo } from '../types';

interface CouponPreviewProps {
  coupon: Coupon;
  company: CompanyInfo;
  onClose: () => void;
}

export const CouponPreview: React.FC<CouponPreviewProps> = ({ coupon, company, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('coupon-to-export');
    if (!element) return;

    setIsGenerating(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const html2canvas = (window as any).html2canvas;

      const canvas = await html2canvas(element, {
        scale: 3, // Qualidade ainda maior para PDF
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      doc.save(`cupom_${coupon.number}_bicho_de_pelo.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar o PDF. Verifique se o navegador permite o download.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">NFC-e Emitida</h3>
            <p className="text-[10px] font-bold text-emerald-600">BICHO DE PELO - CAMPINA GRANDE - PB</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Área do Cupom */}
        <div className="flex-1 overflow-auto p-10 bg-slate-100 flex justify-center">
          <div 
            id="coupon-to-export" 
            className="bg-white p-8 shadow-sm font-mono text-[10px] leading-tight text-black w-full max-w-[300px]"
            style={{ color: 'black', background: 'white' }}
          >
            {/* Header Empresa */}
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-[11px] font-black uppercase tracking-tight">BICHO DE PELO</h2>
              <p className="font-bold">CNPJ: 26.614.661/0001-09</p>
              <p className="text-[7.5px] uppercase font-bold leading-tight">Vigário Calixto, 1218, Catolé, Campina Grande - PB</p>
            </div>

            <div className="text-center py-2.5 border-y border-dashed border-black mb-6 uppercase">
              <p className="font-bold text-[10px]">DANFE NFC-e</p>
              <p className="text-[6.5px] font-bold opacity-80 leading-none">Documento Auxiliar de Nota Fiscal de Consumidor Eletrônica</p>
            </div>

            {/* Itens do Cupom Detalhados */}
            <table className="w-full mb-6 text-black border-collapse">
              <thead>
                <tr className="border-b border-black text-left font-black text-[8px] uppercase">
                  <th className="pb-1">Cód | Descrição</th>
                  <th className="pb-1 text-center">Qtd</th>
                  <th className="pb-1 text-right">Unit</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-black/20">
                {coupon.items.map((item, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="py-2.5 pr-1 font-bold uppercase leading-[1.1]">
                      {idx + 1} | {item.product.name}
                    </td>
                    <td className="py-2.5 text-center font-black">{item.quantity}</td>
                    <td className="py-2.5 text-right font-medium">{item.product.price.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-black">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Resumo de Pagamento e Dinheiro */}
            <div className="space-y-1.5 border-t border-black pt-4 mb-8">
              <div className="flex justify-between font-black text-xs uppercase mb-2">
                <span>Qtde. Total de Itens:</span>
                <span>{coupon.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between font-black text-xs uppercase">
                <span>VALOR TOTAL R$</span>
                <span>{coupon.total.toFixed(2)}</span>
              </div>
              
              <div className="pt-3 space-y-1 border-t border-dashed border-black/30">
                <div className="flex justify-between font-bold uppercase text-[8px]">
                  <span>FORMA DE PAGAMENTO</span>
                  <span>VALOR PAGO R$</span>
                </div>
                <div className="flex justify-between font-black uppercase text-[10px]">
                  <span>{coupon.paymentMethod}</span>
                  <span>{coupon.amountReceived.toFixed(2)}</span>
                </div>
                {coupon.change > 0 && (
                  <div className="flex justify-between font-bold uppercase text-[9px] pt-1 text-black/70">
                    <span>TROCO R$</span>
                    <span>{coupon.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé Fiscal */}
            <div className="text-[8px] space-y-5 text-center">
              <div className="bg-black/5 p-3 border border-black/10 font-bold leading-tight uppercase">
                <p>Consulte pela Chave de Acesso em:</p>
                <p className="break-all mt-1 font-black">www.sefaz.pb.gov.br/nfce/consulta</p>
              </div>
              
              <div>
                <p className="font-black uppercase tracking-widest text-[7px] mb-1 opacity-60">Chave de Acesso</p>
                <p className="font-bold tracking-tight text-[8px]">
                   {coupon.chNFe?.match(/.{1,4}/g)?.join(' ')}
                </p>
              </div>

              <div className="pt-2 border-t border-dashed border-black leading-snug font-bold uppercase opacity-80">
                <p>NFC-e nº {coupon.number} Série {coupon.serie}</p>
                <p>Emissão: {new Date(coupon.date).toLocaleString('pt-BR')}</p>
                <p>Protocolo: {coupon.protocol}</p>
              </div>

              {coupon.qrCode && (
                <div className="flex flex-col items-center gap-2 pt-6 border-t border-dashed border-black">
                  <img src={coupon.qrCode} alt="QR Code" className="w-36 h-36" />
                  <p className="uppercase font-black tracking-widest text-[6px] opacity-60">Consulta via QR Code</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botões do Modal */}
        <div className="p-8 bg-white border-t border-slate-100 flex gap-4 no-print">
          <button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
          >
            {isGenerating ? 'Processando...' : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Baixar PDF do Cupom
              </>
            )}
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
          >
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};
