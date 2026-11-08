import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// ============================================
// Web Audio API — Crisp UI Sound Effects (SFX)
// ============================================

class SoundEffects {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    const saved = localStorage.getItem("baobao_sfx_enabled");
    if (saved !== null) {
      this.enabled = saved === "true";
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(val: boolean): void {
    this.enabled = val;
    localStorage.setItem("baobao_sfx_enabled", String(val));
    if (val) {
      this.playClick();
    }
  }

  private init() {
    if (!this.enabled) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  /** Crisp haptic click (mechanical switch / iOS keyboard tap feel) */
  playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1350, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.032);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.032);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.035);
    } catch (_) {}
  }

  /** Pop / bubble switch sound for toggles (Play/Pause, Lyrics) */
  playPop() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(920, t + 0.04);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.045);
    } catch (_) {}
  }

  /** Swoosh / slide navigation sound for tabs & carousel */
  playSlide() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(310, t);
      osc.frequency.exponentialRampToValueAtTime(560, t + 0.05);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.055);
    } catch (_) {}
  }

  /** Bouncy pop & reset boom sound */
  playExplode() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.22);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);

      const noise = this.ctx.createOscillator();
      const noiseGain = this.ctx.createGain();
      noise.type = "triangle";
      noise.frequency.setValueAtTime(820, t);
      noise.frequency.exponentialRampToValueAtTime(180, t + 0.16);
      noiseGain.gain.setValueAtTime(0.25, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);
      noise.stop(t + 0.18);
    } catch (_) {}
  }

  /** Pleasant 3x repeating bell chime when Focus Timer finishes */
  playTimerAlarm3x() {
    const playSingleChime = () => {
      try {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        // First note (A5)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, t);
        gain1.gain.setValueAtTime(0.28, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(t);
        osc1.stop(t + 0.23);

        // Second note (E6)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(1318.5, t + 0.12);
        gain2.gain.setValueAtTime(0.001, t);
        gain2.gain.setValueAtTime(0.26, t + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(t + 0.12);
        osc2.stop(t + 0.44);
      } catch (_) {}
    };

    playSingleChime();
    window.setTimeout(playSingleChime, 620);
    window.setTimeout(playSingleChime, 1240);
  }
}

export const sfx = new SoundEffects();

// ============================================
// Unified Appearance (Color + Notch Gradient + Neutral Glass Mode)
// ============================================

interface ThemeConfig {
  name: string;
  accent: string;
  accentGradient: string;
  glow: string;
  trackFill: string;
}

const THEMES: Record<string, ThemeConfig> = {
  blue: {
    name: "Royal Blue",
    accent: "#3b82f6",
    accentGradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)",
    glow: "rgba(59, 130, 246, 0.45)",
    trackFill: "linear-gradient(90deg, #60a5fa, #3b82f6)",
  },
  cyan: {
    name: "Neon Cyan",
    accent: "#06b6d4",
    accentGradient: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #3b82f6 100%)",
    glow: "rgba(6, 182, 212, 0.45)",
    trackFill: "linear-gradient(90deg, #38bdf8, #06b6d4)",
  },
  pink: {
    name: "Sakura Pink",
    accent: "#f43f5e",
    accentGradient: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 50%, #f43f5e 100%)",
    glow: "rgba(244, 63, 94, 0.45)",
    trackFill: "linear-gradient(90deg, #ff758c, #f43f5e)",
  },
  emerald: {
    name: "Emerald Green",
    accent: "#10b981",
    accentGradient: "linear-gradient(135deg, #10b981 0%, #059669 50%, #34d399 100%)",
    glow: "rgba(16, 185, 129, 0.45)",
    trackFill: "linear-gradient(90deg, #34d399, #10b981)",
  },
  sunset: {
    name: "Sunset Amber",
    accent: "#f97316",
    accentGradient: "linear-gradient(135deg, #f97316 0%, #ef4444 50%, #f43f5e 100%)",
    glow: "rgba(249, 115, 22, 0.45)",
    trackFill: "linear-gradient(90deg, #fb923c, #f97316)",
  },
  gold: {
    name: "Solar Gold",
    accent: "#eab308",
    accentGradient: "linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #fbbf24 100%)",
    glow: "rgba(234, 179, 8, 0.45)",
    trackFill: "linear-gradient(90deg, #fde047, #eab308)",
  },
  violet: {
    name: "Mystic Violet",
    accent: "#a855f7",
    accentGradient: "linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #7e22ce 100%)",
    glow: "rgba(168, 85, 247, 0.45)",
    trackFill: "linear-gradient(90deg, #c084fc, #a855f7)",
  },
  gray: {
    name: "Slate Gray",
    accent: "#a1a1aa",
    accentGradient: "linear-gradient(135deg, #e4e4e7 0%, #a1a1aa 50%, #71717a 100%)",
    glow: "rgba(161, 161, 170, 0.4)",
    trackFill: "linear-gradient(90deg, #d4d4d8, #a1a1aa)",
  },
};

let currentCustomHex = localStorage.getItem("baobao_custom_color") || "#3b82f6";
let pickerHue = 217;
let pickerSat = 76;
let pickerVal = 96;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 59, g: 130, b: 246 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToHex(h: number, s: number, v: number): string {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

function adjustHexBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

function syncSpectrumUI(hex: string, updateHsvFromHex = true): void {
  if (updateHsvFromHex) {
    const { r, g, b } = hexToRgb(hex);
    const hsv = rgbToHsv(r, g, b);
    if (hsv.s > 0) pickerHue = hsv.h;
    pickerSat = hsv.s;
    pickerVal = hsv.v;
  }
  const paletteBox = document.getElementById("sv-palette-box");
  if (paletteBox) {
    paletteBox.style.setProperty("--picker-hue", String(pickerHue));
  }
  const svCursor = document.getElementById("sv-cursor");
  if (svCursor) {
    svCursor.style.left = `${pickerSat}%`;
    svCursor.style.top = `${100 - pickerVal}%`;
    svCursor.style.background = hex;
  }
  const hueSlider = document.getElementById("slider-color-hue") as HTMLInputElement | null;
  if (hueSlider && parseInt(hueSlider.value, 10) !== pickerHue) {
    hueSlider.value = String(pickerHue);
  }
}

function applyCustomColor(hex: string, save = true, syncHsv = true): void {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    hex = "#3b82f6";
  }
  currentCustomHex = hex.toLowerCase();
  const { r: bgR, g: bgG, b: bgB } = hexToRgb(currentCustomHex);
  const hsv = rgbToHsv(bgR, bgG, bgB);

  // Ensure foreground text, icons, and accents never become invisible when Appearance color is dark/black (Gambar 1 Fix)
  const minReadableV = hsv.s < 15 ? 86 : 74;
  const fgHex = hsv.v < minReadableV ? hsvToHex(hsv.h, hsv.s, minReadableV) : currentCustomHex;
  const { r, g, b } = hexToRgb(fgHex);

  const lightHex = adjustHexBrightness(fgHex, 22);
  const darkHex = adjustHexBrightness(fgHex, -18);
  const glow = `rgba(${r}, ${g}, ${b}, 0.45)`;
  const gradient = `linear-gradient(135deg, ${lightHex} 0%, ${fgHex} 50%, ${darkHex} 100%)`;
  const trackFill = `linear-gradient(90deg, ${lightHex}, ${fgHex})`;

  const root = document.documentElement;
  root.style.setProperty("--theme-bg-rgb", `${bgR}, ${bgG}, ${bgB}`);
  root.style.setProperty("--theme-accent", fgHex);
  root.style.setProperty("--theme-rgb", `${r}, ${g}, ${b}`);
  root.style.setProperty("--theme-accent-gradient", gradient);
  root.style.setProperty("--theme-glow", glow);
  root.style.setProperty("--theme-track-fill", trackFill);

  const inputCustom = document.getElementById("input-custom-color") as HTMLInputElement | null;
  if (inputCustom && inputCustom.value.toLowerCase() !== currentCustomHex) {
    inputCustom.value = currentCustomHex;
  }
  const hexInput = document.getElementById("input-color-hex-text") as HTMLInputElement | null;
  if (hexInput && document.activeElement !== hexInput) {
    hexInput.value = currentCustomHex.toUpperCase();
  }
  const swatchCurrent = document.getElementById("color-swatch-current");
  if (swatchCurrent) {
    swatchCurrent.style.background = currentCustomHex;
  }

  syncSpectrumUI(currentCustomHex, syncHsv);

  let matchedPreset: string | null = null;
  document.querySelectorAll(".theme-swatch").forEach((swatch) => {
    const themeKey = (swatch as HTMLElement).dataset.theme;
    if (themeKey && THEMES[themeKey] && THEMES[themeKey].accent.toLowerCase() === currentCustomHex) {
      swatch.classList.add("active");
      matchedPreset = themeKey;
    } else {
      swatch.classList.remove("active");
    }
  });

  if (save) {
    localStorage.setItem("baobao_custom_color", currentCustomHex);
    localStorage.setItem("baobao_theme", matchedPreset || "custom");
  }
}

function applyTheme(themeKey: string): void {
  const theme = THEMES[themeKey] || THEMES.blue;
  applyCustomColor(theme.accent, false, true);
  document.querySelectorAll(".theme-swatch").forEach((swatch) => {
    if ((swatch as HTMLElement).dataset.theme === themeKey) {
      swatch.classList.add("active");
    } else {
      swatch.classList.remove("active");
    }
  });
  localStorage.setItem("baobao_theme", themeKey);
  localStorage.setItem("baobao_custom_color", theme.accent);
}

// ============================================
// Single Neutral Glass Mode & Notch Open Trigger / Hover Delay
// ============================================

let isGlassMode = localStorage.getItem("baobao_glass_mode") === "true";
let isFloatingNotch = localStorage.getItem("baobao_floating_notch") === "true";

// Menu Bar Visibility State
let menuMusicEnabled = localStorage.getItem("baobao_menu_music") !== "false";
let menuNotesEnabled = localStorage.getItem("baobao_menu_notes") !== "false";
let menuFocusEnabled = localStorage.getItem("baobao_menu_focus") !== "false";
let menuCalendarEnabled = localStorage.getItem("baobao_menu_calendar") !== "false";
let showBatteryEnabled = localStorage.getItem("baobao_show_battery") !== "false";

function applyGlassMode(enabled: boolean): void {
  isGlassMode = enabled;
  const islandEl = document.getElementById("island");
  if (islandEl) {
    islandEl.classList.toggle("glass-mode", enabled);
  }
  const toggleGlass = document.getElementById("toggle-glass-mode") as HTMLInputElement | null;
  if (toggleGlass && toggleGlass.checked !== enabled) {
    toggleGlass.checked = enabled;
  }
  localStorage.setItem("baobao_glass_mode", String(enabled));
}

function applyFloatingNotch(enabled: boolean): void {
  isFloatingNotch = enabled;
  const islandEl = document.getElementById("island");
  if (islandEl) {
    islandEl.classList.toggle("floating-mode", enabled);
  }
  const toggleFloating = document.getElementById("toggle-floating-notch") as HTMLInputElement | null;
  if (toggleFloating && toggleFloating.checked !== enabled) {
    toggleFloating.checked = enabled;
  }
  localStorage.setItem("baobao_floating_notch", String(enabled));
  notifyIslandState();
}

function getEnabledSlides(): number[] {
  const slides: number[] = [];
  if (menuMusicEnabled) slides.push(0);
  if (menuNotesEnabled) slides.push(1);
  if (menuFocusEnabled) slides.push(2);
  if (menuCalendarEnabled) slides.push(3);
  if (slides.length === 0) {
    menuMusicEnabled = true;
    localStorage.setItem("baobao_menu_music", "true");
    slides.push(0);
  }
  return slides;
}

function applyMenuBarConfig(): void {
  const enabledSlides = getEnabledSlides();

  const btnMusic = document.getElementById("nav-btn-music");
  const btnNotes = document.getElementById("nav-btn-notes");
  const btnFocus = document.getElementById("nav-btn-focus");
  const btnCalendar = document.getElementById("nav-btn-calendar");
  const batteryEl = document.getElementById("header-battery");
  const islandEl = document.getElementById("island");

  if (btnMusic) btnMusic.style.display = menuMusicEnabled ? "inline-flex" : "none";
  if (btnNotes) btnNotes.style.display = menuNotesEnabled ? "inline-flex" : "none";
  if (btnFocus) btnFocus.style.display = menuFocusEnabled ? "inline-flex" : "none";
  if (btnCalendar) btnCalendar.style.display = menuCalendarEnabled ? "inline-flex" : "none";
  if (batteryEl) batteryEl.style.display = showBatteryEnabled ? "inline-flex" : "none";
  if (islandEl) islandEl.classList.toggle("with-battery", showBatteryEnabled);

  const tMusic = document.getElementById("toggle-menu-music") as HTMLInputElement | null;
  const tNotes = document.getElementById("toggle-menu-notes") as HTMLInputElement | null;
  const tFocus = document.getElementById("toggle-menu-focus") as HTMLInputElement | null;
  const tCalendar = document.getElementById("toggle-menu-calendar") as HTMLInputElement | null;
  const tBattery = document.getElementById("toggle-menu-battery") as HTMLInputElement | null;

  if (tMusic) tMusic.checked = menuMusicEnabled;
  if (tNotes) tNotes.checked = menuNotesEnabled;
  if (tFocus) tFocus.checked = menuFocusEnabled;
  if (tCalendar) tCalendar.checked = menuCalendarEnabled;
  if (tBattery) tBattery.checked = showBatteryEnabled;

  localStorage.setItem("baobao_menu_music", String(menuMusicEnabled));
  localStorage.setItem("baobao_menu_notes", String(menuNotesEnabled));
  localStorage.setItem("baobao_menu_focus", String(menuFocusEnabled));
  localStorage.setItem("baobao_menu_calendar", String(menuCalendarEnabled));
  localStorage.setItem("baobao_show_battery", String(showBatteryEnabled));

  if (!enabledSlides.includes(currentSlide)) {
    setSlide(enabledSlides[0]);
  }
  updateMiniLyricsPill();
  notifyIslandState();
}

type OpenMode = "hover" | "click";
let currentOpenMode: OpenMode = (localStorage.getItem("baobao_open_mode") as OpenMode) === "click" ? "click" : "hover";

let currentHoverDelayMs = parseInt(localStorage.getItem("baobao_hover_delay") || "250", 10);
if (isNaN(currentHoverDelayMs) || currentHoverDelayMs < 0 || currentHoverDelayMs > 800) {
  currentHoverDelayMs = 250;
}

function applyOpenMode(mode: OpenMode): void {
  currentOpenMode = mode === "click" ? "click" : "hover";
  localStorage.setItem("baobao_open_mode", currentOpenMode);

  const btnHover = document.getElementById("btn-mode-hover");
  const btnClick = document.getElementById("btn-mode-click");
  if (btnHover) btnHover.classList.toggle("active", currentOpenMode === "hover");
  if (btnClick) btnClick.classList.toggle("active", currentOpenMode === "click");

  const hoverDelayRow = document.getElementById("settings-item-hover-delay");
  if (hoverDelayRow) {
    hoverDelayRow.style.opacity = currentOpenMode === "hover" ? "1" : "0.45";
    hoverDelayRow.style.pointerEvents = currentOpenMode === "hover" ? "auto" : "none";
  }
}

function applyHoverDelay(ms: number): void {
  currentHoverDelayMs = Math.max(0, Math.min(800, ms));
  const sec = (currentHoverDelayMs / 1000).toFixed(2);
  const valEl = document.getElementById("txt-hover-delay-val");
  if (valEl) valEl.textContent = `${sec}s`;
  const slider = document.getElementById("slider-hover-delay") as HTMLInputElement | null;
  if (slider && parseInt(slider.value, 10) !== currentHoverDelayMs) {
    slider.value = currentHoverDelayMs.toString();
  }
  localStorage.setItem("baobao_hover_delay", currentHoverDelayMs.toString());
}

let currentShortcutKey = localStorage.getItem("baobao_shortcut_key") || "`";
let currentShortcutVk = parseInt(localStorage.getItem("baobao_shortcut_vk") || "192", 10);
if (isNaN(currentShortcutVk)) currentShortcutVk = 192; // VK_OEM_3
let isRecordingShortcut = false;

function updateShortcutDisplay(): void {
  const disp = document.getElementById("txt-shortcut-key-display");
  if (disp) disp.textContent = currentShortcutKey;
}

// ============================================
// Multi-Language Support (i18n — Clean Notch Terminology)
// ============================================

type Lang = "en" | "id" | "ja" | "zh";

const I18N: Record<Lang, Record<string, string>> = {
  en: {
    sfxTitle: "Sound Effects",
    miniLyricsTitle: "Mini Pill Lyrics",
    langTitle: "Language",
    themeTitle: "Appearance",
    presetColorsTitle: "Preset Colors",
    customColorTitle: "Custom Color Picker",
    glassModeTitle: "Glass",
    openModeTitle: "Open Notch",
    modeHover: "Hover",
    modeClick: "Click",
    hoverDelayTitle: "Hover Hold Delay",
    resetAllTitle: "Reset Settings",
    resetAllBtn: "Reset",
    resetConfirmTitle: "Reset All Settings?",
    resetConfirmDesc: "All appearance colors, keyboard shortcuts, hover settings, and positions will be restored to default.",
    btnCancel: "Cancel",
    btnConfirmReset: "Yes, Reset",
    shortcutTitle: "Hide / Show Key",
    shortcutRecording: "Press key...",
    waitingMusic: "Waiting for music...",
    playAnySong: "Play any song to start listening",
    noLyrics: "No lyrics available",
    loadingLyrics: "Loading lyrics...",
    autostartTitle: "Start on Boot",
    monitorTitle: "Display Monitor",
    positionTitle: "Position",
    btnResetCenter: "Reset",
    appFooter: "BaoBao v0.1.2",
    aboutSubtitle: "Smart Desktop Notch for Windows & macOS",
    settingsCategory: "Settings",
    navGeneral: "General",
    navDisplay: "Display",
    navAppearance: "Appearance",
    navMenuBar: "Menu Bar",
    navAbout: "About",
    navPillMusic: "Music",
    navPillNotes: "Notes",
    navPillFocus: "Focus",
    navPillCalendar: "Calendar",
    floatingNotchTitle: "Floating Notch",
    secMenuBarTabs: "Notch Menus",
    secMenuBarStatus: "Status Indicators",
    menuMusicTitle: "Music Player",
    menuNotesTitle: "Quick Notes",
    menuFocusTitle: "Focus Time",
    menuCalendarTitle: "Calendar",
    menuBatteryTitle: "Laptop Battery",
    calPlaceholder: "Add event reminder...",
    calEventsLabel: "Events",
    calEmpty: "No events on this date",
    calAllDay: "All Day",
    focusStateTimer: "TIMER",
    focusStateStopwatch: "STOPWATCH",
    focusTabTimer: "Timer",
    focusTabStopwatch: "Stopwatch",
    focusStatusReady: "Ready",
    focusStatusRunning: "Running",
    focusStatusPaused: "Paused",
    focusLapsEmpty: "Press Lap while running to record splits",
    focusBtnStartTimer: "Start Focus",
    focusBtnStartStopwatch: "Start",
    focusBtnPause: "Pause",
    focusBtnResume: "Resume",
    focusBtnLap: "Lap",
    focusAlertFinished: "Focus Time Up!",
    notesTitle: "Notes",
    notesCountLabel: "Notes",
    notesBtnNew: "New",
    notesBtnSave: "Save",
    notesEmpty: "No notes yet. Click New to create!",
    untitledNote: "Untitled Note",
    notesTitlePlaceholder: "Title...",
    notesBodyPlaceholder: "Write details here...",
    notesCreatedPlaceholder: "Created date...",
    notesDuePlaceholder: "No deadline",
    tooltipSettings: "Settings",
    tooltipPin: "Keep Notch Expanded",
    tooltipToggleLyrics: "Toggle Lyrics",
    tooltipPrevTrack: "Previous Track",
    tooltipPlayPause: "Play / Pause",
    tooltipNextTrack: "Next Track",
    tooltipVolume: "Volume (Scroll mouse to adjust)",
    tooltipMute: "Mute / Unmute",
    tooltipFullLyrics: "Full Lyrics",
    tooltipCloseLyrics: "Close Lyrics",
    tooltipNewNote: "New Note",
    tooltipDeleteNote: "Delete Note",
    tooltipSaveNote: "Save Note",
    tooltipCreatedDate: "Date Created",
    tooltipDueDate: "Due Date (Deadline)",
    tooltipVisualizer: "Audio Visualizer",
    tooltipBaobao: "BaoBao",
    tooltipDotMusic: "Music",
    tooltipDotNotes: "Notes",
    tooltipMarkComplete: "Mark as Completed",
    tooltipMarkIncomplete: "Mark as Incomplete",
    tooltipCloseEditor: "Close Editor",
  },
  id: {
    sfxTitle: "Suara SFX",
    miniLyricsTitle: "Lirik Mini Pill",
    langTitle: "Bahasa",
    themeTitle: "Appearance",
    presetColorsTitle: "Pilihan Warna",
    customColorTitle: "Pilih Warna Kustom",
    glassModeTitle: "Glass",
    openModeTitle: "Buka Notch",
    modeHover: "Hover",
    modeClick: "Click",
    hoverDelayTitle: "Jeda Tahan Hover",
    resetAllTitle: "Reset Pengaturan",
    resetAllBtn: "Reset",
    resetConfirmTitle: "Reset Semua Pengaturan?",
    resetConfirmDesc: "Semua preferensi warna, pintasan keyboard, pengaturan hover, dan posisi akan dikembalikan ke setelan awal.",
    btnCancel: "Batal",
    btnConfirmReset: "Ya, Reset",
    shortcutTitle: "Tombol Hide / Show",
    shortcutRecording: "Tekan tombol...",
    waitingMusic: "Menunggu musik...",
    playAnySong: "Putar lagu untuk mulai mendengarkan",
    noLyrics: "Lirik tidak tersedia",
    loadingLyrics: "Memuat lirik...",
    autostartTitle: "Mulai Otomatis",
    monitorTitle: "Layar / Monitor",
    positionTitle: "Posisi Notch",
    btnResetCenter: "Reset",
    appFooter: "BaoBao v0.1.2",
    aboutSubtitle: "Notch Desktop Pintar untuk Windows & macOS",
    settingsCategory: "Pengaturan",
    navGeneral: "Umum",
    navDisplay: "Tampilan",
    navAppearance: "Appearance",
    navMenuBar: "Menu Bar",
    navAbout: "Tentang",
    navPillMusic: "Music",
    navPillNotes: "Notes",
    navPillFocus: "Focus",
    navPillCalendar: "Calendar",
    floatingNotchTitle: "Floating Notch",
    secMenuBarTabs: "Menu Notch",
    secMenuBarStatus: "Indikator Status",
    menuMusicTitle: "Pemutar Musik",
    menuNotesTitle: "Catatan Cepat",
    menuFocusTitle: "Focus Time",
    menuCalendarTitle: "Kalender",
    menuBatteryTitle: "Baterai Laptop",
    calPlaceholder: "Tandai acara di tanggal ini...",
    calEventsLabel: "Acara",
    calEmpty: "Belum ada acara di tanggal ini",
    calAllDay: "Seharian",
    focusStateTimer: "TIMER",
    focusStateStopwatch: "STOPWATCH",
    focusTabTimer: "Timer",
    focusTabStopwatch: "Stopwatch",
    focusStatusReady: "Siap",
    focusStatusRunning: "Berjalan",
    focusStatusPaused: "Dijeda",
    focusLapsEmpty: "Tekan Lap saat berjalan untuk mencatat waktu",
    focusBtnStartTimer: "Mulai Fokus",
    focusBtnStartStopwatch: "Mulai",
    focusBtnPause: "Jeda",
    focusBtnResume: "Lanjutkan",
    focusBtnLap: "Lap",
    focusAlertFinished: "Waktu Fokus Habis!",
    notesTitle: "Catatan",
    notesCountLabel: "Catatan",
    notesBtnNew: "Baru",
    notesBtnSave: "Simpan",
    notesEmpty: "Belum ada catatan. Klik Baru untuk membuat!",
    untitledNote: "Catatan Tanpa Judul",
    notesTitlePlaceholder: "Judul catatan...",
    notesBodyPlaceholder: "Tulis rincian catatan di sini...",
    notesCreatedPlaceholder: "Tanggal dibuat...",
    notesDuePlaceholder: "Tanpa tenggat",
    tooltipSettings: "Pengaturan",
    tooltipPin: "Sematkan Notch Tetap Terbuka",
    tooltipToggleLyrics: "Tampilkan / Sembunyikan Lirik",
    tooltipPrevTrack: "Lagu Sebelumnya",
    tooltipPlayPause: "Putar / Jeda",
    tooltipNextTrack: "Lagu Berikutnya",
    tooltipVolume: "Volume (Gulir mouse untuk mengatur)",
    tooltipMute: "Bisukan / Bunyikan",
    tooltipFullLyrics: "Lirik Lengkap",
    tooltipCloseLyrics: "Tutup Lirik",
    tooltipNewNote: "Catatan Baru",
    tooltipDeleteNote: "Hapus Catatan",
    tooltipSaveNote: "Simpan Catatan",
    tooltipCreatedDate: "Tanggal Dibuat",
    tooltipDueDate: "Tenggat Waktu",
    tooltipVisualizer: "Visualiser Audio",
    tooltipBaobao: "BaoBao",
    tooltipDotMusic: "Music",
    tooltipDotNotes: "Notes",
    tooltipMarkComplete: "Tandai Selesai",
    tooltipMarkIncomplete: "Tandai Belum Selesai",
    tooltipCloseEditor: "Tutup Editor",
  },
  ja: {
    sfxTitle: "効果音 (SFX)",
    miniLyricsTitle: "ミニ歌詞表示",
    langTitle: "言語",
    themeTitle: "外観 (Appearance)",
    presetColorsTitle: "プリセットカラー",
    customColorTitle: "カスタムカラー",
    glassModeTitle: "Glass",
    openModeTitle: "ノッチを開く操作",
    modeHover: "Hover",
    modeClick: "Click",
    hoverDelayTitle: "ホバー保持時間",
    resetAllTitle: "設定を初期化",
    resetAllBtn: "Reset",
    resetConfirmTitle: "すべての設定を初期化しますか？",
    resetConfirmDesc: "カラー、ショートカット、ホバー設定、配置などがすべて初期状態に戻ります。",
    btnCancel: "キャンセル",
    btnConfirmReset: "初期化する",
    shortcutTitle: "表示/非表示キー",
    shortcutRecording: "キーを押す...",
    waitingMusic: "音楽を待機中...",
    playAnySong: "曲を再生して開始",
    noLyrics: "歌詞がありません",
    loadingLyrics: "歌詞を読み込み中...",
    autostartTitle: "自動起動",
    monitorTitle: "ディスプレイ",
    positionTitle: "配置",
    btnResetCenter: "Reset",
    appFooter: "BaoBao v0.1.2",
    aboutSubtitle: "Windows & macOS 向けスマートデスクトップノッチ",
    settingsCategory: "設定",
    navGeneral: "一般",
    navDisplay: "ディスプレイ",
    navAppearance: "外観 (Appearance)",
    navMenuBar: "メニューバー",
    navAbout: "情報",
    navPillMusic: "Music",
    navPillNotes: "Notes",
    navPillFocus: "Focus",
    navPillCalendar: "Calendar",
    floatingNotchTitle: "フローティングノッチ",
    secMenuBarTabs: "ノッチメニュー",
    secMenuBarStatus: "ステータス表示",
    menuMusicTitle: "ミュージック",
    menuNotesTitle: "クイックメモ",
    menuFocusTitle: "集中タイマー (Focus)",
    menuCalendarTitle: "カレンダー & リマインダー",
    menuBatteryTitle: "バッテリー残量",
    calPlaceholder: "予定・イベントを追加...",
    calEventsLabel: "件の予定",
    calEmpty: "予定はありません。追加してリマインド！",
    calAllDay: "終日",
    focusStateTimer: "TIMER",
    focusStateStopwatch: "STOPWATCH",
    focusTabTimer: "タイマー",
    focusTabStopwatch: "ストップウォッチ",
    focusStatusReady: "準備完了",
    focusStatusRunning: "実行中",
    focusStatusPaused: "一時停止",
    focusLapsEmpty: "実行中にラップを押して記録",
    focusBtnStartTimer: "開始する",
    focusBtnStartStopwatch: "スタート",
    focusBtnPause: "一時停止",
    focusBtnResume: "再開する",
    focusBtnLap: "ラップ",
    focusAlertFinished: "フォーカス時間終了！",
    notesTitle: "メモ",
    notesCountLabel: "件のメモ",
    notesBtnNew: "新規",
    notesBtnSave: "保存",
    notesEmpty: "メモがまだありません。「新規」をクリック！",
    untitledNote: "無題のメモ",
    notesTitlePlaceholder: "タイトル...",
    notesBodyPlaceholder: "詳細をここに入力...",
    notesCreatedPlaceholder: "作成日...",
    notesDuePlaceholder: "期限なし",
    tooltipSettings: "設定",
    tooltipPin: "ノッチを常に展開して固定",
    tooltipToggleLyrics: "歌詞の切り替え",
    tooltipPrevTrack: "前の曲",
    tooltipPlayPause: "再生 / 一時停止",
    tooltipNextTrack: "次の曲",
    tooltipVolume: "音量 (マウススクロールで調整)",
    tooltipMute: "消音 / 解除",
    tooltipFullLyrics: "全画面歌詞",
    tooltipCloseLyrics: "歌詞を閉じる",
    tooltipNewNote: "新規メモ",
    tooltipDeleteNote: "メモを削除",
    tooltipSaveNote: "メモを保存",
    tooltipCreatedDate: "作成日時",
    tooltipDueDate: "期限・締切",
    tooltipVisualizer: "オーディオビジュアライザー",
    tooltipBaobao: "BaoBao",
    tooltipDotMusic: "Music",
    tooltipDotNotes: "Notes",
    tooltipMarkComplete: "完了にする",
    tooltipMarkIncomplete: "未完了にする",
    tooltipCloseEditor: "エディタを閉じる",
  },
  zh: {
    sfxTitle: "音效 (SFX)",
    miniLyricsTitle: "迷你胶囊歌词",
    langTitle: "语言",
    themeTitle: "外观 (Appearance)",
    presetColorsTitle: "预设颜色",
    customColorTitle: "自定义取色器",
    glassModeTitle: "Glass",
    openModeTitle: "展开刘海 (Notch)",
    modeHover: "Hover",
    modeClick: "Click",
    hoverDelayTitle: "悬停等待时间",
    resetAllTitle: "重置设置",
    resetAllBtn: "Reset",
    resetConfirmTitle: "重置所有设置？",
    resetConfirmDesc: "所有颜色、快捷键、悬停设置和窗口位置都将恢复为默认设置。",
    btnCancel: "取消",
    btnConfirmReset: "确认重置",
    shortcutTitle: "显示/隐藏快捷键",
    shortcutRecording: "按下按键...",
    waitingMusic: "等待音乐播放...",
    playAnySong: "播放任意音乐即可开始",
    noLyrics: "暂无歌词",
    loadingLyrics: "正在加载歌词...",
    autostartTitle: "开机自启",
    monitorTitle: "显示器",
    positionTitle: "窗口位置",
    btnResetCenter: "Reset",
    appFooter: "BaoBao v0.1.2",
    aboutSubtitle: "适用于 Windows 与 macOS 的智能桌面刘海 (Notch)",
    settingsCategory: "设置",
    navGeneral: "通用",
    navDisplay: "显示",
    navAppearance: "外观 (Appearance)",
    navMenuBar: "菜单栏",
    navAbout: "关于",
    navPillMusic: "Music",
    navPillNotes: "Notes",
    navPillFocus: "Focus",
    navPillCalendar: "Calendar",
    floatingNotchTitle: "悬浮刘海 (Floating)",
    secMenuBarTabs: "刘海功能菜单",
    secMenuBarStatus: "状态指示器",
    menuMusicTitle: "音乐播放器",
    menuNotesTitle: "快捷便签",
    menuFocusTitle: "专注时钟 (Focus)",
    menuCalendarTitle: "日历与日程提醒",
    menuBatteryTitle: "笔记本电量",
    calPlaceholder: "添加日程或活动...",
    calEventsLabel: "个日程",
    calEmpty: "暂无日程，添加一个定时提醒吧！",
    calAllDay: "全天",
    focusStateTimer: "TIMER",
    focusStateStopwatch: "STOPWATCH",
    focusTabTimer: "计时器",
    focusTabStopwatch: "秒表",
    focusStatusReady: "就绪",
    focusStatusRunning: "运行中",
    focusStatusPaused: "已暂停",
    focusLapsEmpty: "运行时点击计次记录分段",
    focusBtnStartTimer: "开始专注",
    focusBtnStartStopwatch: "开始",
    focusBtnPause: "暂停",
    focusBtnResume: "继续",
    focusBtnLap: "计次",
    focusAlertFinished: "专注时间到！",
    notesTitle: "便签",
    notesCountLabel: "条便签",
    notesBtnNew: "新建",
    notesBtnSave: "保存",
    notesEmpty: "暂无便签，点击“新建”添加！",
    untitledNote: "无标题便签",
    notesTitlePlaceholder: "便签标题...",
    notesBodyPlaceholder: "在这里输入详细内容...",
    notesCreatedPlaceholder: "创建日期...",
    notesDuePlaceholder: "无截止时间",
    tooltipSettings: "设置",
    tooltipPin: "固定展开 Notch",
    tooltipToggleLyrics: "显示/隐藏歌词",
    tooltipPrevTrack: "上一首",
    tooltipPlayPause: "播放 / 暂停",
    tooltipNextTrack: "下一首",
    tooltipVolume: "音量调节（滚轮调节）",
    tooltipMute: "静音 / 取消静音",
    tooltipFullLyrics: "完整歌词",
    tooltipCloseLyrics: "关闭歌词",
    tooltipNewNote: "新建便签",
    tooltipDeleteNote: "删除便签",
    tooltipSaveNote: "保存便签",
    tooltipCreatedDate: "创建时间",
    tooltipDueDate: "截止时间",
    tooltipVisualizer: "音频可视化",
    tooltipBaobao: "BaoBao",
    tooltipDotMusic: "Music",
    tooltipDotNotes: "Notes",
    tooltipMarkComplete: "标记为已完成",
    tooltipMarkIncomplete: "标记为未完成",
    tooltipCloseEditor: "关闭编辑器",
  },
};

let currentLang: Lang = (localStorage.getItem("baobao_lang") as Lang) || "en";
let activeSettingsTab = "general";

function updateAllTooltips(dict: Record<string, string>): void {
  const setT = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el && text) el.title = text;
  };
  const setBySelector = (sel: string, text: string) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (text) (el as HTMLElement).title = text;
    });
  };

  setT("btn-open-settings", dict.tooltipSettings);
  setT("btn-nav-settings", dict.tooltipSettings);
  setT("btn-pin-island", dict.tooltipPin);
  setT("nav-btn-music", dict.tooltipDotMusic);
  setT("nav-btn-notes", dict.tooltipDotNotes);
  setT("btn-lyrics", dict.tooltipToggleLyrics);
  setT("btn-prev", dict.tooltipPrevTrack);
  setT("btn-play-pause", dict.tooltipPlayPause);
  setT("btn-next", dict.tooltipNextTrack);
  setT("volume-group", dict.tooltipVolume);
  setT("btn-volume-mute", dict.tooltipMute);
  setT("btn-full-lyrics", dict.tooltipFullLyrics);
  setT("btn-exit-full-lyrics", dict.tooltipCloseLyrics);
  setT("btn-add-note", dict.tooltipNewNote);
  setT("btn-delete-note", dict.tooltipDeleteNote);
  setT("btn-save-note", dict.tooltipSaveNote);
  setT("btn-close-note", dict.tooltipCloseEditor);

  setBySelector(".note-date-chip:not(.due)", dict.tooltipCreatedDate);
  setBySelector(".note-date-chip.due", dict.tooltipDueDate);
  setBySelector(".sound-wave", dict.tooltipVisualizer);
  setBySelector(".baobao-logo", dict.tooltipBaobao);
}

function updateHeaderCategoryTitle(): void {
  const headerCat = document.getElementById("header-category");
  if (!headerCat) return;

  if (currentSlide === 0) {
    headerCat.innerHTML = `Music <span class="header-category-accent">Player</span>`;
  } else if (currentSlide === 1) {
    headerCat.innerHTML = `Quick <span class="header-category-accent">Notes</span>`;
  } else if (currentSlide === 2) {
    headerCat.innerHTML = `Focus <span class="header-category-accent">Time</span>`;
  } else {
    headerCat.innerHTML = `Event <span class="header-category-accent">Calendar</span>`;
  }
}

function applyLanguage(lang: Lang): void {
  currentLang = lang;
  localStorage.setItem("baobao_lang", lang);
  const dict = I18N[lang] || I18N.en;

  const setText = (id: string, val?: string) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  };

  setText("txt-sfx-label", dict.sfxTitle);
  setText("txt-lyrics-label", dict.miniLyricsTitle);
  setText("txt-lang-label", dict.langTitle);

  setText("txt-theme-label", dict.themeTitle);
  setText("txt-preset-colors-label", dict.presetColorsTitle);
  setText("txt-custom-color-label", dict.customColorTitle);
  setText("txt-glass-mode-label", dict.glassModeTitle);

  setText("txt-open-mode-label", dict.openModeTitle);
  setText("btn-mode-hover", dict.modeHover);
  setText("btn-mode-click", dict.modeClick);
  setText("txt-hover-delay-label", dict.hoverDelayTitle);

  setText("txt-reset-all-label", dict.resetAllTitle);
  setText("txt-reset-all-btn", dict.resetAllBtn);

  setText("txt-modal-reset-title", dict.resetConfirmTitle);
  setText("txt-modal-reset-desc", dict.resetConfirmDesc);
  setText("btn-cancel-reset", dict.btnCancel);
  setText("btn-confirm-reset", dict.btnConfirmReset);

  setText("txt-shortcut-label", dict.shortcutTitle);
  setText("txt-autostart-label", dict.autostartTitle);
  setText("txt-monitor-label", dict.monitorTitle);
  setText("txt-position-label", dict.positionTitle);
  setText("txt-reset-pos-btn", dict.btnResetCenter);
  setText("txt-app-footer", dict.appFooter);
  setText("txt-about-subtitle", dict.aboutSubtitle);

  setText("nav-txt-general", dict.navGeneral);
  setText("nav-txt-display", dict.navDisplay);
  setText("nav-txt-appearance", dict.navAppearance);
  setText("nav-txt-menubar", dict.navMenuBar);
  setText("nav-txt-about", dict.navAbout);

  setText("nav-pill-txt-music", dict.navPillMusic);
  setText("nav-pill-txt-notes", dict.navPillNotes);
  setText("nav-pill-txt-focus", dict.navPillFocus);
  setText("nav-pill-txt-calendar", dict.navPillCalendar);

  setText("txt-floating-notch-label", dict.floatingNotchTitle);
  setText("sec-lbl-menubar-tabs", dict.secMenuBarTabs);
  setText("sec-lbl-menubar-status", dict.secMenuBarStatus);
  setText("txt-menubar-music", dict.menuMusicTitle);
  setText("txt-menubar-notes", dict.menuNotesTitle);
  setText("txt-menubar-focus", dict.menuFocusTitle);
  setText("txt-menubar-calendar", dict.menuCalendarTitle);
  setText("txt-menubar-battery", dict.menuBatteryTitle);

  const calTitleInput = document.getElementById("input-cal-event-title") as HTMLInputElement | null;
  if (calTitleInput && dict.calPlaceholder) calTitleInput.placeholder = dict.calPlaceholder;
  renderCalendarUI();

  setText("txt-focus-tab-timer", dict.focusTabTimer);
  setText("txt-focus-tab-stopwatch", dict.focusTabStopwatch);
  setText("txt-focus-lap-btn", dict.focusBtnLap);
  setText("txt-focus-laps-empty", dict.focusLapsEmpty);
  setText("pill-focus-alert-text", dict.focusAlertFinished);
  updateFocusUI();

  const activeNavBtn = document.querySelector(`.settings-nav-item[data-tab="${activeSettingsTab}"] .nav-item-label`);
  const paneTitle = document.getElementById("settings-pane-title");
  if (paneTitle && activeNavBtn) {
    paneTitle.textContent = activeNavBtn.textContent;
  }

  const noteTitleInput = document.getElementById("note-title-input") as HTMLInputElement | null;
  if (noteTitleInput) noteTitleInput.placeholder = dict.notesTitlePlaceholder;
  const noteBodyInput = document.getElementById("note-body-input") as HTMLTextAreaElement | null;
  if (noteBodyInput) noteBodyInput.placeholder = dict.notesBodyPlaceholder;

  setText("txt-btn-new-note", dict.notesBtnNew);
  setText("txt-btn-save-note", dict.notesBtnSave);

  const selectLang = document.getElementById("select-language") as HTMLSelectElement | null;
  if (selectLang) selectLang.value = lang;

  updateHeaderCategoryTitle();
  updateAllTooltips(dict);
  renderNotesList();
  populateNoteEditor();
}

let miniLyricsEnabled = true;
const savedMini = localStorage.getItem("baobao_mini_lyrics_v3");
if (savedMini !== null) {
  miniLyricsEnabled = savedMini === "true";
} else {
  miniLyricsEnabled = true;
  localStorage.setItem("baobao_mini_lyrics", "true");
  localStorage.setItem("baobao_mini_lyrics_v3", "true");
}

// ============================================
// Data Models
// ============================================

interface MediaPayload {
  title: string;
  artist: string;
  album?: string;
  is_playing: boolean;
  position_secs: number;
  position_at_ms: number;
  duration_secs: number;
  cover_data_url?: string;
}

interface LyricLine {
  time: number;
  text: string;
}

let currentMedia: MediaPayload = {
  title: "",
  artist: "",
  album: "",
  is_playing: false,
  position_secs: 0,
  position_at_ms: Date.now(),
  duration_secs: 211,
};

let currentSlide = 0; // 0 = Music, 1 = Notes
let isExpanded = false;
let isPinned = localStorage.getItem("baobao_pinned") === "true";
let isSettingsOpen = false;
let isLyricsOpen = false;
let collapseTimeout: ReturnType<typeof setTimeout> | null = null;
let lastArtworkQuery = "";
let lastLyricsQuery = "";
let lastTrackKey = "";
let lastPillLyric = "";

// Horizontal Dragging State (Locked to screen top)
let isDraggingIsland = false;
let isDragMouseDown = false;
let dragStartX = 0;
let dragInitialOffset = 0;
let hasMovedSignificantly = false;
let hoverExpandTimer: ReturnType<typeof setTimeout> | null = null;
let currentOffsetX = parseFloat(localStorage.getItem("baobao_offset_x") || "0");
if (isNaN(currentOffsetX)) currentOffsetX = 0;

// Settings Floating Window Dragging Offset
let settingsOffsetX = 0;
let settingsOffsetY = 0;
let settingsHasCustomOffset = false;

// 3-Minute Idle Track Monitoring
let lastActiveTrackTime = Date.now();
const IDLE_THRESHOLD_MS = 3 * 60 * 1000;
let isMusicIdle = false;

// Realtime Synced Lyrics State
let activeLyrics: LyricLine[] = [];
let currentLyricIndex = -1;

let totalSeconds = 211;

// ============================================
// Coucou-Style Accurate Real-time Playback Position
// ============================================

function getAccuratePosition(): number {
  const now = Date.now();
  const elapsed = currentMedia.is_playing
    ? Math.max(0, (now - (currentMedia.position_at_ms || now)) / 1000)
    : 0;
  const pos = (currentMedia.position_secs || 0) + elapsed;
  const dur = currentMedia.duration_secs || totalSeconds;
  return dur > 0 ? Math.min(pos, dur) : pos;
}

function setLocalPlaying(playing: boolean): void {
  if (currentMedia.is_playing === playing) return;
  const now = Date.now();
  currentMedia.position_secs = getAccuratePosition();
  currentMedia.position_at_ms = now;
  currentMedia.is_playing = playing;

  if (playing) {
    lastActiveTrackTime = now;
  }
  updateMediaUI(currentMedia);
}

// ============================================
// Rust Hit-Test Synchronization
// ============================================

let currentMiniWidth = 330;
let isFocusAlertActive = false;
let isTimerRunning = false;
let isStopwatchRunning = false;

function getClampedOffset(offset: number, islandWidth: number): number {
  const screenW = window.innerWidth;
  const maxAllowedOffset = Math.max(0, (screenW - islandWidth) / 2 - 16);
  return Math.max(-maxAllowedOffset, Math.min(maxAllowedOffset, offset));
}

function notifyIslandState(): void {
  const hasMiniLyrics = !isExpanded && !isFocusAlertActive && !isMusicIdle && (currentMedia.is_playing || !!currentMedia.title) && activeLyrics.length > 0 && miniLyricsEnabled;
  const isWide = (isLyricsOpen || isInFullLyricsMode) && !isMusicIdle;
  const focusMiniExtra = (isTimerRunning ? 48 : 0) + (isStopwatchRunning ? 48 : 0);
  const batteryExtra = showBatteryEnabled ? 16 : 0;
  const collapsedBaseW = (isFocusAlertActive ? 256 : (210 + batteryExtra)) + focusMiniExtra;

  const islandEl = document.getElementById("island");
  if (islandEl) {
    islandEl.style.setProperty("--collapsed-pill-width", `${collapsedBaseW}px`);
  }
  const estimatedW = isExpanded ? (isWide ? 660 : 490) : (hasMiniLyrics ? (currentMiniWidth || 330) : collapsedBaseW);
  const actualW = islandEl ? islandEl.offsetWidth || estimatedW : estimatedW;

  currentOffsetX = getClampedOffset(currentOffsetX, actualW);
  if (islandEl) {
    islandEl.style.setProperty("--island-offset-x", `${currentOffsetX}px`);
    islandEl.scrollTop = 0;
    islandEl.scrollLeft = 0;
  }

  const maxOffX = Math.max(0, (window.innerWidth - 590) / 2 - 8);
  const maxScreenY = Math.max(8, window.innerHeight - 410 - 12);
  const notchBottom = (isExpanded ? (isWide ? 222 : 208) : 35) + (isFloatingNotch ? 8 : 0);

  if (!settingsHasCustomOffset) {
    settingsOffsetX = Math.max(-maxOffX, Math.min(maxOffX, currentOffsetX));
    settingsOffsetY = Math.min(notchBottom + 14, maxScreenY);
  } else {
    settingsOffsetX = Math.max(-maxOffX, Math.min(maxOffX, settingsOffsetX));
    settingsOffsetY = Math.max(8, Math.min(maxScreenY, settingsOffsetY));
  }

  const settingsWinEl = document.getElementById("settings-window");
  if (settingsWinEl) {
    settingsWinEl.style.setProperty("--settings-offset-x", `${settingsOffsetX}px`);
    settingsWinEl.style.setProperty("--settings-offset-y", `${settingsOffsetY}px`);
  }

  invoke("update_island_state", {
    expanded: isExpanded,
    withLyrics: isWide,
    withMiniLyrics: hasMiniLyrics,
    miniWidth: hasMiniLyrics ? currentMiniWidth : collapsedBaseW,
    offsetX: currentOffsetX,
    settingsOpen: isSettingsOpen,
    settingsOffsetX: settingsOffsetX,
    settingsOffsetY: settingsOffsetY,
  }).catch(() => {});
}

// ============================================
// Standalone Floating Settings Window Controller
// ============================================

function toggleSettingsWindow(forceState?: boolean): void {
  const next = forceState !== undefined ? forceState : !isSettingsOpen;
  isSettingsOpen = next;

  const winEl = document.getElementById("settings-window");
  const btnSettingsHeader = document.getElementById("btn-open-settings");
  const btnSettingsNav = document.getElementById("btn-nav-settings");

  if (isSettingsOpen) {
    settingsHasCustomOffset = false;
  }

  if (winEl) {
    winEl.style.display = isSettingsOpen ? "flex" : "none";
  }
  if (btnSettingsHeader) {
    btnSettingsHeader.classList.toggle("active", isSettingsOpen);
  }
  if (btnSettingsNav) {
    btnSettingsNav.classList.toggle("active", isSettingsOpen);
  }

  notifyIslandState();
}

function switchSettingsTab(tabKey: string): void {
  activeSettingsTab = tabKey;
  document.querySelectorAll(".settings-nav-item").forEach((btn) => {
    const el = btn as HTMLElement;
    const isMatch = el.dataset.tab === tabKey;
    el.classList.toggle("active", isMatch);
    if (isMatch) {
      const lbl = el.querySelector(".nav-item-label");
      const titleEl = document.getElementById("settings-pane-title");
      if (titleEl && lbl) {
        titleEl.textContent = lbl.textContent;
      }
    }
  });

  document.querySelectorAll(".settings-tab-pane").forEach((pane) => {
    pane.classList.toggle("active", pane.id === `settings-tab-${tabKey}`);
  });
}

// ============================================
// Live Clock & Date Formatter
// ============================================

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function updateClock(): void {
  const now = new Date();
  const dayName = DAYS[now.getDay()];
  const dayNum = now.getDate();
  const monthName = MONTHS[now.getMonth()];
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const timeString = `${hours}:${minutes}`;
  const fullDateTimeString = `${dayName} ${dayNum} ${monthName} ${year} <strong>${timeString}</strong>`;

  const pillClock = document.querySelector(".pill-clock");
  if (pillClock) pillClock.textContent = timeString;

  const headerDateTime = document.getElementById("full-datetime");
  if (headerDateTime) headerDateTime.innerHTML = fullDateTimeString;

  checkCalendarNotifications(now);
}

// ============================================
// Notes Tab State & Management (Modern Minimalist)
// ============================================

const MONTH_NAMES: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  ja: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  zh: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
};

function formatDateTime(d: Date = new Date(), lang: Lang = currentLang): string {
  const day = d.getDate();
  const m = d.getMonth();
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");

  if (lang === "ja" || lang === "zh") {
    return `${year}年${m + 1}月${day}日 ${hours}:${mins}`;
  }
  const months = MONTH_NAMES[lang] || MONTH_NAMES.en;
  return `${day} ${months[m]} ${year}, ${hours}:${mins}`;
}

function formatDateOnly(d: Date, lang: Lang = currentLang): string {
  const day = d.getDate();
  const m = d.getMonth();
  const year = d.getFullYear();

  if (lang === "ja" || lang === "zh") {
    return `${year}年${m + 1}月${day}日`;
  }
  const months = MONTH_NAMES[lang] || MONTH_NAMES.en;
  return `${day} ${months[m]} ${year}`;
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdTimestamp: number;
  dueDate: string;
  dueDateIso?: string;
  isCompleted?: boolean;
}

let notesList: NoteItem[] = [];
let activeNoteId: string | null = null;

function updateEditorVisibility(show: boolean): void {
  const container = document.getElementById("notes-container");
  const island = document.getElementById("island");

  if (show && activeNoteId !== null) {
    container?.classList.remove("no-editor");
  } else {
    container?.classList.add("no-editor");
  }
  island?.classList.remove("with-editor");

  notifyIslandState();
}

function loadNotes(): void {
  try {
    const raw = localStorage.getItem("baobao_notes_v2");
    if (raw) {
      notesList = JSON.parse(raw);
    } else {
      notesList = [];
    }
  } catch (_) {
    notesList = [];
  }

  activeNoteId = null;
  renderNotesList();
  updateEditorVisibility(false);
}

function saveNotes(): void {
  localStorage.setItem("baobao_notes_v2", JSON.stringify(notesList));
}

function renderNotesList(): void {
  const container = document.getElementById("notes-list");
  const countEl = document.getElementById("txt-notes-count");
  if (!container) return;

  const dict = I18N[currentLang] || I18N.en;
  if (countEl) {
    countEl.textContent = `${notesList.length} ${dict.notesCountLabel || "Notes"}`;
  }

  container.innerHTML = "";

  if (notesList.length === 0) {
    const empty = document.createElement("div");
    empty.style.gridColumn = "1 / -1";
    empty.style.padding = "22px 8px";
    empty.style.textAlign = "center";
    empty.style.color = "rgba(255, 255, 255, 0.35)";
    empty.style.fontSize = "10.5px";
    empty.style.lineHeight = "1.5";
    empty.textContent = dict.notesEmpty || "No notes yet";
    container.appendChild(empty);
    return;
  }

  const checkedIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" fill="rgba(16, 185, 129, 0.2)"></circle><polyline points="8 12 11 15 16 9"></polyline></svg>`;
  const uncheckedIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle></svg>`;
  const trashIcon = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

  notesList.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card" + (note.id === activeNoteId ? " active" : "") + (note.isCompleted ? " completed" : "");
    card.dataset.id = note.id;

    const dueBadge = note.dueDate && note.dueDate.trim().length > 0
      ? `<span class="note-card-due" title="${dict.tooltipDueDate}">⏱ ${note.dueDate}</span>`
      : "";

    const dateStr = note.createdTimestamp
      ? formatDateOnly(new Date(note.createdTimestamp), currentLang)
      : note.createdAt;

    const snippet = (note.content || "").replace(/\s+/g, " ").trim();

    card.innerHTML = `
      <div class="note-card-top">
        <button class="note-check-btn ${note.isCompleted ? "checked" : ""}" title="${note.isCompleted ? dict.tooltipMarkIncomplete : dict.tooltipMarkComplete}">
          ${note.isCompleted ? checkedIcon : uncheckedIcon}
        </button>
        <div class="note-card-text-col">
          <span class="note-card-title ${note.isCompleted ? "completed" : ""}">${note.title || (dict.untitledNote || "Untitled")}</span>
          ${snippet ? `<span class="note-card-preview">${snippet}</span>` : ""}
        </div>
      </div>
      <div class="note-card-meta">
        ${dueBadge}
        <span class="note-card-date">${dateStr}</span>
        <button class="note-card-quick-del" title="${dict.tooltipDeleteNote}">
          ${trashIcon}
        </button>
      </div>
    `;

    card.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest(".note-check-btn") || target.closest(".note-card-quick-del")) return;
      e.stopPropagation();
      sfx.playClick();
      selectNote(note.id);
    });

    const checkBtn = card.querySelector(".note-check-btn");
    checkBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playPop();
      toggleNoteCompletion(note.id);
    });

    const delBtn = card.querySelector(".note-card-quick-del");
    delBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playClick();
      notesList = notesList.filter((n) => n.id !== note.id);
      if (activeNoteId === note.id) activeNoteId = null;
      saveNotes();
      renderNotesList();
      if (!activeNoteId) updateEditorVisibility(false);
    });

    container.appendChild(card);
  });
}

let draftCompleted = false;

function selectNote(id: string): void {
  activeNoteId = id;
  draftCompleted = false;
  renderNotesList();
  populateNoteEditor();
  updateEditorVisibility(true);
}

function closeNoteEditor(): void {
  activeNoteId = null;
  draftCompleted = false;
  renderNotesList();
  updateEditorVisibility(false);
}

function toggleNoteCompletion(id: string): void {
  if (id === "__draft__") {
    draftCompleted = !draftCompleted;
    updateEditorCompletionUI(draftCompleted);
    return;
  }
  const note = notesList.find((n) => n.id === id);
  if (!note) return;
  note.isCompleted = !note.isCompleted;
  saveNotes();
  renderNotesList();
  if (activeNoteId === id) {
    updateEditorCompletionUI(!!note.isCompleted);
  }
}

function updateEditorCompletionUI(completed: boolean): void {
  const iconIncomplete = document.getElementById("icon-note-incomplete");
  const iconCompleted = document.getElementById("icon-note-completed");
  const btnToggle = document.getElementById("btn-toggle-complete");
  const dict = I18N[currentLang] || I18N.en;

  if (iconIncomplete && iconCompleted) {
    iconIncomplete.style.display = completed ? "none" : "block";
    iconCompleted.style.display = completed ? "block" : "none";
  }
  if (btnToggle) {
    btnToggle.classList.toggle("checked", completed);
    btnToggle.title = completed ? dict.tooltipMarkIncomplete : dict.tooltipMarkComplete;
  }
}

function populateNoteEditor(): void {
  const titleInput = document.getElementById("note-title-input") as HTMLInputElement | null;
  const bodyInput = document.getElementById("note-body-input") as HTMLTextAreaElement | null;
  const createdDisplay = document.getElementById("note-created-display");
  const dueDisplay = document.getElementById("note-due-display");
  const duePicker = document.getElementById("note-due-picker") as HTMLInputElement | null;
  const btnClearDue = document.getElementById("btn-clear-due");

  const dict = I18N[currentLang] || I18N.en;
  const current = activeNoteId && activeNoteId !== "__draft__"
    ? notesList.find((n) => n.id === activeNoteId)
    : undefined;

  if (current) {
    if (titleInput) titleInput.value = current.title;
    if (bodyInput) bodyInput.value = current.content;
    if (createdDisplay) {
      createdDisplay.textContent = current.createdTimestamp
        ? formatDateTime(new Date(current.createdTimestamp), currentLang)
        : current.createdAt;
    }
    if (dueDisplay) {
      dueDisplay.textContent = current.dueDate || dict.notesDuePlaceholder;
    }
    if (duePicker) duePicker.value = current.dueDateIso || "";
    if (btnClearDue) btnClearDue.style.display = current.dueDate ? "inline-flex" : "none";
    updateEditorCompletionUI(!!current.isCompleted);
  } else {
    if (titleInput) titleInput.value = "";
    if (bodyInput) bodyInput.value = "";
    if (createdDisplay) createdDisplay.textContent = formatDateTime(new Date(), currentLang);
    if (dueDisplay) dueDisplay.textContent = dict.notesDuePlaceholder;
    if (duePicker) duePicker.value = "";
    if (btnClearDue) btnClearDue.style.display = "none";
    updateEditorCompletionUI(draftCompleted);
  }
}

function openDueDatePicker(): void {
  const duePicker = document.getElementById("note-due-picker") as HTMLInputElement | null;
  if (!duePicker) return;
  try {
    if (typeof duePicker.showPicker === "function") {
      duePicker.showPicker();
    } else {
      duePicker.focus();
      duePicker.click();
    }
  } catch (_) {
    duePicker.focus();
    duePicker.click();
  }
}

function saveCurrentNote(): void {
  const titleInput = document.getElementById("note-title-input") as HTMLInputElement | null;
  const bodyInput = document.getElementById("note-body-input") as HTMLTextAreaElement | null;
  const dueDisplay = document.getElementById("note-due-display");
  const duePicker = document.getElementById("note-due-picker") as HTMLInputElement | null;

  const dict = I18N[currentLang] || I18N.en;
  const title = titleInput?.value.trim() || "";
  const content = bodyInput?.value || "";
  const dueDate = dueDisplay && dueDisplay.textContent !== dict.notesDuePlaceholder
    ? dueDisplay.textContent || ""
    : "";
  const dueDateIso = duePicker?.value || "";

  const now = new Date();
  if (!activeNoteId || activeNoteId === "__draft__") {
    if (!title && !content.trim() && !dueDate) {
      closeNoteEditor();
      return;
    }
    const newNote: NoteItem = {
      id: "note_" + Date.now(),
      title: title || dict.untitledNote,
      content,
      createdAt: formatDateTime(now, currentLang),
      createdTimestamp: now.getTime(),
      dueDate,
      dueDateIso,
      isCompleted: draftCompleted,
    };
    notesList.unshift(newNote);
    activeNoteId = newNote.id;
  } else {
    const idx = notesList.findIndex((n) => n.id === activeNoteId);
    if (idx !== -1) {
      notesList[idx].title = title || dict.untitledNote;
      notesList[idx].content = content;
      notesList[idx].dueDate = dueDate;
      notesList[idx].dueDateIso = dueDateIso;
    }
  }

  saveNotes();
  sfx.playPop();
  closeNoteEditor();
}

function createNewNote(): void {
  sfx.playClick();
  activeNoteId = "__draft__";
  draftCompleted = false;
  populateNoteEditor();
  updateEditorVisibility(true);

  const titleInput = document.getElementById("note-title-input");
  titleInput?.focus();
}

function deleteCurrentNote(): void {
  if (!activeNoteId) return;
  sfx.playClick();
  if (activeNoteId !== "__draft__") {
    notesList = notesList.filter((n) => n.id !== activeNoteId);
    saveNotes();
  }
  activeNoteId = null;
  draftCompleted = false;
  renderNotesList();
  updateEditorVisibility(false);
}

// ============================================
// Album Art Fetcher (Fallback to iTunes API)
// ============================================

async function fetchAlbumArt(artist: string, title: string): Promise<void> {
  const query = `${artist} ${title}`.trim();
  if (!query || query === lastArtworkQuery) return;
  lastArtworkQuery = query;

  const coverImg = document.getElementById("album-cover-img") as HTMLImageElement | null;
  const fallback = document.getElementById("album-cover-fallback");

  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
    const data = await res.json();

    if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
      const highResArt = data.results[0].artworkUrl100.replace("100x100bb", "300x300bb");
      if (coverImg) {
        coverImg.src = highResArt;
        coverImg.style.display = "block";
      }
      if (fallback) fallback.style.display = "none";
      return;
    }
  } catch (err) {
    console.warn("[Baobao] Could not fetch album art:", err);
  }

  if (coverImg) coverImg.style.display = "none";
  if (fallback) fallback.style.display = "flex";
}

// ============================================
// Realtime Synced Lyrics Fetcher (Lrclib API)
// Filters out credit/metadata lines (Image 3 Fix)
// ============================================

const CREDIT_LINE_REGEX = /^(lyrics|lyricist|composer|arranger|arranged by|producer|produced by|written by|mixed by|mastered by|vocal|vocals|guitar|bass|drums|piano|strings|synthesizer|recording|recorded by|engineered by|published by|copyright|作词|作曲|编曲|制作|制作人|混音|母带|和声|吉他|贝斯|鼓|录音|词|曲)\s*[:：]/i;

function isMetadataCreditLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (CREDIT_LINE_REGEX.test(trimmed)) return true;
  return false;
}

function parseLrcResponse(data: { syncedLyrics?: string; plainLyrics?: string } | null): LyricLine[] {
  if (!data) return [];
  if (data.syncedLyrics) {
    const lines = data.syncedLyrics.split("\n");
    const parsed: LyricLine[] = [];
    for (const line of lines) {
      const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseFloat(match[2]);
        const text = match[3].trim();
        if (text && !isMetadataCreditLine(text)) {
          parsed.push({ time: min * 60 + sec, text });
        }
      }
    }
    if (parsed.length > 0) return parsed;
  }
  if (data.plainLyrics) {
    const plainLines = data.plainLyrics
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0 && !isMetadataCreditLine(l));
    if (plainLines.length > 0) {
      const dur = currentMedia.duration_secs || totalSeconds;
      const step = dur / Math.max(1, plainLines.length);
      return plainLines.map((text: string, i: number) => ({ time: i * step, text }));
    }
  }
  return [];
}

async function fetchRealtimeLyrics(artist: string, title: string): Promise<void> {
  const query = `${artist} - ${title}`.trim();
  if (!query || query === lastLyricsQuery) return;
  lastLyricsQuery = query;

  activeLyrics = [];
  currentLyricIndex = -1;
  lastPillLyric = "";
  updateMiniLyricsPill();

  const lyricActive = document.getElementById("lyric-active");
  const lyricPrev = document.getElementById("lyric-prev");
  const lyricNext = document.getElementById("lyric-next");

  if (lyricActive) lyricActive.textContent = "Loading lyrics...";
  if (lyricPrev) lyricPrev.textContent = "...";
  if (lyricNext) lyricNext.textContent = "...";

  const cleanTitle = title.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").replace(/-\s*Single.*$/i, "").trim() || title.trim();
  const cleanArtist = artist.replace(/\s*-\s*Topic$/i, "").split(/[,;&/]/)[0].trim() || artist.trim();

  let parsed: LyricLine[] = [];

  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      parsed = parseLrcResponse(data);
    }
  } catch (_) {}

  if (parsed.length === 0) {
    try {
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`.trim())}`;
      const res = await fetch(searchUrl);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          const best = list.find((item) => item && item.syncedLyrics) || list.find((item) => item && item.plainLyrics);
          if (best) {
            parsed = parseLrcResponse(best);
          }
        }
      }
    } catch (_) {}
  }

  if (parsed.length === 0 && cleanTitle) {
    try {
      const searchTitleOnly = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}`;
      const res = await fetch(searchTitleOnly);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          const best = list.find((item) => item && item.syncedLyrics) || list.find((item) => item && item.plainLyrics);
          if (best) {
            parsed = parseLrcResponse(best);
          }
        }
      }
    } catch (_) {}
  }

  if (parsed.length > 0) {
    activeLyrics = parsed;
    currentLyricIndex = -1;
    updateRealtimeLyricsUI(getAccuratePosition());
    if (isInFullLyricsMode) renderInIslandFullLyrics();
    updateMiniLyricsPill();
    notifyIslandState();
    return;
  }

  activeLyrics = [];
  currentLyricIndex = -1;
  lastPillLyric = "";

  if (lyricPrev) lyricPrev.textContent = "—";
  if (lyricActive) lyricActive.textContent = "No lyrics available";
  if (lyricNext) lyricNext.textContent = "—";

  if (isInFullLyricsMode) renderInIslandFullLyrics();
  updateMiniLyricsPill();
  notifyIslandState();
}

function updateRealtimeLyricsUI(currentSecs: number): void {
  if (activeLyrics.length === 0) {
    const lyricPrev = document.getElementById("lyric-prev");
    const lyricActive = document.getElementById("lyric-active");
    const lyricNext = document.getElementById("lyric-next");
    if (lyricPrev) lyricPrev.textContent = "—";
    if (lyricActive) lyricActive.textContent = "No lyrics available";
    if (lyricNext) lyricNext.textContent = "—";
    return;
  }

  let activeIdx = 0;
  for (let i = 0; i < activeLyrics.length; i++) {
    if (currentSecs >= activeLyrics[i].time) {
      activeIdx = i;
    } else {
      break;
    }
  }

  if (activeIdx !== currentLyricIndex) {
    currentLyricIndex = activeIdx;

    const lyricPrev = document.getElementById("lyric-prev");
    const lyricActive = document.getElementById("lyric-active");
    const lyricNext = document.getElementById("lyric-next");

    if (lyricPrev) {
      lyricPrev.textContent = activeIdx > 0 ? activeLyrics[activeIdx - 1].text : "—";
    }
    if (lyricActive) {
      lyricActive.textContent = activeLyrics[activeIdx].text;
    }
    if (lyricNext) {
      lyricNext.textContent = activeIdx + 1 < activeLyrics.length ? activeLyrics[activeIdx + 1].text : "—";
    }

    updateMiniLyricsPill();
    updateInIslandFullLyricsActiveLine(activeIdx);
  }
}

let textMeasureCanvas: HTMLCanvasElement | null = null;
function measurePillLyricWidth(text: string): number {
  if (!textMeasureCanvas) {
    textMeasureCanvas = document.createElement("canvas");
  }
  const ctx = textMeasureCanvas.getContext("2d");
  let measured = text.length * 8.2;
  if (ctx) {
    ctx.font = "600 12px Poppins, sans-serif";
    const w = ctx.measureText(text).width;
    if (w > 0) measured = Math.max(w, text.length * 7.8);
  }
  // Account for BaoBao logo (24px), island horizontal padding (26px), center margins (20px),
  // sound-wave visualizer (when playing), compact battery indicator (when enabled), and live focus/stopwatch indicator
  const waveExtra = currentMedia.is_playing ? 22 : 0;
  const batteryExtra = showBatteryEnabled ? 42 : 0;
  const focusMiniExtra = (isTimerRunning ? 56 : 0) + (isStopwatchRunning ? 56 : 0);
  const targetWidth = Math.round(measured + 88 + waveExtra + batteryExtra + focusMiniExtra);
  return Math.min(680, Math.max((showBatteryEnabled ? 236 : 210) + focusMiniExtra, targetWidth));
}

let miniLyricFadeTimer: number | null = null;

function updateMiniLyricsPill(): void {
  const island = document.getElementById("island");
  const pillLyricsContainer = document.getElementById("pill-lyrics-container");
  const pillLyricText = document.getElementById("pill-lyric-text");

  // While Focus Timer Finished Alert is active in Mini Pill, keep lyrics hidden so they never collide
  if (isFocusAlertActive) {
    if (island) {
      island.classList.remove("with-mini-lyrics");
      island.classList.add("with-focus-alert");
    }
    if (pillLyricsContainer) {
      pillLyricsContainer.style.display = "none";
    }
    notifyIslandState();
    return;
  }

  const hasTrack = Boolean(currentMedia.is_playing || (currentMedia.title && currentMedia.title.trim().length > 0));
  const shouldShowMini = !isExpanded && !isMusicIdle && hasTrack && activeLyrics.length > 0 && miniLyricsEnabled;

  if (island) {
    island.classList.toggle("with-mini-lyrics", shouldShowMini);
    island.scrollTop = 0;
    island.scrollLeft = 0;
  }

  if (pillLyricsContainer) {
    pillLyricsContainer.style.display = shouldShowMini ? "flex" : "none";
  }

  if (shouldShowMini && pillLyricText && activeLyrics.length > 0) {
    const validIdx = currentLyricIndex >= 0 && currentLyricIndex < activeLyrics.length ? currentLyricIndex : 0;
    const text = activeLyrics[validIdx].text;
    const dynamicW = measurePillLyricWidth(text);
    currentMiniWidth = dynamicW;
    island?.style.setProperty("--pill-lyrics-width", `${dynamicW}px`);

    if (text !== lastPillLyric) {
      lastPillLyric = text;
      if (miniLyricFadeTimer !== null) {
        clearTimeout(miniLyricFadeTimer);
        miniLyricFadeTimer = null;
      }
      pillLyricText.style.opacity = "0";
      pillLyricText.style.transform = "translateY(2px)";

      miniLyricFadeTimer = window.setTimeout(() => {
        miniLyricFadeTimer = null;
        pillLyricText.textContent = text;
        pillLyricText.style.opacity = "1";
        pillLyricText.style.transform = "translateY(0)";
        if (island) {
          island.scrollTop = 0;
          island.scrollLeft = 0;
        }
      }, 75);
    } else if (miniLyricFadeTimer === null && pillLyricText.textContent !== text) {
      pillLyricText.textContent = text;
      pillLyricText.style.opacity = "1";
      pillLyricText.style.transform = "translateY(0)";
    }
  } else if (!shouldShowMini && pillLyricText) {
    if (miniLyricFadeTimer !== null) {
      clearTimeout(miniLyricFadeTimer);
      miniLyricFadeTimer = null;
    }
    lastPillLyric = "";
    pillLyricText.style.opacity = "1";
    pillLyricText.style.transform = "translateY(0)";
  }

  notifyIslandState();
}

// ============================================
// In-Notch Full Lyrics Mode Controller
// ============================================

let isInFullLyricsMode = false;

function setInIslandFullLyricsMode(enabled: boolean): void {
  isInFullLyricsMode = enabled;
  const island = document.getElementById("island");
  const activeView = document.getElementById("music-active-view");
  const fullLyricsView = document.getElementById("music-full-lyrics-view");

  if (island) {
    island.classList.toggle("in-full-lyrics", enabled);
    if (enabled) {
      island.classList.add("with-lyrics");
    } else if (!isLyricsOpen) {
      island.classList.remove("with-lyrics");
    }
  }

  if (activeView) activeView.style.display = enabled ? "none" : "flex";
  if (fullLyricsView) fullLyricsView.style.display = enabled ? "flex" : "none";

  if (enabled) {
    renderInIslandFullLyrics();
    updateInIslandFullLyricsActiveLine(currentLyricIndex);
  }

  notifyIslandState();
}

function renderInIslandFullLyrics(): void {
  const container = document.getElementById("full-lyrics-stream");
  if (!container) return;

  container.innerHTML = "";

  if (activeLyrics.length === 0) {
    container.innerHTML = `<p class="full-stream-line muted" style="padding: 24px 0; color: rgba(255,255,255,0.4); cursor: default;">No lyrics available for this song</p>`;
    return;
  }

  activeLyrics.forEach((line, idx) => {
    const p = document.createElement("p");
    p.className = `full-stream-line ${idx === currentLyricIndex ? "active" : ""}`;
    p.textContent = line.text;
    p.dataset.index = idx.toString();
    p.dataset.time = line.time.toString();

    p.addEventListener("click", async (e) => {
      e.stopPropagation();
      sfx.playClick();
      currentMedia.position_secs = line.time;
      currentMedia.position_at_ms = Date.now();
      try {
        await invoke("media_seek", { positionSecs: line.time });
      } catch (_) {}
      updateRealtimeLyricsUI(line.time);
    });

    container.appendChild(p);
  });
}

function updateInIslandFullLyricsActiveLine(activeIdx: number): void {
  if (!isInFullLyricsMode) return;
  const container = document.getElementById("full-lyrics-stream");
  if (!container) return;

  const lines = container.querySelectorAll<HTMLParagraphElement>(".full-stream-line");
  lines.forEach((line, idx) => {
    if (idx === activeIdx) {
      if (!line.classList.contains("active")) {
        line.classList.add("active");
        const targetScroll = line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2;
        container.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
      }
    } else {
      line.classList.remove("active");
    }
  });
}

// ============================================
// Native Master Volume Controller
// ============================================

let currentVolume = 0.7;
let lastUnmutedVolume = 0.7;

async function initVolumeController(): Promise<void> {
  try {
    const vol = await invoke<number>("get_volume");
    if (typeof vol === "number" && !isNaN(vol)) {
      currentVolume = Math.max(0, Math.min(1, vol));
      if (currentVolume > 0.05) lastUnmutedVolume = currentVolume;
      updateVolumeUI();
    }
  } catch (_) {}
}

function updateVolumeUI(): void {
  const fill = document.getElementById("volume-slider-fill");
  const iconHigh = document.getElementById("icon-vol-high");
  const iconLow = document.getElementById("icon-vol-low");
  const iconMuted = document.getElementById("icon-vol-muted");

  if (fill) {
    fill.style.width = `${Math.round(currentVolume * 100)}%`;
  }

  if (currentVolume <= 0.001) {
    if (iconHigh) iconHigh.style.display = "none";
    if (iconLow) iconLow.style.display = "none";
    if (iconMuted) iconMuted.style.display = "block";
  } else if (currentVolume < 0.45) {
    if (iconHigh) iconHigh.style.display = "none";
    if (iconLow) iconLow.style.display = "block";
    if (iconMuted) iconMuted.style.display = "none";
  } else {
    if (iconHigh) iconHigh.style.display = "block";
    if (iconLow) iconLow.style.display = "none";
    if (iconMuted) iconMuted.style.display = "none";
  }
}

async function setMasterVolume(vol: number): Promise<void> {
  currentVolume = Math.max(0, Math.min(1, vol));
  if (currentVolume > 0.05) lastUnmutedVolume = currentVolume;
  updateVolumeUI();
  try {
    await invoke("set_volume", { volume: currentVolume });
  } catch (_) {}
}

// ============================================
// Media UI Synchronization & Idle State
// ============================================

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateProgressUI(): void {
  const currentSecs = getAccuratePosition();
  const dur = currentMedia.duration_secs || totalSeconds || 211;

  const timeCurrent = document.getElementById("time-current");
  const timeRemaining = document.getElementById("time-remaining");
  const progressFill = document.getElementById("progress-bar-fill");

  if (timeCurrent) timeCurrent.textContent = formatTime(currentSecs);
  if (timeRemaining) {
    const rem = Math.max(0, dur - currentSecs);
    timeRemaining.textContent = `-${formatTime(rem)}`;
  }
  if (progressFill) {
    const percent = Math.min(100, (currentSecs / dur) * 100);
    progressFill.style.width = `${percent}%`;
  }

  updateRealtimeLyricsUI(currentSecs);
}

function checkMusicIdleState(): void {
  const now = Date.now();
  const timeSinceActive = now - lastActiveTrackTime;
  const hasValidTrack = Boolean(currentMedia.title && currentMedia.title.trim().length > 0);
  const idleNow = !currentMedia.is_playing && (!hasValidTrack || timeSinceActive >= IDLE_THRESHOLD_MS);

  if (idleNow !== isMusicIdle) {
    isMusicIdle = idleNow;
    const activeView = document.getElementById("music-active-view");
    const idleView = document.getElementById("music-idle-view");
    const lyricsPane = document.getElementById("lyrics-pane");
    const island = document.getElementById("island");

    if (isMusicIdle) {
      if (isInFullLyricsMode) {
        setInIslandFullLyricsMode(false);
      }
      if (activeView) activeView.style.display = "none";
      if (idleView) idleView.style.display = "flex";
      document.querySelectorAll(".sound-wave").forEach((w) => w.classList.add("paused"));
      if (isLyricsOpen) {
        isLyricsOpen = false;
        island?.classList.remove("with-lyrics");
        lyricsPane?.classList.add("hidden");
        document.getElementById("btn-lyrics")?.classList.remove("active");
      }
    } else {
      if (idleView) idleView.style.display = "none";
      if (activeView) activeView.style.display = "flex";
    }

    updateMiniLyricsPill();
    notifyIslandState();
  }
}

function updateMediaUI(payload: MediaPayload): void {
  const titleEl = document.getElementById("track-title");
  const artistEl = document.getElementById("track-artist");
  const iconPlay = document.getElementById("icon-play");
  const iconPause = document.getElementById("icon-pause");
  const waves = document.querySelectorAll(".sound-wave");

  const hasTitle = payload.title && payload.title.trim().length > 0;
  const displayTitle = hasTitle ? payload.title : "In My Blood";
  const displayArtist = payload.artist && payload.artist.trim().length > 0 ? payload.artist : "Shawn Mendes";

  if (titleEl) titleEl.textContent = displayTitle;
  if (artistEl) artistEl.textContent = displayArtist;

  const fullTitle = document.getElementById("full-now-title");
  const fullArtist = document.getElementById("full-now-artist");
  if (fullTitle) fullTitle.textContent = displayTitle;
  if (fullArtist) fullArtist.textContent = displayArtist;

  const isActuallyPlaying = Boolean(payload.is_playing && hasTitle);
  if (isActuallyPlaying) {
    lastActiveTrackTime = Date.now();
    if (iconPlay) iconPlay.style.display = "none";
    if (iconPause) iconPause.style.display = "block";
    waves.forEach((w) => w.classList.remove("paused"));
  } else {
    if (iconPlay) iconPlay.style.display = "block";
    if (iconPause) iconPause.style.display = "none";
    waves.forEach((w) => w.classList.add("paused"));
  }

  if (typeof payload.duration_secs === "number" && payload.duration_secs > 0) {
    totalSeconds = Math.round(payload.duration_secs);
  }

  if (payload.cover_data_url) {
    const coverImg = document.getElementById("album-cover-img") as HTMLImageElement | null;
    const fallback = document.getElementById("album-cover-fallback");
    if (coverImg) {
      coverImg.src = payload.cover_data_url;
      coverImg.style.display = "block";
    }
    if (fallback) fallback.style.display = "none";
  } else if (hasTitle) {
    fetchAlbumArt(payload.artist, payload.title);
  }

  checkMusicIdleState();
  updateProgressUI();
  updateMiniLyricsPill();

  const trackKey = `${payload.artist}:${payload.title}`;
  if (hasTitle && trackKey !== lastTrackKey) {
    lastTrackKey = trackKey;
    lastActiveTrackTime = Date.now();
    fetchRealtimeLyrics(payload.artist, payload.title);
  }
}

// ============================================
// Expand & Collapse (Zero-Flicker + Elastic Bounce)
// ============================================

let expandCleanupTimer: number | null = null;

function expandIsland(): void {
  if (isDraggingIsland) return;
  if (collapseTimeout) {
    clearTimeout(collapseTimeout);
    collapseTimeout = null;
  }
  const island = document.getElementById("island");
  island?.classList.remove("hover-holding");

  if (isExpanded) return;
  isExpanded = true;

  if (!island) return;

  island.classList.remove("collapsed");
  island.classList.add("expanded");

  if (expandCleanupTimer) {
    clearTimeout(expandCleanupTimer);
  }
  expandCleanupTimer = window.setTimeout(() => {
    const activeSlide = document.querySelector(".slide.active") as HTMLElement | null;
    if (activeSlide) {
      activeSlide.style.transform = "none";
    }
    const bodyEl = document.querySelector(".island-body") as HTMLElement | null;
    if (bodyEl) {
      bodyEl.style.transform = "none";
    }
  }, 410);

  updateHeaderCategoryTitle();
  updateProgressUI();
  updateFocusMiniIndicator();
  notifyIslandState();
}

function collapseIsland(): void {
  const island = document.getElementById("island");
  island?.classList.remove("hover-holding");

  if (isPinned) return;
  if (isDraggingIsland) return;
  if (collapseTimeout) clearTimeout(collapseTimeout);

  if (expandCleanupTimer) {
    clearTimeout(expandCleanupTimer);
    expandCleanupTimer = null;
  }
  const activeSlide = document.querySelector(".slide.active") as HTMLElement | null;
  if (activeSlide) activeSlide.style.transform = "";
  const bodyEl = document.querySelector(".island-body") as HTMLElement | null;
  if (bodyEl) bodyEl.style.transform = "";

  collapseTimeout = setTimeout(() => {
    isExpanded = false;
    if (!island) return;

    island.classList.remove("expanded");
    island.classList.add("collapsed");

    updateFocusMiniIndicator();
    updateMiniLyricsPill();
    notifyIslandState();
  }, 150);
}

// ============================================
// Bottom Navbar & Slide Navigation (4 Slides: 0 = Music, 1 = Notes, 2 = Focus, 3 = Calendar)
// ============================================

function setSlide(index: number): void {
  const enabledSlides = getEnabledSlides();
  let target = ((index % 4) + 4) % 4;
  if (!enabledSlides.includes(target)) {
    target = enabledSlides[0];
  }
  if (target === currentSlide) return;

  const goingRight = target > currentSlide;
  currentSlide = target;

  const slideMusic = document.getElementById("slide-music");
  const slideNotes = document.getElementById("slide-notes");
  const slideFocus = document.getElementById("slide-focus");
  const slideCalendar = document.getElementById("slide-calendar");

  const slides = [slideMusic, slideNotes, slideFocus, slideCalendar];
  slides.forEach((s, idx) => {
    if (!s) return;
    if (idx === currentSlide) {
      if (goingRight) {
        s.classList.add("slide-left");
      } else {
        s.classList.remove("slide-left");
      }
      requestAnimationFrame(() => {
        s.classList.add("active");
        s.classList.remove("slide-left");
      });
    } else {
      s.classList.remove("active");
    }
  });

  // Sync Bottom Navbar active pills
  const navBtnMusic = document.getElementById("nav-btn-music");
  const navBtnNotes = document.getElementById("nav-btn-notes");
  const navBtnFocus = document.getElementById("nav-btn-focus");
  const navBtnCalendar = document.getElementById("nav-btn-calendar");
  if (navBtnMusic) navBtnMusic.classList.toggle("active", currentSlide === 0);
  if (navBtnNotes) navBtnNotes.classList.toggle("active", currentSlide === 1);
  if (navBtnFocus) navBtnFocus.classList.toggle("active", currentSlide === 2);
  if (navBtnCalendar) navBtnCalendar.classList.toggle("active", currentSlide === 3);

  const island = document.getElementById("island");
  island?.classList.toggle("in-notes", currentSlide === 1);
  island?.classList.toggle("in-focus", currentSlide === 2);
  island?.classList.toggle("in-calendar", currentSlide === 3);
  island?.classList.remove("with-editor");

  if (currentSlide === 3) {
    renderCalendarUI();
  }

  if (currentSlide !== 1 && activeNoteId === "__draft__") {
    closeNoteEditor();
  }

  updateHeaderCategoryTitle();
  notifyIslandState();
}

// ============================================
// Laptop Battery Status Controller
// ============================================

interface BatteryPayload {
  percentage: number;
  is_charging: boolean;
  has_battery: boolean;
}

function updateBatteryUI(pct: number, isCharging: boolean): void {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const batEl = document.getElementById("header-battery");
  const segsWrap = document.getElementById("battery-segments");
  const boltEl = document.getElementById("battery-bolt-icon");

  let activeBars = 0;
  if (clamped >= 80) activeBars = 4;
  else if (clamped >= 55) activeBars = 3;
  else if (clamped >= 30) activeBars = 2;
  else if (clamped >= 5) activeBars = 1;

  if (segsWrap) {
    segsWrap.style.display = isCharging ? "none" : "block";
    const segs = segsWrap.querySelectorAll(".battery-seg");
    segs.forEach((seg, idx) => {
      seg.classList.toggle("active", idx < activeBars);
    });
  }

  if (boltEl) boltEl.style.display = isCharging ? "block" : "none";

  if (batEl) {
    batEl.classList.toggle("charging", isCharging);
    batEl.title = `${clamped}%${isCharging ? " (Charging)" : ""}`;
  }
}

async function refreshBatteryStatus(): Promise<void> {
  try {
    const res = await invoke<BatteryPayload>("get_battery_status");
    if (res && typeof res.percentage === "number") {
      updateBatteryUI(res.percentage, Boolean(res.is_charging));
      return;
    }
  } catch (_) {}

  try {
    const nav = navigator as unknown as {
      getBattery?: () => Promise<{ level: number; charging: boolean }>;
    };
    if (typeof nav.getBattery === "function") {
      const b = await nav.getBattery();
      updateBatteryUI(b.level * 100, b.charging);
    }
  } catch (_) {}
}

// ============================================
// Elegant Focus Time & Stopwatch Controller
// ============================================

type FocusMode = "timer" | "stopwatch";
let focusMode: FocusMode = "timer";
let focusDurationSecs = 25 * 60;
let focusRemainingSecs = 25 * 60;
let timerIntervalId: number | null = null;
let stopwatchIntervalId: number | null = null;
let focusAlertTimeoutId: number | null = null;
let lastFocusMiniState = "false:false";

// Stopwatch state (high-precision ms)
let stopwatchElapsedMs = 0;
let stopwatchLastTickMs = 0;
let stopwatchLaps: string[] = [];

function updateFocusMiniIndicator(): void {
  const timerMiniEl = document.getElementById("header-timer-mini");
  const timerMiniTimeEl = document.getElementById("header-timer-mini-time");
  const swMiniEl = document.getElementById("header-stopwatch-mini");
  const swMiniTimeEl = document.getElementById("header-stopwatch-mini-time");

  if (timerMiniEl) {
    timerMiniEl.style.display = isTimerRunning && !isExpanded ? "inline-flex" : "none";
  }
  if (timerMiniTimeEl && isTimerRunning) {
    const mins = Math.floor(focusRemainingSecs / 60);
    const secs = Math.floor(focusRemainingSecs % 60);
    timerMiniTimeEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  if (swMiniEl) {
    swMiniEl.style.display = isStopwatchRunning && !isExpanded ? "inline-flex" : "none";
  }
  if (swMiniTimeEl && isStopwatchRunning) {
    const totalSecs = Math.floor(stopwatchElapsedMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    swMiniTimeEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  const nextStateKey = `${isTimerRunning}:${isStopwatchRunning}`;
  if (nextStateKey !== lastFocusMiniState) {
    lastFocusMiniState = nextStateKey;
    updateMiniLyricsPill();
    notifyIslandState();
  }
}

function triggerFocusTimerAlert(): void {
  sfx.playTimerAlarm3x();

  if (focusAlertTimeoutId !== null) {
    clearTimeout(focusAlertTimeoutId);
    focusAlertTimeoutId = null;
  }

  isFocusAlertActive = true;
  const island = document.getElementById("island");
  const pillLyricsContainer = document.getElementById("pill-lyrics-container");
  const pillAlert = document.getElementById("pill-focus-alert");
  const pillIconBell = document.getElementById("pill-alert-icon-bell");
  const pillIconCal = document.getElementById("pill-alert-icon-cal");
  const pillAlertBadge = document.getElementById("pill-alert-badge");
  const pillAlertText = document.getElementById("pill-focus-alert-text");
  const dict = I18N[currentLang] || I18N.en;

  if (pillIconBell) pillIconBell.style.display = "block";
  if (pillIconCal) pillIconCal.style.display = "none";
  if (pillAlertBadge) pillAlertBadge.style.display = "none";

  if (pillAlertText) {
    pillAlertText.textContent = dict.focusAlertFinished || "Focus Time Up!";
  }

  // Hide mini-pill lyrics first so they never collide with the Focus Timer alert
  if (pillLyricsContainer) {
    pillLyricsContainer.style.display = "none";
  }
  if (pillAlert) {
    pillAlert.style.display = "inline-flex";
  }
  if (island) {
    island.classList.remove("with-mini-lyrics");
    island.classList.add("with-focus-alert");
    island.scrollTop = 0;
    island.scrollLeft = 0;
  }

  updateFocusUI();
  notifyIslandState();

  focusAlertTimeoutId = window.setTimeout(() => {
    focusAlertTimeoutId = null;
    isFocusAlertActive = false;
    if (pillAlert) {
      pillAlert.style.display = "none";
    }
    if (island) {
      island.classList.remove("with-focus-alert");
      island.style.removeProperty("--collapsed-pill-width");
      island.scrollTop = 0;
      island.scrollLeft = 0;
    }
    lastPillLyric = "";
    updateFocusUI();
    updateMiniLyricsPill();
  }, 5000);
}

function renderStopwatchLaps(): void {
  const listEl = document.getElementById("focus-laps-list");
  if (!listEl) return;
  const dict = I18N[currentLang] || I18N.en;

  if (stopwatchLaps.length === 0) {
    listEl.innerHTML = `<span id="txt-focus-laps-empty" class="focus-laps-empty">${dict.focusLapsEmpty || "Press Lap while running to record splits"}</span>`;
    return;
  }

  listEl.innerHTML = "";
  stopwatchLaps.forEach((lapTime, idx) => {
    const lapNum = stopwatchLaps.length - idx;
    const chip = document.createElement("span");
    chip.className = "focus-lap-chip";
    chip.innerHTML = `<strong>#${lapNum}</strong> ${lapTime}`;
    listEl.appendChild(chip);
  });
  listEl.scrollTop = 0;
}

function updateFocusUI(): void {
  const dict = I18N[currentLang] || I18N.en;
  const ringWrapper = document.getElementById("focus-ring-wrapper");
  const timeEl = document.getElementById("focus-time-display");
  const msEl = document.getElementById("focus-ms-display");
  const badgeEl = document.getElementById("focus-state-badge");
  const ringEl = document.getElementById("focus-ring-progress");
  const playIcon = document.getElementById("icon-focus-play");
  const pauseIcon = document.getElementById("icon-focus-pause");
  const toggleBtn = document.getElementById("btn-focus-toggle");
  const toggleTxt = document.getElementById("txt-focus-toggle-btn");
  const presetsRow = document.getElementById("focus-presets-row");
  const lapsRow = document.getElementById("focus-laps-row");
  const btnLap = document.getElementById("btn-focus-lap");
  const customInput = document.getElementById("input-focus-custom-mins") as HTMLInputElement | null;
  const customSecsInput = document.getElementById("input-focus-custom-secs") as HTMLInputElement | null;

  const circumference = 245.04; // 2 * PI * 39
  const activeTabRunning = focusMode === "timer" ? isTimerRunning : isStopwatchRunning;

  if (ringWrapper) {
    ringWrapper.classList.toggle("running", activeTabRunning);
    ringWrapper.classList.toggle("alerting", isFocusAlertActive && focusMode === "timer");
  }
  if (toggleBtn) {
    toggleBtn.classList.toggle("alerting", isFocusAlertActive && focusMode === "timer");
  }

  if (focusMode === "timer") {
    if (msEl) msEl.style.display = "none";
    if (presetsRow) presetsRow.style.display = "flex";
    if (lapsRow) lapsRow.style.display = "none";
    if (btnLap) btnLap.style.display = "none";

    if (isFocusAlertActive) {
      if (timeEl) timeEl.textContent = "00:00";
      if (badgeEl) badgeEl.textContent = "TIME UP!";
      if (ringEl) ringEl.style.strokeDashoffset = "0";
      if (toggleTxt) toggleTxt.textContent = dict.focusAlertFinished || "Focus Time Up!";
    } else {
      if (timeEl) {
        const mins = Math.floor(focusRemainingSecs / 60);
        const secs = Math.floor(focusRemainingSecs % 60);
        timeEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      }

      if (badgeEl) {
        badgeEl.textContent = dict.focusStateTimer || "TIMER";
      }

      if (ringEl) {
        const progress = focusDurationSecs > 0 ? focusRemainingSecs / focusDurationSecs : 1;
        const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));
        ringEl.style.strokeDashoffset = offset.toFixed(2);
      }

      if (toggleTxt) {
        if (isTimerRunning) {
          toggleTxt.textContent = dict.focusBtnPause || "Pause";
        } else if (focusRemainingSecs < focusDurationSecs && focusRemainingSecs > 0) {
          toggleTxt.textContent = dict.focusBtnResume || "Resume";
        } else {
          toggleTxt.textContent = dict.focusBtnStartTimer || "Start Focus";
        }
      }
    }
  } else {
    // Stopwatch Mode
    if (msEl) msEl.style.display = "inline";
    if (presetsRow) presetsRow.style.display = "none";
    if (lapsRow) lapsRow.style.display = "flex";
    if (btnLap) btnLap.style.display = "inline-flex";

    const totalSecs = Math.floor(stopwatchElapsedMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const centis = Math.floor((stopwatchElapsedMs % 1000) / 10);

    if (timeEl) {
      timeEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    if (msEl) {
      msEl.textContent = `.${String(centis).padStart(2, "0")}`;
    }
    if (badgeEl) {
      badgeEl.textContent = dict.focusStateStopwatch || "STOPWATCH";
    }

    if (ringEl) {
      const cycleProgress = (stopwatchElapsedMs % 60000) / 60000;
      const offset = stopwatchElapsedMs === 0 ? circumference : circumference * (1 - cycleProgress);
      ringEl.style.strokeDashoffset = offset.toFixed(2);
    }

    if (toggleTxt) {
      if (isStopwatchRunning) {
        toggleTxt.textContent = dict.focusBtnPause || "Pause";
      } else if (stopwatchElapsedMs > 0) {
        toggleTxt.textContent = dict.focusBtnResume || "Resume";
      } else {
        toggleTxt.textContent = dict.focusBtnStartStopwatch || "Start";
      }
    }
  }

  if (playIcon) playIcon.style.display = activeTabRunning ? "none" : "block";
  if (pauseIcon) pauseIcon.style.display = activeTabRunning ? "block" : "none";

  const currentMins = Math.floor(focusDurationSecs / 60);
  const currentSecs = Math.floor(focusDurationSecs % 60);
  if (customInput && document.activeElement !== customInput) {
    customInput.value = String(currentMins);
  }
  if (customSecsInput && document.activeElement !== customSecsInput) {
    customSecsInput.value = String(currentSecs).padStart(2, "0");
  }
  document.querySelectorAll(".focus-preset-chip").forEach((chip) => {
    const m = parseInt((chip as HTMLElement).dataset.mins || "0", 10);
    chip.classList.toggle("active", currentSecs === 0 && m === currentMins);
  });

  document.querySelectorAll(".focus-mode-pill").forEach((pill) => {
    const m = (pill as HTMLElement).dataset.focusMode;
    pill.classList.toggle("active", m === focusMode);
  });

  updateFocusMiniIndicator();
}

function setFocusMode(mode: FocusMode): void {
  if (focusMode === mode) return;
  sfx.playPop();
  // Switching tabs never pauses a running Focus Timer or Stopwatch
  focusMode = mode;
  if (mode === "stopwatch") {
    renderStopwatchLaps();
  }
  updateFocusUI();
}

function setFocusDurationTotalSeconds(totalSecs: number): void {
  if (isNaN(totalSecs)) return;
  const clamped = Math.max(1, Math.min(999 * 60 + 59, Math.round(totalSecs)));
  sfx.playPop();
  if (isTimerRunning && timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    isTimerRunning = false;
  }
  focusDurationSecs = clamped;
  focusRemainingSecs = focusDurationSecs;
  updateFocusUI();
}

function setFocusDurationMinutes(mins: number): void {
  if (isNaN(mins)) return;
  setFocusDurationTotalSeconds(Math.max(1, Math.round(mins) * 60));
}

function recordStopwatchLap(): void {
  if (focusMode !== "stopwatch" || stopwatchElapsedMs <= 0) return;
  sfx.playPop();
  const totalSecs = Math.floor(stopwatchElapsedMs / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const centis = Math.floor((stopwatchElapsedMs % 1000) / 10);
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
  stopwatchLaps.unshift(formatted);
  if (stopwatchLaps.length > 50) stopwatchLaps.pop();
  renderStopwatchLaps();
}

function toggleFocusTimer(): void {
  sfx.playPop();
  if (focusMode === "timer") {
    if (isFocusAlertActive && focusAlertTimeoutId !== null) {
      clearTimeout(focusAlertTimeoutId);
      focusAlertTimeoutId = null;
      isFocusAlertActive = false;
      const pillAlert = document.getElementById("pill-focus-alert");
      if (pillAlert) pillAlert.style.display = "none";
      document.getElementById("island")?.classList.remove("with-focus-alert");
      updateMiniLyricsPill();
    }

    if (isTimerRunning) {
      isTimerRunning = false;
      if (timerIntervalId !== null) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
      }
      updateFocusUI();
      return;
    }

    if (focusRemainingSecs <= 0) {
      focusRemainingSecs = focusDurationSecs;
    }
    isTimerRunning = true;
    updateFocusUI();

    if (timerIntervalId !== null) clearInterval(timerIntervalId);
    timerIntervalId = window.setInterval(() => {
      if (!isTimerRunning) return;
      focusRemainingSecs = Math.max(0, focusRemainingSecs - 1);
      updateFocusUI();

      if (focusRemainingSecs <= 0) {
        isTimerRunning = false;
        if (timerIntervalId !== null) {
          clearInterval(timerIntervalId);
          timerIntervalId = null;
        }
        focusRemainingSecs = focusDurationSecs;
        triggerFocusTimerAlert();
      }
    }, 1000);
  } else {
    // Stopwatch count-up mode (independent of Timer)
    if (isStopwatchRunning) {
      isStopwatchRunning = false;
      if (stopwatchIntervalId !== null) {
        clearInterval(stopwatchIntervalId);
        stopwatchIntervalId = null;
      }
      updateFocusUI();
      return;
    }

    isStopwatchRunning = true;
    stopwatchLastTickMs = performance.now();
    updateFocusUI();

    if (stopwatchIntervalId !== null) clearInterval(stopwatchIntervalId);
    stopwatchIntervalId = window.setInterval(() => {
      if (!isStopwatchRunning) return;
      const now = performance.now();
      stopwatchElapsedMs += Math.max(0, now - stopwatchLastTickMs);
      stopwatchLastTickMs = now;
      if (focusMode === "stopwatch") {
        updateFocusUI();
      } else {
        updateFocusMiniIndicator();
      }
    }, 45);
  }
}

function resetFocusTimer(): void {
  sfx.playClick();
  if (focusMode === "timer") {
    isTimerRunning = false;
    if (timerIntervalId !== null) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
    focusRemainingSecs = focusDurationSecs;
  } else {
    isStopwatchRunning = false;
    if (stopwatchIntervalId !== null) {
      clearInterval(stopwatchIntervalId);
      stopwatchIntervalId = null;
    }
    stopwatchElapsedMs = 0;
    stopwatchLaps = [];
    renderStopwatchLaps();
  }
  updateFocusUI();
}

// ============================================
// Calendar & Event Reminder Controller
// ============================================

interface CalendarEventItem {
  id: string;
  dateIso: string; // "YYYY-MM-DD"
  title: string;
  hasTime: boolean;
  timeStr: string; // "HH:MM"
  notified?: boolean;
}

const CAL_STORAGE_KEY = "baobao_calendar_events_v1";
let calendarEvents: CalendarEventItem[] = [];

function toDateIsoString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const initialCalNow = new Date();
let calViewYear = initialCalNow.getFullYear();
let calViewMonth = initialCalNow.getMonth(); // 0 - 11
let calSelectedDateIso = toDateIsoString(initialCalNow);
let calUseSpecificTime = true;
let isCalPickerOpen = false;

function loadCalendarEvents(): void {
  try {
    const raw = localStorage.getItem(CAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        calendarEvents = parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load calendar events:", e);
    calendarEvents = [];
  }
}

function saveCalendarEvents(): void {
  try {
    localStorage.setItem(CAL_STORAGE_KEY, JSON.stringify(calendarEvents));
  } catch (e) {
    console.warn("Failed to save calendar events:", e);
  }
}

function formatCalendarSelectedDateLabel(dateIso: string): string {
  const parts = dateIso.split("-");
  if (parts.length !== 3) return dateIso;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m, d);
  const months = MONTH_NAMES[currentLang] || MONTH_NAMES.en;
  const dayNames: Record<Lang, string[]> = {
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    id: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
    ja: ["日", "月", "火", "水", "木", "金", "土"],
    zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  };
  const dn = (dayNames[currentLang] || dayNames.en)[dateObj.getDay()];
  return `${dn}, ${d} ${months[m]} ${y}`;
}

function renderCalendarUI(): void {
  const monthNameEl = document.getElementById("txt-cal-month-name");
  const monthPickBtn = document.getElementById("btn-cal-month-picker");
  const yearInputEl = document.getElementById("input-cal-year") as HTMLInputElement | null;
  const pickerYearInputEl = document.getElementById("input-cal-picker-year") as HTMLInputElement | null;
  const daysViewEl = document.getElementById("cal-days-view");
  const pickerViewEl = document.getElementById("cal-picker-view");
  const monthsGridEl = document.getElementById("cal-months-grid");
  const daysGridEl = document.getElementById("cal-days-grid");
  const selectedDateEl = document.getElementById("txt-cal-selected-date");
  const eventsCountEl = document.getElementById("txt-cal-events-count");
  const eventsListEl = document.getElementById("cal-events-list");
  const timeWrapEl = document.getElementById("cal-time-wrap");
  const timeToggleBtn = document.getElementById("btn-cal-toggle-time");
  const alldayChipEl = document.getElementById("txt-cal-allday-chip");

  if (!daysGridEl) return;

  const dict = I18N[currentLang] || I18N.en;
  const months = MONTH_NAMES[currentLang] || MONTH_NAMES.en;

  if (monthNameEl) {
    monthNameEl.textContent = months[calViewMonth];
  }
  if (monthPickBtn) {
    monthPickBtn.classList.toggle("active", isCalPickerOpen);
  }
  if (yearInputEl && document.activeElement !== yearInputEl) {
    yearInputEl.value = String(calViewYear);
  }
  if (pickerYearInputEl && document.activeElement !== pickerYearInputEl) {
    pickerYearInputEl.value = String(calViewYear);
  }

  if (daysViewEl) {
    daysViewEl.style.display = isCalPickerOpen ? "none" : "flex";
  }
  if (pickerViewEl) {
    pickerViewEl.style.display = isCalPickerOpen ? "flex" : "none";
  }

  // Populate 12-Month Fast Picker Grid
  if (monthsGridEl) {
    monthsGridEl.innerHTML = "";
    months.forEach((mLabel, mIdx) => {
      const mBtn = document.createElement("button");
      mBtn.type = "button";
      mBtn.className = `cal-month-chip${mIdx === calViewMonth ? " active" : ""}`;
      mBtn.textContent = mLabel;
      mBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sfx.playPop();
        calViewMonth = mIdx;
        isCalPickerOpen = false;
        renderCalendarUI();
      });
      monthsGridEl.appendChild(mBtn);
    });
  }

  if (timeWrapEl) {
    timeWrapEl.classList.toggle("time-disabled", !calUseSpecificTime);
  }
  if (timeToggleBtn) {
    timeToggleBtn.classList.toggle("active", calUseSpecificTime);
  }
  if (alldayChipEl) {
    alldayChipEl.textContent = dict.calAllDay || "All Day";
  }

  const todayIso = toDateIsoString(new Date());

  // Count events per dateIso for badge dots
  const countMap = new Map<string, number>();
  for (const ev of calendarEvents) {
    countMap.set(ev.dateIso, (countMap.get(ev.dateIso) || 0) + 1);
  }

  const firstDayOfMonth = new Date(calViewYear, calViewMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calViewYear, calViewMonth, 0).getDate();

  daysGridEl.innerHTML = "";

  // 42 cells (6 rows x 7 cols) so the calendar grid height is rock-solid
  const totalCells = 42;
  for (let i = 0; i < totalCells; i++) {
    let cellYear = calViewYear;
    let cellMonth = calViewMonth;
    let cellDay = 1;
    let isOtherMonth = false;

    if (i < firstDayOfMonth) {
      isOtherMonth = true;
      cellDay = daysInPrevMonth - (firstDayOfMonth - 1 - i);
      if (cellMonth === 0) {
        cellMonth = 11;
        cellYear -= 1;
      } else {
        cellMonth -= 1;
      }
    } else if (i >= firstDayOfMonth + daysInMonth) {
      isOtherMonth = true;
      cellDay = i - (firstDayOfMonth + daysInMonth) + 1;
      if (cellMonth === 11) {
        cellMonth = 0;
        cellYear += 1;
      } else {
        cellMonth += 1;
      }
    } else {
      cellDay = i - firstDayOfMonth + 1;
    }

    const cellIso = `${cellYear}-${String(cellMonth + 1).padStart(2, "0")}-${String(cellDay).padStart(2, "0")}`;
    const evCount = countMap.get(cellIso) || 0;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-day-cell";
    if (isOtherMonth) btn.classList.add("other-month");
    if (cellIso === todayIso) btn.classList.add("today");
    if (cellIso === calSelectedDateIso) btn.classList.add("selected");
    if (evCount > 0) btn.classList.add("has-events");

    const numSpan = document.createElement("span");
    numSpan.textContent = String(cellDay);
    btn.appendChild(numSpan);

    if (evCount > 0) {
      const dot = document.createElement("span");
      dot.className = "cal-day-dot";
      btn.appendChild(dot);
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playClick();
      calSelectedDateIso = cellIso;
      if (isOtherMonth) {
        calViewYear = cellYear;
        calViewMonth = cellMonth;
      }
      renderCalendarUI();
    });

    daysGridEl.appendChild(btn);
  }

  // Right Pane: Selected Date Header & Events List
  if (selectedDateEl) {
    selectedDateEl.textContent = formatCalendarSelectedDateLabel(calSelectedDateIso);
  }

  const dayEvents = calendarEvents
    .filter((ev) => ev.dateIso === calSelectedDateIso)
    .sort((a, b) => {
      if (a.hasTime && !b.hasTime) return -1;
      if (!a.hasTime && b.hasTime) return 1;
      return a.timeStr.localeCompare(b.timeStr);
    });

  if (eventsCountEl) {
    eventsCountEl.textContent = `${dayEvents.length} ${dict.calEventsLabel || "EVENTS"}`;
  }

  if (!eventsListEl) return;
  eventsListEl.innerHTML = "";

  if (dayEvents.length === 0) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "cal-events-empty";
    emptyEl.textContent = dict.calEmpty || "No events on this date. Add one above!";
    eventsListEl.appendChild(emptyEl);
    return;
  }

  dayEvents.forEach((ev) => {
    const item = document.createElement("div");
    item.className = `cal-event-card${ev.notified ? " notified" : ""}`;

    const timeBadge = document.createElement("span");
    timeBadge.className = `cal-event-time-badge${ev.hasTime ? "" : " all-day"}`;
    timeBadge.textContent = ev.hasTime ? ev.timeStr : dict.calAllDay || "All Day";

    const titleSpan = document.createElement("span");
    titleSpan.className = "cal-event-title";
    titleSpan.textContent = ev.title;
    titleSpan.title = ev.title;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "cal-event-del";
    delBtn.title = "Delete";
    delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCalendarEvent(ev.id);
    });

    item.appendChild(timeBadge);
    item.appendChild(titleSpan);
    item.appendChild(delBtn);
    eventsListEl.appendChild(item);
  });
}

function addCalendarEvent(): void {
  const titleInput = document.getElementById("input-cal-event-title") as HTMLInputElement | null;
  const hourInput = document.getElementById("input-cal-hour") as HTMLInputElement | null;
  const minInput = document.getElementById("input-cal-min") as HTMLInputElement | null;

  if (!titleInput) return;
  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    return;
  }

  let hh = parseInt(hourInput?.value || "0", 10);
  let mm = parseInt(minInput?.value || "0", 10);
  if (isNaN(hh)) hh = 0;
  if (isNaN(mm)) mm = 0;
  hh = Math.max(0, Math.min(23, hh));
  mm = Math.max(0, Math.min(59, mm));

  const timeStr = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

  const newEv: CalendarEventItem = {
    id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    dateIso: calSelectedDateIso,
    title,
    hasTime: calUseSpecificTime,
    timeStr,
    notified: false,
  };

  sfx.playPop();
  calendarEvents.push(newEv);
  saveCalendarEvents();

  titleInput.value = "";
  if (hourInput) hourInput.value = "00";
  if (minInput) minInput.value = "00";
  renderCalendarUI();
}

function deleteCalendarEvent(id: string): void {
  sfx.playClick();
  calendarEvents = calendarEvents.filter((ev) => ev.id !== id);
  saveCalendarEvents();
  renderCalendarUI();
}

function triggerCalendarEventAlert(ev: CalendarEventItem): void {
  sfx.playTimerAlarm3x();

  if (focusAlertTimeoutId !== null) {
    clearTimeout(focusAlertTimeoutId);
    focusAlertTimeoutId = null;
  }

  isFocusAlertActive = true;
  const island = document.getElementById("island");
  const pillLyricsContainer = document.getElementById("pill-lyrics-container");
  const pillAlert = document.getElementById("pill-focus-alert");
  const pillIconBell = document.getElementById("pill-alert-icon-bell");
  const pillIconCal = document.getElementById("pill-alert-icon-cal");
  const pillAlertBadge = document.getElementById("pill-alert-badge");
  const pillAlertText = document.getElementById("pill-focus-alert-text");
  const dict = I18N[currentLang] || I18N.en;

  const timeLabel = ev.hasTime ? ev.timeStr : dict.calAllDay || "Today";

  if (pillIconBell) pillIconBell.style.display = "none";
  if (pillIconCal) pillIconCal.style.display = "block";
  if (pillAlertBadge) {
    pillAlertBadge.textContent = timeLabel;
    pillAlertBadge.style.display = "inline-flex";
  }
  if (pillAlertText) {
    pillAlertText.textContent = ev.title;
  }

  // Hide mini-pill lyrics first so they never collide with the Calendar Event notification
  if (pillLyricsContainer) {
    pillLyricsContainer.style.display = "none";
  }
  if (pillAlert) {
    pillAlert.style.display = "inline-flex";
  }

  if (island) {
    const combinedLen = timeLabel.length + ev.title.length + 4;
    const estimatedTextWidth = Math.min(280, Math.max(135, combinedLen * 7.2 + 34));
    const targetPillWidth = Math.min(520, Math.max(330, Math.round(190 + estimatedTextWidth)));
    island.style.setProperty("--collapsed-pill-width", `${targetPillWidth}px`);
    island.classList.remove("with-mini-lyrics");
    island.classList.add("with-focus-alert");
    island.scrollTop = 0;
    island.scrollLeft = 0;
  }

  notifyIslandState();

  focusAlertTimeoutId = window.setTimeout(() => {
    focusAlertTimeoutId = null;
    isFocusAlertActive = false;
    if (pillAlert) {
      pillAlert.style.display = "none";
    }
    if (pillAlertBadge) {
      pillAlertBadge.style.display = "none";
    }
    if (pillIconCal) pillIconCal.style.display = "none";
    if (pillIconBell) pillIconBell.style.display = "block";
    if (island) {
      island.classList.remove("with-focus-alert");
      island.style.removeProperty("--collapsed-pill-width");
      island.scrollTop = 0;
      island.scrollLeft = 0;
    }
    lastPillLyric = "";
    updateFocusUI();
    updateMiniLyricsPill();
  }, 5000);
}

function checkCalendarNotifications(now: Date): void {
  if (calendarEvents.length === 0) return;

  const todayIso = toDateIsoString(now);
  const nowHours = String(now.getHours()).padStart(2, "0");
  const nowMins = String(now.getMinutes()).padStart(2, "0");
  const nowTimeStr = `${nowHours}:${nowMins}`;

  let changed = false;
  const remainingEvents: CalendarEventItem[] = [];

  for (const ev of calendarEvents) {
    // 1. Remove any event whose date has already passed
    if (ev.dateIso < todayIso) {
      changed = true;
      continue;
    }

    // 2. Events scheduled for today
    if (ev.dateIso === todayIso) {
      if (ev.hasTime) {
        if (ev.timeStr === nowTimeStr && !ev.notified) {
          ev.notified = true;
          changed = true;
          triggerCalendarEventAlert(ev);
          // Automatically remove once its notification time arrives
          continue;
        }
        if (ev.timeStr < nowTimeStr || ev.notified) {
          // Time has already passed today -> remove from calendar
          changed = true;
          continue;
        }
      } else if (!ev.notified) {
        // All-day event on this date triggers a reminder when the day arrives
        ev.notified = true;
        changed = true;
        triggerCalendarEventAlert(ev);
      }
    }

    remainingEvents.push(ev);
  }

  if (changed) {
    calendarEvents = remainingEvents;
    saveCalendarEvents();
    renderCalendarUI();
  }
}

// ============================================
// Initialization & Events
// ============================================

window.addEventListener("DOMContentLoaded", async () => {
  // --- Multi-Monitor Setup ---
  invoke<number>("get_monitors_count")
    .then(async (count) => {
      const monitorItem = document.getElementById("settings-item-monitor");
      if (!monitorItem) return;
      const currentLabel = await invoke<string>("get_current_monitor_label").catch(() => "Monitor 1");
      const txt = document.getElementById("txt-current-monitor");
      if (txt) {
        txt.textContent = count > 1 ? `${currentLabel} ⇄` : currentLabel;
      }
    })
    .catch(() => {});

  const btnSwitchMonitor = document.getElementById("btn-switch-monitor");
  btnSwitchMonitor?.addEventListener("click", async (e) => {
    e.stopPropagation();
    sfx.playPop();
    try {
      const res = await invoke<string>("switch_monitor");
      const count = await invoke<number>("get_monitors_count").catch(() => 1);
      const lbl = document.getElementById("txt-current-monitor");
      if (lbl && res) {
        lbl.textContent = count > 1 ? `${res} ⇄` : res;
      }
    } catch (err) {
      console.error("switch_monitor error:", err);
    }
  });

  window.addEventListener("contextmenu", (e) => e.preventDefault());

  // --- Clock & Periodic Media Progress ---
  updateClock();
  setInterval(updateClock, 1000);
  setInterval(checkMusicIdleState, 2000);

  setInterval(() => {
    if (currentMedia.is_playing) {
      updateProgressUI();
    }
  }, 200);

  // ============================================
  // Horizontal Dragging + Hover Hold Delay / Click Open Controller
  // ============================================
  const island = document.getElementById("island");
  if (island) {
    const initialWidth = island.offsetWidth || 210;
    currentOffsetX = getClampedOffset(currentOffsetX, initialWidth);
    island.style.setProperty("--island-offset-x", `${currentOffsetX}px`);
    invoke("set_window_horizontal_offset", { offsetX: currentOffsetX }).catch(console.error);
    initHorizontalDragAndOpenTrigger(island);
  }

  window.addEventListener("resize", () => {
    notifyIslandState();
  });

  function initHorizontalDragAndOpenTrigger(islandEl: HTMLElement): void {
    // Plain "Reset" button text — no checkmark or exclamation mark
    const btnResetPos = document.getElementById("btn-reset-position");
    if (btnResetPos) {
      btnResetPos.addEventListener("click", async (e) => {
        e.stopPropagation();
        sfx.playPop();
        currentOffsetX = 0;
        localStorage.setItem("baobao_offset_x", "0");
        islandEl.style.setProperty("--island-offset-x", "0px");
        await invoke("reset_window_horizontal_offset").catch(console.error);
        notifyIslandState();
      });
    }

    islandEl.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        target.closest("button, input, textarea, a, .sound-wave, .notch-bottom-navbar, .progress-bar-track")
      ) {
        return;
      }

      isDragMouseDown = true;
      hasMovedSignificantly = false;
      dragStartX = e.screenX;
      dragInitialOffset = currentOffsetX;

      window.addEventListener("mousemove", onWindowMouseMove);
      window.addEventListener("mouseup", onWindowMouseUp);
    });

    function onWindowMouseMove(e: MouseEvent): void {
      if (!isDragMouseDown) return;

      const deltaX = e.screenX - dragStartX;

      if (!hasMovedSignificantly && Math.abs(deltaX) > 4) {
        hasMovedSignificantly = true;
        isDraggingIsland = true;
        document.body.classList.add("is-dragging-island");
        islandEl.classList.add("is-dragging");
        islandEl.classList.remove("hover-holding");

        if (hoverExpandTimer) {
          clearTimeout(hoverExpandTimer);
          hoverExpandTimer = null;
        }
      }

      if (isDraggingIsland) {
        const islandWidth = islandEl.offsetWidth || (isExpanded ? (isLyricsOpen ? 660 : 490) : 210);
        currentOffsetX = getClampedOffset(dragInitialOffset + deltaX, islandWidth);
        islandEl.style.setProperty("--island-offset-x", `${currentOffsetX}px`);
        if (!settingsHasCustomOffset) {
          const maxOffX = Math.max(0, (window.innerWidth - 590) / 2 - 8);
          settingsOffsetX = Math.max(-maxOffX, Math.min(maxOffX, currentOffsetX));
          const sw = document.getElementById("settings-window");
          if (sw) sw.style.setProperty("--settings-offset-x", `${settingsOffsetX}px`);
        }
        invoke("set_window_horizontal_offset", { offsetX: currentOffsetX }).catch(console.error);
      }
    }

    function onWindowMouseUp(): void {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);

      const wasDragging = isDraggingIsland;
      const moved = hasMovedSignificantly;
      isDragMouseDown = false;

      if (wasDragging) {
        isDraggingIsland = false;
        document.body.classList.remove("is-dragging-island");
        islandEl.classList.remove("is-dragging");
        localStorage.setItem("baobao_offset_x", String(currentOffsetX));
        return;
      }

      // If in "click" open mode (or user clicks the collapsed pill without dragging), expand Notch!
      if (!moved && !isExpanded && currentOpenMode === "click") {
        sfx.playPop();
        expandIsland();
      }
    }

    islandEl.addEventListener("mouseenter", () => {
      if (isDraggingIsland || isDragMouseDown) return;
      if (collapseTimeout) {
        clearTimeout(collapseTimeout);
        collapseTimeout = null;
      }

      if (isExpanded) return;

      // Only auto-open on hover when Open Notch is set to "hover"
      if (currentOpenMode !== "hover") return;

      if (hoverExpandTimer) clearTimeout(hoverExpandTimer);

      const delay = Math.max(0, currentHoverDelayMs);
      if (delay > 30) {
        islandEl.classList.add("hover-holding");
      }

      hoverExpandTimer = setTimeout(() => {
        islandEl.classList.remove("hover-holding");
        if (!isDraggingIsland && !isDragMouseDown) {
          expandIsland();
        }
      }, delay);
    });

    islandEl.addEventListener("mouseleave", () => {
      if (hoverExpandTimer) {
        clearTimeout(hoverExpandTimer);
        hoverExpandTimer = null;
      }
      islandEl.classList.remove("hover-holding");
      if (isDraggingIsland || isDragMouseDown) return;
      collapseIsland();
    });
  }

  // --- Draggable Floating Settings Window (Free Full-Screen Movement) ---
  const settingsWinEl = document.getElementById("settings-window");
  const initSettingsDrag = (handleEl: HTMLElement | null) => {
    if (!handleEl || !settingsWinEl) return;
    let isDraggingWin = false;
    let startX = 0;
    let startY = 0;
    let initX = 0;
    let initY = 0;

    handleEl.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "button, input, select, label, .toggle-switch, .sv-palette-box, .theme-swatch, .modal-card"
        )
      ) {
        return;
      }
      isDraggingWin = true;
      settingsWinEl.classList.add("is-dragging");
      startX = e.screenX;
      startY = e.screenY;
      initX = settingsOffsetX;
      initY = settingsOffsetY;

      const onMove = (me: MouseEvent) => {
        if (!isDraggingWin) return;
        const dx = me.screenX - startX;
        const dy = me.screenY - startY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          settingsHasCustomOffset = true;
        }
        const maxOffX = Math.max(0, (window.innerWidth - 590) / 2 - 8);
        const minOffY = 8;
        const maxOffY = Math.max(8, window.innerHeight - 410 - 12);
        settingsOffsetX = Math.max(-maxOffX, Math.min(maxOffX, initX + dx));
        settingsOffsetY = Math.max(minOffY, Math.min(maxOffY, initY + dy));
        settingsWinEl.style.setProperty("--settings-offset-x", `${settingsOffsetX}px`);
        settingsWinEl.style.setProperty("--settings-offset-y", `${settingsOffsetY}px`);
        notifyIslandState();
      };

      const onUp = () => {
        isDraggingWin = false;
        settingsWinEl.classList.remove("is-dragging");
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });
  };

  initSettingsDrag(settingsWinEl);

  // --- Bottom Navbar Tab Buttons (Music, Notes, & Focus) ---
  document.getElementById("nav-btn-music")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isInFullLyricsMode) {
      setInIslandFullLyricsMode(false);
    }
    sfx.playSlide();
    setSlide(0);
  });

  document.getElementById("nav-btn-notes")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isInFullLyricsMode) {
      setInIslandFullLyricsMode(false);
    }
    sfx.playSlide();
    setSlide(1);
  });

  document.getElementById("nav-btn-focus")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isInFullLyricsMode) {
      setInIslandFullLyricsMode(false);
    }
    sfx.playSlide();
    setSlide(2);
  });

  document.getElementById("nav-btn-calendar")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isInFullLyricsMode) {
      setInIslandFullLyricsMode(false);
    }
    sfx.playSlide();
    setSlide(3);
  });

  // --- Calendar & Event Reminder Controls ---
  loadCalendarEvents();
  checkCalendarNotifications(new Date());
  renderCalendarUI();

  document.getElementById("btn-cal-prev")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    if (calViewMonth === 0) {
      calViewMonth = 11;
      calViewYear -= 1;
    } else {
      calViewMonth -= 1;
    }
    renderCalendarUI();
  });

  document.getElementById("btn-cal-next")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    if (calViewMonth === 11) {
      calViewMonth = 0;
      calViewYear += 1;
    } else {
      calViewMonth += 1;
    }
    renderCalendarUI();
  });

  document.getElementById("btn-cal-today")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();
    const now = new Date();
    calViewYear = now.getFullYear();
    calViewMonth = now.getMonth();
    calSelectedDateIso = toDateIsoString(now);
    isCalPickerOpen = false;
    renderCalendarUI();
  });

  document.getElementById("btn-cal-month-picker")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();
    isCalPickerOpen = !isCalPickerOpen;
    renderCalendarUI();
  });

  document.getElementById("btn-cal-year-prev")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    calViewYear = Math.max(1970, calViewYear - 1);
    renderCalendarUI();
  });

  document.getElementById("btn-cal-year-next")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    calViewYear = Math.min(2100, calViewYear + 1);
    renderCalendarUI();
  });

  const calYearHeaderInput = document.getElementById("input-cal-year") as HTMLInputElement | null;
  const calYearPickerInput = document.getElementById("input-cal-picker-year") as HTMLInputElement | null;

  [calYearHeaderInput, calYearPickerInput].forEach((yInp) => {
    if (!yInp) return;
    yInp.addEventListener("click", (e) => {
      e.stopPropagation();
      yInp.select();
    });
    yInp.addEventListener("change", () => {
      let y = parseInt(yInp.value, 10);
      if (isNaN(y)) y = new Date().getFullYear();
      calViewYear = Math.max(1970, Math.min(2100, y));
      sfx.playPop();
      renderCalendarUI();
    });
    yInp.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        yInp.blur();
      }
    });
    yInp.addEventListener(
      "wheel",
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1 : -1;
        calViewYear = Math.max(1970, Math.min(2100, calViewYear + delta));
        renderCalendarUI();
      },
      { passive: false }
    );
  });

  document.getElementById("txt-cal-allday-chip")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();
    calUseSpecificTime = true;
    renderCalendarUI();
  });

  document.getElementById("btn-cal-toggle-time")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();
    calUseSpecificTime = !calUseSpecificTime;
    renderCalendarUI();
  });

  const calHourInput = document.getElementById("input-cal-hour") as HTMLInputElement | null;
  const calMinInput = document.getElementById("input-cal-min") as HTMLInputElement | null;

  [calHourInput, calMinInput].forEach((inp, idx) => {
    if (!inp) return;
    inp.addEventListener("click", (e) => {
      e.stopPropagation();
      inp.select();
    });
    inp.addEventListener("change", () => {
      const maxVal = idx === 0 ? 23 : 59;
      let val = parseInt(inp.value, 10);
      if (isNaN(val)) val = 0;
      val = Math.max(0, Math.min(maxVal, val));
      inp.value = String(val).padStart(2, "0");
    });
    inp.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        addCalendarEvent();
      }
    });
  });

  document.getElementById("btn-cal-add-event")?.addEventListener("click", (e) => {
    e.stopPropagation();
    addCalendarEvent();
  });

  document.getElementById("input-cal-event-title")?.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      addCalendarEvent();
    }
  });

  // --- Focus Time & Stopwatch Feature Controls ---
  updateFocusUI();

  document.querySelectorAll(".focus-mode-pill").forEach((pill) => {
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      const mode = ((pill as HTMLElement).dataset.focusMode || "timer") as "timer" | "stopwatch";
      setFocusMode(mode);
    });
  });

  document.querySelectorAll(".focus-preset-chip").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      const mins = parseInt((chip as HTMLElement).dataset.mins || "25", 10);
      setFocusDurationMinutes(mins);
    });
  });

  document.getElementById("btn-focus-minus")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const step = focusDurationSecs <= 60 ? 10 : 60;
    setFocusDurationTotalSeconds(Math.max(1, focusDurationSecs - step));
  });

  document.getElementById("btn-focus-plus")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const step = focusDurationSecs < 60 ? 10 : 60;
    setFocusDurationTotalSeconds(focusDurationSecs + step);
  });

  const inputCustomMins = document.getElementById("input-focus-custom-mins") as HTMLInputElement | null;
  const inputCustomSecs = document.getElementById("input-focus-custom-secs") as HTMLInputElement | null;

  const applyCustomMinSec = () => {
    const rawM = inputCustomMins ? parseInt(inputCustomMins.value, 10) : 0;
    const rawS = inputCustomSecs ? parseInt(inputCustomSecs.value, 10) : 0;
    const m = !isNaN(rawM) ? Math.max(0, Math.min(999, rawM)) : 0;
    const s = !isNaN(rawS) ? Math.max(0, Math.min(59, rawS)) : 0;
    const total = Math.max(1, m * 60 + s);
    setFocusDurationTotalSeconds(total);
  };

  [inputCustomMins, inputCustomSecs].forEach((inp) => {
    if (!inp) return;
    inp.addEventListener("click", (e) => {
      e.stopPropagation();
      inp.select();
    });
    inp.addEventListener("change", () => {
      applyCustomMinSec();
    });
    inp.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        inp.blur();
      }
    });
  });

  document.getElementById("btn-focus-toggle")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFocusTimer();
  });

  document.getElementById("btn-focus-lap")?.addEventListener("click", (e) => {
    e.stopPropagation();
    recordStopwatchLap();
  });

  document.getElementById("btn-focus-reset")?.addEventListener("click", (e) => {
    e.stopPropagation();
    resetFocusTimer();
  });

  // --- Pin Button in Bottom Navbar (Keep Notch Expanded) ---
  const btnPin = document.getElementById("btn-pin-island");
  if (btnPin) {
    btnPin.classList.toggle("active", isPinned);
    btnPin.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playPop();
      isPinned = !isPinned;
      localStorage.setItem("baobao_pinned", String(isPinned));
      btnPin.classList.toggle("active", isPinned);
      if (isPinned) {
        expandIsland();
      } else {
        collapseIsland();
      }
    });
  }

  if (isPinned) {
    expandIsland();
  }

  // --- Settings Buttons (Both Top-Right '...' and Bottom Navbar Gear) ---
  document.getElementById("btn-open-settings")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    toggleSettingsWindow();
  });

  document.getElementById("btn-nav-settings")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    toggleSettingsWindow();
  });

  // --- Close Floating Settings Window Button ---
  document.getElementById("btn-close-settings-win")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    toggleSettingsWindow(false);
  });

  // --- Sidebar Navigation inside Floating Settings Window ---
  document.querySelectorAll(".settings-nav-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playClick();
      const tabKey = (btn as HTMLElement).dataset.tab || "general";
      switchSettingsTab(tabKey);
    });
  });

  // --- Notes Tab Event Listeners ---
  loadNotes();

  document.getElementById("btn-add-note")?.addEventListener("click", (e) => {
    e.stopPropagation();
    createNewNote();
  });

  document.getElementById("btn-save-note")?.addEventListener("click", (e) => {
    e.stopPropagation();
    saveCurrentNote();
  });

  document.getElementById("btn-delete-note")?.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteCurrentNote();
  });

  const chipDue = document.getElementById("chip-due-date");
  const duePicker = document.getElementById("note-due-picker") as HTMLInputElement | null;
  const dueDisplay = document.getElementById("note-due-display");
  const btnClearDue = document.getElementById("btn-clear-due");

  chipDue?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("#btn-clear-due")) return;
    e.stopPropagation();
    sfx.playClick();
    openDueDatePicker();
  });

  duePicker?.addEventListener("change", () => {
    if (!duePicker.value) return;
    const [y, m, d] = duePicker.value.split("-").map(Number);
    const selectedDate = new Date(y, m - 1, d);
    const formatted = formatDateOnly(selectedDate, currentLang);

    if (dueDisplay) dueDisplay.textContent = formatted;
    if (btnClearDue) btnClearDue.style.display = "inline-flex";

    const current = notesList.find((n) => n.id === activeNoteId);
    if (current) {
      current.dueDate = formatted;
      current.dueDateIso = duePicker.value;
      saveNotes();
      renderNotesList();
    }
    sfx.playPop();
  });

  btnClearDue?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    const dict = I18N[currentLang] || I18N.en;
    if (dueDisplay) dueDisplay.textContent = dict.notesDuePlaceholder;
    if (duePicker) duePicker.value = "";
    if (btnClearDue) btnClearDue.style.display = "none";

    const current = notesList.find((n) => n.id === activeNoteId);
    if (current) {
      current.dueDate = "";
      current.dueDateIso = "";
      saveNotes();
      renderNotesList();
    }
  });

  const noteTitleInput = document.getElementById("note-title-input");
  noteTitleInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCurrentNote();
    }
  });

  document.getElementById("btn-toggle-complete")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();
    if (activeNoteId) {
      toggleNoteCompletion(activeNoteId);
    }
  });

  document.getElementById("btn-back-to-notes")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    closeNoteEditor();
  });

  document.getElementById("btn-close-note")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    closeNoteEditor();
  });

  // ============================================
  // Unified Appearance, Glass Mode, & Open Notch Controls
  // ============================================
  const savedTheme = localStorage.getItem("baobao_theme") || "blue";
  const savedCustomColor = localStorage.getItem("baobao_custom_color");
  if (savedTheme === "custom" && savedCustomColor) {
    applyCustomColor(savedCustomColor, false, true);
  } else if (THEMES[savedTheme]) {
    applyTheme(savedTheme);
  } else if (savedCustomColor) {
    applyCustomColor(savedCustomColor, false, true);
  } else {
    applyTheme("blue");
  }

  applyGlassMode(isGlassMode);
  applyFloatingNotch(isFloatingNotch);
  applyMenuBarConfig();
  applyOpenMode(currentOpenMode);
  applyHoverDelay(currentHoverDelayMs);
  applyLanguage((localStorage.getItem("baobao_lang") as Lang) || "en");

  refreshBatteryStatus();
  setInterval(refreshBatteryStatus, 15000);

  // 1. Preset Swatches
  document.querySelectorAll(".theme-swatch").forEach((swatch) => {
    swatch.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playPop();
      const themeKey = (swatch as HTMLElement).dataset.theme || "blue";
      applyTheme(themeKey);
    });
  });

  // 2. Interactive 2D Saturation-Value Palette Box
  const svBox = document.getElementById("sv-palette-box");
  if (svBox) {
    let draggingSv = false;
    const updateFromSvPointer = (clientX: number, clientY: number, commit: boolean) => {
      const rect = svBox.getBoundingClientRect();
      const s = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
      const v = Math.max(0, Math.min(100, Math.round(100 - ((clientY - rect.top) / rect.height) * 100)));
      pickerSat = s;
      pickerVal = v;
      const newHex = hsvToHex(pickerHue, pickerSat, pickerVal);
      applyCustomColor(newHex, commit, false);
    };

    svBox.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      draggingSv = true;
      updateFromSvPointer(e.clientX, e.clientY, false);

      const onMove = (me: MouseEvent) => {
        if (!draggingSv) return;
        updateFromSvPointer(me.clientX, me.clientY, false);
      };
      const onUp = (me: MouseEvent) => {
        if (!draggingSv) return;
        draggingSv = false;
        updateFromSvPointer(me.clientX, me.clientY, true);
        sfx.playPop();
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });
  }

  // 3. Rainbow Hue Slider
  const hueSlider = document.getElementById("slider-color-hue") as HTMLInputElement | null;
  if (hueSlider) {
    hueSlider.addEventListener("input", (e) => {
      e.stopPropagation();
      pickerHue = parseInt(hueSlider.value, 10) || 0;
      const newHex = hsvToHex(pickerHue, Math.max(pickerSat, 20), Math.max(pickerVal, 25));
      applyCustomColor(newHex, false, false);
    });
    hueSlider.addEventListener("change", (e) => {
      e.stopPropagation();
      pickerHue = parseInt(hueSlider.value, 10) || 0;
      const newHex = hsvToHex(pickerHue, Math.max(pickerSat, 20), Math.max(pickerVal, 25));
      applyCustomColor(newHex, true, false);
      sfx.playPop();
    });
  }

  // 4. Direct HEX Code Input
  const hexInputEl = document.getElementById("input-color-hex-text") as HTMLInputElement | null;
  if (hexInputEl) {
    hexInputEl.addEventListener("input", () => {
      let val = hexInputEl.value.trim();
      if (!val.startsWith("#")) val = "#" + val;
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        applyCustomColor(val, true, true);
      }
    });
    hexInputEl.addEventListener("blur", () => {
      hexInputEl.value = currentCustomHex.toUpperCase();
    });
  }

  // 5. Cross-Platform Eyedropper / Native Color Picker
  const btnEyedropper = document.getElementById("btn-eyedropper");
  btnEyedropper?.addEventListener("click", async (e) => {
    e.stopPropagation();
    sfx.playPop();
    if ("EyeDropper" in window) {
      try {
        const eyeDropper = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
        const res = await eyeDropper.open();
        if (res && res.sRGBHex) {
          applyCustomColor(res.sRGBHex, true, true);
          sfx.playPop();
        }
        return;
      } catch (_) {
        return;
      }
    }

    try {
      const pickedHex = await invoke<string | null>("pick_native_color", { initialHex: currentCustomHex });
      if (pickedHex && /^#[0-9a-fA-F]{6}$/i.test(pickedHex)) {
        applyCustomColor(pickedHex, true, true);
        sfx.playPop();
      }
    } catch (_) {}
  });

  // 6. Single Neutral Glass Toggle (Independent of Theme Color)
  const toggleGlass = document.getElementById("toggle-glass-mode") as HTMLInputElement | null;
  if (toggleGlass) {
    toggleGlass.checked = isGlassMode;
    toggleGlass.addEventListener("change", (e) => {
      e.stopPropagation();
      sfx.playPop();
      applyGlassMode(toggleGlass.checked);
    });
  }

  // 7. Open Notch Mode (Hover vs Click) + Hover Hold Delay Slider
  document.getElementById("btn-mode-hover")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();
    applyOpenMode("hover");
  });

  document.getElementById("btn-mode-click")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();
    applyOpenMode("click");
  });

  const sliderHoverDelay = document.getElementById("slider-hover-delay") as HTMLInputElement | null;
  if (sliderHoverDelay) {
    sliderHoverDelay.value = currentHoverDelayMs.toString();
    sliderHoverDelay.addEventListener("input", () => {
      const val = parseInt(sliderHoverDelay.value, 10);
      applyHoverDelay(val);
    });
    sliderHoverDelay.addEventListener("change", () => {
      sfx.playPop();
    });
  }

  // 8. Floating Notch Toggle & Menu Bar Toggles
  const toggleFloating = document.getElementById("toggle-floating-notch") as HTMLInputElement | null;
  if (toggleFloating) {
    toggleFloating.checked = isFloatingNotch;
    toggleFloating.addEventListener("change", (e) => {
      e.stopPropagation();
      sfx.playPop();
      applyFloatingNotch(toggleFloating.checked);
    });
  }

  const toggleMenuMusic = document.getElementById("toggle-menu-music") as HTMLInputElement | null;
  const toggleMenuNotes = document.getElementById("toggle-menu-notes") as HTMLInputElement | null;
  const toggleMenuFocus = document.getElementById("toggle-menu-focus") as HTMLInputElement | null;
  const toggleMenuCalendar = document.getElementById("toggle-menu-calendar") as HTMLInputElement | null;
  const toggleMenuBattery = document.getElementById("toggle-menu-battery") as HTMLInputElement | null;

  toggleMenuMusic?.addEventListener("change", (e) => {
    e.stopPropagation();
    sfx.playPop();
    menuMusicEnabled = toggleMenuMusic.checked;
    applyMenuBarConfig();
  });

  toggleMenuNotes?.addEventListener("change", (e) => {
    e.stopPropagation();
    sfx.playPop();
    menuNotesEnabled = toggleMenuNotes.checked;
    applyMenuBarConfig();
  });

  toggleMenuFocus?.addEventListener("change", (e) => {
    e.stopPropagation();
    sfx.playPop();
    menuFocusEnabled = toggleMenuFocus.checked;
    applyMenuBarConfig();
  });

  toggleMenuCalendar?.addEventListener("change", (e) => {
    e.stopPropagation();
    sfx.playPop();
    menuCalendarEnabled = toggleMenuCalendar.checked;
    applyMenuBarConfig();
  });

  toggleMenuBattery?.addEventListener("change", (e) => {
    e.stopPropagation();
    sfx.playPop();
    showBatteryEnabled = toggleMenuBattery.checked;
    applyMenuBarConfig();
  });

  // --- Language, SFX, Mini Lyrics, Autostart ---
  const selectLang = document.getElementById("select-language") as HTMLSelectElement | null;
  selectLang?.addEventListener("change", (e) => {
    e.stopPropagation();
    sfx.playPop();
    applyLanguage(selectLang.value as Lang);
  });

  const toggleSfx = document.getElementById("toggle-sfx") as HTMLInputElement | null;
  if (toggleSfx) {
    toggleSfx.checked = sfx.isEnabled();
    toggleSfx.addEventListener("change", (e) => {
      e.stopPropagation();
      sfx.setEnabled(toggleSfx.checked);
    });
  }

  const toggleMini = document.getElementById("toggle-mini-lyrics") as HTMLInputElement | null;
  if (toggleMini) {
    toggleMini.checked = miniLyricsEnabled;
    toggleMini.addEventListener("change", (e) => {
      e.stopPropagation();
      miniLyricsEnabled = toggleMini.checked;
      localStorage.setItem("baobao_mini_lyrics", String(miniLyricsEnabled));
      localStorage.setItem("baobao_mini_lyrics_v3", String(miniLyricsEnabled));
      sfx.playPop();
      updateMiniLyricsPill();
    });
  }

  const toggleAutostart = document.getElementById("toggle-autostart") as HTMLInputElement | null;
  if (toggleAutostart) {
    const savedAuto = localStorage.getItem("baobao_autostart");
    const defaultAuto = savedAuto === null ? true : savedAuto === "true";
    toggleAutostart.checked = defaultAuto;
    invoke("set_autostart", { enable: defaultAuto }).catch(() => {});

    toggleAutostart.addEventListener("change", async (e) => {
      e.stopPropagation();
      sfx.playPop();
      localStorage.setItem("baobao_autostart", String(toggleAutostart.checked));
      try {
        await invoke("set_autostart", { enable: toggleAutostart.checked });
      } catch (err) {
        console.warn("Failed to set autostart:", err);
      }
    });
  }

  // --- Shortcut Key Configuration ---
  const btnShortcut = document.getElementById("btn-shortcut-key");
  btnShortcut?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    isRecordingShortcut = true;
    btnShortcut.classList.add("recording");
    const disp = document.getElementById("txt-shortcut-key-display");
    const dict = I18N[currentLang] || I18N.en;
    if (disp) disp.textContent = dict.shortcutRecording || "...";
  });

  window.addEventListener("keydown", async (e) => {
    if (isRecordingShortcut) {
      e.preventDefault();
      e.stopPropagation();
      isRecordingShortcut = false;
      const btn = document.getElementById("btn-shortcut-key");
      btn?.classList.remove("recording");

      if (e.key === "Escape") {
        updateShortcutDisplay();
        return;
      }

      let keyName = e.key;
      if (e.code === "Backquote" || e.key === "`") keyName = "`";
      else if (e.code === "Space") keyName = "Space";
      else if (keyName.length === 1) keyName = keyName.toUpperCase();

      currentShortcutKey = keyName;
      currentShortcutVk = e.keyCode || 192;

      localStorage.setItem("baobao_shortcut_key", currentShortcutKey);
      localStorage.setItem("baobao_shortcut_vk", currentShortcutVk.toString());
      updateShortcutDisplay();
      sfx.playPop();

      try {
        await invoke("set_toggle_shortcut", { vkCode: currentShortcutVk });
      } catch (_) {}
      return;
    }

    const activeEl = document.activeElement;
    const isInputActive = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
    if (!isInputActive) {
      const isBacktick = currentShortcutKey === "`" && (e.key === "`" || e.code === "Backquote");
      const isKeyMatch = e.key.toUpperCase() === currentShortcutKey.toUpperCase();
      if (isBacktick || isKeyMatch) {
        e.preventDefault();
      }
    }
  });

  try {
    invoke("set_toggle_shortcut", { vkCode: currentShortcutVk });
  } catch (_) {}
  updateShortcutDisplay();

  // --- Reset All Settings to Default (with Confirmation Modal) ---
  const btnResetAll = document.getElementById("btn-reset-all-settings");
  const modalResetConfirm = document.getElementById("modal-reset-confirm");
  const btnCancelReset = document.getElementById("btn-cancel-reset");
  const btnConfirmReset = document.getElementById("btn-confirm-reset");

  btnResetAll?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    if (modalResetConfirm) modalResetConfirm.style.display = "flex";
  });

  btnCancelReset?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    if (modalResetConfirm) modalResetConfirm.style.display = "none";
  });

  modalResetConfirm?.addEventListener("click", (e) => {
    if (e.target === modalResetConfirm) {
      modalResetConfirm.style.display = "none";
    }
  });

  function resetAllSettingsToDefault(): void {
    localStorage.removeItem("baobao_theme");
    localStorage.removeItem("baobao_custom_color");
    localStorage.removeItem("baobao_glass_mode");
    applyTheme("blue");
    applyGlassMode(false);

    localStorage.removeItem("baobao_open_mode");
    localStorage.removeItem("baobao_hover_delay");
    applyOpenMode("hover");
    applyHoverDelay(250);

    localStorage.removeItem("baobao_shortcut_key");
    localStorage.removeItem("baobao_shortcut_vk");
    currentShortcutKey = "`";
    currentShortcutVk = 192;
    updateShortcutDisplay();
    try {
      invoke("set_toggle_shortcut", { vkCode: 192 });
    } catch (_) {}

    localStorage.removeItem("baobao_offset_x");
    currentOffsetX = 0;
    const islandEl = document.getElementById("island");
    if (islandEl) islandEl.style.setProperty("--island-offset-x", "0px");
    try {
      invoke("reset_window_horizontal_offset");
    } catch (_) {}
    notifyIslandState();

    sfx.setEnabled(true);
    const toggleSfx = document.getElementById("toggle-sfx") as HTMLInputElement | null;
    if (toggleSfx) toggleSfx.checked = true;

    miniLyricsEnabled = true;
    localStorage.setItem("baobao_mini_lyrics", "true");
    localStorage.setItem("baobao_mini_lyrics_v3", "true");
    const toggleMini = document.getElementById("toggle-mini-lyrics") as HTMLInputElement | null;
    if (toggleMini) toggleMini.checked = true;
    updateMiniLyricsPill();

    localStorage.setItem("baobao_autostart", "true");
    const toggleAutostart = document.getElementById("toggle-autostart") as HTMLInputElement | null;
    if (toggleAutostart) toggleAutostart.checked = true;
    invoke("set_autostart", { enable: true }).catch(() => {});

    applyFloatingNotch(false);
    menuMusicEnabled = true;
    menuNotesEnabled = true;
    menuFocusEnabled = true;
    menuCalendarEnabled = true;
    showBatteryEnabled = true;
    applyMenuBarConfig();
  }

  btnConfirmReset?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playExplode();
    if (modalResetConfirm) modalResetConfirm.style.display = "none";
    resetAllSettingsToDefault();
  });

  // --- Super Smooth Accordion Lyrics Toggle (Bottom Navbar Speech Bubble) ---
  const btnLyrics = document.getElementById("btn-lyrics");
  const lyricsPane = document.getElementById("lyrics-pane");

  btnLyrics?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();

    if (currentSlide !== 0) {
      setSlide(0);
    }

    if (isInFullLyricsMode) {
      setInIslandFullLyricsMode(false);
      return;
    }

    isLyricsOpen = !isLyricsOpen;

    if (isLyricsOpen) {
      island?.classList.add("with-lyrics");
      lyricsPane?.classList.remove("hidden");
      btnLyrics.classList.add("active");
    } else {
      island?.classList.remove("with-lyrics");
      lyricsPane?.classList.add("hidden");
      btnLyrics.classList.remove("active");
    }

    notifyIslandState();
  });

  // --- In-Notch Dedicated Full Lyrics Mode Toggles ---
  document.getElementById("btn-full-lyrics")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();
    setInIslandFullLyricsMode(true);
  });

  document.getElementById("btn-exit-full-lyrics")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();
    setInIslandFullLyricsMode(false);
  });

  // --- Native Media Playback Controls ---
  document.getElementById("btn-play-pause")?.addEventListener("click", async (e) => {
    e.stopPropagation();
    sfx.playPop();
    const nextPlaying = !currentMedia.is_playing;
    setLocalPlaying(nextPlaying);
    try {
      await invoke("media_toggle_play_pause");
    } catch (err) {
      console.warn("Play/pause error:", err);
    }
  });

  document.getElementById("btn-next")?.addEventListener("click", async (e) => {
    e.stopPropagation();
    sfx.playClick();
    try {
      await invoke("media_next");
    } catch (err) {
      console.warn("Next track error:", err);
    }
  });

  document.getElementById("btn-prev")?.addEventListener("click", async (e) => {
    e.stopPropagation();
    sfx.playClick();
    try {
      await invoke("media_prev");
    } catch (err) {
      console.warn("Prev track error:", err);
    }
  });

  // --- Interactive Progress Bar Seeking ---
  const progressBar = document.getElementById("progress-bar-track");
  progressBar?.addEventListener("click", async (e) => {
    e.stopPropagation();
    sfx.playClick();
    const rect = progressBar.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const dur = currentMedia.duration_secs || totalSeconds;
    const targetSecs = fraction * dur;

    currentMedia.position_secs = targetSecs;
    currentMedia.position_at_ms = Date.now();
    updateProgressUI();

    try {
      await invoke("media_seek", { positionSecs: targetSecs });
    } catch (err) {
      console.warn("Seek error:", err);
    }
  });

  // --- Native Master Volume Interactions ---
  initVolumeController();

  const volumeGroup = document.getElementById("volume-group");
  const volumeTrack = document.getElementById("volume-slider-track");
  const btnMute = document.getElementById("btn-volume-mute");

  let isDraggingVolume = false;

  const updateVolFromMouseEvent = (e: MouseEvent) => {
    if (!volumeTrack) return;
    const rect = volumeTrack.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setMasterVolume(fraction);
  };

  volumeTrack?.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isDraggingVolume = true;
    updateVolFromMouseEvent(e);
  });

  window.addEventListener("mousemove", (e) => {
    if (isDraggingVolume) {
      updateVolFromMouseEvent(e);
    }
  });

  window.addEventListener("mouseup", () => {
    if (isDraggingVolume) {
      isDraggingVolume = false;
    }
  });

  btnMute?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    if (currentVolume > 0.001) {
      lastUnmutedVolume = currentVolume;
      setMasterVolume(0);
    } else {
      setMasterVolume(lastUnmutedVolume > 0.05 ? lastUnmutedVolume : 0.65);
    }
  });

  volumeGroup?.addEventListener("wheel", (e) => {
    e.stopPropagation();
    e.preventDefault();
    const step = e.deltaY < 0 ? 0.03 : -0.03;
    setMasterVolume(currentVolume + step);
  }, { passive: false });

  // --- Mouse Wheel to Switch Tabs on Notch ---
  let lastTabScrollTime = 0;
  const islandEl = document.getElementById("island");
  islandEl?.addEventListener("wheel", (e) => {
    const target = e.target as HTMLElement | null;
    if (
      target?.closest("#volume-group") ||
      target?.closest("#full-lyrics-stream") ||
      target?.closest("#slide-notes") ||
      target?.closest(".notes-container") ||
      target?.closest("#slide-calendar") ||
      isInFullLyricsMode
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastTabScrollTime < 240) return;

    const enabledSlides = getEnabledSlides();
    if (enabledSlides.length <= 1) return;
    const curPos = Math.max(0, enabledSlides.indexOf(currentSlide));

    if (e.deltaY > 15 || e.deltaX > 15) {
      lastTabScrollTime = now;
      sfx.playSlide();
      setSlide(enabledSlides[(curPos + 1) % enabledSlides.length]);
    } else if (e.deltaY < -15 || e.deltaX < -15) {
      lastTabScrollTime = now;
      sfx.playSlide();
      setSlide(enabledSlides[(curPos - 1 + enabledSlides.length) % enabledSlides.length]);
    }
  });

  // ============================================
  // Fetch Initial Media State Immediately on Load
  // ============================================
  try {
    const initialMedia = await invoke<MediaPayload>("get_media_state");
    if (initialMedia && (initialMedia.title || initialMedia.is_playing)) {
      currentMedia = initialMedia;
      updateMediaUI(currentMedia);
    } else {
      document.querySelectorAll(".sound-wave").forEach((w) => w.classList.add("paused"));
      checkMusicIdleState();
    }
  } catch (err) {
    console.warn("[Baobao] Could not fetch initial media state:", err);
  }

  listen<MediaPayload>("media-changed", (event) => {
    currentMedia = event.payload;
    updateMediaUI(currentMedia);
  });

  setInterval(async () => {
    try {
      const media = await invoke<MediaPayload>("get_media_state");
      if (
        media &&
        (media.title !== currentMedia.title ||
          media.artist !== currentMedia.artist ||
          media.is_playing !== currentMedia.is_playing ||
          Math.abs(media.position_secs - currentMedia.position_secs) > 2)
      ) {
        currentMedia = media;
        updateMediaUI(currentMedia);
      }
    } catch (_) {}
  }, 1500);
});
