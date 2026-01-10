
import React, { useState } from 'react';
import { Product, SaleItem, Coupon } from '../types';
import { geminiService } from '../services/geminiService';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Ração Golden Adulto 15kg', price: 189.90, ncm: '23091000', unit: 'UN' },
  { id: '2', name: 'Banho e Tosa Porte Médio', price: 75.00, ncm: '96032100', unit: 'UN' },
  { id: '3', name: 'Coleira Antipulgas Seresto', price: 245.00, ncm: '38089119', unit: 'UN' },
  { id: '4', name: 'Sachê Whiskas Carne 85g', price: 3.50, ncm: '23091000', unit: 'UN' },
  { id: '5', name: 'Brinquedo Frango Sonoro', price: 22.90, ncm: '95030099', unit: 'UN' },
];

interface SaleFormProps {
  onSuccess: (coupon: Coupon) => void;
}

export const SaleForm: React.FC<SaleFormProps> = ({ onSuccess }) => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
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

  const handleEmit = async () => {
    if (items.length === 0) return;
    
    setIsEmitting(true);
    
    // Simulate SEFAZ communication using Gemini
    const sefazResponse = await geminiService.simulateSefazResponse({
      items,
      total,
      cnpj: '12.345.678/0001-90',
      state: 'PB'
    });

    const newCoupon: Coupon = {
      id: Math.random().toString(36).substr(2, 9),
      number: Math.floor(Math.random() * 10000),
      serie: 1,
      date: new Date().toISOString(),
      items: [...items],
      total: total,
      status: sefazResponse.cStat === 100 ? 'AUTORIZADA' : 'ERRO',
      protocol: sefazResponse.nProt,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CHAVE${sefazResponse.chNFe}`
    };

    setTimeout(() => {
      onSuccess(newCoupon);
      setIsEmitting(false);
      setItems([]);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Adicionar Itens</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Produto / Serviço</label>
              <select 
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
              >
                <option value="">Selecione um produto...</option>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={addItem}
                disabled={!selectedProductId}
                className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Incluir
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3 text-center">Qtd</th>
                <th className="px-6 py-3 text-right">Unitário</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length > 0 ? items.map((item, idx) => (
                <tr key={idx} className="group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{item.product.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">NCM: {item.product.ncm}</p>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-sm text-slate-600">R$ {item.product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">R$ {item.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => removeItem(idx)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75V4H5a2 2 0 0 0-2 2v.033l.012 5.253a4 4 0 0 0 4 3.996h5.976a4 4 0 0 0 4-3.996L17 6.033V6a2 2 0 0 0-2-2h-1v-.25A2.75 2.75 0 0 0 11.25 1h-2.5ZM7.5 3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25V4h-5v-.25ZM8.5 7.75a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0v-4.5Zm4.5-.75a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-slate-200">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                      Carrinho vazio. Selecione os produtos acima.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200">
          <h3 className="text-lg font-bold mb-4">Resumo da Venda</h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Descontos</span>
              <span>R$ 0,00</span>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
              <span className="font-bold text-lg">Total</span>
              <span className="text-2xl font-black text-sky-400">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
             <button 
              onClick={handleEmit}
              disabled={items.length === 0 || isEmitting}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                isEmitting ? 'bg-slate-700 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-400 active:scale-95'
              }`}
             >
               {isEmitting ? (
                 <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Emitindo...
                 </>
               ) : (
                 <>Emitir Cupom (NFC-e)</>
               )}
             </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                </svg>
             </div>
             <h4 className="font-bold text-slate-800 text-sm">Info Fiscal</h4>
           </div>
           <p className="text-xs text-slate-500 leading-relaxed">
             A NFC-e será emitida para a UF **Paraíba**. Certifique-se de que o certificado A1 esteja válido.
           </p>
        </div>
      </div>
    </div>
  );
};
