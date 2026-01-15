
import React, { useRef, useState } from 'react';
import { User, SchoolSettings, Student } from '../types';
import { 
  Building2, Globe, ShieldCheck, Zap, Share2, Settings, Trash2, 
  Upload, AlertTriangle, Plus, ListFilter, HardDrive, DownloadCloud, 
  Activity, Sparkles, CheckCircle2, Loader2, ExternalLink, ShoppingCart,
  Database, Server, Rocket, ArrowRight, Mail, Phone, MapPin, Users,
  Target, GraduationCap, X, Info, Camera, Image as ImageIcon
} from 'lucide-react';

interface Props {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User | null;
  schoolSettings: SchoolSettings;
  setSchoolSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
  allData: any; 
  onImportData: (data: any) => void;
}

const UserSettings: React.FC<Props> = ({ 
  users, setUsers, schoolSettings, setSchoolSettings, allData, onImportData 
}) => {
  const [activeTab, setActiveTab] = useState<'SCHOOL' | 'DATA' | 'USERS' | 'CLOUD'>('SCHOOL');
  const [newCategory, setNewCategory] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Opcional: Podríamos comprimir aquí también si fuera necesario
        setSchoolSettings(prev => ({ ...prev, logo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addCategory = () => {
    if (!newCategory) return;
    setSchoolSettings(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
    setNewCategory('');
  };

  const removeCategory = (cat: string) => {
    setSchoolSettings(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
  };

  const addPosition = () => {
    if (!newPosition) return;
    setSchoolSettings(prev => ({ ...prev, positions: [...prev.positions, newPosition] }));
    setNewPosition('');
  };

  const removePosition = (pos: string) => {
    setSchoolSettings(prev => ({ ...prev, positions: prev.positions.filter(p => p !== pos) }));
  };

  const addUser = () => {
    if (!newUserName) return;
    const newUser: User = { id: Date.now().toString(), username: newUserName, role: 'COACH' };
    setUsers([...users, newUser]);
    setNewUserName('');
  };

  const removeUser = (id: string) => {
    if (id === '1') return alert("No puedes eliminar al administrador principal");
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* SUPABASE RECOMMENDATION */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Database className="w-64 h-64 rotate-12" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-blue-400">Próxima Parada: Supabase</span>
          </div>
          <h2 className="text-4xl font-black mb-4 leading-none tracking-tighter">Migración Profesional Supabase</h2>
          <p className="text-blue-100 font-medium mb-6">
            Has tomado la decisión correcta. Al pasarte a Supabase desbloquearás espacio ilimitado para fotos HD y una base de datos real.
          </p>
          <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-widest">Preparado para la gran escala</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-2 rounded-[2rem] border border-slate-200">
        <button onClick={() => setActiveTab('SCHOOL')} className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'SCHOOL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>Sede y Atletas</button>
        <button onClick={() => setActiveTab('USERS')} className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'USERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>Personal y Accesos</button>
        <button onClick={() => setActiveTab('DATA')} className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'DATA' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>Seguridad de Datos</button>
        <button onClick={() => setActiveTab('CLOUD')} className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'CLOUD' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>Nube Lite (Actual)</button>
      </div>

      {/* TAB CONTENT: SCHOOL & CATEGORIES */}
      {activeTab === 'SCHOOL' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          {/* Identidad de la Sede */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <Building2 className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-black uppercase tracking-tighter">Identidad Institucional</h3>
              </div>
              
              {/* CARGA DE LOGO */}
              <div className="relative group">
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition shadow-inner"
                >
                  {schoolSettings.logo ? (
                    <img src={schoolSettings.logo} className="w-full h-full object-contain p-2" alt="Logo" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <input type="file" ref={logoInputRef} onChange={handleLogoChange} className="hidden" accept="image/*" />
                <p className="text-[8px] font-black uppercase text-center mt-1 text-slate-400">Logo Sede</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Nombre de la Sede</label>
                <input type="text" value={schoolSettings.name} onChange={e => setSchoolSettings(prev => ({...prev, name: e.target.value}))} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">NIT Institucional</label>
                <input type="text" value={schoolSettings.nit} onChange={e => setSchoolSettings(prev => ({...prev, nit: e.target.value}))} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Teléfono Principal</label>
                <input type="text" value={schoolSettings.phone} onChange={e => setSchoolSettings(prev => ({...prev, phone: e.target.value}))} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Dirección Sede</label>
                <input type="text" value={schoolSettings.address} onChange={e => setSchoolSettings(prev => ({...prev, address: e.target.value}))} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
              </div>
            </div>
          </div>

          {/* Listas Desplegables: Categorías y Posiciones */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h4 className="text-sm font-black uppercase text-slate-800 mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-blue-600" /> Categorías Deportivas</h4>
              <div className="flex gap-2 mb-6">
                <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nueva categoría..." className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                <button onClick={addCategory} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition"><Plus /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {schoolSettings.categories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-slate-200">
                    {cat} <button onClick={() => removeCategory(cat)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h4 className="text-sm font-black uppercase text-slate-800 mb-6 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-600" /> Posiciones de Juego</h4>
              <div className="flex gap-2 mb-6">
                <input value={newPosition} onChange={e => setNewPosition(e.target.value)} placeholder="Nueva posición..." className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                <button onClick={addPosition} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition"><Plus /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {schoolSettings.positions.map(pos => (
                  <span key={pos} className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-slate-200">
                    {pos} <button onClick={() => removePosition(pos)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USERS */}
      {activeTab === 'USERS' && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Usuarios del Sistema</h3>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Control de accesos y roles</p>
            </div>
            <div className="flex gap-3">
              <input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Nombre de usuario..." className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
              <button onClick={addUser} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-100">
                <Plus className="w-4 h-4" /> Agregar Staff
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => (
              <div key={user.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 uppercase tracking-tight">{user.username}</p>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
                {user.id !== '1' && (
                  <button onClick={() => removeUser(user.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DATA SAFETY */}
      {activeTab === 'DATA' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm text-center">
            <HardDrive className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase mb-4">Exportar Backup Total</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">Descarga un archivo JSON con absolutamente toda la información: alumnos, pagos, docentes y fotos. Úsalo como respaldo semanal.</p>
            <button onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
              const a = document.createElement('a'); a.href = dataStr; a.download = `BACKUP_ACADEMIA_TOTAL.json`; a.click();
            }} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition shadow-xl">Generar Archivo JSON</button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm text-center">
            <Upload className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase mb-4">Restaurar Sistema</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">Sube un archivo de backup previamente descargado. Esto reemplazará todos los datos actuales con la versión del archivo.</p>
            <button onClick={() => jsonInputRef.current?.click()} className="w-full py-5 border-2 border-dashed border-slate-200 text-slate-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition">Seleccionar Archivo JSON</button>
            <input type="file" ref={jsonInputRef} onChange={e => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader(); r.onload = ev => { try { onImportData(JSON.parse(ev.target?.result as string)); alert("Datos restaurados."); } catch(e) { alert("Archivo inválido."); }};
              r.readAsText(f);
            }} className="hidden" />
          </div>
        </div>
      )}

      {/* TAB CONTENT: CLOUD LITE */}
      {activeTab === 'CLOUD' && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
            <div className="flex items-center gap-4">
              <Globe className="w-10 h-10 text-blue-600" />
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Servidor KVDB Lite</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronización entre ciudades (vía texto)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="https://kvdb.io" target="_blank" className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-100 transition"><ShoppingCart className="w-4 h-4" /> Comprar Bucket Privado</a>
            </div>
          </div>
          <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100">
             <div className="flex items-center gap-3 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="font-black text-xs uppercase tracking-widest text-blue-800">Nota técnica sobre KVDB</span>
             </div>
             <p className="text-xs text-blue-600 font-bold leading-relaxed">
               Actualmente usas la "Nube Lite" que envía solo texto para sincronizar datos vitales (pagos, nombres, asistencia) sin fotos pesadas. Este sistema es ideal para cuando tienes poco internet. Una vez que migremos a Supabase, este panel se actualizará para mostrar el estado de tu Base de Datos SQL profesional.
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;
