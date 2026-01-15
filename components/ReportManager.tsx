
import React, { useMemo, useState } from 'react';
import { Student, Teacher, Payment, CashTransaction } from '../types';
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
  User as UserIcon
} from 'lucide-react';
import { exportWorkbook } from '../services/excelService';
import { CATEGORIES } from '../constants';

interface Props {
  students: Student[];
  teachers: Teacher[];
  payments: Payment[];
  cashFlow: CashTransaction[];
}

const ReportManager: React.FC<Props> = ({ students, teachers, payments, cashFlow }) => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  // Added handlePrint function to trigger the print dialog and track current report type
  const handlePrint = (type: string) => {
    setSelectedReport(type);
    window.print();
  };

  // Datos financieros consolidados
  const finances = useMemo(() => {
    const incomes = cashFlow.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
    const outcomes = cashFlow.filter(t => t.type === 'OUTCOME').reduce((acc, curr) => acc + curr.amount, 0);
    return { incomes, outcomes, balance: incomes - outcomes };
  }, [cashFlow]);

  // Alumnos morosos
  const debtors = useMemo(() => students.filter(s => !s.isPaidUp), [students]);

  // Lógica para saber qué meses debe un alumno
  const getStudentDebtStatus = (student: Student) => {
    if (!student) return null;

    const entryDate = new Date(student.entryDate);
    const today = new Date();
    const monthsStatus = [];
    
    // Obtenemos los pagos del alumno
    const studentPayments = payments.filter(p => p.targetId === student.id && p.type === 'STUDENT_MONTHLY');

    // Iteramos los 12 meses del año seleccionado
    for (let month = 0; month < 12; month++) {
      const currentMonthDate = new Date(reportYear, month, 1);
      
      // ¿El mes es anterior a su ingreso?
      const isBeforeEntry = currentMonthDate < new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
      
      // ¿El mes es posterior al mes actual?
      const isFuture = currentMonthDate > new Date(today.getFullYear(), today.getMonth(), 1);

      // Buscamos si hay un pago para este mes y año
      // Buscamos en la descripción (ej: "Mensualidad - enero de 2025") o por fecha
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

  const handleExportExcel = (type: string) => {
    let sheets: { name: string; data: any[] }[] = [];
    let fileName = `Reporte_${type}_${new Date().toISOString().split('T')[0]}`;

    switch (type) {
      case 'MOROSOS':
        sheets = [{
          name: "Alumnos Morosos",
          data: debtors.map(s => ({
            Nombre: s.fullName,
            Documento: s.dni,
            Categoria: s.category,
            Telefono: s.phone,
            Acudiente: s.parents[0]?.name || 'N/A',
            TelefonoAcudiente: s.parents[0]?.phone || 'N/A'
          }))
        }];
        break;
      case 'FINANCIERO':
        sheets = [
          {
            name: "Ingresos",
            data: cashFlow.filter(t => t.type === 'INCOME').map(t => ({ Fecha: t.date, Concepto: t.description, Monto: t.amount, Usuario: t.user }))
          },
          {
            name: "Egresos",
            data: cashFlow.filter(t => t.type === 'OUTCOME').map(t => ({ Fecha: t.date, Concepto: t.description, Monto: t.amount, Usuario: t.user }))
          }
        ];
        break;
      case 'ALUMNOS_FULL':
        sheets = [{
          name: "Listado Maestro Alumnos",
          data: students.map(s => ({
            Nombre: s.fullName,
            DNI: s.dni,
            Edad: s.age,
            RH: s.bloodType,
            Categoria: s.category,
            Posicion: s.position,
            Telefono: s.phone,
            Estado: s.isPaidUp ? 'Paz y Salvo' : 'Moroso'
          }))
        }];
        break;
    }

    if (sheets.length > 0) exportWorkbook(sheets, fileName);
  };

  const paidVsUnpaidData = [
    { name: 'Paz y Salvo', value: students.length - debtors.length, color: '#10b981' },
    { name: 'Morosos', value: debtors.length, color: '#ef4444' }
  ];

  const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Informes</h3>
          <p className="text-slate-500 text-sm font-medium">Análisis de rendimiento y control de cartera.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PANEL DE CARTERA DETALLADA */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col no-print">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-tighter">
              <CalendarDays className="w-6 h-6 text-blue-600" /> Seguimiento de Mensualidades
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">Seleccionar Alumno...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.category})</option>)}
                </select>
              </div>
              <select 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
              >
                {[2023, 2024, 2025].map(y => <option key={y} value={y}>Año Fiscal {y}</option>)}
              </select>
            </div>
          </div>

          <div className="p-8 flex-1">
            {!selectedStudent ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12">
                <div className="bg-slate-50 p-6 rounded-full">
                  <UserIcon className="w-12 h-12 opacity-20" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest italic">Selecciona un alumno para ver su estado</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                      {selectedStudent.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900">{selectedStudent.fullName}</p>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Ingreso: {new Date(selectedStudent.entryDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Meses Adeudados ({reportYear})</p>
                    <div className="flex items-center gap-3 justify-end">
                      <span className={`text-3xl font-black ${debtInfo?.monthsOwed === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {debtInfo?.monthsOwed}
                      </span>
                      {debtInfo?.monthsOwed === 0 ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {debtInfo?.monthsStatus.map((m, idx) => (
                    <div 
                      key={idx} 
                      className={`
                        p-4 rounded-2xl border text-center transition-all relative overflow-hidden
                        ${m.isBeforeEntry ? 'bg-slate-50 border-slate-100 opacity-40 grayscale' : 
                          m.isFuture ? 'bg-slate-50 border-slate-100 border-dashed opacity-60' :
                          m.isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200 shadow-sm'}
                      `}
                    >
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{m.monthName}</p>
                      <div className="flex justify-center py-2">
                        {m.isPaid ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        ) : m.isBeforeEntry ? (
                          <div className="h-6 flex items-center text-[10px] font-black text-slate-300 uppercase italic">N/A</div>
                        ) : m.isFuture ? (
                          <div className="h-6 flex items-center text-[10px] font-black text-slate-300 uppercase">Futuro</div>
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <p className={`text-[9px] font-black uppercase mt-1 ${m.isPaid ? 'text-emerald-700' : m.isBeforeEntry ? 'text-slate-300' : m.isFuture ? 'text-slate-300' : 'text-red-700'}`}>
                        {m.isPaid ? 'Pagado' : m.isBeforeEntry ? 'Previo' : m.isFuture ? 'Por llegar' : 'DEUDA'}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="bg-slate-900 rounded-3xl p-6 text-white flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen de Cartera</p>
                      <p className="text-sm font-bold">Estado actual para el año {reportYear}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePrint('STUDENT_DEBT')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-blue-900/40"
                  >
                    <Printer className="w-4 h-4" /> Exportar Informe
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* OTROS REPORTES (Resumen rápido) */}
        <div className="space-y-6 no-print">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h4 className="font-black text-slate-800 flex items-center gap-2 mb-6 uppercase tracking-tighter">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Acciones Rápidas
            </h4>
            <div className="space-y-3">
              <button 
                onClick={() => handleExportExcel('MOROSOS')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-2xl text-xs font-black transition border border-transparent hover:border-red-100"
              >
                <span>Reporte Morosos (Excel)</span>
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleExportExcel('FINANCIERO')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-2xl text-xs font-black transition border border-transparent hover:border-blue-100"
              >
                <span>Flujo de Caja (Excel)</span>
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handlePrint('FINANCES')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-900 text-slate-600 hover:text-white rounded-2xl text-xs font-black transition"
              >
                <span>Balance en PDF</span>
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h4 className="font-black text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-tighter">
              <PieChartIcon className="w-5 h-5 text-blue-500" /> Distribución Global
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paidVsUnpaidData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paidVsUnpaidData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* VISTA DE IMPRESIÓN */}
      <div className="print-only fixed inset-0 bg-white z-[999] p-12">
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Reporte de Cartera</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Academia Deportiva Pro-Manager</p>
          </div>
          <div className="text-right text-xs font-black">
            FECHA: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {selectedStudent && (
          <div className="space-y-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Estado: {selectedStudent.fullName}</h2>
              <p className="text-xs font-bold text-slate-500">Documento: {selectedStudent.dni} | Categoría: {selectedStudent.category}</p>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-3 border border-slate-200 font-black uppercase">Mes ({reportYear})</th>
                  <th className="p-3 border border-slate-200 font-black uppercase text-center">Estado de Pago</th>
                </tr>
              </thead>
              <tbody>
                {debtInfo?.monthsStatus.map((m, idx) => (
                  <tr key={idx} className={m.isBeforeEntry || m.isFuture ? 'bg-slate-50 opacity-40' : ''}>
                    <td className="p-3 border border-slate-200 font-bold">{m.monthName}</td>
                    <td className="p-3 border border-slate-200 text-center font-black">
                      {m.isPaid ? 'PAGADO' : m.isBeforeEntry ? '---' : m.isFuture ? 'PENDIENTE FUTURO' : 'DEUDA PENDIENTE'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-6 bg-slate-900 text-white rounded-xl text-center">
              <p className="text-sm font-black uppercase tracking-widest">Resumen Final: {debtInfo?.monthsOwed} Meses adeudados en el ciclo seleccionado.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportManager;
