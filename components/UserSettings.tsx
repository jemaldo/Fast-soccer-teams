import React, { useRef, useState } from 'react';
import { User, SchoolSettings } from '../types';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Building2, 
  Camera, 
  X, 
  Users, 
  Database, 
  CloudUpload, 
  Chrome, 
  RefreshCcw, 
  Mail, 
  Fingerprint, 
  RotateCcw,
  Server,
  Share2,
  FileUp,
  FileDown,
  AlertCircle,
  Smartphone
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
  currentUser, 
  schoolSettings, 
  setSchoolSettings,
  allData,
  onImportData
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);

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
      setSchoolSettings(prev => ({ ...prev, googleDriveLinked: hasKey }));
    }
    setTimeout(() => setIsVerifying(false), 800);
  };

  const handleToggleGoogleDrive = async () => {
    const aistudio = (window as any).aistudio;

    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        setSchoolSettings(prev => ({ 
          ...prev, 
          googleDriveLinked: true,
          lastCloudSync: new Date().toISOString() 
        }));
        alert("¡Proceso de vinculación iniciado! Selecciona tu cuenta en el diálogo de Google.");
      } catch (err) {
        console.error("Error al abrir selector:", err);
      }
    } else {
      // Mensaje mucho más explicativo para el usuario
      alert(
        "ESTADO DEL ENTORNO:\n\n" +
        "La sincronización directa con Google Cloud (Nube) requiere estar en un navegador de PC o dentro de Google AI Studio.\n\n" +
        "SOLUCIÓN PARA CELULAR:\n" +
        "1. Usa el botón 'Exportar PC' en tu computadora.\n" +
        "2. Pásate el archivo por WhatsApp o Correo.\n" +
        "3. Usa el botón 'Importar PC' en este celular para cargar tus datos."
      );
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Backup_Academia_${new Date().toISOString().split('T')[0]}.json`);
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
          if (confirm("¿Reemplazar todos los datos del celular con los del archivo?")) {
            onImportData(json);
          }
        } catch (error) {
          alert("Error: Archivo no válido.");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Banner Superior */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-blue-400 font-black text-xs uppercase tracking-widest mb-2">
              <Shield className="w-4 h-4" /> Centro de Control y Datos
            </div>
            <h2 className="text-3xl font-black tracking-tighter">Configuración General</h2>
            <p className="text-slate-400 text-sm max-w-md">Respalda tu información localmente o en la nube.</p>
          </div>
          <div className="flex gap-4">
             <button onClick={handleExportData} className="bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-3 rounded-2xl font-bold text-sm transition flex items-center gap-2">
                <FileDown className="w-5 h-5" /> Exportar PC
             </button>
             <button onClick={() => dataInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-bold text-sm transition flex items-center gap-2 shadow-xl shadow-blue-900/40">
                <FileUp className="w-5 h-5" /> Importar PC
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* IDENTIDAD VISUAL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800">
              <Building2 className="w-5 h-5 text-blue-600" /> Academia
            </h3>
            
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-40 h-40 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative">
                  {schoolSettings.logo ? (
                    <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Logo</span>
                    </>
                  )}
                  <button onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <Camera className="w-8 h-8" />
                  </button>
                </div>
                <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nombre Academia</label>
                <input type="text" value={schoolSettings.name} onChange={(e) => handleUpdateSetting('name', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">NIT / Registro</label>
                <input type="text" value={schoolSettings.nit} onChange={(e) => handleUpdateSetting('nit', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
              </div>
            </div>
          </div>

          {/* CLOUD SETTINGS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-40"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Share2 className="w-5 h-5 text-blue-600" /> Sincronización Nube
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-500 mb-6 relative z-10 leading-relaxed font-medium">
              Usa esta función en tu PC para respaldar datos automáticamente. En celulares, recomendamos usar 'Exportar/Importar'.
            </p>
            
            <div className="space-y-4 relative z-10">
              <button 
                onClick={handleToggleGoogleDrive}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition shadow-lg ${schoolSettings.googleDriveLinked ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-900 text-white hover:bg-black'}`}
              >
                {schoolSettings.googleDriveLinked ? (
                  <><RotateCcw className="w-4 h-4" /> CAMBIAR CUENTA GMAIL</>
                ) : (
                  <><Chrome className="w-4 h-4" /> VINCULAR GMAIL</>
                )}
              </button>

              {schoolSettings.googleDriveLinked && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[9px] font-black uppercase text-blue-600 mb-1.5 ml-1">Correo para Sincronización</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="email" 
                      placeholder="Correo vinculado..."
                      value={schoolSettings.linkedEmail || ''}
                      onChange={(e) => handleUpdateSetting('linkedEmail', e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Aviso especial para Móvil */}
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
              <Smartphone className="w-5 h-5 text-slate-400 shrink-0" />
              <p className="text-[9px] text-slate-400 italic">
                Nota: La vinculación automática de Google Cloud no es compatible con algunos navegadores móviles estándar.
              </p>
            </div>
          </div>
        </div>

        {/* Info Detallada */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" /> Operadores
                </h3>
                <p className="text-xs text-slate-500">Administra los usuarios autorizados.</p>
              </div>
              <button 
                onClick={handleAddUser} 
                className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-2 text-xs"
              >
                <UserPlus className="w-4 h-4" /> Nuevo Usuario
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 font-black text-lg">
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

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-8">
              <Server className="w-6 h-6 text-blue-600" /> Sede y Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Dirección Principal</label>
                <input type="text" value={schoolSettings.address} onChange={(e) => handleUpdateSetting('address', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">WhatsApp / Teléfono</label>
                <input type="text" value={schoolSettings.phone} onChange={(e) => handleUpdateSetting('phone', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <input type="file" ref={dataInputRef} onChange={handleImportData} accept=".json" className="hidden" />
    </div>
  );
};

export default UserSettings;