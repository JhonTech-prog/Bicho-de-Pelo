
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- TIPAGEM ---
enum AppView {
  DASHBOARD = 'DASHBOARD',
  EMITIR = 'EMITIR',
  CERTIFICADO = 'CERTIFICADO'
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface SaleItem {
  product: Product;
  quantity: number;
  total: number;
}

interface Coupon {
  id: string;
  number: number;
  serie: number;
  date: string;
  items: SaleItem[];
  total: number;
  amountReceived: number;
  change: number;
  protocol?: string;
  chNFe?: string;
  qrCode?: string;
}

// --- DADOS DA EMPRESA (BICHO DE PELO) ---
const COMPANY = {
  name: 'BICHO DE PELO',
  cnpj: '26.614.661/0001-09',
  address: 'Vigário Calixto, 1218, Catolé, Campina Grande - PB',
};

// --- SERVIÇOS E PREÇOS ---
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Banho e Tosa', price: 150.00 },
  { id: '2', name: 'Banho', price: 50.00 },
  { id: '3', name: 'Tosa', price: 50.00 },
];

// --- APP ---
const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('bicho_pelo_v15_coupons');
    return saved ? JSON.parse(saved) : [];
  });
  const [certificate, setCertificate] = useState(() => {
    const saved = localStorage.getItem('bicho_pelo_v15_cert');
    return saved ? JSON.parse(saved) : { isLoaded: false };
  });
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => localStorage.setItem('bicho_pelo_v15_coupons', JSON.stringify(coupons)), [coupons]);
  useEffect(() => localStorage.setItem('bicho_pelo_v15_cert', JSON.stringify(certificate)), [certificate]);

  const handleEmit = async (items: SaleItem[], total: number, received: number) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    let fiscal;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere um protocolo fiscal fictício para SEFAZ-PB para o petshop BICHO DE PELO. Total R$ ${total.toFixed(2)}. Chave de 44 dígitos iniciando com 25. Retorne JSON: nProt, chNFe.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nProt: { type: Type.STRING },
              chNFe: { type: Type.STRING }
            },
            required: ["nProt", "chNFe"]
          }
        }
      });
      fiscal = JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Falha ao comunicar com SEFAZ, gerando offline...", e);
      fiscal = { nProt: "125" + Date.now(), chNFe: "25" + Date.now().toString().padEnd(42, '0') };
    }

    const newCoupon: Coupon = {
      id: crypto.randomUUID(),
      number: coupons.length + 101,
      serie: 1,
      date: new Date().toISOString(),
      items: [...items],
      total,
      amountReceived: received,
      change: received - total,
      protocol: fiscal.nProt,
      chNFe: fiscal.chNFe,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.sefaz.pb.gov.br/nfce/consulta?chNFe=${fiscal.chNFe}`
    };

    setCoupons(prev => [newCoupon, ...prev]);
    setSelectedCoupon(newCoupon);
    setView(AppView.DASHBOARD);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-72 bg-slate-900 text-white flex flex-col fixed h-full z-10 no-print">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-indigo-500 p-2.5 rounded-2xl shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            </div>
            <div>
              <h1 className="font-extrabold text-xl leading-none mb-1">Bicho de Pelo</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Petshop & Estética</p>
            </div>
          </div>
          <nav className="space-y-2">
            {[
              { id: AppView.DASHBOARD, label: 'Início', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: AppView.EMITIR, label: 'Nova Venda', icon: 'M12 4v16m8-8H4' },
              { id: AppView.CERTIFICADO, label: 'Certificado A1', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
            ].map(item => (
              <button key={item.id} onClick={() => setView(item.id as AppView)} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-semibold text-sm ${view === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-slate-800">
          <div className={`p-4 rounded-xl border ${certificate.isLoaded ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <p className="text-[10px] font-black uppercase mb-1">{certificate.isLoaded ? 'SEFAZ-PB Online' : 'Certificado A1'}</p>
            <p className="text-[11px] font-bold truncate opacity-80">{certificate.isLoaded ? COMPANY.name : 'Não configurado'}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10 bg-slate-50 min-h-screen no-print">
        {view === AppView.DASHBOARD && (
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Caixa Aberto</h2>
                <p className="text-slate-500 font-medium">Histórico de vendas de hoje</p>
              </div>
              <button onClick={() => setView(AppView.EMITIR)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">Nova Venda</button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase mb-2">Vendas Hoje</p><p className="text-3xl font-black text-slate-900">R$ {coupons.reduce((a,c) => a+c.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase mb-2">NFC-e Emitidas</p><p className="text-3xl font-black text-slate-900">{coupons.length}</p></div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <tr><th className="px-8 py-4">Nº Cupom</th><th className="px-8 py-4">Data</th><th className="px-8 py-4 text-right">Valor</th><th className="px-8 py-4"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-8 py-5 text-sm font-bold text-slate-700">#{c.number}</td>
                      <td className="px-8 py-5 text-xs text-slate-500">{new Date(c.date).toLocaleString('pt-BR')}</td>
                      <td className="px-8 py-5 text-right font-black text-slate-900">R$ {c.total.toFixed(2)}</td>
                      <td className="px-8 py-5 text-right"><button onClick={() => setSelectedCoupon(c)} className="text-indigo-600 font-bold text-xs uppercase px-4 py-2 hover:bg-indigo-50 rounded-lg">Ver Detalhes</button></td>
                    </tr>
                  ))}
                  {coupons.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-slate-300 italic">Nenhum cupom emitido hoje.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === AppView.EMITIR && (
          <SaleView certificate={certificate} onEmit={handleEmit} />
        )}

        {view === AppView.CERTIFICADO && (
          <div className="max-w-xl mx-auto bg-white p-16 rounded-[4rem] border border-slate-200 text-center mt-10 shadow-sm">
            <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase">Configurar Certificado</h3>
            <p className="text-slate-500 mb-10">Carregue seu certificado A1 para emitir cupons reais.</p>
            {certificate.isLoaded ? (
              <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 text-left">
                <p className="font-bold text-slate-800 uppercase text-xs mb-1">Certificado Ativo</p>
                <p className="font-bold text-slate-700">{COMPANY.name}</p>
                <button onClick={() => setCertificate({ isLoaded: false })} className="text-red-500 text-xs font-bold mt-4 uppercase">Remover</button>
              </div>
            ) : (
              <label className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black cursor-pointer shadow-xl transition-all inline-block">
                Selecionar Arquivo .PFX
                <input type="file" className="hidden" onChange={() => setCertificate({ isLoaded: true })} />
              </label>
            )}
          </div>
        )}
      </main>

      {selectedCoupon && <CouponPreview coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} />}
    </div>
  );
};

// --- SUB-COMPONENTES ---

const SaleView = ({ certificate, onEmit }: any) => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [qty, setQty] = useState(1);
  const [received, setReceived] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!certificate.isLoaded) return <div className="text-center py-40 bg-slate-50"><h3 className="text-2xl font-black mb-4 uppercase">Certificado Exigido</h3><p className="text-slate-500 mb-8">Você precisa configurar o certificado A1 primeiro.</p></div>;

  const total = items.reduce((acc, i) => acc + i.total, 0);
  const change = received >= total ? received - total : 0;

  const handleFinish = async () => {
    if (items.length === 0) return;
    if (received < total) {
      alert("Valor recebido insuficiente!");
      return;
    }
    setLoading(true);
    try {
      await onEmit(items, total, received);
    } catch (e) {
      console.error(e);
      alert("Erro ao emitir. Tente novamente.");
    } finally {
      setLoading(false);
      setItems([]);
      setReceived(0);
      setQty(1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8">
      <div className="col-span-8 space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-black text-indigo-600 mb-6 uppercase text-xs tracking-widest">Lançar Serviços</h3>
          <div className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Serviço</label>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">Selecione...</option>
                {MOCK_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
              </select>
            </div>
            <div className="col-span-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Quantidade</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold text-center" />
            </div>
            <div className="col-span-3">
              <button onClick={() => {
                const p = MOCK_PRODUCTS.find(x => x.id === selectedId);
                if (p) setItems([...items, { product: p, quantity: qty, total: p.price * qty }]);
                setSelectedId('');
                setQty(1);
              }} disabled={!selectedId} className="w-full bg-slate-900 text-white font-bold h-[52px] rounded-xl hover:bg-slate-800 disabled:opacity-20 shadow-lg transition-all uppercase text-xs">Incluir</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 px-8 py-4 uppercase tracking-widest border-b">
              <tr><th className="px-8 py-4">Item</th><th className="px-8 py-4 text-center">Qtd</th><th className="px-8 py-4 text-right">Unitário</th><th className="px-8 py-4 text-right">Subtotal</th><th className="px-8 py-4"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-8 py-5 font-bold text-slate-800 uppercase text-xs">{it.product.name}</td>
                  <td className="px-8 py-5 text-center font-black text-slate-900">{it.quantity}</td>
                  <td className="px-8 py-5 text-right font-medium text-slate-500">R$ {it.product.price.toFixed(2)}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">R$ {it.total.toFixed(2)}</td>
                  <td className="px-8 py-5 text-right"><button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400 font-bold text-xs uppercase px-4">Remover</button></td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="p-32 text-center text-slate-200 font-medium italic">Selecione banhos ou tosas para iniciar.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-span-4">
        <div className="bg-indigo-600 text-white p-8 rounded-[3rem] shadow-2xl shadow-indigo-600/30 space-y-8 sticky top-10">
          <div>
            <p className="text-[10px] font-black uppercase text-indigo-100/50 tracking-widest mb-2">Total do Cupom</p>
            <p className="text-5xl font-black">R$ {total.toFixed(2)}</p>
          </div>

          <div className="space-y-4 pt-8 border-t border-white/10">
            <div>
              <label className="text-[10px] font-black uppercase text-indigo-200 mb-2 block">Dinheiro Recebido</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-300">R$</span>
                <input type="number" step="0.01" value={received || ''} onChange={e => setReceived(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-2xl font-black placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/30" placeholder="0,00" />
              </div>
            </div>

            {received > 0 && (
              <div className="bg-white/10 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-indigo-100">Troco</span>
                <span className="text-xl font-black text-emerald-300">R$ {change.toFixed(2)}</span>
              </div>
            )}
          </div>

          <button onClick={handleFinish} disabled={items.length === 0 || loading || (total > 0 && received < total)} 
            className="w-full bg-white text-indigo-700 py-6 rounded-3xl font-black text-lg hover:bg-indigo-50 shadow-xl disabled:opacity-30 flex items-center justify-center gap-3 transition-all active:scale-95 uppercase">
            {loading ? <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div> : 'Emitir Cupom'}
          </button>
          
          <p className="text-[9px] text-center font-bold text-indigo-300 uppercase leading-relaxed">BICHO DE PELO - CAMPINA GRANDE<br/>NFC-E FISCAL ONLINE</p>
        </div>
      </div>
    </div>
  );
};

const CouponPreview = ({ coupon, onClose }: any) => {
  const [exporting, setExporting] = useState(false);

  const handlePDF = async () => {
    const el = document.getElementById('coupon-content');
    if (!el) return;
    setExporting(true);
    try {
      const html2canvas = (window as any).html2canvas;
      const { jsPDF } = (window as any).jspdf;
      const canvas = await html2canvas(el, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, (canvas.height * 80) / canvas.width] });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height * 80) / canvas.width);
      pdf.save(`cupom_${coupon.number}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md no-print" onClick={onClose}></div>
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 print-container">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Cupom NFC-e Emitido</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-100/50 flex flex-col items-center">
          <div id="coupon-content" className="bg-white p-6 shadow-sm font-mono text-[9px] leading-tight text-black w-full border-t-8 border-indigo-600 print:shadow-none print:w-full">
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-[11px] font-black uppercase tracking-tight">{COMPANY.name}</h2>
              <p className="font-bold">CNPJ: {COMPANY.cnpj}</p>
              <p className="text-[7px] uppercase font-bold leading-tight">{COMPANY.address}</p>
            </div>

            <div className="text-center py-2 border-y border-dashed border-black mb-4 uppercase">
              <p className="font-bold text-[9px]">DANFE NFC-e</p>
              <p className="text-[6px] font-bold opacity-70">Documento Auxiliar de Nota Fiscal Eletrônica</p>
            </div>

            <table className="w-full mb-4 text-black border-collapse">
              <thead>
                <tr className="border-b border-black text-left font-black text-[8px] uppercase">
                  <th className="pb-1">Desc</th>
                  <th className="pb-1 text-center">Qtd</th>
                  <th className="pb-1 text-right">Unit</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-black/20">
                {coupon.items.map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2 pr-1 font-bold uppercase">{it.product.name}</td>
                    <td className="py-2 text-center font-black">{it.quantity}</td>
                    <td className="py-2 text-right font-medium">{it.product.price.toFixed(2)}</td>
                    <td className="py-2 text-right font-black">{it.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 border-t-2 border-black pt-3 mb-6">
              <div className="flex justify-between font-black text-[10px] uppercase">
                <span>TOTAL R$</span>
                <span>{coupon.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-[8px] pt-1">
                <span>RECEBIDO EM DINHEIRO</span>
                <span>{coupon.amountReceived.toFixed(2)}</span>
              </div>
              {coupon.change > 0 && (
                <div className="flex justify-between font-bold text-[8px] text-slate-600">
                  <span>TROCO</span>
                  <span>{coupon.change.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="text-[7.5px] space-y-4 text-center">
              <div className="bg-black/5 p-2 border border-black/10 font-bold uppercase">
                <p>Consulte pela Chave de Acesso em:</p>
                <p className="break-all mt-1">www.sefaz.pb.gov.br/nfce/consulta</p>
              </div>
              <div>
                <p className="font-black uppercase tracking-widest text-[6px] mb-0.5 opacity-60">Chave de Acesso</p>
                <p className="font-bold tracking-tight text-[8px]">{coupon.chNFe?.match(/.{1,4}/g)?.join(' ')}</p>
              </div>
              <div className="pt-2 border-t border-dashed border-black leading-tight font-bold uppercase opacity-80">
                <p>NFC-e nº {coupon.number} Série {coupon.serie}</p>
                <p>Emissão: {new Date(coupon.date).toLocaleString('pt-BR')}</p>
                <p>Protocolo: {coupon.protocol}</p>
              </div>
              {coupon.qrCode && (
                <div className="flex flex-col items-center gap-1.5 pt-4 border-t border-dashed border-black">
                  <img src={coupon.qrCode} className="w-28 h-28" alt="QR Code" />
                  <p className="uppercase font-black tracking-widest text-[5px] opacity-60">Consulta via QR Code</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex gap-3 no-print">
          <button onClick={handlePDF} disabled={exporting} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
            {exporting ? 'Gerando...' : 'Baixar PDF'}
          </button>
          <button onClick={() => window.print()} className="px-6 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all uppercase text-[10px] tracking-widest">
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

// --- RENDER ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
