export class CameraControl {
  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
  canvasCtx: CanvasRenderingContext2D;
  stream: MediaStream | null = null;

  constructor(videoElementId: string, canvasElementId: string) {
    this.videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
    this.canvasElement = document.getElementById(canvasElementId) as HTMLCanvasElement;
    this.canvasCtx = this.canvasElement.getContext("2d")!;
  }

  async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      this.videoElement.srcObject = this.stream;
      return new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          
          // Match canvas dimensions to video
          this.canvasElement.width = this.videoElement.videoWidth;
          this.canvasElement.height = this.videoElement.videoHeight;
          resolve();
        };
      });
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Please allow webcam access to use the game.");
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.videoElement.srcObject = null;
  }

  captureImage(): string {
    const w = this.canvasElement.width;
    const h = this.canvasElement.height;
    
    // We want to capture what user sees (which is mirrored)
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    
    // Mirror drawing
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.videoElement, 0, 0, w, h);
    
    return ctx.canvas.toDataURL("image/jpeg", 0.7);
  }
}

export const camera = new CameraControl("webcam", "landmark-canvas");
