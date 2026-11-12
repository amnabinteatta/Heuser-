/**
 * ============================================================================
 * THE CREATIVE LAB — UNCONVENTIONAL PERSONAL PORTFOLIO
 * Author: Amna Binte Atta
 * Architecture: Vanilla JavaScript (ES6+)
 * Compatibility: Static GitHub Pages (No build tools or backends needed)
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONSTANTS & SYSTEM CONFIGURATION
     ========================================================================== */
  
  // PRIMARY EXTERNAL PROJECT LINK (HOMEWORK 7 / HOMEWORK 6 REPOSITORY)
  // [STUDENT NOTE]: Replace 'YOUR-USERNAME' with your actual GitHub username
  const EXTERNAL_PROJECT_URL = 'https://YOUR-USERNAME.github.io/Heuser/CS_CRP/Homework_6/';

  // CHAMBER IDENTIFIERS MAPPING
  const CHAMBERS = {
    '1': 'chamber-identity',
    '2': 'chamber-workshop',
    '3': 'chamber-trophy',
    '4': 'chamber-future',
    '5': 'chamber-transmit'
  };

  // PALETTE FOR DYNAMIC ACCENTS & PARTICLE BURSTS
  const COLORS = {
    purple: '#9B5DE5',
    lime: '#D4FF4F',
    coral: '#FF6B4A',
    lavender: '#C8B6FF',
    charcoal: '#17151F'
  };

  /* ==========================================================================
     2. STATE MANAGEMENT
     ========================================================================== */
  const state = {
    activeChamberId: null,
    audioEnabled: false,
    audioCtx: null,
    isLoaded: false
  };

  /* ==========================================================================
     3. DOM ELEMENT REFERENCES
     ========================================================================== */
  const elements = {
    preloader: document.getElementById('preloader-overlay'),
    preloaderProgress: document.getElementById('preloader-progress'),
    labEnvironment: document.getElementById('lab-environment'),
    ambientCanvas: document.getElementById('ambient-canvas'),
    audioToggleBtn: document.getElementById('audio-toggle-btn'),
    audioStateText: document.getElementById('audio-state-text'),
    srAnnouncements: document.getElementById('sr-announcements'),
    hudButtons: document.querySelectorAll('.hud-btn'),
    labObjectButtons: document.querySelectorAll('.lab-object-btn'),
    returnButtons: document.querySelectorAll('.lab-return-key'),
    backdropOverlays: document.querySelectorAll('.chamber-backdrop'),
    canvasTrigger: document.getElementById('lab-canvas-trigger'),
    hw7ProjectLink: document.getElementById('workshop-project-link'),
    hw7ExternalLink: document.getElementById('external-hw7-link')
  };

  /* ==========================================================================
     4. PRELOADER & LABORATORY INITIALIZATION
     ========================================================================== */
  function initializePreloader() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(revealLaboratory, 350);
      }
      if (elements.preloaderProgress) {
        elements.preloaderProgress.style.width = `${progress}%`;
      }
    }, 80);
  }

  function revealLaboratory() {
    if (elements.preloader) {
      elements.preloader.classList.add('fade-out');
      setTimeout(() => {
        elements.preloader.style.display = 'none';
        state.isLoaded = true;
        announceToScreenReader('Creative Laboratory Initialised. 5 interactive objects available.');
      }, 800);
    }
  }

  /* ==========================================================================
     5. PROCEDURAL AUDIO SYNTHESIZER (ZERO-DEPENDENCY WEB AUDIO API)
     ========================================================================== */
  function initAudioContext() {
    if (!state.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        state.audioCtx = new AudioContext();
      }
    }
  }

  function toggleAudio() {
    initAudioContext();
    if (!state.audioCtx) return;

    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }

    state.audioEnabled = !state.audioEnabled;
    elements.audioToggleBtn.setAttribute('aria-pressed', state.audioEnabled);
    elements.audioStateText.textContent = state.audioEnabled ? 'ON' : 'OFF';

    if (state.audioEnabled) {
      playTone(520, 'sine', 0.15, 0.08);
      announceToScreenReader('Laboratory procedural audio enabled.');
    } else {
      announceToScreenReader('Laboratory audio muted.');
    }
  }

  /**
   * Generates a soft synthesized futuristic chime
   */
  function playTone(freq, type = 'sine', duration = 0.2, volume = 0.08) {
    if (!state.audioEnabled || !state.audioCtx) return;
    try {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime);
      gain.gain.setValueAtTime(volume, state.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start();
      osc.stop(state.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback silent handling
    }
  }

  function playChamberChime(chamberId) {
    if (!state.audioEnabled) return;
    switch (chamberId) {
      case 'chamber-identity':
        playTone(330, 'triangle', 0.25, 0.1);
        setTimeout(() => playTone(440, 'sine', 0.3, 0.08), 80);
        break;
      case 'chamber-workshop':
        playTone(587, 'sawtooth', 0.15, 0.05);
        setTimeout(() => playTone(880, 'sine', 0.25, 0.06), 90);
        break;
      case 'chamber-trophy':
        playTone(659, 'sine', 0.2, 0.08);
        setTimeout(() => playTone(987, 'sine', 0.35, 0.08), 100);
        break;
      case 'chamber-future':
        playTone(440, 'sine', 0.4, 0.1);
        setTimeout(() => playTone(659, 'triangle', 0.4, 0.08), 120);
        break;
      case 'chamber-transmit':
        playTone(800, 'square', 0.1, 0.04);
        setTimeout(() => playTone(1200, 'square', 0.15, 0.04), 70);
        break;
      default:
        playTone(440, 'sine', 0.2, 0.08);
    }
  }

  /* ==========================================================================
     6. UNCONVENTIONAL NAVIGATION & CHAMBER SYSTEM
     ========================================================================== */
  
  /**
   * Opens the targeted chamber modal and manages focus
   */
  function openChamber(targetId, triggerElement = null) {
    const targetChamber = document.getElementById(targetId);
    if (!targetChamber) return;

    // Close any currently active chamber first
    if (state.activeChamberId && state.activeChamberId !== targetId) {
      closeChamber(state.activeChamberId, false);
    }

    state.activeChamberId = targetId;

    // Show chamber
    targetChamber.removeAttribute('hidden');
    // Force reflow for CSS transition
    void targetChamber.offsetWidth;
    targetChamber.classList.add('active-chamber');

    // Blur main lab background for focus
    if (elements.labEnvironment) {
      elements.labEnvironment.classList.add('blurred-bg');
    }

    // Play procedural activation sound
    playChamberChime(targetId);

    // Micro particle burst at triggering element location
    if (triggerElement) {
      const rect = triggerElement.getBoundingClientRect();
      createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, getChamberColor(targetId));
    }

    // Focus management for accessibility
    const returnKey = targetChamber.querySelector('.lab-return-key');
    if (returnKey) {
      setTimeout(() => returnKey.focus(), 150);
    }

    // Screen reader announcement
    const chamberHeading = targetChamber.querySelector('.chamber-title');
    const titleText = chamberHeading ? chamberHeading.textContent : 'Chamber';
    announceToScreenReader(`Opened ${titleText}. Press Escape or use the Return Key to go back to the laboratory.`);
  }

  /**
   * Closes active chamber and returns focus to the main laboratory
   */
  function closeChamber(chamberId = state.activeChamberId, restoreFocus = true) {
    if (!chamberId) return;

    const chamber = document.getElementById(chamberId);
    if (chamber) {
      chamber.classList.remove('active-chamber');
      setTimeout(() => {
        chamber.setAttribute('hidden', '');
      }, 300);
    }

    state.activeChamberId = null;

    // Restore laboratory environment clarity
    if (elements.labEnvironment) {
      elements.labEnvironment.classList.remove('blurred-bg');
    }

    // Play subtle return tone
    playTone(260, 'sine', 0.2, 0.06);

    // Return focus to corresponding object button
    if (restoreFocus) {
      const originatingBtn = document.querySelector(`[data-target="${chamberId}"]`);
      if (originatingBtn) {
        originatingBtn.focus();
      } else if (elements.labEnvironment) {
        elements.labEnvironment.focus();
      }
    }

    announceToScreenReader('Returned to the main Creative Laboratory.');
  }

  function getChamberColor(chamberId) {
    switch (chamberId) {
      case 'chamber-identity': return COLORS.purple;
      case 'chamber-workshop': return COLORS.lime;
      case 'chamber-trophy': return COLORS.coral;
      case 'chamber-future': return COLORS.coral;
      case 'chamber-transmit': return COLORS.lavender;
      default: return COLORS.lime;
    }
  }

  /* ==========================================================================
     7. ACCESSIBILITY & KEYBOARD CONTROLS
     ========================================================================== */
  function announceToScreenReader(message) {
    if (elements.srAnnouncements) {
      elements.srAnnouncements.textContent = message;
    }
  }

  function handleKeyboardShortcuts(event) {
    // 1. ESCAPE KEY: Return from any chamber
    if (event.key === 'Escape' && state.activeChamberId) {
      event.preventDefault();
      closeChamber(state.activeChamberId);
      return;
    }

    // 2. NUMBER KEYS 1-5: Direct Teleport (when no input is focused)
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea') return;

    if (['1', '2', '3', '4', '5'].includes(event.key)) {
      const targetChamberId = CHAMBERS[event.key];
      if (targetChamberId) {
        event.preventDefault();
        const triggerBtn = document.querySelector(`[data-target="${targetChamberId}"]`);
        openChamber(targetChamberId, triggerBtn);
      }
    }
  }

  /* ==========================================================================
     8. AMBIENT CANVAS & DYNAMIC PARTICLES ENGINE
     ========================================================================== */
  const canvasState = {
    ctx: null,
    width: window.innerWidth,
    height: window.innerHeight,
    particles: [],
    bursts: [],
    mouse: { x: -1000, y: -1000 }
  };

  class Particle {
    constructor(w, h) {
      this.reset(w, h);
    }
    reset(w, h) {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 1.8 + 0.6;
      this.alpha = Math.random() * 0.5 + 0.2;
      this.color = Math.random() > 0.6 ? COLORS.purple : (Math.random() > 0.5 ? COLORS.lavender : COLORS.lime);
    }
    update(w, h) {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) this.x = w;
      if (this.x > w) this.x = 0;
      if (this.y < 0) this.y = h;
      if (this.y > h) this.y = 0;
    }
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
    }
  }

  class BurstParticle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.alpha = 1;
      this.decay = Math.random() * 0.03 + 0.015;
      this.radius = Math.random() * 3 + 1.5;
      this.color = color;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }
    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fill();
    }
  }

  function initAmbientCanvas() {
    if (!elements.ambientCanvas) return;
    canvasState.ctx = elements.ambientCanvas.getContext('2d');
    resizeCanvas();

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particleCount = prefersReducedMotion ? 15 : (window.innerWidth < 768 ? 35 : 65);

    canvasState.particles = [];
    for (let i = 0; i < particleCount; i++) {
      canvasState.particles.push(new Particle(canvasState.width, canvasState.height));
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', (e) => {
      canvasState.mouse.x = e.clientX;
      canvasState.mouse.y = e.clientY;
    });

    requestAnimationFrame(renderCanvasLoop);
  }

  function resizeCanvas() {
    if (!elements.ambientCanvas) return;
    canvasState.width = window.innerWidth;
    canvasState.height = window.innerHeight;
    elements.ambientCanvas.width = canvasState.width;
    elements.ambientCanvas.height = canvasState.height;
  }

  function createParticleBurst(x, y, color = COLORS.lime) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      canvasState.bursts.push(new BurstParticle(x, y, color));
    }
  }

  function renderCanvasLoop() {
    const ctx = canvasState.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasState.width, canvasState.height);

    // Draw ambient particles
    for (let i = 0; i < canvasState.particles.length; i++) {
      const p = canvasState.particles[i];
      p.update(canvasState.width, canvasState.height);
      p.draw(ctx);

      // Subtle proximity connections
      for (let j = i + 1; j < canvasState.particles.length; j++) {
        const p2 = canvasState.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = COLORS.lavender;
          ctx.globalAlpha = (1 - dist / 90) * 0.12;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw particle bursts
    for (let i = canvasState.bursts.length - 1; i >= 0; i--) {
      const b = canvasState.bursts[i];
      b.update();
      b.draw(ctx);
      if (b.alpha <= 0) {
        canvasState.bursts.splice(i, 1);
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(renderCanvasLoop);
  }

  /* ==========================================================================
     9. EVENT LISTENERS BINDING
     ========================================================================== */
  function bindEvents() {
    // Audio toggle
    if (elements.audioToggleBtn) {
      elements.audioToggleBtn.addEventListener('click', toggleAudio);
    }

    // 5 Interactive Laboratory Object Buttons
    elements.labObjectButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = btn.getAttribute('data-target');
        openChamber(targetId, btn);
      });

      // Subtle hover tone
      btn.addEventListener('mouseenter', () => {
        playTone(400, 'sine', 0.08, 0.03);
      });
    });

    // Quick HUD Teleport Buttons
    elements.hudButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        openChamber(targetId, btn);
      });
    });

    // Return Keys (within chambers)
    elements.returnButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-close');
        closeChamber(targetId);
      });
    });

    // Chamber Backdrops (click outside to close)
    elements.backdropOverlays.forEach(backdrop => {
      backdrop.addEventListener('click', () => {
        const targetId = backdrop.getAttribute('data-close');
        closeChamber(targetId);
      });
    });

    // Workshop Canvas Trigger Demo
    if (elements.canvasTrigger) {
      elements.canvasTrigger.addEventListener('click', (e) => {
        const rect = elements.canvasTrigger.getBoundingClientRect();
        createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, COLORS.coral);
        playTone(620, 'sine', 0.25, 0.08);
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', handleKeyboardShortcuts);
  }

  /* ==========================================================================
     10. INITIALIZATION ENTRY POINT
     ========================================================================== */
  function init() {
    initializePreloader();
    initAmbientCanvas();
    bindEvents();
    
    // Log friendly instructions in devtools for the student/evaluator
    console.log(
      '%c[THE CREATIVE LAB] — Amna Binte Atta',
      'color: #D4FF4F; font-size: 14px; font-weight: bold; background: #17151F; padding: 6px 12px; border-radius: 4px;'
    );
    console.log(
      '%cHomework 7 External Link Target: ' + EXTERNAL_PROJECT_URL,
      'color: #C8B6FF; font-size: 11px;'
    );
  }

  // Run once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
