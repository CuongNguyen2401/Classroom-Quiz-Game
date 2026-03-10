import { Question, Result } from "./quizEngine";
import confetti from "canvas-confetti";
import Swal from 'sweetalert2';

export interface LibraryItem {
  id: string;
  name: string;
  setup: {
    questions: Question[];
    mode: string;
    timeLimit: number;
  };
}

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

  numOptionsInput = document.getElementById("num-options-input") as HTMLSelectElement;
  trackingModeInput = document.getElementById("tracking-mode-input") as HTMLSelectElement;
  timeLimitInput = document.getElementById("time-limit-input") as HTMLInputElement;
  btnPresetFace = document.getElementById("preset-face-btn") as HTMLButtonElement;
  btnPresetHand = document.getElementById("preset-hand-btn") as HTMLButtonElement;
  btnLoadSaved = document.getElementById("load-saved-btn") as HTMLButtonElement;
  btnSaveLibrary = document.getElementById("save-library-btn") as HTMLButtonElement;
  btnClearAll = document.getElementById("clear-all-btn") as HTMLButtonElement;
  libraryContainer = document.getElementById("library-container")!;
  libraryCount = document.getElementById("library-count")!;

  // Play Elements
  currentQNum = document.getElementById("current-q-num")!;
  totalQNum = document.getElementById("total-q-num")!;
  playScore = document.getElementById("play-score")!;
  questionText = document.getElementById("question-text")!;
  optionsContainerLeft = document.getElementById("options-container-left")!;
  optionsContainerRight = document.getElementById("options-container-right")!;
  optionsContainerTop = document.getElementById("options-container-top")!;
  optionsContainerBottom = document.getElementById("options-container-bottom")!;
  progressRing = document.getElementById("progress-ring") as any;
  loadingIndicator = document.getElementById("loading-indicator")!;
  feedbackOverlay = document.getElementById("feedback-overlay")!;
  feedbackIcon = document.getElementById("feedback-icon")!;
  timerDisplay = document.getElementById("timer-display")!;
  timeRemaining = document.getElementById("time-remaining")!;
  btnExitGame = document.getElementById("exit-game-btn") as HTMLButtonElement;

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

  generateSetupFields(count: number, optionsCount: number) {
    this.questionsContainer.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const qDiv = document.createElement("div");
      qDiv.className = "p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm q-block";
      
      let optionsHTML = '<div class="flex flex-wrap gap-4 mb-3">';
      for (let o=0; o<optionsCount; o++) {
        optionsHTML += `<input type="text" placeholder="Option ${o+1}" class="q-opt flex-1 min-w-[150px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />`;
      }
      optionsHTML += '</div>';
      
      let correctSelectHTML = `<select class="q-correct w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required>`;
      for (let o=0; o<optionsCount; o++) {
        correctSelectHTML += `<option value="${o}">Correct Answer is Option ${o+1}</option>`;
      }
      correctSelectHTML += `</select>`;

      qDiv.innerHTML = `
        <h3 class="font-bold text-lg mb-4 text-indigo-700">Question ${i + 1}</h3>
        <input type="text" placeholder="Question Text" class="q-text w-full px-4 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500" required />
        ${optionsHTML}
        ${correctSelectHTML}
      `;
      this.questionsContainer.appendChild(qDiv);
    }
    this.btnStartGame.classList.remove("hidden");
  }

  getSetupData(): Question[] | null {
    const questions: Question[] = [];
    const blocks = this.questionsContainer.querySelectorAll(".q-block");
    for (const block of Array.from(blocks)) {
      const qText = (block.querySelector(".q-text") as HTMLInputElement).value.trim();
      const optionInputs = Array.from(block.querySelectorAll(".q-opt")) as HTMLInputElement[];
      const options = optionInputs.map(input => input.value.trim());
      const qCorrect = parseInt((block.querySelector(".q-correct") as HTMLSelectElement).value, 10);

      if (!qText || options.some(opt => !opt)) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Fields',
          text: 'Please fill all fields before starting.',
          confirmButtonColor: '#4f46e5'
        });
        return null;
      }
      questions.push({ question: qText, options: options, correctIndex: qCorrect });
    }
    return questions;
  }

  updatePlayScreen(q: Question, index: number, total: number, score: number) {
    this.currentQNum.innerText = (index + 1).toString();
    this.totalQNum.innerText = total.toString();
    this.playScore.innerText = `Score: ${score}`;
    this.questionText.innerText = q.question;

    this.optionsContainerLeft.innerHTML = "";
    this.optionsContainerRight.innerHTML = "";
    this.optionsContainerTop.innerHTML = "";
    this.optionsContainerBottom.innerHTML = "";
    
    const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"];
    
    q.options.forEach((opt, i) => {
      const box = document.createElement("div");
      box.className = `option-box relative overflow-hidden flex-1 ${colors[i % colors.length]} rounded-3xl shadow-xl min-h-[160px] flex items-center justify-center p-6 border-8 border-transparent transition-transform duration-300`;
      box.id = `option-box-${i}`;
      
      const fill = document.createElement("div");
      fill.className = `option-fill absolute left-0 bottom-0 top-0 bg-white opacity-40 transition-all duration-100`;
      fill.style.width = "0%";
      fill.id = `option-fill-${i}`;
      
      const text = document.createElement("span");
      text.className = `relative z-10 text-white text-5xl font-extrabold uppercase text-center drop-shadow-md`;
      text.innerText = opt;
      
      box.appendChild(fill);
      box.appendChild(text);
      
      let targetContainer = this.optionsContainerLeft;

      if (q.options.length === 2) {
        if (i === 1) targetContainer = this.optionsContainerRight;
      } else if (q.options.length === 3) {
        if (i === 1) targetContainer = this.optionsContainerTop;
        if (i === 2) targetContainer = this.optionsContainerRight;
      } else if (q.options.length === 4) {
        if (i === 1) targetContainer = this.optionsContainerTop;
        if (i === 2) targetContainer = this.optionsContainerRight;
        if (i === 3) targetContainer = this.optionsContainerBottom;
      }
      
      targetContainer.appendChild(box);
    });

    this.resetBoxStyles();
    this.updateProgress(0, "center");
  }

  resetBoxStyles() {
    const boxes = document.querySelectorAll(".option-box");
    const fills = document.querySelectorAll(".option-fill");
    boxes.forEach(b => {
      b.classList.remove("border-white", "scale-105", "shadow-2xl");
      b.classList.add("border-transparent");
    });
    fills.forEach((f: any) => {
      f.style.width = "0%";
    });
  }

  updateProgress(progressRaw: number, dir: number | "center") {
    const circumference = 290;
    const offset = circumference - progressRaw * circumference;
    this.progressRing.style.strokeDashoffset = offset.toString();

    this.resetBoxStyles();

    if (dir !== "center") {
      const box = document.getElementById(`option-box-${dir}`);
      const fill = document.getElementById(`option-fill-${dir}`);
      if (box && fill) {
        box.classList.add("border-white", "scale-105", "shadow-2xl");
        box.classList.remove("border-transparent");
        fill.style.width = `${progressRaw * 100}%`;
      }
    }
  }

  updateTimer(seconds: number) {
    this.timeRemaining.innerText = seconds.toString();
    if (seconds <= 3) {
      this.timerDisplay.classList.add("animate-pulse");
    } else {
      this.timerDisplay.classList.remove("animate-pulse");
    }
  }

  showTimer(show: boolean) {
    if (show) {
      this.timerDisplay.classList.remove("hidden");
    } else {
      this.timerDisplay.classList.add("hidden");
    }
  }

  showFeedback(isCorrect: boolean) {
    this.feedbackOverlay.style.opacity = "1";
    this.feedbackIcon.innerHTML = isCorrect ? "✅" : "❌";
    this.progressRing.style.stroke = isCorrect ? "#4ade80" : "#f87171"; // green / red
    
    if (isCorrect) {
      this.playConfetti();
    } else {
      this.playShake();
    }
    
    setTimeout(() => {
      this.feedbackOverlay.style.opacity = "0";
      this.progressRing.style.stroke = "#6366f1"; // indigo
    }, 1500);
  }

  private playConfetti() {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#4ade80', '#60a5fa', '#fbbf24', '#f87171']
    });
  }

  private playShake() {
    this.feedbackIcon.animate([
      { transform: 'translateX(0px)' },
      { transform: 'translateX(-15px) rotate(-5deg)' },
      { transform: 'translateX(15px) rotate(5deg)' },
      { transform: 'translateX(-15px) rotate(-5deg)' },
      { transform: 'translateX(15px) rotate(5deg)' },
      { transform: 'translateX(0px)' }
    ], {
      duration: 400,
      easing: 'ease-in-out'
    });
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
            Selected: <span class="font-bold uppercase ${r.correct ? 'text-green-600' : 'text-red-500'}">${r.selectedIndex >= 0 ? q.options[r.selectedIndex] : 'Timeout'}</span>
          </p>
          <p class="text-sm font-semibold ${r.correct ? 'text-green-600' : 'text-red-500'} mt-1">
            ${r.correct ? 'Correct' : 'Wrong (Correct: ' + q.options[q.correctIndex] + ')'}
          </p>
        </div>
        <div class="text-4xl">
          ${r.correct ? '🌟' : '💔'}
        </div>
      `;
      
      this.resultsContainer.appendChild(div);
    });
  }

  saveSetupDataToStorage(data: any) {
    localStorage.setItem("headTiltAdminSetup", JSON.stringify(data));
  }

  loadSetupDataFromStorage(): any | null {
    const saved = localStorage.getItem("headTiltAdminSetup");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  getLibraryFromStorage(): LibraryItem[] {
    const raw = localStorage.getItem("headTiltLibrary");
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  saveLibraryToStorage(lib: LibraryItem[]) {
    localStorage.setItem("headTiltLibrary", JSON.stringify(lib));
  }

  renderLibrary(
    onLoad: (item: LibraryItem) => void, 
    onDelete: (id: string) => void, 
    onRename: (id: string, newName: string) => void
  ) {
    const lib = this.getLibraryFromStorage();
    this.libraryCount.innerText = lib.length.toString();
    this.libraryContainer.innerHTML = "";
    
    if (lib.length === 0) {
      this.libraryContainer.innerHTML = '<p class="text-gray-400 italic text-sm text-center mt-10">No saved quizzes yet.</p>';
      return;
    }

    lib.forEach(item => {
      const el = document.createElement("div");
      el.className = "bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-2 shadow-sm";
      el.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="font-bold text-gray-700 truncate w-3/4">${item.name}</span>
          <span class="text-xs text-gray-500">${item.setup.questions.length} Qs</span>
        </div>
        <div class="flex gap-2 mt-1">
          <button class="flex-1 bg-indigo-100 text-indigo-700 text-xs font-bold py-1 px-2 rounded hover:bg-indigo-200 transition btn-load">Load</button>
          <button class="bg-blue-100 text-blue-700 text-xs font-bold py-1 px-2 rounded hover:bg-blue-200 transition btn-rename">Rename</button>
          <button class="bg-red-100 text-red-700 text-xs font-bold py-1 px-2 rounded hover:bg-red-200 transition btn-delete">X</button>
        </div>
      `;
      el.querySelector(".btn-load")?.addEventListener("click", () => onLoad(item));
      el.querySelector(".btn-rename")?.addEventListener("click", async () => {
        const { value: newName } = await Swal.fire({
          title: 'Enter new name',
          input: 'text',
          inputValue: item.name,
          showCancelButton: true,
          confirmButtonColor: '#3b82f6'
        });
        if (newName && newName.trim()) {
          onRename(item.id, newName.trim());
        }
      });
      el.querySelector(".btn-delete")?.addEventListener("click", async () => {
        const result = await Swal.fire({
          title: 'Are you sure?',
          text: `Remove "${item.name}" from your library?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Yes, remove it!'
        });
        if (result.isConfirmed) {
          onDelete(item.id);
        }
      });
      this.libraryContainer.appendChild(el);
    });
  }
}

export const ui = new UI();
