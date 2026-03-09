import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { camera } from "./camera";
import { quizEngine } from "./quizEngine";

export type TiltDirection = number | "center";

export class HeadTracker {
  private faceLandmarker: FaceLandmarker | null = null;
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
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    if (!this.faceLandmarker) {
      this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: false,
        runningMode: this.runningMode,
        numFaces: 1
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
      
      if (this.faceLandmarker) {
        const results = this.faceLandmarker.detectForVideo(camera.videoElement, startTimeMs);
        this.processFaceLandmarks(results);
      }
    }

    if (this.isDetecting) {
      requestAnimationFrame(this.detect.bind(this));
    }
  }

  private processFaceLandmarks(results: any) {
    const q = quizEngine.getCurrentQuestion();
    if (!q || q.options.length < 2 || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      this.updateDirection("center");
      return;
    }

    const marks = results.faceLandmarks[0];
    
    // To handle roll (tilting) robustly:
    const eye1 = marks[33];
    const eye2 = marks[263];
    
    // In the raw camera image, the left side of the image has smaller X.
    // The user's physical right eye appears on the left side of the raw image.
    const isEye1LeftOfImage = eye1.x < eye2.x;
    const imageLeftEye = isEye1LeftOfImage ? eye1 : eye2; // user's physical right eye
    const imageRightEye = isEye1LeftOfImage ? eye2 : eye1; // user's physical left eye
    
    // 1. Roll Calculation (Tilting)
    const dx = imageRightEye.x - imageLeftEye.x; // always positive
    const dy = imageRightEye.y - imageLeftEye.y; 
    
    const rollAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // 2. Pitch Calculation (Up / Down)
    const topHead = marks[10];
    const chin = marks[152];
    const nose = marks[1];
    
    const faceH = chin.y - topHead.y;
    const noseRatio = (nose.y - topHead.y) / faceH;
    
    // Sensitivity Thresholds
    const ROLL_THRESHOLD = 12;  // degrees
    // Normal noseRatio is ~0.49. Lower = Up. Higher = Down.
    const LOOK_UP_THRESHOLD = 0.43;
    const LOOK_DOWN_THRESHOLD = 0.58;
    
    const isPhysicalLeft = rollAngle > ROLL_THRESHOLD;
    const isPhysicalRight = rollAngle < -ROLL_THRESHOLD;
    const isLookingUp = noseRatio < LOOK_UP_THRESHOLD;
    const isLookingDown = noseRatio > LOOK_DOWN_THRESHOLD;
    
    let tiltIndicated: TiltDirection = "center";
    
    if (q.options.length === 2) {
      if (isPhysicalLeft) tiltIndicated = 0; 
      else if (isPhysicalRight) tiltIndicated = 1; 
    } else if (q.options.length === 3) {
      if (isPhysicalLeft) tiltIndicated = 0; 
      else if (isLookingUp) tiltIndicated = 1; 
      else if (isPhysicalRight) tiltIndicated = 2; 
    } else if (q.options.length === 4) {
      if (isPhysicalLeft) tiltIndicated = 0; 
      else if (isLookingUp) tiltIndicated = 1; 
      else if (isPhysicalRight) tiltIndicated = 2; 
      else if (isLookingDown) tiltIndicated = 3; 
    }
    
    this.updateDirection(tiltIndicated);
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

export const headTracker = new HeadTracker();
