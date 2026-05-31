
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// --- CONFIGURAÇÃO E TIPAGEM ---
enum AppView {
  DASHBOARD = 'DASHBOARD',
  EMITIR = 'EMITIR',
  CERTIFICADO = 'CERTIFICADO',
  CONFIG_FISCAL = 'CONFIG_FISCAL'
}

interface Product {
  id: string;
  name: string;
  price: number;
  ncm: string;
  cfop: string;
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
  status: 'AUTORIZADA' | 'SIMULADA' | 'ERRO';
  signatureStatus?: 'NOT_CONFIGURED' | 'SIGNED' | 'ERROR';
  items: SaleItem[];
  total: number;
  amountReceived: number;
  change: number;
  protocol?: string;
  chNFe?: string;
  qrCode?: string;
}

interface FiscalConfig {
  companyName: string;
  cnpj: string;
  stateRegistration: string;
  cityCode: string;
  cityName: string;
  state: string;
  taxRegime: 'simples' | 'normal';
  csc: string;
  cscId: string;
  nfceSerie: number;
  nextNfceNumber: number;
  environment: 'local' | 'homologacao' | 'producao';
  certificate?: {
    fileName: string;
    uploadedAt: string;
    hasPassword: boolean;
    subjectName?: string;
    issuerName?: string;
    serialNumber?: string;
    validFrom?: string;
    validTo?: string;
  };
}

const COMPANY = {
  name: 'BICHO DE PELO',
  cnpj: '26.614.661/0001-09',
  address: 'Vigário Calixto, 1218, Catolé, Campina Grande - PB',
};

const MOCK_PRODUCTS: Product[] = [
  { id: 'HIG-001', name: 'Produtos de banho pet', price: 50.00, ncm: '33079000', cfop: '5102', unit: 'UN' },
  { id: 'HIG-002', name: 'Produtos banho e tosa pet', price: 150.00, ncm: '33079000', cfop: '5102', unit: 'UN' },
  { id: 'HIG-003', name: 'Shampoo/condicionador pet', price: 30.00, ncm: '33079000', cfop: '5102', unit: 'UN' },
  { id: 'HIG-004', name: 'Hidratacao de pelagem pet', price: 30.00, ncm: '33079000', cfop: '5102', unit: 'UN' },
  { id: 'HIG-005', name: 'Colonia pos-banho pet', price: 20.00, ncm: '33079000', cfop: '5102', unit: 'UN' },
  { id: 'RAC-001', name: 'Racao caes/gatos 1kg', price: 25.00, ncm: '23091000', cfop: '5102', unit: 'KG' },
  { id: 'RAC-002', name: 'Racao caes/gatos 10kg', price: 139.90, ncm: '23091000', cfop: '5102', unit: 'UN' },
  { id: 'RAC-003', name: 'Racao Golden 15kg', price: 189.90, ncm: '23091000', cfop: '5102', unit: 'UN' },
];

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

const API_URL = String((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => `${API_URL}${path}`;

const emitNfce = async (items: SaleItem[], total: number, amountReceived: number) => {
  const response = await fetch(apiUrl('/api/nfce/emit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, total, amountReceived }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'Erro ao emitir NFC-e.');
  }

  return response.json();
};

// --- COMPONENTE PRINCIPAL ---
const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    return readStorage<Coupon[]>('bicho_pelo_v2_coupons', []);
  });
  const [certificate, setCertificate] = useState(() => {
    return readStorage('bicho_pelo_v2_cert', { isLoaded: false });
  });
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => localStorage.setItem('bicho_pelo_v2_coupons', JSON.stringify(coupons)), [coupons]);
  useEffect(() => localStorage.setItem('bicho_pelo_v2_cert', JSON.stringify(certificate)), [certificate]);

  const handleEmit = async (items: SaleItem[], total: number, received: number) => {
    const nfce = await emitNfce(items, total, received);
    const newCoupon: Coupon = {
      id: nfce.id,
      number: nfce.number,
      serie: nfce.serie,
      date: nfce.issueDate,
      status: nfce.status,
      signatureStatus: nfce.signatureStatus,
      items: [...items],
      total,
      amountReceived: received,
      change: received - total,
      protocol: nfce.protocol,
      chNFe: nfce.accessKey,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(nfce.qrCodeUrl || nfce.danfeUrl)}`
    };

    setCoupons(prev => [newCoupon, ...prev]);
    setSelectedCoupon(newCoupon);
    setView(AppView.DASHBOARD);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar - Oculta na impressão */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col fixed h-full z-10 no-print shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-sky-500 p-2.5 rounded-2xl shadow-lg rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            </div>
            <div>
              <h1 className="font-black text-xl leading-none">Bicho de Pelo</h1>
              <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest mt-1">Petshop & Estética</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: AppView.DASHBOARD, label: 'Painel Inicial', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: AppView.EMITIR, label: 'Nova Venda', icon: 'M12 4v16m8-8H4' },
              { id: AppView.CONFIG_FISCAL, label: 'Configuração Fiscal', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456 1.296 2.247-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828-1.298 2.247-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.127c-.332.183-.582.495-.644.869l-.213 1.28h-2.594l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456-1.297-2.247 1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828 1.297-2.247 1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
              { id: AppView.CERTIFICADO, label: 'Certificado A1', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            ].map(item => (
              <button key={item.id} onClick={() => setView(item.id as AppView)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-sm ${view === item.id ? 'bg-sky-600 text-white shadow-xl shadow-sky-900/20 translate-x-1' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-slate-800 bg-slate-900/50">
          <div className={`p-4 rounded-2xl border-2 ${certificate.isLoaded ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${certificate.isLoaded ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}`}></span>
              <p className="text-[10px] font-black uppercase tracking-tighter">Status Fiscal</p>
            </div>
            <p className="text-[11px] font-bold truncate">{certificate.isLoaded ? 'CERTIFICADO OK / SEFAZ PENDENTE' : 'SEM CERTIFICADO'}</p>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 ml-72 p-12 bg-slate-50 min-h-screen no-print">
        {view === AppView.DASHBOARD && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Caixa Bicho de Pelo</h2>
                <p className="text-slate-500 font-bold mt-1">Gerencie vendas e acompanhe o status fiscal real de cada cupom</p>
              </div>
              <button onClick={() => setView(AppView.EMITIR)} className="bg-sky-600 text-white px-10 py-5 rounded-[2rem] font-black hover:bg-sky-700 shadow-2xl shadow-sky-200 transition-all active:scale-95 uppercase tracking-widest text-xs">Nova Venda</button>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Faturamento de Hoje</p>
                <p className="text-4xl font-black text-slate-900">R$ {coupons.reduce((a,c) => a+c.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cupons Gerados</p>
                <p className="text-4xl font-black text-slate-900">{coupons.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Histórico Recente</h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr><th className="px-8 py-5">Cupom</th><th className="px-8 py-5">Data/Hora</th><th className="px-8 py-5">Status</th><th className="px-8 py-5 text-right">Valor Total</th><th className="px-8 py-5"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 text-sm font-black text-slate-700">#{String(c.number).padStart(4, '0')}</td>
                      <td className="px-8 py-6 text-xs text-slate-500 font-bold">{new Date(c.date).toLocaleString('pt-BR')}</td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.status === 'AUTORIZADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {c.status || 'SIMULADA'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">R$ {c.total.toFixed(2)}</td>
                      <td className="px-8 py-6 text-right"><button onClick={() => setSelectedCoupon(c)} className="bg-slate-100 text-slate-600 font-black text-[10px] uppercase px-5 py-2.5 rounded-xl hover:bg-sky-100 hover:text-sky-700 transition-all tracking-widest">Detalhes</button></td>
                    </tr>
                  ))}
                  {coupons.length === 0 && <tr><td colSpan={5} className="p-32 text-center text-slate-300 font-bold italic text-lg uppercase tracking-widest opacity-30">Nenhum cupom hoje</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === AppView.EMITIR && (
          <SaleView certificate={certificate} onEmit={handleEmit} />
        )}

        {view === AppView.CONFIG_FISCAL && (
          <FiscalConfigView onCertificateLoaded={() => setCertificate({ isLoaded: true })} />
        )}

        {view === AppView.CERTIFICADO && (
          <div className="max-w-2xl mx-auto bg-white p-16 rounded-[4rem] border border-slate-200 text-center mt-10 shadow-sm animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tight">Certificado A1</h3>
            <p className="text-slate-500 font-bold mb-12 px-10 leading-relaxed">Carregue o certificado digital da Bicho de Pelo para assinar e enviar os cupons para a SEFAZ-PB.</p>
            {certificate.isLoaded ? (
              <div className="bg-emerald-50 p-10 rounded-[2.5rem] border-2 border-emerald-100 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div>
                <p className="font-black text-emerald-800 uppercase text-[10px] tracking-widest mb-2">Empresa Vinculada</p>
                <p className="text-xl font-black text-emerald-900">{COMPANY.name}</p>
                <p className="text-emerald-600 font-bold text-xs mt-1">Vencimento: 12/2025</p>
                <button onClick={() => setCertificate({ isLoaded: false })} className="mt-8 text-red-500 text-[10px] font-black uppercase hover:bg-red-50 px-4 py-2 rounded-lg transition-all tracking-widest">Desconectar</button>
              </div>
            ) : (
              <label className="bg-slate-900 text-white px-14 py-6 rounded-[2rem] font-black cursor-pointer shadow-2xl hover:bg-slate-800 transition-all inline-block active:scale-95 uppercase tracking-widest text-xs">
                Selecionar Arquivo .PFX
                <input type="file" className="hidden" onChange={() => setCertificate({ isLoaded: true })} />
              </label>
            )}
          </div>
        )}
      </main>

      {/* Modal de Cupom - Fica por cima de tudo */}
      {selectedCoupon && <CouponPreview coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} />}
    </div>
  );
};

const EMPTY_FISCAL_CONFIG: FiscalConfig = {
  companyName: '',
  cnpj: '',
  stateRegistration: '',
  cityCode: '2504009',
  cityName: 'Campina Grande',
  state: 'PB',
  taxRegime: 'simples',
  csc: '',
  cscId: '',
  nfceSerie: 1,
  nextNfceNumber: 1,
  environment: 'local',
};

const FiscalConfigView = ({ onCertificateLoaded }: { onCertificateLoaded: () => void }) => {
  const [config, setConfig] = useState<FiscalConfig>(EMPTY_FISCAL_CONFIG);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSefaz, setTestingSefaz] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(apiUrl('/api/config/fiscal'))
      .then((response) => response.json())
      .then((data) => {
        setConfig({ ...EMPTY_FISCAL_CONFIG, ...data });
        if (data.certificate) onCertificateLoaded();
      })
      .catch(() => setMessage('Não foi possível carregar a configuração fiscal.'))
      .finally(() => setLoading(false));
  }, [onCertificateLoaded]);

  const updateField = (field: keyof FiscalConfig, value: string | number) => {
    setConfig((current) => ({ ...current, [field]: value }));
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(apiUrl('/api/config/fiscal'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Erro ao salvar configuração.');

      setConfig(await response.json());
      setMessage('Configuração fiscal salva.');
    } catch (error: any) {
      setMessage(error.message || 'Erro ao salvar configuração.');
    } finally {
      setSaving(false);
    }
  };

  const uploadCertificate = async () => {
    if (!certificateFile) {
      setMessage('Selecione um certificado .pfx ou .p12.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('certificate', certificateFile);
      formData.append('password', certificatePassword);

      const response = await fetch(apiUrl('/api/config/certificate'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || 'Erro ao enviar certificado.');
      }

      setConfig(await response.json());
      setCertificateFile(null);
      setCertificatePassword('');
      onCertificateLoaded();
      setMessage('Certificado validado e salvo no backend local.');
    } catch (error: any) {
      setMessage(error.message || 'Erro ao enviar certificado.');
    } finally {
      setSaving(false);
    }
  };

  const testSefaz = async () => {
    setTestingSefaz(true);
    setMessage('');
    try {
      const response = await fetch(apiUrl('/api/sefaz/status'));
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao consultar status da SEFAZ.');
      }

      setMessage(`SEFAZ respondeu ${data.cStat}: ${data.xMotivo}${data.tlsWarning ? ` (${data.tlsWarning})` : ''}`);
    } catch (error: any) {
      setMessage(error.message || 'Erro ao consultar status da SEFAZ.');
    } finally {
      setTestingSefaz(false);
    }
  };

  if (loading) {
    return <div className="p-20 text-center font-black text-slate-300 uppercase tracking-widest">Carregando configuração fiscal...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Configuração Fiscal</h2>
        <p className="text-slate-500 font-bold mt-1">Dados usados pelo backend local para montar, assinar e emitir NFC-e na SEFAZ-PB.</p>
      </div>

      {message && (
        <div className="bg-sky-50 border border-sky-100 text-sky-700 px-6 py-4 rounded-2xl text-sm font-bold">
          {message}
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Empresa e Município</h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Razão Social</label>
              <input value={config.companyName} onChange={(e) => updateField('companyName', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">CNPJ</label>
              <input value={config.cnpj} onChange={(e) => updateField('cnpj', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Inscrição Estadual</label>
              <input value={config.stateRegistration} onChange={(e) => updateField('stateRegistration', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Município</label>
              <input value={config.cityName} onChange={(e) => updateField('cityName', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Código IBGE</label>
              <input value={config.cityCode} onChange={(e) => updateField('cityCode', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50" />
            </div>
          </div>
        </div>

        <div className="col-span-5 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">NFC-e e SEFAZ</h3>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">CSC</label>
            <input value={config.csc} onChange={(e) => updateField('csc', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">ID CSC</label>
            <input value={config.cscId} onChange={(e) => updateField('cscId', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Série</label>
              <input type="number" value={config.nfceSerie} onChange={(e) => updateField('nfceSerie', Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Próximo Nº</label>
              <input type="number" value={config.nextNfceNumber} onChange={(e) => updateField('nextNfceNumber', Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Regime Tributário</label>
            <select value={config.taxRegime} onChange={(e) => updateField('taxRegime', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50">
              <option value="simples">Simples Nacional</option>
              <option value="normal">Regime Normal</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Ambiente</label>
            <select value={config.environment} onChange={(e) => updateField('environment', e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50">
              <option value="local">Local Simulado</option>
              <option value="homologacao">Homologação</option>
              <option value="producao">Produção</option>
            </select>
          </div>
          <button onClick={saveConfig} disabled={saving} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 disabled:opacity-40 uppercase tracking-widest text-xs">
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </button>
          <button onClick={testSefaz} disabled={testingSefaz || saving} className="w-full bg-sky-600 text-white font-black py-5 rounded-2xl hover:bg-sky-700 disabled:opacity-40 uppercase tracking-widest text-xs">
            {testingSefaz ? 'Consultando SEFAZ...' : 'Testar SEFAZ Real'}
          </button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm grid grid-cols-12 gap-8 items-end">
        <div className="col-span-5">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-5">Certificado A1</h3>
          {config.certificate ? (
            <div className="space-y-2 text-sm font-bold text-slate-500">
              <p>Atual: {config.certificate.fileName}</p>
              {config.certificate.validTo && (
                <p>Valido ate: {new Date(config.certificate.validTo).toLocaleDateString('pt-BR')}</p>
              )}
              {config.certificate.subjectName && (
                <p className="text-xs leading-snug break-words">Titular: {config.certificate.subjectName}</p>
              )}
            </div>
          ) : (
            <p className="text-sm font-bold text-slate-500">Nenhum certificado salvo no backend.</p>
          )}
        </div>
        <div className="col-span-3">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Arquivo .pfx/.p12</label>
          <input type="file" accept=".pfx,.p12" onChange={(e) => setCertificateFile(e.target.files?.[0] || null)} className="w-full text-xs font-bold text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-3 file:text-xs file:font-black file:uppercase file:text-white" />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Senha</label>
          <input type="password" value={certificatePassword} onChange={(e) => setCertificatePassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-sky-500/50" />
        </div>
        <div className="col-span-2">
          <button onClick={uploadCertificate} disabled={saving} className="w-full bg-sky-600 text-white font-black py-5 rounded-2xl hover:bg-sky-700 disabled:opacity-40 uppercase tracking-widest text-xs">
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE DE VENDA ---
const SaleView = ({ certificate, onEmit }: any) => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [received, setReceived] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  if (!certificate.isLoaded) return (
    <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] shadow-sm border border-slate-200">
      <div className="bg-amber-100 text-amber-600 p-6 rounded-3xl mb-6"><svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
      <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Venda Bloqueada</h3>
      <p className="text-slate-500 font-bold">Você precisa configurar o certificado A1 para emitir cupons.</p>
    </div>
  );

  const total = items.reduce((acc, i) => acc + i.total, 0);
  const change = received >= total && total > 0 ? received - total : 0;

  const handleFinish = async () => {
    if (items.length === 0) return;
    if (received < total && total > 0) {
      alert("O valor recebido é menor que o total da venda!");
      return;
    }
    
    setLoading(true);
    try {
      await onEmit(items, total, received);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Erro crítico ao emitir. O sistema foi resetado para segurança.");
    } finally {
      // GARANTE que o loading pare, independente do que aconteça
      setLoading(false);
      setItems([]);
      setReceived(0);
      setQty(1);
    }
  };

  const addItem = () => {
    const p = MOCK_PRODUCTS.find(x => x.id === selectedId);
    if (p && qty > 0) {
      setItems([...items, { product: p, quantity: qty, total: p.price * qty }]);
      setSelectedId('');
      setQty(1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="col-span-8 space-y-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="font-black text-sky-600 mb-8 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
            <span className="w-6 h-[2px] bg-sky-600"></span> Itens do Pedido
          </h3>
          <div className="grid grid-cols-12 gap-6 items-end">
            <div className="col-span-6">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Serviço / Produto</label>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all appearance-none">
                <option value="">Escolha um item...</option>
                {MOCK_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name} - NCM {p.ncm} - R$ {p.price.toFixed(2)}</option>)}
              </select>
            </div>
            <div className="col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Quantidade</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-center text-slate-700 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 transition-all" />
            </div>
            <div className="col-span-3">
              <button onClick={addItem} disabled={!selectedId} className="w-full bg-slate-900 text-white font-black h-[60px] rounded-2xl hover:bg-slate-800 disabled:opacity-20 shadow-xl transition-all uppercase text-[10px] tracking-widest active:scale-95">Incluir</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden min-h-[450px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 px-8 py-5 uppercase tracking-widest border-b border-slate-100">
              <tr><th className="px-10 py-6">Descrição</th><th className="px-10 py-6 text-center">Qtd</th><th className="px-10 py-6 text-right">Unitário</th><th className="px-10 py-6 text-right">Subtotal</th><th className="px-10 py-6"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6 font-black text-slate-800 uppercase text-xs tracking-tight">
                    {it.product.name}
                    <span className="block mt-1 text-[9px] text-slate-400 tracking-widest">NCM {it.product.ncm}</span>
                  </td>
                  <td className="px-10 py-6 text-center font-black text-slate-900 text-base">{it.quantity}</td>
                  <td className="px-10 py-6 text-right font-bold text-slate-400 text-xs">R$ {it.product.price.toFixed(2)}</td>
                  <td className="px-10 py-6 text-right font-black text-slate-900 text-base">R$ {it.total.toFixed(2)}</td>
                  <td className="px-10 py-6 text-right"><button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500 font-black text-[10px] uppercase p-2 transition-all">Remover</button></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-40 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      <p className="font-black uppercase tracking-[0.3em] text-xs">Carrinho Vazio</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAINEL DE FECHAMENTO */}
      <div className="col-span-4">
        <div className="bg-sky-600 text-white p-10 rounded-[3.5rem] shadow-[0_20px_50px_rgba(14,165,233,0.3)] space-y-10 sticky top-10 border-4 border-white/10">
          <div>
            <p className="text-[10px] font-black uppercase text-sky-100/50 tracking-[0.2em] mb-4">Total à Pagar</p>
            <p className="text-6xl font-black tracking-tighter">R$ {total.toFixed(2)}</p>
          </div>

          <div className="space-y-6 pt-10 border-t border-white/10">
            <div>
              <label className="text-[10px] font-black uppercase text-sky-200 mb-3 block tracking-widest">Valor Recebido (Dinheiro)</label>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-sky-300 text-xl transition-all group-focus-within:text-white">R$</span>
                <input type="number" step="0.01" value={received || ''} onChange={e => setReceived(Number(e.target.value))} className="w-full bg-white/10 border-2 border-white/10 rounded-[2rem] py-6 pl-16 pr-6 text-3xl font-black placeholder:text-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all" placeholder="0,00" />
              </div>
            </div>

            {received > 0 && (
              <div className="bg-white/10 p-6 rounded-[2rem] flex justify-between items-center animate-in slide-in-from-top-2">
                <span className="text-[10px] font-black uppercase text-sky-100 tracking-widest">Troco</span>
                <span className="text-3xl font-black text-emerald-300 tracking-tighter">R$ {change.toFixed(2)}</span>
              </div>
            )}
          </div>

          <button onClick={handleFinish} disabled={items.length === 0 || loading || (total > 0 && received < total)} 
            className="w-full bg-white text-sky-700 py-8 rounded-[2rem] font-black text-xl hover:bg-sky-50 shadow-2xl disabled:opacity-30 flex items-center justify-center gap-4 transition-all active:scale-95 uppercase tracking-widest border-b-4 border-sky-700/20">
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                <span>Processando...</span>
              </div>
            ) : 'Gerar Cupom Local'}
          </button>
          
          <div className="flex flex-col items-center gap-2 opacity-50">
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-pulse"></span>
                <p className="text-[9px] font-black uppercase tracking-widest">MODO LOCAL SIMULADO</p>
             </div>
             <p className="text-[8px] font-bold text-sky-200 uppercase">Sem autorização SEFAZ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PREVIEW DO CUPOM ---
const CouponPreview = ({ coupon, onClose }: any) => {
  const [exporting, setExporting] = useState(false);

  const handlePDF = async () => {
    const el = document.getElementById('coupon-content');
    if (!el) return;
    setExporting(true);
    try {
      const html2canvas = (window as any).html2canvas;
      const { jsPDF } = (window as any).jspdf;
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, (canvas.height * 80) / canvas.width] });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height * 80) / canvas.width);
      pdf.save(`cupom_bicho_pelo_${coupon.number}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm no-print" onClick={onClose}></div>
      <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] flex flex-col max-h-[95vh] overflow-hidden z-10 print-container border-4 border-white">
        
        {/* Header Modal */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white no-print">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${coupon.status === 'AUTORIZADA' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`}></div>
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">{coupon.status === 'AUTORIZADA' ? 'Cupom Autorizado' : 'Cupom Simulado'}</h3>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        {/* Área Visual do Cupom */}
        <div className="flex-1 overflow-auto p-10 bg-slate-100 flex flex-col items-center print:bg-white print:p-0">
          <div id="coupon-content" className="bg-white p-10 shadow-sm font-mono text-[10px] leading-tight text-black w-full border-t-[12px] border-sky-600 print:shadow-none print:w-full print:border-none">
            <div className="text-center space-y-1.5 mb-8">
              <h2 className="text-[14px] font-black uppercase tracking-tight">{COMPANY.name}</h2>
              <p className="font-black text-[11px]">CNPJ: {COMPANY.cnpj}</p>
              <p className="text-[8px] uppercase font-bold leading-tight px-4">{COMPANY.address}</p>
            </div>

            <div className="text-center py-3 border-y-2 border-dashed border-black mb-6 uppercase">
              <p className="font-black text-[10px]">{coupon.status === 'AUTORIZADA' ? 'DANFE NFC-e' : 'Pré-DANFE NFC-e'}</p>
              <p className="text-[7px] font-bold opacity-70">{coupon.status === 'AUTORIZADA' ? 'Doc. Auxiliar da Nota Fiscal Eletrônica' : 'Documento local sem autorização da SEFAZ'}</p>
            </div>

            <table className="w-full mb-6 text-black border-collapse">
              <thead>
                <tr className="border-b-2 border-black text-left font-black text-[9px] uppercase">
                  <th className="pb-2">Desc</th>
                  <th className="pb-2 text-center">Qtd</th>
                  <th className="pb-2 text-right">Unit</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-black/30">
                {coupon.items.map((it: any, idx: number) => (
                  <tr key={idx} className="align-top">
                    <td className="py-3 pr-2 font-bold uppercase leading-tight">
                      {it.product.name}
                      <span className="block text-[6px] opacity-50 mt-1">NCM {it.product.ncm}</span>
                    </td>
                    <td className="py-3 text-center font-black">{it.quantity}</td>
                    <td className="py-3 text-right font-bold">{it.product.price.toFixed(2)}</td>
                    <td className="py-3 text-right font-black">{it.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-2 border-t-2 border-black pt-4 mb-8">
              <div className="flex justify-between font-black text-[12px] uppercase tracking-tighter">
                <span>VALOR TOTAL R$</span>
                <span>{coupon.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-[9px] pt-2 border-t border-black/10">
                <span>VALOR RECEBIDO</span>
                <span>{coupon.amountReceived.toFixed(2)}</span>
              </div>
              {coupon.change > 0 && (
                <div className="flex justify-between font-black text-[10px] text-slate-800 pt-1">
                  <span>TROCO R$</span>
                  <span>{coupon.change.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="text-[8px] space-y-6 text-center">
              <div className="bg-black/5 p-4 border border-black/10 font-black uppercase leading-tight rounded-lg">
                <p>{coupon.status === 'AUTORIZADA' ? 'Consulte pela Chave de Acesso em:' : 'Sem consulta fiscal válida'}</p>
                <p className="break-all mt-2 text-[7px] selection:bg-black selection:text-white">{coupon.status === 'AUTORIZADA' ? 'www.sefaz.pb.gov.br/nfce' : 'Aguardando integração real com a SEFAZ-PB'}</p>
              </div>
              <div className="px-2">
                <p className="font-black uppercase tracking-[0.2em] text-[7px] mb-1 opacity-50">Chave de Acesso</p>
                <p className="font-black tracking-widest text-[9px] leading-tight">{coupon.chNFe?.match(/.{1,4}/g)?.join(' ')}</p>
              </div>
              <div className="pt-4 border-t-2 border-dashed border-black leading-snug font-black uppercase opacity-90 text-[8.5px]">
                <p>NFC-e nº {String(coupon.number).padStart(6, '0')} Série {coupon.serie}</p>
                <p>Emissão: {new Date(coupon.date).toLocaleString('pt-BR')}</p>
                <p>{coupon.status === 'AUTORIZADA' ? 'Protocolo' : 'Protocolo local'}: {coupon.protocol}</p>
                <p>Status: {coupon.status || 'SIMULADA'} / Assinatura: {coupon.signatureStatus || 'NÃO INFORMADA'}</p>
              </div>
              {coupon.qrCode && (
                <div className="flex flex-col items-center gap-3 pt-6 border-t-2 border-dashed border-black">
                  <div className="bg-white p-2 border-2 border-black/5 rounded-xl">
                    <img src={coupon.qrCode} className="w-32 h-32 mix-blend-multiply" alt="QR Code" />
                  </div>
                  <p className="uppercase font-black tracking-[0.3em] text-[6px] opacity-40">Consulta via QR Code</p>
                </div>
              )}
            </div>
            
            <div className="mt-10 pt-4 border-t border-black/10 text-center opacity-30 italic font-bold text-[7px] uppercase tracking-widest">
              Obrigado pela preferência!
            </div>
          </div>
        </div>

        {/* Botões Finais */}
        <div className="p-8 bg-white border-t border-slate-100 flex gap-4 no-print">
          <button onClick={handlePDF} disabled={exporting} className="flex-1 bg-sky-600 text-white font-black py-5 rounded-2xl hover:bg-sky-700 shadow-xl transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95">
            {exporting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
            Baixar Cupom PDF
          </button>
          <button onClick={() => window.print()} className="px-8 bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all uppercase text-[10px] tracking-widest active:scale-95">
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

// --- RENDERIZAR NO HTML ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
