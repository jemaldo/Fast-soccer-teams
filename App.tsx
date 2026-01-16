
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AppView, Student, Teacher, Payment, CashTransaction, MatchSquad, User, SchoolSettings 
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
import { SupabaseService } from './services/supabaseService';
import { Menu, Trophy, CloudUpload, CloudDownload, Loader2, ArrowRight, Wifi, RefreshCw } from 'lucide-react';

const APP_VERSION = "V4.5-Safety-Backup";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    name: 'Academia Deportiva Pro',
    nit: '900.123.456-7',
    address: 'Calle Principal #123',
    phone: '300 000 0000',
    email: 'contacto@academia.com',
    categories: CATEGORIES,
    positions: POSITIONS
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashFlow, setCashFlow] = useState<CashTransaction[]>([]);
  const [squads, setSquads] = useState<MatchSquad[]>([]);
  const [users, setUsers] = useState<User[]>([{ id: '1', username: 'admin', role: 'ADMIN' }]);

  const supabase = useMemo(() => {
    if (schoolSettings.supabaseUrl && schoolSettings.supabaseKey) {
      return new SupabaseService(schoolSettings.supabaseUrl, schoolSettings.supabaseKey);
    }
    return null;
  }, [schoolSettings.supabaseUrl, schoolSettings.supabaseKey]);

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
        if (sUsers.length) setUsers(sUsers.length ? sUsers : [{ id: '1', username: 'admin', role: 'ADMIN' }]);
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
    
    if (supabase && !isSyncing) {
      try {
        if (store === 'students') await Promise.all(data.map((s: any) => supabase.upsertStudent(s)));
        if (store === 'teachers') await Promise.all(data.map((t: any) => supabase.upsertTeacher(t)));
        if (store === 'cashFlow') await Promise.all(data.map((c: any) => supabase.upsertCashFlow(c)));
      } catch (e) {
        console.warn("Sync error:", e);
      }
    }
  }, [isDataLoaded, supabase, isSyncing]);

  useEffect(() => { triggerSave('schoolSettings', schoolSettings); }, [schoolSettings, triggerSave]);
  useEffect(() => { triggerSave('students', students); }, [students, triggerSave]);
  useEffect(() => { triggerSave('teachers', teachers); }, [teachers, triggerSave]);
  useEffect(() => { triggerSave('payments', payments); }, [payments, triggerSave]);
  useEffect(() => { triggerSave('cashFlow', cashFlow); }, [cashFlow, triggerSave]);
  useEffect(() => { triggerSave('squads', squads); }, [squads, triggerSave]);

  const handleDownloadFromCloud = async () => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      const cloudData = await supabase.downloadEverything();
      if (cloudData.students?.length) setStudents(cloudData.students);
      if (cloudData.teachers?.length) setTeachers(cloudData.teachers);
      if (cloudData.cashFlow?.length) setCashFlow(cloudData.cashFlow);
      if (cloudData.payments?.length) setPayments(cloudData.payments);
      alert("✅ Datos descargados de la nube correctamente.");
    } catch (e: any) {
      alert(`❌ Error al descargar: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFullRestore = (data: any) => {
    if (!data) return;
    if (data.schoolSettings) setSchoolSettings(data.schoolSettings);
    if (data.students) setStudents(data.students);
    if (data.teachers) setTeachers(data.teachers);
    if (data.payments) setPayments(data.payments);
    if (data.cashFlow) setCashFlow(data.cashFlow);
    if (data.squads) setSquads(data.squads);
    if (data.users) setUsers(data.users);
    alert("✅ Restauración de seguridad completada con éxito. Todos los módulos han sido actualizados.");
  };

  const handleSeedData = async () => {
    const confirmSeed = confirm("¿Cargar datos de prueba? Esto reemplazará tus datos locales actuales.");
    if (!confirmSeed) return;

    setIsSyncing(true);
    
    const mockTeacher: Teacher = {
      id: 'seed-teacher-1',
      firstName: 'Juan',
      lastName: 'Entrenador',
      category: 'Infantil',
      age: 35,
      bloodType: 'O+',
      address: 'Sede Norte',
      phone: '321 000 1122',
      email: 'juan@pro.com',
      bankAccount: 'Ahorros Bancolombia 123-456',
      entryDate: '2024-01-10'
    };

    const mockStudent: Student = {
      id: 'seed-student-1',
      fullName: 'Carlos Pro Atleta',
      dni: '1098.765.432',
      birthDate: '2015-05-20',
      age: 9,
      bloodType: 'A+',
      lateralidad: 'DIESTRO',
      school: 'Colegio Nacional',
      grade: '4to Primaria',
      weight: 35.5,
      height: 140,
      bmi: 18.1,
      address: 'Barrio El Centro',
      phone: '310 987 6543',
      observations: 'Excelente técnica individual.',
      parents: [{ name: 'Maria Lopez', phone: '311 000 0000', address: 'Madre' }],
      category: 'Infantil',
      position: 'Mediocentro',
      entryDate: '2024-02-01',
      isPaidUp: true,
      teacherId: 'seed-teacher-1',
      trainingType: 'Elite'
    };

    const mockIncome: CashTransaction = {
      id: 'tx-seed-1',
      date: new Date().toISOString().split('T')[0],
      type: 'INCOME',
      amount: 150000,
      description: 'Pago mensualidad Carlos Pro Atleta - Marzo 2024',
      user: 'admin'
    };

    const mockOutcome: CashTransaction = {
      id: 'tx-seed-2',
      date: new Date().toISOString().split('T')[0],
      type: 'OUTCOME',
      amount: 800000,
      description: 'Pago nómina Docente Juan Entrenador (Quincena 1)',
      user: 'admin'
    };

    setTeachers([mockTeacher]);
    setStudents([mockStudent]);
    setCashFlow([mockIncome, mockOutcome]);
    
    if (supabase) {
      try {
        await Promise.all([
          supabase.upsertTeacher(mockTeacher),
          supabase.upsertStudent(mockStudent),
          supabase.upsertCashFlow(mockIncome),
          supabase.upsertCashFlow(mockOutcome)
        ]);
        alert("🚀 ¡Éxito! Datos de prueba generados LOCALMENTE y cargados en la NUBE.");
      } catch (e: any) {
        alert(`⚠️ Datos generados localmente, pero falló la subida a la nube:\n${e.message}`);
      }
    } else {
      alert("💡 Datos generados LOCALMENTE.");
    }
    setIsSyncing(false);
  };

  if (!isDataLoaded) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /></div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center">
          <Trophy className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl font-black mb-1 text-slate-900 uppercase tracking-tighter">{schoolSettings.name}</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">{APP_VERSION}</p>
          <div className="space-y-3">
            {users.map(user => (
              <button key={user.id} onClick={() => setCurrentUser(user)} className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-blue-50 transition-all group">
                <span className="font-bold text-slate-700">{user.username}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition" />
              </button>
            ))}
          </div>
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
              <button key={item.id} onClick={() => setCurrentView(item.id as AppView)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                {item.icon}<span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-slate-600"><Menu /></button>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{NAV_ITEMS.find(i => i.id === currentView)?.label}</h2>
          </div>
          <div className="flex items-center gap-3">
             {supabase && (
               <div className="flex items-center gap-2">
                 <button onClick={handleDownloadFromCloud} disabled={isSyncing} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 transition disabled:opacity-50">
                   {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CloudDownload className="w-3 h-3" />}
                   Sincronizar Nube
                 </button>
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-100">
                   <Wifi className="w-3 h-3" /> Nube Conectada
                 </div>
               </div>
             )}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
            {currentView === 'DASHBOARD' && <Dashboard schoolSettings={schoolSettings} students={students} teachers={teachers} payments={payments} cashFlow={cashFlow} />}
            {currentView === 'STUDENTS' && <StudentManager students={students} setStudents={setStudents} payments={payments} setPayments={setPayments} cashFlow={cashFlow} setCashFlow={setCashFlow} schoolSettings={schoolSettings} teachers={teachers} />}
            {currentView === 'TEACHERS' && <TeacherManager teachers={teachers} setTeachers={setTeachers} payments={payments} setPayments={setPayments} cashFlow={cashFlow} setCashFlow={setCashFlow} schoolSettings={schoolSettings} />}
            {currentView === 'FINANCE' && <FinanceManager cashFlow={cashFlow} setCashFlow={setCashFlow} schoolSettings={schoolSettings} />}
            {currentView === 'MATCHES' && <MatchManager squads={squads} setSquads={setSquads} students={students} schoolSettings={schoolSettings} />}
            {currentView === 'TRAINING' && <TrainingManager />}
            {currentView === 'REPORTS' && <ReportManager students={students} teachers={teachers} payments={payments} cashFlow={cashFlow} schoolSettings={schoolSettings} />}
            {currentView === 'USERS' && <UserSettings users={users} setUsers={setUsers} currentUser={currentUser} schoolSettings={schoolSettings} setSchoolSettings={setSchoolSettings} allData={{ schoolSettings, students, teachers, payments, cashFlow, squads, users }} onImportData={handleFullRestore} onSeedData={handleSeedData} />}
        </section>
      </main>
    </div>
  );
};

export default App;
