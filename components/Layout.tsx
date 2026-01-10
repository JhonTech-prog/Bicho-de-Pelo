
import React from 'react';
import { AppView } from '../types';
import { ICONS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: ICONS.Dashboard },
    { id: AppView.EMITIR, label: 'Emitir NFC-e', icon: ICONS.Emit },
    { id: AppView.HISTORICO, label: 'Histórico', icon: ICONS.History },
    { id: AppView.CERTIFICADO, label: 'Certificado A1', icon: ICONS.Certificate },
    { id: AppView.CONFIGURACOES, label: 'Configurações', icon: ICONS.Settings },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 no-print">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-sky-500 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Bicho de Pelo</h1>
              <p className="text-xs text-slate-400">Sistema Fiscal v1.0</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeView === item.id 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
              JD
            </div>
            <div>
              <p className="text-xs font-semibold">João Dantas</p>
              <p className="text-[10px] text-slate-500">Operador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 no-print">
          <h2 className="text-xl font-semibold text-slate-800">
            {menuItems.find(m => m.id === activeView)?.label}
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               SEFAZ-PB Online
             </div>
          </div>
        </header>
        
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
