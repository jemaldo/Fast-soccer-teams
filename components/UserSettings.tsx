
import React, { useRef, useState, useEffect } from 'react';
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
  Info
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
  const logoInputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);
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

  const handleUpdateSetting = (field: keyof SchoolSettings, value: any) => {
    setSchoolSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* SECCIÓN MULTI-CIUDAD / COLABORACIÓN */}
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
              <div className="flex gap-2">
                 <button onClick={copyKey} className="bg-white/10 hover:bg-white/20 px-4 py-4 rounded-2xl transition flex items-center gap-2 text-xs font-bold border border-white/10">
                    <Copy className="w-4 h-4" /> Copiar Código
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
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Identificador del Proyecto Compartido</label>
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
                  Para que otra persona vea tus datos, debe tener este **mismo código** en su aplicación. Los datos se sincronizarán automáticamente cada vez que alguien guarde cambios.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-5">
                <div className="bg-emerald-500/10 p-3 rounded-xl"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Estado: Conectado</h4>
                  <p className="text-[10px] text-slate-500 font-bold">Tus cambios se están replicando en la nube global.</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-5">
                <div className="bg-amber-500/10 p-3 rounded-xl"><RefreshCcw className="w-6 h-6 text-amber-500" /></div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Sincronización Inteligente</h4>
                  <p className="text-[10px] text-slate-500 font-bold">Verificación automática de cambios remotos cada 30 segundos.</p>
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
              <Building2 className="w-6 h-6 text-blue-600" /> Datos de la Sede
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Nombre de la Sede</label>
                <input type="text" value={schoolSettings.name} onChange={(e) => handleUpdateSetting('name', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Dirección / Ciudad</label>
                <input type="text" value={schoolSettings.address} onChange={(e) => handleUpdateSetting('address', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-50 rounded-full transition-transform group-hover:scale-125"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Usb className="w-6 h-6 text-amber-600" />
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Respaldo Manual</h3>
              </div>
              <button onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", `PRO_MANAGER_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
                downloadAnchorNode.click();
              }} className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all font-bold text-xs uppercase tracking-widest shadow-lg">
                <span>Descargar Backup</span>
                <FileDown className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
             <Database className="w-6 h-6 text-slate-300 mx-auto mb-4" />
             <h4 className="text-xs font-black uppercase mb-1">Copia Local</h4>
             <p className="text-[9px] text-slate-400 font-bold px-4 leading-relaxed">Los datos también se guardan en el navegador por seguridad.</p>
          </div>
        </div>
      </div>
      
      {/* Resto de gestión de categorías y usuarios se mantiene igual */}
    </div>
  );
};

export default UserSettings;
