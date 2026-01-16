
import React, { useState, useRef, useMemo } from 'react';
import { Student, Teacher, Payment, BloodType, SchoolSettings } from '../types';
import { 
  Plus, Search, Edit2, Trash2, CreditCard, UserCheck, UserX, Printer, FileUp, FileDown, History, X as CloseIcon, 
  Calendar, Camera, User, Eye, CheckCircle, AlertTriangle, CalendarCheck, Check, ChevronDown, Info, Medal, 
  Users as UsersIcon, CheckCircle2, Ruler, Weight, School as SchoolIcon, GraduationCap, MapPin, Phone as PhoneIcon, AlignLeft,
  Banknote, CalendarDays, ChevronLeft, ChevronRight
} from 'lucide-react';
import { parseExcelFile, downloadTemplate } from '../services/excelService';

interface Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  schoolSettings: SchoolSettings;
  teachers: Teacher[];
}

const StudentManager: React.FC<Props> = ({ students, setStudents, payments, setPayments, schoolSettings, teachers }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [paidStatusFilter, setPaidStatusFilter] = useState<'ALL' | 'PAID' | 'DEBTOR'>('ALL');
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Payment | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [paymentModalStudent, setPaymentModalStudent] = useState<Student | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [paymentYear, setPaymentYear] = useState<number>(new Date().getFullYear());
  const [monthlyAmount, setMonthlyAmount] = useState<number>(50000);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const calculateBMI = (weight: number, height: number) => {
    if (!weight || !height) return 0;
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const birthDate = formData.get('birthDate') as string;
    
    if (!fullName.trim() || !birthDate) {
      alert("Nombre y Fecha de Nacimiento son obligatorios.");
      return;
    }

    const weight = Number(formData.get('weight'));
    const height = Number(formData.get('height'));
    
    const newStudent: Student = {
      id: selectedStudent?.id || Date.now().toString(),
      fullName, 
      dni: formData.get('dni') as string, 
      birthDate,
      age: calculateAge(birthDate),
      bloodType: formData.get('bloodType') as BloodType,
      school: formData.get('school') as string,
      grade: formData.get('grade') as string,
      weight, 
      height, 
      bmi: calculateBMI(weight, height),
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      observations: formData.get('observations') as string,
      category: formData.get('category') as string,
      position: formData.get('position') as string,
      entryDate: formData.get('entryDate') as string,
      isPaidUp: formData.get('isPaidUp') === 'on',
      photo: photoPreview || undefined,
      teacherId: formData.get('teacherId') as string,
      trainingType: formData.get('trainingType') as 'Formativa' | 'Elite',
      parents: [
        { 
          name: formData.get('parentName') as string, 
          phone: formData.get('parentPhone') as string, 
          address: formData.get('parentAddress') as string 
        }
      ]
    };

    if (selectedStudent) {
      setStudents(students.map(s => s.id === selectedStudent.id ? newStudent : s));
    } else {
      setStudents([...students, newStudent]);
    }
    
    setShowForm(false);
    setSelectedStudent(null);
    setPhotoPreview(null);
  };

  const isMonthAlreadyPaid = (monthIndex: number) => {
    if (!paymentModalStudent) return false;
    const monthName = new Date(paymentYear, monthIndex).toLocaleString('es-ES', { month: 'long' });
    return payments.some(p => 
      p.targetId === paymentModalStudent.id && 
      p.type === 'STUDENT_MONTHLY' && 
      p.description.toLowerCase().includes(monthName.toLowerCase()) && 
      p.description.includes(paymentYear.toString())
    );
  };

  const toggleMonthSelection = (monthIndex: number) => {
    if (isMonthAlreadyPaid(monthIndex)) return;
    setSelectedMonths(prev => prev.includes(monthIndex) ? prev.filter(m => m !== monthIndex) : [...prev, monthIndex]);
  };

  const processBatchPayment = () => {
    if (!paymentModalStudent || selectedMonths.length === 0) return;
    
    const newPayments: Payment[] = selectedMonths.map(monthIndex => {
      const monthName = new Date(paymentYear, monthIndex).toLocaleString('es-ES', { month: 'long' });
      return {
        id: (Date.now() + Math.random()).toString(),
        date: new Date().toISOString().split('T')[0],
        amount: monthlyAmount,
        type: 'STUDENT_MONTHLY',
        targetId: paymentModalStudent.id,
        targetName: paymentModalStudent.fullName,
        description: `Mensualidad - ${monthName} de ${paymentYear}`,
        status: 'PAID'
      };
    });

    setPayments([...payments, ...newPayments]);
    setStudents(students.map(s => s.id === paymentModalStudent.id ? { ...s, isPaidUp: true } : s));
    alert(`Se han registrado ${newPayments.length} mensualidades con éxito.`);
    setPaymentModalStudent(null);
    setSelectedMonths([]);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === '' || s.category === categoryFilter;
      const matchesPaidStatus = paidStatusFilter === 'ALL' || (paidStatusFilter === 'PAID' && s.isPaidUp) || (paidStatusFilter === 'DEBTOR' && !s.isPaidUp);
      return matchesSearch && matchesCategory && matchesPaidStatus;
    });
  }, [students, searchTerm, categoryFilter, paidStatusFilter]);

  const historyData = useMemo(() => {
    if (!historyStudentId) return [];
    return payments.filter(p => p.targetId === historyStudentId && p.type === 'STUDENT_MONTHLY').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historyStudentId, payments]);

  const historyStudent = students.find(s => s.id === historyStudentId);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-wrap gap-4 w-full md:w-auto flex-1">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="Buscar por nombre..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
              <option value="">Todas las categorías</option>
              {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={() => { setShowForm(true); setSelectedStudent(null); setPhotoPreview(null); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm transition-all shadow-lg"><Plus className="w-4 h-4" /> Nuevo Alumno</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto no-print">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Alumno</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Categoría</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Estado</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                      {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <User className="text-slate-300" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{student.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">DNI: {student.dni}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase tracking-tighter border border-blue-100">{student.category}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    {student.isPaidUp ? (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-200"><UserCheck className="w-3 h-3" /> Paz y Salvo</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-red-200"><UserX className="w-3 h-3" /> Moroso</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setPaymentModalStudent(student)} title="Registrar Pago" className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"><CreditCard className="w-4 h-4" /></button>
                    <button onClick={() => setHistoryStudentId(student.id)} title="Historial" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><History className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedStudent(student); setPhotoPreview(student.photo || null); setShowForm(true); }} title="Editar" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL PAGO DE MENSUALIDAD (RESTAURADO) */}
      {paymentModalStudent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-emerald-600 text-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center"><Banknote className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Recaudo Mensualidad</h3>
                  <p className="text-xs font-bold text-emerald-100">{paymentModalStudent.fullName}</p>
                </div>
              </div>
              <button onClick={() => setPaymentModalStudent(null)} className="p-2 hover:bg-emerald-700 rounded-full transition"><CloseIcon /></button>
            </div>
            
            <div className="p-8 flex-1 space-y-8">
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Año Fiscal</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPaymentYear(prev => prev - 1)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-lg font-black text-slate-800">{paymentYear}</span>
                    <button onClick={() => setPaymentYear(prev => prev + 1)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monto Mensual</label>
                  <input 
                    type="number" 
                    value={monthlyAmount} 
                    onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-600 outline-none text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                  <span>Seleccionar Meses</span>
                  <span className="text-emerald-600">{selectedMonths.length} seleccionados</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const monthName = new Date(0, i).toLocaleString('es-ES', { month: 'short' });
                    const isPaid = isMonthAlreadyPaid(i);
                    const isSelected = selectedMonths.includes(i);
                    return (
                      <button 
                        key={i} 
                        disabled={isPaid}
                        onClick={() => toggleMonthSelection(i)}
                        className={`
                          py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all
                          ${isPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-600 opacity-60 cursor-not-allowed' : 
                            isSelected ? 'bg-blue-600 border-blue-500 text-white shadow-lg scale-105' : 
                            'bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-300'}
                        `}
                      >
                        {monthName}
                        {isPaid && <Check className="w-3 h-3 mx-auto mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white flex justify-between items-center shadow-xl">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Pagar</p>
                  <p className="text-2xl font-black text-emerald-400">${(selectedMonths.length * monthlyAmount).toLocaleString()}</p>
                </div>
                <button 
                  onClick={processBatchPayment}
                  disabled={selectedMonths.length === 0}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg"
                >
                  Registrar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial Modal */}
      {historyStudentId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg">{historyStudent?.fullName.charAt(0)}</div><div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Historial Financiero</h3><p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{historyStudent?.fullName}</p></div></div>
              <button onClick={() => setHistoryStudentId(null)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition"><CloseIcon /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white border-b-2 border-slate-100 mb-4">
                  <tr><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Concepto</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monto</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Ver Recibo</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historyData.map(p => (
                    <tr key={p.id} className="group hover:bg-slate-50 transition">
                      <td className="py-4 text-sm font-bold text-slate-600">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="py-4 text-sm font-black text-slate-800 uppercase tracking-tighter">{p.description}</td>
                      <td className="py-4 text-sm font-black text-emerald-600">${p.amount.toLocaleString()}</td>
                      <td className="py-4 text-right"><button onClick={() => setViewingReceipt(p)} className="p-2 text-slate-300 group-hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Eye className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECIBO DE PAGO ALUMNO */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 no-print">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="bg-blue-900 p-6 flex justify-between items-center text-white shrink-0">
                 <h3 className="text-sm font-black uppercase tracking-widest">Recibo de Mensualidad</h3>
                 <button onClick={() => setViewingReceipt(null)} className="p-2 hover:bg-white/10 rounded-full transition"><CloseIcon className="w-5 h-5" /></button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                 <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><CheckCircle2 className="w-24 h-24" /></div>
                    
                    <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                       <div>
                          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{schoolSettings.name}</h2>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NIT: {schoolSettings.nit}</p>
                          <p className="text-[9px] font-medium text-slate-400 mt-1">{schoolSettings.address}</p>
                       </div>
                       {schoolSettings.logo && <img src={schoolSettings.logo} className="w-14 h-14 object-contain" alt="Logo" />}
                    </div>

                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4 text-xs">
                          <div><p className="text-slate-400 font-bold uppercase text-[9px]">Alumno</p><p className="font-black text-slate-800">{viewingReceipt.targetName}</p></div>
                          <div className="text-right"><p className="text-slate-400 font-bold uppercase text-[9px]">Fecha</p><p className="font-black text-slate-800">{new Date(viewingReceipt.date).toLocaleDateString()}</p></div>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-slate-400 font-bold uppercase text-[9px] mb-1">Concepto</p>
                          <p className="text-xs font-black text-slate-800 uppercase">{viewingReceipt.description}</p>
                       </div>
                    </div>

                    <div className="pt-6 flex justify-between items-center">
                       <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Recibido</p><p className="text-3xl font-black text-blue-600">${viewingReceipt.amount.toLocaleString()}</p></div>
                       <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /><span className="text-[10px] font-black text-blue-700 uppercase">Aprobado</span></div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center">
                       <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-8">Comprobante generado electrónicamente</p>
                       <div className="w-full grid grid-cols-2 gap-8">
                          <div className="text-center"><div className="border-b border-slate-300 h-8 mb-2"></div><p className="text-[8px] font-bold text-slate-400 uppercase">Recibido Por</p></div>
                          <div className="text-center"><div className="border-b border-slate-300 h-8 mb-2"></div><p className="text-[8px] font-bold text-slate-400 uppercase">Firma Acudiente</p></div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 border-t shrink-0 flex gap-4">
                 <button onClick={() => setViewingReceipt(null)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition">Cerrar</button>
                 <button onClick={() => window.print()} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Imprimir Recibo</button>
              </div>
           </div>
        </div>
      )}

      {/* FORMULARIO COMPLETO DE ALUMNO */}
      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3 text-blue-600">
                <UsersIcon className="w-6 h-6" />
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedStudent ? 'Actualizar Ficha de Alumno' : 'Registro de Nuevo Alumno'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"><CloseIcon /></button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                
                {/* Columna Foto */}
                <div className="lg:col-span-1 space-y-6 flex flex-col items-center">
                  <div className="w-full max-w-[200px] aspect-square relative group">
                    <div className="w-full h-full rounded-[3rem] bg-slate-100 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative transition-all group-hover:border-blue-300">
                      {photoPreview ? (
                        <img src={photoPreview} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-12 h-12 mb-3 opacity-20" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">FOTOGRAFÍA ALUMNO</span>
                        </>
                      )}
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white flex-col gap-2">
                        <Camera className="w-8 h-8" />
                        <span className="text-[10px] font-bold uppercase">Cargar / Tomar</span>
                      </button>
                    </div>
                    <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                    {photoPreview && (
                      <button type="button" onClick={() => setPhotoPreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition"><CloseIcon className="w-4 h-4" /></button>
                    )}
                  </div>
                  
                  <div className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><AlignLeft className="w-3.5 h-3.5" /> Observaciones</h4>
                    <textarea 
                      name="observations" 
                      defaultValue={selectedStudent?.observations} 
                      placeholder="Historial médico, alergias, recomendaciones..." 
                      className="w-full h-32 bg-white border border-slate-200 rounded-xl p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
                    ></textarea>
                  </div>
                </div>

                {/* Columna Datos */}
                <div className="lg:col-span-3 space-y-10">
                  
                  {/* Sección 1: Identidad */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-b border-blue-100 pb-2 mb-6 flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Identidad y Datos Básicos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Nombre Completo *</label>
                        <input name="fullName" defaultValue={selectedStudent?.fullName} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">DNI / Documento *</label>
                        <input name="dni" defaultValue={selectedStudent?.dni} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Fecha de Nacimiento *</label>
                        <input type="date" name="birthDate" defaultValue={selectedStudent?.birthDate} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Grupo Sanguíneo (RH)</label>
                        <select name="bloodType" defaultValue={selectedStudent?.bloodType || 'O+'} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(rh => <option key={rh} value={rh}>{rh}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Género</label>
                        <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                          <option>Masculino</option>
                          <option>Femenino</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Académico y Físico */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-purple-600 tracking-widest border-b border-purple-100 pb-2 mb-6 flex items-center gap-2">
                      <Medal className="w-3.5 h-3.5" /> Datos Académicos y Físicos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Colegio / Institución</label>
                        <div className="relative">
                          <SchoolIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="school" defaultValue={selectedStudent?.school} className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Grado Escolar</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="grade" defaultValue={selectedStudent?.grade} className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Peso (kg)</label>
                        <div className="relative">
                          <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input type="number" step="0.1" name="weight" defaultValue={selectedStudent?.weight} className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Estatura (cm)</label>
                        <div className="relative">
                          <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input type="number" name="height" defaultValue={selectedStudent?.height} className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección 3: Ubicación y Contacto */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest border-b border-emerald-100 pb-2 mb-6 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Ubicación y Contacto Residencia
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Dirección de Vivienda</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="address" defaultValue={selectedStudent?.address} className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Teléfono de Residencia / Alumno</label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input name="phone" defaultValue={selectedStudent?.phone} className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección 4: Datos de la Academia */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-blue-900 tracking-widest border-b border-blue-900/10 pb-2 mb-6 flex items-center gap-2">
                      <Medal className="w-3.5 h-3.5" /> Información Deportiva / Académica
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Categoría *</label>
                        <select name="category" defaultValue={selectedStudent?.category || schoolSettings.categories[0]} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none">
                          {schoolSettings.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Posición Preferida</label>
                        <select name="position" defaultValue={selectedStudent?.position || schoolSettings.positions[0]} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none">
                          {schoolSettings.positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Tipo de Formación</label>
                        <select name="trainingType" defaultValue={selectedStudent?.trainingType || 'Formativa'} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none">
                          <option value="Formativa">Formativa</option>
                          <option value="Elite">Elite / Alto Rendimiento</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Docente / Entrenador Asignado</label>
                        <select name="teacherId" defaultValue={selectedStudent?.teacherId} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none">
                          <option value="">Sin asignar</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Fecha de Ingreso</label>
                        <input type="date" name="entryDate" defaultValue={selectedStudent?.entryDate || new Date().toISOString().split('T')[0]} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <input 
                          type="checkbox" 
                          id="isPaidUp" 
                          name="isPaidUp" 
                          defaultChecked={selectedStudent?.isPaidUp} 
                          className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-300" 
                        />
                        <label htmlFor="isPaidUp" className="text-xs font-black text-slate-700 uppercase tracking-tighter">Paz y Salvo Inicial</label>
                      </div>
                    </div>
                  </div>

                  {/* Sección 5: Datos del Acudiente */}
                  <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100">
                    <h4 className="text-[10px] font-black uppercase text-blue-700 tracking-widest border-b border-blue-200 pb-2 mb-6 flex items-center gap-2">
                      <UsersIcon className="w-3.5 h-3.5" /> Información del Acudiente Principal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Nombre Completo del Acudiente *</label>
                        <input name="parentName" defaultValue={selectedStudent?.parents[0]?.name} required className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Teléfono de Contacto Acudiente *</label>
                        <input name="parentPhone" defaultValue={selectedStudent?.parents[0]?.phone} required className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Dirección de Trabajo / Alterna</label>
                        <input name="parentAddress" defaultValue={selectedStudent?.parents[0]?.address} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Botón Guardar */}
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">Cancelar</button>
                    <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> {selectedStudent ? 'Guardar Cambios' : 'Registrar Alumno'}
                    </button>
                  </div>

                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
