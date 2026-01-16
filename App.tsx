
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
  Globe,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

const APP_VERSION = "V3.0-Lite-Sync";
const CLOUD_API_BASE = 'https://kvdb.io/A9S6J7uY2n9u2n9u2n9u2n/';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [remoteUpdateAvailable, setRemoteUpdateAvailable] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

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

  const syncWithCloud = useCallback(async (push = false, forceKey?: string) => {
    const key = forceKey || schoolSettings.cloudProjectKey;
    if (!navigator.onLine) { setSyncError("Sin internet"); return; }
    if (!key) return;
    
    setIsSyncing(true);
    setSyncError(null);
    const CLOUD_URL = `${CLOUD_API_BASE}${key}`;
    
    try {
      if (push) {
        const liteStudents = students.map(({ photo, ...rest }) => rest);
        const liteTeachers = teachers.map(({ photo, resumeUrl, ...rest }) => rest);

        const allData = { 
          schoolSettings, 
          students: liteStudents, 
          teachers: liteTeachers, 
          payments, 
          cashFlow, 
          squads, 
          users,
          lastGlobalUpdate: new Date().toISOString()
        };

        const response = await fetch(CLOUD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(allData)
        });

        if (!response.ok) throw new Error("Servidor lleno o error de red");
        
        setHasUnsavedChanges(false);
        setSchoolSettings(prev => ({ ...prev, lastSyncTimestamp: allData.lastGlobalUpdate }));
        alert("✅ NUBE ACTUALIZADA.");
      } else {
        const response = await fetch(CLOUD_URL);
        if (response.ok) {
          const cloudData = await response.json();
          if (cloudData.lastGlobalUpdate !== schoolSettings.lastSyncTimestamp) {
            if (forceKey) {
              handleImportAllData(cloudData);
            } else {
              setRemoteUpdateAvailable(true);
            }
          }
        }
      }
    } catch (e: any) {
      setSyncError("Fallo de conexión");
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, [schoolSettings, students, teachers, payments, cashFlow, squads, users]);

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

  const triggerSave = useCallback(async (store: string, data: any) => {
    if (!isDataLoaded) return;
    await db.save(store, data);
    if (store !== 'schoolSettings') setHasUnsavedChanges(true);
  }, [isDataLoaded]);

  useEffect(() => { triggerSave('schoolSettings', schoolSettings); }, [schoolSettings, triggerSave]);
  useEffect(() => { triggerSave('students', students); }, [students, triggerSave]);
  useEffect(() => { triggerSave('teachers', teachers); }, [teachers, triggerSave]);
  useEffect(() => { triggerSave('payments', payments); }, [payments, triggerSave]);
  useEffect(() => { triggerSave('cashFlow', cashFlow); }, [cashFlow, triggerSave]);
  useEffect(() => { triggerSave('squads', squads); }, [squads, triggerSave]);

  const handleImportAllData = (data: any) => {
    if (!data) return;
    if (data.students) {
      setStudents(prev => {
        return data.students.map((newS: Student) => {
          const localS = prev.find(ls => ls.id === newS.id);
          return { ...newS, photo: localS?.photo || newS.photo };
        });
      });
    }
    if (data.teachers) setTeachers(data.teachers);
    if (data.payments) setPayments(data.payments);
    if (data.cashFlow) setCashFlow(data.cashFlow);
    if (data.squads) setSquads(data.squads);
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
    } catch (e) {
      alert("Error al descargar.");
    } finally {
      setIsSyncing(false);
    }
  };

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
          {schoolSettings.logo ? (
             <img src={schoolSettings.logo} className="w-20 h-20 object-contain mx-auto mb-6" />
          ) : (
             <Trophy className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          )}
          <h1 className="text-2xl font-black mb-1 text-slate-900 uppercase tracking-tighter">{schoolSettings.name}</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">{APP_VERSION}</p>
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
          <div className="flex items-center gap-3 mb-10">
            {schoolSettings.logo ? <img src={schoolSettings.logo} className="w-8 h-8 object-contain bg-white rounded-lg p-1" /> : <Trophy className="w-6 h-6 text-blue-500" />}
            <h1 className="font-black uppercase truncate text-sm tracking-tighter">{schoolSettings.name}</h1>
          </div>
          <nav className="space-y-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => setCurrentView(item.id as AppView)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800'}`}>
                {item.icon}<span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-slate-600"><Menu /></button>
            <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight truncate">
              {NAV_ITEMS.find(i => i.id === currentView)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2">
             {schoolSettings.cloudProjectKey && isOnline && (
               <button onClick={() => syncWithCloud(true)} disabled={isSyncing} className={`flex items-center gap-2 font-black text-[9px] px-3 py-2.5 rounded-full transition shadow-lg ${hasUnsavedChanges ? 'bg-blue-600 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                  {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
                  <span>{isSyncing ? '...' : (hasUnsavedChanges ? 'SUBIR' : 'NUBE')}</span>
                </button>
             )}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8">
            {currentView === 'DASHBOARD' && <Dashboard schoolSettings={schoolSettings} students={students} teachers={teachers} payments={payments} cashFlow={cashFlow} />}
            {currentView === 'STUDENTS' && <StudentManager students={students} setStudents={setStudents} payments={payments} setPayments={setPayments} schoolSettings={schoolSettings} teachers={teachers} />}
            {currentView === 'TEACHERS' && <TeacherManager teachers={teachers} setTeachers={setTeachers} payments={payments} setPayments={setPayments} schoolSettings={schoolSettings} />}
            {currentView === 'FINANCE' && <FinanceManager cashFlow={cashFlow} setCashFlow={setCashFlow} schoolSettings={schoolSettings} />}
            {currentView === 'MATCHES' && <MatchManager squads={squads} setSquads={setSquads} students={students} schoolSettings={schoolSettings} />}
            {currentView === 'TRAINING' && <TrainingManager />}
            {currentView === 'REPORTS' && <ReportManager students={students} teachers={teachers} payments={payments} cashFlow={cashFlow} schoolSettings={schoolSettings} />}
            {currentView === 'USERS' && <UserSettings users={users} setUsers={setUsers} currentUser={currentUser} schoolSettings={schoolSettings} setSchoolSettings={setSchoolSettings} allData={{ schoolSettings, students, teachers, payments, cashFlow, squads, users }} onImportData={handleImportAllData} />}
        </section>
      </main>
    </div>
  );
};

export default App;
