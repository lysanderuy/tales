let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (context) return context;
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
  try {
    context = new window.AudioContext();
  } catch {
    return null;
  }
  return context;
}

// Browsers only allow audio after a user gesture, so call this from click handlers.
export function unlockAudio(): void {
  const audio = getContext();
  if (!audio || audio.state !== "suspended") return;
  audio.resume().catch(() => {});
}

const FADE_SECONDS = 1.2;

function tone(audio: AudioContext, frequency: number, peak: number): void {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + FADE_SECONDS);

  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + FADE_SECONDS + 0.05);
}

export function playChime(): void {
  try {
    const audio = getContext();
    if (!audio || audio.state !== "running") return;
    tone(audio, 880, 0.18);
    tone(audio, 1320, 0.06);
  } catch {
    // Audio is a nicety; a failure must never reach the timer.
  }
}
