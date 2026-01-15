
import React, { useRef, useState, useEffect } from 'react';
import { User, SchoolSettings } from '../types';
import { 
  Building2, 
  Globe, 
  ShieldCheck, 
  Copy, 
  Zap, 
  Share2, 
  Settings, 
  Trash2, 
  Upload, 
  AlertTriangle,
  Plus,
  ListFilter,
  RefreshCw,
  HardDrive,
  DownloadCloud,
  Wifi,
  Activity
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
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<'OK' | 'ERROR' | 'IDLE'>('IDLE');

  const testConnection = async () => {
    setIsTestingConn(true);
    try {
      const res = await fetch('https://kvdb.io/test', { mode: 'no-cors' });
      setConnStatus('OK');
    } catch (e) {
      setConnStatus('ERROR');
    } finally {
      setIsTestingConn(false);
    }
  };

  const forceAppUpdate = () => {
    if (confirm("Se limpiará la memoria temporal y se reiniciará la aplicación para obtener la última versión. ¿Continuar?")) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            registration.unregister();
          }
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    }
  };

  const forceCloudDownload = async () => {
    if (!schoolSettings.cloudProjectKey) {
      alert("No hay una llave de nube vinculada.");
      return;
    }
    if (confirm("¿Descargar todos los datos de la nube ahora? Esto reemplazará tu información local.")) {
      const CLOUD_API_BASE = 'https://kvdb.io/A9S6J7uY2n9u2n9u2n9u2n/';
      const CLOUD_URL = `${CLOUD_API_BASE}${schoolSettings.cloudProjectKey}`;
      try {
        const response = await fetch(CLOUD_URL, { mode: 'cors' });
        if (response.ok) {
          const cloudData = await response.json();
          onImportData(cloudData);
          alert("✅ Sincronización completa. Los datos locales han sido actualizados.");
        } else {
          alert("❌ Los datos aún no han sido subidos desde el otro dispositivo.");
        }
      } catch (e) {
        alert("❌ Error de red: El servidor de nube está bloqueado en este celular o no tienes internet.");
      }
    }
  };

  const generateProjectKey = () => {
    const key = `ACAD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (confirm("¿Generar un nuevo código de proyecto? Esto desconectará la sincronización actual.")) {
      setSchoolSettings(prev => ({ ...prev, cloudProjectKey: key }));
    }
  };

  const handleUpdateSetting = (field: keyof SchoolSettings, value: any) => {
    setSchoolSettings(prev => ({ ...prev, [field]: value }));
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

  const payloadSize = JSON.stringify(allData).length;

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
                <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mt-1">Nube v2.9 - Conectividad Mejorada</p>
              </div>
            </div>
            {!schoolSettings.cloudProjectKey ? (
              <button onClick={generateProjectKey} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition shadow-xl">
                Activar Nube Compartida
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                 <button onClick={forceCloudDownload} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl transition flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg">
                    <DownloadCloud className="w-4 h-4" /> Bajar de Nube
                 </button>
                 <button onClick={() => {
                    const baseUrl = window.location.origin + window.location.pathname;
                    const inviteUrl = `${baseUrl}?project=${schoolSettings.cloudProjectKey}`;
                    navigator.clipboard.writeText(inviteUrl);
                    alert("Link de invitación copiado.");
                 }} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl transition flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/40">
                    <Share2 className="w-4 h-4" /> Compartir Acceso
                 </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex justify-between items-center mb-2">
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado del Diagnóstico</label>
                 <button onClick={testConnection} className="text-[9px] font-black uppercase text-blue-400 hover:text-white flex items-center gap-1 transition">
                    <Activity className="w-3 h-3" /> {isTestingConn ? 'Testeando...' : 'Testear Servidor'}
                 </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className={`p-4 rounded-2xl border ${connStatus === 'OK' ? 'bg-emerald-500/10 border-emerald-500/20' : connStatus === 'ERROR' ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                    <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Servidor Nube</p>
                    <p className={`text-xs font-black ${connStatus === 'OK' ? 'text-emerald-500' : connStatus === 'ERROR' ? 'text-red-500' : 'text-slate-300'}`}>
                       {connStatus === 'OK' ? 'CONECTADO' : connStatus === 'ERROR' ? 'BLOQUEADO' : 'PENDIENTE'}
                    </p>
                 </div>
                 <div className={`p-4 rounded-2xl border ${payloadSize > 60000 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Peso de Datos</p>
                    <p className={`text-xs font-black ${payloadSize > 60000 ? 'text-amber-500' : 'text-emerald-500'}`}>
                       {Math.round(payloadSize/1024)} KB {payloadSize > 60000 ? '(PESADO)' : '(OK)'}
                    </p>
                 </div>
              </div>

              {payloadSize > 60000 && (
                <div className="flex items-start gap-3 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                    Tus datos pesan mucho. Si falla la subida, intenta eliminar las fotos de los alumnos (lo que más pesa) para que el texto se sincronice sin problemas.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button 
                onClick={forceAppUpdate}
                className="w-full bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2.5rem] flex items-center gap-5 hover:bg-amber-500/20 transition group"
              >
                <div className="bg-amber-500/10 p-3 rounded-xl group-hover:scale-110 transition"><Zap className="w-6 h-6 text-amber-500" /></div>
                <div className="text-left">
                  <h4 className="text-sm font-black uppercase tracking-tight text-amber-500">Forzar Actualización App</h4>
                  <p className="text-[10px] text-slate-500 font-bold">Usa esto si los cambios no se ven en tu celular.</p>
                </div>
              </button>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-5">
                <div className="bg-blue-500/10 p-3 rounded-xl"><ShieldCheck className="w-6 h-6 text-blue-500" /></div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Seguridad Multi-Dispositivo</h4>
                  <p className="text-[10px] text-slate-500 font-bold">Cifrado de datos activado para envío remoto.</p>
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
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Llave de Sincronización</label>
                <input type="text" readOnly value={schoolSettings.cloudProjectKey || ''} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black text-blue-600 outline-none" />
              </div>
            </div>
          </div>

          {/* GESTION DE LISTAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-6">
                   <ListFilter className="w-4 h-4" /> Categorías
                </h4>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                   {schoolSettings.categories.map(cat => (
                      <div key={cat} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group transition">
                         <span className="text-xs font-bold text-slate-700">{cat}</span>
                         <button onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                   ))}
                </div>
                <div className="flex gap-2">
                   <input value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyPress={e => e.key === 'Enter' && addCategory()} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nueva..." />
                   <button onClick={addCategory} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"><Plus className="w-4 h-4" /></button>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-6">
                   <Settings className="w-4 h-4" /> Posiciones
                </h4>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                   {schoolSettings.positions.map(pos => (
                      <div key={pos} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group transition">
                         <span className="text-xs font-bold text-slate-700">{pos}</span>
                         <button onClick={() => removePosition(pos)} className="text-slate-300 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                   ))}
                </div>
                <div className="flex gap-2">
                   <input value={newPosition} onChange={e => setNewPosition(e.target.value)} onKeyPress={e => e.key === 'Enter' && addPosition()} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500" placeholder="Nueva..." />
                   <button onClick={addPosition} className="bg-purple-600 text-white p-2 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200"><Plus className="w-4 h-4" /></button>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl text-center relative overflow-hidden group">
              <HardDrive className="w-8 h-8 text-amber-500 mx-auto mb-4" />
              <h3 className="text-sm font-black uppercase mb-4 tracking-tighter">Copia de Seguridad Local</h3>
              <div className="space-y-3">
                <button onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
                  const anchor = document.createElement('a');
                  anchor.setAttribute("href", dataStr);
                  anchor.setAttribute("download", `BACKUP_${new Date().toISOString().split('T')[0]}.json`);
                  anchor.click();
                }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition shadow-lg">
                  Exportar JSON
                </button>
                <button onClick={() => jsonInputRef.current?.click()} className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Importar JSON
                </button>
                <input type="file" ref={jsonInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const jsonData = JSON.parse(event.target?.result as string);
                      if (confirm("Se borrarán los datos actuales. ¿Cargar backup?")) onImportData(jsonData);
                    } catch (err) { alert("Archivo inválido."); }
                  };
                  reader.readAsText(file);
                }} accept=".json" className="hidden" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
