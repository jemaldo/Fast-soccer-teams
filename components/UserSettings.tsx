
import React, { useRef, useState } from 'react';
import { User, SchoolSettings } from '../types';
import { 
  Building2, Globe, ShieldCheck, Database, Rocket, 
  Terminal, Copy, Check, PlayCircle, WifiOff, Users as UsersIcon,
  Trash2, Plus, Target, GraduationCap, Key, Save, Edit3, X, UserRound,
  Download, Upload, History, AlertTriangle, FileJson
} from 'lucide-react';

interface Props {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User | null;
  schoolSettings: SchoolSettings;
  setSchoolSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
  allData: any; 
  onImportData: (data: any) => void;
  onSeedData: () => void;
}

const SQL_SCRIPT = `-- SCRIPT DEFINITIVO ACADEMIA DEPORTIVA PRO
-- EJECUTA ESTO EN EL SQL EDITOR DE SUPABASE PARA CREAR LA ESTRUCTURA COMPLETA

-- 1. TABLA DE ALUMNOS (CAMPOS DISCRIMINADOS)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  dni TEXT NOT NULL,
  "birthDate" TEXT,
  age INTEGER,
  "bloodType" TEXT,
  lateralidad TEXT, -- DIESTRO, ZURDO, AMBOS
  school TEXT,
  grade TEXT,
  weight FLOAT,
  height FLOAT,
  bmi FLOAT,
  address TEXT,
  phone TEXT,
  photo TEXT,
  observations TEXT,
  parents JSONB, -- Almacena array [{name, phone, address}]
  category TEXT,
  position TEXT,
  "entryDate" TEXT,
  "exitDate" TEXT, -- Fecha de Egreso
  "isPaidUp" BOOLEAN DEFAULT false,
  "teacherId" TEXT, -- Técnico/Entrenador asignado
  "trainingType" TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE DOCENTES (TÉCNICOS)
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  category TEXT,
  age INTEGER,
  "bloodType" TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  "bankAccount" TEXT,
  "entryDate" TEXT,
  photo TEXT,
  "resumeUrl" TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE CAJA (INCLUYE APERTURA)
CREATE TABLE IF NOT EXISTS cash_flow (
  id TEXT PRIMARY KEY,
  date TEXT,
  type TEXT, -- INCOME, OUTCOME, OPENING
  amount FLOAT,
  description TEXT,
  "user" TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA DE PAGOS Y CARTERA
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  date TEXT,
  amount FLOAT,
  type TEXT,
  "targetId" TEXT,
  "targetName" TEXT,
  description TEXT,
  status TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DESHABILITAR RLS PARA USO ACADÉMICO / DESARROLLO RÁPIDO
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
`;

const UserSettings: React.FC<Props> = ({ 
  users, setUsers, schoolSettings, setSchoolSettings, allData, onImportData, onSeedData 
}) => {
  const [activeTab, setActiveTab] = useState<'SCHOOL' | 'CLOUD' | 'BACKUP' | 'USERS'>('SCHOOL');
  const [newItem, setNewItem] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const addItem = (type: 'categories' | 'positions') => {
    if (!newItem.trim()) return;
    setSchoolSettings(prev => ({ ...prev, [type]: [...prev[type], newItem.trim()] }));
    setNewItem('');
  };

  const removeItem = (type: 'categories' | 'positions', item: string) => {
    setSchoolSettings(prev => ({ ...prev, [type]: prev[type].filter(i => i !== item) }));
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `backup_academia_${schoolSettings.name.replace(/\s+/g, '_').toLowerCase()}_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ ATENCIÓN: Restaurar una copia de seguridad sobrescribirá todos los datos actuales del sistema. ¿Deseas continuar?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportData(json);
        e.target.value = '';
      } catch (err) {
        alert("❌ Error al leer el archivo. Asegúrate de que es un respaldo válido de Academia Deportiva Pro.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 no-print">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Configuración</h2>
        <div className="flex flex-wrap gap-4 mt-8">
           <button onClick={() => setActiveTab('SCHOOL')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition ${activeTab === 'SCHOOL' ? 'bg-blue-600' : 'bg-white/10'}`}>Institución</button>
           <button onClick={() => setActiveTab('USERS')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition ${activeTab === 'USERS' ? 'bg-blue-600' : 'bg-white/10'}`}>Usuarios</button>
           <button onClick={() => setActiveTab('CLOUD')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition ${activeTab === 'CLOUD' ? 'bg-blue-600' : 'bg-white/10'}`}>Servicios Nube</button>
           <button onClick={() => setActiveTab('BACKUP')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition ${activeTab === 'BACKUP' ? 'bg-blue-600' : 'bg-white/10'}`}>Copias de Seguridad</button>
        </div>
      </div>

      {activeTab === 'SCHOOL' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><Building2 className="w-7 h-7 text-blue-600" /> Identidad Visual</h3>
            <div className="grid grid-cols-2 gap-4">
               <input value={schoolSettings.name} onChange={e => setSchoolSettings(prev => ({...prev, name: e.target.value}))} className="col-span-2 px-6 py-4 bg-slate-50 border rounded-2xl font-black uppercase text-sm" placeholder="Nombre Academia" />
               <input value={schoolSettings.nit} onChange={e => setSchoolSettings(prev => ({...prev, nit: e.target.value}))} className="px-6 py-4 bg-slate-50 border rounded-2xl font-black text-sm" placeholder="NIT" />
               <input value={schoolSettings.phone} onChange={e => setSchoolSettings(prev => ({...prev, phone: e.target.value}))} className="px-6 py-4 bg-slate-50 border rounded-2xl font-black text-sm" placeholder="Teléfono" />
               <div className="col-span-2 border-2 border-dashed border-slate-200 p-8 rounded-3xl flex items-center justify-between">
                  <div><p className="text-[10px] font-black uppercase text-slate-400">Logotipo Oficial</p><button onClick={() => logoInputRef.current?.click()} className="mt-2 text-blue-600 font-bold text-xs uppercase hover:underline">Cambiar Imagen</button></div>
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border">{schoolSettings.logo ? <img src={schoolSettings.logo} className="w-full h-full object-contain p-2" /> : <Building2 className="w-8 h-8 text-slate-200" />}</div>
               </div>
               <input type="file" ref={logoInputRef} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setSchoolSettings(prev => ({ ...prev, logo: r.result as string })); r.readAsDataURL(f); } }} />
            </div>
            <button onClick={onSeedData} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">Generar Datos de Prueba</button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
             <div>
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 mb-6"><Target className="w-7 h-7 text-blue-600" /> Categorías Deportivas</h3>
                <div className="flex flex-wrap gap-2 mb-4">{schoolSettings.categories.map(c => <span key={c} className="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">{c} <X className="w-3 h-3 cursor-pointer text-red-500" onClick={() => removeItem('categories', c)} /></span>)}</div>
                <div className="flex gap-2"><input value={newItem} onChange={e => setNewItem(e.target.value)} className="flex-1 px-5 py-3 bg-slate-50 border rounded-2xl text-xs font-bold" placeholder="Nueva..." /><button onClick={() => addItem('categories')} className="p-3 bg-slate-900 text-white rounded-2xl"><Plus className="w-4 h-4" /></button></div>
             </div>
             <div>
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 mb-6"><Edit3 className="w-7 h-7 text-blue-600" /> Posiciones de Juego</h3>
                <div className="flex flex-wrap gap-2">{schoolSettings.positions.map(p => <span key={p} className="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">{p} <X className="w-3 h-3 cursor-pointer text-red-500" onClick={() => removeItem('positions', p)} /></span>)}</div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'BACKUP' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[2rem] flex items-center justify-center"><Download className="w-10 h-10" /></div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Exportar Respaldo</h3>
                 <p className="text-xs text-slate-500 font-medium">Descarga un archivo .json con toda la base de datos local actual para seguridad extra.</p>
              </div>
              <button 
                onClick={handleExportBackup}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
              >
                 <FileJson className="w-5 h-5" /> Descargar Copia
              </button>
           </div>

           <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center"><Upload className="w-10 h-10" /></div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Restaurar Sistema</h3>
                 <p className="text-xs text-slate-500 font-medium">Carga un archivo de respaldo previo para recuperar toda tu información en este dispositivo.</p>
              </div>
              <button 
                onClick={() => importInputRef.current?.click()}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
              >
                 <History className="w-5 h-5" /> Cargar Respaldo
              </button>
              <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportBackup} />
           </div>

           <div className="md:col-span-2 bg-amber-50 border-2 border-amber-200 p-8 rounded-[2.5rem] flex gap-6 items-start">
              <div className="bg-amber-100 p-4 rounded-2xl text-amber-600"><AlertTriangle className="w-8 h-8" /></div>
              <div className="space-y-2">
                 <h4 className="text-sm font-black uppercase text-amber-800 tracking-widest">Información Importante sobre Restauración</h4>
                 <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    Al cargar un archivo de respaldo, se **borrará permanentemente** cualquier dato nuevo que no esté en el archivo. Se recomienda realizar una descarga de copia antes de proceder con una restauración.
                 </p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'CLOUD' && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
           <div className="flex items-center justify-between"><h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Globe className="w-8 h-8 text-blue-600" /> Supabase Cloud Backend</h3><div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-emerald-100">Configuración Activa</div></div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">URL de Proyecto</label><input type="text" value={schoolSettings.supabaseUrl || ''} onChange={e => setSchoolSettings(prev => ({...prev, supabaseUrl: e.target.value}))} className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" /></div>
              <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">API Key Pública (Anon)</label><input type="password" value={schoolSettings.supabaseKey || ''} onChange={e => setSchoolSettings(prev => ({...prev, supabaseKey: e.target.value}))} className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" /></div>
           </div>
           <div className="bg-slate-900 text-white p-10 rounded-[3rem] space-y-6 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4"><Terminal className="w-8 h-8 text-blue-400" /><div><h4 className="font-black uppercase tracking-tight text-xl">Script de Estructura SQL</h4><p className="text-[10px] opacity-60 uppercase font-black">Crea todas las tablas con DNI, Egreso y Acudientes</p></div></div>
              <div className="bg-slate-800 p-6 rounded-2xl font-mono text-[11px] text-blue-200 h-64 overflow-y-auto border border-white/5 shadow-inner"><pre>{SQL_SCRIPT}</pre></div>
              <div className="flex justify-between items-center"><button onClick={() => { navigator.clipboard.writeText(SQL_SCRIPT); alert("✅ Copiado. Pégalo en el SQL Editor de Supabase."); }} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition flex items-center gap-3"><Copy className="w-4 h-4" /> Copiar Script SQL</button><div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase"><ShieldCheck className="w-4 h-4" /> Versión 5.0 Validada</div></div>
           </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><UsersIcon className="w-8 h-8 text-blue-600" /> Gestión de Acceso</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <div key={user.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><UserRound className="w-6 h-6" /></div>
                      <div><p className="font-black text-slate-800 uppercase text-sm">{user.username}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</p></div>
                   </div>
                   {user.id !== '1' && <button onClick={() => setUsers(users.filter(u => u.id !== user.id))} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;
