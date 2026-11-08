/**
 * Notification Sound & Audio Feedback Utility
 * Uses Web Audio API for crystal-clear, zero-dependency sound chimes.
 */

const NOTIF_SOUND_KEY = 'notification_sound_enabled';

export const isNotificationSoundEnabled = (): boolean => {
  try {
    const val = localStorage.getItem(NOTIF_SOUND_KEY);
    // Defaults to true if not set
    return val !== 'false';
  } catch {
    return true;
  }
};

export const setNotificationSoundEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(NOTIF_SOUND_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('notification-sound-change', { detail: enabled }));
  } catch (err) {
    console.warn('Failed to save notification sound preference', err);
  }
};

/**
 * Plays a pleasant synthesizer chime for alerts and notifications.
 * @param isUrgent true for Emergency/Alert types (higher pitch, rapid double-tone)
 * @param forcePlay true to ignore user preference (used for testing in settings)
 */
export const playNotificationSound = (isUrgent: boolean = false, forcePlay: boolean = false): void => {
  if (!forcePlay && !isNotificationSoundEnabled()) {
    return;
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (isUrgent) {
      // Urgent / Emergency Chime: Two crisp urgent pulses
      const pulses = [
        { freq: 880.0, time: 0.00 },
        { freq: 1174.66, time: 0.12 },
        { freq: 880.0, time: 0.26 },
        { freq: 1174.66, time: 0.38 },
      ];

      pulses.forEach(p => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(p.freq, now + p.time);

        gain.gain.setValueAtTime(0, now + p.time);
        gain.gain.linearRampToValueAtTime(0.3, now + p.time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.time + 0.11);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + p.time);
        osc.stop(now + p.time + 0.12);
      });
    } else {
      // Standard Pleasant Bell Chime: Gentle 3-note harmonic arpeggio (F5 -> A5 -> D6)
      const chord = [
        { freq: 698.46, delay: 0.00, duration: 0.35, gain: 0.22 },
        { freq: 880.00, delay: 0.08, duration: 0.45, gain: 0.25 },
        { freq: 1174.66, delay: 0.16, duration: 0.60, gain: 0.28 },
      ];

      chord.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.delay);

        gain.gain.setValueAtTime(0, now + note.delay);
        gain.gain.linearRampToValueAtTime(note.gain, now + note.delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.delay + note.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.delay);
        osc.stop(now + note.delay + note.duration + 0.05);
      });
    }
  } catch (err) {
    console.warn('Web Audio playback error:', err);
  }
};

