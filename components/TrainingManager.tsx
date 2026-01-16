
import React, { useState } from 'react';
import { generateTrainingProgram } from '../services/geminiService';
import { SchoolSettings } from '../types';
import { Sparkles, Loader2, Calendar, Clock, Target } from 'lucide-react';

interface Props {
  schoolSettings: SchoolSettings;
}

const TrainingManager: React.FC<Props> = ({ schoolSettings }) => {
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState('Resistencia física y control de balón');
  const [category, setCategory] = useState(schoolSettings.categories[0]);
  const [program, setProgram] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateTrainingProgram(category, focus);
      setProgram(result);
    } catch (error) {
      alert("Error al generar el programa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold">Generador de Entrenamientos (IA)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Categoría Objetivo</label>
            <select className="w-full border rounded-lg px-4 py-2 bg-slate-50 outline-none" value={category} onChange={(e) => setCategory(e.target.value)}>
              {schoolSettings.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Enfoque Principal</label>
            <input type="text" className="w-full border rounded-lg px-4 py-2 bg-slate-50 outline-none" value={focus} onChange={(e) => setFocus(e.target.value)} />
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="mt-6 w-full md:w-auto bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Generar Plan IA
        </button>
      </div>
      {program && (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-500">
          {program.sessions.map((session: any, idx: number) => (
            <div key={idx} className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
              <div className="bg-blue-600 text-white p-6 md:w-48 flex flex-col justify-center items-center text-center">
                <span className="text-lg font-black uppercase">{session.day}</span>
                <span className="text-xs opacity-80">{session.duration}</span>
              </div>
              <div className="p-6 flex-1">
                <h5 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-blue-500" /> {session.title}</h5>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {session.activities.map((act: string, aIdx: number) => (
                    <li key={aIdx} className="bg-slate-50 p-2 rounded text-sm text-slate-700 border-l-4 border-blue-500">{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default TrainingManager;
