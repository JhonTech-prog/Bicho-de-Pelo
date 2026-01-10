
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- TIPAGENS ---
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

// --- CONSTANTES ---
const COMPANY = {
  name: 'BICHO DE PELO PETSHOP LTDA',
  cnpj: '12.345.678/0001-90',
  ie: '123456789',
  address: 'Av. Epitácio Pessoa, 1500, João Pessoa - PB, 58030-000',
};

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Ração Golden Adulto 15kg', price: 189.90, ncm: '23091000', unit: 'UN' },
  { id: '2', name: 'Banho e Tosa Completo', price: 85.00, ncm: '96032100', unit: 'UN' },
  { id: '3', name: 'Coleira Antipulgas Seresto', price: 245.00, ncm: '38089119', unit: 'UN' },
  { id: '4', name: 'Sachê Whiskas Carne 85g', price: 3.50, ncm: '23091000', unit: 'UN' },
  { id: '5', name: 'Mordedor Pelúcia Pato', price: 29.90, ncm: '95030099', unit: 'UN' },
  { id: '6', name: 'Shampoo Neutro 500ml', price: 42.00, ncm: '33051000', unit: 'UN' },
];

// --- ÍCONES ---
const Icons = {
  Paw: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
  ),
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H18a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Key: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  ),
  History: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
};

// --- APLICAÇÃO ---
const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('bicho_v3_coupons');
    return saved ? JSON.parse(saved) : [];
  });
  const [certificate, setCertificate] = useState<CertificateData>(() => {
    const saved = localStorage.getItem('bicho_v3_cert');
    return saved ? JSON.parse(saved) : { fileName: '', expiryDate: '', subject: '', isLoaded: false };
  });
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    localStorage.setItem('bicho_v3_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('bicho_v3_cert', JSON.stringify(certificate));
  }, [certificate]);

  const handleEmit = async (items: SaleItem[], total: number) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Simulação Gemini para Protocolo de Autorização SEFAZ-PB
    let fiscal;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere um protocolo fiscal autorizado fictício para o estado da Paraíba (PB). Valor: R$ ${total.toFixed(2)}. CNPJ Emissor: ${COMPANY.cnpj}. Retorne JSON com: nProt (15 dígitos), chNFe (44 dígitos começando com 25), cStat (100).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nProt: { type: Type.STRING },
              chNFe: { type: Type.STRING },
              cStat: { type: Type.NUMBER }
            },
            required: ["nProt", "chNFe", "cStat"]
          }
        }
      });
      fiscal = JSON.parse(response.text || '{}');
    } catch (e) {
      fiscal = {
        nProt: Math.random().toString().slice(2, 17),
        chNFe: "25" + Date.now().toString().padEnd(42, '0'),
        cStat: 100
      };
    }

    const newCoupon: Coupon = {
      id: crypto.randomUUID(),
      number: coupons.length + 500,
      serie: 1,
      date: new Date().toISOString(),
      items,
      total,
      status: 'AUTORIZADA',
      protocol: fiscal.nProt,
      chNFe: fiscal.chNFe,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://www.sefaz.pb.gov.br/nfce?chNFe=${fiscal.chNFe}`
    };

    setCoupons(prev => [newCoupon, ...prev]);
    setSelectedCoupon(newCoupon);
    setView(AppView.DASHBOARD);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col fixed h-full z-10 no-print">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-indigo-500 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-500/30">
              <Icons.Paw />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight">Bicho de Pelo</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Petshop & Estética</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: AppView.DASHBOARD, label: 'Dashboard', icon: <Icons.Dashboard /> },
              { id: AppView.EMITIR, label: 'Emitir NFC-e', icon: <Icons.Plus /> },
              { id: AppView.HISTORICO, label: 'Histórico', icon: <Icons.History /> },
              { id: AppView.CERTIFICADO, label: 'Certificado A1', icon: <Icons.Key /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-semibold text-sm ${
                  view === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-800">
          <div className={`p-4 rounded-2xl border ${certificate.isLoaded ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`w-2 h-2 rounded-full ${certificate.isLoaded ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className={`text-[10px] font-black uppercase ${certificate.isLoaded ? 'text-emerald-400' : 'text-red-400'}`}>
                {certificate.isLoaded ? 'SEFAZ-PB Online' : 'Offline'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {certificate.isLoaded ? certificate.subject : 'Carregue o certificado A1.'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 ml-72 p-10 overflow-auto no-print">
        {view === AppView.DASHBOARD && <DashboardView coupons={coupons} onNew={() => setView(AppView.EMITIR)} onOpen={setSelectedCoupon} />}
        {view === AppView.EMITIR && <SaleView certificate={certificate} onEmit={handleEmit} />}
        {view === AppView.HISTORICO && <HistoryView coupons={coupons} onOpen={setSelectedCoupon} />}
        {view === AppView.CERTIFICADO && <CertificateView data={certificate} onSave={setCertificate} />}
      </main>

      {/* Preview Modal */}
      {selectedCoupon && <CouponModal coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} />}
    </div>
  );
};

// --- SUB-COMPONENTES ---

const DashboardView: React.FC<{ coupons: Coupon[], onNew: () => void, onOpen: (c: Coupon) => void }> = ({ coupons, onNew, onOpen }) => {
  const stats = useMemo(() => {
    const total = coupons.reduce((acc, c) => acc + c.total, 0);
    return { total, count: coupons.length };
  }, [coupons]);

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Painel Geral</h2>
          <p className="text-slate-500 font-medium">Controle de emissões fiscais para o petshop.</p>
        </div>
        <button onClick={onNew} className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30">
          <Icons.Plus /> Nova Venda
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total de Vendas</p>
          <p className="text-3xl font-black text-slate-900">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Notas Autorizadas</p>
          <p className="text-3xl font-black text-slate-900">{stats.count}</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Ambiente Fiscal</p>
          <p className="text-3xl font-black text-indigo-400">Paraíba (PB)</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Últimas Emissões</h3>
          <button className="text-indigo-600 font-bold text-sm">Ver tudo</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-4">Nº / Série</th>
              <th className="px-8 py-4">Data/Hora</th>
              <th className="px-8 py-4 text-right">Valor</th>
              <th className="px-8 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coupons.slice(0, 5).map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5 font-mono text-xs font-bold text-slate-600">{c.number} / {c.serie}</td>
                <td className="px-8 py-5 text-xs text-slate-500">{new Date(c.date).toLocaleString()}</td>
                <td className="px-8 py-5 text-right font-black text-slate-900">R$ {c.total.toFixed(2)}</td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => onOpen(c)} className="text-indigo-600 font-bold text-xs uppercase">Visualizar</button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={4} className="p-20 text-center text-slate-400 text-sm">Nenhuma emissão registrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SaleView: React.FC<{ certificate: CertificateData, onEmit: (items: SaleItem[], total: number) => void }> = ({ certificate, onEmit }) => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    const p = MOCK_PRODUCTS.find(x => x.id === selectedId);
    if (!p) return;
    setItems(prev => [...prev, { product: p, quantity: qty, total: p.price * qty }]);
    setSelectedId('');
    setQty(1);
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const total = items.reduce((acc, i) => acc + i.total, 0);

  const handleEmit = async () => {
    setLoading(true);
    await onEmit(items, total);
    setLoading(false);
  };

  if (!certificate.isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="bg-amber-100 text-amber-600 p-6 rounded-3xl mb-6">
          <Icons.Key />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Certificado Pendente</h3>
        <p className="text-slate-500 mb-8">Para emitir notas fiscais oficiais para a SEFAZ-PB, você precisa primeiro configurar seu certificado A1.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-8 max-w-6xl mx-auto">
      <div className="col-span-8 space-y-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Lançamento de Itens</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Produto</label>
              <select 
                value={selectedId} onChange={e => setSelectedId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">Selecione...</option>
                {MOCK_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Qtd</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold" />
            </div>
            <button onClick={addItem} disabled={!selectedId} className="bg-slate-900 text-white font-bold h-[52px] px-8 rounded-2xl hover:bg-slate-800 disabled:opacity-20 transition-all">Incluir</button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[350px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Item</th>
                <th className="px-8 py-4 text-center">Quantidade</th>
                <th className="px-8 py-4 text-right">Subtotal</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <tr key={idx} className="group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800 text-sm">{it.product.name}</p>
                    <p className="text-[10px] text-slate-400">NCM: {it.product.ncm}</p>
                  </td>
                  <td className="px-8 py-5 text-center text-sm font-bold text-slate-600">{it.quantity} {it.product.unit}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900 text-base">R$ {it.total.toFixed(2)}</td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => removeItem(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} className="py-24 text-center text-slate-300 italic text-sm">Nenhum item adicionado à venda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-span-4 space-y-6">
        <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/30">
          <h4 className="text-xl font-bold mb-8 tracking-tight">Fechamento de Venda</h4>
          <div className="space-y-4 mb-10">
            <div className="flex justify-between text-indigo-100 text-sm font-medium">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-indigo-100 text-sm font-medium">
              <span>Descontos</span>
              <span>R$ 0,00</span>
            </div>
            <div className="pt-6 border-t border-indigo-400/50 flex justify-between items-baseline">
              <span className="font-bold">Total NFC-e</span>
              <span className="text-4xl font-black">R$ {total.toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={handleEmit} disabled={items.length === 0 || loading}
            className="w-full bg-white text-indigo-700 py-5 rounded-3xl font-black text-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            {loading ? <span className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span> : 'EMITIR CUPOM'}
          </button>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Empresa Emissora</p>
          <p className="font-bold text-slate-800 text-sm">{COMPANY.name}</p>
          <p className="text-xs text-slate-500 mt-1">{COMPANY.cnpj}</p>
        </div>
      </div>
    </div>
  );
};

const CertificateView: React.FC<{ data: CertificateData, onSave: (d: CertificateData) => void }> = ({ data, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [pass, setPass] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      setTimeout(() => {
        onSave({ fileName: file.name, expiryDate: '2026-10-30', subject: COMPANY.name, isLoaded: true });
        setLoading(false);
      }, 1500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-16 rounded-[3.5rem] border border-slate-200 shadow-sm text-center">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
        <Icons.Key />
      </div>
      <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Certificado Digital A1</h3>
      <p className="text-slate-500 text-sm mb-12 max-w-sm mx-auto">Upload do arquivo de certificado para assinatura digital das notas emitidas na Paraíba.</p>

      {data.isLoaded ? (
        <div className="space-y-8">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-left">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Ativo</span>
              <button onClick={() => onSave({ fileName: '', expiryDate: '', subject: '', isLoaded: false })} className="text-red-500 font-bold text-xs uppercase underline">Remover</button>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Subject</p><p className="text-sm font-bold text-slate-700">{data.subject}</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Vencimento</p><p className="text-sm font-bold text-slate-700">{new Date(data.expiryDate).toLocaleDateString()}</p></div>
            </div>
          </div>
          <div className="text-left space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Senha do Arquivo PFX</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>
        </div>
      ) : (
        <label className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black text-lg inline-block cursor-pointer hover:bg-slate-800 transition-all shadow-xl active:scale-95">
          {loading ? 'Processando Arquivo...' : 'Selecionar Certificado A1'}
          <input type="file" className="hidden" accept=".pfx,.p12" onChange={handleFile} />
        </label>
      )}
    </div>
  );
};

const HistoryView: React.FC<{ coupons: Coupon[], onOpen: (c: Coupon) => void }> = ({ coupons, onOpen }) => (
  <div className="max-w-6xl mx-auto space-y-8">
    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Histórico Fiscal</h2>
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <tr>
            <th className="px-10 py-5">Nº / Série</th>
            <th className="px-10 py-5">Emissão</th>
            <th className="px-10 py-5">Protocolo</th>
            <th className="px-10 py-5 text-right">Valor</th>
            <th className="px-10 py-5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {coupons.map(c => (
            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-10 py-6 font-mono text-xs font-bold text-slate-700">#{c.number}</td>
              <td className="px-10 py-6 text-sm text-slate-500 font-medium">{new Date(c.date).toLocaleString()}</td>
              <td className="px-10 py-6 text-xs text-slate-400 font-mono">{c.protocol}</td>
              <td className="px-10 py-6 text-right font-black text-slate-900">R$ {c.total.toFixed(2)}</td>
              <td className="px-10 py-6 text-right">
                <button onClick={() => onOpen(c)} className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const CouponModal: React.FC<{ coupon: Coupon, onClose: () => void }> = ({ coupon, onClose }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-8 no-print">
    <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="font-black text-xl text-slate-800 tracking-tight">Cupom Fiscal NFC-e</h3>
        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-12 bg-slate-50 flex justify-center">
        <div className="bg-white p-10 shadow-2xl font-mono text-[10px] leading-relaxed text-black w-full max-w-[340px] border-t-8 border-indigo-600 print:shadow-none print:max-w-none print:p-0">
          <div className="text-center space-y-1 mb-8">
            <h2 className="text-xs font-black uppercase">{COMPANY.name}</h2>
            <p className="font-bold">CNPJ: {COMPANY.cnpj}</p>
            <p className="text-[9px] uppercase">{COMPANY.address}</p>
          </div>
          <div className="text-center py-4 border-y border-dashed border-black mb-8 space-y-1">
            <p className="font-black text-[11px]">DANFE NFC-e</p>
            <p className="text-[8px] font-bold uppercase">Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</p>
          </div>
          <table className="w-full mb-8 text-[9px]">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="pb-2 font-black uppercase">Item</th>
                <th className="pb-2 text-center font-black uppercase">Qtd</th>
                <th className="pb-2 text-right font-black uppercase">Vl Tot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-black/10">
              {coupon.items.map((it, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-2.5 pr-2 font-medium">
                    <span className="font-black">{String(idx+1).padStart(3, '0')}</span> {it.product.name}
                  </td>
                  <td className="py-2.5 text-center font-bold">{it.quantity}</td>
                  <td className="py-2.5 text-right font-black">{it.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1 border-t border-black pt-4 mb-8">
            <div className="flex justify-between font-black text-xs pt-1"><span>TOTAL R$</span><span>{coupon.total.toFixed(2)}</span></div>
            <div className="flex justify-between mt-3 font-bold"><span>FORMA PGTO.</span><span>DINHEIRO</span></div>
          </div>
          <div className="text-[8px] space-y-4 mb-8 text-center">
            <div className="bg-black/5 p-3 rounded-lg border border-black/10">
              <p className="font-black uppercase mb-1">Consulta pela Chave em:</p>
              <p className="break-all font-bold">www.sefaz.pb.gov.br/nfe/consulta</p>
            </div>
            <div>
              <p className="font-black mb-1 uppercase tracking-widest">Chave de Acesso</p>
              <p className="font-bold tracking-tight text-[9px]">{coupon.chNFe?.match(/.{1,4}/g)?.join(' ')}</p>
            </div>
            <div className="pt-2 border-t border-dashed border-black">
              <p className="font-black uppercase text-[9px]">Consumidor Não Identificado</p>
              <p className="font-bold">NFC-e nº {coupon.number} Série {coupon.serie}</p>
              <p>Emissão: {new Date(coupon.date).toLocaleString('pt-BR')}</p>
              <p className="font-bold">Protocolo: {coupon.protocol}</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 pt-6 border-t border-dashed border-black">
            <img src={coupon.qrCode} className="w-40 h-40" alt="QR Code" />
            <p className="text-[7px] uppercase font-black tracking-widest">Consulta via QR Code</p>
          </div>
        </div>
      </div>

      <div className="p-10 bg-white border-t border-slate-100 flex gap-6 sticky bottom-0 z-10">
        <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white font-black py-5 rounded-3xl hover:bg-slate-800 transition-all uppercase tracking-widest text-sm shadow-xl">Imprimir</button>
      </div>
    </div>
  </div>
);

// --- RENDER ---
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
