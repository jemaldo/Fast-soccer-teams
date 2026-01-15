
import React, { useRef, useState, useEffect } from 'react';
import { User, SchoolSettings } from '../types';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Building2, 
  Camera, 
  Users, 
  RefreshCcw, 
  Server,
  FileUp,
  FileDown,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Usb,
  HardDrive,
  Save,
  Database
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
  users, 
  setUsers, 
  schoolSettings, 
  setSchoolSettings,
  allData,
  onImportData
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [apiStatus, setApiStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await aistudio.hasSelectedApiKey();
        setApiStatus(hasKey ? 'CONNECTED' : 'IDLE');
        setSchoolSettings(prev => ({ ...prev, googleDriveLinked: hasKey }));
      }
    };
    checkKey();
  }, []);

  const handleAddUser = () => {
    const username = prompt("Nombre de usuario:");
    const role = prompt("Rol (ADMIN, COACH, SECRETARY):") as any;
    if (username && role) {
      setUsers([...users, { id: Date.now().toString(), username, role }]);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolSettings(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSetting = (field: keyof SchoolSettings, value: string) => {
    setSchoolSettings(prev => ({ ...prev, [field]: value }));
  };

  const verifyAccountStatus = async () => {
    setIsVerifying(true);
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await aistudio.hasSelectedApiKey();
      setApiStatus(hasKey ? 'CONNECTED' : 'IDLE');
      setSchoolSettings(prev => ({ ...prev, googleDriveLinked: hasKey }));
    }
    setTimeout(() => setIsVerifying(false), 800);
  };

  const handleToggleGoogleDrive = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        setApiStatus('CONNECTED');
        setSchoolSettings(prev => ({ ...prev, googleDriveLinked: true }));
      } catch (err: any) {
        setApiStatus('ERROR');
      }
    }
  };

  const handleExportData = () => {
    // Empaquetamos todo el estado actual para la exportación manual
    const backupData = {
      ...allData,
      exportInfo: {
        date: new Date().toISOString(),
        origin: schoolSettings.name,
        version: "2.0-offline-ready"
      }
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `BACKUP_USB_${schoolSettings.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          // Validación básica de integridad
          if (json.students && json.schoolSettings) {
            if (confirm("⚠️ ATENCIÓN: Esta acción reemplazará TODOS los datos actuales en este PC por los del archivo de respaldo. ¿Deseas continuar?")) {
              onImportData(json);
              alert("✅ Datos importados con éxito. La base de datos local ha sido actualizada.");
            }
          } else {
            alert("❌ Error: El archivo no parece ser un respaldo válido de la aplicación.");
          }
        } catch (error) {
          alert("❌ Error: No se pudo leer el archivo. Asegúrate de que es el .json generado por la app.");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Banner de Estado de Almacenamiento */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-900/40">
              <HardDrive className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight uppercase">Base de Datos Local</h2>
              <p className="text-slate-400 text-sm font-medium">Estado: <span className="text-emerald-400 font-bold">Activa y Persistente en este PC</span></p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-4">
            <Database className="w-5 h-5 text-blue-400" />
            <div className="text-xs">
               <p className="font-bold text-slate-300">Resguardo Automático</p>
               <p className="text-slate-500">Cada cambio se guarda al instante.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* SECCIÓN USB: Transferencia sin Internet */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-50 rounded-full transition-transform group-hover:scale-125"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
                  <Usb className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Transferencia USB</h3>
              </div>
              
              <p className="text-xs text-slate-500 mb-8 leading-relaxed">
                Usa estas opciones para mover tus datos a otro computador **sin necesidad de internet**.
              </p>

              <div className="space-y-3">
                <button 
                  onClick={handleExportData}
                  className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all group/btn shadow-lg shadow-slate-900/10"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Paso 1</span>
                    <span className="font-bold text-sm">Exportar para USB</span>
                  </div>
                  <FileDown className="w-5 h-5 group-hover/btn:translate-y-0.5 transition" />
                </button>

                <button 
                  onClick={() => dataInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl hover:border-amber-400 hover:text-amber-700 transition-all group/btn"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paso 2</span>
                    <span className="font-bold text-sm">Importar desde USB</span>
                  </div>
                  <FileUp className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition" />
                </button>
                <input type="file" ref={dataInputRef} onChange={handleImportData} accept=".json" className="hidden" />
              </div>

              <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed text-center italic">
                  "Genera un archivo, pásalo a una memoria USB y cárgalo en el otro PC."
                </p>
              </div>
            </div>
          </div>

          {/* Sincronización e IA (Internet) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Sparkles className="w-5 h-5 text-purple-600" /> Nube e Inteligencia
              </h3>
              <button onClick={() => setShowHelpModal(true)} className="p-1.5 text-slate-400 hover:text-purple-600 transition">
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={handleToggleGoogleDrive}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition shadow-lg ${apiStatus === 'CONNECTED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
            >
              {apiStatus === 'CONNECTED' ? (
                <><CheckCircle2 className="w-4 h-4" /> IA CONECTADA</>
              ) : (
                <><RefreshCcw className="w-4 h-4" /> RE-VINCULAR IA</>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Identidad de la Academia */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-8">
              <Building2 className="w-6 h-6 text-blue-600" /> Perfil de la Academia
            </h3>
            
            <div className="flex flex-col md:flex-row gap-10 items-start">
              <div className="relative group shrink-0">
                <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative">
                  {schoolSettings.logo ? (
                    <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 mb-2" />
                      <span className="text-[10px] font-black uppercase text-center px-4">Subir Logo</span>
                    </>
                  )}
                  <button onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <Camera className="w-8 h-8" />
                  </button>
                </div>
                <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
              </div>

              <div className="flex-1 w-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Nombre Comercial</label>
                    <input type="text" value={schoolSettings.name} onChange={(e) => handleUpdateSetting('name', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Identificación NIT</label>
                    <input type="text" value={schoolSettings.nit} onChange={(e) => handleUpdateSetting('nit', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Sede Principal</label>
                    <input type="text" value={schoolSettings.address} onChange={(e) => handleUpdateSetting('address', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Teléfono Contacto</label>
                    <input type="text" value={schoolSettings.phone} onChange={(e) => handleUpdateSetting('phone', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gestión de Usuarios Operadores */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-600" /> Operadores Autorizados
              </h3>
              <button 
                onClick={handleAddUser} 
                className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition text-xs flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Agregar Perfil
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 font-black text-lg shadow-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{user.username}</p>
                      <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider">{user.role}</span>
                    </div>
                  </div>
                  {user.id !== '1' && (
                    <button onClick={() => setUsers(users.filter(u => u.id !== user.id))} className="p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
