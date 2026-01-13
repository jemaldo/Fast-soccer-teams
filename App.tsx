
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
import { LogOut, User as UserIcon, Menu, X, Trophy, CloudLightning, RefreshCw, AlertCircle, CloudCheck, CloudUpload, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [cloudUpdateAvailable, setCloudUpdateAvailable] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Carga inicial
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => {
    const saved = localStorage.getItem('schoolSettings');
    return saved ? JSON.parse(saved) : {
      name: 'Pro-Manager Academia',
      nit: '900.123.456-7',
      address: 'Calle Deportiva 123, Ciudad',
      phone: '(+57) 300 123 4567',
      email: 'contacto@promanager.com',
      googleDriveLinked: false,
      linkedEmail: ''
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

  // Persistencia Local
  useEffect(() => { localStorage.setItem('schoolSettings', JSON.stringify(schoolSettings)); }, [schoolSettings]);
  useEffect(() => { localStorage.setItem('students', JSON.stringify(students)); setHasUnsavedChanges(true); }, [students]);
  useEffect(() => { localStorage.setItem('teachers', JSON.stringify(teachers)); setHasUnsavedChanges(true); }, [teachers]);
  useEffect(() => { localStorage.setItem('payments', JSON.stringify(payments)); setHasUnsavedChanges(true); }, [payments]);
  useEffect(() => { localStorage.setItem('cashFlow', JSON.stringify(cashFlow)); setHasUnsavedChanges(true); }, [cashFlow]);
  useEffect(() => { localStorage.setItem('squads', JSON.stringify(squads)); setHasUnsavedChanges(true); }, [squads]);
  useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); setHasUnsavedChanges(true); }, [users]);

  // Sincronización con la Nube (LocalStorage compartido)
  const handlePushToCloud = () => {
    if (!schoolSettings.googleDriveLinked) return;
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
    
    // Guardar en llave global para que otras pestañas lo detecten
    localStorage.setItem('SIMULATED_CLOUD_DATA', JSON.stringify(allData));
    
    setSchoolSettings(prev => ({ ...prev, lastCloudSync: new Date().toISOString() }));
    
    setTimeout(() => {
      setHasUnsavedChanges(false);
      setIsSyncing(false);
      alert("¡Datos guardados en la nube exitosamente!");
    }, 600);
  };

  const handlePullFromCloud = useCallback(() => {
    const cloudDataStr = localStorage.getItem('SIMULATED_CLOUD_DATA');
    if (cloudDataStr) {
      const data = JSON.parse(cloudDataStr);
      handleImportAllData(data);
    }
  }, []);

  // Detectar cambios realizados en otras pestañas al instante
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'SIMULATED_CLOUD_DATA' && e.newValue) {
        const cloudData = JSON.parse(e.newValue);
        const lastSync = new Date(schoolSettings.lastCloudSync || 0).getTime();
        const cloudSync = new Date(cloudData.lastUpdate || 0).getTime();
        
        if (cloudSync > lastSync) {
          setCloudUpdateAvailable({
            timestamp: cloudData.lastUpdate,
            user: 'Sistema'
          });
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [schoolSettings.lastCloudSync]);

  const handleImportAllData = (data: any) => {
    if (!data || typeof data !== 'object') return;
    
    // Importar respetando estados
    if (data.students) setStudents(data.students);
    if (data.teachers) setTeachers(data.teachers);
    if (data.payments) setPayments(data.payments);
    if (data.cashFlow) setCashFlow(data.cashFlow);
    if (data.squads) setSquads(data.squads);
    if (data.users) setUsers(data.users);
    
    // Configuración de escuela con cuidado de no perder la vinculación actual
    if (data.schoolSettings) {
      setSchoolSettings(prev => ({
        ...data.schoolSettings,
        googleDriveLinked: prev.googleDriveLinked, // Mantener mi estado de sesión
        linkedEmail: prev.linkedEmail,
        lastCloudSync: new Date().toISOString()
      }));
    }
    
    setCloudUpdateAvailable(null);
    setHasUnsavedChanges(false);
    alert("¡Aplicación actualizada con los datos de la nube!");
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

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
          {schoolSettings.logo ? (
            <img src={schoolSettings.logo} alt="Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
          ) : (
            <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold mb-6 text-slate-800">{schoolSettings.name}</h1>
          <button 
            onClick={() => setCurrentUser(users[0])}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
          >
            Entrar al Sistema
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden relative">
      {cloudUpdateAvailable && (
        <div className="fixed bottom-6 right-6 z-[100] w-80 bg-slate-900 text-white shadow-2xl rounded-2xl p-5 border border-slate-700 animate-slide-in">
          <div className="flex gap-4">
            <div className="bg-blue-500 p-2 rounded-xl h-fit">
              <CloudLightning className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-blue-400">Hay Cambios</h4>
              <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">Otro navegador o pestaña acaba de subir datos nuevos. ¿Quieres traerlos?</p>
              <div className="flex gap-2">
                <button 
                  onClick={handlePullFromCloud} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-[10px] font-black transition"
                >
                  SÍ, ACTUALIZAR
                </button>
                <button 
                  onClick={() => setCloudUpdateAvailable(null)}
                  className="px-3 py-2 bg-slate-800 text-slate-500 rounded-lg text-[10px] font-bold"
                >
                  IGNORAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            {schoolSettings.logo ? (
              <img src={schoolSettings.logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg bg-white p-1" />
            ) : (
              <div className="bg-blue-600 p-2 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            )}
            <h1 className="text-xl font-bold tracking-tight truncate">{schoolSettings.name.split(' ')[0]}</h1>
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
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-slate-800 p-2 rounded-full">
                <UserIcon className="w-5 h-5 text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{currentUser.username}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black">{currentUser.role}</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentUser(null)}
              className="w-full flex items-center gap-2 text-slate-500 hover:text-red-400 text-xs transition font-bold"
            >
              <LogOut className="w-4 h-4" /> CERRAR SESIÓN
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
              {NAV_ITEMS.find(i => i.id === currentView)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
             {schoolSettings.googleDriveLinked && (
               <div className="flex items-center gap-2">
                 {hasUnsavedChanges ? (
                    <button 
                      onClick={handlePushToCloud}
                      disabled={isSyncing}
                      className="flex items-center gap-2 text-white font-black text-[10px] bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition animate-bounce shadow-lg disabled:opacity-50"
                    >
                      {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
                      {isSyncing ? 'GUARDANDO...' : 'SUBIR CAMBIOS'}
                    </button>
                 ) : (
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                      <CloudCheck className="w-3 h-3" /> NUBE ACTUALIZADA
                    </div>
                 )}
               </div>
             )}
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
