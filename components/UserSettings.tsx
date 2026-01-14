import React, { useRef, useState } from 'react';
import { User, SchoolSettings } from '../types';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Building2, 
  Camera, 
  Users, 
  Mail, 
  Chrome, 
  RefreshCcw, 
  RotateCcw,
  Server,
  Share2,
  FileUp,
  FileDown,
  Smartphone,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  X,
  AlertCircle
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
      } catch (err) {
        console.error("Error al abrir selector:", err);
      }
    } else {
      alert(
        "ESTADO DEL ENTORNO:\n\n" +
        "La sincronización directa con Google Cloud requiere estar en un navegador de PC.\n\n" +
        "PARA CELULAR:\n" +
        "1. Usa 'Exportar PC' en tu computadora.\n" +
        "2. Pásate el archivo .json al celular.\n" +
        "3. Usa 'Importar PC' aquí en tu celular."
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
          if (confirm("¿Reemplazar todos los datos actuales con este archivo?")) {
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
      {/* Banner Principal */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-blue-400 font-black text-xs uppercase tracking-widest mb-2">
              <Shield className="w-4 h-4" /> Configuración y Seguridad
            </div>
            <h2 className="text-3xl font-black tracking-tighter">Gestión de Datos</h2>
            <p className="text-slate-400 text-sm max-w-md">Administra la identidad y el respaldo de tu academia.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
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
          {/* Perfil Institucional */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800">
              <Building2 className="w-5 h-5 text-blue-600" /> Perfil Institucional
            </h3>
            
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-40 h-40 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative">
                  {schoolSettings.logo ? (
                    <img src={schoolSettings.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Subir Logo</span>
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

          {/* Sincronización */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-40"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Share2 className="w-5 h-5 text-blue-600" /> Sincronización
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowHelpModal(true)}
                  className="p-1.5 text-slate-400 hover:text-purple-600 transition hover:bg-purple-50 rounded-lg"
                  title="Ayuda técnica"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                {schoolSettings.googleDriveLinked && (
                  <button 
                    onClick={verifyAccountStatus}
                    disabled={isVerifying}
                    className="p-1.5 text-slate-400 hover:text-blue-600 transition hover:bg-blue-50 rounded-lg"
                  >
                    <RefreshCcw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 mb-6 relative z-10 leading-relaxed font-medium">
              Vincular tu cuenta permite guardar respaldos automáticos y activar la IA (Sólo PC).
            </p>
            
            <div className="space-y-4 relative z-10">
              <button 
                onClick={handleToggleGoogleDrive}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition shadow-lg ${schoolSettings.googleDriveLinked ? 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100' : 'bg-slate-900 text-white hover:bg-black'}`}
              >
                {schoolSettings.googleDriveLinked ? (
                  <><RotateCcw className="w-4 h-4" /> CAMBIAR CUENTA GMAIL</>
                ) : (
                  <><Chrome className="w-4 h-4" /> VINCULAR GMAIL</>
                )}
              </button>

              {schoolSettings.googleDriveLinked && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[9px] font-black uppercase text-blue-600 mb-1.5 ml-1">Correo Vinculado</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="email" 
                      placeholder="Correo Gmail..."
                      value={schoolSettings.linkedEmail || ''}
                      onChange={(e) => handleUpdateSetting('linkedEmail', e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
              <Smartphone className="w-5 h-5 text-slate-400 shrink-0" />
              <p className="text-[9px] text-slate-400 italic">
                Usa 'Importar/Exportar' para mover datos entre tu PC y tu Celular.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Operadores */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" /> Operadores
                </h3>
                <p className="text-xs text-slate-500">Usuarios con acceso al sistema.</p>
              </div>
              <button 
                onClick={handleAddUser} 
                className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-2 text-xs"
              >
                <UserPlus className="w-4 h-4" /> Nuevo Operador
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

          {/* Datos de Sede */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-8">
              <Server className="w-6 h-6 text-blue-600" /> Datos de Sede
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Dirección de Sede</label>
                <input type="text" value={schoolSettings.address} onChange={(e) => handleUpdateSetting('address', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Línea de Atención</label>
                <input type="text" value={schoolSettings.phone} onChange={(e) => handleUpdateSetting('phone', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Ayuda Técnica - Configuración Google */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 bg-purple-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6" />
                <h3 className="text-lg font-black uppercase tracking-tight">Guía de Configuración Google</h3>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="hover:bg-white/20 p-2 rounded-xl transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Para activar la IA y la nube, necesitas configurar un proyecto en <strong>Google Cloud</strong>. 
                  Sigue estos pasos exactamente para evitar errores de facturación.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Habilitar la API</h4>
                    <p className="text-xs text-slate-500 mb-2">Busca y habilita <strong>"Generative Language API"</strong> en tu consola de Google Cloud.</p>
                    <a href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" target="_blank" className="text-[10px] font-bold text-purple-600 flex items-center gap-1 hover:underline">
                      IR A LA BIBLIOTECA DE GOOGLE CLOUD <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Crear Credenciales</h4>
                    <p className="text-xs text-slate-500 mb-3">En el menú "Credenciales", haz clic en "+ Crear credenciales" y elige <strong>"Clave de API"</strong>.</p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-[11px] font-black text-slate-400 uppercase mb-2 italic">Si te pregunta "¿A qué datos quieres acceder?":</p>
                      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-black text-purple-900">SELECCIONA: "DATOS PÚBLICOS" (Public Data)</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2">No elijas "Datos de usuario" a menos que quieras configurar la pantalla de consentimiento OAuth.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Vincular a la App</h4>
                    <p className="text-xs text-slate-500">Usa el botón "VINCULAR GMAIL" en esta pantalla. Al elegir tu cuenta, Google detectará tu clave y activará las funciones.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400">¿Sigues teniendo dudas? <br /> Consulta la <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" className="underline hover:text-purple-600">documentación oficial de Google AI Studio</a>.</p>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition"
              >
                ENTENDIDO, VOLVER
              </button>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={dataInputRef} onChange={handleImportData} accept=".json" className="hidden" />
    </div>
  );
};

export default UserSettings;