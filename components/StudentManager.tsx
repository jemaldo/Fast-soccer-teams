import React, { useState, useRef, useMemo } from 'react';
import { Student, Teacher, Payment, BloodType, SchoolSettings } from '../types';
import { 
  Plus, Search, Edit2, Trash2, CreditCard, UserCheck, UserX, Printer, FileUp, FileDown, History, X as CloseIcon, 
  Calendar, Camera, User, Eye, CheckCircle, AlertTriangle, CheckCircle2, Ruler, Weight, School as SchoolIcon, GraduationCap, MapPin, Phone as PhoneIcon, AlignLeft,
  Banknote, CalendarDays, ChevronLeft, ChevronRight, UserPlus, Users as UsersIcon, Activity, Stethoscope,
  Medal, Check, Download, ShieldCheck
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Payment | null>(null);
  
  const [paymentModalStudent, setPaymentModalStudent] = useState<Student | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [paymentYear, setPaymentYear] = useState<number>(new Date().getFullYear());
  const [monthlyAmount, setMonthlyAmount] = useState<number>(50000);

  const excelInputRef = useRef<HTMLInputElement>(null);
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

  const handleDownloadTemplate = () => {
    const headers = ["ID", "Nombres Completos", "DNI", "Fecha Nacimiento", "RH", "Direccion", "Telefono", "Categoria", "Posicion", "Fecha Ingreso", "Acudiente", "Telefono Acudiente", "Colegio", "Grado", "Peso", "Estatura"];
    downloadTemplate(headers, "Plantilla_Alumnos_Academia");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcelFile(file);
      const importedStudents: Student[] = data.map((row: any) => {
        const birthDate = row["Fecha Nacimiento"] || "";
        const w = Number(row.Peso) || 0;
        const h = Number(row.Estatura) || 0;
        return {
          id: row.ID?.toString() || (Date.now() + Math.random()).toString(),
          fullName: row["Nombres Completos"] || "",
          dni: row.DNI?.toString() || "",
          birthDate: birthDate,
          age: calculateAge(birthDate),
          bloodType: (row.RH || "O+") as BloodType,
          school: row.Colegio || "",
          grade: row.Grado || "",
          weight: w,
          height: h,
          bmi: calculateBMI(w, h),
          address: row.Direccion || "",
          phone: row.Telefono?.toString() || "",
          observations: row.Observaciones || "",
          category: row.Categoria || schoolSettings.categories[0],
          position: row.Posicion || schoolSettings.positions[0],
          entryDate: row["Fecha Ingreso"] || new Date().toISOString().split('T')[0],
          isPaidUp: false,
          trainingType: 'Formativa',
          parents: [{ name: row.Acudiente || "", phone: row["Telefono Acudiente"]?.toString() || "", address: row.Direccion || "" }]
        };
      });
      setStudents(prev => [...prev, ...importedStudents]);
      alert(`${importedStudents.length} alumnos importados.`);
    } catch (error) { alert("Error al importar el archivo Excel."); }
    if (e.target) e.target.value = '';
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
    if (!fullName.trim() || !birthDate) { alert("⚠️ Error: Nombres y Fecha Nacimiento obligatorios."); return; }
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
      weight, height, bmi: calculateBMI(weight, height),
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      observations: formData.get('observations') as string,
      category: formData.get('category') as string,
      position: formData.get('position') as string,
      entryDate: formData.get('entryDate') as string,
      isPaidUp: formData.get('isPaidUp') === 'on',
      photo: photoPreview || undefined,
      teacherId: formData.get('teacherId') as string,
      trainingType: formData.get('trainingType') as any,
      parents: [{ name: formData.get('parentName') as string, phone: formData.get('parentPhone') as string, address: formData.get('parentAddress') as string }]
    };
    if (selectedStudent) { setStudents(students.map(s => s.id === selectedStudent.id ? newStudent : s)); } 
    else { setStudents([...students, newStudent]); }
    setShowForm(false); setSelectedStudent(null); setPhotoPreview(null);
  };

  const isMonthAlreadyPaid = (monthIndex: number) => {
    if (!paymentModalStudent) return false;
    const monthName = new Date(paymentYear, monthIndex).toLocaleString('es-ES', { month: 'long' });
    return payments.some(p => p.targetId === paymentModalStudent.id && p.type === 'STUDENT_MONTHLY' && p.description.toLowerCase().includes(monthName.toLowerCase()) && p.description.includes(paymentYear.toString()));
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
    alert(`${newPayments.length} mensualidades registradas.`);
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
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          <div className="flex flex-col lg:flex-row gap-4 w-full xl:w-auto flex-1">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="Buscar por nombres..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none">
                <option value="">Categorías</option>
                {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={paidStatusFilter} onChange={(e) => setPaidStatusFilter(e.target.value as any)} className="pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none">
                <option value="ALL">Todos</option>
                <option value="PAID">Al Día</option>
                <option value="DEBTOR">Morosos</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <button onClick={handleDownloadTemplate} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"><FileDown className="w-4 h-4" /> Plantilla</button>
            <button onClick={() => excelInputRef.current?.click()} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition"><FileUp className="w-4 h-4" /> Carga Masiva</button>
            <button onClick={() => { setShowForm(true); setSelectedStudent(null); setPhotoPreview(null); }} className="w-full xl:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-200"><UserPlus className="w-5 h-5" /> Registrar Alumno</button>
            <input type="file" ref={excelInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          </div>
        </div>
      </div>

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
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-blue-600 text-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center"><UserPlus className="w-6 h-6" /></div>
                <div><h3 className="text-xl font-black uppercase tracking-tight">{selectedStudent ? 'Actualizar Ficha Integral' : 'Nueva Matrícula Completa'}</h3><p className="text-xs font-bold text-blue-100 uppercase tracking-widest">SISTEMA DE GESTIÓN ACADÉMICA Y DEPORTIVA</p></div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-blue-700 rounded-full transition"><CloseIcon className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-10">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-1 space-y-8 flex flex-col items-center">
                  <div className="w-full max-w-[240px] aspect-square relative group">
                    <div className="w-full h-full rounded-[2.5rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative transition-all group-hover:border-blue-300 shadow-inner">
                      {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <><Camera className="w-12 h-12 mb-3 opacity-10" /><span className="text-[9px] font-black uppercase tracking-widest text-center px-6 leading-relaxed">Fotografía del Deportista</span></>}
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white flex-col gap-2"><Camera className="w-8 h-8" /><span className="text-[10px] font-bold uppercase">Cambiar Foto</span></button>
                    </div>
                    <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                  </div>
                  <div className="w-full bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><Stethoscope className="w-3.5 h-3.5" /> Observaciones Médicas</h4>
                    <textarea name="observations" defaultValue={selectedStudent?.observations} placeholder="Alergias, medicamentos, cirugías recientes..." className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"></textarea>
                  </div>
                </div>
                <div className="lg:col-span-3 space-y-10">
                  <div className="bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100">
                    <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] mb-8 flex items-center gap-3"><User className="w-4 h-4" /> Datos de Identidad</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2"><label className="block text-[9px] font-black text-slate-400 uppercase mb-3 px-1">Nombres y Apellidos Completos *</label><input name="fullName" defaultValue={selectedStudent?.fullName} required className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" /></div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-3 px-1">Número de Documento (DNI/TI)</label><input name="dni" defaultValue={selectedStudent?.dni} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black outline-none" /></div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-3 px-1">Fecha de Nacimiento *</label><input type="date" name="birthDate" defaultValue={selectedStudent?.birthDate} required className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black outline-none" /></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-3 mb-8 flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Perfil Físico y Académico</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Grupo RH</label><select name="bloodType" defaultValue={selectedStudent?.bloodType || 'O+'} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none">{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(rh => <option key={rh} value={rh}>{rh}</option>)}</select></div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Peso (kg)</label><input type="number" name="weight" defaultValue={selectedStudent?.weight} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" /></div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Estatura (cm)</label><input type="number" name="height" defaultValue={selectedStudent?.height} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" /></div>
                      <div className="md:col-span-1"><label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Grado Escolar</label><input name="grade" defaultValue={selectedStudent?.grade} placeholder="Ej: 5° Primaria" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" /></div>
                      <div className="md:col-span-2"><label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Institución Educativa</label><input name="school" defaultValue={selectedStudent?.school} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" /></div>
                      <div className="md:col-span-2"><label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Dirección de Residencia</label><input name="address" defaultValue={selectedStudent?.address} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" /></div>
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                    <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-8 flex items-center gap-2"><Medal className="w-3.5 h-3.5" /> Ficha Técnica Deportiva</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2 px-1">Categoría</label><select name="category" defaultValue={selectedStudent?.category || schoolSettings.categories[0]} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-black outline-none text-blue-400">{schoolSettings.categories.map(cat => <option key={cat} value={cat} className="text-slate-900">{cat}</option>)}</select></div>
                      <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2 px-1">Posición de Juego</label><select name="position" defaultValue={selectedStudent?.position || schoolSettings.positions[0]} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-black outline-none text-blue-400">{schoolSettings.positions.map(pos => <option key={pos} value={pos} className="text-slate-900">{pos}</option>)}</select></div>
                      <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2 px-1">Tipo Entrenamiento</label><select name="trainingType" defaultValue={selectedStudent?.trainingType || 'Formativa'} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-black outline-none text-blue-400"><option value="Formativa" className="text-slate-900">Formativa</option><option value="Elite" className="text-slate-900">Elite / Rendimiento</option></select></div>
                      <div className="md:col-span-2"><label className="block text-[9px] font-black text-slate-500 uppercase mb-2 px-1">Docente / Coach Asignado</label><select name="teacherId" defaultValue={selectedStudent?.teacherId} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-black outline-none text-blue-400"><option value="" className="text-slate-900">Sin docente asignado</option>{teachers.map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.firstName} {t.lastName}</option>)}</select></div>
                      <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2 px-1">Fecha Ingreso</label><input type="date" name="entryDate" defaultValue={selectedStudent?.entryDate || new Date().toISOString().split('T')[0]} className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none text-blue-400" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-8 flex items-center gap-2"><UsersIcon className="w-3.5 h-3.5" /> Responsable / Acudiente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2"><label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Nombre Completo del Acudiente</label><input name="parentName" defaultValue={selectedStudent?.parents[0]?.name} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" /></div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Teléfono de Contacto</label><input name="parentPhone" defaultValue={selectedStudent?.parents[0]?.phone} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" /></div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Dirección (Si es diferente)</label><input name="parentAddress" defaultValue={selectedStudent?.parents[0]?.address} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" /></div>
                      <div className="flex items-center gap-3 pt-6"><input type="checkbox" id="isPaidUp" name="isPaidUp" defaultChecked={selectedStudent?.isPaidUp} className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-300 bg-slate-50" /><label htmlFor="isPaidUp" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paz y Salvo Inicial</label></div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4"><button type="button" onClick={() => setShowForm(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button><button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95"><CheckCircle className="w-5 h-5" /> {selectedStudent ? 'Actualizar Ficha Completa' : 'Finalizar Registro de Alumno'}</button></div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentModalStudent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-emerald-600 text-white shrink-0">
              <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center"><Banknote className="w-6 h-6" /></div><div><h3 className="text-lg font-black uppercase tracking-tight">Recaudo Mensualidad</h3><p className="text-xs font-bold text-emerald-100">{paymentModalStudent.fullName}</p></div></div>
              <button onClick={() => setPaymentModalStudent(null)} className="p-2 hover:bg-emerald-700 rounded-full transition"><CloseIcon /></button>
            </div>
            <div className="p-8 flex-1 space-y-8">
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Año Fiscal</label><div className="flex items-center gap-3"><button onClick={() => setPaymentYear(prev => prev - 1)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition"><ChevronLeft className="w-4 h-4" /></button><span className="text-lg font-black text-slate-800">{paymentYear}</span><button onClick={() => setPaymentYear(prev => prev + 1)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition"><ChevronRight className="w-4 h-4" /></button></div></div>
                <div className="flex-1 text-right"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monto Unitario</label><input type="number" value={monthlyAmount} onChange={(e) => setMonthlyAmount(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-600 outline-none text-right" /></div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-between items-center px-1"><span>Seleccionar Meses del Ciclo</span><span className="text-emerald-600">{selectedMonths.length} Seleccionados</span></label>
                <div className="grid grid-cols-3 gap-3">{Array.from({ length: 12 }).map((_, i) => { const monthName = new Date(0, i).toLocaleString('es-ES', { month: 'short' }); const isPaid = isMonthAlreadyPaid(i); const isSelected = selectedMonths.includes(i); return (<button key={i} disabled={isPaid} onClick={() => toggleMonthSelection(i)} className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${isPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-600 opacity-60 cursor-not-allowed' : isSelected ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg scale-105' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-emerald-300'}`}>{monthName}{isPaid && <Check className="w-3.5 h-3.5 mx-auto mt-1" />}</button>); })}</div>
              </div>
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex justify-between items-center shadow-xl"><div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total a Recaudar</p><p className="text-3xl font-black text-emerald-400">${(selectedMonths.length * monthlyAmount).toLocaleString()}</p></div><button onClick={processBatchPayment} disabled={selectedMonths.length === 0} className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition shadow-lg active:scale-95">Registrar Cobro</button></div>
            </div>
          </div>
        </div>
      )}

      {historyStudentId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg">{historyStudent?.fullName.charAt(0)}</div><div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Historial Financiero</h3><p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{historyStudent?.fullName}</p></div></div>
              <button onClick={() => setHistoryStudentId(null)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition"><CloseIcon /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white border-b-2 border-slate-100 mb-4"><tr><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Concepto</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monto</th><th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acción</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {historyData.map(p => (
                    <tr key={p.id} className="group hover:bg-slate-50 transition">
                      <td className="py-4 text-sm font-bold text-slate-600">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="py-4 text-sm font-black text-slate-800 uppercase tracking-tighter">{p.description}</td>
                      <td className="py-4 text-sm font-black text-emerald-600">${p.amount.toLocaleString()}</td>
                      <td className="py-4 text-right flex justify-end gap-2">
                        <button onClick={() => setViewingReceipt(p)} className="p-2 text-slate-300 group-hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"><Printer className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {historyData.length === 0 && (<tr><td colSpan={4} className="py-20 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Sin registros de pago</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECIBO DE IMPRESIÓN */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
             <div className="p-4 border-b flex justify-between items-center bg-slate-900 text-white">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Printer className="w-4 h-4" /> Vista Previa de Recibo</h4>
                <button onClick={() => setViewingReceipt(null)} className="p-1 hover:bg-white/10 rounded-full transition"><CloseIcon /></button>
             </div>
             <div className="p-10 flex-1 overflow-y-auto" id="printable-ticket">
                <div className="border-2 border-slate-900 p-8 space-y-6 relative">
                   <div className="flex flex-col items-center text-center space-y-2 border-b-2 border-slate-100 pb-6">
                      {schoolSettings.logo && <img src={schoolSettings.logo} className="h-16 w-auto mb-2" alt="Logo" />}
                      <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">{schoolSettings.name}</h2>
                      <p className="text-[10px] font-black text-slate-500 uppercase">NIT: {schoolSettings.nit} | {schoolSettings.address}</p>
                      <p className="text-[10px] font-bold text-slate-400 italic">"{schoolSettings.slogan}"</p>
                   </div>

                   <div className="flex justify-between items-center">
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Recibo No.</p>
                         <p className="text-lg font-black text-slate-900">#{viewingReceipt.id.slice(-6).toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fecha Emisión</p>
                         <p className="text-xs font-bold text-slate-900">{new Date(viewingReceipt.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                   </div>

                   <div className="space-y-4 pt-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Recibido de:</p>
                         <p className="text-sm font-black text-slate-900 uppercase">{viewingReceipt.targetName}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Por concepto de:</p>
                         <p className="text-xs font-bold text-slate-700 italic">{viewingReceipt.description}</p>
                      </div>
                   </div>

                   <div className="pt-6 border-t-2 border-slate-100 flex justify-between items-end">
                      <div className="flex-1">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Firma Autorizada</p>
                         <div className="w-40 border-b border-slate-900 h-10"></div>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                         <p className="text-3xl font-black text-emerald-600 leading-none">${viewingReceipt.amount.toLocaleString()}</p>
                      </div>
                   </div>
                   
                   <div className="text-center pt-8 opacity-20">
                      <p className="text-[8px] font-black uppercase tracking-[0.3em]">Copia de Archivo Académico</p>
                   </div>
                </div>
             </div>
             <div className="p-6 bg-slate-50 border-t flex gap-4">
                <button onClick={() => setViewingReceipt(null)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cerrar</button>
                <button onClick={() => window.print()} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Imprimir Ticket</button>
             </div>
          </div>
        </div>
      )}
      
      {/* CSS PARA IMPRESIÓN EXCLUSIVA DEL TICKET */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-ticket, #printable-ticket * { visibility: visible; }
          #printable-ticket { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; border: none; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default StudentManager;
