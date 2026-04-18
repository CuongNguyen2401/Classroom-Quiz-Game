import React, { useState } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { PlayScreen } from './components/PlayScreen';
import { ResultScreen } from './components/ResultScreen';
import { quizEngine } from './core/quizEngine';
import { resultManager } from './core/resultManager';

export type ScreenType = 'setup' | 'play' | 'result';

export function App() {
  const [screen, setScreen] = useState<ScreenType>('setup');

  return (
    <div className="w-full min-h-screen flex flex-col pt-8 pb-8">
      {screen === 'setup' && <SetupScreen onStart={() => setScreen('play')} />}
      {screen === 'play' && (
        <PlayScreen 
          onFinish={() => setScreen('result')} 
          onExit={() => setScreen('setup')} 
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          onRestart={() => setScreen('setup')}
          onRetry={() => {
            quizEngine.resetForRetry();
            resultManager.clearResults();
            setScreen('play');
          }}
        />
      )}
    </div>
  );
}
