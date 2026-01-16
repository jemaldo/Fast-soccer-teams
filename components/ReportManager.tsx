
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
  Filter,
  Layers
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
  const [selectedReport, setSelectedReport] = useState<'INDIVIDUAL' | 'CATEGORY'>('INDIVIDUAL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  const handlePrint = () => {
    // Al llamar a window.print() con los estilos CSS implementados abajo,
    // se imprimirá exclusivamente la sección con clase .print-only
    window.print();
  };

  const debtors = useMemo(() => students.filter(s => !s.isPaidUp), [students]);

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

      monthsStatus.push({ monthName, isBeforeEntry, isFuture, isPaid: hasPayment, monthIndex: month });
    }
    const monthsOwed = monthsStatus.filter(m => !m.isPaid && !m.isBeforeEntry && !m.isFuture).length;
    return { monthsStatus, monthsOwed };
  };

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [selectedStudentId, students]);
  const debtInfo = useMemo(() => selectedStudent ? getStudentDebtStatus(selectedStudent) : null, [selectedStudent, reportYear, payments]);

  const categoryStudents = useMemo(() => students.filter(s => s.category === selectedCategoryId), [selectedCategoryId, students]);
  const categoryDebtData = useMemo(() => {
    if (!selectedCategoryId) return [];
    return categoryStudents.map(student => ({ student, debt: getStudentDebtStatus(student) }));
  }, [categoryStudents, reportYear, payments]);

  const handleExportExcel = (type: string) => {
    let sheets: { name: string; data: any[] }[] = [];
    let fileName = `Reporte_${type}_${new Date().toISOString().split('T')[0]}`;
    switch (type) {
      case 'MOROSOS':
        sheets = [{ name: "Alumnos Morosos", data: debtors.map(s => ({ Nombre: s.fullName, Documento: s.dni, Categoria: s.category, Telefono: s.phone, Acudiente: s.parents[0]?.name || 'N/A' })) }];
        break;
      case 'FINANCIERO':
        sheets = [
          { name: "Ingresos", data: cashFlow.filter(t => t.type === 'INCOME').map(t => ({ Fecha: t.date, Concepto: t.description, Monto: t.amount })) },
          { name: "Egresos", data: cashFlow.filter(t => t.type === 'OUTCOME').map(t => ({ Fecha: t.date, Concepto: t.description, Monto: t.amount })) }
        ];
        break;
      case 'ALUMNOS_FULL':
        sheets = [{ name: "Maestro Alumnos", data: students.map(s => ({ Nombre: s.fullName, DNI: s.dni, Categoria: s.category, Estado: s.isPaidUp ? 'Paz y Salvo' : 'Moroso' })) }];
        break;
    }
    if (sheets.length > 0) exportWorkbook(sheets, fileName);
  };

  const paidVsUnpaidData = [{ name: 'Paz y Salvo', value: students.length - debtors.length, color: '#10b981' }, { name: 'Morosos', value: debtors.length, color: '#ef4444' }];
  const monthsHeader = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div><h3 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Informes</h3><p className="text-slate-500 text-sm font-medium">Análisis de rendimiento y control de cartera.</p></div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button onClick={() => setSelectedReport('INDIVIDUAL')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition ${selectedReport === 'INDIVIDUAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Individual</button>
          <button onClick={() => setSelectedReport('CATEGORY')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition ${selectedReport === 'CATEGORY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Por Categoría</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-tighter">
              {selectedReport === 'INDIVIDUAL' ? <><CalendarDays className="w-6 h-6 text-blue-600" /> Seguimiento Individual</> : <><Layers className="w-6 h-6 text-purple-600" /> Estado por Categoría</>}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedReport === 'INDIVIDUAL' ? (
                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                    <option value="">Seleccionar Alumno...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.category})</option>)}
                  </select>
                </div>
              ) : (
                <div className="relative"><Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-purple-500 transition" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
                    <option value="">Seleccionar Categoría...</option>
                    {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition" value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>Año Fiscal {y}</option>)}
              </select>
            </div>
          </div>

          <div className="p-8 flex-1 overflow-x-auto">
            {selectedReport === 'INDIVIDUAL' ? (
              !selectedStudent ? (<div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12"><div className="bg-slate-50 p-6 rounded-full"><UserIcon className="w-12 h-12 opacity-20" /></div><p className="text-sm font-bold uppercase tracking-widest italic text-center">Selecciona un alumno para ver su estado</p></div>) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-100"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg">{selectedStudent.fullName.charAt(0)}</div><div><p className="text-lg font-black text-slate-900">{selectedStudent.fullName}</p><p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Ingreso: {new Date(selectedStudent.entryDate).toLocaleDateString()}</p></div></div><div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Meses Adeudados ({reportYear})</p><div className="flex items-center gap-3 justify-end"><span className={`text-3xl font-black ${debtInfo?.monthsOwed === 0 ? 'text-emerald-600' : 'text-red-600'}`}>{debtInfo?.monthsOwed}</span>{debtInfo?.monthsOwed === 0 ? (<CheckCircle2 className="w-8 h-8 text-emerald-500" />) : (<AlertCircle className="w-8 h-8 text-red-500" />)}</div></div></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {debtInfo?.monthsStatus.map((m, idx) => (<div key={idx} className={`p-4 rounded-2xl border text-center transition-all relative overflow-hidden ${m.isBeforeEntry ? 'bg-slate-50 border-slate-100 opacity-40 grayscale' : m.isFuture ? 'bg-slate-50 border-slate-100 border-dashed opacity-60' : m.isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200 shadow-sm'}`}><p className="text-[10px] font-black uppercase text-slate-400 mb-1">{m.monthName}</p><div className="flex justify-center py-2">{m.isPaid ? (<CheckCircle2 className="w-6 h-6 text-emerald-600" />) : m.isBeforeEntry ? (<div className="h-6 flex items-center text-[10px] font-black text-slate-300 uppercase italic">N/A</div>) : m.isFuture ? (<div className="h-6 flex items-center text-[10px] font-black text-slate-300 uppercase">Futuro</div>) : (<AlertCircle className="w-6 h-6 text-red-600" />)}</div></div>))}
                  </div>
                  <div className="bg-slate-900 rounded-3xl p-6 text-white flex justify-between items-center"><div className="flex items-center gap-4"><div className="bg-white/10 p-3 rounded-2xl"><CreditCard className="w-6 h-6 text-blue-400" /></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen de Cartera</p><p className="text-sm font-bold">Estado actual para el año {reportYear}</p></div></div><button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-blue-900/40"><Printer className="w-4 h-4" /> Imprimir Reporte</button></div>
                </div>
              )
            ) : (
              !selectedCategoryId ? (<div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12"><div className="bg-slate-50 p-6 rounded-full"><Layers className="w-12 h-12 opacity-20" /></div><p className="text-sm font-bold uppercase tracking-widest italic text-center">Selecciona una categoría para generar el reporte</p></div>) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center"><div><h5 className="text-lg font-black text-slate-800 uppercase tracking-tight">Categoría: {selectedCategoryId}</h5><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{categoryStudents.length} Alumnos Registrados</p></div><button onClick={handlePrint} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition"><Printer className="w-4 h-4" /> Imprimir Planilla</button></div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto"><table className="w-full text-xs text-left border-collapse"><thead><tr className="bg-slate-900 text-white"><th className="p-3 font-black uppercase tracking-tighter sticky left-0 bg-slate-900 z-10">Alumno</th>{monthsHeader.map(m => (<th key={m} className="p-3 text-center font-black uppercase tracking-tighter">{m}</th>))}<th className="p-3 text-center font-black uppercase tracking-tighter bg-slate-800">Debe</th></tr></thead><tbody className="divide-y divide-slate-100">{categoryDebtData.map(({ student, debt }) => (<tr key={student.id} className="hover:bg-slate-50"><td className="p-3 font-bold text-slate-800 sticky left-0 bg-white border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)] whitespace-nowrap">{student.fullName}</td>{debt?.monthsStatus.map((m, mIdx) => (<td key={mIdx} className="p-2 text-center">{m.isPaid ? (<div className="w-5 h-5 rounded-full bg-emerald-500 mx-auto flex items-center justify-center text-[8px] text-white font-black"><CheckCircle2 className="w-3.5 h-3.5" /></div>) : m.isBeforeEntry || m.isFuture ? (<div className="w-5 h-5 rounded-full bg-slate-100 mx-auto border border-slate-200"></div>) : (<div className="w-5 h-5 rounded-full bg-red-500 mx-auto flex items-center justify-center text-white"><AlertCircle className="w-3.5 h-3.5" /></div>)}</td>))}<td className="p-3 text-center font-black text-red-600 bg-red-50/30">{debt?.monthsOwed}</td></tr>))}</tbody></table></div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"><h4 className="font-black text-slate-800 flex items-center gap-2 mb-6 uppercase tracking-tighter"><TrendingUp className="w-5 h-5 text-emerald-500" /> Exportaciones Excel</h4><div className="space-y-3"><button onClick={() => handleExportExcel('MOROSOS')} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-2xl text-xs font-black transition"><span>Reporte Morosos</span><Download className="w-4 h-4" /></button><button onClick={() => handleExportExcel('FINANCIERO')} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-2xl text-xs font-black transition"><span>Flujo de Caja</span><Download className="w-4 h-4" /></button></div></div>
        </div>
      </div>

      {/* ÁREA DE IMPRESIÓN (Invisible en web, visible en print) */}
      <div className="hidden print:block print:bg-white print:p-0">
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">{schoolSettings.name}</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Reporte Oficial de Cartera - {reportYear}</p>
            <p className="text-slate-400 text-[10px] mt-1">NIT: {schoolSettings.nit} | {schoolSettings.address}</p>
          </div>
          <div className="text-right text-xs font-black">FECHA: {new Date().toLocaleDateString()}</div>
        </div>
        {selectedReport === 'INDIVIDUAL' && selectedStudent && (
          <div className="space-y-8">
            <h2 className="text-xl font-black text-slate-800 mb-2 uppercase">Alumno: {selectedStudent.fullName}</h2>
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead><tr className="bg-slate-100"><th className="p-3 border border-slate-200 font-black uppercase">Mes</th><th className="p-3 border border-slate-200 font-black uppercase text-center">Estado</th></tr></thead>
              <tbody>{debtInfo?.monthsStatus.map((m, idx) => (<tr key={idx}><td className="p-3 border border-slate-200 font-bold">{m.monthName}</td><td className="p-3 border border-slate-200 text-center font-black">{m.isPaid ? 'PAGADO' : 'PENDIENTE'}</td></tr>))}</tbody>
            </table>
          </div>
        )}
        {selectedReport === 'CATEGORY' && selectedCategoryId && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Categoría: {selectedCategoryId}</h2>
            <table className="w-full text-[9px] text-left border-collapse border border-slate-300">
              <thead><tr className="bg-slate-100"><th className="p-2 border border-slate-300 font-black uppercase">Alumno</th>{monthsHeader.map(m => (<th key={m} className="p-2 border border-slate-300 text-center font-black uppercase">{m}</th>))}<th className="p-2 border border-slate-300 text-center font-black uppercase">Ojos</th></tr></thead>
              <tbody>{categoryDebtData.map(({ student, debt }) => (<tr key={student.id}><td className="p-2 border border-slate-300 font-bold">{student.fullName}</td>{debt?.monthsStatus.map((m, mIdx) => (<td key={mIdx} className="p-2 border border-slate-300 text-center">{m.isPaid ? 'SI' : 'NO'}</td>))}<td className="p-2 border border-slate-300 text-center font-black">{debt?.monthsOwed}</td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { margin: 2cm; }
          .no-print { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; margin: 0 !important; }
          aside, header { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportManager;
