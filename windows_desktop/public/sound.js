/**
 * Sound Design Engine for POS - Web Audio API (100% Offline, Zero Latency)
 * High-end corporate acoustic feedback for touch / click interactions
 */
(function() {
  let audioCtx = null;
  let isMuted = localStorage.getItem('pos_sound_muted') === 'true';

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  window.playUiSound = function(type) {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'nav') {
        // Soft, subtle high-end click / pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.045);
      } else if (type === 'cart') {
        // Delicate harmonic chime when adding an item
        [523.25, 659.25].forEach((freq, i) => { // C5, E5
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.02);

          gain.gain.setValueAtTime(0.09, now + i * 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.02 + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.02);
          osc.stop(now + i * 0.02 + 0.09);
        });
      } else if (type === 'checkout') {
        // Rich, celebratory cash register / validation harmony
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);

          gain.gain.setValueAtTime(0.12, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.16);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.18);
        });
      } else if (type === 'error') {
        // Discreet double warning tap
        [220, 180].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0.08, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.05);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.06);
        });
      }
    } catch (e) {
      // Audio playback fails gracefully if blocked by autoplay policy
    }
  };

  window.toggleSound = function() {
    isMuted = !isMuted;
    localStorage.setItem('pos_sound_muted', isMuted);
    updateSoundButtonUi();
    if (!isMuted) {
      window.playUiSound('cart');
    }
  };

  function updateSoundButtonUi() {
    const btn = document.getElementById('btnSoundToggle');
    if (!btn) return;
    if (isMuted) {
      btn.classList.add('muted');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0a7 7 0 0 1-.5 2.5"/></svg>
        <span>Son : Muet</span>
      `;
      btn.title = 'Sons désactivés (Cliquez pour activer)';
    } else {
      btn.classList.remove('muted');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        <span>Son : Actif</span>
      `;
      btn.title = 'Sons activés (Cliquez pour couper)';
    }
  }

  window.initSoundUi = function() {
    updateSoundButtonUi();
    const btn = document.getElementById('btnSoundToggle');
    if (btn) {
      btn.addEventListener('click', window.toggleSound);
    }
  };
})();
