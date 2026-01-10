
import React, { useState } from 'react';
import { Product, SaleItem, Coupon } from '../types';
import { geminiService } from '../services/geminiService';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Banho e Tosa', price: 150.00, ncm: '96032100', unit: 'UN' },
  { id: '2', name: 'Banho', price: 50.00, ncm: '96032100', unit: 'UN' },
  { id: '3', name: 'Tosa', price: 50.00, ncm: '96032100', unit: 'UN' },
  { id: '4', name: 'Ração Golden 15kg', price: 189.90, ncm: '23091000', unit: 'UN' },
  { id: '5', name: 'Hidratação', price: 30.00, ncm: '96032100', unit: 'UN' },
];

interface SaleFormProps {
  onSuccess: (coupon: Coupon) => void;
}

export const SaleForm: React.FC<SaleFormProps> = ({ onSuccess }) => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [isEmitting, setIsEmitting] = useState(false);

  const addItem = () => {
    const product = MOCK_PRODUCTS.find(p => p.id === selectedProductId);
    if (!product) return;

    const newItem: SaleItem = {
      product,
      quantity,
      total: product.price * quantity
    };

    setItems([...items, newItem]);
    setSelectedProductId('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((acc, item) => acc + item.total, 0);
  const change = amountReceived > total ? amountReceived - total : 0;

  const handleEmit = async () => {
    if (items.length === 0) return;
    if (amountReceived < total && total > 0) {
      alert("O valor recebido deve ser igual ou maior que o total.");
      return;
    }
    
    setIsEmitting(true);
    
    const sefazResponse = await geminiService.simulateSefazResponse({
      items,
      total,
      cnpj: '26.614.661/0001-09',
      state: 'PB'
    });

    const newCoupon: Coupon = {
      id: Math.random().toString(36).substr(2, 9),
      number: Math.floor(Math.random() * 1000) + 500,
      serie: 1,
      date: new Date().toISOString(),
      items: [...items],
      total: total,
      amountReceived: amountReceived,
      change: change,
      paymentMethod: 'Dinheiro',
      status: sefazResponse.cStat === 100 ? 'AUTORIZADA' : 'ERRO',
      protocol: sefazResponse.nProt,
      chNFe: sefazResponse.chNFe,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.sefaz.pb.gov.br/nfce/consulta?chNFe=${sefazResponse.chNFe}`
    };

    setTimeout(() => {
      onSuccess(newCoupon);
      setIsEmitting(false);
      setItems([]);
      setAmountReceived(0);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Novo Pedido - Bicho de Pelo</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serviço / Produto</label>
              <select 
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Selecione...</option>
                {MOCK_PRODUCTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qtd</label>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button 
                onClick={addItem}
                disabled={!selectedProductId}
                className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
              >
                Adicionar ao Cupom
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-3">Descrição do Serviço</th>
                <th className="px-6 py-3 text-center">Qtd</th>
                <th className="px-6 py-3 text-right">Unitário</th>
                <th className="px-6 py-3 text-right">Subtotal</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length > 0 ? items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800 uppercase">{item.product.name}</p>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-black text-slate-600">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-xs font-medium text-slate-400">R$ {item.product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-slate-900">R$ {item.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => removeItem(idx)} className="text-red-300 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75V4H5a2 2 0 0 0-2 2v.033l.012 5.253a4 4 0 0 0 4 3.996h5.976a4 4 0 0 0 4-3.996L17 6.033V6a2 2 0 0 0-2-2h-1v-.25A2.75 2.75 0 0 0 11.25 1h-2.5ZM7.5 3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25V4h-5v-.25ZM8.5 7.75a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0v-4.5Zm4.5-.75a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75Z" clipRule="evenodd" /></svg>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-24 text-center text-slate-300 italic font-medium">Lance os banhos ou tosas acima.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-200/60 mb-8 text-center">Finalizar Venda</h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-baseline border-b border-indigo-400/30 pb-4">
              <span className="text-xs font-bold uppercase opacity-70">Total do Cupom</span>
              <span className="text-3xl font-black">R$ {total.toFixed(2)}</span>
            </div>

            <div className="pt-4">
              <label className="block text-[10px] font-black uppercase text-indigo-200 mb-2">Valor Recebido (Dinheiro)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-indigo-300">R$</span>
                <input 
                  type="number" 
                  value={amountReceived || ''}
                  onChange={(e) => setAmountReceived(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-full bg-indigo-700/50 border border-indigo-400/30 rounded-2xl pl-10 pr-4 py-4 text-xl font-black focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-indigo-400"
                />
              </div>
            </div>

            {amountReceived > total && (
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl animate-pulse">
                <span className="text-xs font-bold uppercase">Troco</span>
                <span className="text-xl font-black text-emerald-300">R$ {change.toFixed(2)}</span>
              </div>
            )}
          </div>

          <button 
            onClick={handleEmit}
            disabled={items.length === 0 || isEmitting || (total > 0 && amountReceived < total)}
            className="w-full py-5 rounded-[1.5rem] font-black text-lg bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {isEmitting ? (
              <>
                <div className="w-5 h-5 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                EMITINDO...
              </>
            ) : 'FECHAR E GERAR PDF'}
          </button>
          
          <p className="mt-6 text-[10px] text-center font-bold text-indigo-300 uppercase leading-relaxed">
            Certificado A1 Ativo: Bicho de Pelo <br/> SEFAZ-PB Autorizada
          </p>
        </div>
      </div>
    </div>
  );
};
