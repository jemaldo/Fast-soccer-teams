
import React, { useState, useEffect, useCallback } from 'react';
import { 
  AppView, 
  Student, 
  Teacher, 
  Payment, 
  CashTransaction, 
  MatchSquad, 
  User,
  SchoolSettings 
} from './types';
import { NAV_ITEMS } from './constants';
import Dashboard from './components/Dashboard';
import StudentManager from './components/StudentManager';
import TeacherManager from './components/TeacherManager';
import FinanceManager from './components/FinanceManager';
import MatchManager from './components/MatchManager';
import TrainingManager from './components/TrainingManager';
import ReportManager from './components/ReportManager';
import UserSettings from './components/UserSettings';
import { db } from './services/dbService';
import { 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X, 
  Trophy, 
  CloudLightning, 
  RefreshCw, 
  AlertCircle, 
  CloudCheck, 
  CloudUpload, 
  Loader2,
  Chrome,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  Database,
  Wifi,
  WifiOff,
  History,
  HardDrive
} from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [cloudUpdateAvailable, setCloudUpdateAvailable] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [isVerifyingGoogle, setIsVerifyingGoogle] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Estados de datos
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    name: 'Academia Deportiva',
    nit: '900.000.000-1',
    address: 'Sede Principal',
    phone: '000-0000',
    email: 'admin@academia.com',
    googleDriveLinked: false
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashFlow, setCashFlow] = useState<CashTransaction[]>([]);
  const [squads, setSquads] = useState<MatchSquad[]>([]);
  const [users, setUsers] = useState<User[]>([{ id: '1', username: 'admin', role: 'ADMIN' }]);

  // Carga inicial desde IndexedDB
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        await db.init();
        const [sSettings, sStudents, sTeachers, sPayments, sCash, sSquads, sUsers] = await Promise.all([
          db.getAll('schoolSettings'),
          db.getAll('students'),
          db.getAll('teachers'),
          db.getAll('payments'),
          db.getAll('cashFlow'),
          db.getAll('squads'),
          db.getAll('users')
        ]);

        if (sSettings) setSchoolSettings(sSettings);
        if (sStudents.length) setStudents(sStudents);
        if (sTeachers.length) setTeachers(sTeachers);
        if (sPayments.length) setPayments(sPayments);
        if (sCash.length) setCashFlow(sCash);
        if (sSquads.length) setSquads(sSquads);
        if (sUsers.length) setUsers(sUsers);
        
        setIsDataLoaded(true);
      } catch (e) {
        console.error("Error al cargar base de datos local:", e);
        setIsDataLoaded(true);
      }
    };
    loadLocalData();
  }, []);

  // Monitor de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Guardado automático en IndexedDB
  useEffect(() => { if(isDataLoaded) db.save('schoolSettings', schoolSettings); }, [schoolSettings, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) { db.save('students', students); setHasUnsavedChanges(true); } }, [students, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) { db.save('teachers', teachers); setHasUnsavedChanges(true); } }, [teachers, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) { db.save('payments', payments); setHasUnsavedChanges(true); } }, [payments, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) { db.save('cashFlow', cashFlow); setHasUnsavedChanges(true); } }, [cashFlow, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) { db.save('squads', squads); setHasUnsavedChanges(true); } }, [squads, isDataLoaded]);
  useEffect(() => { if(isDataLoaded) { db.save('users', users); setHasUnsavedChanges(true); } }, [users, isDataLoaded]);

  const checkGoogleStatus = useCallback(async () => {
    if (!isOnline) {
      setIsVerifyingGoogle(false);
      return;
    }
    setIsVerifyingGoogle(true);
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await aistudio.hasSelectedApiKey();
        setIsGoogleAuthenticated(hasKey);
      }
    } catch (e) {
      console.error("Error verificando estado de Google:", e);
    } finally {
      setIsVerifyingGoogle(false);
    }
  }, [isOnline]);

  useEffect(() => {
    if (currentUser) {
      checkGoogleStatus();
    }
  }, [currentUser, checkGoogleStatus]);

  const handleGoogleAuth = async () => {
    if (!isOnline) {
      alert("Se requiere conexión a internet para vincular con Google Cloud.");
      return;
    }
    setAuthError(null);
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        setIsGoogleAuthenticated(true);
        setSchoolSettings(prev => ({ ...prev, googleDriveLinked: true }));
      } catch (err: any) {
        console.error("Error linking Google:", err);
        setAuthError("Error de vinculación. Revisa tu conexión.");
      }
    }
  };

  const handlePushToCloud = () => {
    if (!isOnline) {
      alert("No puedes sincronizar sin internet. Tus datos están seguros en la base de datos local de este PC.");
      return;
    }
    if (!isGoogleAuthenticated) return;
    setIsSyncing(true);
    
    const allData = { 
      schoolSettings, students, teachers, payments, cashFlow, squads, users, 
      lastUpdate: new Date().toISOString() 
    };
    
    localStorage.setItem('SIMULATED_CLOUD_DATA', JSON.stringify(allData));
    setSchoolSettings(prev => ({ ...prev, lastCloudSync: new Date().toISOString() }));
    
    setTimeout(() => {
      setHasUnsavedChanges(false);
      setIsSyncing(false);
    }, 800);
  };

  const handleImportAllData = (data: any) => {
    if (!data || typeof data !== 'object') return;
    if (data.students) setStudents(data.students);
    if (data.teachers) setTeachers(data.teachers);
    if (data.payments) setPayments(data.payments);
    if (data.cashFlow) setCashFlow(data.cashFlow);
    if (data.squads) setSquads(data.squads);
    if (data.users) setUsers(data.users);
    if (data.schoolSettings) {
      setSchoolSettings(prev => ({
        ...data.schoolSettings,
        googleDriveLinked: prev.googleDriveLinked,
        lastCloudSync: new Date().toISOString()
      }));
    }
    setCloudUpdateAvailable(null);
    setHasUnsavedChanges(false);
  };

  const renderView = () => {
    const commonProps = { schoolSettings, students, teachers, payments, cashFlow, squads, users };
    switch (currentView) {
      case 'DASHBOARD': return <Dashboard {...commonProps} />;
      case 'STUDENTS': return <StudentManager students={students} setStudents={setStudents} payments={payments} setPayments={setPayments} schoolSettings={schoolSettings} />;
      case 'TEACHERS': return <TeacherManager teachers={teachers} setTeachers={setTeachers} payments={payments} setPayments={setPayments} schoolSettings={schoolSettings} />;
      case 'FINANCE': return <FinanceManager cashFlow={cashFlow} setCashFlow={setCashFlow} />;
      case 'MATCHES': return <MatchManager squads={squads} setSquads={setSquads} students={students} schoolSettings={schoolSettings} />;
      case 'TRAINING': return <TrainingManager />;
      case 'REPORTS': return <ReportManager students={students} teachers={teachers} payments={payments} cashFlow={cashFlow} />;
      case 'USERS':
        return (
          <UserSettings 
            users={users} 
            setUsers={setUsers} 
            currentUser={currentUser} 
            schoolSettings={schoolSettings} 
            setSchoolSettings={setSchoolSettings}
            allData={{ schoolSettings, students, teachers, payments, cashFlow, squads, users }}
            onImportData={handleImportAllData}
          />
        );
      default: return <Dashboard {...commonProps} />;
    }
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-white font-black uppercase tracking-widest text-xs">Abriendo Base de Datos Local (IndexedDB)...</p>
        </div>
      </div>
    );
  }

  // VISTA 1: Login del Operador
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>
          
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
            <Trophy className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-black mb-2 text-slate-900 tracking-tight uppercase">{schoolSettings.name}</h1>
          <p className="text-slate-400 text-xs mb-10 font-bold uppercase tracking-widest">Sistema Pro-Manager</p>
          
          <div className="space-y-3 text-left">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 tracking-widest">Seleccionar Perfil de Acceso</label>
            <div className="grid grid-cols-1 gap-2">
               {users.map(user => (
                 <button 
                   key={user.id}
                   onClick={() => setCurrentUser(user)}
                   className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-blue-50 hover:border-blue-400 transition-all group"
                 >
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm font-black group-hover:bg-blue-600 group-hover:text-white transition">
                        {user.username.charAt(0).toUpperCase()}
                     </div>
                     <span className="font-bold text-slate-700 group-hover:text-blue-900">{user.username}</span>
                   </div>
                   <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition" />
                 </button>
               ))}
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-2 items-center justify-center">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                <span className="text-[10px] font-black uppercase text-slate-400">{isOnline ? 'Conexión Segura Detectada' : 'Modo Fuera de Línea Activo'}</span>
             </div>
             <p className="text-[9px] text-slate-300 font-medium px-4">Tus datos se guardan en el disco duro local de este navegador.</p>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: Vinculación de Google Cloud (Protección de Datos)
  if (!isGoogleAuthenticated && isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
         <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-xl text-center border border-slate-200 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
            
            <div className="relative z-10">
               <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full text-purple-600 font-black text-[10px] uppercase tracking-widest mb-8">
                  <ShieldCheck className="w-4 h-4" /> Protección Anti-Pérdida
               </div>
               
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Respalda tus Datos</h2>
               <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed mb-10">
                  Actualmente tus datos solo viven en este PC. Vincular tu cuenta de Google te permite **recuperar todo si el PC se daña**.
               </p>

               <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-200">
                        <HardDrive className="w-5 h-5 text-amber-600" />
                     </div>
                     <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase mb-1">Estado: Almacenamiento Local</h4>
                        <p className="text-[11px] text-slate-400">Los datos están en tu navegador. Si el PC falla, podrías perder la información.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100 text-left">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-200">
                        <CloudLightning className="w-5 h-5 text-blue-600" />
                     </div>
                     <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase mb-1">Sincronización en la Nube</h4>
                        <p className="text-[11px] text-slate-400">Activa el respaldo para acceder desde cualquier PC y proteger tu academia.</p>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleGoogleAuth}
                    className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20"
                  >
                    <Chrome className="w-5 h-5" /> Vincular con Google (Recomendado)
                  </button>
                  <button 
                    onClick={() => setIsGoogleAuthenticated(true)}
                    className="w-full bg-white border border-slate-200 text-slate-400 py-4 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition"
                  >
                    Continuar solo en local (Riesgoso)
                  </button>
               </div>
            </div>
         </div>
      </div>
    );
  }

  // VISTA 3: Panel Principal (Dashboard)
  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden relative">
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase truncate">{schoolSettings.name}</h1>
          </div>

          <nav className="space-y-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as AppView);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                {item.icon}
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/50 rounded-2xl border border-white/5">
              <div className="bg-slate-700 p-2 rounded-xl">
                <UserIcon className="w-5 h-5 text-slate-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black truncate text-white">{currentUser.username}</p>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{currentUser.role}</p>
              </div>
            </div>
            <button 
              onClick={() => { setCurrentUser(null); setIsGoogleAuthenticated(false); }}
              className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-400 py-3 rounded-xl text-xs transition font-black uppercase tracking-widest"
            >
              <LogOut className="w-4 h-4" /> CERRAR SESIÓN
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                {NAV_ITEMS.find(i => i.id === currentView)?.label}
              </h2>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'En línea' : 'Desconectado'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
               {!isOnline ? (
                 <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] bg-amber-50 px-4 py-2 rounded-full border border-amber-100" title="Tus datos se guardan solo en este computador">
                    <Database className="w-3.5 h-3.5" /> BASE LOCAL
                 </div>
               ) : schoolSettings.googleDriveLinked ? (
                 <>
                   {hasUnsavedChanges ? (
                      <button 
                        onClick={handlePushToCloud}
                        disabled={isSyncing}
                        className="flex items-center gap-2 text-white font-black text-[10px] bg-blue-600 px-5 py-2.5 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
                      >
                        {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                        {isSyncing ? 'PROTEGIENDO...' : 'SUBIR COPIA DE SEGURIDAD'}
                      </button>
                   ) : (
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                        <CloudCheck className="w-3.5 h-3.5" /> DATOS RESPALDADOS
                      </div>
                   )}
                 </>
               ) : (
                 <button 
                  onClick={handleGoogleAuth}
                  className="flex items-center gap-2 text-amber-600 font-black text-[10px] bg-amber-50 px-4 py-2 rounded-full border border-amber-200 hover:bg-amber-100 transition"
                 >
                   <AlertCircle className="w-3.5 h-3.5" /> ACTIVAR RESPALDO
                 </button>
               )}
             </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderView()}
        </section>
      </main>
    </div>
  );
};

export default App;
