
import React, { useState } from 'react';
import { CashTransaction, SchoolSettings } from '../types';
import { 
  Plus, Search, TrendingUp, TrendingDown, RefreshCw, Printer, 
  AlertTriangle, Receipt, X, Trophy, Banknote, Stamp
} from 'lucide-react';

interface Props {
  cashFlow: CashTransaction[];
  setCashFlow: React.Dispatch<React.SetStateAction<CashTransaction[]>>;
  schoolSettings: SchoolSettings;
}

const FinanceManager: React.FC<Props> = ({ cashFlow, setCashFlow, schoolSettings }) => {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'INCOME' | 'OUTCOME'>('INCOME');
  const [selectedReceipt, setSelectedReceipt] = useState<CashTransaction | null>(null);

  const totalIncome = cashFlow.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutcome = cashFlow.filter(t => t.type === 'OUTCOME').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalOutcome;

  const handleSaveTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTx: CashTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: transactionType,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      user: 'admin'
    };
    setCashFlow([newTx, ...cashFlow]);
    setShowTransactionModal(false);
  };

  const handlePrintReceipt = (tx: CashTransaction) => {
    setSelectedReceipt(tx);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleArqueo = () => {
    const physicalAmount = prompt("Ingrese el monto físico contado en caja:");
    if (physicalAmount && !isNaN(Number(physicalAmount))) {
      const diff = Number(physicalAmount) - balance;
      if (diff === 0) {
        alert("¡Arqueo Exitoso! El saldo coincide perfectamente.");
      } else {
        alert(`Diferencia detectada: ${diff > 0 ? '+' : ''}${diff.toLocaleString()}. Revise las transacciones.`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Saldo en Caja</p>
          <p className={`text-4xl font-black ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'} tracking-tighter`}>
            ${balance.toLocaleString()}
          </p>
          <div className="mt-6 flex gap-2">
            <button onClick={handleArqueo} className="flex-1 text-[10px] font-black uppercase tracking-widest py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition">
              Arqueo
            </button>
            <button className="flex-1 text-[10px] font-black uppercase tracking-widest py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition">
              Cierre
            </button>
          </div>
        </div>
        <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm flex items-center gap-6">
          <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-lg shadow-emerald-200"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Ingresos</p>
            <p className="text-2xl font-black text-emerald-700">+${totalIncome.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 shadow-sm flex items-center gap-6">
          <div className="bg-red-500 p-4 rounded-2xl text-white shadow-lg shadow-red-200"><TrendingDown className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-1">Egresos</p>
            <p className="text-2xl font-black text-red-700">-${totalOutcome.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden no-print">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
            <RefreshCw className="w-6 h-6 text-blue-600" /> Historial de Movimientos
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={() => { setTransactionType('INCOME'); setShowTransactionModal(true); }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition flex items-center gap-2 shadow-lg shadow-emerald-100"
            >
              <Plus className="w-4 h-4" /> Ingreso
            </button>
            <button 
              onClick={() => { setTransactionType('OUTCOME'); setShowTransactionModal(true); }}
              className="bg-red-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition flex items-center gap-2 shadow-lg shadow-red-100"
            >
              <Plus className="w-4 h-4" /> Egreso
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Fecha</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Concepto / Detalle</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Monto</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashFlow.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">No hay movimientos registrados</td></tr>
              ) : (
                cashFlow.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition group">
                    <td className="px-8 py-5 text-sm font-bold text-slate-500">{tx.date}</td>
                    <td className="px-8 py-5 text-sm font-black text-slate-800 uppercase tracking-tight">{tx.description}</td>
                    <td className={`px-8 py-5 text-sm font-black ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handlePrintReceipt(tx)}
                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition shadow-sm opacity-0 group-hover:opacity-100"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE TRANSACCIÓN */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
            <div className={`p-8 text-white font-black uppercase tracking-widest flex justify-between items-center ${transactionType === 'INCOME' ? 'bg-emerald-600' : 'bg-red-600'}`}>
              <h3 className="text-sm">{transactionType === 'INCOME' ? 'Nuevo Ingreso de Caja' : 'Nueva Salida / Gasto'}</h3>
              <button onClick={() => setShowTransactionModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveTransaction} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Valor en Pesos ($)</label>
                <input type="number" name="amount" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition" autoFocus placeholder="0.00" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Concepto / Detalle</label>
                <textarea name="description" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl h-32 font-bold text-sm outline-none resize-none" placeholder="Ej: Pago mensualidad Juan Perez - Marzo 2025"></textarea>
              </div>
              <button type="submit" className={`w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition shadow-xl ${transactionType === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'}`}>
                Confirmar y Guardar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DISEÑO DE IMPRESIÓN (RECIBO) */}
      {selectedReceipt && (
        <div className="print-only bg-white p-10 text-slate-900">
          <div className="border-b-4 border-slate-900 pb-8 mb-10 flex justify-between items-center">
            <div className="flex gap-6 items-center">
              {schoolSettings.logo ? (
                <img src={schoolSettings.logo} className="w-24 h-24 object-contain" alt="Logo" />
              ) : (
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300"><Trophy className="w-10 h-10" /></div>
              )}
              <div>
                <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">{schoolSettings.name}</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">NIT: {schoolSettings.nit} | {schoolSettings.address}</p>
                <p className="text-slate-400 text-[9px] font-bold uppercase">{schoolSettings.phone} | {schoolSettings.email}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest mb-2">
                {selectedReceipt.type === 'INCOME' ? 'RECIBO DE CAJA' : 'COMPROBANTE EGRESO'}
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">FECHA: {selectedReceipt.date}</p>
            </div>
          </div>

          <div className="space-y-12">
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Entregado por / Beneficiario:</label>
                  <p className="text-xl font-black border-b-2 border-slate-100 pb-2 uppercase">{selectedReceipt.description.split('-')[0].trim() || 'Caja General'}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Concepto de la Transacción:</label>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase">{selectedReceipt.description}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center shadow-inner">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2">Valor Total:</label>
                <p className="text-5xl font-black text-slate-900 tracking-tighter">${selectedReceipt.amount.toLocaleString()}</p>
                <p className="text-[9px] font-black uppercase text-blue-600 mt-3 tracking-widest">Pesos Colombianos M/CTE</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-24 pt-24">
              <div className="border-t-2 border-slate-900 pt-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest">Firma Autorizada / Sello</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Administración Deportiva</p>
              </div>
              <div className="border-t-2 border-slate-900 pt-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest">Firma Recibido / Beneficiario</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">C.C / NIT: ____________________</p>
              </div>
            </div>

            <div className="mt-24 p-8 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center opacity-60">
              <p className="text-[9px] font-bold italic text-slate-400 leading-relaxed uppercase">
                Este es un soporte administrativo oficial. Conserve este documento para su control personal. <br/>
                Sistema Pro-Manager v3.0 - Desarrollo por Fastsystems.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
