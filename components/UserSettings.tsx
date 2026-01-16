
import React, { useRef, useState } from 'react';
import { User, SchoolSettings } from '../types';
import { 
  Building2, 
  Globe, 
  RefreshCcw, 
  FileDown,
  CheckCircle2,
  Zap,
  Copy,
  Share2,
  Trash2,
  Upload,
  AlertTriangle,
  Plus,
  ListFilter,
  Settings,
  ShieldCheck,
  Loader2,
  CloudUpload,
  Camera,
  Image as ImageIcon,
  Quote
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
  users, setUsers, schoolSettings, setSchoolSettings, allData, onImportData, onSyncPush, onActivateCloud
}) => {
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [showKey, setShowKey] = useState(false);

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

  const generateInviteLink = () => {
    if (!schoolSettings.cloudProjectKey) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const inviteUrl = `${baseUrl}?project=${schoolSettings.cloudProjectKey}`;
    navigator.clipboard.writeText(inviteUrl);
    alert("¡Link de Invitación Copiado!");
  };

  const handleUpdateSetting = (field: keyof SchoolSettings, value: any) => {
    setSchoolSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        onImportData(jsonData);
        alert("Backup importado.");
      } catch (err) { alert("Error al leer archivo."); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addCategory = () => {
    if (newCategory && !schoolSettings.categories.includes(newCategory)) {
      setSchoolSettings(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    setSchoolSettings(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
  };

  const addPosition = () => {
    if (newPosition && !schoolSettings.positions.includes(newPosition)) {
      setSchoolSettings(prev => ({ ...prev, positions: [...prev.positions, newPosition] }));
      setNewPosition('');
    }
  };

  const removePosition = (pos: string) => {
    setSchoolSettings(prev => ({ ...prev, positions: prev.positions.filter(p => p !== pos) }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
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
                 <button onClick={generateInviteLink} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl transition flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
                    <Share2 className="w-4 h-4" /> Enviar Link
                 </button>
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
                  <input 
                    type={showKey ? "text" : "password"} 
                    value={schoolSettings.cloudProjectKey || ''}
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-blue-400 outline-none"
                    placeholder="Genera una llave arriba"
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition">
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-blue-600/10 p-5 rounded-2xl border border-blue-500/20">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tus datos están protegidos por este código. Úsalo para conectar tu celular u otra computadora en cualquier parte del mundo.
                </p>
              </div>
              {schoolSettings.cloudProjectKey && (
                  <button onClick={() => handleUpdateSetting('cloudProjectKey', '')} className="text-[10px] font-black uppercase text-red-400 hover:underline">Eliminar Llave y Desconectar</button>
              )}
            </div>

            <div className="space-y-4">
               <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-5">
                <div className="bg-emerald-500/10 p-3 rounded-xl"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Estado de Red</h4>
                  <p className="text-[10px] text-slate-500 font-bold">{schoolSettings.cloudProjectKey ? 'VINCULADO A INTERNET' : 'MODO LOCAL'}</p>
                </div>
              </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-5">
                <div className="bg-amber-500/10 p-3 rounded-xl"><RefreshCcw className="w-6 h-6 text-amber-500" /></div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Carga Automática</h4>
                  <p className="text-[10px] text-slate-500 font-bold">Cada vez que guardas, la nube se actualiza.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8 uppercase tracking-tighter">
              <Building2 className="w-6 h-6 text-blue-600" /> Datos de la Academia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Nombre de la Institución</label>
                <input type="text" value={schoolSettings.name} onChange={(e) => handleUpdateSetting('name', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Eslogan / Lema</label>
                <div className="relative">
                  <Quote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="text" placeholder="Ej: Formando campeones..." value={schoolSettings.slogan || ''} onChange={(e) => handleUpdateSetting('slogan', e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 italic" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">NIT / Registro</label>
                <input type="text" value={schoolSettings.nit} onChange={(e) => handleUpdateSetting('nit', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Email Sincronización</label>
                <input type="email" value={schoolSettings.linkedEmail || ''} onChange={(e) => handleUpdateSetting('linkedEmail', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8 uppercase tracking-tighter">
              <ImageIcon className="w-6 h-6 text-blue-600" /> Identidad Visual
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
               <div className="w-32 h-32 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                  {schoolSettings.logo ? (
                    <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-slate-200" />
                  )}
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[9px] font-black uppercase tracking-widest gap-2"
                  >
                    <Camera className="w-6 h-6" />
                    Subir Logo
                  </button>
               </div>
               <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
               <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-700">Logo de la Academia</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                      El logo aparecerá en el Dashboard, en los volantes de pago y en todos los informes oficiales generados por el sistema.
                    </p>
                  </div>
                  {schoolSettings.logo && (
                    <button onClick={() => handleUpdateSetting('logo', undefined)} className="text-[10px] font-black uppercase text-red-500 hover:underline">Eliminar Logo Actual</button>
                  )}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <ListFilter className="w-4 h-4" /> Categorías
                  </h4>
                </div>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                   {schoolSettings.categories.map(cat => (
                      <div key={cat} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                         <span className="text-xs font-bold text-slate-700">{cat}</span>
                         <button onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                   ))}
                </div>
                <div className="flex gap-2">
                   <input value={newCategory} onChange={e => setNewCategory(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-300" placeholder="Nueva..." />
                   <button onClick={addCategory} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition"><Plus className="w-4 h-4" /></button>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <Settings className="w-4 h-4" /> Posiciones
                  </h4>
                </div>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                   {schoolSettings.positions.map(pos => (
                      <div key={pos} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                         <span className="text-xs font-bold text-slate-700">{pos}</span>
                         <button onClick={() => removePosition(pos)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                   ))}
                </div>
                <div className="flex gap-2">
                   <input value={newPosition} onChange={e => setNewPosition(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-purple-300" placeholder="Nueva..." />
                   <button onClick={addPosition} className="bg-purple-600 text-white p-2 rounded-xl hover:bg-purple-700 transition"><Plus className="w-4 h-4" /></button>
                </div>
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
                  }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition shadow-lg">
                    Descargar Backup
                  </button>
                  <button onClick={() => jsonInputRef.current?.click()} className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" /> Cargar Backup
                  </button>
                  <input type="file" ref={jsonInputRef} onChange={handleImportJson} accept=".json" className="hidden" />
                </div>
                <div className="mt-6 flex items-start gap-2 text-left bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-amber-800 font-bold leading-relaxed">
                    Al cargar un backup se borrará todo lo que tienes actualmente.
                  </p>
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
