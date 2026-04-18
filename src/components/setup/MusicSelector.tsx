import React, { useState } from 'react';
import { audioManager, TRACKS } from '../../core/audioManager';

export function MusicSelector() {
  const [selected, setSelected] = useState(0);
  const [previewIdx, setPreviewIdx] = useState(-1);
  const [vol, setVol] = useState(40);

  const handleSelect = (i: number) => {
    if (previewIdx !== -1) {
      audioManager.stopPreview();
      setPreviewIdx(-1);
    }
    setSelected(i);
    audioManager.selectTrack(i);
  };

  const handlePreview = (i: number) => {
    if (previewIdx === i) {
      audioManager.stopPreview();
      setPreviewIdx(-1);
      return;
    }
    setSelected(i);
    audioManager.selectTrack(i);
    setPreviewIdx(i);
    audioManager.startPreview(i, () => setPreviewIdx(-1));
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    setVol(v);
    audioManager.setBgVolume(v);
  };

  return (
    <div className="mt-6 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-indigo-700">🎶 Background Music</p>
        <span className="text-xs text-indigo-400 font-medium">Click ▶ to preview • Click track name to select</span>
      </div>

      <div className="flex flex-col gap-1.5 mb-4">
        {TRACKS.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => handleSelect(i)}
              className={`flex-1 text-xs font-bold py-2 px-3 rounded-lg border transition-all text-left flex items-center gap-2 ${
                selected === i
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300'
              }`}
            >
              <span>{t.emoji}</span>
              <span className="flex-1">{t.label}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                selected === i ? 'bg-indigo-500 text-indigo-100' : 'bg-gray-100 text-gray-400'
              }`}>{t.genre}</span>
              {selected === i && <span className="text-xs">✓</span>}
            </button>
            <button
              onClick={() => handlePreview(i)}
              title={previewIdx === i ? 'Stop preview' : 'Preview 15s'}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold border transition-all flex-shrink-0 ${
                previewIdx === i
                  ? 'bg-orange-500 text-white border-orange-400 shadow animate-pulse'
                  : 'bg-white text-indigo-500 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400'
              }`}
            >
              {previewIdx === i ? '⏹' : '▶'}
            </button>
          </div>
        ))}
      </div>

      {previewIdx !== -1 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <span className="text-orange-500 animate-pulse">🔊</span>
          <span className="text-xs text-orange-700 font-semibold">
            Previewing: {TRACKS[previewIdx].label} — stops automatically after 15s
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <span className="text-lg flex-shrink-0">{vol === 0 ? '🔇' : vol < 40 ? '🔈' : vol < 75 ? '🔉' : '🔊'}</span>
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={vol}
            onChange={handleVolume}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-indigo-300 font-medium mt-0.5 px-0.5">
            <span>Off</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        <span className="text-sm font-bold text-indigo-700 w-12 text-right flex-shrink-0">{vol}%</span>
      </div>
    </div>
  );
}
