
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
  Database,
  Plus,
  ListFilter,
  Check,
  Mail,
  Info,
  Globe
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
  const [apiStatus, setApiStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  
  const [newCategory, setNewCategory] = useState('');
  const [newPosition, setNewPosition] = useState('');

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

  const handleUpdateSetting = (field: keyof SchoolSettings, value: any) => {
    setSchoolSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (schoolSettings.categories.includes(newCategory)) return;
    handleUpdateSetting('categories', [...schoolSettings.categories, newCategory.trim()]);
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    handleUpdateSetting('categories', schoolSettings.categories.filter(c => c !== cat));
  };

  const handleAddPosition = () => {
    if (!newPosition.trim()) return;
    if (schoolSettings.positions.includes(newPosition)) return;
    handleUpdateSetting('positions', [...schoolSettings.positions, newPosition.trim()]);
    setNewPosition('');
  };

  const handleRemovePosition = (pos: string) => {
    handleUpdateSetting('positions', schoolSettings.positions.filter(p => p !== pos));
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
    const backupData = {
      ...allData,
      exportInfo: {
        date: new Date().toISOString(),
        origin: schoolSettings.name,
        version: "2.1-dynamic-lists"
      }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `RESPALDO_${schoolSettings.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
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
          if (json.students && json.schoolSettings) {
            if (confirm("⚠️ ¿Reemplazar todos los datos actuales?")) {
              onImportData(json);
              alert("✅ Datos importados.");
            }
          }
        } catch (error) { alert("❌ Error al leer el archivo."); }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* SECCIÓN DE ALMACENAMIENTO E IDENTIDAD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Dirección Física</label>
                   <input type="text" value={schoolSettings.address} onChange={(e) => handleUpdateSetting('address', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* CLOUD CONNECTIVITY SECTION */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                   <div className="bg-blue-600 p-3 rounded-2xl">
                      <Globe className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Sincronización en la Nube</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Resguardo en Google Cloud Platform</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                   <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 p-5 rounded-3xl">
                         <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest flex items-center gap-2">
                            <Mail className="w-3 h-3" /> Correo de la Cuenta Vinculada
                         </label>
                         <input 
                            type="email" 
                            placeholder="Ej: tu-correo@gmail.com"
                            value={schoolSettings.linkedEmail || ''}
                            onChange={(e) => handleUpdateSetting('linkedEmail', e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
                         />
                         <p className="text-[9px] text-slate-500 mt-3 italic leading-relaxed">
                            * Escribe aquí el correo que seleccionaste en el prompt de Google. Esto servirá para identificar tu respaldo.
                         </p>
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl">
                         <h4 className="text-xs font-black uppercase mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-400" /> ¿Dónde está mi Drive?
                         </h4>
                         <p className="text-[11px] text-slate-400 leading-relaxed">
                            Tus datos se guardan en el **almacenamiento persistente del Proyecto de Google Cloud** asociado a tu cuenta. Para mover los datos a tu Google Drive personal como un archivo, usa la sección **"Respaldo USB"**.
                         </p>
                      </div>
                      
                      <button 
                         onClick={handleToggleGoogleDrive}
                         className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-3 ${apiStatus === 'CONNECTED' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-blue-50'}`}
                      >
                         {apiStatus === 'CONNECTED' ? <CheckCircle2 className="w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />}
                         {apiStatus === 'CONNECTED' ? 'SERVICIO ACTIVADO' : 'VINCULAR CUENTA GOOGLE'}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* SECCIÓN USB: Transferencia sin Internet */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-50 rounded-full transition-transform group-hover:scale-125"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
                  <Usb className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Respaldo Manual</h3>
              </div>
              
              <p className="text-xs text-slate-500 mb-8 leading-relaxed font-medium">
                Descarga un archivo real para guardarlo en tu **Google Drive**, **USB** o enviarlo por **Email**.
              </p>

              <div className="space-y-3">
                <button 
                  onClick={handleExportData}
                  className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all group/btn shadow-lg"
                >
                  <span className="font-bold text-sm">Descargar Archivo</span>
                  <FileDown className="w-5 h-5" />
                </button>

                <button 
                  onClick={() => dataInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl hover:border-amber-400 transition-all"
                >
                  <span className="font-bold text-sm">Subir Archivo</span>
                  <FileUp className="w-5 h-5" />
                </button>
                <input type="file" ref={dataInputRef} onChange={handleImportData} accept=".json" className="hidden" />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
             <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-6 h-6 text-slate-400" />
             </div>
             <h4 className="text-sm font-black text-slate-800 uppercase mb-2">Resguardo Local</h4>
             <p className="text-[10px] text-slate-500 font-medium px-2">
                Tus datos también están en este navegador (IndexedDB) y no se borran al cerrar la pestaña.
             </p>
          </div>
        </div>
      </div>

      {/* LISTAS DEL SISTEMA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-tighter">
            <ListFilter className="w-5 h-5 text-blue-600" /> Categorías Disponibles
          </h3>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Ej: Sub-17..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
            />
            <button onClick={handleAddCategory} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {schoolSettings.categories.map(cat => (
              <div key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100 group">
                {cat}
                <button onClick={() => handleRemoveCategory(cat)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-tighter">
            <Sparkles className="w-5 h-5 text-emerald-600" /> Posiciones de Campo
          </h3>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="Ej: Volante..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
            />
            <button onClick={handleAddPosition} className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {schoolSettings.positions.map(pos => (
              <div key={pos} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100 group">
                {pos}
                <button onClick={() => handleRemovePosition(pos)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gestión de Usuarios Operadores */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
            <Users className="w-6 h-6 text-blue-600" /> Operadores del Sistema
          </h3>
          <button 
            onClick={handleAddUser} 
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition text-xs flex items-center gap-2 shadow-lg"
          >
            <UserPlus className="w-4 h-4" /> Nuevo Perfil
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
};

export default UserSettings;
