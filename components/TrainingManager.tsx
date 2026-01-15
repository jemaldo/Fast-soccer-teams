
import React, { useState } from 'react';
import { generateTrainingProgram } from '../services/geminiService';
import { CATEGORIES } from '../constants';
import { ClipboardList, Sparkles, Loader2, Calendar, Clock, Target, AlertTriangle } from 'lucide-react';

const TrainingManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState('Resistencia física y control de balón');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [program, setProgram] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateTrainingProgram(category, focus);
      setProgram(result);
    } catch (err: any) {
      console.error(err);
      setError("No se pudo generar el entrenamiento. Verifique su conexión o llave de IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold uppercase tracking-tighter">Entrenador IA Pro</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Categoría</label>
            <select 
              className="w-full border rounded-xl px-4 py-2 bg-slate-50 font-bold text-sm outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Enfoque Técnico</label>
            <input 
              type="text"
              className="w-full border rounded-xl px-4 py-2 bg-slate-50 font-bold text-sm outline-none"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Ej: Defensa táctica..."
            />
          </div>
        </div>
        
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="mt-6 w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generar Plan con IA
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-xs font-bold border border-red-100 animate-pulse">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {program && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest">Plan Sugerido</h4>
          <div className="grid grid-cols-1 gap-4">
            {program.sessions.map((session: any, idx: number) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col md:flex-row">
                <div className="bg-blue-600 text-white p-6 md:w-40 flex flex-col justify-center items-center text-center shrink-0">
                  <span className="text-lg font-black uppercase">{session.day}</span>
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-bold opacity-80 uppercase">
                    <Clock className="w-3 h-3" /> {session.duration}
                  </div>
                </div>
                <div className="p-6 flex-1">
                  <h5 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tighter">
                    <Target className="w-4 h-4 text-blue-500" /> {session.title}
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {session.activities.map((act: string, aIdx: number) => (
                      <div key={aIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0">{aIdx + 1}</div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{act}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingManager;
