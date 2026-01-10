
import React, { useState, useEffect } from 'react';
import { AppView, Coupon, CompanyInfo, CertificateData } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SaleForm } from './components/SaleForm';
import { CertificateForm } from './components/CertificateForm';
import { CouponPreview } from './components/CouponPreview';

const DEFAULT_COMPANY: CompanyInfo = {
  name: 'BICHO DE PELO PETSHOP LTDA',
  fantasyName: 'Bicho de Pelo',
  cnpj: '12.345.678/0001-90',
  ie: '123456789',
  address: 'Rua Principal, 123, João Pessoa - PB',
  csc: 'ABCDEF1234567890',
  cscId: '000001',
  environment: 'homologacao'
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [certificate, setCertificate] = useState<CertificateData>({
    fileName: '',
    expiryDate: '',
    subject: '',
    isLoaded: false
  });
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Persistence (Simulated)
  useEffect(() => {
    const saved = localStorage.getItem('bicho_pelo_coupons');
    if (saved) setCoupons(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('bicho_pelo_coupons', JSON.stringify(coupons));
  }, [coupons]);

  const handleSaleSuccess = (newCoupon: Coupon) => {
    setCoupons([...coupons, newCoupon]);
    setSelectedCoupon(newCoupon);
  };

  const renderContent = () => {
    switch (activeView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            coupons={coupons} 
            onEmitClick={() => setActiveView(AppView.EMITIR)} 
          />
        );
      case AppView.EMITIR:
        if (!certificate.isLoaded) {
          return (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
               <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.34c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
               </div>
               <h3 className="text-xl font-bold text-slate-800">Certificado Requerido</h3>
               <p className="text-slate-500 max-w-sm">Você precisa carregar o certificado digital A1 antes de poder emitir cupons fiscais.</p>
               <button 
                onClick={() => setActiveView(AppView.CERTIFICADO)}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors"
               >
                 Configurar Certificado
               </button>
            </div>
          );
        }
        return <SaleForm onSuccess={handleSaleSuccess} />;
      case AppView.CERTIFICADO:
        return <CertificateForm certificate={certificate} setCertificate={setCertificate} />;
      case AppView.HISTORICO:
        return (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-3">Número</th>
                  <th className="px-6 py-3">Data/Hora</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Protocolo</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.length > 0 ? coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-xs font-bold">#{coupon.number}</td>
                    <td className="px-6 py-4 text-xs">{new Date(coupon.date).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        coupon.status === 'AUTORIZADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {coupon.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{coupon.protocol || '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-sm">R$ {coupon.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedCoupon(coupon)}
                        className="p-2 text-slate-400 hover:text-sky-600 transition-colors"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400">Nenhum cupom emitido até o momento.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case AppView.CONFIGURACOES:
        return (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Dados da Empresa</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Razão Social</label>
                <input type="text" value={company.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" disabled />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CNPJ</label>
                <input type="text" value={company.cnpj} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" disabled />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ambiente SEFAZ</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
                  <option value="homologacao">Homologação (Teste)</option>
                  <option value="producao">Produção (Valor Fiscal)</option>
                </select>
              </div>
              <div className="col-span-2">
                 <h4 className="font-bold text-slate-800 text-sm mt-4 mb-2">Configurações de Contingência</h4>
                 <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <input type="checkbox" className="w-4 h-4 text-sky-500 rounded border-slate-300" />
                    <span className="text-sm text-slate-700">Ativar modo offline (EPEC) automaticamente se SEFAZ-PB cair.</span>
                 </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Layout activeView={activeView} setActiveView={setActiveView}>
        {renderContent()}
      </Layout>

      {selectedCoupon && (
        <CouponPreview 
          coupon={selectedCoupon} 
          company={company} 
          onClose={() => setSelectedCoupon(null)} 
        />
      )}
    </>
  );
};

export default App;
