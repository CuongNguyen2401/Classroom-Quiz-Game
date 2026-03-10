import React, { useState, useEffect, useRef } from 'react';
import { quizEngine } from '../core/quizEngine';
import { resultManager } from '../core/resultManager';
import { camera } from '../core/camera';
import { headTracker } from '../core/headTracking';
import { handTracker } from '../core/handTracking';
import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';

interface Props { onFinish: () => void; onExit: () => void; }

export function PlayScreen({ onFinish, onExit }: Props) {
  const [qData, setQData] = useState({ q: quizEngine.getCurrentQuestion(), idx: 0 });
  const [timeLeft, setTimeLeft] = useState(quizEngine.timeLimit);
  const [feedback, setFeedback] = useState<{show: boolean, correct: boolean}>({show: false, correct: false});
  const ringRef = useRef<SVGCircleElement>(null);
  const trackerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      await camera.startCamera();
      trackerRef.current = quizEngine.trackingMode === 'hand' ? handTracker : headTracker;
      await trackerRef.current.initialize();
      trackerRef.current.onTiltProgress = (dir: any, prog: number) => {
        if (ringRef.current) ringRef.current.style.strokeDashoffset = (290 - (prog * 290)).toString();
        document.querySelectorAll('.option-fill').forEach((f: any) => f.style.width = '0%');
        document.querySelectorAll('.option-box').forEach(b => b.classList.remove('border-white', 'scale-105'));
        if (dir !== 'center') {
          const b = document.getElementById(`option-box-${dir}`);
          const f = document.getElementById(`option-fill-${dir}`);
          if (b && f) { b.classList.add('border-white', 'scale-105'); f.style.width = `${prog * 100}%`; }
        }
      };
      trackerRef.current.onTiltConfirmed = handleConfirm;
      startTracking();
    };
    init();
    return () => { cleanUp(); };
  }, []);

  const cleanUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    camera.stopCamera();
    if (trackerRef.current) trackerRef.current.stopDetection();
  };

  const startTracking = () => {
    setQData({ q: quizEngine.getCurrentQuestion()!, idx: quizEngine.getCurrentIndex() });
    trackerRef.current?.startDetection();
    if (quizEngine.timeLimit > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(quizEngine.timeLimit);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { handleTimeout(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
  };

  const handleConfirm = async (dir: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const img = camera.captureImage();
    const correct = quizEngine.answerCurrent(dir);
    resultManager.addResult({ questionIndex: quizEngine.getCurrentIndex(), selectedIndex: dir, correct, image: img });
    trackerRef.current?.stopDetection();
    showFeedback(correct);
    await new Promise(r => setTimeout(r, 1500));
    quizEngine.nextQuestion() ? startTracking() : finish();
  };

  const handleTimeout = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const img = camera.captureImage();
    resultManager.addResult({ questionIndex: quizEngine.getCurrentIndex(), selectedIndex: -1, correct: false, image: img });
    trackerRef.current?.stopDetection();
    showFeedback(false);
    await new Promise(r => setTimeout(r, 1500));
    quizEngine.nextQuestion() ? startTracking() : finish();
  };

  const showFeedback = (corr: boolean) => {
    setFeedback({ show: true, correct: corr });
    if (corr) confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#4ade80', '#60a5fa', '#fbbf24', '#f87171'] });
    setTimeout(() => setFeedback({ show: false, correct: false }), 1500);
  };

  const finish = () => { cleanUp(); onFinish(); };
  const exit = () => {
    Swal.fire({
      title: 'Exit quiz?',
      text: "You will lose your current progress.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, exit!'
    }).then((result) => {
      if (result.isConfirmed) {
        cleanUp();
        onExit();
      }
    });
  };

  if (!qData.q) return null;
  const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"];
  const len = qData.q.options.length;

  return (
    <div className="container mx-auto max-w-5xl flex-col items-center justify-center flex-1 flex py-8">
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <div className="text-xl font-bold text-gray-500">Q {qData.idx + 1} / {quizEngine.getTotalQuestions()}</div>
        {quizEngine.timeLimit > 0 && <div className={`text-2xl font-extrabold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>⏳ {timeLeft}s</div>}
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-indigo-600">Score: {quizEngine.getScore()}</div>
          <button onClick={exit} className="bg-red-50 text-red-500 border hover:bg-red-100 font-bold py-1 px-3 rounded-lg text-sm">Exit</button>
        </div>
      </div>
      <div className="w-full bg-white rounded-3xl shadow-lg p-8 mb-8 text-center border-b-8 border-indigo-500"><h2 className="text-4xl font-extrabold">{qData.q.question}</h2></div>
      <div className="w-full flex items-center justify-between gap-6 px-4 min-h-[350px]">
        <div className="flex-1 flex flex-col justify-center gap-4">{[0].map(i => <OptionBox key={i} i={i} opt={qData.q!.options[i]} col={colors[i]} />)}</div>
        <div className="flex flex-col items-center gap-4 w-96 flex-shrink-0">
          <div className="w-full flex min-h-[160px]">{len >= 3 && <OptionBox i={1} opt={qData.q!.options[1]} col={colors[1]} />}</div>
          <div className="relative w-80 h-80 flex-shrink-0">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <circle className="text-gray-200 stroke-current" strokeWidth="8" cx="50" cy="50" r="46" fill="transparent"></circle>
              <circle ref={ringRef} className={`${feedback.show ? (feedback.correct ? 'text-green-400' : 'text-red-500') : 'text-indigo-500'} stroke-current`} strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="46" fill="transparent" strokeDasharray="290" strokeDashoffset="290"></circle>
            </svg>
            <div className="absolute inset-2 rounded-full overflow-hidden bg-gray-900 border-4 border-white z-10">
              <video id="webcam" className="w-full h-full object-cover" autoPlay playsInline></video>
              <canvas id="landmark-canvas" className="absolute inset-0 w-full h-full object-cover z-20"></canvas>
            </div>
            <div className={`absolute inset-2 rounded-full z-30 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${feedback.show ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-6xl">{feedback.correct ? '✅' : '❌'}</span>
            </div>
          </div>
          <div className="w-full flex min-h-[160px]">{len === 4 && <OptionBox i={3} opt={qData.q!.options[3]} col={colors[3]} />}</div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-4">{len >= 2 && <OptionBox i={len === 2 ? 1 : 2} opt={qData.q!.options[len === 2 ? 1 : 2]} col={colors[len === 2 ? 1 : 2]} />}</div>
      </div>
    </div>
  );
}

function OptionBox({ i, opt, col }: { i: number, opt: string, col: string }) {
  return (
    <div id={`option-box-${i}`} className={`option-box relative overflow-hidden flex-1 ${col} rounded-3xl shadow-xl min-h-[160px] flex items-center justify-center p-6 border-8 border-transparent transition-transform duration-300`}>
      <div id={`option-fill-${i}`} className="option-fill absolute left-0 bottom-0 top-0 bg-white opacity-40 transition-all duration-100" style={{width: '0%'}}></div>
      <span className="relative z-10 text-white text-5xl font-extrabold uppercase text-center">{opt}</span>
    </div>
  );
}
