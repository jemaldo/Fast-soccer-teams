
import React, { useState, useRef, useMemo } from 'react';
import { Teacher, Payment, BloodType, SchoolSettings, CashTransaction } from '../types';
import { CATEGORIES } from '../constants';
import { 
  Plus, Search, Edit2, Trash2, Mail, Phone, CreditCard, 
  Banknote, UserRound, X, FileUp, FileDown, History, Printer, 
  Eye, Camera, FileText, User as UserIcon, Upload, Save,
  DollarSign
} from 'lucide-react';

interface Props {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  cashFlow: CashTransaction[];
  setCashFlow: React.Dispatch<React.SetStateAction<CashTransaction[]>>;
  schoolSettings: SchoolSettings;
}

const TeacherManager: React.FC<Props> = ({ 
  teachers, setTeachers, payments, setPayments, cashFlow, setCashFlow, schoolSettings 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<string | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => setResumeData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTeacher = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTeacher: Teacher = {
      id: selectedTeacher?.id || Date.now().toString(),
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      category: formData.get('category') as string,
      age: Number(formData.get('age')),
      bloodType: formData.get('bloodType') as BloodType,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      bankAccount: formData.get('bankAccount') as string,
      entryDate: formData.get('entryDate') as string,
      photo: photoPreview || undefined,
      resumeUrl: resumeData || undefined
    };

    if (selectedTeacher) {
      setTeachers(teachers.map(t => t.id === selectedTeacher.id ? newTeacher : t));
    } else {
      setTeachers([...teachers, newTeacher]);
    }
    setShowForm(false);
  };

  const handlePayPayroll = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const period = formData.get('period');

    const newTx: CashTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: 'OUTCOME',
      amount,
      description: `Nómina: ${selectedTeacher.firstName} ${selectedTeacher.lastName} - ${period}`,
      user: 'admin'
    };

    const newPayment: Payment = {
      id: `pay-roll-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      type: 'TEACHER_PAYROLL',
      targetId: selectedTeacher.id,
      targetName: `${selectedTeacher.firstName} ${selectedTeacher.lastName}`,
      description: `Nómina ${period}`,
      status: 'PAID'
    };

    setCashFlow([newTx, ...cashFlow]);
    setPayments([newPayment, ...payments]);
    setShowPayrollModal(false);
    setSelectedTeacher(null);
    alert("¡Pago de nómina registrado con éxito!");
  };

  const filteredTeachers = teachers.filter(t => 
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm no-print">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar docente por nombre..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setShowForm(true); setSelectedTeacher(null); setPhotoPreview(null); setResumeData(null); }}
          className="bg-purple-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition flex items-center gap-2 shadow-xl shadow-purple-100"
        >
          <Plus className="w-5 h-5" /> Vincular Docente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTeachers.map(teacher => (
          <div key={teacher.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-slate-50 relative">
              <div className="flex justify-between items-start mb-6">
                <div className="w-20 h-20 rounded-[1.5rem] bg-purple-100 border-2 border-purple-50 flex items-center justify-center overflow-hidden shadow-inner">
                  {teacher.photo ? (
                    <img src={teacher.photo} alt={teacher.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-purple-300" />
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setSelectedTeacher(teacher); setPhotoPreview(teacher.photo || null); setResumeData(teacher.resumeUrl || null); setShowForm(true); }} className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition shadow-sm"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setTeachers(teachers.filter(t => t.id !== teacher.id))} className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition shadow-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{teacher.firstName} {teacher.lastName}</h4>
              <p className="text-xs font-black text-purple-600 uppercase tracking-widest mt-1 bg-purple-50 inline-block px-3 py-1 rounded-md">{teacher.category}</p>
            </div>
            <div className="p-8 flex-1 space-y-4">
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl"><Mail className="w-4 h-4 text-purple-500" /> {teacher.email}</div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl"><Phone className="w-4 h-4 text-purple-500" /> {teacher.phone}</div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl"><CreditCard className="w-4 h-4 text-purple-500" /> {teacher.bankAccount}</div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex flex-col gap-2">
              <button 
                onClick={() => { setSelectedTeacher(teacher); setShowPayrollModal(true); }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-purple-600 transition shadow-lg"
              >
                <Banknote className="w-4 h-4" /> Pagar Nómina
              </button>
              <button 
                onClick={() => {
                  if (teacher.resumeUrl) {
                    const win = window.open();
                    if (win) win.document.write(`<iframe src="${teacher.resumeUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                  } else alert("No hay CV disponible");
                }}
                className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition ${teacher.resumeUrl ? 'bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                <FileText className="w-4 h-4" /> Ver CV (PDF)
              </button>
            </div>
          </div>
        ))}
      </div>

      {showPayrollModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-purple-100">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Pago de Nómina</h3>
                    <p className="text-[10px] font-bold opacity-80 uppercase mt-1">Registrar egreso de caja</p>
                 </div>
                 <button onClick={() => setShowPayrollModal(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handlePayPayroll} className="p-10 space-y-6">
                 <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 border border-slate-100 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><UserRound className="w-5 h-5" /></div>
                    <span className="font-black text-slate-800 uppercase tracking-tight text-sm">{selectedTeacher?.firstName} {selectedTeacher?.lastName}</span>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Monto a Pagar ($)</label>
                    <input type="number" name="amount" placeholder="0" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black outline-none focus:ring-4 focus:ring-purple-500/10 transition" autoFocus />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Periodo / Concepto</label>
                    <input type="text" name="period" placeholder="Ej: Quincena Mayo" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none" />
                 </div>
                 <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition shadow-xl shadow-purple-100 flex items-center justify-center gap-3">
                    <DollarSign className="w-5 h-5" /> Confirmar Pago Nómina
                 </button>
              </form>
           </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Ficha Docente</h3>
              <button onClick={() => setShowForm(false)} className="bg-white p-4 rounded-2xl shadow-xl text-slate-400 hover:text-red-500 transition"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveTeacher} className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="space-y-8">
                <div className="relative group w-full aspect-square max-w-[250px] mx-auto">
                  <div className="w-full h-full rounded-[2.5rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 overflow-hidden shadow-inner">
                    {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Camera className="w-12 h-12" />}
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-black uppercase">Cambiar Foto</button>
                  </div>
                  <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                </div>
                <div 
                  onClick={() => resumeInputRef.current?.click()}
                  className={`p-10 rounded-[2.5rem] border-4 border-dashed cursor-pointer transition flex flex-col items-center text-center ${resumeData ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-purple-50'}`}
                >
                  {resumeData ? <FileText className="w-12 h-12 text-emerald-600 mb-3" /> : <Upload className="w-12 h-12 text-slate-300 mb-3" />}
                  <h5 className="text-xs font-black uppercase text-slate-700">CV (PDF)</h5>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">{resumeData ? 'Cargado' : 'Subir CV'}</p>
                </div>
                <input type="file" ref={resumeInputRef} onChange={handleResumeChange} accept="application/pdf" className="hidden" />
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Nombres</label><input name="firstName" defaultValue={selectedTeacher?.firstName} required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                  <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Apellidos</label><input name="lastName" defaultValue={selectedTeacher?.lastName} required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                  <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Categoría Deportiva</label><select name="category" defaultValue={selectedTeacher?.category} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold">{schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Email</label><input type="email" name="email" defaultValue={selectedTeacher?.email} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                  <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Teléfono</label><input name="phone" defaultValue={selectedTeacher?.phone} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                  <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Cuenta Bancaria</label><input name="bankAccount" defaultValue={selectedTeacher?.bankAccount} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" /></div>
                </div>
                <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition shadow-2xl flex items-center justify-center gap-3"><Save className="w-5 h-5" /> Guardar Docente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManager;
