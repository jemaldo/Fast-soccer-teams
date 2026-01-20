
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
  Loader2,
  ArrowRight,
  HardDrive,
  CheckCircle2,
  Lock,
  User as UserIcon,
  ShieldQuestion,
  KeyRound,
  ChevronLeft,
  XCircle,
  LogOut,
  RefreshCw
} from 'lucide-react';

const CLOUD_API_BASE = `https://kvdb.io/6U3pP2Z6zY7k8m9n1q2w3e/`; 

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginStep, setLoginStep] = useState<'SELECT' | 'PASSWORD' | 'RECOVERY'>('SELECT');
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    name: 'Academia Deportiva',
    nit: '900.000.000-1',
    address: 'Sede Principal',
    phone: '000-0000',
    email: 'admin@academia.com',
    slogan: 'Formando campeones para la vida',
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
  const [users, setUsers] = useState<User[]>([
    { id: '1', username: 'admin', role: 'ADMIN', password: '123', secretQuestion: 'Color favorito', secretAnswer: 'azul' }
  ]);

  const handleImportAllData = useCallback((data: any) => {
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
        cloudProjectKey: prev.cloudProjectKey || data.schoolSettings.cloudProjectKey,
        lastSyncTimestamp: data.lastGlobalUpdate || prev.lastSyncTimestamp
      }));
    }
  }, []);

  const syncWithCloud = useCallback(async (push = false, forceKey?: string) => {
    const key = forceKey || schoolSettings.cloudProjectKey;
    if (!navigator.onLine || !key) return;
    setIsSyncing(true);
    const CLOUD_URL = `${CLOUD_API_BASE}${key}`;
    try {
      if (push) {
        const allData = { 
          schoolSettings, students, teachers, payments, cashFlow, squads, users,
          lastGlobalUpdate: new Date().toISOString()
        };
        await fetch(CLOUD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(allData)
        });
        setSchoolSettings(prev => ({ ...prev, lastSyncTimestamp: allData.lastGlobalUpdate }));
      } else {
        const response = await fetch(CLOUD_URL);
        if (response.ok) {
          const cloudData = await response.json();
          if (cloudData.lastGlobalUpdate !== schoolSettings.lastSyncTimestamp) {
            handleImportAllData(cloudData);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  }, [schoolSettings, students, teachers, payments, cashFlow, squads, users, handleImportAllData]);

  const handleCloudActivation = useCallback(async (newKey: string) => {
    setSchoolSettings(prev => ({ ...prev, cloudProjectKey: newKey }));
    setTimeout(() => syncWithCloud(true, newKey), 500);
  }, [syncWithCloud]);

  const forceAdminReset = useCallback(async () => {
    const defaultAdmin: User = { id: '1', username: 'admin', role: 'ADMIN', password: '123', secretQuestion: 'Color favorito', secretAnswer: 'azul' };
    setUsers(prev => {
      const hasAdmin = prev.some(u => u.username === 'admin');
      if (!hasAdmin) return [...prev, defaultAdmin];
      return prev.map(u => u.username === 'admin' ? { ...u, password: '123', secretAnswer: 'azul' } : u);
    });
    alert("🔐 Reset Maestro Ejecutado.");
  }, []);

  useEffect(() => {
    const loadLocalData = async () => {
      try {
        await db.init();
        const [sSettings, sStudents, sTeachers, sPayments, sCash, sSquads, sUsers] = await Promise.all([
          db.getAll('schoolSettings'), db.getAll('students'), db.getAll('teachers'),
          db.getAll('payments'), db.getAll('cashFlow'), db.getAll('squads'), db.getAll('users')
        ]);
        if (sSettings) setSchoolSettings(prev => ({ ...prev, ...sSettings }));
        if (sStudents.length) setStudents(sStudents);
        if (sTeachers.length) setTeachers(sTeachers);
        if (sPayments.length) setPayments(sPayments);
        if (sCash.length) setCashFlow(sCash);
        if (sSquads.length) setSquads(sSquads);
        if (sUsers && sUsers.length) { setUsers(sUsers); } else {
          const defaultAdmin: User = { id: '1', username: 'admin', role: 'ADMIN', password: '123', secretQuestion: 'Color favorito', secretAnswer: 'azul' };
          setUsers([defaultAdmin]);
          await db.save('users', [defaultAdmin]);
        }
        setIsDataLoaded(true);
      } catch (e) { setIsDataLoaded(true); }
    };
    loadLocalData();
  }, []);

  const triggerSave = useCallback(async (store: string, data: any) => {
    if (!isDataLoaded) return;
    await db.save(store, data);
    setLastSavedTime(new Date().toLocaleTimeString());
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 1500);
  }, [isDataLoaded]);

  useEffect(() => { if (isDataLoaded) triggerSave('schoolSettings', schoolSettings); }, [schoolSettings, triggerSave, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) triggerSave('students', students); }, [students, triggerSave, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) triggerSave('teachers', teachers); }, [teachers, triggerSave, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) triggerSave('payments', payments); }, [payments, triggerSave, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) triggerSave('cashFlow', cashFlow); }, [cashFlow, triggerSave, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) triggerSave('squads', squads); }, [squads, triggerSave, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) triggerSave('users', users); }, [users, triggerSave, isDataLoaded]);

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (tempUser && passwordInput === tempUser.password) {
      setCurrentUser(tempUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } else { setAuthError('Contraseña incorrecta'); }
  };

  if (!isDataLoaded) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-inter">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center relative overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>
          <div className="mb-8"><Trophy className="w-16 h-16 text-blue-600 mx-auto mb-4" /><h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{schoolSettings.name}</h1><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Portal de Acceso Seguro</p></div>
          {loginStep === 'SELECT' && (
            <div className="space-y-3">
              {users.map(user => (
                <button key={user.id} onClick={() => { setTempUser(user); setLoginStep('PASSWORD'); setAuthError(null); setPasswordInput(''); }} className="w-full flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] hover:bg-blue-50 hover:border-blue-400 transition-all group active:scale-95">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><UserIcon className="w-5 h-5" /></div><div className="text-left"><span className="font-black text-slate-800 uppercase text-xs block">{user.username}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</span></div></div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition" />
                </button>
              ))}
              <button onClick={forceAdminReset} className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-blue-400 transition-colors flex items-center justify-center gap-2 mx-auto"><RefreshCw className="w-3 h-3" /> Resetear Admin (Modo Rescate)</button>
            </div>
          )}
          {loginStep === 'PASSWORD' && tempUser && (
            <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100"><div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black">{tempUser.username.charAt(0).toUpperCase()}</div><div className="text-left flex-1"><p className="text-xs font-black uppercase text-slate-900">{tempUser.username}</p><button type="button" onClick={() => setLoginStep('SELECT')} className="text-[10px] font-bold text-blue-600 hover:underline">Cambiar usuario</button></div></div>
              <div className="space-y-1"><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="password" placeholder="Contraseña..." autoFocus className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${authError ? 'border-red-500' : 'border-slate-200'} rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500`} value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} /></div>{authError && <p className="text-red-500 text-[10px] font-bold text-left px-2 uppercase tracking-widest flex items-center gap-1 mt-2"><XCircle className="w-3 h-3" /> {authError}</p>}</div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-200 active:scale-95">Ingresar</button>
            </form>
          )}
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
          <div className="pt-4 mt-4 border-t border-slate-800">
             <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-white/5 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-black uppercase">{currentUser?.username.charAt(0)}</div>
                <div className="flex-1 truncate"><p className="text-xs font-black uppercase text-white truncate">{currentUser?.username}</p><p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{currentUser?.role}</p></div>
             </div>
             <button onClick={() => { setIsAuthenticated(false); setTempUser(null); setLoginStep('SELECT'); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"><LogOut className="w-4 h-4" /> Salir</button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-slate-600"><Menu /></button><h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{NAV_ITEMS.find(i => i.id === currentView)?.label}</h2></div>
          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 text-[10px] font-black uppercase px-4 py-2 rounded-full border transition-all ${showSaveConfirm ? 'bg-emerald-600 text-white border-emerald-500 scale-105 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                {showSaveConfirm ? <CheckCircle2 className="w-3.5 h-3.5" /> : <HardDrive className="w-3.5 h-3.5 opacity-40" />}{showSaveConfirm ? 'GUARDADO' : `Local: ${lastSavedTime || '---'}`}
             </div>
          </div>
        </header>
        <section className="flex-1 overflow-y-auto p-4 md:p-8">
            {currentView === 'DASHBOARD' && <Dashboard schoolSettings={schoolSettings} students={students} teachers={teachers} payments={payments} cashFlow={cashFlow} />}
            {currentView === 'STUDENTS' && <StudentManager students={students} setStudents={setStudents} payments={payments} setPayments={setPayments} schoolSettings={schoolSettings} teachers={teachers} />}
            {currentView === 'TEACHERS' && <TeacherManager teachers={teachers} setTeachers={setTeachers} payments={payments} setPayments={setPayments} schoolSettings={schoolSettings} cashFlow={cashFlow} setCashFlow={setCashFlow} />}
            {currentView === 'FINANCE' && <FinanceManager cashFlow={cashFlow} setCashFlow={setCashFlow} payments={payments} schoolSettings={schoolSettings} />}
            {currentView === 'MATCHES' && <MatchManager squads={squads} setSquads={setSquads} students={students} schoolSettings={schoolSettings} />}
            {currentView === 'TRAINING' && <TrainingManager schoolSettings={schoolSettings} />}
            {currentView === 'REPORTS' && <ReportManager students={students} teachers={teachers} payments={payments} cashFlow={cashFlow} schoolSettings={schoolSettings} />}
            {currentView === 'USERS' && <UserSettings users={users} setUsers={setUsers} currentUser={currentUser} schoolSettings={schoolSettings} setSchoolSettings={setSchoolSettings} allData={{ schoolSettings, students, teachers, payments, cashFlow, squads, users }} onImportData={handleImportAllData} onSyncPush={() => syncWithCloud(true)} onActivateCloud={handleCloudActivation} />}
        </section>
      </main>
    </div>
  );
};
export default App;
