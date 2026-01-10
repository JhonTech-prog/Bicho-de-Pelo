
import React, { useState } from 'react';
import { CertificateData } from '../types';

interface CertificateFormProps {
  certificate: CertificateData;
  setCertificate: (data: CertificateData) => void;
}

export const CertificateForm: React.FC<CertificateFormProps> = ({ certificate, setCertificate }) => {
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      // Simulate reading certificate info
      setTimeout(() => {
        setCertificate({
          fileName: file.name,
          expiryDate: '2025-12-31',
          subject: 'BICHO DE PELO PETSHOP LTDA',
          isLoaded: true
        });
        setIsProcessing(false);
      }, 1000);
    }
  };

  const removeCertificate = () => {
    setCertificate({
      fileName: '',
      expiryDate: '',
      subject: '',
      isLoaded: false
    });
    setPassword('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {!certificate.isLoaded ? (
        <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Certificado Digital A1</h3>
          <p className="text-slate-500 text-sm mb-8 max-w-sm">
            Para emitir cupons fiscais, você precisa carregar o seu certificado digital em formato .pfx ou .p12.
          </p>
          
          <label className="cursor-pointer bg-slate-900 text-white font-bold px-8 py-3 rounded-2xl hover:bg-slate-800 transition-colors inline-block">
            {isProcessing ? 'Processando...' : 'Selecionar Arquivo'}
            <input 
              type="file" 
              className="hidden" 
              accept=".pfx,.p12"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 -mr-16 -mt-16 rounded-full opacity-50"></div>
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-sky-500 text-white rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{certificate.subject}</h4>
                  <p className="text-xs text-slate-500">{certificate.fileName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-6 border-y border-slate-100 mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Ativo</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expira em</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(certificate.expiryDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha do Certificado</label>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <p className="mt-2 text-[10px] text-slate-400">
                    A senha é necessária para assinar digitalmente os arquivos XML enviados à SEFAZ.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={removeCertificate}
                    className="flex-1 text-red-600 font-bold text-sm py-3 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Remover Certificado
                  </button>
                  <button 
                    disabled={!password}
                    className="flex-1 bg-slate-900 text-white font-bold text-sm py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    Testar Conexão SEFAZ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100">
        <h5 className="font-bold text-sky-800 text-sm mb-2">Sobre o Certificado A1</h5>
        <ul className="text-xs text-sky-700 space-y-2 leading-relaxed">
          <li className="flex gap-2">
            <span className="text-sky-400">•</span>
            O certificado A1 é um arquivo digital que fica armazenado no computador.
          </li>
          <li className="flex gap-2">
            <span className="text-sky-400">•</span>
            Ele permite a automação da emissão sem necessidade de token físico.
          </li>
          <li className="flex gap-2">
            <span className="text-sky-400">•</span>
            Seus dados são processados localmente e nunca são compartilhados.
          </li>
        </ul>
      </div>
    </div>
  );
};
