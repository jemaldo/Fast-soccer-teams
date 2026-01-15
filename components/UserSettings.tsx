
import React, { useRef, useState } from 'react';
import { User, SchoolSettings, Student } from '../types';
import { 
  Building2, Globe, ShieldCheck, Zap, Share2, Settings, Trash2, 
  Upload, AlertTriangle, Plus, ListFilter, HardDrive, DownloadCloud, 
  Activity, Sparkles, CheckCircle2, Loader2, ExternalLink, ShoppingCart,
  Database, Server, Rocket, ArrowRight
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
    if (!confirm("COMPRESIÓN EXTREMA: Esto reducirá las fotos a miniaturas de 40px para que quepan en el servidor gratuito. ¿Continuar?")) return;
    setIsOptimizing(true);
    
    const compress = (base64Str: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 40; canvas.height = 40; // Miniatura extrema
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, 40, 40);
          resolve(canvas.toDataURL('image/jpeg', 0.3));
        };
      });
    };

    const optimizedStudents = await Promise.all(allData.students.map(async (s: Student) => {
      if (s.photo && s.photo.length > 1000) {
        const compressed = await compress(s.photo);
        return { ...s, photo: compressed };
      }
      return s;
    }));

    onImportData({ ...allData, students: optimizedStudents });
    setIsOptimizing(false);
    alert("✅ FOTOS MINIMIZADAS. Ahora tus datos pesan muy poco. Intenta sincronizar de nuevo.");
  };

  const payloadSize = JSON.stringify(allData).length;
  const isTooHeavy = payloadSize > 64000;
  const percentage = Math.min(Math.round((payloadSize / 64000) * 100), 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* SECCIÓN DE RECOMENDACIÓN DEL INGENIERO */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Database className="w-64 h-64 rotate-12" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 p-2 rounded-lg">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Recomendación del Ingeniero</span>
          </div>
          <h2 className="text-4xl font-black mb-4 leading-none tracking-tighter">Pásate a Supabase (Gratis)</h2>
          <p className="text-emerald-100 font-medium mb-8">
            Estás usando un servidor temporal de texto limitado a 64KB. Para escalar tu academia con miles de fotos y máxima velocidad, te recomiendo migrar a una base de datos real.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
              <h4 className="font-black text-sm mb-1">Plan Actual (Lite)</h4>
              <p className="text-[10px] opacity-70 mb-4">Servidor KVDB Free</p>
              <ul className="text-[10px] space-y-2 font-bold">
                <li className="flex items-center gap-2 opacity-60">❌ Límite 64 KB (Muy poco)</li>
                <li className="flex items-center gap-2 opacity-60">❌ Fotos borrosas/pequeñas</li>
                <li className="flex items-center gap-2 opacity-60">❌ Error de Conexión frecuente</li>
              </ul>
            </div>
            <div className="bg-white/20 backdrop-blur-md p-5 rounded-2xl border border-white/40 ring-4 ring-white/10">
              <h4 className="font-black text-sm mb-1 text-yellow-300">Plan Pro (Supabase)</h4>
              <p className="text-[10px] opacity-70 mb-4">Base de Datos Dedicada</p>
              <ul className="text-[10px] space-y-2 font-bold">
                <li className="flex items-center gap-2 text-emerald-300">✅ 500 MB (Espacio Infinito)</li>
                <li className="flex items-center gap-2 text-emerald-300">✅ Fotos HD Ilimitadas</li>
                <li className="flex items-center gap-2 text-emerald-300">✅ Gratis Forever</li>
              </ul>
            </div>
          </div>
          <button className="mt-8 bg-white text-emerald-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition">
             Contactar Soporte para Migración <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Estado de la Nube Actual</h3>
              <div className="flex gap-2">
                <button onClick={testConnection} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition">
                  <Activity className="w-5 h-5" />
                </button>
                <button onClick={optimizeMemory} disabled={isOptimizing} className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                  {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Limpieza de Memoria
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacidad de Transferencia (Free Tier)</p>
                  <p className={`text-sm font-black ${isTooHeavy ? 'text-red-600' : 'text-emerald-600'}`}>
                    {Math.round(payloadSize/1024)} KB / 64 KB
                  </p>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isTooHeavy ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              {isTooHeavy && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-[11px] text-red-700 font-bold leading-relaxed uppercase">
                    Error de peso detectado. El servidor gratuito rechaza tus datos. Pulsa "Limpieza de Memoria" para reducir el tamaño de las fotos automáticamente.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Sede Principal</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuración de Identidad</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Nombre de la Academia</label>
                  <input type="text" value={schoolSettings.name} onChange={(e) => setSchoolSettings(p => ({...p, name: e.target.value}))} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">ID de Sincronización</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={schoolSettings.cloudProjectKey || ''} className="flex-1 px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black text-blue-600 outline-none" />
                    <button onClick={() => {
                        navigator.clipboard.writeText(schoolSettings.cloudProjectKey || '');
                        alert("Código copiado.");
                     }} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition"><Share2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col justify-center items-center text-center">
                 <ShieldCheck className="w-12 h-12 text-emerald-500 mb-2" />
                 <h4 className="text-sm font-black uppercase text-slate-800">Seguridad Activa</h4>
                 <p className="text-[10px] text-slate-500 font-bold leading-tight">Tus datos financieros están encriptados antes de subir a la nube.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Server className="w-20 h-20" /></div>
             <h4 className="text-sm font-black uppercase mb-4 text-blue-400">Infraestructura</h4>
             <p className="text-[10px] text-slate-400 font-bold leading-relaxed mb-6">
               Para aumentar el espacio manualmente debes comprar un plan en KVDB.io.
             </p>
             <a href="https://kvdb.io" target="_blank" className="w-full bg-blue-600 py-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition">
               <ShoppingCart className="w-4 h-4" /> Ver Precios
             </a>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
             <HardDrive className="w-10 h-10 text-slate-200 mx-auto mb-4" />
             <h4 className="text-xs font-black uppercase text-slate-800 mb-6">Copia Total (Seguridad)</h4>
             <div className="space-y-3">
               <button onClick={() => {
                 const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
                 const a = document.createElement('a'); a.href = dataStr; a.download = `BACKUP_${schoolSettings.name}.json`; a.click();
               }} className="w-full py-4 border-2 border-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition">Exportar JSON</button>
               <button onClick={() => jsonInputRef.current?.click()} className="w-full py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition">Importar JSON</button>
               <input type="file" ref={jsonInputRef} onChange={(e) => {
                 const f = e.target.files?.[0]; if (!f) return;
                 const r = new FileReader();
                 r.onload = (ev) => { try { onImportData(JSON.parse(ev.target?.result as string)); alert("✅ Copia restaurada."); } catch(e) { alert("❌ Error en archivo."); }};
                 r.readAsText(f);
               }} className="hidden" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
