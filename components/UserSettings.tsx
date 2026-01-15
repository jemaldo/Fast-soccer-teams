
import React, { useRef, useState } from 'react';
import { User, SchoolSettings } from '../types';
import { 
  Building2, 
  Camera, 
  Users, 
  RefreshCcw, 
  FileUp,
  FileDown,
  CheckCircle2,
  X,
  Sparkles,
  Usb,
  Database,
  Plus,
  ListFilter,
  Mail,
  Globe,
  ShieldCheck,
  Copy,
  Zap,
  Info,
  Share2,
  Settings,
  Trash2,
  Upload,
  AlertTriangle
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
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [showKey, setShowKey] = useState(false);

  const generateProjectKey = () => {
    const key = `ACAD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (confirm("¿Generar un nuevo código de proyecto? Esto desconectará la sincronización actual.")) {
      setSchoolSettings(prev => ({ ...prev, cloudProjectKey: key }));
    }
  };

  const copyKey = () => {
    if (schoolSettings.cloudProjectKey) {
      navigator.clipboard.writeText(schoolSettings.cloudProjectKey);
      alert("Copiado al portapapeles. Envía este código a la persona en la otra ciudad.");
    }
  };

  const generateInviteLink = () => {
    if (!schoolSettings.cloudProjectKey) {
      alert("Primero activa la Nube Compartida.");
      return;
    }
    const baseUrl = window.location.origin + window.location.pathname;
    const inviteUrl = `${baseUrl}?project=${schoolSettings.cloudProjectKey}`;
    navigator.clipboard.writeText(inviteUrl);
    alert("🚀 ¡Link de Invitación Copiado!\n\nEnvía este link a tu colega para conectarlo automáticamente.");
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
        if (confirm("¿Estás seguro de importar este backup? Se reemplazarán todos los datos actuales.")) {
          onImportData(jsonData);
          alert("✅ Backup importado correctamente.");
        }
      } catch (err) {
        alert("❌ Error al leer el archivo. Asegúrate de que sea un archivo .json válido.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const addCategory = () => {
    if (newCategory && !schoolSettings.categories.includes(newCategory)) {
      setSchoolSettings(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    if (confirm(`¿Eliminar categoría "${cat}"?`)) {
      setSchoolSettings(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
    }
  };

  const addPosition = () => {
    if (newPosition && !schoolSettings.positions.includes(newPosition)) {
      setSchoolSettings(prev => ({ ...prev, positions: [...prev.positions, newPosition] }));
      setNewPosition('');
    }
  };

  const removePosition = (pos: string) => {
    if (confirm(`¿Eliminar posición "${pos}"?`)) {
      setSchoolSettings(prev => ({ ...prev, positions: prev.positions.filter(p => p !== pos) }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* SECCIÓN MULTI-CIUDAD */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="bg-blue-600 p-4 rounded-[1.5rem] shadow-xl shadow-blue-500/20">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Sincronización Multi-Ciudad</h3>
                <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mt-1">Colaboración Remota en Tiempo Real</p>
              </div>
            </div>
            {!schoolSettings.cloudProjectKey ? (
              <button onClick={generateProjectKey} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition shadow-xl">
                Activar Nube Compartida
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                 <button onClick={generateInviteLink} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl transition flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/40">
                    <Share2 className="w-4 h-4" /> Link Invitación
                 </button>
                 <button onClick={copyKey} className="bg-white/10 hover:bg-white/20 px-4 py-4 rounded-2xl transition flex items-center gap-2 text-xs font-bold border border-white/10">
                    <Copy className="w-4 h-4" /> Código
                 </button>
                 <button onClick={() => handleUpdateSetting('cloudProjectKey', '')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-4 rounded-2xl transition text-xs font-bold border border-red-500/10">
                    Desvincular
                 </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">ID de Proyecto</label>
                <div className="relative">
                  <input 
                    type={showKey ? "text" : "password"} 
                    value={schoolSettings.cloudProjectKey || ''}
                    placeholder="Sin código vinculado"
                    onChange={(e) => handleUpdateSetting('cloudProjectKey', e.target.value.toUpperCase())}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-blue-400 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition">
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-blue-600/10 p-5 rounded-2xl border border-blue-500/20">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cualquier persona con este código podrá ver y editar los mismos datos. Los cambios se sincronizan automáticamente cada 30 segundos.
                </p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-5">
                <div className="bg-emerald-500/10 p-3 rounded-xl"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Estatus Global</h4>
                  <p className="text-[10px] text-slate-500 font-bold">{schoolSettings.cloudProjectKey ? 'Conexión Establecida' : 'Trabajando en Local'}</p>
                </div>
              </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-5">
                <div className="bg-amber-500/10 p-3 rounded-xl"><RefreshCcw className="w-6 h-6 text-amber-500" /></div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Sincronización Inteligente</h4>
                  <p className="text-[10px] text-slate-500 font-bold">Verificación remota activa y segura.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* DATOS DE SEDE */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8 uppercase tracking-tighter">
              <Building2 className="w-6 h-6 text-blue-600" /> Datos de la Sede
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Nombre Academia</label>
                <input type="text" value={schoolSettings.name} onChange={(e) => handleUpdateSetting('name', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">NIT / RUT</label>
                <input type="text" value={schoolSettings.nit} onChange={(e) => handleUpdateSetting('nit', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Correo de Sincronización</label>
                <input type="email" value={schoolSettings.linkedEmail || ''} onChange={(e) => handleUpdateSetting('linkedEmail', e.target.value)} placeholder="correo@ejemplo.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* GESTION DE LISTAS (CATEGORÍAS Y POSICIONES) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <ListFilter className="w-4 h-4" /> Categorías
                  </h4>
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black">{schoolSettings.categories.length}</span>
                </div>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                   {schoolSettings.categories.map(cat => (
                      <div key={cat} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group transition hover:border-blue-200">
                         <span className="text-xs font-bold text-slate-700">{cat}</span>
                         <button onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                   ))}
                </div>
                <div className="flex gap-2">
                   <input value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyPress={e => e.key === 'Enter' && addCategory()} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nueva categoría..." />
                   <button onClick={addCategory} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"><Plus className="w-4 h-4" /></button>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <Settings className="w-4 h-4" /> Posiciones
                  </h4>
                  <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-[10px] font-black">{schoolSettings.positions.length}</span>
                </div>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                   {schoolSettings.positions.map(pos => (
                      <div key={pos} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group transition hover:border-purple-200">
                         <span className="text-xs font-bold text-slate-700">{pos}</span>
                         <button onClick={() => removePosition(pos)} className="text-slate-300 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                   ))}
                </div>
                <div className="flex gap-2">
                   <input value={newPosition} onChange={e => setNewPosition(e.target.value)} onKeyPress={e => e.key === 'Enter' && addPosition()} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500" placeholder="Nueva posición..." />
                   <button onClick={addPosition} className="bg-purple-600 text-white p-2 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200"><Plus className="w-4 h-4" /></button>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl text-center relative overflow-hidden group">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-50 rounded-full blur-2xl opacity-60"></div>
              <div className="relative z-10">
                <Usb className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                <h3 className="text-sm font-black uppercase mb-4 tracking-tighter">Backup del Sistema</h3>
                
                <div className="space-y-3">
                  <button onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
                    const anchor = document.createElement('a');
                    anchor.setAttribute("href", dataStr);
                    anchor.setAttribute("download", `ACADEMIA_PRO_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
                    anchor.click();
                  }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition shadow-lg">
                    Descargar Backup
                  </button>

                  <button onClick={() => jsonInputRef.current?.click()} className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" /> Cargar Backup (.json)
                  </button>
                  <input type="file" ref={jsonInputRef} onChange={handleImportJson} accept=".json" className="hidden" />
                </div>

                <div className="mt-6 flex items-start gap-2 text-left bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-amber-800 font-bold leading-relaxed">
                    IMPORTANTE: Al cargar un backup, los datos actuales serán reemplazados por los del archivo seleccionado.
                  </p>
                </div>
              </div>
           </div>

           <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
              <Sparkles className="w-6 h-6 mb-4" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Soporte y Desarrollo</p>
                <p className="text-lg font-black leading-tight tracking-tighter">Fastsystems<br/>Jesus Maldonado Castro</p>
                <p className="text-[9px] font-bold mt-4 opacity-70">Empoderando el talento deportivo con tecnología de élite.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
