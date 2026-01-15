
import React, { useState, useRef, useMemo } from 'react';
import { Student, Teacher, Payment, BloodType, SchoolSettings } from '../types';
import { 
  Plus, Search, Edit2, Trash2, CreditCard, UserCheck, UserX, History, 
  X as CloseIcon, Camera, User, Eye, CheckCircle, AlertTriangle, 
  CalendarCheck, Check, Info, Medal, Users as UsersIcon, FileDown, FileUp 
} from 'lucide-react';
import { parseExcelFile, downloadTemplate } from '../services/excelService';

// Función para comprimir imagen a tamaño carnet (max 200px)
const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 200;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compresión al 70% calidad
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

const StudentManager: React.FC<Props> = ({ students, setStudents, payments, setPayments, schoolSettings, teachers }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [paidStatusFilter, setPaidStatusFilter] = useState<'ALL' | 'PAID' | 'DEBTOR'>('ALL');
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [paymentModalStudent, setPaymentModalStudent] = useState<Student | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [paymentYear, setPaymentYear] = useState<number>(new Date().getFullYear());
  const [monthlyAmount, setMonthlyAmount] = useState<number>(50000);

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleSaveStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const birthDate = formData.get('birthDate') as string;

    const newStudent: Student = {
      id: selectedStudent?.id || Date.now().toString(),
      fullName: formData.get('fullName') as string,
      dni: formData.get('dni') as string,
      birthDate,
      age: 0, 
      bloodType: formData.get('bloodType') as BloodType,
      school: formData.get('school') as string,
      grade: formData.get('grade') as string,
      weight: Number(formData.get('weight')),
      height: Number(formData.get('height')),
      bmi: 0,
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

  // ... (Resto de funciones de pago y filtrado iguales a la versión anterior)
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === '' || s.category === categoryFilter;
      const matchesPaidStatus = paidStatusFilter === 'ALL' || (paidStatusFilter === 'PAID' && s.isPaidUp) || (paidStatusFilter === 'DEBTOR' && !s.isPaidUp);
      return matchesSearch && matchesCategory && matchesPaidStatus;
    });
  }, [students, searchTerm, categoryFilter, paidStatusFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2 flex-1 min-w-[300px]">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="Buscar atleta..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
           <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
              <option value="">Categorías</option>
              {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
        <button onClick={() => { setShowForm(true); setSelectedStudent(null); setPhotoPreview(null); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200">
          <Plus className="w-4 h-4" /> Nuevo Alumno
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Alumno</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Categoría</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Contacto</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Estado</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                      {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-slate-400" />}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{student.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-600">{student.category}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{student.phone}</td>
                <td className="px-6 py-4">
                  {student.isPaidUp ? 
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Paz y Salvo</span> : 
                    <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">Moroso</span>
                  }
                </td>
                <td className="px-6 py-4 text-right">
                   <button onClick={() => { setSelectedStudent(student); setPhotoPreview(student.photo || null); setShowForm(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Ficha del Atleta</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500"><CloseIcon /></button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden relative group">
                  {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Camera className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" />}
                  <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold uppercase">Cambiar Foto</button>
                </div>
                <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                <p className="text-[10px] text-slate-400 font-bold uppercase text-center italic">Las fotos se optimizan automáticamente para ahorrar espacio en la nube.</p>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Nombre Completo *</label>
                  <input name="fullName" defaultValue={selectedStudent?.fullName} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Documento (DNI)</label>
                   <input name="dni" defaultValue={selectedStudent?.dni} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Categoría</label>
                   <select name="category" defaultValue={selectedStudent?.category} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
                      {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="md:col-span-2 pt-6">
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-100">Guardar Atleta</button>
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
