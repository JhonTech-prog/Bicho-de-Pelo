
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
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
  status: 'AUTORIZADA' | 'CANCELADA' | 'ERRO';
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

// --- Constants ---
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Ração Golden Adulto 15kg', price: 189.90, ncm: '23091000', unit: 'UN' },
  { id: '2', name: 'Banho e Tosa Porte Médio', price: 75.00, ncm: '96032100', unit: 'UN' },
  { id: '3', name: 'Coleira Antipulgas Seresto', price: 245.00, ncm: '38089119', unit: 'UN' },
  { id: '4', name: 'Sachê Whiskas Carne 85g', price: 3.50, ncm: '23091000', unit: 'UN' },
  { id: '5', name: 'Brinquedo Frango Sonoro', price: 22.90, ncm: '95030099', unit: 'UN' },
];

const COMPANY_INFO = {
  name: 'BICHO DE PELO PETSHOP LTDA',
  cnpj: '12.345.678/0001-90',
  ie: '123456789',
  address: 'Av. Epitácio Pessoa, 1500, João Pessoa - PB, 58030-000',
};

// --- Icons ---
const Icons = {
  Dog: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
  ),
  History: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  Key: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
};

// --- App Component ---
const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [certificate, setCertificate] = useState<CertificateData>(() => {
    const saved = localStorage.getItem('bicho_pelo_cert');
    return saved ? JSON.parse(saved) : { fileName: '', expiryDate: '', subject: '', isLoaded: false };
  });
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bicho_pelo_coupons');
    if (saved) setCoupons(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('bicho_pelo_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('bicho_pelo_cert', JSON.stringify(certificate));
  }, [certificate]);

  const emitCoupon = async (items: SaleItem[], total: number) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Simulate SEFAZ Response
    let sefazData;
    try {
      const prompt = `Simule uma resposta JSON da SEFAZ-PB para autorização de NFC-e. Dados: Total R$ ${total}. Inclua nProt (15 dígitos), chNFe (44 dígitos), cStat (100) e xMotivo (Autorizado o uso da NF-e).`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      sefazData = JSON.parse(response.text || '{}');
    } catch (e) {
      sefazData = {
        nProt: Math.random().toString().slice(2, 17),
        chNFe: "25" + Date.now().toString().padEnd(42, '0'),
        cStat: 100,
        xMotivo: "Autorizado o uso da NF-e"
      };
    }

    const newCoupon: Coupon = {
      id: crypto.randomUUID(),
      number: coupons.length + 1,
      serie: 1,
      date: new Date().toISOString(),
      items,
      total,
      status: 'AUTORIZADA',
      protocol: sefazData.nProt,
      chNFe: sefazData.chNFe,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.sefaz.pb.gov.br/nfce?chNFe=${sefazData.chNFe}`
    };

    setCoupons(prev => [newCoupon, ...prev]);
    setSelectedCoupon(newCoupon);
    setView(AppView.DASHBOARD);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col no-print">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-sky-500 p-2 rounded-xl text-white">
              <Icons.Dog />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Bicho de Pelo</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Fiscal PB</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: AppView.DASHBOARD, label: 'Painel Geral', icon: <Icons.History /> },
              { id: AppView.EMITIR, label: 'Emitir Cupom', icon: <Icons.Plus /> },
              { id: AppView.CERTIFICADO, label: 'Certificado A1', icon: <Icons.Key /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  view === item.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${certificate.isLoaded ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[10px] font-bold text-slate-300 uppercase">Status SEFAZ-PB</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {certificate.isLoaded ? `Certificado ativo: ${certificate.subject}` : 'Nenhum certificado carregado.'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-auto no-print">
        {view === AppView.DASHBOARD && <Dashboard coupons={coupons} onViewCoupon={setSelectedCoupon} onNewSale={() => setView(AppView.EMITIR)} />}
        {view === AppView.EMITIR && <SaleView certificate={certificate} onEmit={emitCoupon} />}
        {view === AppView.CERTIFICADO && <CertificateView data={certificate} onSave={setCertificate} />}
      </main>

      {/* Coupon Modal */}
      {selectedCoupon && <CouponPreview coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} />}
    </div>
  );
};

// --- Sub-components ---

const Dashboard: React.FC<{ coupons: Coupon[], onViewCoupon: (c: Coupon) => void, onNewSale: () => void }> = ({ coupons, onViewCoupon, onNewSale }) => {
  const totalToday = useMemo(() => coupons.reduce((acc, c) => acc + c.total, 0), [coupons]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Início</h2>
          <p className="text-slate-500 text-sm">Bem-vindo ao emissor fiscal do Bicho de Pelo.</p>
        </div>
        <button onClick={onNewSale} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
          <Icons.Plus />
          Nova Venda
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total de Vendas</p>
          <p className="text-3xl font-black text-slate-900">R$ {totalToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cupons Emitidos</p>
          <p className="text-3xl font-black text-slate-900">{coupons.length}</p>
        </div>
        <div className="bg-sky-500 p-6 rounded-[2.5rem] text-white shadow-xl shadow-sky-500/20">
          <p className="text-xs font-bold text-sky-100 uppercase tracking-widest mb-1">Estado</p>
          <p className="text-3xl font-black">Paraíba (PB)</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Últimas Emissões</h3>
          <span className="text-xs text-slate-400">Página 1 de 1</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-4">Nº Cupom</th>
              <th className="px-8 py-4">Data/Hora</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Valor</th>
              <th className="px-8 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coupons.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-4 font-mono text-xs font-bold text-slate-600">#{c.number.toString().padStart(6, '0')}</td>
                <td className="px-8 py-4 text-xs text-slate-500">{new Date(c.date).toLocaleString('pt-BR')}</td>
                <td className="px-8 py-4">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Autorizada</span>
                </td>
                <td className="px-8 py-4 text-right font-black text-slate-900">R$ {c.total.toFixed(2)}</td>
                <td className="px-8 py-4 text-right">
                  <button onClick={() => onViewCoupon(c)} className="text-sky-500 hover:text-sky-600 font-bold text-xs uppercase">Visualizar</button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={5} className="p-20 text-center text-slate-400 text-sm">Nenhum cupom emitido hoje.</td>
              </tr>
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
    setItems([...items, { product: p, quantity: qty, total: p.price * qty }]);
    setSelectedId('');
    setQty(1);
  };

  const total = items.reduce((acc, i) => acc + i.total, 0);

  const handleEmit = async () => {
    setLoading(true);
    await onEmit(items, total);
    setLoading(false);
  };

  if (!certificate.isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="bg-amber-100 text-amber-600 p-5 rounded-full mb-6">
          <Icons.Key />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Certificado Necessário</h3>
        <p className="text-slate-500 max-w-sm mb-8">Para emitir notas junto à SEFAZ-PB, você precisa primeiro configurar seu certificado digital A1.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-12 gap-8">
      <div className="col-span-8 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Ponto de Venda (PDV)</h3>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-7">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Produto ou Serviço</label>
              <select 
                value={selectedId} 
                onChange={e => setSelectedId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              >
                <option value="">Buscar item...</option>
                {MOCK_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {p.price.toFixed(2)})</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Qtd</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="col-span-3 flex items-end">
              <button onClick={addItem} disabled={!selectedId} className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 disabled:opacity-30 transition-all">Incluir</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Item</th>
                <th className="px-8 py-4">Qtd</th>
                <th className="px-8 py-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td className="px-8 py-4">
                    <p className="font-bold text-slate-800 text-sm">{it.product.name}</p>
                    <p className="text-[10px] text-slate-400">NCM: {it.product.ncm}</p>
                  </td>
                  <td className="px-8 py-4 text-sm font-medium text-slate-600">{it.quantity} {it.product.unit}</td>
                  <td className="px-8 py-4 text-right font-black text-slate-900">R$ {it.total.toFixed(2)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-32 text-center text-slate-300 italic text-sm">O carrinho está vazio.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-span-4 space-y-6">
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20">
          <h4 className="text-xl font-bold mb-8">Fechamento</h4>
          <div className="space-y-4 mb-10">
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Impostos (Estimado)</span>
              <span>R$ {(total * 0.12).toFixed(2)}</span>
            </div>
            <div className="pt-6 border-t border-slate-800 flex justify-between items-baseline">
              <span className="font-bold text-lg">Total</span>
              <span className="text-3xl font-black text-sky-400">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={handleEmit}
            disabled={items.length === 0 || loading}
            className="w-full bg-sky-500 py-5 rounded-3xl font-black text-lg hover:bg-sky-400 active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'EMITIR NFC-e'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Emitindo para</p>
          <p className="text-xs font-bold text-slate-700">{COMPANY_INFO.name}</p>
          <p className="text-[11px] text-slate-400 mt-1">{COMPANY_INFO.cnpj}</p>
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
        onSave({ fileName: file.name, expiryDate: '2026-05-20', subject: 'BICHO DE PELO PETSHOP LTDA', isLoaded: true });
        setLoading(false);
      }, 1500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm text-center">
      <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
        <Icons.Key />
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-2">Certificado Digital A1</h3>
      <p className="text-slate-500 text-sm mb-10 max-w-sm mx-auto">Configuração do certificado para assinatura digital das notas eletrônicas no estado da Paraíba.</p>

      {data.isLoaded ? (
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">Informações do Arquivo</p>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Assunto</p>
                <p className="text-sm font-bold text-slate-700">{data.subject}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Expiração</p>
                <p className="text-sm font-bold text-slate-700">{new Date(data.expiryDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Senha do PFX</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <button onClick={() => onSave({ fileName: '', expiryDate: '', subject: '', isLoaded: false })} className="text-red-500 font-bold text-xs uppercase hover:underline">Remover Certificado</button>
        </div>
      ) : (
        <label className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold inline-block cursor-pointer hover:bg-slate-800 transition-all">
          {loading ? 'Carregando...' : 'Selecionar Arquivo .pfx'}
          <input type="file" className="hidden" accept=".pfx,.p12" onChange={handleFile} />
        </label>
      )}
    </div>
  );
};

const CouponPreview: React.FC<{ coupon: Coupon, onClose: () => void }> = ({ coupon, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 no-print">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-800">Visualizar Cupom</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-10 bg-slate-50 custom-scroll">
          <div className="bg-white p-8 shadow-sm font-mono text-[10px] leading-relaxed text-black max-w-[320px] mx-auto print:shadow-none print:m-0 print:max-w-none print:bg-white">
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-sm font-black uppercase">{COMPANY_INFO.name}</h2>
              <p>CNPJ: {COMPANY_INFO.cnpj}</p>
              <p>{COMPANY_INFO.address}</p>
            </div>

            <div className="text-center py-3 border-y border-dashed border-black mb-6">
              <p className="font-bold">DANFE NFC-e - Documento Auxiliar</p>
              <p>Nota Fiscal de Consumidor Eletrônica</p>
            </div>

            <table className="w-full mb-6 text-[9px]">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left pb-1">ITEM (Cod|Desc)</th>
                  <th className="text-center pb-1">QTD</th>
                  <th className="text-right pb-1">VLR TOT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-300">
                {coupon.items.map((it, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="py-2 pr-2">{idx+1} {it.product.name}</td>
                    <td className="py-2 text-center">{it.quantity} {it.product.unit}</td>
                    <td className="py-2 text-right">{it.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 border-t border-black pt-3 mb-6">
              <div className="flex justify-between font-black text-xs">
                <span>VALOR TOTAL R$</span>
                <span>{coupon.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span>DINHEIRO</span>
                <span>{coupon.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-[8px] space-y-3 mb-6">
              <div className="text-center italic">
                <p>Consulte pela Chave de Acesso em:</p>
                <p className="break-all font-bold">www.sefaz.pb.gov.br/nfe/consulta</p>
              </div>
              <div className="text-center font-bold">
                <p>CHAVE DE ACESSO</p>
                <p className="tracking-tighter">{coupon.chNFe?.match(/.{1,4}/g)?.join(' ')}</p>
              </div>
              <div className="text-center">
                <p className="font-bold">CONSUMIDOR NÃO IDENTIFICADO</p>
                <p className="mt-2">NFC-e nº {coupon.number.toString().padStart(9, '0')} Série {coupon.serie}</p>
                <p>Emissão: {new Date(coupon.date).toLocaleString('pt-BR')}</p>
                <p>Protocolo: {coupon.protocol}</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 pt-6 border-t border-dashed border-black">
              <img src={coupon.qrCode} className="w-32 h-32" alt="QR Code" />
              <p className="text-[7px] uppercase font-bold">Consulta via QR Code</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex gap-4 sticky bottom-0 z-10">
          <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-xs">Imprimir</button>
        </div>
      </div>
    </div>
  );
};

// --- Render ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
