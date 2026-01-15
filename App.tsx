
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
import { NAV_ITEMS, CATEGORIES, POSITIONS } from './constants';
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
  Menu, 
  Trophy, 
  CloudCheck, 
  CloudUpload, 
  Loader2,
  ArrowRight,
  HardDrive,
  CheckCircle2,
  Zap,
  Globe
} from 'lucide-react';

// URL de la base de datos remota para sincronización (Bucket único para Fastsystems)
const CLOUD_API_BASE = 'https://kvdb.io/A9S6J7uY2n9u2n9u2n9u2n/';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [remoteUpdateAvailable, setRemoteUpdateAvailable] = useState(false);

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    name: 'Academia Deportiva',
    nit: '900.000.000-1',
    address: 'Sede Principal',
    phone: '000-0000',
    email: 'admin@academia.com',
    googleDriveLinked: false,
    categories: CATEGORIES,
    positions: POSITIONS,
    linkedEmail: '',
    cloudProjectKey: ''
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashFlow, setCashFlow] = useState<CashTransaction[]>([]);
  const [squads, setSquads] = useState<MatchSquad[]>([]);
  const [users, setUsers] = useState<User[]>([{ id: '1', username: 'admin', role: 'ADMIN' }]);

  // Función para Sincronización Remota REAL (Internet)
  const syncWithCloud = useCallback(async (push = false, forceKey?: string) => {
    const key = forceKey || schoolSettings.cloudProjectKey;
    if (!navigator.onLine || !key) return;
    
    setIsSyncing(true);
    const CLOUD_URL = `${CLOUD_API_BASE}${key}`;
    
    try {
      if (push) {
        // ENVIAR DATOS A LA NUBE
        const allData = { 
          schoolSettings, students, teachers, payments, cashFlow, squads, users,
          lastGlobalUpdate: new Date().toISOString()
        };
        await fetch(CLOUD_URL, {
          method: 'POST',
          body: JSON.stringify(allData)
        });
        setHasUnsavedChanges(false);
        setSchoolSettings(prev => ({ ...prev, lastSyncTimestamp: allData.lastGlobalUpdate }));
      } else {
        // CONSULTAR DATOS DE LA NUBE
        const response = await fetch(CLOUD_URL);
        if (response.ok) {
          const cloudData = await response.json();
          if (cloudData.lastGlobalUpdate !== schoolSettings.lastSyncTimestamp) {
            // Si venimos de un link de invitación, aplicamos automáticamente
            if (forceKey) {
              handleImportAllData(cloudData);
            } else {
              setRemoteUpdateAvailable(true);
            }
          }
        }
      }
    } catch (e) {
      console.error("Fallo en conexión remota:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, [schoolSettings, students, teachers, payments, cashFlow, squads, users]);

  // Manejo de invitaciones por Link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectKey = params.get('project');
    if (projectKey && isDataLoaded) {
      setSchoolSettings(prev => ({ ...prev, cloudProjectKey: projectKey }));
      window.history.replaceState({}, document.title, window.location.pathname);
      // Forzar descarga inmediata al detectar link nuevo
      syncWithCloud(false, projectKey);
      alert(`🚀 Conectado a la Nube: ${projectKey}. Descargando datos...`);
    }
  }, [isDataLoaded, syncWithCloud]);

  // Ciclo de vida de carga inicial
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        await db.init();
        const [sSettings, sStudents, sTeachers, sPayments, sCash, sSquads, sUsers] = await Promise.all([
          db.getAll('schoolSettings'), db.getAll('students'), db.getAll('teachers'),
          db.getAll('payments'), db.getAll('cashFlow'), db.getAll('squads'), db.getAll('users')
        ]);

        if (sSettings) setSchoolSettings({ ...schoolSettings, ...sSettings });
        if (sStudents.length) setStudents(sStudents);
        if (sTeachers.length) setTeachers(sTeachers);
        if (sPayments.length) setPayments(sPayments);
        if (sCash.length) setCashFlow(sCash);
        if (sSquads.length) setSquads(sSquads);
        if (sUsers.length) setUsers(sUsers);
        setIsDataLoaded(true);
      } catch (e) {
        setIsDataLoaded(true);
      }
    };
    loadLocalData();
  }, []);

  // Guardado Automático Local (IndexedDB)
  const triggerSave = useCallback(async (store: string, data: any) => {
    if (!isDataLoaded) return;
    await db.save(store, data);
    setLastSavedTime(new Date().toLocaleTimeString());
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  }, [isDataLoaded]);

  useEffect(() => { triggerSave('schoolSettings', schoolSettings); }, [schoolSettings, triggerSave]);
  useEffect(() => { triggerSave('students', students); setHasUnsavedChanges(true); }, [students, triggerSave]);
  useEffect(() => { triggerSave('teachers', teachers); setHasUnsavedChanges(true); }, [teachers, triggerSave]);
  useEffect(() => { triggerSave('payments', payments); setHasUnsavedChanges(true); }, [payments, triggerSave]);
  useEffect(() => { triggerSave('cashFlow', cashFlow); setHasUnsavedChanges(true); }, [cashFlow, triggerSave]);
  useEffect(() => { triggerSave('squads', squads); setHasUnsavedChanges(true); }, [squads, triggerSave]);

  const handleImportAllData = (data: any) => {
    if (!data) return;
    if (data.students) setStudents(data.students);
    if (data.teachers) setTeachers(data.teachers);
    if (data.payments) setPayments(data.payments);
    if (data.cashFlow) setCashFlow(data.cashFlow);
    if (data.squads) setSquads(data.squads);
    if (data.users) setUsers(data.users);
    if (data.schoolSettings) {
      setSchoolSettings(prev => ({
        ...prev,
        ...data.schoolSettings,
        lastSyncTimestamp: data.lastGlobalUpdate || prev.lastSyncTimestamp
      }));
    }
    setHasUnsavedChanges(false);
  };

  const applyRemoteUpdate = async () => {
    setIsSyncing(true);
    const CLOUD_URL = `${CLOUD_API_BASE}${schoolSettings.cloudProjectKey}`;
    try {
      const response = await fetch(CLOUD_URL);
      const data = await response.json();
      handleImportAllData(data);
      setRemoteUpdateAvailable(false);
      alert("✅ Datos actualizados desde la nube.");
    } catch (e) {
      alert("Error al descargar actualización.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => syncWithCloud(false), 45000);
    return () => clearInterval(interval);
  }, [syncWithCloud]);

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

  if (!isDataLoaded) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /></div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>
          <Trophy className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl font-black mb-10 text-slate-900 uppercase tracking-tighter">{schoolSettings.name}</h1>
          <div className="space-y-3">
            {users.map(user => (
              <button key={user.id} onClick={() => setCurrentUser(user)} className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-blue-50 hover:border-blue-400 transition-all group">
                <span className="font-bold text-slate-700">{user.username}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition" />
              </button>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-slate-100 opacity-50 text-[10px] font-bold">Fastsystems Jesus Maldonado Castro</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden relative">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10"><Trophy className="w-6 h-6 text-blue-500" /><h1 className="font-black uppercase truncate text-sm tracking-tighter">{schoolSettings.name}</h1></div>
          <nav className="space-y-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => setCurrentView(item.id as AppView)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800'}`}>
                {item.icon}<span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-6 border-t border-slate-800 text-center">
             <div className="bg-white/5 p-4 rounded-2xl mb-4 text-left border border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">PROYECTO NUBE</p>
                <div className="flex items-center gap-2">
                   <Globe className="w-3 h-3 text-blue-400" />
                   <p className="text-[10px] font-bold text-blue-400 truncate">{schoolSettings.cloudProjectKey || 'SIN VINCULAR'}</p>
                </div>
             </div>
             <p className="text-[9px] font-bold text-slate-500 leading-tight">Desarrollo: Fastsystems<br/>Jesus Maldonado Castro</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-slate-600"><Menu /></button>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{NAV_ITEMS.find(i => i.id === currentView)?.label}</h2>
              <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <span className="text-[9px] font-black uppercase text-slate-400">
                    {isOnline ? `En línea: ${schoolSettings.linkedEmail || 'Sin correo vinculado'}` : 'Modo fuera de línea'}
                 </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {remoteUpdateAvailable && (
               <button onClick={applyRemoteUpdate} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase animate-bounce shadow-lg">
                 <Zap className="w-3.5 h-3.5" /> Hay cambios en la nube
               </button>
             )}
             
             <div className="flex items-center gap-2">
               <div className={`flex items-center gap-2 text-[10px] font-black uppercase px-4 py-2 rounded-full border transition-all ${showSaveConfirm ? 'bg-emerald-600 text-white border-emerald-500 scale-105 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                  {showSaveConfirm ? <CheckCircle2 className="w-3.5 h-3.5" /> : <HardDrive className="w-3.5 h-3.5 opacity-40" />}
                  {showSaveConfirm ? 'GUARDADO LOCAL' : `Caja: ${lastSavedTime || '---'}`}
               </div>

               {schoolSettings.cloudProjectKey && isOnline && (
                 <button onClick={() => syncWithCloud(true)} disabled={isSyncing} className={`flex items-center gap-2 font-black text-[10px] px-5 py-2.5 rounded-full transition shadow-lg ${hasUnsavedChanges ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (hasUnsavedChanges ? <CloudUpload className="w-3.5 h-3.5" /> : <CloudCheck className="w-3.5 h-3.5" />)}
                    {isSyncing ? 'CONECTANDO...' : (hasUnsavedChanges ? 'SUBIR A LA NUBE' : 'NUBE AL DÍA')}
                  </button>
               )}
             </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8">
            {currentView === 'DASHBOARD' && <Dashboard schoolSettings={schoolSettings} students={students} teachers={teachers} payments={payments} cashFlow={cashFlow} />}
            {currentView === 'STUDENTS' && <StudentManager students={students} setStudents={setStudents} payments={payments} setPayments={setPayments} schoolSettings={schoolSettings} teachers={teachers} />}
            {currentView === 'TEACHERS' && <TeacherManager teachers={teachers} setTeachers={setTeachers} payments={payments} setPayments={setPayments} schoolSettings={schoolSettings} />}
            {currentView === 'FINANCE' && <FinanceManager cashFlow={cashFlow} setCashFlow={setCashFlow} />}
            {currentView === 'MATCHES' && <MatchManager squads={squads} setSquads={setSquads} students={students} schoolSettings={schoolSettings} />}
            {currentView === 'TRAINING' && <TrainingManager />}
            {currentView === 'REPORTS' && <ReportManager students={students} teachers={teachers} payments={payments} cashFlow={cashFlow} schoolSettings={schoolSettings} />}
            {currentView === 'USERS' && <UserSettings users={users} setUsers={setUsers} currentUser={currentUser} schoolSettings={schoolSettings} setSchoolSettings={setSchoolSettings} allData={{ schoolSettings, students, teachers, payments, cashFlow, squads, users }} onImportData={handleImportAllData} />}
        </section>

        <footer className="mt-auto py-6 border-t border-slate-200 text-center no-print">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">© 2025 Desarrollo: Fastsystems Jesus Maldonado Castro</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
