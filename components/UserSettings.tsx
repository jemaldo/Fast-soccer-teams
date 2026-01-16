
import React, { useRef, useState } from 'react';
import { User, SchoolSettings } from '../types';
import { 
  Building2, 
  Globe, 
  RefreshCcw, 
  CheckCircle2,
  Zap,
  Share2,
  Trash2,
  Upload,
  AlertTriangle,
  Plus,
  ListFilter,
  Settings,
  ShieldCheck,
  CloudUpload,
  Camera,
  Image as ImageIcon,
  Quote,
  ShieldAlert,
  KeyRound,
  ShieldQuestion,
  Edit2,
  X,
  UserCheck
} from 'lucide-react';

interface Props {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User | null;
  schoolSettings: SchoolSettings;
  setSchoolSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
  allData: any; 
  onImportData: (data: any) => void;
  onSyncPush?: () => void;
  onActivateCloud?: (key: string) => void;
}

const UserSettings: React.FC<Props> = ({ 
  users, setUsers, schoolSettings, setSchoolSettings, allData, onImportData, onSyncPush, onActivateCloud, currentUser
}) => {
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [showKey, setShowKey] = useState(false);
  
  // Estados para gestión de usuarios
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const generateProjectKey = () => {
    const key = `ACAD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (onActivateCloud) {
        onActivateCloud(key);
    } else {
        setSchoolSettings(prev => ({ ...prev, cloudProjectKey: key }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateSetting('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSetting = (field: keyof SchoolSettings, value: any) => {
    setSchoolSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData: User = {
      id: editingUser?.id || Date.now().toString(),
      username: formData.get('username') as string,
      role: formData.get('role') as any,
      password: (formData.get('password') as string) || editingUser?.password || '123',
      secretQuestion: formData.get('secretQuestion') as string,
      secretAnswer: formData.get('secretAnswer') as string,
    };

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? userData : u));
    } else {
      setUsers([...users, userData]);
    }
    setShowUserModal(false);
    setEditingUser(null);
  };

  const deleteUser = (id: string) => {
    if (id === currentUser?.id) return alert("No puedes eliminarte a ti mismo.");
    if (confirm("¿Estás seguro de eliminar este acceso?")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const addCategory = () => {
    if (newCategory && !schoolSettings.categories.includes(newCategory)) {
      setSchoolSettings(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
      setNewCategory('');
    }
  };

  const addPosition = () => {
    if (newPosition && !schoolSettings.positions.includes(newPosition)) {
      setSchoolSettings(prev => ({ ...prev, positions: [...prev.positions, newPosition] }));
      setNewPosition('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Nube y Sincronización */}
      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="bg-blue-600 p-4 rounded-[1.5rem] shadow-xl shadow-blue-500/20">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Nube Multi-Ciudad</h3>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Sincronización en tiempo real</p>
              </div>
            </div>
            {!schoolSettings.cloudProjectKey ? (
              <button onClick={generateProjectKey} className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition shadow-xl active:scale-95">
                Activar Nube Ahora
              </button>
            ) : (
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                 <button onClick={onSyncPush} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl transition flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
                    <CloudUpload className="w-4 h-4" /> Sincronizar
                 </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">ID del Proyecto</label>
                <div className="relative">
                  <input type={showKey ? "text" : "password"} value={schoolSettings.cloudProjectKey || ''} readOnly className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-blue-400 outline-none" />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"><Zap className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* APARTADO DE USUARIOS Y SEGURIDAD */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                <ShieldAlert className="w-6 h-6 text-red-600" /> Gestión de Accesos
              </h3>
              <button 
                onClick={() => { setEditingUser(null); setShowUserModal(true); }}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nuevo Usuario
              </button>
            </div>
            
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="group bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase text-xs flex items-center gap-2">
                        {u.username}
                        {u.id === currentUser?.id && <span className="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded-full">Tú</span>}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8 uppercase tracking-tighter">
              <Building2 className="w-6 h-6 text-blue-600" /> Datos de la Academia
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* CARGA DE LOGO ACTIVADA */}
              <div className="md:col-span-1 flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center relative overflow-hidden group hover:border-blue-400 transition-all">
                  {schoolSettings.logo ? (
                    <img src={schoolSettings.logo} className="w-full h-full object-contain p-2" alt="Logo Academia" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-slate-200" />
                  )}
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                </div>
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Institucional</p>
              </div>

              <div className="md:col-span-3 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Nombre de la Institución</label>
                  <input type="text" value={schoolSettings.name} onChange={(e) => handleUpdateSetting('name', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Lema o Slogan</label>
                  <input type="text" value={schoolSettings.slogan || ''} onChange={(e) => handleUpdateSetting('slogan', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none italic" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">NIT / RUT</label>
                  <input type="text" value={schoolSettings.nit} onChange={(e) => handleUpdateSetting('nit', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Dirección Principal</label>
                  <input type="text" value={schoolSettings.address} onChange={(e) => handleUpdateSetting('address', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4"><ListFilter className="w-4 h-4" /> Categorías</h4>
                <div className="space-y-2 mb-4">{schoolSettings.categories.map(cat => (
                  <div key={cat} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-700">{cat}</span><button onClick={() => handleUpdateSetting('categories', schoolSettings.categories.filter(c => c !== cat))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div>
                ))}</div>
                <div className="flex gap-2"><input value={newCategory} onChange={e => setNewCategory(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" placeholder="Nueva..." /><button onClick={addCategory} className="bg-blue-600 text-white p-2 rounded-xl"><Plus className="w-4 h-4" /></button></div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4"><Settings className="w-4 h-4" /> Posiciones</h4>
                <div className="space-y-2 mb-4">{schoolSettings.positions.map(pos => (
                  <div key={pos} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100"><span className="text-xs font-bold text-slate-700">{pos}</span><button onClick={() => handleUpdateSetting('positions', schoolSettings.positions.filter(p => p !== pos))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div>
                ))}</div>
                <div className="flex gap-2"><input value={newPosition} onChange={e => setNewPosition(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" placeholder="Nueva..." /><button onClick={addPosition} className="bg-purple-600 text-white p-2 rounded-xl"><Plus className="w-4 h-4" /></button></div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                <h3 className="text-sm font-black uppercase mb-4 tracking-tighter">Backup Manual</h3>
                <div className="space-y-3">
                  <button onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
                    const anchor = document.createElement('a');
                    anchor.setAttribute("href", dataStr);
                    anchor.setAttribute("download", `BACKUP_${new Date().toISOString().split('T')[0]}.json`);
                    anchor.click();
                  }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition shadow-lg">Descargar Backup</button>
                  <button onClick={() => jsonInputRef.current?.click()} className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Cargar Backup</button>
                  <input type="file" ref={jsonInputRef} className="hidden" />
                </div>
           </div>
        </div>
      </div>

      {/* MODAL USUARIOS */}
      {showUserModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
             <div className="bg-slate-900 p-8 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-black uppercase tracking-tight">{editingUser ? 'Editar Usuario' : 'Crear Acceso'}</h3>
                </div>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X /></button>
             </div>
             
             <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Nombre de Usuario</label>
                      <input name="username" defaultValue={editingUser?.username} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                   </div>
                   <div className="col-span-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Rol del Sistema</label>
                      <select name="role" defaultValue={editingUser?.role || 'COACH'} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none">
                         <option value="ADMIN">Administrador</option>
                         <option value="COACH">Entrenador</option>
                         <option value="SECRETARY">Secretaría</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                   <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2 flex items-center gap-2"><KeyRound className="w-3 h-3 text-blue-500" /> Contraseña de Acceso</label>
                      <input name="password" type="text" placeholder={editingUser ? "Dejar en blanco para no cambiar" : "Mínimo 3 caracteres"} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" />
                   </div>
                   
                   <div className="bg-blue-50/50 p-6 rounded-3xl space-y-4">
                      <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><ShieldQuestion className="w-3.5 h-3.5" /> Seguridad de Recuperación</h4>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 px-2">Pregunta Secreta</label>
                        <input name="secretQuestion" defaultValue={editingUser?.secretQuestion} placeholder="Ej: Mi primera mascota" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 px-2">Tu Respuesta</label>
                        <input name="secretAnswer" defaultValue={editingUser?.secretAnswer} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                      </div>
                   </div>
                </div>

                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-200">
                   {editingUser ? 'Actualizar Credenciales' : 'Registrar Nuevo Acceso'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;
