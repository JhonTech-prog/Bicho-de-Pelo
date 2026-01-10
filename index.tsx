
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- TIPAGEM ---
enum AppView {
  DASHBOARD = 'DASHBOARD',
  EMITIR = 'EMITIR',
  CERTIFICADO = 'CERTIFICADO',
  HISTORICO = 'HISTORICO'
}

interface Product {
  id: string;
  name: string;
  price: number;
  ncm: string;
  unit: string;
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
  status: 'AUTORIZADA' | 'ERRO';
  protocol?: string;
  chNFe?: string;
  qrCode?: string;
}

interface CertificateData {
  fileName: string;
  expiryDate: string;
  subject: string;
  isLoaded: boolean;
}

// --- CONFIGURAÇÃO DA EMPRESA ATUALIZADA ---
const COMPANY = {
  name: 'BICHO DE PELO',
  cnpj: '26.614.661/0001-09',
  ie: 'ISENTO',
  address: 'Vigário Calixto, 1218, Catolé, Campina Grande - PB',
};

// --- SERVIÇOS E PREÇOS CORRIGIDOS ---
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Banho e Tosa', price: 150.00, ncm: '96032100', unit: 'UN' },
  { id: '2', name: 'Banho', price: 50.00, ncm: '96032100', unit: 'UN' },
];

// --- APP PRINCIPAL ---
const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('bicho_pelo_v8_coupons');
    return saved ? JSON.parse(saved) : [];
  });
  const [certificate, setCertificate] = useState<CertificateData>(() => {
    const saved = localStorage.getItem('bicho_pelo_v8_cert');
    return saved ? JSON.parse(saved) : { fileName: '', expiryDate: '', subject: '', isLoaded: false };
  });
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => localStorage.setItem('bicho_pelo_v8_coupons', JSON.stringify(coupons)), [coupons]);
  useEffect(() => localStorage.setItem('bicho_pelo_v8_cert', JSON.stringify(certificate)), [certificate]);

  const handleEmit = async (items: SaleItem[], total: number) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    let fiscal;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Simule um protocolo fiscal da SEFAZ-PB (Paraíba) para o petshop BICHO DE PELO. Valor total R$ ${total.toFixed(2)}. Gere uma chave de acesso de 44 dígitos começando com 25. Retorne JSON: nProt, chNFe, cStat.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nProt: { type: Type.STRING, description: 'Número do protocolo' },
              chNFe: { type: Type.STRING, description: 'Chave de acesso de 44 dígitos' },
              cStat: { type: Type.NUMBER, description: 'Código de status' }
            },
            required: ["nProt", "chNFe", "cStat"]
          }
        }
      });
      fiscal = JSON.parse(response.text || '{}');
    } catch (e) {
      fiscal = { 
        nProt: "125" + Date.now().toString().slice(-12), 
        chNFe: "25" + Date.now().toString().padEnd(42, '0'), 
        cStat: 100 
      };
    }

    const newCoupon: Coupon = {
      id: crypto.randomUUID(),
      number: coupons.length + 101,
      serie: 1,
      date: new Date().toISOString(),
      items,
      total,
      status: 'AUTORIZADA',
      protocol: fiscal.nProt,
      chNFe: fiscal.chNFe,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.sefaz.pb.gov.br/nfce/consulta?chNFe=${fiscal.chNFe}`
    };

    setCoupons(prev => [newCoupon, ...prev]);
    setSelectedCoupon(newCoupon);
    setView(AppView.DASHBOARD);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Fixa à esquerda */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col fixed h-full z-10 no-print">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-indigo-500 p-2.5 rounded-2xl shadow-xl shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight leading-none mb-1">Bicho de Pelo</h1>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Campina Grande - PB</p>
            </div>
          </div>
          <nav className="space-y-2">
            {[
              { id: AppView.DASHBOARD, label: 'Painel Geral', icon: (props:any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
              { id: AppView.EMITIR, label: 'Nova Venda', icon: (props:any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
              { id: AppView.CERTIFICADO, label: 'Certificado A1', icon: (props:any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> },
            ].map((item) => (
              <button key={item.id} onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-semibold text-sm ${view === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <item.icon className="w-5 h-5" /> {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-slate-800">
          <div className={`p-4 rounded-xl border ${certificate.isLoaded ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <p className="text-[10px] font-black uppercase mb-1">{certificate.isLoaded ? 'Certificado Ativo' : 'Sem Certificado'}</p>
            <p className="text-[11px] leading-tight opacity-70 truncate font-bold">{certificate.isLoaded ? COMPANY.name : 'Carregue o A1'}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10 no-print overflow-auto bg-slate-50">
        {view === AppView.DASHBOARD && <DashboardView coupons={coupons} onOpen={setSelectedCoupon} onNew={() => setView(AppView.EMITIR)} />}
        {view === AppView.EMITIR && <SaleView certificate={certificate} onEmit={handleEmit} />}
        {view === AppView.CERTIFICADO && <CertificateView data={certificate} onSave={setCertificate} />}
      </main>

      {/* Coupon Modal */}
      {selectedCoupon && <CouponPreview coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} />}
    </div>
  );
};

// --- SUBVIEWS ---

const DashboardView = ({ coupons, onOpen, onNew }: any) => {
  const stats = useMemo(() => ({
    total: coupons.reduce((a: number, c: any) => a + c.total, 0),
    count: coupons.length
  }), [coupons]);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Painel Principal</h2>
          <p className="text-slate-500 font-medium">Bicho de Pelo - Sistema de Emissão Fiscal</p>
        </div>
        <button onClick={onNew} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
          Iniciar Nova Venda
        </button>
      </header>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total do Dia</p>
          <p className="text-3xl font-black text-slate-900">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Notas Autorizadas</p>
          <p className="text-3xl font-black text-slate-900">{stats.count}</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl">
          <p className="text-xs font-bold text-indigo-300 uppercase mb-2">SEFAZ Destino</p>
          <p className="text-3xl font-black">PB - Paraíba</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cupons Recentes</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
            <tr><th className="px-8 py-4">Nº / Série</th><th className="px-8 py-4">Data Emissão</th><th className="px-8 py-4 text-right">Valor Líquido</th><th className="px-8 py-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {coupons.map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5 text-sm font-bold text-slate-700">#{c.number} / {c.serie}</td>
                <td className="px-8 py-5 text-xs text-slate-500">{new Date(c.date).toLocaleString('pt-BR')}</td>
                <td className="px-8 py-5 text-right font-black text-slate-900">R$ {c.total.toFixed(2)}</td>
                <td className="px-8 py-5 text-right"><button onClick={() => onOpen(c)} className="text-indigo-600 font-bold text-xs uppercase hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">Ver Cupom</button></td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-slate-300 italic font-medium">Nenhum cupom emitido até o momento.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SaleView = ({ certificate, onEmit }: any) => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!certificate.isLoaded) return (
    <div className="flex flex-col items-center justify-center py-32 text-center max-w-sm mx-auto">
      <div className="bg-amber-100 text-amber-600 p-6 rounded-3xl mb-6 shadow-lg shadow-amber-200/50">
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <h3 className="text-2xl font-black text-slate-800 mb-2">Certificado Necessário</h3>
      <p className="text-slate-500 font-medium">Por favor, carregue seu Certificado Digital A1 no menu de configurações para habilitar a emissão de cupons.</p>
    </div>
  );

  const addItem = () => {
    const p = MOCK_PRODUCTS.find(x => x.id === selectedId);
    if (p) setItems([...items, { product: p, quantity: qty, total: p.price * qty }]);
    setSelectedId(''); setQty(1);
  };

  const total = items.reduce((acc, i) => acc + i.total, 0);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-12 gap-8">
      <div className="col-span-8 space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 uppercase text-xs tracking-widest text-indigo-600">Lançamento de Serviços</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Descrição do Serviço</label>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">Selecione o serviço...</option>
                {MOCK_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Qtd</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold" />
            </div>
            <button onClick={addItem} disabled={!selectedId} className="bg-slate-900 text-white font-bold h-[52px] px-8 rounded-xl hover:bg-slate-800 disabled:opacity-20 transition-all shadow-lg shadow-slate-200">
              Adicionar
            </button>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden min-h-[400px] shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 px-8 py-4 uppercase tracking-widest border-b border-slate-100">
              <tr><th className="px-8 py-4">Item</th><th className="px-8 py-4 text-center">Quantidade</th><th className="px-8 py-4 text-right">Valor Total</th><th className="px-8 py-4"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-8 py-5"><p className="font-bold text-slate-800 text-sm">{it.product.name}</p></td>
                  <td className="px-8 py-5 text-center font-bold text-slate-600">{it.quantity}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">R$ {it.total.toFixed(2)}</td>
                  <td className="px-8 py-5 text-right"><button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400 font-bold text-xs uppercase hover:underline">Remover</button></td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={4} className="p-32 text-center text-slate-200 italic font-medium">Nenhum serviço lançado no carrinho.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="col-span-4 space-y-6">
        <div className="bg-indigo-600 text-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-600/30">
          <h4 className="text-xl font-black mb-8 tracking-tight uppercase text-indigo-100/50 text-xs">Totalização</h4>
          <div className="space-y-4 mb-10 text-sm font-bold">
            <div className="flex justify-between text-indigo-100/70 uppercase text-xs tracking-widest"><span>Serviços</span><span>R$ {total.toFixed(2)}</span></div>
            <div className="pt-8 border-t border-indigo-400/30 flex justify-between items-baseline">
              <span className="text-sm font-black uppercase tracking-widest text-indigo-100">Valor Total</span>
              <span className="text-4xl font-black">R$ {total.toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={async () => { setLoading(true); await onEmit(items, total); setLoading(false); }} 
            disabled={items.length === 0 || loading} 
            className="w-full bg-white text-indigo-700 py-6 rounded-3xl font-black text-lg hover:bg-indigo-50 active:scale-95 transition-all shadow-xl disabled:opacity-30 flex items-center justify-center gap-3"
          >
            {loading ? <span className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span> : 'FECHAR E EMITIR'}
          </button>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresa</p>
           <p className="text-sm font-extrabold text-slate-800 leading-tight">{COMPANY.name}</p>
           <p className="text-[10px] font-bold text-slate-400 mt-1">{COMPANY.cnpj}</p>
        </div>
      </div>
    </div>
  );
};

const CertificateView = ({ data, onSave }: any) => {
  const [load, setLoad] = useState(false);
  const handle = (e: any) => {
    const f = e.target.files?.[0];
    if (f) { 
      setLoad(true); 
      setTimeout(() => { 
        onSave({ fileName: f.name, expiryDate: '2026-12-31', subject: COMPANY.name, isLoaded: true }); 
        setLoad(false); 
      }, 1500); 
    }
  };
  return (
    <div className="max-w-xl mx-auto bg-white p-16 rounded-[4rem] border border-slate-200 text-center shadow-sm mt-10">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></div>
      <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Assinatura Digital (A1)</h3>
      <p className="text-slate-500 mb-10 text-sm font-medium">O certificado A1 é fundamental para garantir a validade jurídica dos cupons emitidos pela BICHO DE PELO junto à SEFAZ-PB.</p>
      {data.isLoaded ? (
        <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 text-left space-y-4">
          <div className="flex justify-between items-center"><span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Certificado Vinculado</span><button onClick={() => onSave({ fileName: '', expiryDate: '', subject: '', isLoaded: false })} className="text-red-500 text-xs font-bold uppercase hover:underline">Remover</button></div>
          <div className="grid grid-cols-2 gap-8">
            <div><p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-tighter">Titular</p><p className="text-sm font-bold text-slate-800">{data.subject}</p></div>
            <div><p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-tighter">Vencimento</p><p className="text-sm font-bold text-slate-800">{new Date(data.expiryDate).toLocaleDateString('pt-BR')}</p></div>
          </div>
        </div>
      ) : (
        <label className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black text-lg inline-block cursor-pointer hover:bg-slate-800 shadow-xl transition-all active:scale-95">
          {load ? 'Importando Arquivo...' : 'Selecionar Certificado .pfx'}
          <input type="file" className="hidden" accept=".pfx,.p12" onChange={handle} />
        </label>
      )}
    </div>
  );
};

const CouponPreview = ({ coupon, onClose }: any) => (
  <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-8 no-print animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <div>
          <h3 className="font-black text-slate-800 uppercase tracking-tight">CUPOM FISCAL (NFC-e)</h3>
          <p className="text-[10px] font-bold text-slate-400">STATUS: {coupon.status}</p>
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
      <div className="flex-1 overflow-auto p-12 bg-slate-100/50 flex justify-center">
        <div className="bg-white p-10 shadow-xl font-mono text-[9px] leading-tight text-black w-full max-w-[320px] border-t-8 border-indigo-600 print:shadow-none print:m-0 print:border-none">
          <div className="text-center space-y-1 mb-8">
            <h2 className="text-xs font-black uppercase leading-tight">{COMPANY.name}</h2>
            <p className="font-bold">CNPJ: {COMPANY.cnpj}</p>
            <p className="text-[7px] uppercase leading-tight">{COMPANY.address}</p>
          </div>
          <div className="text-center py-4 border-y border-dashed border-black mb-6 font-bold uppercase leading-tight">
            <p className="text-[10px]">DANFE NFC-e</p>
            <p className="text-[7px] opacity-70">Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</p>
          </div>
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-black text-left font-black text-[7px] uppercase">
                <th className="pb-1">Item/Desc</th>
                <th className="pb-1 text-center">Qtd</th>
                <th className="pb-1 text-right">Vl. Tot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-black/20">
              {coupon.items.map((it: any, idx: number) => (
                <tr key={idx} className="align-top">
                  <td className="py-2.5 pr-2 font-bold uppercase">
                    <span className="font-black opacity-50 mr-1">{idx+1}</span> {it.product.name}
                  </td>
                  <td className="py-2.5 text-center font-bold">{it.quantity}</td>
                  <td className="py-2.5 text-right font-black">{it.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1 border-t-2 border-black pt-4 mb-8">
            <div className="flex justify-between font-black text-xs uppercase pt-1"><span>Valor TOTAL R$</span><span>{coupon.total.toFixed(2)}</span></div>
            <div className="flex justify-between mt-2 font-bold uppercase text-[7px]"><span>FORMA PAGAMENTO</span><span>Dinheiro</span></div>
          </div>
          <div className="text-[8px] space-y-6 text-center">
            <div className="bg-black/5 p-4 border border-black/10 uppercase font-black">
              <p className="mb-1 opacity-70">Consulta pela Chave de Acesso em:</p>
              <p className="break-all font-bold text-indigo-700">www.sefaz.pb.gov.br/nfce/consulta</p>
            </div>
            <div>
              <p className="font-black uppercase tracking-widest mb-1 opacity-70 text-[7px]">Chave de Acesso</p>
              <p className="font-bold tracking-tight text-[8px]">{coupon.chNFe?.match(/.{1,4}/g)?.join(' ')}</p>
            </div>
            <div className="pt-4 border-t border-dashed border-black leading-snug font-bold opacity-80 uppercase">
              <p>Consumidor Não Identificado</p>
              <p>NFC-e nº {coupon.number} Série {coupon.serie}</p>
              <p>Emissão: {new Date(coupon.date).toLocaleString('pt-BR')}</p>
              <p>Protocolo: {coupon.protocol}</p>
            </div>
            <div className="flex flex-col items-center gap-2 pt-6 border-t border-dashed border-black">
              <img src={coupon.qrCode} className="w-36 h-36" alt="QR Code" />
              <p className="uppercase font-black tracking-widest text-[6px] opacity-60">Consulta via leitor de QR Code</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-10 bg-white border-t border-slate-100 flex gap-4 sticky bottom-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white font-black py-6 rounded-3xl hover:bg-slate-800 shadow-2xl transition-all uppercase tracking-widest text-xs active:scale-95">
          Imprimir Cupom Térmico
        </button>
      </div>
    </div>
  </div>
);

// --- INICIALIZAÇÃO ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
