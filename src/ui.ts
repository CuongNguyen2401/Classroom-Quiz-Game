import { Question, Result } from "./quizEngine";

export class UI {
  // Screens
  setupScreen = document.getElementById("setup-screen")!;
  playScreen = document.getElementById("play-screen")!;
  resultScreen = document.getElementById("result-screen")!;

  // Setup Elements
  numQuestionsInput = document.getElementById("num-questions-input") as HTMLInputElement;
  btnGenerate = document.getElementById("generate-questions-btn") as HTMLButtonElement;
  questionsContainer = document.getElementById("questions-container")!;
  btnStartGame = document.getElementById("start-game-btn") as HTMLButtonElement;

  // Play Elements
  currentQNum = document.getElementById("current-q-num")!;
  totalQNum = document.getElementById("total-q-num")!;
  playScore = document.getElementById("play-score")!;
  questionText = document.getElementById("question-text")!;
  leftAnswerText = document.getElementById("left-answer-text")!;
  rightAnswerText = document.getElementById("right-answer-text")!;
  leftAnswerBox = document.getElementById("left-answer-box")!;
  rightAnswerBox = document.getElementById("right-answer-box")!;
  leftProgressFill = document.getElementById("left-progress-fill")!;
  rightProgressFill = document.getElementById("right-progress-fill")!;
  progressRing = document.getElementById("progress-ring") as any;
  loadingIndicator = document.getElementById("loading-indicator")!;
  feedbackOverlay = document.getElementById("feedback-overlay")!;
  feedbackIcon = document.getElementById("feedback-icon")!;

  // Result Elements
  finalScore = document.getElementById("final-score")!;
  resultsContainer = document.getElementById("results-container")!;
  btnExportExcel = document.getElementById("export-excel-btn") as HTMLButtonElement;
  btnRestart = document.getElementById("restart-game-btn") as HTMLButtonElement;
  btnRetry = document.getElementById("retry-game-btn") as HTMLButtonElement;

  constructor() {}

  showScreen(screen: "setup" | "play" | "result") {
    this.setupScreen.classList.add("hidden");
    this.playScreen.classList.add("hidden");
    this.playScreen.classList.remove("flex");
    this.resultScreen.classList.add("hidden");

    if (screen === "setup") this.setupScreen.classList.remove("hidden");
    if (screen === "play") {
      this.playScreen.classList.remove("hidden");
      this.playScreen.classList.add("flex");
    }
    if (screen === "result") this.resultScreen.classList.remove("hidden");
  }

  generateSetupFields(count: number) {
    this.questionsContainer.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const qDiv = document.createElement("div");
      qDiv.className = "p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm";
      qDiv.innerHTML = `
        <h3 class="font-bold text-lg mb-4 text-indigo-700">Question ${i + 1}</h3>
        <input type="text" placeholder="Question Text" class="q-text w-full px-4 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500" required />
        <div class="flex gap-4 mb-3">
          <input type="text" placeholder="Left Answer" class="q-left flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
          <input type="text" placeholder="Right Answer" class="q-right flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
        </div>
        <select class="q-correct w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required>
          <option value="left">Correct Answer is LEFT</option>
          <option value="right">Correct Answer is RIGHT</option>
        </select>
      `;
      this.questionsContainer.appendChild(qDiv);
    }
    this.btnStartGame.classList.remove("hidden");
  }

  getSetupData(): Question[] | null {
    const questions: Question[] = [];
    const blocks = this.questionsContainer.querySelectorAll("div.p-6");
    for (const block of Array.from(blocks)) {
      const qText = (block.querySelector(".q-text") as HTMLInputElement).value.trim();
      const qLeft = (block.querySelector(".q-left") as HTMLInputElement).value.trim();
      const qRight = (block.querySelector(".q-right") as HTMLInputElement).value.trim();
      const qCorrect = (block.querySelector(".q-correct") as HTMLSelectElement).value as "left" | "right";

      if (!qText || !qLeft || !qRight) {
        alert("Please fill all fields before starting.");
        return null;
      }
      questions.push({ question: qText, left: qLeft, right: qRight, correct: qCorrect });
    }
    return questions;
  }

  updatePlayScreen(q: Question, index: number, total: number, score: number) {
    this.currentQNum.innerText = (index + 1).toString();
    this.totalQNum.innerText = total.toString();
    this.playScore.innerText = `Score: ${score}`;
    
    this.questionText.innerText = q.question;
    this.leftAnswerText.innerText = q.left;
    this.rightAnswerText.innerText = q.right;

    this.resetBoxStyles();
    this.updateProgress(0, "center");
  }

  resetBoxStyles() {
    this.leftAnswerBox.classList.remove("border-white", "scale-105", "shadow-2xl");
    this.rightAnswerBox.classList.remove("border-white", "scale-105", "shadow-2xl");
    this.leftAnswerBox.classList.add("border-transparent");
    this.rightAnswerBox.classList.add("border-transparent");
    this.leftProgressFill.style.width = "0%";
    this.rightProgressFill.style.width = "0%";
  }

  updateProgress(progressRaw: number, dir: "left" | "right" | "center") {
    // Circumference of r=46 is roughly 290
    const circumference = 290;
    const offset = circumference - progressRaw * circumference;
    this.progressRing.style.strokeDashoffset = offset.toString();

    this.resetBoxStyles();

    if (dir === "left") {
      this.leftAnswerBox.classList.add("border-white", "scale-105", "shadow-2xl");
      this.leftAnswerBox.classList.remove("border-transparent");
      this.leftProgressFill.style.width = `${progressRaw * 100}%`;
    } else if (dir === "right") {
      this.rightAnswerBox.classList.add("border-white", "scale-105", "shadow-2xl");
      this.rightAnswerBox.classList.remove("border-transparent");
      this.rightProgressFill.style.width = `${progressRaw * 100}%`;
    }
  }

  showFeedback(isCorrect: boolean) {
    this.feedbackOverlay.style.opacity = "1";
    this.feedbackIcon.innerHTML = isCorrect ? "✅" : "❌";
    this.progressRing.style.stroke = isCorrect ? "#4ade80" : "#f87171"; // green / red
    
    setTimeout(() => {
      this.feedbackOverlay.style.opacity = "0";
      this.progressRing.style.stroke = "#6366f1"; // indigo
    }, 1500);
  }

  showResults(results: Result[], questions: Question[], totalScore: number) {
    this.finalScore.innerText = `${totalScore} / ${questions.length}`;
    this.resultsContainer.innerHTML = "";

    results.forEach((r, idx) => {
      const q = questions[idx];
      const div = document.createElement("div");
      div.className = `p-6 rounded-2xl shadow-sm flex items-center gap-6 ${r.correct ? "bg-green-50" : "bg-red-50"}`;
      
      div.innerHTML = `
        <div class="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white shadow">
          <img src="${r.image}" class="w-full h-full object-cover rounded-lg" />
        </div>
        <div class="flex-1">
          <p class="font-bold text-gray-800 text-lg">Q${idx + 1}: ${q.question}</p>
          <p class="text-sm text-gray-600 mt-1">
            Selected: <span class="font-bold uppercase ${r.correct ? 'text-green-600' : 'text-red-500'}">${r.selected === 'left' ? q.left : q.right}</span>
          </p>
          <p class="text-sm font-semibold ${r.correct ? 'text-green-600' : 'text-red-500'} mt-1">
            ${r.correct ? 'Correct' : 'Wrong (Correct: ' + (q.correct === 'left' ? q.left : q.right) + ')'}
          </p>
        </div>
        <div class="text-4xl">
          ${r.correct ? '🌟' : '💔'}
        </div>
      `;
      
      this.resultsContainer.appendChild(div);
    });
  }
}

export const ui = new UI();
