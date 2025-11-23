
/**
 * LUMOS PLAYER - VANILLA JS IMPLEMENTATION
 * 
 * Approccio Progressive Enhancement:
 * Gestisce sia <video> che <audio> elements.
 */

// -- ICONS (Inline SVG strings for performance & no dependencies) --
const ICONS = {
  play: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>`,
  pause: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>`,
  rewind10: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>`,
  forward10: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>`,
  volumeHigh: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>`,
  volumeMute: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>`,
  fullscreen: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>`,
  cc: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 6h-15c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-11 8H6v-1.5h2.5v-1H6V10h2.5V8.5H5v7h3.5v-1.5zm8 0h-2.5v-1.5h2.5v-1h-2.5V10h2.5V8.5h-3.5v7h3.5v-1.5z" /></svg>`
};

class LumosPlayer {
  private wrapper: HTMLElement;
  private media: HTMLMediaElement; // Can be Video or Audio
  private controlsContainer: HTMLElement | null = null;
  private isAudio: boolean = false;
  
  // UI Elements
  private playBtn: HTMLButtonElement | null = null;
  private rwdBtn: HTMLButtonElement | null = null;
  private fwdBtn: HTMLButtonElement | null = null;
  private muteBtn: HTMLButtonElement | null = null;
  private fsBtn: HTMLButtonElement | null = null; // Only for video
  private timeSlider: HTMLInputElement | null = null;
  private volSlider: HTMLInputElement | null = null;
  private timeDisplayCurrent: HTMLElement | null = null;
  private timeDisplayDuration: HTMLElement | null = null;
  private progressFill: HTMLElement | null = null;
  private controlsTimeout: number | null = null;

  constructor(wrapperId: string) {
    const el = document.getElementById(wrapperId);
    if (!el) {
       console.warn(`Wrapper element ${wrapperId} not found`);
       return;
    }
    
    this.wrapper = el;
    // Find generic media element
    this.media = (this.wrapper.querySelector('video') || this.wrapper.querySelector('audio')) as HTMLMediaElement;
    
    if (!this.media) throw new Error('Media element not found');

    this.isAudio = this.media.tagName.toLowerCase() === 'audio';

    this.init();
  }

  private init() {
    // 1. Disabilita controlli nativi (Progressive Enhancement step)
    this.media.controls = false;
    
    if (!this.isAudio) {
        this.media.classList.add('cursor-pointer');
    }

    // 2. Costruisci UI
    this.renderControls();

    // 3. Bind Eventi
    this.bindEvents();

    // 4. Check Initial State
    // Se il media è in stato HAVE_NOTHING, forziamo un load per i metadati
    if (this.media.readyState === 0) {
      this.media.load();
    } else {
      // Se ha già metadati, aggiorniamo subito la UI
      this.updateDuration();
    }

    console.log(`Lumos Player (${this.isAudio ? 'Audio' : 'Video'}) Initialized 🚀`);
  }

  private formatTime(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  private renderControls() {
    // Configurazione UI: Video ha overlay, Audio ha layout statico
    const isVideo = !this.isAudio;

    let containerClasses = "";
    let progressBgClass = "";
    
    if (isVideo) {
      // Video: Overlay assoluto, gradiente, scompare
      containerClasses = "absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 opacity-100";
      progressBgClass = "bg-gray-600/50";
    } else {
      // Audio: Statico, pulito
      containerClasses = "w-full mt-2"; // Mt-2 to separate from title
      progressBgClass = "bg-gray-600/30";
    }

    // Overlay play button (solo Video)
    const overlayBtnHTML = isVideo ? `
      <div class="lumos-overlay absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 opacity-0 transition-opacity duration-300">
         <div class="p-4 bg-black/40 rounded-full backdrop-blur-sm shadow-lg border border-white/10 transform scale-110">
            ${ICONS.play}
         </div>
      </div>` : '';

    // Fullscreen Button (solo Video)
    const fsBtnHTML = isVideo ? `
       <button class="lumos-fs-btn text-white hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md p-1" aria-label="Enter Fullscreen">
         ${ICONS.fullscreen}
       </button>` : '';

    // Caption Button (Opzionale, mettiamo solo su video per ora)
    const ccBtnHTML = isVideo ? `
        <button class="text-white opacity-50 cursor-not-allowed p-1" aria-label="Captions (Not available)">
            ${ICONS.cc}
        </button>` : '';

    const controlsHTML = `
      ${overlayBtnHTML}

      <div class="lumos-controls ${containerClasses}">
        
        <!-- Progress Bar Area -->
        <div class="relative w-full h-4 mb-2 group/scrubber flex items-center cursor-pointer">
          <!-- Background Track -->
          <div class="absolute w-full h-1 ${progressBgClass} rounded-full overflow-hidden pointer-events-none">
            <div class="lumos-progress-fill h-full bg-indigo-500 w-0 transition-all duration-100 ease-linear"></div>
          </div>
          
          <!-- Accessible Range Input -->
          <input type="range" min="0" max="100" step="0.1" value="0" 
            class="lumos-range lumos-time-slider z-10" 
            aria-label="Seek media" 
            aria-valuemin="0" 
            aria-valuemax="0" 
            aria-valuenow="0"
            aria-valuetext="0:00">
        </div>

        <!-- Buttons Row -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            
            <!-- Skip Back (-10s) -->
            <button class="lumos-rwd-btn text-gray-300 hover:text-white hover:scale-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md p-1" 
                    aria-label="Rewind 10 seconds">
               <div class="relative">
                  ${ICONS.rewind10}
                  <span class="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[35%] text-[8px] font-bold">10</span>
               </div>
            </button>

            <!-- Play/Pause -->
            <button class="lumos-play-btn text-white hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md p-1" aria-label="Play">
              ${ICONS.play}
            </button>

            <!-- Skip Forward (+10s) -->
            <button class="lumos-fwd-btn text-gray-300 hover:text-white hover:scale-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md p-1" 
                    aria-label="Forward 10 seconds">
               <div class="relative">
                  ${ICONS.forward10}
                  <span class="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[35%] text-[8px] font-bold">10</span>
               </div>
            </button>

            <!-- Volume Group -->
            <div class="group/volume flex items-center gap-2 ml-2">
              <button class="lumos-mute-btn text-white hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md p-1" aria-label="Mute">
                ${ICONS.volumeHigh}
              </button>
              <div class="w-0 overflow-hidden transition-all duration-300 group-hover/volume:w-24 focus-within:w-24 flex items-center ${this.isAudio ? 'w-24' : ''}">
                <input type="range" min="0" max="1" step="0.05" value="1" 
                  class="lumos-range lumos-vol-slider" 
                  aria-label="Volume" 
                  aria-valuetext="100%">
              </div>
            </div>

            <!-- Time -->
            <div class="text-sm font-medium text-gray-300 font-mono tracking-tight select-none" aria-hidden="true">
              <span class="lumos-time-current text-white">0:00</span>
              <span class="mx-1 opacity-50">/</span>
              <span class="lumos-time-duration">0:00</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
             ${ccBtnHTML}
             ${fsBtnHTML}
          </div>
        </div>
      </div>
    `;

    this.wrapper.insertAdjacentHTML('beforeend', controlsHTML);

    // Cache references
    this.controlsContainer = this.wrapper.querySelector('.lumos-controls');
    this.playBtn = this.wrapper.querySelector('.lumos-play-btn');
    this.rwdBtn = this.wrapper.querySelector('.lumos-rwd-btn');
    this.fwdBtn = this.wrapper.querySelector('.lumos-fwd-btn');
    this.muteBtn = this.wrapper.querySelector('.lumos-mute-btn');
    this.fsBtn = this.wrapper.querySelector('.lumos-fs-btn');
    this.timeSlider = this.wrapper.querySelector('.lumos-time-slider');
    this.volSlider = this.wrapper.querySelector('.lumos-vol-slider');
    this.timeDisplayCurrent = this.wrapper.querySelector('.lumos-time-current');
    this.timeDisplayDuration = this.wrapper.querySelector('.lumos-time-duration');
    this.progressFill = this.wrapper.querySelector('.lumos-progress-fill');
  }

  private bindEvents() {
    // -- Media Events --
    // Cliccare sul media per Play/Pause (solo per video)
    if (!this.isAudio) {
      this.media.addEventListener('click', () => this.togglePlay());
    } else {
       // Per Audio: Click su intero wrapper attiva Play/Pause (miglior UX per card)
       this.wrapper.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          // Ignora click su controlli interattivi per evitare conflitti
          if (target.closest('button') || target.closest('input') || target.closest('a')) return;
          this.togglePlay();
       });
       this.wrapper.style.cursor = 'pointer';
    }
    
    this.media.addEventListener('play', () => this.updatePlayState(true));
    this.media.addEventListener('pause', () => this.updatePlayState(false));
    this.media.addEventListener('timeupdate', () => this.updateTime());
    this.media.addEventListener('loadedmetadata', () => {
      this.updateDuration();
      this.updateTime();
    });
    this.media.addEventListener('volumechange', () => this.updateVolumeUI());
    this.media.addEventListener('ended', () => this.updatePlayState(false));
    
    // Buffer Loading Feedback
    this.media.addEventListener('waiting', () => {
      if (this.playBtn) this.playBtn.classList.add('animate-pulse', 'opacity-50');
    });
    this.media.addEventListener('playing', () => {
      if (this.playBtn) this.playBtn.classList.remove('animate-pulse', 'opacity-50');
    });
    this.media.addEventListener('canplay', () => {
      if (this.playBtn) this.playBtn.classList.remove('animate-pulse', 'opacity-50');
      this.updateDuration();
    });

    // -- UI Controls Events --
    this.playBtn?.addEventListener('click', (e) => {
        e.stopPropagation(); // Previene bubbling che causerebbe doppio toggle su Audio Card
        this.togglePlay();
    });
    
    // Seek Buttons
    this.rwdBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.skip(-10);
    });
    this.fwdBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.skip(10);
    });

    this.muteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.media.muted = !this.media.muted;
    });

    if (this.fsBtn) {
        this.fsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFullscreen();
        });
    }

    // Input Seek
    this.timeSlider?.addEventListener('input', (e: Event) => {
      e.stopPropagation();
      const target = e.target as HTMLInputElement;
      const time = parseFloat(target.value);
      if (isFinite(time)) {
        this.media.currentTime = time;
        this.updateProgressVisuals(time, this.media.duration);
      }
    });
    // Prevent click propagation on slider to wrapper
    this.timeSlider?.addEventListener('click', (e) => e.stopPropagation());

    // Input Volume
    this.volSlider?.addEventListener('input', (e: Event) => {
      e.stopPropagation();
      const target = e.target as HTMLInputElement;
      this.media.volume = parseFloat(target.value);
      this.media.muted = false;
    });
    this.volSlider?.addEventListener('click', (e) => e.stopPropagation());

    // -- Mouse Visibility (Only for Video) --
    if (!this.isAudio) {
        this.wrapper.addEventListener('mousemove', () => this.showControls());
        this.wrapper.addEventListener('mouseleave', () => {
            if(!this.media.paused) this.hideControls();
        });
    }

    // -- Keyboard Accessibility --
    this.wrapper.addEventListener('keydown', (e: KeyboardEvent) => this.handleKey(e));
  }

  // --- LOGIC METHODS ---

  private togglePlay() {
    if (this.media.paused || this.media.ended) {
      const playPromise = this.media.play();
      
      // Safe handling of Play Promise
      if (playPromise !== undefined) {
        playPromise.catch(error => {
            if (error.name === 'AbortError') {
                console.debug('Play interrupted by pause');
            } else {
                console.error('Play error:', error);
            }
        });
      }
    } else {
      this.media.pause();
    }
  }

  private skip(seconds: number) {
    const duration = this.media.duration || 0;
    this.media.currentTime = Math.min(
       Math.max(this.media.currentTime + seconds, 0),
       duration
    );
    if (!this.isAudio) this.showControls();
  }

  private updatePlayState(isPlaying: boolean) {
    if (!this.playBtn) return;
    
    this.playBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
    this.playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');

    // Overlay Play Icon Animation (Video Only)
    const overlay = this.wrapper.querySelector('.lumos-overlay');
    if(overlay) {
       if(!isPlaying) {
         overlay.classList.remove('opacity-0');
       } else {
         overlay.classList.add('opacity-0');
       }
    }

    if (!this.isAudio) {
        if (isPlaying) {
            this.startHideTimer();
        } else {
            this.showControls();
        }
    }
  }

  private updateTime() {
    const current = this.media.currentTime;
    const duration = this.media.duration;
    
    // Se la durata non è pronta, esci
    if (!duration || isNaN(duration)) return;

    // Sync slider logic
    if (this.timeSlider) {
      this.timeSlider.value = current.toString();
      this.timeSlider.setAttribute('aria-valuenow', current.toString());
      this.timeSlider.setAttribute('aria-valuetext', `${this.formatTime(current)} of ${this.formatTime(duration)}`);
    }

    this.updateProgressVisuals(current, duration);

    if (this.timeDisplayCurrent) {
      this.timeDisplayCurrent.textContent = this.formatTime(current);
    }
  }

  private updateProgressVisuals(current: number, duration: number) {
    if (this.progressFill && duration > 0) {
      const percentage = (current / duration) * 100;
      this.progressFill.style.width = `${percentage}%`;
    }
  }

  private updateDuration() {
    const duration = this.media.duration;
    if (!duration || isNaN(duration)) return;

    if (this.timeSlider) {
      this.timeSlider.max = duration.toString();
      this.timeSlider.setAttribute('aria-valuemax', duration.toString());
    }
    if (this.timeDisplayDuration) {
      this.timeDisplayDuration.textContent = this.formatTime(duration);
    }
  }

  private updateVolumeUI() {
    const vol = this.media.volume;
    const muted = this.media.muted;
    
    if (this.volSlider) {
      this.volSlider.value = muted ? '0' : vol.toString();
      this.volSlider.setAttribute('aria-valuetext', `${Math.round(vol * 100)}%`);
    }

    if (this.muteBtn) {
      this.muteBtn.innerHTML = (muted || vol === 0) ? ICONS.volumeMute : ICONS.volumeHigh;
      this.muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    }
  }

  private toggleFullscreen() {
    if (this.isAudio) return; 

    if (!document.fullscreenElement) {
      this.wrapper.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  }

  // -- Controls Visibility (Video Only) --

  private showControls() {
    if (this.isAudio) return;

    if (this.controlsContainer) {
      this.controlsContainer.classList.remove('opacity-0', 'invisible');
    }
    this.startHideTimer();
  }

  private hideControls() {
    if (this.isAudio) return;

    if (this.controlsContainer && !this.media.paused) {
      this.controlsContainer.classList.add('opacity-0', 'invisible');
    }
  }

  private startHideTimer() {
    if (this.isAudio) return;

    if (this.controlsTimeout) window.clearTimeout(this.controlsTimeout);
    this.controlsTimeout = window.setTimeout(() => {
      this.hideControls();
    }, 2500);
  }

  // -- Keyboard Logic --

  private handleKey(e: KeyboardEvent) {
    switch(e.key.toLowerCase()) {
      case ' ':
      case 'k':
        e.preventDefault();
        this.togglePlay();
        break;
      case 'f':
        e.preventDefault();
        this.toggleFullscreen();
        break;
      case 'm':
        e.preventDefault();
        this.media.muted = !this.media.muted;
        break;
      case 'arrowright':
        if (document.activeElement !== this.timeSlider) {
           this.skip(5);
        }
        break;
      case 'arrowleft':
        if (document.activeElement !== this.timeSlider) {
           this.skip(-5);
        }
        break;
      case 'j': 
        e.preventDefault();
        this.skip(-10);
        break;
      case 'l': 
        e.preventDefault();
        this.skip(10);
        break;
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  try {
    new LumosPlayer('lumos-video-app');
    new LumosPlayer('lumos-audio-app');
  } catch (e) {
    console.error("Lumos Player initialization failed:", e);
  }
});