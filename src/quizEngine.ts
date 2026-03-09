export type Question = {
  question: string;
  left: string;
  right: string;
  correct: "left" | "right";
};

export type Result = {
  questionIndex: number;
  selected: "left" | "right";
  correct: boolean;
  image: string; // Base64 data URL
};

export class QuizEngine {
  private questions: Question[] = [];
  private currentQuestionIndex: number = 0;
  private score: number = 0;

  constructor() {}

  setQuestions(qs: Question[]) {
    this.questions = qs;
    this.currentQuestionIndex = 0;
    this.score = 0;
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

  answerCurrent(selected: "left" | "right"): boolean {
    const q = this.getCurrentQuestion();
    if (!q) return false;

    const isCorrect = q.correct === selected;
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
