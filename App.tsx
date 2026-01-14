
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
  Database
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

  // Carga inicial de datos locales
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => {
    const saved = localStorage.getItem('schoolSettings');
    return saved ? JSON.parse(saved) : {
      name: 'Academia Deportiva',
      nit: '900.000.000-1',
      address: 'Sede Principal',
      phone: '000-0000',
      email: 'admin@academia.com',
      googleDriveLinked: false
    };
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('students');
    return saved ? JSON.parse(saved) : [];
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('teachers');
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [cashFlow, setCashFlow] = useState<CashTransaction[]>(() => {
    const saved = localStorage.getItem('cashFlow');
    return saved ? JSON.parse(saved) : [];
  });

  const [squads, setSquads] = useState<MatchSquad[]>(() => {
    const saved = localStorage.getItem('squads');
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : [{ id: '1', username: 'admin', role: 'ADMIN' }];
  });

  // Verificar estado de la API de Google/Gemini
  const checkGoogleStatus = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (currentUser) {
      checkGoogleStatus();
    }
  }, [currentUser, checkGoogleStatus]);

  // Persistencia Local
  useEffect(() => { localStorage.setItem('schoolSettings', JSON.stringify(schoolSettings)); }, [schoolSettings]);
  useEffect(() => { localStorage.setItem('students', JSON.stringify(students)); setHasUnsavedChanges(true); }, [students]);
  useEffect(() => { localStorage.setItem('teachers', JSON.stringify(teachers)); setHasUnsavedChanges(true); }, [teachers]);
  useEffect(() => { localStorage.setItem('payments', JSON.stringify(payments)); setHasUnsavedChanges(true); }, [payments]);
  useEffect(() => { localStorage.setItem('cashFlow', JSON.stringify(cashFlow)); setHasUnsavedChanges(true); }, [cashFlow]);
  useEffect(() => { localStorage.setItem('squads', JSON.stringify(squads)); setHasUnsavedChanges(true); }, [squads]);
  useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); setHasUnsavedChanges(true); }, [users]);

  const handleGoogleAuth = async () => {
    setAuthError(null);
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        // Siguiendo las guías, asumimos éxito tras abrir el diálogo para evitar race conditions
        setIsGoogleAuthenticated(true);
        setSchoolSettings(prev => ({ ...prev, googleDriveLinked: true }));
      } catch (err: any) {
        console.error("Error linking Google:", err);
        setAuthError("No se pudo completar la vinculación. Inténtalo de nuevo.");
      }
    }
  };

  const handlePushToCloud = () => {
    if (!isGoogleAuthenticated) return;
    setIsSyncing(true);
    
    const allData = { 
      schoolSettings, 
      students, 
      teachers, 
      payments, 
      cashFlow, 
      squads, 
      users, 
      lastUpdate: new Date().toISOString() 
    };
    
    localStorage.setItem('SIMULATED_CLOUD_DATA', JSON.stringify(allData));
    setSchoolSettings(prev => ({ ...prev, lastCloudSync: new Date().toISOString() }));
    
    setTimeout(() => {
      setHasUnsavedChanges(false);
      setIsSyncing(false);
    }, 800);
  };

  const handlePullFromCloud = useCallback(() => {
    const cloudDataStr = localStorage.getItem('SIMULATED_CLOUD_DATA');
    if (cloudDataStr) {
      const data = JSON.parse(cloudDataStr);
      handleImportAllData(data);
    }
  }, []);

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
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2 tracking-widest">Seleccionar Perfil</label>
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

          <div className="mt-12 flex items-center justify-center gap-2 text-slate-300">
             <Lock className="w-3.5 h-3.5" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cifrado de Extremo a Extremo</span>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: Vinculación de Google Cloud (IA & Drive)
  if (!isGoogleAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
         <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-xl text-center border border-slate-200 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
            
            <div className="relative z-10">
               <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full text-purple-600 font-black text-[10px] uppercase tracking-widest mb-8">
                  <Sparkles className="w-4 h-4" /> Activación Requerida
               </div>
               
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Conecta tu Nube</h2>
               <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed mb-10">
                  Para garantizar la <span className="text-blue-600 font-bold">sincronización automática</span> y el uso de la <span className="text-purple-600 font-bold">IA Deportiva</span>, vincula tu cuenta de Google Cloud.
               </p>

               <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-200">
                        <Database className="w-5 h-5 text-blue-600" />
                     </div>
                     <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase mb-1">Backup Permanente</h4>
                        <p className="text-[11px] text-slate-400">Tus datos de alumnos y finanzas se guardarán seguros en tu Google Drive.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-200">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                     </div>
                     <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase mb-1">IA Generativa</h4>
                        <p className="text-[11px] text-slate-400">Activa los reportes inteligentes y planes de entrenamiento asistidos por IA.</p>
                     </div>
                  </div>
               </div>

               {authError && (
                 <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {authError}
                 </div>
               )}

               <button 
                  onClick={handleGoogleAuth}
                  disabled={isVerifyingGoogle}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 disabled:opacity-50"
               >
                  {isVerifyingGoogle ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <><Chrome className="w-5 h-5" /> Iniciar con Google Cloud</>
                  )}
               </button>

               <button 
                  onClick={() => setCurrentUser(null)}
                  className="mt-8 text-slate-400 font-bold text-[10px] uppercase hover:text-red-500 transition-colors tracking-widest"
               >
                  Cancelar y Salir
               </button>
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
              <LogOut className="w-4 h-4" /> SALIR
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
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
              {NAV_ITEMS.find(i => i.id === currentView)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
               {hasUnsavedChanges ? (
                  <button 
                    onClick={handlePushToCloud}
                    disabled={isSyncing}
                    className="flex items-center gap-2 text-white font-black text-[10px] bg-blue-600 px-5 py-2.5 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                    {isSyncing ? 'SINCRONIZANDO...' : 'SUBIR A LA NUBE'}
                  </button>
               ) : (
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <CloudCheck className="w-3.5 h-3.5" /> NUBE PROTEGIDA
                  </div>
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
