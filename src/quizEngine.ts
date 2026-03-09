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

export class QuizEngine {
  private questions: Question[] = [];
  private currentQuestionIndex: number = 0;
  private score: number = 0;

  public trackingMode: TrackingMode = "face";
  public timeLimit: number = 0;

  constructor() {}

  setQuestions(qs: Question[], mode: TrackingMode = "face", time: number = 0) {
    this.questions = qs;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.trackingMode = mode;
    this.timeLimit = time;
  }

  getQuestions(): Question[] {
    return this.questions;
  }

  getCurrentQuestion(): Question | null {
    if (this.currentQuestionIndex < this.questions.length) {
      return this.questions[this.currentQuestionIndex];
    }
    return null;
  }

  getCurrentIndex(): number {
    return this.currentQuestionIndex;
  }

  getTotalQuestions(): number {
    return this.questions.length;
  }

  getScore(): number {
    return this.score;
  }

  answerCurrent(selectedIndex: number): boolean {
    const q = this.getCurrentQuestion();
    if (!q) return false;

    const isCorrect = q.correctIndex === selectedIndex;
    if (isCorrect) {
      this.score++;
    }
    
    return isCorrect;
  }

  nextQuestion(): boolean {
    this.currentQuestionIndex++;
    return this.currentQuestionIndex < this.questions.length;
  }
}

export const quizEngine = new QuizEngine();
