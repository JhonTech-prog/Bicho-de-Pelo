
import React from 'react';
import { Coupon, CompanyInfo } from '../types';

interface CouponPreviewProps {
  coupon: Coupon;
  company: CompanyInfo;
  onClose: () => void;
}

export const CouponPreview: React.FC<CouponPreviewProps> = ({ coupon, company, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
          <h3 className="font-bold text-slate-800">Visualizar Cupom</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8 bg-slate-50">
          <div className="bg-white p-6 shadow-sm font-mono text-[10px] leading-tight text-black max-w-[300px] mx-auto print:shadow-none print:m-0 print:max-w-none">
            {/* Header */}
            <div className="text-center space-y-1 mb-4">
              <h2 className="text-sm font-black uppercase">{company.name}</h2>
              <p>{company.cnpj}</p>
              <p>{company.address}</p>
            </div>

            <div className="text-center py-2 border-y border-dashed border-black mb-4">
              <p className="font-bold">DANFE NFC-e - Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</p>
            </div>

            {/* Items */}
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center">Qtd</th>
                  <th className="text-right">Vl. Tot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-300">
                {coupon.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-2">
                      <span className="font-bold">{String(idx + 1).padStart(3, '0')}</span> {item.product.name}
                    </td>
                    <td className="text-center">{item.quantity} {item.product.unit}</td>
                    <td className="text-right">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="space-y-1 border-t border-black pt-2 mb-4">
              <div className="flex justify-between font-bold text-xs">
                <span>TOTAL R$</span>
                <span>{coupon.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>FORMA PAGTO.</span>
                <span>Vl. Pago R$</span>
              </div>
              <div className="flex justify-between">
                <span>Dinheiro</span>
                <span>{coupon.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center space-y-2 mb-4">
              <p className="font-bold">Consulte pela Chave de Acesso em:</p>
              <p className="text-[9px] break-all">https://www.sefaz.pb.gov.br/nfe/consulta</p>
              <p className="font-bold mt-2">NÚMERO: {coupon.number} SÉRIE: {coupon.serie}</p>
              <p>EMISSÃO: {new Date(coupon.date).toLocaleString('pt-BR')}</p>
              <p>PROTOCOLO DE AUTORIZAÇÃO: {coupon.protocol}</p>
            </div>

            {/* QR Code */}
            {coupon.qrCode && (
              <div className="flex flex-col items-center gap-2 py-4">
                <img src={coupon.qrCode} alt="QR Code" className="w-32 h-32" />
                <p className="text-[8px]">Consulta via leitor de QR Code</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex gap-4 sticky bottom-0">
          <button 
            onClick={() => window.print()}
            className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.89 2.4 9.323a2.123 2.123 0 0 1 0-2.937l4.319-4.566m10.521 16.33-4.319 4.566a2.123 2.123 0 0 1-2.937 0l-4.319-4.566m10.521-16.33 4.319 4.566a2.123 2.123 0 0 1 0 2.937l-4.319 4.566m-10.521 0h10.521" />
            </svg>
            Imprimir Cupom
          </button>
        </div>
      </div>
    </div>
  );
};
