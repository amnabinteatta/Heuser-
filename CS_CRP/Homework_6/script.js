/**
 * Neon Sequence - Stage 4: State Machine & Storage Engine
 * 
 * Preserves Stage 1 core logic, Stage 2 visual styling, and Stage 3 Web Audio synthesis.
 * Adds persistent storage (localStorage) for high score and mute preferences,
 * formal finite-state machine (IDLE, PLAYBACK, PLAYER_TURN, ROUND_SUCCESS, PAUSED, GAME_OVER),
 * full pause/resume controls, restart support, and selective data reset with confirmation.
 */

// 1. GAME STATES (Finite State Machine Enums)
const GAME_STATES = {
  IDLE: 'IDLE',
  PLAYBACK: 'PLAYBACK',
  PLAYER_TURN: 'PLAYER_TURN',
  ROUND_SUCCESS: 'ROUND_SUCCESS',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

// 2. CONFIGURATION & CONSTANTS
const CONFIG = {
  // Available button element IDs
  BUTTON_IDS: ['btn-green', 'btn-red', 'btn-yellow', 'btn-blue'],

  // Timing configuration in milliseconds
  TIMING: {
    STEP_DURATION: 400,        // How long each button stays lit during playback
    STEP_GAP: 250,             // Pause between consecutive button flashes
    ROUND_START_DELAY: 800,    // Delay before sequence playback starts
    INTER_ROUND_DELAY: 1000,   // Delay after round success before next round begins
    INPUT_FLASH_DURATION: 200, // Direct visual feedback duration when player clicks a button
    RESUME_DELAY: 600          // Delay before resuming sequence playback after pause
  }
};

// Storage Keys (Namespaced to prevent collisions)
const STORAGE_KEYS = {
  HIGH_SCORE: 'neon_seq_high_score',
  MUTED: 'neon_seq_muted'
};

// Musical Frequencies for the 4 Buttons (Harmonic Pentatonic Scale)
const BUTTON_FREQUENCIES = {
  'btn-green': 261.63,  // Cyan Quadrant -> C4
  'btn-red': 329.63,    // Pink Quadrant -> E4
  'btn-yellow': 392.00, // Yellow Quadrant -> G4
  'btn-blue': 523.25    // Purple Quadrant -> C5
};

// 3. DEFENSIVE STORAGE ENGINE (with In-Memory Fallback)
const memoryStorageCache = {};

/**
 * Safely retrieves an item from localStorage or falls back to in-memory cache.
 * @param {string} key
 * @returns {string|null}
 */
function safeStorageGet(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(key);
      if (item !== null) return item;
    }
  } catch (err) {
    // SecurityError or restricted environment
  }
  return Object.prototype.hasOwnProperty.call(memoryStorageCache, key)
    ? memoryStorageCache[key]
    : null;
}

/**
 * Safely sets an item in localStorage and updates in-memory cache.
 * @param {string} key
 * @param {string} value
 */
function safeStorageSet(key, value) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (err) {
    // QuotaExceededError or storage disabled
  }
  memoryStorageCache[key] = value;
}

/**
 * Safely removes a specific item from localStorage and in-memory cache.
 * @param {string} key
 */
function safeStorageRemove(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    // SecurityError
  }
  delete memoryStorageCache[key];
}

// 4. RUNTIME STATE
const gameState = {
  currentState: GAME_STATES.IDLE,
  previousState: null,       // Tracks state interrupted by PAUSED
  sequence: [],              // Array of button ID strings
  playerStepIndex: 0,        // Current step index the player needs to match
  score: 0,                  // Total successfully completed rounds in active session
  highScore: 0,              // All-time highest score achieved
  isInputLocked: true,       // Defensive flag preventing click handling
  activeTimerIds: [],        // Registry of all active window setTimeout IDs
  isMuted: false             // Persistent audio mute flag
};

// 5. AUDIO CONTEXT, ACTIVE SOUND TRACKING & DOM ELEMENT CACHE
let audioCtx = null;
let activeOscillators = [];
let scoreDisplay = null;
let highScoreDisplay = null;
let statusMessage = null;
let startButton = null;
let pauseButton = null;
let resetDataButton = null;
let buttonGrid = null;
let colorButtons = [];
let muteButton = null;
let muteIcon = null;
let muteText = null;
let gameContainer = null;

// 6. AUDIO SYNTHESIZER (WEB AUDIO API)

/**
 * Lazily initializes and unlocks the AudioContext on first user gesture.
 * @returns {AudioContext|null}
 */
function getAudioContext() {
  try {
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
  } catch (err) {
    return null;
  }
}

/**
 * Immediately terminates and disconnects all currently sounding audio nodes.
 */
function stopAllSounds() {
  for (let i = 0; i < activeOscillators.length; i++) {
    try {
      activeOscillators[i].stop();
      activeOscillators[i].disconnect();
    } catch (e) {}
  }
  activeOscillators = [];
}

/**
 * Synthesizes a resonant triangle-wave tone for a color quadrant.
 * @param {string} buttonId
 * @param {number} durationMs Tone duration in milliseconds
 */
function playColorTone(buttonId, durationMs) {
  if (gameState.isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const freq = BUTTON_FREQUENCIES[buttonId];
  if (!freq) return;

  try {
    const now = ctx.currentTime;
    const durationSec = durationMs / 1000;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    // Anti-click attack and exponential release envelope
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gainNode.gain.setValueAtTime(0.25, now + Math.max(0.02, durationSec - 0.05));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec);
    activeOscillators.push(osc);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
      activeOscillators = activeOscillators.filter(item => item !== osc);
    };
  } catch (err) {}
}

/**
 * Plays an ascending two-tone major arpeggio for round completion.
 */
function playSuccessChime() {
  if (gameState.isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Step 1: Note G4 (392Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(392.00, now);
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);
    activeOscillators.push(osc1);
    osc1.onended = () => {
      try { osc1.disconnect(); gain1.disconnect(); } catch (e) {}
      activeOscillators = activeOscillators.filter(item => item !== osc1);
    };

    // Step 2: Note C5 (523.25Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.1);
    gain2.gain.setValueAtTime(0.0001, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.28);
    activeOscillators.push(osc2);
    osc2.onended = () => {
      try { osc2.disconnect(); gain2.disconnect(); } catch (e) {}
      activeOscillators = activeOscillators.filter(item => item !== osc2);
    };
  } catch (err) {}
}

/**
 * Plays a descending low-pitch sawtooth buzz on incorrect input.
 */
function playGameOverSound() {
  if (gameState.isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.28, now + 0.02);
    gainNode.gain.setValueAtTime(0.28, now + 0.18);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
    activeOscillators.push(osc);

    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
      activeOscillators = activeOscillators.filter(item => item !== osc);
    };
  } catch (err) {}
}

/**
 * Subtle feedback blip when unmuting sound.
 */
function playMuteBlip() {
  if (gameState.isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
    activeOscillators.push(osc);
    osc.onended = () => {
      try { osc.disconnect(); gainNode.disconnect(); } catch (e) {}
      activeOscillators = activeOscillators.filter(item => item !== osc);
    };
  } catch (err) {}
}

// 7. STORAGE & PERSISTENCE MANAGEMENT

/**
 * Loads and validates persistent high score and mute preferences.
 */
function loadStoredData() {
  // 1. High Score Validation
  const rawHighScore = safeStorageGet(STORAGE_KEYS.HIGH_SCORE);
  if (rawHighScore !== null) {
    const parsed = parseInt(rawHighScore, 10);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 99999) {
      gameState.highScore = parsed;
    } else {
      gameState.highScore = 0;
    }
  } else {
    gameState.highScore = 0;
  }

  // 2. Mute State Validation
  const rawMuted = safeStorageGet(STORAGE_KEYS.MUTED);
  if (rawMuted !== null) {
    gameState.isMuted = (rawMuted === 'true');
  } else {
    gameState.isMuted = false;
  }
}

/**
 * Checks if the current score exceeds high score, and persists if so.
 * @param {number} newScore
 */
function checkAndUpdateHighScore(newScore) {
  if (typeof newScore === 'number' && newScore > gameState.highScore) {
    gameState.highScore = newScore;
    safeStorageSet(STORAGE_KEYS.HIGH_SCORE, newScore.toString());
    if (highScoreDisplay) {
      highScoreDisplay.textContent = 'High Score: ' + gameState.highScore;
    }
  }
}

// 8. CORE GAME LIFECYCLE & PAUSE/RESUME

/**
 * Initializes the game on page load: caches DOM elements, attaches listeners,
 * loads stored data, and sets initial IDLE state.
 */
function init() {
  scoreDisplay = document.getElementById('score-display');
  highScoreDisplay = document.getElementById('high-score-display');
  statusMessage = document.getElementById('status-message');
  startButton = document.getElementById('start-btn');
  pauseButton = document.getElementById('pause-btn');
  resetDataButton = document.getElementById('reset-data-btn');
  buttonGrid = document.getElementById('button-grid');
  colorButtons = Array.from(document.querySelectorAll('.color-btn'));
  muteButton = document.getElementById('mute-btn');
  muteIcon = document.getElementById('mute-icon');
  muteText = document.getElementById('mute-text');
  gameContainer = document.querySelector('.game-container');

  // Load persistent storage
  loadStoredData();

  // Attach event listeners
  startButton.addEventListener('click', onStartButtonClick);
  if (pauseButton) {
    pauseButton.addEventListener('click', onPauseButtonClick);
  }
  if (resetDataButton) {
    resetDataButton.addEventListener('click', onResetDataButtonClick);
  }
  buttonGrid.addEventListener('click', onGridClick);
  if (muteButton) {
    muteButton.addEventListener('click', onMuteButtonClick);
  }

  // Page visibility listener (Scenario 8: Auto-pause when tab is hidden)
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Set initial state
  gameState.currentState = GAME_STATES.IDLE;
  setInputLocked(true);
  updateMuteUI();
  updateUI();
}

/**
 * Auto-pauses active gameplay when the browser tab is hidden to prevent
 * background timer throttling and audio desynchronization.
 */
function onVisibilityChange() {
  if (document.hidden) {
    if (
      gameState.currentState === GAME_STATES.PLAYBACK ||
      gameState.currentState === GAME_STATES.PLAYER_TURN ||
      gameState.currentState === GAME_STATES.ROUND_SUCCESS
    ) {
      pauseGame();
    }
  }
}

/**
 * Starts a brand-new game session from IDLE, GAME_OVER, or PAUSED.
 */
function startNewGame() {
  stopAllSounds();
  clearAllTimers();
  resetGameState();
  gameState.score = 0;
  gameState.sequence = [];
  startRound();
}

/**
 * Resets per-session state variables without clearing score or sequence.
 */
function resetGameState() {
  gameState.playerStepIndex = 0;
  gameState.isInputLocked = true;
  clearAllActiveHighlights();
}

/**
 * Generates a uniform random button ID from the available buttons.
 * @returns {string} One of CONFIG.BUTTON_IDS
 */
function generateNextStep() {
  const randomIndex = Math.floor(Math.random() * CONFIG.BUTTON_IDS.length);
  return CONFIG.BUTTON_IDS[randomIndex];
}

/**
 * Begins a new round: appends a new random step and starts playback.
 */
function startRound() {
  gameState.currentState = GAME_STATES.PLAYBACK;
  gameState.previousState = null;
  setInputLocked(true);

  // Append exactly one random step to extend the sequence
  const nextStep = generateNextStep();
  gameState.sequence.push(nextStep);

  // Reset player progress for this round
  gameState.playerStepIndex = 0;
  updateUI();

  // Schedule playback after the initial round start delay
  safeSetTimeout(() => {
    if (gameState.currentState !== GAME_STATES.PLAYBACK) return;
    playSequence();
  }, CONFIG.TIMING.ROUND_START_DELAY);
}

/**
 * Plays back the sequence one button at a time using synchronized highlights and audio tones.
 */
function playSequence() {
  // Guard: do not play if paused
  if (gameState.currentState === GAME_STATES.PAUSED) return;

  // Clear previousState if this is resumed playback so status banner displays "Watch the sequence"
  if (gameState.previousState === GAME_STATES.PLAYBACK) {
    gameState.previousState = null;
    updateUI();
  }

  const stepInterval = CONFIG.TIMING.STEP_DURATION + CONFIG.TIMING.STEP_GAP;

  // Schedule the flash and audio tone for each button in sequence
  for (let i = 0; i < gameState.sequence.length; i++) {
    const buttonId = gameState.sequence[i];
    const onTime = i * stepInterval;

    safeSetTimeout(() => {
      if (gameState.currentState !== GAME_STATES.PLAYBACK) return;
      flashButton(buttonId, CONFIG.TIMING.STEP_DURATION);
      playColorTone(buttonId, 350);
    }, onTime);
  }

  // Schedule the transition to the player's turn after all flashes finish
  const totalPlaybackTime = gameState.sequence.length * stepInterval;
  safeSetTimeout(() => {
    if (gameState.currentState !== GAME_STATES.PLAYBACK) return;
    gameState.currentState = GAME_STATES.PLAYER_TURN;
    setInputLocked(false);
    updateUI();
  }, totalPlaybackTime);
}

/**
 * Temporarily highlights a button by adding the .active class.
 * @param {string} buttonId
 * @param {number} duration Duration in milliseconds
 */
function flashButton(buttonId, duration) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.classList.add('active');
  safeSetTimeout(() => {
    btn.classList.remove('active');
  }, duration);
}

/**
 * Removes active visual classes and animation effects from all interactive elements.
 */
function clearAllActiveHighlights() {
  colorButtons.forEach(btn => btn.classList.remove('active'));
  if (gameContainer) gameContainer.classList.remove('shake-error');
  if (statusMessage) statusMessage.classList.remove('status-success');
}

/**
 * Delegated click listener on the button grid container.
 * @param {MouseEvent} event
 */
function onGridClick(event) {
  // Gate check: Input locked or not in player's turn
  if (gameState.isInputLocked || gameState.currentState !== GAME_STATES.PLAYER_TURN) {
    return;
  }

  // Find the clicked color button
  const clickedBtn = event.target.closest('.color-btn');
  if (!clickedBtn || !CONFIG.BUTTON_IDS.includes(clickedBtn.id)) {
    return; // Click occurred on grid gap or outside buttons
  }

  handleColorClick(clickedBtn.id);
}

/**
 * Processes a valid player click on a color button.
 * @param {string} buttonId
 */
function handleColorClick(buttonId) {
  if (gameState.isInputLocked || gameState.currentState !== GAME_STATES.PLAYER_TURN) {
    return;
  }

  // Unlock/resume audio on user gesture
  getAudioContext();

  // Provide immediate visual and acoustic feedback
  flashButton(buttonId, CONFIG.TIMING.INPUT_FLASH_DURATION);
  playColorTone(buttonId, 160);

  // Validate player's selection
  validateInput(buttonId);
}

/**
 * Compares the player's selection against the current step in sequence.
 * @param {string} buttonId
 */
function validateInput(buttonId) {
  const expectedButtonId = gameState.sequence[gameState.playerStepIndex];

  if (buttonId === expectedButtonId) {
    handleCorrectInput();
  } else {
    handleIncorrectInput();
  }
}

/**
 * Advances player progress when the input is correct.
 */
function handleCorrectInput() {
  gameState.playerStepIndex++;

  // Check if player completed the full sequence for this round
  if (gameState.playerStepIndex === gameState.sequence.length) {
    gameState.currentState = GAME_STATES.ROUND_SUCCESS;
    setInputLocked(true);
    gameState.score++;

    // Update and persist high score immediately if surpassed
    checkAndUpdateHighScore(gameState.score);
    updateUI();

    // Sensory victory feedback: chime and status pulse
    playSuccessChime();
    if (statusMessage) {
      statusMessage.classList.add('status-success');
      safeSetTimeout(() => {
        if (statusMessage) statusMessage.classList.remove('status-success');
      }, 450);
    }

    // Schedule next round after inter-round delay
    safeSetTimeout(() => {
      if (gameState.currentState !== GAME_STATES.ROUND_SUCCESS) return;
      startRound();
    }, CONFIG.TIMING.INTER_ROUND_DELAY);
  } else {
    // Intermediate step correct; remain in PLAYER_TURN awaiting next click
    updateUI();
  }
}

/**
 * Handles round failure when the player selects the wrong button.
 */
function handleIncorrectInput() {
  gameState.currentState = GAME_STATES.GAME_OVER;
  setInputLocked(true);
  clearAllTimers();
  clearAllActiveHighlights();
  stopAllSounds();

  // Ensure high score is updated on game over
  checkAndUpdateHighScore(gameState.score);

  // Sensory failure feedback: error buzz and cabinet shake
  playGameOverSound();
  if (gameContainer) {
    gameContainer.classList.add('shake-error');
    safeSetTimeout(() => {
      if (gameContainer) gameContainer.classList.remove('shake-error');
    }, 350);
  }

  endGame();
}

/**
 * Finalizes the game-over presentation.
 */
function endGame() {
  updateUI();
}

/**
 * Handles clicks on the Start / Play Again / Restart button.
 */
function onStartButtonClick() {
  if (
    gameState.currentState !== GAME_STATES.IDLE &&
    gameState.currentState !== GAME_STATES.GAME_OVER &&
    gameState.currentState !== GAME_STATES.PAUSED
  ) {
    return;
  }

  getAudioContext();
  startButton.disabled = true;
  startNewGame();
}

/**
 * Handles clicks on the Pause / Resume button.
 */
function onPauseButtonClick() {
  getAudioContext();

  if (gameState.currentState === GAME_STATES.PAUSED) {
    resumeGame();
  } else if (
    gameState.currentState === GAME_STATES.PLAYBACK ||
    gameState.currentState === GAME_STATES.PLAYER_TURN ||
    gameState.currentState === GAME_STATES.ROUND_SUCCESS
  ) {
    pauseGame();
  }
}

/**
 * Suspends active gameplay, freezes timers, and prevents user input.
 */
function pauseGame() {
  gameState.previousState = gameState.currentState;
  gameState.currentState = GAME_STATES.PAUSED;
  setInputLocked(true);
  clearAllTimers();
  clearAllActiveHighlights();
  stopAllSounds();
  updateUI();
}

/**
 * Resumes gameplay from the exact interrupted state without duplicating steps.
 */
function resumeGame() {
  const prior = gameState.previousState;

  if (prior === GAME_STATES.PLAYER_TURN) {
    gameState.currentState = GAME_STATES.PLAYER_TURN;
    setInputLocked(false);
    updateUI();
  } else if (prior === GAME_STATES.PLAYBACK) {
    gameState.currentState = GAME_STATES.PLAYBACK;
    setInputLocked(true);
    updateUI();
    // Replay active sequence from step 0 after brief resume delay
    safeSetTimeout(() => {
      if (gameState.currentState !== GAME_STATES.PLAYBACK) return;
      playSequence();
    }, CONFIG.TIMING.RESUME_DELAY);
  } else if (prior === GAME_STATES.ROUND_SUCCESS) {
    gameState.currentState = GAME_STATES.ROUND_SUCCESS;
    setInputLocked(true);
    updateUI();
    // Advance to next round after brief resume delay
    safeSetTimeout(() => {
      if (gameState.currentState !== GAME_STATES.ROUND_SUCCESS) return;
      startRound();
    }, 500);
  } else {
    // Default fallback
    gameState.currentState = GAME_STATES.PLAYER_TURN;
    setInputLocked(false);
    updateUI();
  }
}

/**
 * Handles selective deletion of game-specific saved data with confirmation.
 */
function onResetDataButtonClick() {
  if (
    gameState.currentState === GAME_STATES.PLAYBACK ||
    gameState.currentState === GAME_STATES.PLAYER_TURN ||
    gameState.currentState === GAME_STATES.ROUND_SUCCESS
  ) {
    return;
  }

  const confirmed = window.confirm(
    "Reset all saved data? Your high score and sound preferences will return to defaults."
  );
  if (!confirmed) return;

  // Selective removal: remove ONLY this game's keys
  safeStorageRemove(STORAGE_KEYS.HIGH_SCORE);
  safeStorageRemove(STORAGE_KEYS.MUTED);

  gameState.highScore = 0;
  gameState.isMuted = false;

  if (highScoreDisplay) {
    highScoreDisplay.textContent = 'High Score: 0';
  }
  updateMuteUI();
}

/**
 * Handles toggling sound on and off.
 */
function onMuteButtonClick() {
  getAudioContext();
  gameState.isMuted = !gameState.isMuted;
  safeStorageSet(STORAGE_KEYS.MUTED, gameState.isMuted ? 'true' : 'false');
  if (gameState.isMuted) {
    stopAllSounds();
  }
  updateMuteUI();

  if (!gameState.isMuted) {
    playMuteBlip();
  }
}

/**
 * Updates the Mute button icon and accessible state.
 */
function updateMuteUI() {
  if (!muteButton) return;

  if (gameState.isMuted) {
    muteButton.classList.add('muted');
    muteButton.setAttribute('aria-pressed', 'true');
    if (muteIcon) muteIcon.textContent = '🔇';
    if (muteText) muteText.textContent = 'Sound: OFF';
  } else {
    muteButton.classList.remove('muted');
    muteButton.setAttribute('aria-pressed', 'false');
    if (muteIcon) muteIcon.textContent = '🔊';
    if (muteText) muteText.textContent = 'Sound: ON';
  }
}

/**
 * Tracks setTimeout handles in gameState.activeTimerIds to allow instant cleanup.
 * @param {Function} callback
 * @param {number} delay Delay in milliseconds
 * @returns {number} Timer ID
 */
function safeSetTimeout(callback, delay) {
  let timerId;
  timerId = window.setTimeout(() => {
    // Remove timer ID from active registry upon execution
    gameState.activeTimerIds = gameState.activeTimerIds.filter(id => id !== timerId);
    callback();
  }, delay);

  gameState.activeTimerIds.push(timerId);
  return timerId;
}

/**
 * Clears all pending timers to prevent duplicate timers or overlapping sequences.
 */
function clearAllTimers() {
  for (let i = 0; i < gameState.activeTimerIds.length; i++) {
    window.clearTimeout(gameState.activeTimerIds[i]);
  }
  gameState.activeTimerIds = [];
}

/**
 * Synchronizes the input lock state across JavaScript flags and DOM elements.
 * @param {boolean} locked
 */
function setInputLocked(locked) {
  gameState.isInputLocked = locked;
  colorButtons.forEach(btn => {
    btn.disabled = locked;
  });
}

/**
 * Updates DOM text and button states according to the current game state.
 */
function updateUI() {
  // 1. Update score & high score displays
  if (scoreDisplay) {
    scoreDisplay.textContent = 'Score: ' + gameState.score;
  }
  if (highScoreDisplay) {
    highScoreDisplay.textContent = 'High Score: ' + gameState.highScore;
  }

  // 2. Update status banner message
  if (statusMessage) {
    switch (gameState.currentState) {
      case GAME_STATES.IDLE:
        statusMessage.textContent = 'Press Start to Play';
        break;
      case GAME_STATES.PLAYBACK:
        statusMessage.textContent = (gameState.previousState === GAME_STATES.PLAYBACK)
          ? 'Resuming sequence...'
          : 'Watch the sequence';
        break;
      case GAME_STATES.PLAYER_TURN:
        statusMessage.textContent = 'Your turn! Repeat the sequence.';
        break;
      case GAME_STATES.ROUND_SUCCESS:
        statusMessage.textContent = 'Correct! Next round starting...';
        break;
      case GAME_STATES.PAUSED:
        statusMessage.textContent = 'Game Paused';
        break;
      case GAME_STATES.GAME_OVER:
        statusMessage.textContent = 'Game Over! Final Score: ' + gameState.score;
        break;
      default:
        statusMessage.textContent = '';
        break;
    }
  }

  // 3. Update Start / Play Again / Restart button state
  if (startButton) {
    if (gameState.currentState === GAME_STATES.IDLE) {
      startButton.disabled = false;
      startButton.textContent = 'Start';
    } else if (gameState.currentState === GAME_STATES.GAME_OVER) {
      startButton.disabled = false;
      startButton.textContent = 'Play Again';
    } else if (gameState.currentState === GAME_STATES.PAUSED) {
      startButton.disabled = false;
      startButton.textContent = 'Restart';
    } else {
      // PLAYBACK, PLAYER_TURN, ROUND_SUCCESS
      startButton.disabled = true;
      startButton.textContent = 'Playing...';
    }
  }

  // 4. Update Pause / Resume button state
  if (pauseButton) {
    if (gameState.currentState === GAME_STATES.PAUSED) {
      pauseButton.disabled = false;
      pauseButton.textContent = 'Resume';
    } else if (
      gameState.currentState === GAME_STATES.PLAYBACK ||
      gameState.currentState === GAME_STATES.PLAYER_TURN ||
      gameState.currentState === GAME_STATES.ROUND_SUCCESS
    ) {
      pauseButton.disabled = false;
      pauseButton.textContent = 'Pause';
    } else {
      // IDLE, GAME_OVER
      pauseButton.disabled = true;
      pauseButton.textContent = 'Pause';
    }
  }

  // 5. Update Reset Data button state (disabled during active gameplay)
  if (resetDataButton) {
    const isBusy = (
      gameState.currentState === GAME_STATES.PLAYBACK ||
      gameState.currentState === GAME_STATES.PLAYER_TURN ||
      gameState.currentState === GAME_STATES.ROUND_SUCCESS
    );
    resetDataButton.disabled = isBusy;
  }
}

// 9. INITIALIZATION HOOK
// Execute when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

