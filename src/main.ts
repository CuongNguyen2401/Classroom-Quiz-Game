import { camera } from "./camera";
import { headTracker } from "./headTracking";
import { quizEngine } from "./quizEngine";
import { resultManager } from "./resultManager";
import { ui } from "./ui";
import { exportResultsToExcel } from "./excelExport";

async function init() {
  ui.showScreen("setup");

  // Setup Screen Listeners
  ui.btnGenerate.addEventListener("click", () => {
    const num = parseInt(ui.numQuestionsInput.value);
    if (!isNaN(num) && num > 0) {
      ui.generateSetupFields(num);
    }
  });

  ui.btnStartGame.addEventListener("click", async () => {
    const qData = ui.getSetupData();
    if (!qData) return;

    quizEngine.setQuestions(qData);
    resultManager.clearResults();
    
    ui.showScreen("play");
    ui.loadingIndicator.classList.remove("hidden");
    
    await camera.startCamera();
    await headTracker.initialize();
    
    ui.loadingIndicator.classList.add("hidden");
    startNextQuestion();
  });

  // Play Tracking Callbacks
  headTracker.onTiltProgress = (dir, progress) => {
    ui.updateProgress(progress, dir);
  };

  headTracker.onTiltConfirmed = async (dir) => {
    // 1. Capture photo
    const imageBase64 = camera.captureImage();
    
    // 2. Evaluate answer
    const isCorrect = quizEngine.answerCurrent(dir);
    
    // 3. Store result
    resultManager.addResult({
      questionIndex: quizEngine.getCurrentIndex(),
      selected: dir,
      correct: isCorrect,
      image: imageBase64
    });

    // 4. Show Feedback
    ui.showFeedback(isCorrect);
    
    // 5. Briefly pause processing to let user see feedback (1.5s)
    headTracker.stopDetection();
    await new Promise(r => setTimeout(r, 1500));
    
    // 6. Next Question or Finish
    if (quizEngine.nextQuestion()) {
      startNextQuestion();
    } else {
      finishGame();
    }
  };

  // Result Screen Listeners
  ui.btnExportExcel.addEventListener("click", () => {
    exportResultsToExcel();
  });

  ui.btnRestart.addEventListener("click", () => {
    ui.showScreen("setup");
  });

  ui.btnRetry.addEventListener("click", async () => {
    const qs = quizEngine.getQuestions();
    quizEngine.setQuestions(qs);
    resultManager.clearResults();
    
    ui.showScreen("play");
    ui.loadingIndicator.classList.remove("hidden");
    
    await camera.startCamera();
    await headTracker.initialize();
    
    ui.loadingIndicator.classList.add("hidden");
    startNextQuestion();
  });
}

function startNextQuestion() {
  const q = quizEngine.getCurrentQuestion();
  if (q) {
    ui.updatePlayScreen(q, quizEngine.getCurrentIndex(), quizEngine.getTotalQuestions(), quizEngine.getScore());
    headTracker.startDetection();
  }
}

function finishGame() {
  camera.stopCamera();
  headTracker.stopDetection();
  ui.showScreen("result");
  ui.showResults(resultManager.getResults(), quizEngine.getQuestions(), quizEngine.getScore());
}

// Start app
init();
