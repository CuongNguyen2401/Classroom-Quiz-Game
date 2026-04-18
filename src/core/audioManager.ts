import { SFX_CORRECT, SFX_INCORRECT } from 'virtual:sfx-manifest';

export type TrackDef = {
  label: string;
  emoji: string;
  genre: string;
  src: string;
};

export const TRACKS: TrackDef[] = [
  {
    label: 'Pixel Peeker Polka',
    emoji: '🎮',
    genre: 'Upbeat / Fun',
    src: '/music/pixel-peeker-polka.mp3',
  },
  {
    label: 'Scheming Weasel',
    emoji: '🎪',
    genre: 'Playful / Light',
    src: '/music/scheming-weasel.mp3',
  },
  {
    label: 'Monkeys Spinning Monkeys',
    emoji: '🐒',
    genre: 'Quirky / Comedy',
    src: '/music/monkeys-spinning-monkeys.mp3',
  },
  {
    label: 'Happy Bee',
    emoji: '🐝',
    genre: 'Cheerful / Bright',
    src: '/music/happy-bee.mp3',
  },
  {
    label: 'Cipher',
    emoji: '🔐',
    genre: 'Mysterious / Focus',
    src: '/music/cipher.mp3',
  },
];

const pickRandom = (arr: string[]): string | null =>
  arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;

class AudioManager {
  private bgAudio: HTMLAudioElement | null = null;
  private previewAudio: HTMLAudioElement | null = null;
  private previewTimeout: ReturnType<typeof setTimeout> | null = null;
  private bgVolumePct = 40;
  selectedTrackIndex = 0;

  private createAudio(src: string, loop = false): HTMLAudioElement {
    const a = new Audio(src);
    a.loop = loop;
    a.volume = this.bgVolumePct / 100;
    return a;
  }

  startBg() {
    this.stopBg();
    const track = TRACKS[this.selectedTrackIndex];
    this.bgAudio = this.createAudio(track.src, true);
    this.bgAudio.play().catch(() => {});
  }

  stopBg() {
    if (this.bgAudio) {
      this.bgAudio.pause();
      this.bgAudio.src = '';
      this.bgAudio = null;
    }
  }

  selectTrack(index: number) {
    this.selectedTrackIndex = index;
    if (this.bgAudio) this.startBg();
  }

  startPreview(index: number, onEnd: () => void) {
    this.stopPreview();
    const track = TRACKS[index];
    this.previewAudio = this.createAudio(track.src, true);
    this.previewAudio.play().catch(() => {});
    this.previewTimeout = setTimeout(() => {
      this.stopPreview();
      onEnd();
    }, 15000);
  }

  stopPreview() {
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
      this.previewTimeout = null;
    }
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio.src = '';
      this.previewAudio = null;
    }
  }

  setBgVolume(pct: number) {
    this.bgVolumePct = pct;
    if (this.bgAudio) this.bgAudio.volume = pct / 100;
    if (this.previewAudio) this.previewAudio.volume = pct / 100;
  }

  playSfxCorrect() {
    const src = pickRandom(SFX_CORRECT);
    if (!src) return;
    const a = new Audio(src);
    a.volume = Math.min(this.bgVolumePct / 100 + 0.3, 1);
    a.play().catch(() => {});
  }

  playSfxWrong() {
    const src = pickRandom(SFX_INCORRECT);
    if (!src) return;
    const a = new Audio(src);
    a.volume = Math.min(this.bgVolumePct / 100 + 0.3, 1);
    a.play().catch(() => {});
  }
}

export const audioManager = new AudioManager();
