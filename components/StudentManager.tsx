
import React, { useState, useRef, useMemo } from 'react';
import { Student, Teacher, Payment, BloodType, SchoolSettings } from '../types';
import { 
  Plus, Search, Edit2, Trash2, CreditCard, UserCheck, UserX, Printer, FileUp, FileDown, History, X as CloseIcon, 
  Calendar, Camera, User, Eye, CheckCircle, AlertTriangle, CalendarCheck, Check, ChevronDown, Info, Medal, 
  Users as UsersIcon, CheckCircle2, Ruler, Weight, School as SchoolIcon, GraduationCap, MapPin, Phone as PhoneIcon, AlignLeft,
  Banknote, CalendarDays, ChevronLeft, ChevronRight, UserPlus
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
      alert("⚠️ Error: Los Nombres Completos y la Fecha de Nacimiento son campos obligatorios.");
      return;
    }

    const weight = Number(formData.get('weight'));
    const height = Number(formData.get('height'));
    
    const newStudent: Student = {
      id: selectedStudent?.id || Date.now().toString(),
      fullName: fullName.trim(), 
      dni: (formData.get('dni') as string).trim(), 
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
      {/* HEADER PRINCIPAL */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-col lg:flex-row gap-4 w-full md:w-auto flex-1">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por nombres o apellidos..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)} 
                className="pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Categorías</option>
                {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                value={paidStatusFilter} 
                onChange={(e) => setPaidStatusFilter(e.target.value as any)} 
                className="pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos</option>
                <option value="PAID">Al Día</option>
                <option value="DEBTOR">Morosos</option>
              </select>
            </div>
          </div>
          <button 
            onClick={() => { setShowForm(true); setSelectedStudent(null); setPhotoPreview(null); }} 
            className="w-full md:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-200"
          >
            <UserPlus className="w-5 h-5" /> Registrar Alumno
          </button>
        </div>
      </div>

      {/* TABLA DE ALUMNOS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto no-print">
        <table className="w-full text-left min-w-[1000px] border-collapse">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Identificación y Alumno</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">Categoría / Edad</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">Estado Financiero</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-blue-50/30 transition group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 overflow-hidden flex items-center justify-center text-blue-600 font-black text-lg shadow-inner">
                      {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <span>{student.fullName.charAt(0)}</span>}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase tracking-tighter text-sm">{student.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">DNI: {student.dni || 'S/N'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter border border-blue-100 w-fit">{student.category}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{student.age} Años • {student.bloodType}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-center">
                    {student.isPaidUp ? (
                      <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100 shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /> Paz y Salvo</span>
                    ) : (
                      <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-red-100 shadow-sm"><AlertTriangle className="w-3.5 h-3.5" /> Saldo Pendiente</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setPaymentModalStudent(student)} title="Recaudar Pago" className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition shadow-sm"><CreditCard className="w-4.5 h-4.5" /></button>
                    <button onClick={() => setHistoryStudentId(student.id)} title="Ver Historial" className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"><History className="w-4.5 h-4.5" /></button>
                    <button onClick={() => { setSelectedStudent(student); setPhotoPreview(student.photo || null); setShowForm(true); }} title="Editar Ficha" className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"><Edit2 className="w-4.5 h-4.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                   <UsersIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                   <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">No se encontraron alumnos para mostrar</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FORMULARIO DE ALUMNO (RESTAURADO Y OPTIMIZADO) */}
      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-blue-600 text-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{selectedStudent ? 'Actualizar Ficha de Alumno' : 'Nuevo Ingreso de Alumno'}</h3>
                  <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">SISTEMA DE GESTIÓN DE ATLETAS</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-blue-700 rounded-full transition"><CloseIcon className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-10">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                
                {/* Columna Foto */}
                <div className="lg:col-span-1 space-y-6 flex flex-col items-center">
                  <div className="w-full max-w-[220px] aspect-square relative group">
                    <div className="w-full h-full rounded-[2.5rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative transition-all group-hover:border-blue-300 shadow-inner">
                      {photoPreview ? (
                        <img src={photoPreview} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-12 h-12 mb-3 opacity-10" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center px-6 leading-relaxed">Cargar Fotografía Oficial</span>
                        </>
                      )}
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white flex-col gap-2">
                        <Camera className="w-8 h-8" />
                        <span className="text-[10px] font-bold uppercase">Cargar Archivo</span>
                      </button>
                    </div>
                    <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                  </div>
                  
                  <div className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                    <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><AlignLeft className="w-3.5 h-3.5" /> Observaciones Médicas</h4>
                    <textarea 
                      name="observations" 
                      defaultValue={selectedStudent?.observations} 
                      placeholder="Alergias, condiciones especiales, RH secundario..." 
                      className="w-full h-32 bg-white border border-slate-200 rounded-xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
                    ></textarea>
                  </div>
                </div>

                {/* Columna Datos */}
                <div className="lg:col-span-3 space-y-10">
                  
                  {/* Sección 1: Identidad (LO QUE EL USUARIO PIDIÓ: NOMBRES Y FECHAS) */}
                  <div className="bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100">
                    <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] mb-8 flex items-center gap-3">
                      <User className="w-4 h-4" /> Datos de Identidad Principal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest px-1">Nombres y Apellidos Completos <span className="text-red-500">*</span></label>
                        <input 
                          name="fullName" 
                          defaultValue={selectedStudent?.fullName} 
                          required 
                          placeholder="Ingrese el nombre completo del alumno"
                          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest px-1">Fecha de Nacimiento <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                          <input 
                            type="date" 
                            name="birthDate" 
                            defaultValue={selectedStudent?.birthDate} 
                            required 
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest px-1">Número de Documento (DNI/TI)</label>
                        <input 
                          name="dni" 
                          defaultValue={selectedStudent?.dni} 
                          placeholder="Ej: 1002345678"
                          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Datos de Contacto */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-3 mb-8 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Ubicación y Contacto
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">Dirección de Residencia</label>
                        <input name="address" defaultValue={selectedStudent?.address} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">Teléfono Principal</label>
                        <input name="phone" defaultValue={selectedStudent?.phone} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Sección 3: Datos de la Academia */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-3 mb-8 flex items-center gap-2">
                      <Medal className="w-3.5 h-3.5" /> Asignación Deportiva
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Categoría</label>
                        <select name="category" defaultValue={selectedStudent?.category || schoolSettings.categories[0]} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none">
                          {schoolSettings.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Posición de Juego</label>
                        <select name="position" defaultValue={selectedStudent?.position || schoolSettings.positions[0]} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none">
                          {schoolSettings.positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Fecha de Ingreso</label>
                        <input type="date" name="entryDate" defaultValue={selectedStudent?.entryDate || new Date().toISOString().split('T')[0]} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Sección 4: Acudiente Principal */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                    <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-6 flex items-center gap-2">
                      <UsersIcon className="w-3.5 h-3.5" /> Acudiente / Responsable Legal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest px-1">Nombre Completo del Acudiente</label>
                        <input name="parentName" defaultValue={selectedStudent?.parents[0]?.name} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none text-white focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest px-1">Teléfono de Emergencia</label>
                        <input name="parentPhone" defaultValue={selectedStudent?.parents[0]?.phone} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none text-white focus:border-blue-500" />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <input 
                          type="checkbox" 
                          id="isPaidUp" 
                          name="isPaidUp" 
                          defaultChecked={selectedStudent?.isPaidUp} 
                          className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 border-white/20 bg-white/5" 
                        />
                        <label htmlFor="isPaidUp" className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Paz y Salvo Inicial</label>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                    <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95">
                      <CheckCircle className="w-5 h-5" /> {selectedStudent ? 'Actualizar Información' : 'Registrar en Academia'}
                    </button>
                  </div>

                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAGO DE MENSUALIDAD (Manteniendo funcionalidad previa) */}
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
                    <button onClick={() => setPaymentYear(prev => prev - 1)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-lg font-black text-slate-800">{paymentYear}</span>
                    <button onClick={() => setPaymentYear(prev => prev + 1)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monto Unitario</label>
                  <input 
                    type="number" 
                    value={monthlyAmount} 
                    onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-600 outline-none text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-between items-center px-1">
                  <span>Seleccionar Meses del Ciclo</span>
                  <span className="text-emerald-600">{selectedMonths.length} Seleccionados</span>
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
                          py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all
                          ${isPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-600 opacity-60 cursor-not-allowed' : 
                            isSelected ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg scale-105' : 
                            'bg-slate-50 border-slate-100 text-slate-400 hover:border-emerald-300'}
                        `}
                      >
                        {monthName}
                        {isPaid && <Check className="w-3.5 h-3.5 mx-auto mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex justify-between items-center shadow-xl">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total a Recaudar</p>
                  <p className="text-3xl font-black text-emerald-400">${(selectedMonths.length * monthlyAmount).toLocaleString()}</p>
                </div>
                <button 
                  onClick={processBatchPayment}
                  disabled={selectedMonths.length === 0}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition shadow-lg active:scale-95"
                >
                  Registrar Cobro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial Modal (Manteniendo funcionalidad) */}
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
                  <tr><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Concepto</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monto</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acción</th></tr>
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
                  {historyData.length === 0 && (
                    <tr><td colSpan={4} className="py-20 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Sin registros de pago</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
