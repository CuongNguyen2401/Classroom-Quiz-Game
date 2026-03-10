import React from 'react';
import { Question } from '../core/quizEngine';

interface Props {
  questions: Question[];
  onChange: (index: number, field: string, val: any, optIndex?: number) => void;
}

export function QuestionFormList({ questions, onChange }: Props) {
  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <div key={i} className="p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-indigo-700">Question {i + 1}</h3>
          <input type="text" placeholder="Question Text" value={q.question} onChange={e => onChange(i, 'text', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500" required />
          <div className="flex flex-wrap gap-4 mb-3">
            {q.options.map((opt, oIdx) => (
              <input key={oIdx} type="text" placeholder={`Option ${oIdx + 1}`} value={opt}
                onChange={e => onChange(i, 'option', e.target.value, oIdx)}
                className="flex-1 min-w-[150px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
            ))}
          </div>
          <select value={q.correctIndex} onChange={e => onChange(i, 'correct', parseInt(e.target.value))}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
            {q.options.map((_, oIdx) => (
              <option key={oIdx} value={oIdx}>Correct Answer is Option {oIdx + 1}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
