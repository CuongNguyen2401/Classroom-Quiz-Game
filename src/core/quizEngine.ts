import { create } from 'zustand';

export type TrackingMode = "face" | "hand";

export type Question = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type Result = {
  questionIndex: number;
  selectedIndex: number; // -1 for timeout
  correct: boolean;
  image: string; // Base64 data URL
};

interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  trackingMode: TrackingMode;
  timeLimit: number;
  
  setQuestions: (qs: Question[], mode?: TrackingMode, time?: number) => void;
  getQuestions: () => Question[];
  getCurrentQuestion: () => Question | null;
  getCurrentIndex: () => number;
  getTotalQuestions: () => number;
  getScore: () => number;
  answerCurrent: (selectedIndex: number) => boolean;
  nextQuestion: () => boolean;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  trackingMode: "face",
  timeLimit: 0,

  setQuestions: (qs, mode = "face", time = 0) => set({
    questions: qs,
    currentQuestionIndex: 0,
    score: 0,
    trackingMode: mode,
    timeLimit: time,
  }),
  getQuestions: () => get().questions,
  getCurrentQuestion: () => {
    const state = get();
    return state.currentQuestionIndex < state.questions.length
      ? state.questions[state.currentQuestionIndex]
      : null;
  },
  getCurrentIndex: () => get().currentQuestionIndex,
  getTotalQuestions: () => get().questions.length,
  getScore: () => get().score,
  answerCurrent: (selectedIndex) => {
    const state = get();
    const q = state.getCurrentQuestion();
    if (!q) return false;
    const isCorrect = q.correctIndex === selectedIndex;
    if (isCorrect) {
      set({ score: state.score + 1 });
    }
    return isCorrect;
  },
  nextQuestion: () => {
    const state = get();
    const nextIndex = state.currentQuestionIndex + 1;
    set({ currentQuestionIndex: nextIndex });
    return nextIndex < state.questions.length;
  }
}));

// Backward compatibility proxy for existing code
export const quizEngine = {
  get trackingMode() { return useQuizStore.getState().trackingMode; },
  set trackingMode(val) { useQuizStore.setState({ trackingMode: val }); },
  get timeLimit() { return useQuizStore.getState().timeLimit; },
  set timeLimit(val) { useQuizStore.setState({ timeLimit: val }); },
  setQuestions: (qs: Question[], mode: TrackingMode = "face", time: number = 0) => useQuizStore.getState().setQuestions(qs, mode, time),
  getQuestions: () => useQuizStore.getState().getQuestions(),
  getCurrentQuestion: () => useQuizStore.getState().getCurrentQuestion(),
  getCurrentIndex: () => useQuizStore.getState().getCurrentIndex(),
  getTotalQuestions: () => useQuizStore.getState().getTotalQuestions(),
  getScore: () => useQuizStore.getState().getScore(),
  answerCurrent: (idx: number) => useQuizStore.getState().answerCurrent(idx),
  nextQuestion: () => useQuizStore.getState().nextQuestion()
};
