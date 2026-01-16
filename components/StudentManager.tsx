
import React, { useState, useRef, useMemo } from 'react';
import { Student, Teacher, Payment, BloodType, SchoolSettings, CashTransaction, Lateralidad } from '../types';
import { 
  Plus, Search, Edit2, Trash2, X as CloseIcon, Camera, User, 
  CheckCircle, AlertTriangle, Info, Users as UsersIcon, Save,
  UserCheck, DollarSign, Banknote, Printer, Trophy, Activity,
  MapPin, Phone as PhoneIcon, HeartPulse, GraduationCap,
  FileText, Home, Calendar, Scale, Ruler, LogOut, Briefcase,
  Stamp, ShieldCheck, X
} from 'lucide-react';

const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400; 
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

interface Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  cashFlow: CashTransaction[];
  setCashFlow: React.Dispatch<React.SetStateAction<CashTransaction[]>>;
  schoolSettings: SchoolSettings;
  teachers: Teacher[];
}

const StudentManager: React.FC<Props> = ({ 
  students, setStudents, schoolSettings, teachers, payments, setPayments, cashFlow, setCashFlow 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setPhotoPreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateBMI = (w: number, h: number) => {
    if (!w || !h) return 0;
    const hMeters = h / 100;
    return parseFloat((w / (hMeters * hMeters)).toFixed(2));
  };

  const handleSaveStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const w = Number(formData.get('weight'));
    const h = Number(formData.get('height'));

    const newStudent: Student = {
      id: selectedStudent?.id || Date.now().toString(),
      fullName: formData.get('fullName') as string,
      dni: formData.get('dni') as string,
      birthDate: formData.get('birthDate') as string,
      age: Number(formData.get('age')),
      bloodType: formData.get('bloodType') as BloodType,
      lateralidad: formData.get('lateralidad') as Lateralidad,
      school: formData.get('school') as string,
      grade: formData.get('grade') as string,
      weight: w,
      height: h,
      bmi: calculateBMI(w, h),
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      observations: formData.get('observations') as string,
      category: formData.get('category') as string,
      position: formData.get('position') as string,
      entryDate: formData.get('entryDate') as string,
      exitDate: (formData.get('exitDate') as string) || undefined,
      isPaidUp: formData.get('isPaidUp') === 'on',
      photo: photoPreview || undefined,
      teacherId: formData.get('teacherId') as string,
      trainingType: formData.get('trainingType') as 'Formativa' | 'Elite',
      parents: [{ 
        name: formData.get('parentName') as string, 
        phone: formData.get('parentPhone') as string, 
        address: formData.get('parentRelation') as string 
      }]
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

  const handleQuickPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const month = formData.get('month');

    const newTx: CashTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: 'INCOME',
      amount,
      description: `Mensualidad: ${selectedStudent.fullName} - Mes: ${month}`,
      user: 'admin'
    };

    const newPayment: Payment = {
      id: `payment-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      type: 'STUDENT_MONTHLY',
      targetId: selectedStudent.id,
      targetName: selectedStudent.fullName,
      description: `Pago Mensualidad ${month}`,
      status: 'PAID'
    };

    setCashFlow([newTx, ...cashFlow]);
    setPayments([newPayment, ...payments]);
    setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, isPaidUp: true } : s));
    setShowPaymentModal(false);
    setSelectedStudent(null);
    alert("¡Pago de mensualidad registrado con éxito!");
  };

  const handlePrintFile = (student: Student) => {
    setSelectedStudent(student);
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      const cleanup = () => {
        setPrintMode(false);
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      setTimeout(() => setPrintMode(false), 2000);
    }, 800);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || s.dni.includes(searchTerm);
      const matchesCategory = categoryFilter === '' || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [students, searchTerm, categoryFilter]);

  const getTeacherName = (id?: string) => {
    if (!id) return 'Sin asignar';
    const t = teachers.find(teacher => teacher.id === id);
    return t ? `${t.firstName} ${t.lastName}` : 'No encontrado';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-wrap gap-4 justify-between items-center no-print">
        <div className="flex gap-4 flex-1 min-w-[300px]">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o DNI..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition"
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
           </div>
           <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)} 
              className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none uppercase cursor-pointer"
           >
              <option value="">Todas las Categorías</option>
              {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
        <button 
          onClick={() => { setShowForm(true); setSelectedStudent(null); setPhotoPreview(null); }} 
          className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition flex items-center gap-2 shadow-xl shadow-blue-100"
        >
          <Plus className="w-5 h-5" /> Inscribir Alumno
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden overflow-x-auto no-print">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Atleta / DNI</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Acudiente</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Técnico / Categoría</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Estado</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50 transition group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
                      {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-slate-300" />}
                    </div>
                    <div>
                       <span className="font-black text-slate-900 text-sm block leading-none mb-1 uppercase tracking-tight">{student.fullName}</span>
                       <span className="text-[10px] font-bold text-slate-400">DNI: {student.dni}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                   <div className="text-[10px] font-bold text-slate-700">
                      <p className="uppercase">{student.parents[0]?.name || 'N/A'}</p>
                      <p className="text-slate-400 font-medium">{student.parents[0]?.phone || 'N/A'}</p>
                   </div>
                </td>
                <td className="px-8 py-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">{student.category}</span>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">TÉCNICO: <span className="text-slate-900 font-black">{getTeacherName(student.teacherId)}</span></span>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                   {student.exitDate ? (
                     <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase">Egresado</span>
                   ) : student.isPaidUp ? (
                     <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase">Al Día</span>
                   ) : (
                     <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[9px] font-black uppercase">En Mora</span>
                   )}
                </td>
                <td className="px-8 py-5 text-right">
                   <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedStudent(student); setShowPaymentModal(true); }} className="p-2.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition shadow-sm" title="Pagar Mensualidad"><DollarSign className="w-4 h-4" /></button>
                      <button onClick={() => handlePrintFile(student)} className="p-2.5 text-slate-600 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl transition shadow-sm" title="Imprimir Ficha"><Printer className="w-4 h-4" /></button>
                      <button onClick={() => { setSelectedStudent(student); setPhotoPreview(student.photo || null); setShowForm(true); }} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition shadow-sm" title="Editar"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if(confirm('¿Eliminar atleta?')) setStudents(students.filter(s => s.id !== student.id))}} className="p-2.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition shadow-sm" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE PAGO DE MENSUALIDAD (REINTEGRADO) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-emerald-100">
              <div className="bg-emerald-600 p-8 text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Cobro de Mensualidad</h3>
                    <p className="text-[10px] font-bold opacity-80 uppercase mt-1">Registrar ingreso a caja</p>
                 </div>
                 <button onClick={() => setShowPaymentModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleQuickPayment} className="p-10 space-y-6">
                 <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 border border-slate-100 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><User className="w-5 h-5" /></div>
                    <span className="font-black text-slate-800 uppercase tracking-tight text-sm">{selectedStudent?.fullName}</span>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Monto a Cobrar ($)</label>
                    <input type="number" name="amount" placeholder="0" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition" autoFocus />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Mes Correspondiente</label>
                    <select name="month" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none appearance-none">
                       {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </div>
                 <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-xl shadow-emerald-100 flex items-center justify-center gap-3">
                    <Banknote className="w-5 h-5" /> Confirmar Ingreso
                 </button>
              </form>
           </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100"><UsersIcon className="w-7 h-7" /></div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedStudent ? 'Actualizar Expediente' : 'Inscripción Atleta'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gestión integral del atleta y su entorno</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="bg-white border border-slate-200 p-4 rounded-2xl text-slate-400 hover:text-red-500 transition shadow-xl"><CloseIcon className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-3 space-y-8 text-center">
                  <div className="relative group w-full aspect-square max-w-[250px] mx-auto">
                    <div className="w-full h-full rounded-[3rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 overflow-hidden shadow-inner">
                      {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Camera className="w-16 h-16 opacity-30" />}
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-blue-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-black uppercase">Cambiar Foto</button>
                    </div>
                    <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 text-left">
                    <h4 className="text-[10px] font-black uppercase text-blue-600 mb-4 flex items-center gap-2"><HeartPulse className="w-4 h-4" /> Antropometría</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Peso (kg)</label><input name="weight" type="number" step="0.1" defaultValue={selectedStudent?.weight} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none" /></div>
                      <div><label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Talla (cm)</label><input name="height" type="number" defaultValue={selectedStudent?.height} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none" /></div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase text-slate-900 flex items-center gap-3 border-l-4 border-blue-600 pl-3">Identidad y Residencia</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nombres Completos *</label><input name="fullName" defaultValue={selectedStudent?.fullName} required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-sm uppercase" /></div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">DNI / TI *</label><input name="dni" defaultValue={selectedStudent?.dni} required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-sm" /></div>
                      <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nacimiento</label><input name="birthDate" type="date" defaultValue={selectedStudent?.birthDate} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-sm" /></div>
                      <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Dirección Residencia</label><input name="address" defaultValue={selectedStudent?.address} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-sm uppercase" /></div>
                    </div>
                  </div>
                  <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 space-y-4">
                    <h4 className="text-[11px] font-black uppercase text-blue-600 flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Datos del Acudiente</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Nombre Acudiente</label><input name="parentName" defaultValue={selectedStudent?.parents[0]?.name} className="w-full px-5 py-3 bg-white border rounded-xl font-black text-sm uppercase" /></div>
                      <div><label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Teléfono</label><input name="parentPhone" defaultValue={selectedStudent?.parents[0]?.phone} className="w-full px-5 py-3 bg-white border rounded-xl font-black text-sm" /></div>
                      <div><label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Parentesco</label><input name="parentRelation" defaultValue={selectedStudent?.parents[0]?.address} className="w-full px-5 py-3 bg-white border rounded-xl font-black text-sm uppercase" /></div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-6 shadow-xl">
                    <h4 className="text-[11px] font-black uppercase text-blue-400 tracking-widest border-b border-white/10 pb-4 flex items-center gap-2"><Trophy className="w-5 h-5" /> Perfil Técnico</h4>
                    <div className="space-y-4">
                      <div><label className="text-[9px] font-black text-blue-300 uppercase mb-1 block">Entrenador (Técnico)</label><select name="teacherId" defaultValue={selectedStudent?.teacherId} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs font-black outline-none"><option value="" className="text-slate-900">Seleccionar...</option>{teachers.map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.firstName} {t.lastName}</option>)}</select></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[9px] font-black text-blue-300 uppercase mb-1 block">Lateralidad</label><select name="lateralidad" defaultValue={selectedStudent?.lateralidad} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs font-black outline-none"><option value="DIESTRO" className="text-slate-900">DIESTRO</option><option value="ZURDO" className="text-slate-900">ZURDO</option><option value="AMBOS" className="text-slate-900">AMBOS</option></select></div>
                        <div><label className="text-[9px] font-black text-blue-300 uppercase mb-1 block">Categoría</label><select name="category" defaultValue={selectedStudent?.category} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs font-black outline-none">{schoolSettings.categories.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}</select></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 space-y-4">
                    <h4 className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-2"><Calendar className="w-5 h-5" /> Fechas</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Ingreso</label><input name="entryDate" type="date" defaultValue={selectedStudent?.entryDate || new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-white border rounded-xl text-xs font-black" /></div>
                      <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Egreso</label><input name="exitDate" type="date" defaultValue={selectedStudent?.exitDate} className="w-full px-4 py-3 bg-white border rounded-xl text-xs font-black" /></div>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition shadow-2xl flex items-center justify-center gap-3"><Save className="w-5 h-5" /> {selectedStudent ? 'Finalizar Edición' : 'Confirmar Registro'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {printMode && selectedStudent && (
        <div className="print-only bg-white p-12 min-h-screen">
           <div className="border-[8px] border-slate-900 p-10 rounded-[4rem] h-full flex flex-col relative overflow-hidden bg-white">
              <div className="flex justify-between items-start border-b-[4px] border-slate-900 pb-10 mb-10">
                 <div className="flex gap-8 items-center">
                    {schoolSettings.logo ? <img src={schoolSettings.logo} className="w-24 h-24 object-contain" /> : <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">AD</div>}
                    <div><h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">{schoolSettings.name}</h1><p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1 italic">EXPEDIENTE OFICIAL DEL ATLETA</p></div>
                 </div>
                 <div className="text-right"><div className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xl uppercase tracking-widest">FICHA #{selectedStudent.dni.slice(-4)}</div><p className="text-[10px] font-black uppercase text-slate-400 mt-2">NIT: {schoolSettings.nit}</p></div>
              </div>
              <div className="grid grid-cols-12 gap-12 flex-1">
                 <div className="col-span-4 space-y-10"><div className="w-full aspect-square rounded-[3rem] border-[4px] border-slate-900 overflow-hidden shadow-xl">{selectedStudent.photo ? <img src={selectedStudent.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 font-black">SIN FOTO</div>}</div><div className="bg-slate-900 text-white p-8 rounded-[3rem] space-y-4"><div><p className="text-[9px] uppercase font-bold opacity-60">RH</p><p className="text-2xl font-black">{selectedStudent.bloodType}</p></div><div><p className="text-[9px] uppercase font-bold opacity-60">IMC</p><p className="text-2xl font-black">{selectedStudent.bmi}</p></div></div></div>
                 <div className="col-span-8 space-y-10"><div><p className="text-sm font-black uppercase text-blue-600 tracking-widest">Identidad</p><h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedStudent.fullName}</h2><p className="text-xl font-bold text-slate-500">DNI: {selectedStudent.dni}</p></div><div className="grid grid-cols-2 gap-8"><div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Categoría</p><p className="text-xl font-black text-slate-900 uppercase">{selectedStudent.category}</p></div><div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Técnico</p><p className="text-xl font-black text-slate-900 uppercase">{getTeacherName(selectedStudent.teacherId)}</p></div></div><div className="bg-blue-50 p-8 rounded-[2.5rem] border-2 border-blue-100"><p className="text-[10px] font-black text-blue-600 uppercase mb-2">Acudiente Principal</p><p className="text-lg font-black text-slate-900 uppercase">{selectedStudent.parents[0]?.name || 'SIN ASIGNAR'}</p><p className="text-sm font-bold text-slate-500 uppercase">{selectedStudent.parents[0]?.phone}</p></div><div className="grid grid-cols-2 gap-8"><p className="text-xs font-bold text-slate-700 uppercase">INGRESO: <span className="font-black">{selectedStudent.entryDate}</span></p><p className="text-xs font-bold text-red-600 uppercase">EGRESO: <span className="font-black">{selectedStudent.exitDate || 'VINCULADO'}</span></p></div></div>
              </div>
              <div className="mt-auto flex justify-between items-center border-t-4 border-slate-900 pt-10"><div className="text-center w-64 border-t border-slate-300 pt-2"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Firma Acudiente</p></div><div className="text-center w-64 border-t border-slate-300 pt-2"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dirección Administrativa</p></div></div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
