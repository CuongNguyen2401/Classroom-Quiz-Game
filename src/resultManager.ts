import { Result } from "./quizEngine";

export class ResultManager {
  private results: Result[] = [];

  constructor() {}

  clearResults() {
    this.results = [];
  }

  addResult(result: Result) {
    this.results.push(result);
  }

  getResults(): Result[] {
    return this.results;
  }
}

export const resultManager = new ResultManager();
