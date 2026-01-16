
import React, { useMemo, useState } from 'react';
import { Student, Teacher, Payment, CashTransaction, SchoolSettings } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  FileText, 
  Download, 
  Printer, 
  Users, 
  UserX, 
  TrendingUp, 
  TrendingDown, 
  FileSpreadsheet, 
  ChevronRight,
  PieChart as PieChartIcon,
  Search,
  School,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CreditCard,
  User as UserIcon,
  Trophy,
  Receipt,
  Banknote,
  Stamp
} from 'lucide-react';
import { exportWorkbook } from '../services/excelService';

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
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  const handlePrint = (type: string, data?: any) => {
    setSelectedReport(type);
    if (data) setSelectedReceipt(data);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const getStudentDebtStatus = (student: Student) => {
    if (!student) return null;
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

  const recentPayments = useMemo(() => {
    return cashFlow.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashFlow]);

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Inteligencia de Negocio</h3>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Reportes ejecutivos y emisión de documentos</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print animate-in fade-in duration-500">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-tighter">
                <CalendarDays className="w-6 h-6 text-blue-600" /> Seguimiento de Mensualidades
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select 
                  className="w-full pl-6 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">Seleccionar Alumno...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.category})</option>)}
                </select>
                <select 
                  className="w-full px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>Año Fiscal {y}</option>)}
                </select>
              </div>
            </div>

            <div className="p-8 flex-1">
              {!selectedStudent ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12">
                  <div className="bg-slate-50 p-6 rounded-full"><UserIcon className="w-12 h-12 opacity-20" /></div>
                  <p className="text-xs font-black uppercase tracking-widest text-center">Selecciona un alumno para auditoría</p>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg overflow-hidden">
                        {selectedStudent.photo ? <img src={selectedStudent.photo} className="w-full h-full object-cover" /> : selectedStudent.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900">{selectedStudent.fullName}</p>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">DNI: {selectedStudent.dni}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Meses Pendientes</p>
                      <div className="flex items-center gap-3 justify-end">
                        <span className={`text-3xl font-black ${debtInfo?.monthsOwed === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {debtInfo?.monthsOwed}
                        </span>
                        {debtInfo?.monthsOwed === 0 ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <AlertCircle className="w-8 h-8 text-red-500" />}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {debtInfo?.monthsStatus.map((m, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl border text-center transition-all ${m.isBeforeEntry || m.isFuture ? 'bg-slate-50 opacity-40' : m.isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200 shadow-sm'}`}>
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{m.monthName.substring(0,3)}</p>
                        <div className="flex justify-center">
                          {m.isPaid ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : m.isBeforeEntry || m.isFuture ? <span className="text-[8px] font-bold text-slate-300">N/A</span> : <AlertCircle className="w-5 h-5 text-red-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={() => handlePrint('STUDENT_DEBT')} className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition shadow-2xl">
                    <Printer className="w-4 h-4" /> Generar Estado de Cuenta Oficial
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h4 className="font-black text-slate-800 flex items-center gap-2 mb-6 uppercase tracking-tighter">Acciones Rápidas</h4>
              <div className="space-y-3">
                <button onClick={() => exportWorkbook([{ name: "Morosos", data: students.filter(s => !s.isPaidUp) }], "REPORTE_MOROSOS")} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-2xl text-[10px] font-black uppercase transition">
                  <span>Exportar Morosos</span> <Download className="w-4 h-4" />
                </button>
                <button onClick={() => exportWorkbook([{ name: "Finanzas", data: cashFlow }], "REPORTE_FINANCIERO")} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-2xl text-[10px] font-black uppercase transition">
                  <span>Exportar Finanzas</span> <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'RECIBOS' && (
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden no-print animate-in slide-in-from-bottom-4 duration-500">
           <div className="p-10 border-b bg-slate-50/50">
              <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                 <Receipt className="w-7 h-7 text-blue-600" /> Historial de Transacciones para Recibos
              </h4>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Selecciona un movimiento para emitir el comprobante físico</p>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-900 text-white">
                    <tr>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Fecha</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Concepto / Detalle</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Tipo</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Monto</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Acción</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {recentPayments.map(tx => (
                       <tr key={tx.id} className="hover:bg-slate-50 transition">
                          <td className="px-8 py-5 text-sm font-bold text-slate-500">{tx.date}</td>
                          <td className="px-8 py-5 text-sm font-black text-slate-800 uppercase tracking-tight">{tx.description}</td>
                          <td className="px-8 py-5">
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                {tx.type === 'INCOME' ? 'Ingreso / Mensualidad' : 'Egreso / Nómina'}
                             </span>
                          </td>
                          <td className={`px-8 py-5 text-right font-black text-sm ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                             {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toLocaleString()}
                          </td>
                          <td className="px-8 py-5 text-center">
                             <button 
                                onClick={() => handlePrint(tx.type === 'INCOME' ? 'RECEIPT_INCOME' : 'RECEIPT_OUTCOME', tx)}
                                className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl transition font-black text-[9px] uppercase tracking-widest"
                             >
                                <Printer className="w-3 h-3" /> Imprimir Recibo
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* PRINT TEMPLATES */}
      <div className="print-only bg-white p-8">
        {/* Cabecera Estándar (Logo cargado) */}
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-center">
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
             <div className="bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest mb-1">
                {selectedReport === 'RECEIPT_INCOME' ? 'RECIBO DE CAJA' : selectedReport === 'RECEIPT_OUTCOME' ? 'COMPROBANTE EGRESO' : 'ESTADO DE CUENTA'}
             </div>
             <p className="text-[10px] font-black uppercase text-slate-400">FECHA: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* CONTENIDO SEGÚN EL REPORTE */}
        {selectedReport === 'STUDENT_DEBT' && selectedStudent && (
          <div className="space-y-6">
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
               <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter italic">Auditoría: {selectedStudent.fullName}</h2>
               <p className="text-[10px] font-bold text-slate-500 uppercase">DOCUMENTO: {selectedStudent.dni} | CATEGORÍA: {selectedStudent.category} | POSICIÓN: {selectedStudent.position}</p>
             </div>
             <table className="w-full text-left text-xs border-collapse border border-slate-200">
               <thead><tr className="bg-slate-100"><th className="p-3 border border-slate-200 font-black uppercase">MES ({reportYear})</th><th className="p-3 border border-slate-200 font-black uppercase text-center">ESTADO</th></tr></thead>
               <tbody>
                 {debtInfo?.monthsStatus.map((m, idx) => (
                   <tr key={idx} className={m.isBeforeEntry || m.isFuture ? 'bg-slate-50 opacity-40' : ''}>
                     <td className="p-3 border border-slate-200 font-bold uppercase">{m.monthName}</td>
                     <td className="p-3 border border-slate-200 text-center font-black">{m.isPaid ? 'PAGADO' : 'PENDIENTE'}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
             <div className="p-4 bg-slate-900 text-white rounded-xl text-center"><p className="text-sm font-black uppercase tracking-widest">Resumen: {debtInfo?.monthsOwed} Meses adeudados en el ciclo fiscal {reportYear}.</p></div>
          </div>
        )}

        {(selectedReport === 'RECEIPT_INCOME' || selectedReport === 'RECEIPT_OUTCOME') && selectedReceipt && (
           <div className="space-y-12">
              <div className="grid grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <div>
                       <label className="text-[9px] font-black uppercase text-slate-400 block">Recibido de/Pagado a:</label>
                       <p className="text-lg font-black border-b-2 border-slate-100 pb-1">{selectedReceipt.description.split('-')[0].trim() || 'Caja General'}</p>
                    </div>
                    <div>
                       <label className="text-[9px] font-black uppercase text-slate-400 block">Concepto del Pago:</label>
                       <p className="text-sm font-bold text-slate-700">{selectedReceipt.description}</p>
                    </div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2">Suma Total de:</label>
                    <p className="text-4xl font-black text-slate-900">${selectedReceipt.amount.toLocaleString()}</p>
                    <p className="text-[9px] font-black uppercase text-blue-600 mt-2">Pesos Colombianos M/CTE</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-20 pt-20">
                 <div className="border-t-2 border-slate-900 pt-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest">Firma Autorizada / Sello</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Control Administrativo {schoolSettings.name}</p>
                 </div>
                 <div className="border-t-2 border-slate-900 pt-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest">Firma de Beneficiario / Acudiente</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Recibido Conforme - C.C / NIT</p>
                 </div>
              </div>

              <div className="mt-20 p-6 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                 <p className="text-[9px] font-bold italic text-slate-400 leading-relaxed">
                    Este documento es un soporte oficial generado por el sistema Pro-Manager. <br/>
                    Conserve este recibo para cualquier reclamación o trámite administrativo. <br/>
                    Software desarrollado por Fastsystems Jesus Maldonado Castro.
                 </p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default ReportManager;
