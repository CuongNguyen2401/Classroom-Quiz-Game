import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { camera } from "./camera";

export type TiltDirection = "left" | "right" | "center";

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
  public onTiltConfirmed: (direction: "left" | "right") => void = () => {};

  async initialize() {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
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
    if (!this.isDetecting || !this.faceLandmarker || !camera.videoElement) {
      return;
    }

    let startTimeMs = performance.now();
    
    if (camera.videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = camera.videoElement.currentTime;
      const results = this.faceLandmarker.detectForVideo(camera.videoElement, startTimeMs);
      
      this.drawLandmarks();
      this.processLandmarks(results);
    }

    if (this.isDetecting) {
      requestAnimationFrame(this.detect.bind(this));
    }
  }

  private drawLandmarks() {
    const ctx = camera.canvasCtx;
    ctx.save();
    ctx.clearRect(0, 0, camera.canvasElement.width, camera.canvasElement.height);
    
    // Canvas is css-mirrored, but MediaPipe coordinates are normalized 0-1
    // We no longer draw the face mesh based on user preference
    // to only show the video.

    ctx.restore();
  }

  private processLandmarks(results: any) {
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
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
    
    // If user tilts physical right: imageLeftEye.y increases, imageRightEye.y decreases => dy < 0
    // If user tilts physical left: imageLeftEye.y decreases, imageRightEye.y increases => dy > 0
    const rollAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Sensitivity Thresholds
    const ROLL_THRESHOLD = 12;  // degrees (increased for lower sensitivity)
    
    // Physical Left Movement (rolling)
    const isPhysicalLeft = rollAngle > ROLL_THRESHOLD;
    
    // Physical Right Movement (rolling)
    const isPhysicalRight = rollAngle < -ROLL_THRESHOLD;
    
    let tiltIndicated: TiltDirection = "center";
    
    // Direct mapping: physical movement perfectly matches UI elements.
    if (isPhysicalLeft && !isPhysicalRight) {
      tiltIndicated = "left"; 
    } else if (isPhysicalRight && !isPhysicalLeft) {
      tiltIndicated = "right"; 
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
          this.onTiltConfirmed(detected as "left" | "right");
        }
      } else {
        this.onTiltProgress("center", 0);
      }
    }
  }
}

export const headTracker = new HeadTracker();
