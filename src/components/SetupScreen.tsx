import React, { useState, useEffect } from 'react';
import { SetupFormState } from './types';
import { Sidebar } from './Sidebar';
import { QuestionFormList } from './QuestionFormList';
import { Question, quizEngine } from '../core/quizEngine';
import Swal from 'sweetalert2';

export function SetupScreen({ onStart }: { onStart: () => void }) {
  const [cfg, setCfg] = useState<{count: number, optCount: number, mode: 'face'|'hand', timeLimit: number}>({count: 5, optCount: 2, mode: 'face', timeLimit: 10});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [libRefresh, setLibRefresh] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("headTiltAdminSetup");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.questions && parsed.questions.length > 0) {
          setQuestions(parsed.questions);
          setCfg({ count: parsed.questions.length, optCount: parsed.questions[0].options.length, mode: parsed.mode || 'face', timeLimit: parsed.timeLimit || 10 });
        } else {
          generateQ(5, 2);
        }
      } catch { generateQ(5, 2); }
    } else { generateQ(5, 2); }
  }, []);

  const generateQ = (count: number, optCount: number) => {
    setQuestions(Array.from({ length: count }, () => ({ question: '', options: Array(optCount).fill(''), correctIndex: 0 })));
    setCfg(c => ({...c, count, optCount}));
  };

  const handleQChange = (i: number, field: string, val: any, oIdx?: number) => {
    const newQ = [...questions];
    if (field === 'text') newQ[i].question = val;
    if (field === 'correct') newQ[i].correctIndex = val;
    if (field === 'option' && oIdx !== undefined) newQ[i].options[oIdx] = val;
    setQuestions(newQ);
  };

  const saveLibrary = async () => {
    if (questions.some(q => !q.question || q.options.some(o => !o))) return Swal.fire({ icon: 'error', title: 'Missing Fields' });
    const libRaw = localStorage.getItem("headTiltLibrary");
    const lib = libRaw ? JSON.parse(libRaw) : [];
    if (lib.length >= 5) return Swal.fire({ icon: 'warning', title: 'Library Full' });
    const { value: name } = await Swal.fire({ title: 'Save Quizzes', input: 'text', showCancelButton: true });
    if (!name?.trim()) return;
    lib.push({ id: "lib_" + Date.now(), name: name.trim(), setup: { questions, mode: cfg.mode, timeLimit: cfg.timeLimit } });
    localStorage.setItem("headTiltLibrary", JSON.stringify(lib));
    setLibRefresh(r => r + 1);
  };

  const clearAll = async () => {
    if (questions.some(q => q.question || q.options.some(o => o))) {
      const { isConfirmed } = await Swal.fire({ title: 'Clear all?', icon: 'warning', showCancelButton: true });
      if (!isConfirmed) return;
    }
    generateQ(cfg.count, cfg.optCount);
  };

  const startGame = () => {
    if (questions.some(q => !q.question || q.options.some(o => !o))) return Swal.fire({ icon: 'error', title: 'Missing Fields' });
    localStorage.setItem("headTiltAdminSetup", JSON.stringify({ questions, mode: cfg.mode, timeLimit: cfg.timeLimit }));
    quizEngine.setQuestions(questions, cfg.mode, cfg.timeLimit);
    onStart();
  };

  return (
    <div className="container mx-auto max-w-5xl bg-white p-8 rounded-2xl shadow-xl flex flex-col md:flex-row gap-8">
      <Sidebar onLoadPreset={(m, c, o) => { setCfg(p => ({...p, mode: m, count: c, optCount: o})); generateQ(c, o); }}
        onLoadLibrary={s => { setCfg({mode: s.mode, timeLimit: s.timeLimit, count: s.questions.length, optCount: s.optionsCount}); setQuestions(s.questions); }}
        refreshTrigger={libRefresh} triggerRefresh={() => setLibRefresh(r => r + 1)} />
      <div className="w-full md:w-2/3 flex flex-col">
        <h1 className="text-4xl font-extrabold text-center text-indigo-600 mb-8">Create Quiz</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div><label className="block text-sm font-bold text-gray-700 mb-2">Number of Questions:</label>
            <input type="number" value={cfg.count} onChange={e => setCfg(c=>({...c, count: parseInt(e.target.value)}))} className="w-full px-4 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">Number of Options:</label>
            <select value={cfg.optCount} onChange={e => setCfg(c=>({...c, optCount: parseInt(e.target.value)}))} className="w-full px-4 py-2 border rounded-lg">
              <option value="2">2 Options</option><option value="3">3 Options</option><option value="4">4 Options</option></select></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">Tracking Mode:</label>
            <select value={cfg.mode} onChange={e => setCfg(c=>({...c, mode: e.target.value as any}))} className="w-full px-4 py-2 border rounded-lg">
              <option value="face">Face Tracking (Roll)</option><option value="hand">Hand Tracking (Fingers)</option></select></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">Time per Question (s):</label>
            <input type="number" value={cfg.timeLimit} onChange={e => setCfg(c=>({...c, timeLimit: parseInt(e.target.value)}))} className="w-full px-4 py-2 border rounded-lg" /></div>
        </div>
        <div className="flex flex-wrap gap-4 mb-8">
          <button onClick={() => generateQ(cfg.count, cfg.optCount)} className="flex-1 bg-indigo-50 text-indigo-600 font-bold py-3 px-4 rounded-lg">Generate</button>
          <button onClick={saveLibrary} className="flex-1 bg-green-50 text-green-600 font-bold py-3 px-4 rounded-lg">Save to Library</button>
          <button onClick={clearAll} className="flex-1 bg-red-50 text-red-600 font-bold py-3 px-4 rounded-lg">Clear All</button>
        </div>
        <QuestionFormList questions={questions} onChange={handleQChange} />
        <button onClick={startGame} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg mt-8 text-xl">START GAME</button>
      </div>
    </div>
  );
}
