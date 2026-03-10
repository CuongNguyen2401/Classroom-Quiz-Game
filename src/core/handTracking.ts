import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { camera } from "./camera";
import { quizEngine } from "./quizEngine";

export type TiltDirection = number | "center";

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private runningMode: "IMAGE" | "VIDEO" = "VIDEO";
  private lastVideoTime = -1;
  private isDetecting = false;
  
  // State for noise filter
  private currentDirection: TiltDirection = "center";
  private directionStartTime: number = 0;
  private readonly STABLE_THRESHOLD_MS = 1000; // 1 second

  public onTiltProgress: (direction: TiltDirection, progressPct: number) => void = () => {};
  public onTiltConfirmed: (direction: number) => void = () => {};

  async initialize() {
    if (!this.handLandmarker) {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      this.handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: this.runningMode,
        numHands: 1
      });
    }
  }

  startDetection() {
    this.isDetecting = true;
    this.resetTimer();
    requestAnimationFrame(this.detect.bind(this));
  }

  stopDetection() {
    this.isDetecting = false;
    this.resetTimer();
  }

  resetTimer() {
    this.currentDirection = "center";
    this.directionStartTime = 0;
    this.onTiltProgress("center", 0);
  }

  private detect() {
    if (!this.isDetecting || !camera.videoElement) {
      return;
    }

    let startTimeMs = performance.now();
    
    if (camera.videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = camera.videoElement.currentTime;
      
      if (this.handLandmarker) {
        const results = this.handLandmarker.detectForVideo(camera.videoElement, startTimeMs);
        this.processHandLandmarks(results);
      }
    }

    if (this.isDetecting) {
      requestAnimationFrame(this.detect.bind(this));
    }
  }

  private processHandLandmarks(results: any) {
    if (!results.landmarks || results.landmarks.length === 0) {
      this.updateDirection("center");
      return;
    }
    const marks = results.landmarks[0];
    
    // Count extended fingers
    let fingers = 0;
    if (marks[8].y < marks[6].y) fingers++;  // Index
    if (marks[12].y < marks[10].y) fingers++; // Middle
    if (marks[16].y < marks[14].y) fingers++; // Ring
    if (marks[20].y < marks[18].y) fingers++; // Pinky
    
    // Validate bounds against current question options
    const q = quizEngine.getCurrentQuestion();
    if (!q) return;
    
    if (fingers >= 1 && fingers <= q.options.length) {
      this.updateDirection(fingers - 1); // Option 1 -> Index 0
    } else {
      this.updateDirection("center");
    }
  }

  private updateDirection(detected: TiltDirection) {
    const now = performance.now();
    
    if (detected !== this.currentDirection) {
      // Changed direction
      this.currentDirection = detected;
      this.directionStartTime = now;
      this.onTiltProgress("center", 0);
    } else {
      if (detected !== "center") {
        const elapsed = now - this.directionStartTime;
        let progress = Math.min(elapsed / this.STABLE_THRESHOLD_MS, 1.0);
        
        this.onTiltProgress(detected, progress);
        
        if (progress >= 1.0 && this.isDetecting) {
          this.isDetecting = false;
          // Trigger confirmed choice
          this.onTiltConfirmed(detected as number);
        }
      } else {
        this.onTiltProgress("center", 0);
      }
    }
  }
}

export const handTracker = new HandTracker();
