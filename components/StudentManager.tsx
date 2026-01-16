
import React, { useState, useRef, useMemo } from 'react';
import { Student, Teacher, Payment, BloodType, SchoolSettings } from '../types';
import { 
  Plus, Search, Edit2, Trash2, X as CloseIcon, Camera, User, 
  CheckCircle, AlertTriangle, Info, Users as UsersIcon, Save,
  UserCheck
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
  schoolSettings: SchoolSettings;
  teachers: Teacher[];
}

const StudentManager: React.FC<Props> = ({ students, setStudents, schoolSettings, teachers }) => {
  const [showForm, setShowForm] = useState(false);
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
      isPaidUp: formData.get('isPaidUp') === 'on',
      photo: photoPreview || undefined,
      teacherId: formData.get('teacherId') as string,
      trainingType: formData.get('trainingType') as 'Formativa' | 'Elite',
      parents: [{ 
        name: formData.get('parentName') as string, 
        phone: formData.get('parentPhone') as string, 
        address: formData.get('parentAddress') as string 
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

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || s.dni.includes(searchTerm);
      const matchesCategory = categoryFilter === '' || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [students, searchTerm, categoryFilter]);

  const getTeacherName = (id?: string) => {
    if (!id) return 'Sin asignar';
    const teacher = teachers.find(t => t.id === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'No encontrado';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-4 flex-1 min-w-[300px]">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" placeholder="Buscar por nombre o DNI..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
           <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none uppercase">
              <option value="">Todas las Categorías</option>
              {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
        <button onClick={() => { setShowForm(true); setSelectedStudent(null); setPhotoPreview(null); }} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition flex items-center gap-2 shadow-xl shadow-blue-100">
          <Plus className="w-5 h-5" /> Inscribir Alumno
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Atleta</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Categoría / Posición</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Entrenador</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Médico / IMC</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Estado</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50/80 transition">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner">
                      {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <User className="w-6 h-6 m-auto mt-2.5 text-slate-300" />}
                    </div>
                    <div>
                       <span className="font-black text-slate-900 text-sm block leading-none mb-1 uppercase tracking-tight">{student.fullName}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase">DNI: {student.dni} | {student.phone}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-md">{student.category}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{student.position}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                      {getTeacherName(student.teacherId)}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-[10px] font-bold text-slate-600">
                    <p>RH: <span className="text-red-600">{student.bloodType}</span></p>
                    <p>IMC: <span className="text-slate-900">{student.bmi || 'N/A'}</span></p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  {student.isPaidUp ? 
                    <div className="flex items-center gap-1.5 text-emerald-600">
                       <CheckCircle className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase">Al Día</span>
                    </div> : 
                    <div className="flex items-center gap-1.5 text-red-500">
                       <AlertTriangle className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase">Pendiente</span>
                    </div>
                  }
                </td>
                <td className="px-8 py-5 text-right">
                   <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedStudent(student); setPhotoPreview(student.photo || null); setShowForm(true); }} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition shadow-sm"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if(confirm('¿Eliminar alumno?')) setStudents(students.filter(s => s.id !== student.id))}} className="p-2.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition shadow-sm"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Expediente del Atleta</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Completa todos los campos para el registro oficial</p>
              </div>
              <button onClick={() => setShowForm(false)} className="bg-white border border-slate-200 p-4 rounded-2xl text-slate-400 hover:text-red-500 transition shadow-xl"><CloseIcon className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-10">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Columna Izquierda: Foto y Datos Médicos */}
                <div className="space-y-8">
                  <div className="relative group w-full aspect-square max-w-[280px] mx-auto">
                    <div className="w-full h-full rounded-[3rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 overflow-hidden shadow-inner transition group-hover:border-blue-400">
                      {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Camera className="w-16 h-16" />}
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">Actualizar Foto</button>
                    </div>
                    <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-b border-blue-100 pb-2">Datos Físicos</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Peso (kg)</label>
                        <input name="weight" type="number" step="0.1" defaultValue={selectedStudent?.weight} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Talla (cm)</label>
                        <input name="height" type="number" defaultValue={selectedStudent?.height} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Grupo Sanguíneo</label>
                      <select name="bloodType" defaultValue={selectedStudent?.bloodType || 'O+'} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Columnas Centrales: Datos Personales y Académicos */}
                <div className="lg:col-span-3 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Nombres Completos *</label>
                      <input name="fullName" defaultValue={selectedStudent?.fullName} required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Documento (DNI/TI) *</label>
                       <input name="dni" defaultValue={selectedStudent?.dni} required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Fecha Nacimiento</label>
                       <input name="birthDate" type="date" defaultValue={selectedStudent?.birthDate} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Edad Actual</label>
                       <input name="age" type="number" defaultValue={selectedStudent?.age} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Teléfono Contacto</label>
                       <input name="phone" defaultValue={selectedStudent?.phone} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Información Académica</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <input name="school" placeholder="Institución Educativa" defaultValue={selectedStudent?.school} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                        <input name="grade" placeholder="Grado / Curso" defaultValue={selectedStudent?.grade} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                      </div>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Deportivo</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <select name="category" defaultValue={selectedStudent?.category} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none">
                          {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select name="position" defaultValue={selectedStudent?.position} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none">
                          {schoolSettings.positions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select name="trainingType" defaultValue={selectedStudent?.trainingType || 'Formativa'} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none">
                          <option value="Formativa">Formativa</option>
                          <option value="Elite">Elite / Selección</option>
                        </select>
                        <select name="teacherId" defaultValue={selectedStudent?.teacherId} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none">
                          <option value="">Seleccionar Entrenador</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                        </select>
                        <input name="entryDate" type="date" defaultValue={selectedStudent?.entryDate || new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none col-span-2" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl">
                    <h4 className="text-[10px] font-black uppercase text-blue-200 tracking-widest mb-6">Información de Acudientes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[9px] font-black uppercase mb-1 opacity-70">Nombre Padre/Madre</label>
                        <input name="parentName" defaultValue={selectedStudent?.parents[0]?.name} className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-bold outline-none focus:bg-white/20" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase mb-1 opacity-70">Teléfono Acudiente</label>
                        <input name="parentPhone" defaultValue={selectedStudent?.parents[0]?.phone} className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-bold outline-none focus:bg-white/20" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase mb-1 opacity-70">Dirección Familiar</label>
                        <input name="parentAddress" defaultValue={selectedStudent?.parents[0]?.address} className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-bold outline-none focus:bg-white/20" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" name="isPaidUp" id="isPaidUp" defaultChecked={selectedStudent?.isPaidUp} className="w-6 h-6 rounded-lg text-blue-600 border-slate-300 focus:ring-blue-500" />
                      <label htmlFor="isPaidUp" className="text-sm font-black text-slate-700 uppercase tracking-tight">El alumno se encuentra al día en sus pagos</label>
                    </div>
                    <button type="submit" className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition shadow-2xl flex items-center gap-3">
                      <Save className="w-5 h-5" /> Guardar Registro Final
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
