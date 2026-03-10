import React from 'react';
import { resultManager } from '../core/resultManager';
import { quizEngine } from '../core/quizEngine';
import { exportResultsToExcel } from '../core/excelExport';

interface Props {
  onRestart: () => void;
  onRetry: () => void;
}

export function ResultScreen({ onRestart, onRetry }: Props) {
  const results = resultManager.getResults();
  const questions = quizEngine.getQuestions();
  const score = quizEngine.getScore();

  return (
    <div className="container mx-auto max-w-4xl bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
      <h1 className="text-5xl font-extrabold text-center text-indigo-600 mb-4">Quiz Complete!</h1>
      <h2 className="text-3xl font-bold text-center text-gray-600 mb-10">
        Final Score: <span className="text-indigo-600">{score} / {questions.length}</span>
      </h2>

      <div className="flex justify-center mb-10">
        <button onClick={exportResultsToExcel} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition transform hover:-translate-y-1 text-lg flex items-center gap-2">
          EXPORT RESULTS TO EXCEL
        </button>
      </div>

      <div className="w-full space-y-6">
        {results.map((r, idx) => {
          const q = questions[idx];
          return (
            <div key={idx} className={`p-6 rounded-2xl shadow-sm flex items-center gap-6 ${r.correct ? "bg-green-50" : "bg-red-50"}`}>
              <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white shadow">
                <img src={r.image} className="w-full h-full object-cover rounded-lg" alt="Snapshot" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-lg">Q{idx + 1}: {q.question}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Selected: <span className={`font-bold uppercase ${r.correct ? 'text-green-600' : 'text-red-500'}`}>{r.selectedIndex >= 0 ? q.options[r.selectedIndex] : 'Timeout'}</span>
                </p>
                <p className={`text-sm font-semibold ${r.correct ? 'text-green-600' : 'text-red-500'} mt-1`}>
                  {r.correct ? 'Correct' : `Wrong (Correct: ${q.options[q.correctIndex]})`}
                </p>
              </div>
              <div className="text-4xl">{r.correct ? '🌟' : '💔'}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex justify-center gap-6">
        <button onClick={onRetry} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition transform hover:-translate-y-1">
          Retry Quiz
        </button>
        <button onClick={onRestart} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-xl shadow-sm transition">
          Create New Quiz
        </button>
      </div>
    </div>
  );
}
