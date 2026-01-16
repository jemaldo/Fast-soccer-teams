
import React, { useMemo, useState } from 'react';
import { Student, Teacher, Payment, CashTransaction, SchoolSettings } from '../types';
import { exportWorkbook } from '../services/excelService';
import { 
  FileText, Download, Printer, Users, UserX, TrendingUp, TrendingDown, 
  FileSpreadsheet, ChevronRight, PieChart as PieChartIcon, Search, 
  School, CalendarDays, CheckCircle2, AlertCircle, ArrowRight, 
  CreditCard, User as UserIcon, Trophy, Receipt, Banknote, Stamp,
  MapPin, Filter, ClipboardList
} from 'lucide-react';

interface Props {
  students: Student[];
  teachers: Teacher[];
  payments: Payment[];
  cashFlow: CashTransaction[];
  schoolSettings: SchoolSettings;
}

const ReportManager: React.FC<Props> = ({ students, teachers, payments, cashFlow, schoolSettings }) => {
  const [activeTab, setActiveTab] = useState<'CARTERA' | 'RECIBOS'>('CARTERA');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  const handlePrint = (type: string, data?: any) => {
    setSelectedReport(type);
    if (data) setSelectedReceipt(data);
    
    setTimeout(() => {
      window.print();
      
      const cleanup = () => {
        setSelectedReport(null);
        setSelectedReceipt(null);
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      setTimeout(cleanup, 2000);
    }, 700);
  };

  const getStudentDebtStatus = (student: Student) => {
    if (!student) return { monthsStatus: [], monthsOwed: 0 };
    const entryDate = new Date(student.entryDate);
    const today = new Date();
    const monthsStatus = [];
    const studentPayments = payments.filter(p => p.targetId === student.id && p.type === 'STUDENT_MONTHLY');

    for (let month = 0; month < 12; month++) {
      const currentMonthDate = new Date(reportYear, month, 1);
      const isBeforeEntry = currentMonthDate < new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
      const isFuture = currentMonthDate > new Date(today.getFullYear(), today.getMonth(), 1);
      const monthName = currentMonthDate.toLocaleString('es-ES', { month: 'long' });
      
      const hasPayment = studentPayments.some(p => {
        const pDate = new Date(p.date);
        const descMatch = p.description.toLowerCase().includes(monthName.toLowerCase()) && 
                         p.description.includes(reportYear.toString());
        const dateMatch = pDate.getMonth() === month && pDate.getFullYear() === reportYear;
        return descMatch || dateMatch;
      });

      monthsStatus.push({
        monthName,
        isBeforeEntry,
        isFuture,
        isPaid: hasPayment,
        monthIndex: month
      });
    }

    const monthsOwed = monthsStatus.filter(m => !m.isPaid && !m.isBeforeEntry && !m.isFuture).length;
    return { monthsStatus, monthsOwed };
  };

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [selectedStudentId, students]);
  const debtInfo = useMemo(() => selectedStudent ? getStudentDebtStatus(selectedStudent) : null, [selectedStudent, reportYear, payments]);

  const categoryDebtData = useMemo(() => {
    return students
      .filter(s => !selectedCategory || s.category === selectedCategory)
      .map(s => {
        const { monthsStatus, monthsOwed } = getStudentDebtStatus(s);
        const pendingMonths = monthsStatus
          .filter(m => !m.isPaid && !m.isBeforeEntry && !m.isFuture)
          .map(m => m.monthName)
          .join(', ');
        return { ...s, monthsOwed, pendingMonths };
      })
      .filter(s => s.monthsOwed > 0)
      .sort((a, b) => b.monthsOwed - a.monthsOwed);
  }, [students, selectedCategory, reportYear, payments]);

  const recentPayments = useMemo(() => {
    return cashFlow.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashFlow]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Reportes e Impresión</h3>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Gestión administrativa de cartera y recibos</p>
        </div>
        <div className="flex bg-slate-200 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('CARTERA')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'CARTERA' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Estado Cartera
          </button>
          <button 
            onClick={() => setActiveTab('RECIBOS')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'RECIBOS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Emitir Recibos
          </button>
        </div>
      </div>

      {activeTab === 'CARTERA' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print animate-in fade-in duration-500">
          {/* Individual Report */}
          <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-tighter">
                <CalendarDays className="w-6 h-6 text-blue-600" /> Auditoría Individual
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select 
                  className="w-full pl-6 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">Seleccionar Alumno...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                </select>
                <input 
                  type="number" 
                  value={reportYear} 
                  onChange={(e) => setReportYear(parseInt(e.target.value))}
                  className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div className="p-8 flex-1">
              {!selectedStudent ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12">
                  <UserIcon className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">Selecciona un alumno para ver su estado</p>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                    <div>
                        <p className="text-lg font-black text-slate-900 uppercase">{selectedStudent.fullName}</p>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">DNI: {selectedStudent.dni}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Meses Pendientes</p>
                      <span className={`text-3xl font-black ${debtInfo?.monthsOwed === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {debtInfo?.monthsOwed}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {debtInfo?.monthsStatus.map((m, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl border text-center ${m.isPaid ? 'bg-emerald-50 border-emerald-200' : (m.isBeforeEntry || m.isFuture) ? 'bg-slate-50 border-slate-100 opacity-40' : 'bg-red-50 border-red-200'}`}>
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{m.monthName.substring(0,3)}</p>
                        <div className="flex justify-center">
                          {m.isPaid ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : (m.isBeforeEntry || m.isFuture) ? <div className="w-5 h-5" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={() => handlePrint('STUDENT_DEBT')} className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition shadow-2xl">
                    <Printer className="w-4 h-4" /> Imprimir Estado Individual
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category/Aggregate Report */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-6">
              <h4 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                <ClipboardList className="w-6 h-6 text-purple-600" /> Cartera por Categoría
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Seleccionar Categoría</label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase appearance-none outline-none focus:ring-4 focus:ring-purple-500/5 transition"
                  >
                    <option value="">Todas las Categorías</option>
                    {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 max-h-[400px] overflow-y-auto space-y-3">
                  {categoryDebtData.length === 0 ? (
                    <div className="text-center py-10">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-30" />
                      <p className="text-[10px] font-black text-slate-400 uppercase">No hay deudas en esta categoría</p>
                    </div>
                  ) : (
                    categoryDebtData.map(s => (
                      <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-purple-200 transition">
                        <div>
                          <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{s.fullName}</p>
                          <p className="text-[9px] font-bold text-red-500 uppercase">{s.monthsOwed} Meses: <span className="text-slate-400 font-medium lowercase italic">{s.pendingMonths}</span></p>
                        </div>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      </div>
                    ))
                  )}
                </div>

                <button 
                  onClick={() => handlePrint('CATEGORY_DEBT')}
                  disabled={categoryDebtData.length === 0}
                  className="w-full flex items-center justify-center gap-3 bg-purple-600 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition shadow-xl shadow-purple-100 disabled:opacity-50 disabled:bg-slate-300"
                >
                  <Printer className="w-4 h-4" /> Imprimir Informe de Categoría
                </button>
                
                <button 
                  onClick={() => exportWorkbook([{ name: "Deuda_Categoría", data: categoryDebtData.map(s => ({ Nombre: s.fullName, DNI: s.dni, Meses: s.monthsOwed, Detalle: s.pendingMonths })) }], "REPORTE_CARTERA")}
                  disabled={categoryDebtData.length === 0}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'RECIBOS' && (
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden no-print animate-in fade-in duration-500">
           <div className="p-10 border-b bg-slate-50/50">
              <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                 <Receipt className="w-7 h-7 text-blue-600" /> Historial de Transacciones
              </h4>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-900 text-white">
                    <tr>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Fecha</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Concepto</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Monto</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Acción</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {recentPayments.map(tx => (
                       <tr key={tx.id} className="hover:bg-slate-50 transition">
                          <td className="px-8 py-5 text-sm font-bold text-slate-500">{tx.date}</td>
                          <td className="px-8 py-5 text-sm font-black text-slate-800 uppercase tracking-tight">{tx.description}</td>
                          <td className={`px-8 py-5 text-right font-black text-sm ${tx.type === 'INCOME' || tx.type === 'OPENING' ? 'text-emerald-600' : 'text-red-600'}`}>
                             ${tx.amount.toLocaleString()}
                          </td>
                          <td className="px-8 py-5 text-center">
                             <button 
                                onClick={() => handlePrint(tx.type === 'INCOME' || tx.type === 'OPENING' ? 'RECEIPT_INCOME' : 'RECEIPT_OUTCOME', tx)}
                                className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl transition font-black text-[9px] uppercase tracking-widest"
                             >
                                <Printer className="w-3 h-3" /> Imprimir
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* COMPONENTES DE IMPRESIÓN */}
      {selectedReport && (
        <div className="print-only bg-white p-12 min-h-screen">
          <div className="border-[6px] border-slate-900 p-10 rounded-[4rem] h-full flex flex-col relative overflow-hidden bg-white">
            <div className="flex justify-between items-start border-b-[4px] border-slate-900 pb-10 mb-10">
                 <div className="flex gap-8 items-center">
                    {schoolSettings.logo ? (
                       <img src={schoolSettings.logo} className="w-24 h-24 object-contain" />
                    ) : (
                       <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">AD</div>
                    )}
                    <div>
                       <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">{schoolSettings.name}</h1>
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">SISTEMA PRO-MANAGER</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest mb-1">
                       {selectedReport === 'STUDENT_DEBT' ? 'ESTADO DE CUENTA' : selectedReport === 'CATEGORY_DEBT' ? 'INFORME DE CARTERA' : 'RECIBO OFICIAL'}
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-400">FECHA: {new Date().toLocaleDateString()}</p>
                 </div>
            </div>

            {selectedReport === 'STUDENT_DEBT' && selectedStudent && (
              <div className="space-y-6">
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h2 className="text-xl font-black text-slate-900 uppercase leading-none mb-2">Atleta: {selectedStudent.fullName}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase">DNI: {selectedStudent.dni} | CATEGORÍA: {selectedStudent.category} | AÑO: {reportYear}</p>
                 </div>
                 <table className="w-full text-left text-xs border-collapse border border-slate-900">
                   <thead><tr className="bg-slate-900 text-white"><th className="p-3 border border-slate-900 font-black uppercase tracking-widest">Mes de Mensualidad</th><th className="p-3 border border-slate-900 font-black uppercase text-center tracking-widest">Estado Contable</th></tr></thead>
                   <tbody>
                     {debtInfo?.monthsStatus.map((m, idx) => (
                       <tr key={idx} className={m.isPaid ? 'bg-emerald-50' : (m.isBeforeEntry || m.isFuture) ? 'bg-slate-50 text-slate-300' : 'bg-red-50'}>
                         <td className="p-3 border border-slate-900 font-bold uppercase">{m.monthName}</td>
                         <td className="p-3 border border-slate-900 text-center font-black">
                           {m.isPaid ? 'PAGADO' : (m.isBeforeEntry || m.isFuture) ? 'N/A' : 'EN MORA'}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 <div className="p-6 bg-slate-900 text-white rounded-[2rem] text-center shadow-xl">
                    <p className="text-lg font-black uppercase tracking-widest">Resumen: {debtInfo?.monthsOwed} Meses adeudados</p>
                    <p className="text-[10px] font-bold opacity-60 uppercase mt-1">Auditoría Financiera {reportYear}</p>
                 </div>
              </div>
            )}

            {selectedReport === 'CATEGORY_DEBT' && (
              <div className="space-y-8">
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h2 className="text-2xl font-black text-slate-900 uppercase leading-none mb-2">Informe General de Deudores</h2>
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">CATEGORÍA: {selectedCategory || 'TODAS'} | AÑO: {reportYear}</p>
                 </div>
                 <table className="w-full text-left text-[10px] border-collapse border border-slate-900">
                   <thead>
                     <tr className="bg-slate-900 text-white font-black uppercase tracking-widest">
                       <th className="p-4 border border-slate-900 w-1/3">Nombre del Atleta</th>
                       <th className="p-4 border border-slate-900 text-center">Meses Pendientes</th>
                       <th className="p-4 border border-slate-900">Detalle de Meses en Mora</th>
                     </tr>
                   </thead>
                   <tbody>
                     {categoryDebtData.map((s, idx) => (
                       <tr key={idx} className="hover:bg-slate-50 transition">
                         <td className="p-4 border border-slate-900 font-black uppercase">{s.fullName}</td>
                         <td className="p-4 border border-slate-900 text-center font-black text-red-600 bg-red-50">{s.monthsOwed}</td>
                         <td className="p-4 border border-slate-900 font-bold uppercase text-slate-600">{s.pendingMonths}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] flex flex-col items-center justify-center">
                       <p className="text-[9px] font-black uppercase opacity-60 mb-1">Total Deudores</p>
                       <p className="text-3xl font-black">{categoryDebtData.length}</p>
                    </div>
                    <div className="p-6 bg-purple-600 text-white rounded-[2.5rem] flex flex-col items-center justify-center">
                       <p className="text-[9px] font-black uppercase opacity-60 mb-1">Impacto en Cartera</p>
                       <p className="text-3xl font-black">{categoryDebtData.reduce((acc, curr) => acc + curr.monthsOwed, 0)} Meses</p>
                    </div>
                 </div>
              </div>
            )}

            {(selectedReport === 'RECEIPT_INCOME' || selectedReport === 'RECEIPT_OUTCOME') && selectedReceipt && (
               <div className="space-y-12">
                  <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-3xl border">
                           <label className="text-[9px] font-black uppercase text-slate-400 block mb-2">Concepto de la Operación:</label>
                           <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase">{selectedReceipt.description}</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl border">
                           <label className="text-[9px] font-black uppercase text-slate-400 block mb-2">Usuario Responsable:</label>
                           <p className="text-sm font-black text-slate-900 uppercase">{selectedReceipt.user}</p>
                        </div>
                     </div>
                     <div className="bg-slate-900 p-10 rounded-[4rem] text-white flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <label className="text-[10px] font-black uppercase text-blue-400 mb-2 relative z-10">Suma Total Recibida:</label>
                        <p className="text-5xl font-black tracking-tighter relative z-10">${selectedReceipt.amount.toLocaleString()}</p>
                        <p className="text-[9px] font-black uppercase text-slate-400 mt-4 relative z-10">MONEDA LEGAL COLOMBIANA</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-20 pt-20">
                     <div className="border-t-[3px] border-slate-900 pt-4 text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-900">Autorizado por Tesorería</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Sello Digital Válido</p>
                     </div>
                     <div className="border-t-[3px] border-slate-900 pt-4 text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-900">Firma del Interesado</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">C.C. / NIT</p>
                     </div>
                  </div>
               </div>
            )}
            
            <div className="mt-auto p-8 border-[4px] border-dashed border-slate-100 rounded-[3rem] text-center">
                 <p className="text-[10px] font-bold italic text-slate-400 leading-relaxed uppercase">
                    Este documento es un soporte oficial generado por la plataforma de gestión deportiva de {schoolSettings.name}. <br/>
                    Cualquier alteración anula la validez legal del mismo.
                 </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManager;
