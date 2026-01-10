
import React from 'react';
import { Coupon } from '../types';

interface DashboardProps {
  coupons: Coupon[];
  onEmitClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ coupons, onEmitClick }) => {
  const totalSales = coupons.reduce((acc, c) => acc + (c.status === 'AUTORIZADA' ? c.total : 0), 0);
  const totalCount = coupons.length;
  const lastCoupons = coupons.slice(-5).reverse();

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Total de Vendas (Hoje)</p>
          <h3 className="text-3xl font-bold text-slate-900">R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-4 flex items-center gap-1 text-emerald-600 text-xs font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
            </svg>
            12% vs ontem
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Cupons Emitidos</p>
          <h3 className="text-3xl font-bold text-slate-900">{totalCount}</h3>
          <div className="mt-4 flex items-center gap-1 text-sky-600 text-xs font-medium">
             Sem erros detectados
          </div>
        </div>

        <div className="bg-sky-500 p-6 rounded-3xl shadow-xl shadow-sky-500/20 text-white flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-sky-100 mb-1">Ação Rápida</p>
            <h3 className="text-xl font-bold">Nova Venda</h3>
          </div>
          <button 
            onClick={onEmitClick}
            className="mt-4 w-full bg-white text-sky-600 font-bold py-2 rounded-xl hover:bg-sky-50 transition-colors"
          >
            Emitir Cupom Agora
          </button>
        </div>
      </div>

      {/* Last Transactions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-slate-800">Últimas Emissões</h4>
          <button className="text-sm text-sky-600 font-semibold hover:underline">Ver todas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-3">Número</th>
                <th className="px-6 py-3">Data/Hora</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lastCoupons.length > 0 ? lastCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-slate-700">#{coupon.number}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(coupon.date).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      coupon.status === 'AUTORIZADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {coupon.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">
                    R$ {coupon.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                    Nenhuma emissão realizada hoje.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
