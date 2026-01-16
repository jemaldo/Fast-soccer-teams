
import React, { useState } from 'react';
import { CashTransaction, SchoolSettings } from '../types';
import { 
  Plus, Search, TrendingUp, TrendingDown, RefreshCw, Printer, 
  AlertTriangle, Receipt, X, Trophy, Banknote, Stamp, PlayCircle
} from 'lucide-react';

interface Props {
  cashFlow: CashTransaction[];
  setCashFlow: React.Dispatch<React.SetStateAction<CashTransaction[]>>;
  schoolSettings: SchoolSettings;
}

const FinanceManager: React.FC<Props> = ({ cashFlow, setCashFlow, schoolSettings }) => {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'INCOME' | 'OUTCOME' | 'OPENING'>('INCOME');
  const [selectedReceipt, setSelectedReceipt] = useState<CashTransaction | null>(null);

  const totalIncome = cashFlow.filter(t => t.type === 'INCOME' || t.type === 'OPENING').reduce((acc, curr) => acc + curr.amount, 0);
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
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Saldo Total</p>
          <p className="text-4xl font-black tracking-tighter">${balance.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6">
          <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-lg"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos</p><p className="text-2xl font-black text-emerald-600">+${totalIncome.toLocaleString()}</p></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center gap-6">
          <div className="bg-red-500 p-4 rounded-2xl text-white shadow-lg"><TrendingDown className="w-6 h-6" /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Egresos</p><p className="text-2xl font-black text-red-600">-${totalOutcome.toLocaleString()}</p></div>
        </div>
        <button 
          onClick={() => { setTransactionType('OPENING'); setShowTransactionModal(true); }}
          className="bg-blue-600 text-white p-8 rounded-[2.5rem] flex flex-col items-center justify-center hover:bg-blue-700 transition shadow-xl"
        >
          <PlayCircle className="w-8 h-8 mb-2" />
          <span className="text-xs font-black uppercase tracking-widest">Abrir Caja</span>
        </button>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden no-print">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><RefreshCw className="w-6 h-6 text-blue-600" /> Movimientos de Caja</h3>
          <div className="flex gap-3">
            <button onClick={() => { setTransactionType('INCOME'); setShowTransactionModal(true); }} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg">Registrar Ingreso</button>
            <button onClick={() => { setTransactionType('OUTCOME'); setShowTransactionModal(true); }} className="bg-red-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition shadow-lg">Registrar Egreso</button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white"><tr className="text-[10px] font-black uppercase tracking-widest"><th className="px-8 py-5">Fecha</th><th className="px-8 py-5">Concepto / Tipo</th><th className="px-8 py-5">Monto</th><th className="px-8 py-5 text-right">Acción</th></tr></thead>
          <tbody className="divide-y">
            {cashFlow.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition">
                <td className="px-8 py-5 text-xs font-bold text-slate-400">{tx.date}</td>
                <td className="px-8 py-5">
                   <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{tx.description}</p>
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${tx.type === 'OPENING' ? 'bg-blue-100 text-blue-600' : tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{tx.type}</span>
                </td>
                <td className={`px-8 py-5 font-black text-sm ${tx.type === 'OUTCOME' ? 'text-red-600' : 'text-emerald-600'}`}>{tx.type === 'OUTCOME' ? '-' : '+'}${tx.amount.toLocaleString()}</td>
                <td className="px-8 py-5 text-right"><button onClick={() => handlePrintReceipt(tx)} className="p-3 text-slate-400 hover:text-blue-600 transition"><Printer className="w-5 h-5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showTransactionModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
            <div className={`p-8 text-white font-black uppercase tracking-widest flex justify-between items-center ${transactionType === 'OPENING' ? 'bg-blue-600' : transactionType === 'INCOME' ? 'bg-emerald-600' : 'bg-red-600'}`}>
              <h3 className="text-sm">{transactionType === 'OPENING' ? 'Apertura de Caja' : transactionType === 'INCOME' ? 'Ingreso' : 'Egreso'}</h3>
              <button onClick={() => setShowTransactionModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveTransaction} className="p-10 space-y-6">
              <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Monto ($)</label><input type="number" name="amount" required className="w-full px-6 py-4 bg-slate-50 border rounded-2xl text-2xl font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition" autoFocus placeholder="0" /></div>
              <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Descripción</label><textarea name="description" required className="w-full px-6 py-4 bg-slate-50 border rounded-2xl h-32 font-bold text-sm outline-none resize-none" placeholder={transactionType === 'OPENING' ? 'Saldo inicial del día...' : 'Especifique concepto...'}></textarea></div>
              <button type="submit" className={`w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition shadow-xl ${transactionType === 'OPENING' ? 'bg-blue-600' : transactionType === 'INCOME' ? 'bg-emerald-600' : 'bg-red-600'}`}>Confirmar Movimiento</button>
            </form>
          </div>
        </div>
      )}

      {selectedReceipt && (
        <div className="print-only bg-white p-12 text-slate-900 min-h-screen">
          <div className="border-[4px] border-slate-900 p-10 rounded-[3rem] h-full flex flex-col relative overflow-hidden">
             <div className="flex justify-between items-start border-b-[4px] border-slate-900 pb-8 mb-8">
               <div className="flex gap-6 items-center">{schoolSettings.logo ? <img src={schoolSettings.logo} className="w-20 h-20 object-contain" /> : <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">AD</div>}<div><h1 className="text-2xl font-black uppercase text-slate-900 leading-none">{schoolSettings.name}</h1><p className="text-[9px] font-bold text-slate-500 mt-1 uppercase">SOPORTE DE MOVIMIENTO CONTABLE</p></div></div>
               <div className="text-right"><div className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase">{selectedReceipt.type}</div><p className="text-[10px] font-black text-slate-400 mt-2">FECHA: {selectedReceipt.date}</p></div>
             </div>
             <div className="flex-1 space-y-12">
               <div className="grid grid-cols-2 gap-10"><div><label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Concepto:</label><p className="text-sm font-bold text-slate-800 uppercase leading-relaxed border-b pb-2">{selectedReceipt.description}</p></div><div className="bg-slate-50 p-8 rounded-[2.5rem] border flex flex-col items-center justify-center"><label className="text-[9px] font-black uppercase text-slate-400 mb-1">Monto:</label><p className="text-5xl font-black text-slate-900 tracking-tighter">${selectedReceipt.amount.toLocaleString()}</p></div></div>
               <div className="grid grid-cols-2 gap-20 pt-20"><div className="border-t-2 border-slate-900 pt-3 text-center text-[10px] font-black uppercase">Firma Autorizada</div><div className="border-t-2 border-slate-900 pt-3 text-center text-[10px] font-black uppercase">Firma Recibido</div></div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
