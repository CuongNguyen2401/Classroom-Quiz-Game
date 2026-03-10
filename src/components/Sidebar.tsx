import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { LibraryItem, SetupFormState } from './types';

interface SidebarProps {
  onLoadPreset: (mode: 'face' | 'hand', count: number, options: number) => void;
  onLoadLibrary: (state: SetupFormState) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export function Sidebar({ onLoadPreset, onLoadLibrary, refreshTrigger, triggerRefresh }: SidebarProps) {
  const [library, setLibrary] = useState<LibraryItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("headTiltLibrary");
    if (raw) setLibrary(JSON.parse(raw));
  }, [refreshTrigger]);

  const handleDelete = async (item: LibraryItem) => {
    const res = await Swal.fire({
      title: 'Are you sure?', text: `Remove "${item.name}"?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444'
    });
    if (res.isConfirmed) {
      const updated = library.filter(l => l.id !== item.id);
      localStorage.setItem("headTiltLibrary", JSON.stringify(updated));
      triggerRefresh();
    }
  };

  const handleRename = async (item: LibraryItem) => {
    const { value: name } = await Swal.fire({
      title: 'Rename', input: 'text', inputValue: item.name, showCancelButton: true,
    });
    if (name?.trim()) {
      const updated = library.map(l => l.id === item.id ? { ...l, name: name.trim() } : l);
      localStorage.setItem("headTiltLibrary", JSON.stringify(updated));
      triggerRefresh();
    }
  };

  return (
    <div className="w-full md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Presets</h2>
      <div className="flex flex-col gap-3 mb-8">
        <button onClick={() => onLoadPreset('face', 5, 2)} className="w-full bg-blue-50 text-blue-600 font-bold py-3 px-4 rounded-lg hover:bg-blue-100 transition shadow-sm border border-blue-200 flex justify-between items-center text-sm">
          <span>Face Mode</span> <span className="text-xs font-semibold opacity-80 border border-blue-200 px-2 py-1 rounded bg-blue-100">5Q / 2 Ans</span>
        </button>
        <button onClick={() => onLoadPreset('hand', 5, 4)} className="w-full bg-purple-50 text-purple-600 font-bold py-3 px-4 rounded-lg hover:bg-purple-100 transition shadow-sm border border-purple-200 flex justify-between items-center text-sm">
          <span>Hand Mode</span> <span className="text-xs font-semibold opacity-80 border border-purple-200 px-2 py-1 rounded bg-purple-100">5Q / 4 Ans</span>
        </button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Your Library</h2>
        <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-md border">{library.length}/5</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
        {library.length === 0 ? <p className="text-gray-400 italic text-sm text-center">No saved quizzes yet.</p> :
          library.map(item => (
            <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700 truncate w-3/4">{item.name}</span>
                <span className="text-xs text-gray-500">{item.setup.questions.length} Qs</span>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => onLoadLibrary({ questions: item.setup.questions, mode: item.setup.mode as any, timeLimit: item.setup.timeLimit, optionsCount: item.setup.questions[0].options.length })} className="flex-1 bg-indigo-100 text-indigo-700 text-xs font-bold py-1 px-2 rounded">Load</button>
                <button onClick={() => handleRename(item)} className="bg-blue-100 text-blue-700 text-xs font-bold py-1 px-2 rounded">Rename</button>
                <button onClick={() => handleDelete(item)} className="bg-red-100 text-red-700 text-xs font-bold py-1 px-2 rounded">X</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
