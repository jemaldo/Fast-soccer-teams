
import React, { useState, useRef, useMemo } from 'react';
import { Teacher, Payment, BloodType, SchoolSettings } from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Banknote, 
  X, 
  FileUp, 
  FileDown, 
  History, 
  Camera, 
  User as UserIcon, 
  CheckSquare, 
  Square,
  Upload,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
  Briefcase
} from 'lucide-react';
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
  const [selectedFormCategories, setSelectedFormCategories] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<string | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const headers = [
      "ID", "Nombres", "Apellidos", "Categorias", "Edad", "RH", "Direccion", "Telefono", "Email", "Cuenta Bancaria", "Fecha Ingreso"
    ];
    downloadTemplate(headers, "Plantilla_Docentes_Academia");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      const importedTeachers: Teacher[] = data.map((row: any) => ({
        id: row.ID?.toString() || Date.now().toString() + Math.random(),
        firstName: row.Nombres || "",
        lastName: row.Apellidos || "",
        categories: row.Categorias ? row.Categorias.split(',').map((c: string) => c.trim()) : [],
        age: Number(row.Edad) || 0,
        bloodType: (row.RH || "O+") as BloodType,
        address: row.Direccion || "",
        phone: row.Telefono?.toString() || "",
        email: row.Email || "",
        bankAccount: row["Cuenta Bancaria"]?.toString() || "",
        entryDate: row["Fecha Ingreso"] || new Date().toISOString().split('T')[0]
      }));

      setTeachers(prev => [...prev, ...importedTeachers]);
      alert(`${importedTeachers.length} docentes importados correctamente.`);
    } catch (error) {
      alert("Error al procesar el archivo. Verifique el formato.");
    }
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

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setResumeData(reader.result as string);
      reader.readAsDataURL(file);
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
    setSelectedFormCategories(teacher.categories || []);
    setShowForm(true);
  };

  const toggleCategory = (cat: string) => {
    setSelectedFormCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
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

  const filteredTeachers = teachers.filter(t => 
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER DE ACCIONES */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar docente por nombre..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-purple-500 transition-all" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <button 
              onClick={handleDownloadTemplate} 
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"
            >
              <FileDown className="w-4 h-4" /> Plantilla
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition"
            >
              <FileUp className="w-4 h-4" /> Carga Masiva
            </button>
            <button 
              onClick={() => { setShowForm(true); setSelectedTeacher(null); setPhotoPreview(null); setSelectedFormCategories([]); }} 
              className="w-full lg:w-auto bg-purple-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nuevo Docente
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          </div>
        </div>
      </div>

      {/* LISTADO DE DOCENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
        {filteredTeachers.map(teacher => (
          <div key={teacher.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:border-purple-200 transition-all duration-300">
            <div className="p-8 border-b border-slate-50 relative">
              <div className="flex justify-between items-start mb-6">
                <div className="w-20 h-20 rounded-[1.5rem] bg-purple-100 flex items-center justify-center text-purple-600 font-black text-3xl uppercase overflow-hidden shadow-inner">
                  {teacher.photo ? <img src={teacher.photo} className="w-full h-full object-cover" /> : <>{teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}</>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button onClick={() => setHistoryTeacherId(teacher.id)} title="Historial Pagos" className="p-2.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition"><History className="w-4 h-4" /></button>
                  <button onClick={() => handleEdit(teacher)} title="Editar" className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition"><Edit2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h4 className="text-xl font-black text-slate-800 tracking-tighter truncate">{teacher.firstName} {teacher.lastName}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-4 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {teacher.address || 'Sin dirección'}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(teacher.categories || []).map(c => (
                  <span key={c} className="text-[9px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-tighter border border-purple-100">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex gap-2">
              <button 
                onClick={() => handlePayroll(teacher)} 
                className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Banknote className="w-4 h-4" /> Pago Nómina
              </button>
            </div>
          </div>
        ))}
        {filteredTeachers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
             <UserIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No se encontraron docentes</p>
          </div>
        )}
      </div>

      {/* FORMULARIO DE DOCENTE (COMPLETO RESTAURADO) */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-purple-600 text-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                   <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{selectedTeacher ? 'Editar Perfil Docente' : 'Nuevo Registro de Docente'}</h3>
                  <p className="text-xs font-bold text-purple-100 uppercase tracking-widest">Gestión Integral de Personal</p>
                </div>
              </div>
              <button onClick={closeForm} className="p-2 hover:bg-purple-700 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveTeacher} className="flex-1 overflow-y-auto p-10">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Columna Lateral: Foto y CV */}
                <div className="lg:col-span-1 space-y-8 flex flex-col items-center">
                  <div className="relative group w-full aspect-square max-w-[240px]">
                    <div className="w-full h-full rounded-[2.5rem] bg-slate-100 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative group-hover:border-purple-300 transition-all">
                      {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <><UserIcon className="w-12 h-12 mb-3 opacity-20" /><span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Subir Foto</span></>}
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white flex-col gap-2">
                        <Camera className="w-8 h-8" />
                        <span className="text-[10px] font-bold uppercase">Cargar</span>
                      </button>
                    </div>
                    <input type="file" ref={photoInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                  </div>

                  <div className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                    <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Hoja de Vida / CV</h4>
                    {resumeData ? (
                       <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-100">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">Documento Cargado</span>
                          <button type="button" onClick={() => setResumeData(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                       </div>
                    ) : (
                      <button type="button" onClick={() => resumeInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white hover:border-purple-300 transition-all">
                         <Upload className="w-5 h-5 text-slate-300" />
                         <span className="text-[9px] font-black text-slate-400 uppercase">Adjuntar PDF/DOC</span>
                      </button>
                    )}
                    <input type="file" ref={resumeInputRef} onChange={handleResumeChange} className="hidden" />
                  </div>
                </div>
                
                {/* Columna Principal: Datos */}
                <div className="lg:col-span-3 space-y-10">
                  {/* Sección 1: Datos Personales */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-widest border-b border-purple-50 pb-3 mb-6 flex items-center gap-2"><UserIcon className="w-3.5 h-3.5" /> Información Personal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 px-1">Nombres</label>
                        <input name="firstName" defaultValue={selectedTeacher?.firstName} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 px-1">Apellidos</label>
                        <input name="lastName" defaultValue={selectedTeacher?.lastName} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 px-1">Edad</label>
                        <input type="number" name="age" defaultValue={selectedTeacher?.age} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 px-1">Grupo Sanguíneo (RH)</label>
                        <select name="bloodType" defaultValue={selectedTeacher?.bloodType || 'O+'} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none">
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(rh => <option key={rh} value={rh}>{rh}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 px-1 flex items-center gap-1.5"><Mail className="w-3 h-3" /> Correo Electrónico</label>
                        <input type="email" name="email" defaultValue={selectedTeacher?.email} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 px-1">Teléfono</label>
                        <input name="phone" defaultValue={selectedTeacher?.phone} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 px-1 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Dirección de Residencia</label>
                        <input name="address" defaultValue={selectedTeacher?.address} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Categorías y Contratación */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-widest border-b border-purple-50 pb-3 mb-6 flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5" /> Asignación Profesional</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-4 px-1">Categorías a Cargo</label>
                          <div className="grid grid-cols-2 gap-2">
                            {schoolSettings.categories.map(cat => {
                              const isSelected = selectedFormCategories.includes(cat);
                              return (
                                <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border ${isSelected ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-purple-300'}`}>
                                  {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-30" />}
                                  {cat}
                                </button>
                              );
                            })}
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div>
                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 px-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Fecha de Ingreso</label>
                            <input type="date" name="entryDate" defaultValue={selectedTeacher?.entryDate || new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 px-1 flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> Cuenta Bancaria (Nómina)</label>
                            <input name="bankAccount" defaultValue={selectedTeacher?.bankAccount} placeholder="Tipo, Banco y Número" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none" />
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={closeForm} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                    <button type="submit" className="flex-[2] bg-purple-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-purple-700 shadow-xl shadow-purple-200 transition-all flex items-center justify-center gap-3 active:scale-95">
                      <Plus className="w-5 h-5" /> {selectedTeacher ? 'Actualizar Ficha Profesional' : 'Registrar Nuevo Docente'}
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

export default TeacherManager;
