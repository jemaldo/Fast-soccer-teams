
import React, { useState } from 'react';
import { MatchSquad, Student, SquadPlayer, SchoolSettings } from '../types';
import { Trophy, Calendar, Plus, Trash2 } from 'lucide-react';

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
    category: schoolSettings.categories[0],
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

  const handleSaveSquad = () => {
    if (!currentSquad.opponent || !currentSquad.date) {
      alert("Faltan datos obligatorios");
      return;
    }
    const finalSquad: MatchSquad = {
      ...currentSquad as MatchSquad,
      id: Date.now().toString(),
    };
    setSquads([...squads, finalSquad]);
    setShowSquadForm(false);
    setCurrentSquad({ date: new Date().toISOString().split('T')[0], category: schoolSettings.categories[0], players: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Próximos Partidos</h3>
        <button onClick={() => setShowSquadForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2"><Plus className="w-4 h-4" /> Crear Convocatoria</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {squads.map(squad => (
          <div key={squad.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-4 text-white">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-black uppercase tracking-widest bg-blue-600 px-2 py-0.5 rounded">{squad.category}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {squad.date}</span>
              </div>
              <h4 className="text-xl font-bold truncate">vs {squad.opponent}</h4>
            </div>
            <div className="p-4 bg-slate-50 border-t flex gap-2">
              <button onClick={() => setSquads(squads.filter(s => s.id !== squad.id))} className="flex-1 text-red-500 hover:bg-red-50 py-2 rounded-lg font-bold text-xs uppercase transition">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
      {showSquadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg">Nueva Convocatoria</h3>
              <button onClick={() => setShowSquadForm(false)}>Cerrar</button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-1/3 p-4 border-r overflow-y-auto space-y-4">
                <div><label className="block text-xs font-black uppercase text-slate-400 mb-1">Rival</label><input className="w-full border rounded-lg px-3 py-2" onChange={(e) => setCurrentSquad({ ...currentSquad, opponent: e.target.value })} /></div>
                <div><label className="block text-xs font-black uppercase text-slate-400 mb-1">Categoría</label>
                  <select className="w-full border rounded-lg px-3 py-2" onChange={(e) => setCurrentSquad({ ...currentSquad, category: e.target.value })}>
                    {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-bold text-sm mb-2 uppercase text-slate-400 tracking-widest">Alumnos</h4>
                  {students.filter(s => s.category === currentSquad.category).map(s => (
                    <button key={s.id} onClick={() => handleAddPlayer(s)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded flex justify-between items-center group">
                      <span>{s.fullName}</span><span className="text-xs text-slate-400">{s.position}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 p-6 bg-slate-50 overflow-y-auto">
                 <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-xl font-black uppercase mb-4">Alineación vs {currentSquad.opponent || '---'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                       {currentSquad.players?.map(p => (
                         <div key={p.studentId} className="bg-slate-50 px-3 py-2 rounded border border-slate-100 flex justify-between items-center">
                           <span className="font-bold text-sm">{p.name} <span className="text-slate-400 font-normal">({p.position})</span></span>
                           <button onClick={() => handleToggleStarter(p.studentId)} className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest ${p.isStarter ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{p.isStarter ? 'Titular' : 'Suplente'}</button>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
            <div className="p-4 border-t bg-white flex justify-end gap-3"><button onClick={handleSaveSquad} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Finalizar Planilla</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MatchManager;
