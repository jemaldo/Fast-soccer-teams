
import React, { useState, useRef, useMemo } from 'react';
import { Student, Payment, BloodType, SchoolSettings } from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CreditCard, 
  UserCheck, 
  UserX, 
  Printer, 
  FileUp, 
  FileDown, 
  History, 
  X as CloseIcon, 
  Calendar, 
  Camera, 
  User, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  CalendarCheck, 
  Check,
  ChevronDown,
  Info
} from 'lucide-react';
import { parseExcelFile, downloadTemplate } from '../services/excelService';

interface Props {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  schoolSettings: SchoolSettings;
}

const StudentManager: React.FC<Props> = ({ students, setStudents, payments, setPayments, schoolSettings }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [paidStatusFilter, setPaidStatusFilter] = useState<'ALL' | 'PAID' | 'DEBTOR'>('ALL');
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Payment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Estados para el Modal de Pagos Múltiples
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
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const dni = formData.get('dni') as string;
    const birthDate = formData.get('birthDate') as string;
    const parentName = formData.get('parentName') as string;
    const parentPhone = formData.get('parentPhone') as string;

    if (!fullName.trim() || !birthDate || !parentName.trim() || !parentPhone.trim()) {
      alert("Error: Los campos obligatorios (*) no pueden estar vacíos.");
      return;
    }

    const weight = Number(formData.get('weight'));
    const height = Number(formData.get('height'));

    const newStudent: Student = {
      id: selectedStudent?.id || Date.now().toString(),
      fullName, 
      dni, 
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
      parents: [{ 
        name: parentName, 
        phone: parentPhone, 
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

  const handleOpenPaymentModal = (student: Student) => {
    setPaymentModalStudent(student);
    setSelectedMonths([]);
    setPaymentYear(new Date().getFullYear());
  };

  const toggleMonthSelection = (monthIndex: number) => {
    if (isMonthAlreadyPaid(monthIndex)) return;
    setSelectedMonths(prev => 
      prev.includes(monthIndex) ? prev.filter(m => m !== monthIndex) : [...prev, monthIndex]
    );
  };

  const isMonthAlreadyPaid = (monthIndex: number) => {
    if (!paymentModalStudent) return false;
    const monthName = new Date(paymentYear, monthIndex).toLocaleString('es-ES', { month: 'long' });
    return payments.some(p => 
      p.targetId === paymentModalStudent.id && 
      p.type === 'STUDENT_MONTHLY' && 
      (p.description.toLowerCase().includes(monthName.toLowerCase()) && 
       p.description.includes(paymentYear.toString()))
    );
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
    
    setStudents(students.map(s => 
      s.id === paymentModalStudent.id ? { ...s, isPaidUp: true } : s
    ));

    alert(`✅ Se han registrado ${newPayments.length} mensualidades exitosamente.`);
    setPaymentModalStudent(null);
    setSelectedMonths([]);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcelFile(file);
      const importedStudents: Student[] = data.map((row: any) => {
        const weight = Number(row.Peso || 0);
        const height = Number(row.Talla || 0);
        const bDay = row.FechaNacimiento || "";
        return {
          id: Date.now().toString() + Math.random(),
          fullName: row.NombreCompleto || "Sin nombre",
          dni: row.DNI || "", 
          birthDate: bDay,
          age: calculateAge(bDay), 
          bloodType: (row.RH || "O+") as BloodType,
          school: row.Colegio || "", 
          grade: row.Grado || "", 
          weight, 
          height,
          bmi: calculateBMI(weight, height), 
          address: row.Direccion || "", 
          phone: row.Telefono || "",
          observations: row.Observations || "", 
          category: row.Categoria || schoolSettings.categories[0],
          position: row.Posicion || schoolSettings.positions[0], 
          entryDate: row.FechaIngreso || new Date().toISOString().split('T')[0],
          isPaidUp: row.PazYSalvo === "SI",
          parents: [{ 
            name: row.NombrePadre || "", 
            phone: row.TelefonoPadre || "", 
            address: row.DireccionPadre || "" 
          }]
        };
      });
      setStudents([...students, ...importedStudents]);
      alert(`Se importaron ${importedStudents.length} alumnos correctamente.`);
    } catch (err) { alert("Error al procesar el archivo Excel."); }
    e.target.value = "";
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
    return payments
      .filter(p => p.targetId === historyStudentId && p.type === 'STUDENT_MONTHLY')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historyStudentId, payments]);

  const historyStudent = students.find(s => s.id === historyStudentId);
  const studentToDelete = students.find(s => s.id === deleteConfirmId);

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-wrap gap-4 w-full md:w-auto flex-1">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por nombre..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
              <option value="">Todas las categorías</option>
              {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={paidStatusFilter} onChange={(e) => setPaidStatusFilter(e.target.value as any)} className="pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none">
              <option value="ALL">Todos los estados</option>
              <option value="PAID">Paz y Salvo</option>
              <option value="DEBTOR">Deudor</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => downloadTemplate(["NombreCompleto", "DNI", "FechaNacimiento"], "Plantilla_Alumnos")} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 text-sm font-semibold"><FileDown className="w-4 h-4" /> Plantilla</button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-900 text-sm font-semibold"><FileUp className="w-4 h-4" /> Importar</button>
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" />
            <button onClick={() => { setShowForm(true); setSelectedStudent(null); setPhotoPreview(null); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm transition-all shadow-lg shadow-blue-200">
              <Plus className="w-4 h-4" /> Nuevo Alumno
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto no-print">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Alumno</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Categoría</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Contacto</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Estado</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No se encontraron alumnos con los filtros seleccionados.</td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-slate-200">
                        {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : student.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{student.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">DNI: {student.dni || 'S/D'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{student.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{student.phone}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {student.isPaidUp ? (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-200">
                          <UserCheck className="w-3 h-3" /> Paz y Salvo
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-red-200">
                          <UserX className="w-3 h-3" /> Moroso
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setHistoryStudentId(student.id)} title="Historial" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><History className="w-4 h-4" /></button>
                      <button onClick={() => handleOpenPaymentModal(student)} title="Recaudar" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"><CreditCard className="w-4 h-4" /></button>
                      <button onClick={() => { setSelectedStudent(student); setPhotoPreview(student.photo || null); setShowForm(true); }} title="Editar" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirmId(student.id)} title="Eliminar" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FORMULARIO NUEVO/EDITAR ALUMNO */}
      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl text-white">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  {selectedStudent ? 'Actualizar Ficha de Alumno' : 'Registro de Nuevo Atleta'}
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full">
                <CloseIcon />
              </button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Foto de Perfil */}
              <div className="md:col-span-1 space-y-6 flex flex-col items-center">
                <div className="w-full max-w-[200px] aspect-square relative group">
                  <div className="w-full h-full rounded-[2.5rem] bg-slate-100 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative transition-all group-hover:border-blue-400">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-12 h-12 mb-3 opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Subir Fotografía</span>
                      </>
                    )}
                    <button 
                      type="button" 
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white flex-col gap-2"
                    >
                      <Camera className="w-8 h-8" />
                      <span className="text-[10px] font-black uppercase">Cambiar Foto</span>
                    </button>
                  </div>
                  <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                </div>
                
                <div className="w-full space-y-4 pt-4">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <h5 className="text-[10px] font-black uppercase text-blue-600 mb-2 tracking-widest">Información Deportiva</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Categoría Asignada</label>
                        <select name="category" defaultValue={selectedStudent?.category || schoolSettings.categories[0]} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                          {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Posición en el Campo</label>
                        <select name="position" defaultValue={selectedStudent?.position || schoolSettings.positions[0]} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                          {schoolSettings.positions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos Personales */}
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 border-b pb-2 flex items-center gap-2">
                    <User className="w-3 h-3" /> Datos Generales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Nombre Completo *</label>
                      <input name="fullName" defaultValue={selectedStudent?.fullName} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Juan Pérez" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Documento (DNI/TI) *</label>
                      <input name="dni" defaultValue={selectedStudent?.dni} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Fecha Nacimiento *</label>
                      <input type="date" name="birthDate" defaultValue={selectedStudent?.birthDate} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">RH / Tipo Sangre</label>
                      <select name="bloodType" defaultValue={selectedStudent?.bloodType} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Fecha de Ingreso</label>
                      <input type="date" name="entryDate" defaultValue={selectedStudent?.entryDate || new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 border-b pb-2 flex items-center gap-2">
                    <Info className="w-3 h-3" /> Acudiente y Contacto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Nombre del Acudiente *</label>
                      <input name="parentName" defaultValue={selectedStudent?.parents[0]?.name} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Teléfono Acudiente *</label>
                      <input name="parentPhone" defaultValue={selectedStudent?.parents[0]?.phone} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Dirección de Residencia</label>
                      <input name="parentAddress" defaultValue={selectedStudent?.parents[0]?.address} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </section>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">Cancelar</button>
                  <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-200">
                    {selectedStudent ? 'Guardar Cambios' : 'Registrar Atleta'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PAGOS MÚLTIPLES */}
      {paymentModalStudent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-emerald-600 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <CalendarCheck className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase tracking-tight">Recaudación de Mensualidades</h3>
                <p className="text-emerald-100 font-bold mt-1">{paymentModalStudent.fullName}</p>
              </div>
              <button onClick={() => setPaymentModalStudent(null)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition"><CloseIcon /></button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="w-full">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Año de Vigencia</label>
                  <select 
                    value={paymentYear} 
                    onChange={(e) => setPaymentYear(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[2023, 2024, 2025].map(y => <option key={y} value={y}>Ciclo {y}</option>)}
                  </select>
                </div>
                <div className="w-full">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Valor por Mes ($)</label>
                  <input 
                    type="number" 
                    value={monthlyAmount} 
                    onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest text-center">Selecciona las mensualidades a cancelar</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const paid = isMonthAlreadyPaid(i);
                    const selected = selectedMonths.includes(i);
                    return (
                      <button 
                        key={i}
                        disabled={paid}
                        onClick={() => toggleMonthSelection(i)}
                        className={`
                          p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2
                          ${paid ? 'bg-emerald-50 border-emerald-100 opacity-60 cursor-not-allowed text-emerald-600' : 
                            selected ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-105' : 
                            'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'}
                        `}
                      >
                        <span className={`text-[10px] font-black uppercase ${selected ? 'text-white' : 'text-slate-400'}`}>
                          {new Date(2000, i).toLocaleString('es-ES', { month: 'short' })}
                        </span>
                        {paid ? <CheckCircle className="w-5 h-5" /> : selected ? <Check className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-100">
                <div className="flex-1 bg-slate-900 text-white p-6 rounded-3xl flex justify-between items-center shadow-xl">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Recaudado</p>
                    <p className="text-3xl font-black">${(selectedMonths.length * monthlyAmount).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Meses</p>
                    <p className="text-2xl font-black">{selectedMonths.length}</p>
                  </div>
                </div>
                <button 
                  onClick={processBatchPayment}
                  disabled={selectedMonths.length === 0}
                  className="px-10 py-6 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-xl disabled:opacity-50"
                >
                  Registrar Cobro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORIAL DE ALUMNO */}
      {historyStudentId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
                  {historyStudent?.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Historial Financiero</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{historyStudent?.fullName}</p>
                </div>
              </div>
              <button onClick={() => setHistoryStudentId(null)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition">
                <CloseIcon />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white border-b-2 border-slate-100 mb-4">
                  <tr>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha Pago</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Concepto</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monto</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historyData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-300 italic font-medium">No se registran pagos de mensualidades aún.</td>
                    </tr>
                  ) : (
                    historyData.map(p => (
                      <tr key={p.id} className="group hover:bg-slate-50/50 transition">
                        <td className="py-4 text-sm font-bold text-slate-600">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="py-4 text-sm font-black text-slate-800 uppercase tracking-tighter">{p.description}</td>
                        <td className="py-4 text-sm font-black text-emerald-600">${p.amount.toLocaleString()}</td>
                        <td className="py-4 text-right">
                          <button className="p-2 text-slate-300 group-hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Printer className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Acumulado del Año</p>
                  <p className="text-2xl font-black text-slate-900">${historyData.reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
               </div>
               <button onClick={() => setHistoryStudentId(null)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition shadow-xl">Cerrar Historial</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">¿Eliminar Registro?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
              Estás a punto de borrar a <span className="font-bold text-slate-800">"{studentToDelete?.fullName}"</span>. Esta acción no se puede deshacer y borrará su ficha técnica.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">Conservar</button>
              <button 
                onClick={() => {
                  setStudents(students.filter(s => s.id !== deleteConfirmId));
                  setDeleteConfirmId(null);
                }} 
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition shadow-xl shadow-red-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
