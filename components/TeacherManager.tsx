
import React, { useState, useRef, useMemo } from 'react';
import { Teacher, Payment, BloodType, SchoolSettings } from '../types';
import { CATEGORIES } from '../constants';
import { Plus, Search, Edit2, Trash2, Mail, Phone, CreditCard, Banknote, UserRound, X, FileUp, FileDown, History, Printer, Eye, Camera, FileText, User as UserIcon, Upload, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { parseExcelFile, downloadTemplate } from '../services/excelService';

interface Props {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  schoolSettings: SchoolSettings;
}

const TeacherManager: React.FC<Props> = ({ teachers, setTeachers, payments, setPayments, schoolSettings }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [historyTeacherId, setHistoryTeacherId] = useState<string | null>(null);
  const [viewingSlip, setViewingSlip] = useState<Payment | null>(null);
  
  const [selectedFormCategories, setSelectedFormCategories] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    } else {
      alert('Por favor, selecciona un archivo PDF válido.');
    }
  };

  const handleSaveTeacher = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedFormCategories.length === 0) {
      alert("Debe seleccionar al menos una categoría.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const newTeacher: Teacher = {
      id: selectedTeacher?.id || Date.now().toString(),
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      categories: selectedFormCategories,
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
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedTeacher(null);
    setPhotoPreview(null);
    setResumeData(null);
    setSelectedFormCategories([]);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setPhotoPreview(teacher.photo || null);
    setResumeData(teacher.resumeUrl || null);
    const cats = teacher.categories || ((teacher as any).category ? [(teacher as any).category] : []);
    setSelectedFormCategories(cats);
    setShowForm(true);
  };

  const toggleCategory = (cat: string) => {
    setSelectedFormCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcelFile(file);
      const importedTeachers: Teacher[] = data.map((row: any) => ({
        id: Date.now().toString() + Math.random(),
        firstName: row.Nombres || "Sin nombre",
        lastName: row.Apellidos || "",
        categories: row.Categorias ? row.Categorias.split(',').map((c: string) => c.trim()) : [CATEGORIES[0]],
        age: Number(row.Edad || 0),
        bloodType: (row.RH || "O+") as BloodType,
        address: row.Direccion || "",
        phone: row.Telefono || "",
        email: row.Email || "",
        bankAccount: row.NumeroCuenta || "",
        entryDate: row.FechaIngreso || new Date().toISOString().split('T')[0],
      }));
      setTeachers([...teachers, ...importedTeachers]);
      alert(`Se importaron ${importedTeachers.length} docentes.`);
    } catch (err) { alert("Error al procesar Excel."); }
    e.target.value = "";
  };

  const handlePayroll = (teacher: Teacher) => {
    const amount = prompt(`Monto de nómina para ${teacher.firstName} ${teacher.lastName}:`, "1200000");
    if (amount && !isNaN(Number(amount))) {
      const newPayment: Payment = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        amount: Number(amount),
        type: 'TEACHER_PAYROLL',
        targetId: teacher.id,
        targetName: `${teacher.firstName} ${teacher.lastName}`,
        description: `Nómina Mensual - ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
        status: 'PAID'
      };
      setPayments([...payments, newPayment]);
      alert("Nómina generada con éxito.");
    }
  };

  const filteredTeachers = teachers.filter(t => `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const teacherHistory = useMemo(() => {
    if (!historyTeacherId) return [];
    return payments.filter(p => p.targetId === historyTeacherId && p.type === 'TEACHER_PAYROLL').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historyTeacherId, payments]);

  const historyTeacher = teachers.find(t => t.id === historyTeacherId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input type="text" placeholder="Buscar docente..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => downloadTemplate(["Nombres", "Apellidos", "Categorias", "Edad", "RH", "Direccion", "Telefono", "Email", "NumeroCuenta", "FechaIngreso"], "Plantilla_Docentes")} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 transition text-sm font-semibold"><FileDown className="w-4 h-4" /> Plantilla</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition text-sm font-semibold"><FileUp className="w-4 h-4" /> Importar</button>
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls, .csv" className="hidden" />
          <button onClick={() => { setShowForm(true); setSelectedTeacher(null); setPhotoPreview(null); setResumeData(null); setSelectedFormCategories([]); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Nuevo Docente</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
        {filteredTeachers.map(teacher => (
          <div key={teacher.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition">
            <div className="p-6 border-b border-slate-50">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 font-black text-2xl uppercase overflow-hidden">
                  {teacher.photo ? <img src={teacher.photo} className="w-full h-full object-cover" /> : <>{teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}</>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => setHistoryTeacherId(teacher.id)} title="Historial" className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"><History className="w-4 h-4" /></button>
                  <button onClick={() => handleEdit(teacher)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setTeachers(teachers.filter(t => t.id !== teacher.id))} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h4 className="text-xl font-bold text-slate-800">{teacher.firstName} {teacher.lastName}</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {(teacher.categories || []).map(c => <span key={c} className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">{c}</span>)}
              </div>
            </div>
            <div className="p-6 flex-1 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600"><Mail className="w-4 h-4 opacity-50" /> {teacher.email}</div>
              <div className="flex items-center gap-3 text-sm text-slate-600"><Phone className="w-4 h-4 opacity-50" /> {teacher.phone}</div>
              <div className="flex items-center gap-3 text-sm text-slate-600"><CreditCard className="w-4 h-4 opacity-50" /> {teacher.bankAccount}</div>
              <div className="flex items-center gap-3 text-sm text-slate-600"><UserRound className="w-4 h-4 opacity-50" /> {teacher.age} años | RH {teacher.bloodType}</div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex gap-2">
              <button onClick={() => handlePayroll(teacher)} className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition flex items-center justify-center gap-2"><Banknote className="w-4 h-4" /> Pago Nómina</button>
              <button onClick={() => { if(teacher.resumeUrl) { const win = window.open(); win?.document.write(`<iframe src="${teacher.resumeUrl}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`); } else alert("No disponible"); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${teacher.resumeUrl ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><FileText className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Historial Modal */}
      {historyTeacherId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-purple-600 text-white rounded-t-xl shrink-0">
              <div className="flex items-center gap-3"><History className="w-5 h-5" /><div><h3 className="text-lg font-bold">Historial de Nómina</h3><p className="text-xs text-purple-100 font-medium">{historyTeacher?.firstName} {historyTeacher?.lastName}</p></div></div>
              <button onClick={() => setHistoryTeacherId(null)} className="hover:bg-purple-700 p-1 rounded-lg"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Concepto</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Volante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teacherHistory.length === 0 ? (<tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">No hay registros</td></tr>) : 
                    teacherHistory.map(payment => (
                      <tr key={payment.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{payment.description}</td>
                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">${payment.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setViewingSlip(payment)} className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"><Eye className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VOLANTE DE NÓMINA (MEJORA SOLICITADA) */}
      {viewingSlip && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
               <h3 className="text-sm font-black uppercase tracking-widest">Vista Previa Volante</h3>
               <button onClick={() => setViewingSlip(null)} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto">
               <div id="payroll-slip" className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm space-y-6">
                  <div className="flex justify-between items-start border-b pb-6">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{schoolSettings.name}</h2>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NIT: {schoolSettings.nit}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1">{schoolSettings.address}</p>
                    </div>
                    {schoolSettings.logo && <img src={schoolSettings.logo} className="w-16 h-16 object-contain" alt="Logo" />}
                  </div>

                  <div className="text-center py-4 bg-slate-50 rounded-lg">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">Volante de Pago de Nómina</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">Ref: {viewingSlip.id.substring(0, 8)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 text-xs">
                    <div><p className="text-slate-400 font-bold uppercase text-[9px]">Beneficiario</p><p className="font-black text-slate-800">{viewingSlip.targetName}</p></div>
                    <div className="text-right"><p className="text-slate-400 font-bold uppercase text-[9px]">Fecha de Pago</p><p className="font-black text-slate-800">{new Date(viewingSlip.date).toLocaleDateString()}</p></div>
                    <div className="col-span-2"><p className="text-slate-400 font-bold uppercase text-[9px]">Concepto / Descripción</p><p className="font-black text-slate-800">{viewingSlip.description}</p></div>
                  </div>

                  <div className="border-t-2 border-dashed border-slate-100 pt-6 flex justify-between items-end">
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pagado</p><p className="text-3xl font-black text-emerald-600">${viewingSlip.amount.toLocaleString()}</p></div>
                    <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-[10px] font-black text-emerald-700 uppercase">Transacción Exitosa</span></div>
                  </div>

                  <div className="mt-12 grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                    <div className="text-center"><div className="border-b border-slate-300 h-10 mb-2"></div><p className="text-[8px] font-bold text-slate-400 uppercase">Firma Autorizada</p></div>
                    <div className="text-center"><div className="border-b border-slate-300 h-10 mb-2"></div><p className="text-[8px] font-bold text-slate-400 uppercase">Recibí Conforme</p></div>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-slate-50 border-t shrink-0 flex gap-4">
               <button onClick={() => setViewingSlip(null)} className="flex-1 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition">Cerrar</button>
               <button onClick={() => window.print()} className="flex-1 py-3 bg-purple-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition shadow-xl shadow-purple-200 flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Imprimir Volante</button>
            </div>
          </div>
        </div>
      )}

      {/* EL RESTO DEL CÓDIGO (FORMULARIOS) SIGUE IGUAL... */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-purple-50">
              <h3 className="text-xl font-bold text-purple-900">{selectedTeacher ? 'Editar Docente' : 'Nuevo Registro de Docente'}</h3>
              <button onClick={closeForm} className="text-purple-400 hover:text-purple-600"><X /></button>
            </div>
            <form onSubmit={handleSaveTeacher} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-3">Foto del Docente</label>
                  <div className="relative group w-full aspect-square max-w-[200px] mx-auto">
                    <div className="w-full h-full rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative">
                      {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <><UserIcon className="w-12 h-12 mb-2" /><span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Subir Foto</span></>}
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"><Camera className="w-8 h-8" /></button>
                    </div>
                    <input type="file" ref={photoInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                  </div>
                </div>
                <div className="pt-4">
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-3">Hoja de Vida (PDF)</label>
                  <div onClick={() => resumeInputRef.current?.click()} className={`w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${resumeData ? 'bg-purple-50 border-purple-300' : 'bg-slate-50 border-slate-200 hover:border-purple-300'}`}>
                    {resumeData ? <><FileText className="w-8 h-8 text-purple-600 mb-2" /><p className="text-xs font-bold text-purple-700">PDF Cargado</p></> : <><Upload className="w-8 h-8 text-slate-400 mb-2" /><p className="text-xs font-bold text-slate-500">Seleccionar PDF</p></>}
                  </div>
                  <input type="file" ref={resumeInputRef} onChange={handleResumeChange} accept="application/pdf" className="hidden" />
                </div>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><h4 className="text-xs font-bold uppercase text-purple-400 tracking-widest border-b pb-2 mb-2">Información Personal</h4></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombres</label><input name="firstName" defaultValue={selectedTeacher?.firstName} required className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Apellidos</label><input name="lastName" defaultValue={selectedTeacher?.lastName} required className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Edad</label><input type="number" name="age" defaultValue={selectedTeacher?.age} required className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tipo de Sangre (RH)</label><select name="bloodType" defaultValue={selectedTeacher?.bloodType} className="w-full border rounded-lg px-4 py-2">{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Dirección de Residencia</label><input name="address" defaultValue={selectedTeacher?.address} required className="w-full border rounded-lg px-4 py-2" /></div>
                <div className="md:col-span-2 mt-4"><h4 className="text-xs font-bold uppercase text-purple-400 tracking-widest border-b pb-2 mb-2">Categorías Asignadas</h4><div className="grid grid-cols-2 gap-2 mt-2">{CATEGORIES.map(cat => { const isSelected = selectedFormCategories.includes(cat); return (<button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border ${isSelected ? 'bg-purple-600 text-white border-purple-500 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}{cat}</button>);})}</div></div>
                <div className="md:col-span-2 mt-4"><h4 className="text-xs font-bold uppercase text-purple-400 tracking-widest border-b pb-2 mb-2">Contacto y Laboral</h4></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Correo Electrónico</label><input type="email" name="email" defaultValue={selectedTeacher?.email} required className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Teléfono</label><input name="phone" defaultValue={selectedTeacher?.phone} required className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Fecha de Ingreso</label><input type="date" name="entryDate" defaultValue={selectedTeacher?.entryDate} required className="w-full border rounded-lg px-4 py-2" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Número de Cuenta Bancaria</label><input name="bankAccount" defaultValue={selectedTeacher?.bankAccount} required className="w-full border rounded-lg px-4 py-2" /></div>
                <div className="md:col-span-2 pt-6"><button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 shadow-lg transition text-lg">{selectedTeacher ? 'Actualizar Docente' : 'Registrar Docente'}</button></div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManager;
