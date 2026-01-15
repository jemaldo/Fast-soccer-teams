
import React, { useRef, useState } from 'react';
import { User, SchoolSettings, Student } from '../types';
import { 
  Building2, Globe, ShieldCheck, Zap, Share2, Settings, Trash2, 
  Upload, AlertTriangle, Plus, ListFilter, HardDrive, DownloadCloud, 
  Activity, Sparkles, CheckCircle2, Loader2 
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
  schoolSettings, setSchoolSettings, allData, onImportData
}) => {
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [connStatus, setConnStatus] = useState<'OK' | 'ERROR' | 'IDLE'>('IDLE');

  const testConnection = async () => {
    setConnStatus('IDLE');
    try {
      const res = await fetch('https://kvdb.io/test', { mode: 'no-cors' });
      setConnStatus('OK');
    } catch (e) {
      setConnStatus('ERROR');
    }
  };

  const optimizeMemory = async () => {
    if (!confirm("Esto reducirá el tamaño de todas las fotos guardadas para liberar espacio. ¿Continuar?")) return;
    setIsOptimizing(true);
    
    // Función de compresión interna
    const compress = (base64Str: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 150; canvas.height = 150;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, 150, 150);
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
      });
    };

    const optimizedStudents = await Promise.all(allData.students.map(async (s: Student) => {
      if (s.photo && s.photo.length > 5000) {
        const compressed = await compress(s.photo);
        return { ...s, photo: compressed };
      }
      return s;
    }));

    onImportData({ ...allData, students: optimizedStudents });
    setIsOptimizing(false);
    alert("✅ Memoria optimizada. El peso de los datos ha bajado drásticamente.");
  };

  const generateProjectKey = () => {
    const key = `ACAD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setSchoolSettings(prev => ({ ...prev, cloudProjectKey: key }));
  };

  const payloadSize = JSON.stringify(allData).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-500/20">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Sincronización Multi-Sede</h3>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-1">Nube Lite v3.0 - Optimizada para Móviles</p>
              </div>
            </div>
            {!schoolSettings.cloudProjectKey ? (
              <button onClick={generateProjectKey} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Activar Nube</button>
            ) : (
              <div className="flex gap-2">
                 <button onClick={optimizeMemory} disabled={isOptimizing} className="bg-amber-500 text-white px-6 py-4 rounded-2xl transition flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg">
                    {/* Fixed missing Loader2 import */}
                    {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Optimizar Memoria
                 </button>
                 <button onClick={() => {
                   const inviteUrl = `${window.location.origin}${window.location.pathname}?project=${schoolSettings.cloudProjectKey}`;
                   navigator.clipboard.writeText(inviteUrl);
                   alert("Enlace copiado. Ábrelo en tu celular para sincronizar.");
                 }} className="bg-blue-600 text-white px-6 py-4 rounded-2xl transition flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg">
                    <Share2 className="w-4 h-4" /> Compartir Acceso
                 </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex justify-between items-center mb-2">
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado del Sistema</label>
                 <button onClick={testConnection} className="text-[9px] font-black uppercase text-blue-400 hover:text-white flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Testear Conexión
                 </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className={`p-4 rounded-2xl border ${connStatus === 'OK' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                    <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Nube</p>
                    <p className={`text-xs font-black ${connStatus === 'OK' ? 'text-emerald-500' : 'text-slate-300'}`}>
                       {connStatus === 'OK' ? 'CONECTADO' : 'PENDIENTE'}
                    </p>
                 </div>
                 <div className="p-4 rounded-2xl border bg-white/5 border-white/10">
                    <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Peso en Memoria</p>
                    <p className={`text-xs font-black ${payloadSize > 60000 ? 'text-amber-500' : 'text-emerald-500'}`}>
                       {Math.round(payloadSize/1024)} KB {payloadSize > 60000 ? '(PESADO)' : '(OK)'}
                    </p>
                 </div>
              </div>

              <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-[10px] text-slate-300 font-bold leading-relaxed">
                  <span className="text-white">INFO LITE-SYNC:</span> Los nombres, pagos y caja se sincronizan en segundos. Las fotos se guardan solo en este dispositivo para garantizar que la nube siempre funcione sin errores de conexión.
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-center items-center text-center">
               <Building2 className="w-10 h-10 text-slate-500 mb-4" />
               <h4 className="text-sm font-black uppercase text-white mb-2">Datos de la Sede</h4>
               <input type="text" value={schoolSettings.name} onChange={(e) => setSchoolSettings(p => ({...p, name: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-sm font-bold text-blue-400 outline-none focus:ring-2 focus:ring-blue-500" />
               <p className="mt-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Código Nube: <span className="text-white">{schoolSettings.cloudProjectKey || 'No activo'}</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl text-center">
         <HardDrive className="w-8 h-8 text-blue-600 mx-auto mb-4" />
         <h3 className="text-sm font-black uppercase mb-6">Copia de Seguridad Manual (JSON)</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => {
               const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
               const a = document.createElement('a'); a.href = dataStr; a.download = `ACADEMIA_FULL_BACKUP.json`; a.click();
            }} className="py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition shadow-lg">Exportar Copia Total</button>
            <button onClick={() => jsonInputRef.current?.click()} className="py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition">Importar Copia Total</button>
            <input type="file" ref={jsonInputRef} onChange={(e) => {
               const f = e.target.files?.[0]; if (!f) return;
               const r = new FileReader();
               r.onload = (ev) => { try { onImportData(JSON.parse(ev.target?.result as string)); alert("Backup cargado."); } catch(e) { alert("Error."); }};
               r.readAsText(f);
            }} className="hidden" />
         </div>
      </div>
    </div>
  );
};

export default UserSettings;
