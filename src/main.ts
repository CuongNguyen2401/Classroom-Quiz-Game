import { camera } from "./camera";
import { headTracker } from "./headTracking";
import { handTracker } from "./handTracking";
import { quizEngine } from "./quizEngine";
import { resultManager } from "./resultManager";
import { ui } from "./ui";
import { exportResultsToExcel } from "./excelExport";

async function init() {
  ui.showScreen("setup");

  // Init Library
  refreshLibrary();

  // Check for saved data
  const saved = ui.loadSetupDataFromStorage();
  if (saved && saved.questions && saved.questions.length > 0) {
    ui.btnLoadSaved.classList.remove("hidden");
    ui.btnLoadSaved.addEventListener("click", () => {
      ui.numQuestionsInput.value = saved.questions.length.toString();
      ui.numOptionsInput.value = saved.questions[0].options.length.toString();
      ui.trackingModeInput.value = saved.mode || "face";
      ui.timeLimitInput.value = saved.timeLimit?.toString() || "10";
      
      ui.generateSetupFields(saved.questions.length, saved.questions[0].options.length);
      
      const blocks = ui.questionsContainer.querySelectorAll(".q-block");
      saved.questions.forEach((q: any, i: number) => {
        if (blocks[i]) {
          (blocks[i].querySelector(".q-text") as HTMLInputElement).value = q.question;
          const opts = blocks[i].querySelectorAll(".q-opt") as NodeListOf<HTMLInputElement>;
          q.options.forEach((opt: string, oIdx: number) => {
            if (opts[oIdx]) opts[oIdx].value = opt;
          });
          (blocks[i].querySelector(".q-correct") as HTMLSelectElement).value = q.correctIndex.toString();
        }
      });
    });
  }

  // Setup Screen Listeners
  ui.btnGenerate.addEventListener("click", () => {
    const num = parseInt(ui.numQuestionsInput.value);
    const optionsCount = parseInt(ui.numOptionsInput.value);
    if (!isNaN(num) && num > 0 && !isNaN(optionsCount)) {
      ui.generateSetupFields(num, optionsCount);
    }
  });

  ui.btnPresetFace.addEventListener("click", () => {
    ui.numQuestionsInput.value = "5";
    ui.numOptionsInput.value = "2";
    ui.trackingModeInput.value = "face";
    ui.timeLimitInput.value = "10";
    ui.generateSetupFields(5, 2);
  });

  ui.btnPresetHand.addEventListener("click", () => {
    ui.numQuestionsInput.value = "5";
    ui.numOptionsInput.value = "4";
    ui.trackingModeInput.value = "hand";
    ui.timeLimitInput.value = "10";
    ui.generateSetupFields(5, 4);
  });

  ui.btnSaveLibrary.addEventListener("click", () => {
    const qData = ui.getSetupData();
    if (!qData) return;

    let lib = ui.getLibraryFromStorage();
    if (lib.length >= 5) {
      alert("You have reached the maximum of 5 saved question sets. Please remove one first.");
      return;
    }

    const name = prompt("Enter a name for this question set:");
    if (!name || name.trim() === "") return;

    const mode = ui.trackingModeInput.value;
    const timeLimit = parseInt(ui.timeLimitInput.value) || 0;

    lib.push({
      id: "lib_" + Date.now().toString(),
      name: name.trim(),
      setup: {
        questions: qData,
        mode: mode,
        timeLimit: timeLimit
      }
    });

    ui.saveLibraryToStorage(lib);
    refreshLibrary();
  });

  ui.btnClearAll.addEventListener("click", () => {
    let hasData = false;
    const inputs = ui.questionsContainer.querySelectorAll("input[type='text']") as NodeListOf<HTMLInputElement>;
    
    for (const input of Array.from(inputs)) {
      if (input.value.trim() !== "") {
        hasData = true;
        break;
      }
    }

    if (hasData) {
      if (!confirm("This action will clear all your question before")) {
        return; // User cancelled
      }
    }

    // Clear all inputs
    inputs.forEach(input => input.value = "");
    
    // Reset selects to option 0
    const selects = ui.questionsContainer.querySelectorAll(".q-correct") as NodeListOf<HTMLSelectElement>;
    selects.forEach(select => select.value = "0");
  });

  ui.btnStartGame.addEventListener("click", async () => {
    const qData = ui.getSetupData();
    if (!qData) return;

    const mode = ui.trackingModeInput.value as any;
    const timeLimit = parseInt(ui.timeLimitInput.value) || 0;

    // Save to local storage automatically
    ui.saveSetupDataToStorage({ questions: qData, mode, timeLimit });

    quizEngine.setQuestions(qData, mode, timeLimit);
    resultManager.clearResults();
    
    ui.showScreen("play");
    ui.loadingIndicator.classList.remove("hidden");
    
    await camera.startCamera();
    activeTracker = mode === "hand" ? handTracker : headTracker;
    await activeTracker.initialize();
    
    setupTrackerCallbacks();

    ui.loadingIndicator.classList.add("hidden");
    startNextQuestion();
  });

  // Tracker callbacks will be set in setupTrackerCallbacks();

// Result Screen Listeners
  ui.btnExportExcel.addEventListener("click", () => {
    exportResultsToExcel();
  });

  ui.btnRestart.addEventListener("click", () => {
    ui.showScreen("setup");
  });

  ui.btnRetry.addEventListener("click", async () => {
    const qs = quizEngine.getQuestions();
    quizEngine.setQuestions(qs, quizEngine.trackingMode, quizEngine.timeLimit);
    resultManager.clearResults();
    
    ui.showScreen("play");
    ui.loadingIndicator.classList.remove("hidden");
    
    await camera.startCamera();
    activeTracker = quizEngine.trackingMode === "hand" ? handTracker : headTracker;
    await activeTracker.initialize();
    
    setupTrackerCallbacks();

    ui.loadingIndicator.classList.add("hidden");
    startNextQuestion();
  });

  ui.btnExitGame.addEventListener("click", () => {
    if (confirm("Are you sure you want to exit the quiz? Your current progress will be lost.")) {
      if (questionTimerInterval) clearInterval(questionTimerInterval);
      camera.stopCamera();
      if (activeTracker) activeTracker.stopDetection();
      ui.showScreen("setup");
    }
  });
}

function refreshLibrary() {
  ui.renderLibrary(
    (item) => {
      // Load
      ui.numQuestionsInput.value = item.setup.questions.length.toString();
      ui.numOptionsInput.value = item.setup.questions[0].options.length.toString();
      ui.trackingModeInput.value = item.setup.mode || "face";
      ui.timeLimitInput.value = item.setup.timeLimit?.toString() || "10";
      
      ui.generateSetupFields(item.setup.questions.length, item.setup.questions[0].options.length);
      
      const blocks = ui.questionsContainer.querySelectorAll(".q-block");
      item.setup.questions.forEach((q: any, i: number) => {
        if (blocks[i]) {
          (blocks[i].querySelector(".q-text") as HTMLInputElement).value = q.question;
          const opts = blocks[i].querySelectorAll(".q-opt") as NodeListOf<HTMLInputElement>;
          q.options.forEach((opt: string, oIdx: number) => {
            if (opts[oIdx]) opts[oIdx].value = opt;
          });
          (blocks[i].querySelector(".q-correct") as HTMLSelectElement).value = q.correctIndex.toString();
        }
      });
    },
    (id) => {
      // Delete
      let lib = ui.getLibraryFromStorage();
      lib = lib.filter(i => i.id !== id);
      ui.saveLibraryToStorage(lib);
      refreshLibrary();
    },
    (id, newName) => {
      // Rename
      let lib = ui.getLibraryFromStorage();
      const target = lib.find(i => i.id === id);
      if (target) {
        target.name = newName;
        ui.saveLibraryToStorage(lib);
        refreshLibrary();
      }
    }
  );
}

let activeTracker: any = null;
let questionTimerInterval: any = null;
let timeLeft = 0;

function setupTrackerCallbacks() {
  if (!activeTracker) return;

  activeTracker.onTiltProgress = (dir: any, progress: any) => {
    ui.updateProgress(progress, dir);
  };

  activeTracker.onTiltConfirmed = async (dir: any) => {
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    const selectedIndex = dir;
    // 1. Capture photo
    const imageBase64 = camera.captureImage();
    
    // 2. Evaluate answer
    const isCorrect = quizEngine.answerCurrent(selectedIndex);
    
    // 3. Store result
    resultManager.addResult({
      questionIndex: quizEngine.getCurrentIndex(),
      selectedIndex: selectedIndex,
      correct: isCorrect,
      image: imageBase64
    });

    // 4. Show Feedback
    ui.showFeedback(isCorrect);
    
    // 5. Briefly pause processing to let user see feedback (1.5s)
    activeTracker.stopDetection();
    await new Promise((r) => setTimeout(r, 1500));
    
    // 6. Next Question or Finish
    if (quizEngine.nextQuestion()) {
      startNextQuestion();
    } else {
      finishGame();
    }
  };
}
function startNextQuestion() {
  const q = quizEngine.getCurrentQuestion();
  if (q && activeTracker) {
    ui.updatePlayScreen(q, quizEngine.getCurrentIndex(), quizEngine.getTotalQuestions(), quizEngine.getScore());
    activeTracker.startDetection();

    if (questionTimerInterval) clearInterval(questionTimerInterval);
    
    if (quizEngine.timeLimit > 0) {
      timeLeft = quizEngine.timeLimit;
      ui.updateTimer(timeLeft);
      ui.showTimer(true);
      
      questionTimerInterval = setInterval(() => {
        timeLeft--;
        ui.updateTimer(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(questionTimerInterval);
          if (activeTracker) activeTracker.stopDetection();
          handleTimeout();
        }
      }, 1000);
    } else {
      ui.showTimer(false);
    }
  }
}

async function handleTimeout() {
  const imageBase64 = camera.captureImage();
  const isCorrect = quizEngine.answerCurrent(-1); // -1 is guaranteed wrong
  resultManager.addResult({
    questionIndex: quizEngine.getCurrentIndex(),
    selectedIndex: -1,
    correct: isCorrect, // false
    image: imageBase64
  });

  ui.showFeedback(false);
  await new Promise(r => setTimeout(r, 1500));
  
  if (quizEngine.nextQuestion()) {
    startNextQuestion();
  } else {
    finishGame();
  }
}

function finishGame() {
  if (questionTimerInterval) clearInterval(questionTimerInterval);
  camera.stopCamera();
  if (activeTracker) activeTracker.stopDetection();
  ui.showScreen("result");
  ui.showResults(resultManager.getResults(), quizEngine.getQuestions(), quizEngine.getScore());
}

// Start app
init();
