import { Question } from '../core/quizEngine';

export interface SetupFormState {
  questions: Question[];
  mode: 'face' | 'hand';
  timeLimit: number;
  optionsCount: number;
}

export interface LibraryItem {
  id: string;
  name: string;
  setup: {
    questions: Question[];
    mode: string;
    timeLimit: number;
  };
}
