
import React, { useState } from 'react';
import { MatchSquad, Student, SquadPlayer, SchoolSettings } from '../types';
import { 
  Trophy, 
  Calendar, 
  Plus, 
  Trash2, 
  MapPin, 
  Clock, 
  Shirt, 
  Medal, 
  Users, 
  ChevronRight, 
  X,
  Target,
  Info
} from 'lucide-react';

interface Props {
  squads: MatchSquad[];
  setSquads: React.Dispatch<React.SetStateAction<MatchSquad[]>>;
  students: Student[];
  schoolSettings: SchoolSettings;
}

const MatchManager: React.FC<Props> = ({ squads, setSquads, students, schoolSettings }) => {
  const [showSquadForm, setShowSquadForm] = useState(false);
  const [currentSquad, setCurrentSquad] = useState<Partial<MatchSquad>>({
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    location: '',
    opponent: '',
    category: schoolSettings.categories[0],
    tournamentType: 'Amistoso',
    uniform: 'Titular (Oficial)',
    players: []
  });

  const handleAddPlayer = (student: Student) => {
    if (currentSquad.players?.find(p => p.studentId === student.id)) return;
    const newPlayer: SquadPlayer = {
      studentId: student.id,
      name: student.fullName,
      position: student.position,
      isStarter: (currentSquad.players?.length || 0) < 11
    };
    setCurrentSquad({ ...currentSquad, players: [...(currentSquad.players || []), newPlayer] });
  };

  const handleToggleStarter = (id: string) => {
    setCurrentSquad({
      ...currentSquad,
      players: currentSquad.players?.map(p => p.studentId === id ? { ...p, isStarter: !p.isStarter } : p)
    });
  };

  const handleRemovePlayer = (id: string) => {
    setCurrentSquad({
      ...currentSquad,
      players: currentSquad.players?.filter(p => p.studentId !== id)
    });
  };

  const handleSaveSquad = () => {
    if (!currentSquad.opponent || !currentSquad.date || !currentSquad.location) {
      alert("Por favor completa los campos obligatorios: Rival, Fecha y Lugar.");
      return;
    }
    const finalSquad: MatchSquad = {
      ...currentSquad as MatchSquad,
      id: Date.now().toString(),
    };
    setSquads([...squads, finalSquad]);
    setShowSquadForm(false);
    setCurrentSquad({ 
      date: new Date().toISOString().split('T')[0], 
      time: '08:00',
      category: schoolSettings.categories[0], 
      players: [],
      tournamentType: 'Amistoso',
      uniform: 'Titular (Oficial)'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-500 p-4 rounded-2xl shadow-lg shadow-yellow-200">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Calendario de Encuentros</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestión de Convocatorias y Alineaciones</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSquadForm(true)} 
          className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Crear Convocatoria
        </button>
      </div>

      {/* GRID DE CONVOCATORIAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {squads.map(squad => (
          <div key={squad.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-300 transition-all duration-300 flex flex-col">
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest bg-blue-600 px-3 py-1.5 rounded-full border border-blue-500/50">{squad.category}</span>
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{squad.tournamentType}</span>
              </div>
              <h4 className="text-2xl font-black truncate relative z-10 uppercase tracking-tighter">vs {squad.opponent}</h4>
              <div className="mt-4 flex flex-wrap gap-4 text-slate-400 relative z-10">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold"><Calendar className="w-3.5 h-3.5" /> {squad.date}</div>
                 <div className="flex items-center gap-1.5 text-[10px] font-bold"><Clock className="w-3.5 h-3.5" /> {squad.time}</div>
              </div>
            </div>
            
            <div className="p-8 flex-1 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                 <div className="truncate">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lugar del Encuentro</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{squad.location}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <Shirt className="w-5 h-5 text-purple-500 shrink-0" />
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Uniforme Requerido</p>
                    <p className="text-xs font-bold text-slate-800">{squad.uniform}</p>
                 </div>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="flex -space-x-3 overflow-hidden">
                  {squad.players.slice(0, 5).map((p, idx) => (
                    <div key={idx} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 border border-blue-200">
                      {p.name.charAt(0)}
                    </div>
                  ))}
                  {squad.players.length > 5 && (
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                      +{squad.players.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{squad.players.length} Convocados</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex gap-2">
              <button onClick={() => setSquads(squads.filter(s => s.id !== squad.id))} className="flex-1 text-red-500 hover:bg-red-50 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition">
                Eliminar Registro
              </button>
            </div>
          </div>
        ))}
        {squads.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
             <Trophy className="w-16 h-16 text-slate-100 mx-auto mb-4" />
             <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">No hay convocatorias programadas</p>
          </div>
        )}
      </div>

      {/* MODAL DE CREACIÓN */}
      {showSquadForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg"><Plus className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Nueva Planilla de Convocatoria</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Planificación de Match Day</p>
                </div>
              </div>
              <button onClick={() => setShowSquadForm(false)} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* PANEL IZQUIERDO: DETALLES */}
              <div className="w-full lg:w-[400px] border-r border-slate-100 p-8 overflow-y-auto space-y-8 bg-slate-50/50">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2"><Info className="w-3.5 h-3.5" /> Detalles del Encuentro</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Equipo Rival *</label>
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Ej: CD Estrella Roja"
                        onChange={(e) => setCurrentSquad({ ...currentSquad, opponent: e.target.value })} 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Lugar / Cancha *</label>
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Dirección o nombre de cancha"
                        onChange={(e) => setCurrentSquad({ ...currentSquad, location: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Fecha</label>
                      <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" onChange={(e) => setCurrentSquad({ ...currentSquad, date: e.target.value })} value={currentSquad.date} />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Hora</label>
                      <input type="time" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" onChange={(e) => setCurrentSquad({ ...currentSquad, time: e.target.value })} value={currentSquad.time} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Categoría convocada</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" onChange={(e) => setCurrentSquad({ ...currentSquad, category: e.target.value })}>
                        {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Tipo de Torneo</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" onChange={(e) => setCurrentSquad({ ...currentSquad, tournamentType: e.target.value })}>
                        <option value="Amistoso">Amistoso</option>
                        <option value="Torneo Local">Torneo Local</option>
                        <option value="Liga Departamental">Liga Departamental</option>
                        <option value="Final">Final de Copa</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Uniforme sugerido</label>
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" 
                        placeholder="Ej: Camiseta Roja, Pantaloneta Negra"
                        onChange={(e) => setCurrentSquad({ ...currentSquad, uniform: e.target.value })} 
                        defaultValue={currentSquad.uniform}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Alumnos Disponibles</h4>
                  <div className="space-y-2">
                    {students.filter(s => s.category === currentSquad.category).map(s => (
                      <button key={s.id} onClick={() => handleAddPlayer(s)} className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center group hover:border-blue-400 transition-all active:scale-95">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase text-slate-700">{s.fullName}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.position}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-500 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* PANEL CENTRAL: ALINEACIÓN */}
              <div className="flex-1 p-10 bg-white overflow-y-auto">
                 <div className="max-w-3xl mx-auto space-y-10">
                    <div className="text-center space-y-2">
                       <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Planilla de Alineación</h2>
                       <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Encuentro vs {currentSquad.opponent || '---'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {currentSquad.players?.map((p, idx) => (
                         <div key={p.studentId} className="bg-slate-50 px-5 py-4 rounded-[1.5rem] border border-slate-100 flex justify-between items-center group shadow-sm">
                           <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black">{idx + 1}</span>
                              <div className="flex flex-col">
                                <span className="font-black text-xs uppercase text-slate-800">{p.name}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{p.position}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleToggleStarter(p.studentId)} 
                                className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest transition-all ${p.isStarter ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}
                              >
                                {p.isStarter ? 'Titular' : 'Suplente'}
                              </button>
                              <button onClick={() => handleRemovePlayer(p.studentId)} className="p-2 text-slate-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                           </div>
                         </div>
                       ))}
                       {currentSquad.players?.length === 0 && (
                         <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-50 rounded-[3rem] flex flex-col items-center gap-4">
                            <Target className="w-12 h-12 text-slate-100" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Selecciona jugadores del panel lateral para convocarlos</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            </div>

            <div className="p-8 border-t bg-slate-50 flex justify-end gap-4 shadow-inner">
              <button onClick={() => setShowSquadForm(false)} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition">Cancelar</button>
              <button 
                onClick={handleSaveSquad} 
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 transition active:scale-95"
              >
                Publicar Convocatoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MatchManager;
