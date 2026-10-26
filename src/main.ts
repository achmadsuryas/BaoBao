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

  /** Bouncy pop & destruction boom sound for clearing items */
  playExplode() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Punchy sub-bass drop
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

      // Cartoon sparkle crunch
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
}

export const sfx = new SoundEffects();

// ============================================
// Dynamic Color Themes
// ============================================

interface ThemeConfig {
  name: string;
  accent: string;
  accentGradient: string;
  glow: string;
  trackFill: string;
}

const THEMES: Record<string, ThemeConfig> = {
  gray: {
    name: "Slate Gray",
    accent: "#a1a1aa",
    accentGradient: "linear-gradient(135deg, #e4e4e7 0%, #a1a1aa 50%, #71717a 100%)",
    glow: "rgba(161, 161, 170, 0.4)",
    trackFill: "linear-gradient(90deg, #d4d4d8, #a1a1aa)",
  },
  pink: {
    name: "Sakura Pink",
    accent: "#f43f5e",
    accentGradient: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 50%, #f43f5e 100%)",
    glow: "rgba(244, 63, 94, 0.45)",
    trackFill: "linear-gradient(90deg, #ff758c, #f43f5e)",
  },
  violet: {
    name: "Sakura Pink",
    accent: "#f43f5e",
    accentGradient: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 50%, #f43f5e 100%)",
    glow: "rgba(244, 63, 94, 0.45)",
    trackFill: "linear-gradient(90deg, #ff758c, #f43f5e)",
  },
  cyan: {
    name: "Neon Cyan",
    accent: "#06b6d4",
    accentGradient: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #3b82f6 100%)",
    glow: "rgba(6, 182, 212, 0.45)",
    trackFill: "linear-gradient(90deg, #38bdf8, #06b6d4)",
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
};

function applyTheme(themeKey: string): void {
  const theme = THEMES[themeKey] || THEMES.gray;
  const root = document.documentElement;
  root.style.setProperty("--theme-accent", theme.accent);
  root.style.setProperty("--theme-accent-gradient", theme.accentGradient);
  root.style.setProperty("--theme-glow", theme.glow);
  root.style.setProperty("--theme-track-fill", theme.trackFill);

  document.querySelectorAll(".theme-swatch").forEach((swatch) => {
    if ((swatch as HTMLElement).dataset.theme === themeKey) {
      swatch.classList.add("active");
    } else {
      swatch.classList.remove("active");
    }
  });

  localStorage.setItem("baobao_theme", themeKey);
}

// ============================================
// Multi-Language Support (i18n)
// ============================================

type Lang = "en" | "id" | "ja";

const I18N: Record<Lang, Record<string, string>> = {
  en: {
    sfxTitle: "Sound Effects",
    sfxDesc: "UI click audio",
    miniLyricsTitle: "Mini Pill Lyrics",
    miniLyricsDesc: "Show when minimized",
    langTitle: "Language",
    themeTitle: "Color Theme",
    shelfTitle: "Shelf",
    shelfDropTitle: "Drop files here",
    shelfDropSubtitle: "Drag files / folders / apps to stash",
    waitingMusic: "Waiting for music...",
    playAnySong: "Play any song to start listening",
    noLyrics: "No lyrics available",
    loadingLyrics: "Loading lyrics...",
    autostartTitle: "Start on Boot",
    autostartDesc: "Launch on PC startup",
    monitorTitle: "Display Monitor",
    monitorDesc: "Switch screen",
    positionTitle: "Position",
    positionDesc: "Drag left / right",
    btnResetCenter: "Reset",
    langDesc: "Display language",
    appFooter: "BaoBao v0.1.0",
    settingsCategory: "Settings",
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
    tooltipPin: "Keep Island Expanded",
    tooltipPrevView: "Previous view",
    tooltipNextView: "Next view",
    tooltipToggleLyrics: "Toggle Lyrics",
    tooltipPrevTrack: "Previous Track",
    tooltipPlayPause: "Play / Pause",
    tooltipNextTrack: "Next Track",
    tooltipVolume: "Volume (Scroll mouse to adjust)",
    tooltipMute: "Mute / Unmute",
    tooltipFullLyrics: "Full Lyrics",
    tooltipCloseLyrics: "Close Lyrics",
    tooltipClearAll: "Clear all items",
    tooltipSliderView: "Slider View (Scroll horizontally)",
    tooltipGridView: "Grid View (Scroll vertically)",
    tooltipNewNote: "New Note",
    tooltipDeleteNote: "Delete Note",
    tooltipSaveNote: "Save Note",
    tooltipCreatedDate: "Date Created",
    tooltipDueDate: "Due Date (Deadline)",
    tooltipVisualizer: "Audio Visualizer",
    tooltipBaobao: "BaoBao",
    tooltipDotMusic: "Music",
    tooltipDotShelf: "Shelf",
    tooltipDotNotes: "Notes",
    tooltipDotSettings: "Settings",
    tooltipMarkComplete: "Mark as Completed",
    tooltipMarkIncomplete: "Mark as Incomplete",
    tooltipCloseEditor: "Close Editor",
  },
  id: {
    sfxTitle: "Suara SFX",
    sfxDesc: "Efek klik UI",
    miniLyricsTitle: "Lirik Mini Pill",
    miniLyricsDesc: "Tampil saat minimize",
    langTitle: "Bahasa",
    themeTitle: "Tema Warna",
    shelfTitle: "Shelf",
    shelfDropTitle: "Letakkan file di sini",
    shelfDropSubtitle: "Tarik file / folder / aplikasi ke sini",
    waitingMusic: "Menunggu musik...",
    playAnySong: "Putar lagu untuk mulai mendengarkan",
    noLyrics: "Lirik tidak tersedia",
    loadingLyrics: "Memuat lirik...",
    autostartTitle: "Mulai Otomatis",
    autostartDesc: "Buka saat laptop/PC menyala",
    monitorTitle: "Layar / Monitor",
    monitorDesc: "Ganti monitor",
    positionTitle: "Posisi Pulau",
    positionDesc: "Geser kiri / kanan",
    btnResetCenter: "Reset",
    langDesc: "Bahasa tampilan",
    appFooter: "BaoBao v0.1.0",
    settingsCategory: "Pengaturan",
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
    tooltipPin: "Sematkan Selalu Terbuka",
    tooltipPrevView: "Tampilan Sebelumnya",
    tooltipNextView: "Tampilan Berikutnya",
    tooltipToggleLyrics: "Tampilkan / Sembunyikan Lirik",
    tooltipPrevTrack: "Lagu Sebelumnya",
    tooltipPlayPause: "Putar / Jeda",
    tooltipNextTrack: "Lagu Berikutnya",
    tooltipVolume: "Volume (Gulir mouse untuk mengatur)",
    tooltipMute: "Bisukan / Bunyikan",
    tooltipFullLyrics: "Lirik Lengkap",
    tooltipCloseLyrics: "Tutup Lirik",
    tooltipClearAll: "Hapus Semua Item",
    tooltipSliderView: "Tampilan Geser (Gulir ke samping)",
    tooltipGridView: "Tampilan Kisi (Gulir ke bawah)",
    tooltipNewNote: "Catatan Baru",
    tooltipDeleteNote: "Hapus Catatan",
    tooltipSaveNote: "Simpan Catatan",
    tooltipCreatedDate: "Tanggal Dibuat",
    tooltipDueDate: "Tenggat Waktu",
    tooltipVisualizer: "Visualiser Audio",
    tooltipBaobao: "BaoBao",
    tooltipDotMusic: "Musik",
    tooltipDotShelf: "Rak Berkas",
    tooltipDotNotes: "Catatan",
    tooltipDotSettings: "Pengaturan",
    tooltipMarkComplete: "Tandai Selesai",
    tooltipMarkIncomplete: "Tandai Belum Selesai",
    tooltipCloseEditor: "Tutup Editor",
  },
  ja: {
    sfxTitle: "効果音 (SFX)",
    sfxDesc: "UIクリック操作音",
    miniLyricsTitle: "ミニ歌詞表示",
    miniLyricsDesc: "最小化時に歌詞を表示",
    langTitle: "言語",
    themeTitle: "カラーテーマ",
    shelfTitle: "シェルフ",
    shelfDropTitle: "ファイルをここにドロップ",
    shelfDropSubtitle: "ファイル・フォルダ・アプリを保管",
    waitingMusic: "音楽を待機中...",
    playAnySong: "曲を再生して開始",
    noLyrics: "歌詞がありません",
    loadingLyrics: "歌詞を読み込み中...",
    autostartTitle: "自動起動",
    autostartDesc: "PC起動時に自動で開始",
    monitorTitle: "ディスプレイ",
    monitorDesc: "画面切り替え",
    positionTitle: "配置",
    positionDesc: "左右にドラッグ",
    btnResetCenter: "リセット",
    langDesc: "表示言語",
    appFooter: "BaoBao v0.1.0",
    settingsCategory: "設定",
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
    tooltipPin: "常に展開して固定",
    tooltipPrevView: "前の画面",
    tooltipNextView: "次の画面",
    tooltipToggleLyrics: "歌詞の切り替え",
    tooltipPrevTrack: "前の曲",
    tooltipPlayPause: "再生 / 一時停止",
    tooltipNextTrack: "次の曲",
    tooltipVolume: "音量 (マウススクロールで調整)",
    tooltipMute: "消音 / 解除",
    tooltipFullLyrics: "全画面歌詞",
    tooltipCloseLyrics: "歌詞を閉じる",
    tooltipClearAll: "すべてのアイテムを削除",
    tooltipSliderView: "スライダー表示 (横スクロール)",
    tooltipGridView: "グリッド表示 (縦スクロール)",
    tooltipNewNote: "新規メモ",
    tooltipDeleteNote: "メモを削除",
    tooltipSaveNote: "メモを保存",
    tooltipCreatedDate: "作成日時",
    tooltipDueDate: "期限・締切",
    tooltipVisualizer: "オーディオビジュアライザー",
    tooltipBaobao: "BaoBao",
    tooltipDotMusic: "音楽",
    tooltipDotShelf: "シェルフ",
    tooltipDotNotes: "メモ",
    tooltipDotSettings: "設定",
    tooltipMarkComplete: "完了にする",
    tooltipMarkIncomplete: "未完了にする",
    tooltipCloseEditor: "エディタを閉じる",
  },
};

let currentLang: Lang = (localStorage.getItem("baobao_lang") as Lang) || "en";

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
  setT("btn-pin-island", dict.tooltipPin);
  setT("btn-prev-slide", dict.tooltipPrevView);
  setT("btn-next-slide", dict.tooltipNextView);
  setT("btn-lyrics", dict.tooltipToggleLyrics);
  setT("btn-prev", dict.tooltipPrevTrack);
  setT("btn-play-pause", dict.tooltipPlayPause);
  setT("btn-next", dict.tooltipNextTrack);
  setT("volume-group", dict.tooltipVolume);
  setT("btn-volume-mute", dict.tooltipMute);
  setT("btn-full-lyrics", dict.tooltipFullLyrics);
  setT("btn-exit-full-lyrics", dict.tooltipCloseLyrics);
  setT("btn-shelf-clear-all", dict.tooltipClearAll);
  setT("btn-shelf-slider", dict.tooltipSliderView);
  setT("btn-shelf-grid", dict.tooltipGridView);
  setT("btn-add-note", dict.tooltipNewNote);
  setT("btn-delete-note", dict.tooltipDeleteNote);
  setT("btn-save-note", dict.tooltipSaveNote);
  setT("btn-close-note", dict.tooltipCloseEditor);

  setBySelector(".note-date-chip:not(.due)", dict.tooltipCreatedDate);
  setBySelector(".note-date-chip.due", dict.tooltipDueDate);
  setBySelector(".sound-wave", dict.tooltipVisualizer);
  setBySelector(".baobao-logo", dict.tooltipBaobao);

  // Carousel dots
  const dots = document.querySelectorAll(".carousel-dots .dot");
  if (dots[0]) (dots[0] as HTMLElement).title = dict.tooltipDotMusic;
  if (dots[1]) (dots[1] as HTMLElement).title = dict.tooltipDotShelf;
  if (dots[2]) (dots[2] as HTMLElement).title = dict.tooltipDotNotes;
  if (dots[3]) (dots[3] as HTMLElement).title = dict.tooltipDotSettings;
}

function applyLanguage(lang: Lang): void {
  currentLang = lang;
  localStorage.setItem("baobao_lang", lang);
  const dict = I18N[lang] || I18N.en;

  const sfxLabel = document.getElementById("txt-sfx-label");
  if (sfxLabel) sfxLabel.textContent = dict.sfxTitle;
  const sfxDesc = document.getElementById("txt-sfx-desc");
  if (sfxDesc) sfxDesc.textContent = dict.sfxDesc;

  const lyricsLabel = document.getElementById("txt-lyrics-label");
  if (lyricsLabel) lyricsLabel.textContent = dict.miniLyricsTitle;
  const lyricsDesc = document.getElementById("txt-lyrics-desc");
  if (lyricsDesc) lyricsDesc.textContent = dict.miniLyricsDesc;

  const langLabel = document.getElementById("txt-lang-label");
  if (langLabel) langLabel.textContent = dict.langTitle;
  const langDesc = document.getElementById("txt-lang-desc");
  if (langDesc) langDesc.textContent = dict.langDesc;

  const themeLabel = document.getElementById("txt-theme-label");
  if (themeLabel) themeLabel.textContent = dict.themeTitle;

  const autostartLabel = document.getElementById("txt-autostart-label");
  if (autostartLabel) autostartLabel.textContent = dict.autostartTitle;
  const autostartDesc = document.getElementById("txt-autostart-desc");
  if (autostartDesc) autostartDesc.textContent = dict.autostartDesc;

  const monitorLabel = document.getElementById("txt-monitor-label");
  if (monitorLabel) monitorLabel.textContent = dict.monitorTitle;
  const monitorDesc = document.getElementById("txt-monitor-desc");
  if (monitorDesc) monitorDesc.textContent = dict.monitorDesc;

  const posLabel = document.getElementById("txt-position-label");
  if (posLabel) posLabel.textContent = dict.positionTitle;
  const posDesc = document.getElementById("txt-position-desc");
  if (posDesc) posDesc.textContent = dict.positionDesc;
  const resetPosBtn = document.getElementById("txt-reset-pos-btn");
  if (resetPosBtn) resetPosBtn.textContent = dict.btnResetCenter;

  const shelfDropTitle = document.getElementById("shelf-drop-title");
  if (shelfDropTitle) shelfDropTitle.textContent = dict.shelfDropTitle;
  const shelfDropSubtitle = document.getElementById("shelf-drop-subtitle");
  if (shelfDropSubtitle) shelfDropSubtitle.textContent = dict.shelfDropSubtitle;

  const appFooter = document.getElementById("txt-app-footer");
  if (appFooter) appFooter.textContent = dict.appFooter;

  const noteTitleInput = document.getElementById("note-title-input") as HTMLInputElement | null;
  if (noteTitleInput) noteTitleInput.placeholder = dict.notesTitlePlaceholder;
  const noteBodyInput = document.getElementById("note-body-input") as HTMLTextAreaElement | null;
  if (noteBodyInput) noteBodyInput.placeholder = dict.notesBodyPlaceholder;

  const txtBtnNewNote = document.getElementById("txt-btn-new-note");
  if (txtBtnNewNote) txtBtnNewNote.textContent = dict.notesBtnNew;
  const txtBtnSaveNote = document.getElementById("txt-btn-save-note");
  if (txtBtnSaveNote) txtBtnSaveNote.textContent = dict.notesBtnSave;

  const selectLang = document.getElementById("select-language") as HTMLSelectElement | null;
  if (selectLang) selectLang.value = lang;

  const headerCat = document.getElementById("header-category");
  if (headerCat) {
    if (currentSlide === 1) headerCat.textContent = dict.shelfTitle;
    else if (currentSlide === 2) headerCat.textContent = dict.notesTitle;
    else if (currentSlide === 3) headerCat.textContent = dict.settingsCategory;
    else headerCat.textContent = "";
  }

  updateAllTooltips(dict);
  renderNotesList();
  populateNoteEditor();
}

// ============================================
// Shelf Desktop Stash & Launcher State
// ============================================

interface ShelfItem {
  id: string;
  name: string;
  path: string;
  type: "folder" | "pdf" | "app" | "image" | "audio" | "file";
  icon?: string;
}

let shelfItems: ShelfItem[] = [];
let isDraggingFile = false;
let currentShelfView: "slider" | "grid" = (localStorage.getItem("baobao_shelf_view") as "slider" | "grid") || "slider";

function setShelfView(view: "slider" | "grid"): void {
  currentShelfView = view;
  localStorage.setItem("baobao_shelf_view", view);

  const grid = document.getElementById("shelf-items-grid");
  const btnSlider = document.getElementById("btn-shelf-slider");
  const btnGrid = document.getElementById("btn-shelf-grid");

  if (grid) {
    grid.classList.remove("mode-slider", "mode-grid");
    grid.classList.add(`mode-${view}`);
    grid.style.display = view === "grid" ? "grid" : "flex";
  }
  if (btnSlider) btnSlider.classList.toggle("active", view === "slider");
  if (btnGrid) btnGrid.classList.toggle("active", view === "grid");
}

function loadShelfItems(): void {
  try {
    const saved = localStorage.getItem("baobao_shelf_items");
    if (saved) shelfItems = JSON.parse(saved);
  } catch (_) {
    shelfItems = [];
  }
  renderShelf();

  // Asynchronously fetch real Windows icon for any items missing one
  shelfItems.forEach(async (item) => {
    if (!item.icon) {
      try {
        const extracted = await invoke<string | null>("get_file_icon", { path: item.path });
        if (extracted) {
          item.icon = extracted;
          saveShelfItems();
        }
      } catch (_) {}
    }
  });
}

function saveShelfItems(): void {
  localStorage.setItem("baobao_shelf_items", JSON.stringify(shelfItems));
  renderShelf();
}

async function clearAllShelfItems(): Promise<void> {
  const items = document.querySelectorAll(".shelf-item");
  const shelfZone = document.getElementById("shelf-drop-zone");
  if (items.length === 0) return;

  sfx.playExplode();

  const colors = ["#f43f5e", "#fbbf24", "#38bdf8", "#34d399", "#a855f7", "#ffffff"];
  items.forEach((itemEl, idx) => {
    const el = itemEl as HTMLElement;
    el.style.animationDelay = `${idx * 40}ms`;
    el.classList.add("exploding");

    if (shelfZone) {
      const rect = el.getBoundingClientRect();
      const zoneRect = shelfZone.getBoundingClientRect();
      const cx = rect.left - zoneRect.left + rect.width / 2;
      const cy = rect.top - zoneRect.top + rect.height / 2;

      for (let i = 0; i < 6; i++) {
        const p = document.createElement("div");
        p.className = "explode-particle";
        const angle = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.5;
        const dist = 28 + Math.random() * 32;
        p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
        p.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
        p.style.left = `${cx}px`;
        p.style.top = `${cy}px`;
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.boxShadow = `0 0 6px ${p.style.backgroundColor}`;
        shelfZone.appendChild(p);
        setTimeout(() => p.remove(), 550);
      }
    }
  });

  const totalDuration = items.length * 40 + 460;
  setTimeout(() => {
    shelfItems = [];
    saveShelfItems();
  }, totalDuration);
}

function detectFileType(path: string): "folder" | "pdf" | "app" | "image" | "audio" | "file" {
  const clean = path.replace(/\\/g, "/");
  const parts = clean.split("/");
  const last = parts[parts.length - 1] || "";
  const dotIndex = last.lastIndexOf(".");
  if (dotIndex === -1) {
    return "folder";
  }
  const ext = last.substring(dotIndex + 1).toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["exe", "lnk", "bat", "cmd", "apk", "app", "msi"].includes(ext)) return "app";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg", "ico"].includes(ext)) return "image";
  if (["mp3", "wav", "flac", "m4a", "ogg", "aac"].includes(ext)) return "audio";
  return "file";
}

function getFileIconSvg(type: string): string {
  switch (type) {
    case "folder":
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`;
    case "pdf":
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    case "app":
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg>`;
    case "image":
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    case "audio":
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    default:
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
  }
}

async function addFilesToShelf(paths: string[]): Promise<void> {
  if (!paths || paths.length === 0) return;
  sfx.playPop();
  for (const p of paths) {
    if (!p) continue;
    if (shelfItems.some((item) => item.path === p)) continue;
    const clean = p.replace(/\\/g, "/");
    const parts = clean.split("/");
    const name = parts[parts.length - 1] || p;
    const type = detectFileType(p);

    let realIcon: string | undefined = undefined;
    try {
      const extracted = await invoke<string | null>("get_file_icon", { path: p });
      if (extracted) realIcon = extracted;
    } catch (_) {}

    shelfItems.push({
      id: "item_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      name,
      path: p,
      type,
      icon: realIcon,
    });
  }
  saveShelfItems();
}

function renderShelf(): void {
  const emptyState = document.getElementById("shelf-empty-state");
  const grid = document.getElementById("shelf-items-grid");
  const toggleBar = document.getElementById("shelf-view-toggle");
  if (!emptyState || !grid) return;

  if (shelfItems.length === 0) {
    emptyState.style.display = "flex";
    grid.style.display = "none";
    grid.innerHTML = "";
    if (toggleBar) toggleBar.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  grid.style.display = currentShelfView === "grid" ? "grid" : "flex";
  grid.classList.remove("mode-slider", "mode-grid");
  grid.classList.add(`mode-${currentShelfView}`);
  if (toggleBar) toggleBar.style.display = "flex";

  const btnSlider = document.getElementById("btn-shelf-slider");
  const btnGrid = document.getElementById("btn-shelf-grid");
  if (btnSlider) btnSlider.classList.toggle("active", currentShelfView === "slider");
  if (btnGrid) btnGrid.classList.toggle("active", currentShelfView === "grid");

  grid.innerHTML = "";

  shelfItems.forEach((item) => {
    const el = document.createElement("div");
    el.className = "shelf-item";
    el.dataset.id = item.id;
    el.title = `${item.name}\n${item.path}\nClick to open`;

    const iconContent = item.icon
      ? `<img src="${item.icon}" class="shelf-item-real-icon" alt="" />`
      : getFileIconSvg(item.type);

    el.innerHTML = `
      <button class="shelf-item-remove" title="Remove from shelf">
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <div class="shelf-item-icon ${item.type}">
        ${iconContent}
      </div>
      <span class="shelf-item-name" title="${item.name}">${item.name}</span>
    `;

    el.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;
      if (target.closest(".shelf-item-remove")) return;
      e.stopPropagation();
      sfx.playClick();
      try {
        await invoke("open_file_path", { path: item.path });
      } catch (err) {
        console.error("[Baobao] Failed to open path:", item.path, err);
      }
    });

    const btnRemove = el.querySelector(".shelf-item-remove");
    btnRemove?.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playPop();
      shelfItems = shelfItems.filter((i) => i.id !== item.id);
      saveShelfItems();
    });

    grid.appendChild(el);
  });
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
  time: number; // in seconds
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

let currentSlide = 0; // 0 = Music, 1 = Shelf
let isExpanded = false;
let isPinned = localStorage.getItem("baobao_pinned") === "true";
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

// 3-Minute Idle Track Monitoring
let lastActiveTrackTime = Date.now();
const IDLE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
let isMusicIdle = false;

// Realtime Synced Lyrics State
let activeLyrics: LyricLine[] = [];
let currentLyricIndex = -1;

// Fallback total duration
let totalSeconds = 211;

// ============================================
// Coucou-Style Accurate Real-time Playback Position
// ============================================

/**
 * Calculates accurate realtime position extrapolated from the last SMTC anchor timestamp.
 * Eliminates time-drift and matches playback with 0ms lag.
 */
function getAccuratePosition(): number {
  const now = Date.now();
  const elapsed = currentMedia.is_playing
    ? Math.max(0, (now - (currentMedia.position_at_ms || now)) / 1000)
    : 0;
  const pos = (currentMedia.position_secs || 0) + elapsed;
  const dur = currentMedia.duration_secs || totalSeconds;
  return dur > 0 ? Math.min(pos, dur) : pos;
}

/**
 * Optimistic state transition for instant play/pause button feedback.
 */
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

function getClampedOffset(offset: number, islandWidth: number): number {
  const screenW = window.innerWidth;
  const maxAllowedOffset = Math.max(0, (screenW - islandWidth) / 2 - 16);
  return Math.max(-maxAllowedOffset, Math.min(maxAllowedOffset, offset));
}

function notifyIslandState(): void {
  const hasMiniLyrics = !isExpanded && !isMusicIdle && (currentMedia.is_playing || !!currentMedia.title) && activeLyrics.length > 0 && miniLyricsEnabled;
  const isWide = ((isLyricsOpen || isInFullLyricsMode) && !isMusicIdle) || (isExpanded && currentSlide === 3);

  const islandEl = document.getElementById("island");
  const estimatedW = isExpanded ? (isWide ? 660 : 480) : (hasMiniLyrics ? (currentMiniWidth || 330) : 210);
  const actualW = islandEl ? islandEl.offsetWidth || estimatedW : estimatedW;

  currentOffsetX = getClampedOffset(currentOffsetX, actualW);
  if (islandEl) {
    islandEl.style.setProperty("--island-offset-x", `${currentOffsetX}px`);
  }

  invoke("update_island_state", {
    expanded: isExpanded,
    withLyrics: isWide,
    withMiniLyrics: hasMiniLyrics,
    miniWidth: currentMiniWidth,
    offsetX: currentOffsetX,
  }).catch(() => {});
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
}

// ============================================
// Notes Tab State & Management
// ============================================

const MONTH_NAMES: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  ja: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
};

function formatDateTime(d: Date = new Date(), lang: Lang = currentLang): string {
  const day = d.getDate();
  const m = d.getMonth();
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");

  if (lang === "ja") {
    return `${year}年${m + 1}月${day}日 ${hours}:${mins}`;
  }
  const months = MONTH_NAMES[lang] || MONTH_NAMES.en;
  return `${day} ${months[m]} ${year}, ${hours}:${mins}`;
}

function formatDateOnly(d: Date, lang: Lang = currentLang): string {
  const day = d.getDate();
  const m = d.getMonth();
  const year = d.getFullYear();

  if (lang === "ja") {
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

  // By default: start with right box hidden!
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
    empty.style.padding = "24px 8px";
    empty.style.textAlign = "center";
    empty.style.color = "rgba(255, 255, 255, 0.35)";
    empty.style.fontSize = "10.5px";
    empty.style.lineHeight = "1.5";
    empty.textContent = dict.notesEmpty || "No notes yet";
    container.appendChild(empty);
    return;
  }

  const checkedIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" fill="rgba(16, 185, 129, 0.2)"></circle><polyline points="8 12 11 15 16 9"></polyline></svg>`;
  const uncheckedIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle></svg>`;

  notesList.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card" + (note.id === activeNoteId ? " active" : "") + (note.isCompleted ? " completed" : "");
    card.dataset.id = note.id;

    const dueBadge = note.dueDate && note.dueDate.trim().length > 0
      ? `<span class="note-card-due" title="${dict.tooltipDueDate}">⏱ ${note.dueDate}</span>`
      : "";

    const dateStr = note.createdTimestamp
      ? formatDateTime(new Date(note.createdTimestamp), currentLang)
      : note.createdAt;

    card.innerHTML = `
      <div class="note-card-top">
        <button class="note-check-btn ${note.isCompleted ? "checked" : ""}" title="${note.isCompleted ? dict.tooltipMarkIncomplete : dict.tooltipMarkComplete}">
          ${note.isCompleted ? checkedIcon : uncheckedIcon}
        </button>
        <span class="note-card-title ${note.isCompleted ? "completed" : ""}">${note.title || (dict.untitledNote || "Untitled")}</span>
      </div>
      <div class="note-card-meta">
        <span class="note-card-date">${dateStr}</span>
        ${dueBadge}
      </div>
    `;

    // Clicking card opens the editor
    card.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest(".note-check-btn")) return;
      e.stopPropagation();
      sfx.playClick();
      selectNote(note.id);
    });

    // Clicking check icon toggles completion
    const checkBtn = card.querySelector(".note-check-btn");
    checkBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playPop();
      toggleNoteCompletion(note.id);
    });

    container.appendChild(card);
  });
}

function selectNote(id: string): void {
  activeNoteId = id;
  renderNotesList();
  populateNoteEditor();
  updateEditorVisibility(true);
}

function closeNoteEditor(): void {
  activeNoteId = null;
  renderNotesList();
  updateEditorVisibility(false);
}

function toggleNoteCompletion(id: string): void {
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
  const current = notesList.find((n) => n.id === activeNoteId);

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
    updateEditorCompletionUI(false);
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
  if (!activeNoteId) {
    if (!title && !content) return;
    const newNote: NoteItem = {
      id: "note_" + Date.now(),
      title: title || dict.untitledNote,
      content,
      createdAt: formatDateTime(now, currentLang),
      createdTimestamp: now.getTime(),
      dueDate,
      dueDateIso,
      isCompleted: false,
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
  renderNotesList();
  populateNoteEditor();
  sfx.playPop();
}

function createNewNote(): void {
  sfx.playClick();
  const now = new Date();
  const newNote: NoteItem = {
    id: "note_" + Date.now(),
    title: "",
    content: "",
    createdAt: formatDateTime(now, currentLang),
    createdTimestamp: now.getTime(),
    dueDate: "",
    dueDateIso: "",
    isCompleted: false,
  };
  notesList.unshift(newNote);
  activeNoteId = newNote.id;
  saveNotes();
  renderNotesList();
  populateNoteEditor();
  updateEditorVisibility(true);

  const titleInput = document.getElementById("note-title-input");
  titleInput?.focus();
}

function deleteCurrentNote(): void {
  if (!activeNoteId) return;
  sfx.playClick();
  notesList = notesList.filter((n) => n.id !== activeNoteId);
  activeNoteId = null;
  saveNotes();
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

  const fullCoverImg = document.getElementById("full-lyrics-cover") as HTMLImageElement | null;
  const fullFallback = document.getElementById("full-lyrics-cover-fallback");

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

      if (fullCoverImg) {
        fullCoverImg.src = highResArt;
        fullCoverImg.style.display = "block";
      }
      if (fullFallback) fullFallback.style.display = "none";
      return;
    }
  } catch (err) {
    console.warn("[Baobao] Could not fetch album art:", err);
  }

  // Fallback if not found
  if (coverImg) coverImg.style.display = "none";
  if (fallback) fallback.style.display = "flex";
  if (fullCoverImg) fullCoverImg.style.display = "none";
  if (fullFallback) fullFallback.style.display = "flex";
}

// ============================================
// Realtime Synced Lyrics Fetcher (Lrclib API)
// ============================================

async function fetchRealtimeLyrics(artist: string, title: string): Promise<void> {
  const query = `${artist} - ${title}`.trim();
  if (!query || query === lastLyricsQuery) return;
  lastLyricsQuery = query;

  activeLyrics = [];
  currentLyricIndex = -1;

  const lyricActive = document.getElementById("lyric-active");
  const lyricPrev = document.getElementById("lyric-prev");
  const lyricNext = document.getElementById("lyric-next");

  if (lyricActive) lyricActive.textContent = "Loading lyrics...";
  if (lyricPrev) lyricPrev.textContent = "...";
  if (lyricNext) lyricNext.textContent = "...";

  try {
    const cleanTitle = title.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(cleanTitle || title)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Lyrics not found");
    const data = await res.json();

    if (data.syncedLyrics) {
      const lines = data.syncedLyrics.split("\n");
      const parsed: LyricLine[] = [];

      for (const line of lines) {
        const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/);
        if (match) {
          const min = parseInt(match[1], 10);
          const sec = parseFloat(match[2]);
          const text = match[3].trim();
          if (text) {
            parsed.push({ time: min * 60 + sec, text });
          }
        }
      }

      if (parsed.length > 0) {
        activeLyrics = parsed;
        updateRealtimeLyricsUI(getAccuratePosition());
        if (isInFullLyricsMode) renderInIslandFullLyrics();
        updateMiniLyricsPill();
        notifyIslandState();
        return;
      }
    } else if (data.plainLyrics) {
      const plainLines = data.plainLyrics.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      const dur = currentMedia.duration_secs || totalSeconds;
      const step = dur / Math.max(1, plainLines.length);
      activeLyrics = plainLines.map((text: string, i: number) => ({ time: i * step, text }));
      updateRealtimeLyricsUI(getAccuratePosition());
      if (isInFullLyricsMode) renderInIslandFullLyrics();
      updateMiniLyricsPill();
      notifyIslandState();
      return;
    }
  } catch (err) {
    console.warn("[Baobao] Could not fetch lyrics:", err);
  }

  // Track has no synchronized lyrics -> DO NOT show lyrics from another song!
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

    // Update the mini lyrics displayed in the collapsed pill
    updateMiniLyricsPill();

    // Update in-island full lyrics active line
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
    if (w > 0) measured = Math.max(w, text.length * 8.0);
  }
  // Generous dynamic buffer for Logo (left) + Sound Visualizer (right) so text never cuts off:
  const targetWidth = Math.round(measured + 96);
  return Math.min(600, Math.max(190, targetWidth));
}

/**
 * Updates the mini lyrics line inside the collapsed pill.
 * If music is playing & lyrics exist, shows the current line with a smooth fade/slide.
 */
function updateMiniLyricsPill(): void {
  const island = document.getElementById("island");
  const pillLyricText = document.getElementById("pill-lyric-text");

  const shouldShowMini = !isExpanded && !isMusicIdle && (currentMedia.is_playing || !!currentMedia.title) && activeLyrics.length > 0 && miniLyricsEnabled;

  if (island) {
    island.classList.toggle("with-mini-lyrics", shouldShowMini);
  }

  if (shouldShowMini && pillLyricText && currentLyricIndex >= 0 && currentLyricIndex < activeLyrics.length) {
    const text = activeLyrics[currentLyricIndex].text;
    const dynamicW = measurePillLyricWidth(text);
    currentMiniWidth = dynamicW;
    island?.style.setProperty("--pill-lyrics-width", `${dynamicW}px`);

    if (text !== lastPillLyric) {
      lastPillLyric = text;
      pillLyricText.style.opacity = "0";
      pillLyricText.style.transform = "translateY(3px)";

      setTimeout(() => {
        pillLyricText.textContent = text;
        pillLyricText.style.opacity = "1";
        pillLyricText.style.transform = "translateY(0)";
      }, 120);
    }
  }

  notifyIslandState();
}

// ============================================
// In-Island Full Lyrics Mode Controller
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

    // Click to seek playback directly
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
        line.scrollIntoView({ behavior: "smooth", block: "center" });
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

  // Update timer in full lyrics window if in that mode
  const fullTimer = document.getElementById("full-lyrics-timer");
  if (fullTimer) {
    fullTimer.textContent = `${formatTime(currentSecs)} / ${formatTime(dur)}`;
  }

  // Update realtime lyrics on playback tick
  updateRealtimeLyricsUI(currentSecs);
}

/**
 * Check if the music player should transition to Idle state (e.g. paused/stopped for 3+ minutes).
 */
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
      // Pause visualizer when idle or no music
      document.querySelectorAll(".sound-wave").forEach((w) => w.classList.add("paused"));
      // Close lyrics pane when idle
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
  const displayArtist = payload.artist && payload.artist.trim().length > 0 ? payload.artist : "Shawn Mendes - Shawn Mendes";

  if (titleEl) titleEl.textContent = displayTitle;
  if (artistEl) artistEl.textContent = displayArtist;

  const fullTitle = document.getElementById("full-now-title");
  const fullArtist = document.getElementById("full-now-artist");
  if (fullTitle) fullTitle.textContent = displayTitle;
  if (fullArtist) fullArtist.textContent = displayArtist;

  // Toggle Play / Pause icon & Visualizer Animation (only animate when actually playing a song)
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

  // Duration
  if (typeof payload.duration_secs === "number" && payload.duration_secs > 0) {
    totalSeconds = Math.round(payload.duration_secs);
  }

  // High-performance direct cover art from SMTC (base64) or fallback
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

  // Fetch realtime lyrics if track changed
  const trackKey = `${payload.artist}:${payload.title}`;
  if (hasTitle && trackKey !== lastTrackKey) {
    lastTrackKey = trackKey;
    lastActiveTrackTime = Date.now();
    fetchRealtimeLyrics(payload.artist, payload.title);
  }
}

// ============================================
// Expand & Collapse (Zero-Flicker: NO OS RESIZE)
// ============================================

function expandIsland(): void {
  if (isDraggingIsland) return;
  if (collapseTimeout) {
    clearTimeout(collapseTimeout);
    collapseTimeout = null;
  }
  if (isExpanded) return;
  isExpanded = true;

  const island = document.getElementById("island");
  if (!island) return;

  island.classList.remove("collapsed");
  island.classList.add("expanded");

  updateProgressUI();
  notifyIslandState();
}

function collapseIsland(): void {
  if (isPinned) return;
  if (isDraggingFile) return;
  if (isDraggingIsland) return;
  if (collapseTimeout) clearTimeout(collapseTimeout);

  collapseTimeout = setTimeout(() => {
    isExpanded = false;
    const island = document.getElementById("island");
    if (!island) return;

    island.classList.remove("expanded");
    island.classList.add("collapsed");

    updateMiniLyricsPill();
    notifyIslandState();
  }, 160);
}

// ============================================
// Carousel Navigation (Smooth Directional Glide)
// ============================================

function setSlide(index: number): void {
  const target = (index + 4) % 4;
  if (target === currentSlide) return;

  const goingRight = target > currentSlide;
  currentSlide = target;

  const slideMusic = document.getElementById("slide-music");
  const slideShelf = document.getElementById("slide-shelf");
  const slideNotes = document.getElementById("slide-notes");
  const slideSettings = document.getElementById("slide-settings");
  const headerCat = document.getElementById("header-category");
  const dots = document.querySelectorAll(".carousel-dots .dot");
  const btnSettings = document.getElementById("btn-open-settings");

  const slides = [slideMusic, slideShelf, slideNotes, slideSettings];
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

  const dict = I18N[currentLang] || I18N.en;
  const island = document.getElementById("island");
  island?.classList.toggle("in-notes", currentSlide === 2);
  island?.classList.toggle("in-settings", currentSlide === 3);
  island?.classList.remove("with-editor");
  notifyIslandState();

  if (currentSlide === 0) {
    if (headerCat) headerCat.textContent = "";
    btnSettings?.classList.remove("active");
  } else if (currentSlide === 1) {
    if (headerCat) headerCat.textContent = dict.shelfTitle;
    btnSettings?.classList.remove("active");
  } else if (currentSlide === 2) {
    if (headerCat) headerCat.textContent = dict.notesTitle;
    btnSettings?.classList.remove("active");
  } else if (currentSlide === 3) {
    if (headerCat) headerCat.textContent = dict.settingsCategory;
    btnSettings?.classList.add("active");
  }

  dots.forEach((dot, idx) => {
    if (idx === currentSlide) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
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
      const btn = document.getElementById("btn-switch-monitor");
      if (btn && count <= 1) {
        btn.title = "1 Layar aktif (Klik untuk merapikan ke posisi tengah atas)";
      }
    })
    .catch(() => {});

  // 1-Click Monitor Switcher button
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

  // Dedicated wheel listener on left settings container so wheel scrolls list, NOT tab switch
  const settingsLeftCol = document.querySelector(".settings-col");
  settingsLeftCol?.addEventListener(
    "wheel",
    (e) => {
      e.stopPropagation();
    },
    { passive: true }
  );

  window.addEventListener("contextmenu", (e) => e.preventDefault());

  // --- Normal Island Window Mode ---
  updateClock();
  setInterval(updateClock, 1000);

  // Check music idle state every 2 seconds
  setInterval(checkMusicIdleState, 2000);

  // Smooth 200ms ticker for progress bar and realtime lyrics sync (zero lag)
  setInterval(() => {
    if (currentMedia.is_playing) {
      updateProgressUI();
    }
  }, 200);

  // ============================================
  // Horizontal Dragging & Smooth Hover Controller
  // ============================================
  const island = document.getElementById("island");
  if (island) {
    const initialWidth = island.offsetWidth || 210;
    currentOffsetX = getClampedOffset(currentOffsetX, initialWidth);
    island.style.setProperty("--island-offset-x", `${currentOffsetX}px`);
    invoke("set_window_horizontal_offset", { offsetX: currentOffsetX }).catch(console.error);
    initHorizontalDrag(island);
  }

  window.addEventListener("resize", () => {
    notifyIslandState();
  });

  function initHorizontalDrag(islandEl: HTMLElement): void {
    // Reset Center button in Settings
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

        const txtResetBtn = document.getElementById("txt-reset-pos-btn");
        if (txtResetBtn) {
          const orig = txtResetBtn.innerText;
          txtResetBtn.innerText = "✓ Reset!";
          setTimeout(() => {
            txtResetBtn.innerText = orig;
          }, 1200);
        }
      });
    }

    // Mousedown listener on island
    islandEl.addEventListener("mousedown", (e: MouseEvent) => {
      // Only left click
      if (e.button !== 0) return;

      // Do not initiate drag if user clicked interactive controls
      const target = e.target as HTMLElement | null;
      if (
        target &&
        target.closest("button, input, textarea, a, .sound-wave, .nav-arrow, .carousel-dots, .mode-btn, .theme-swatch, .select-wrapper")
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

      // When moved more than 4px, engage drag mode
      if (!hasMovedSignificantly && Math.abs(deltaX) > 4) {
        hasMovedSignificantly = true;
        isDraggingIsland = true;
        document.body.classList.add("is-dragging-island");
        islandEl.classList.add("is-dragging");

        // Cancel any pending hover expansion
        if (hoverExpandTimer) {
          clearTimeout(hoverExpandTimer);
          hoverExpandTimer = null;
        }
      }

      if (isDraggingIsland) {
        const islandWidth = islandEl.offsetWidth || (isExpanded ? (isLyricsOpen ? 660 : 480) : 210);
        currentOffsetX = getClampedOffset(dragInitialOffset + deltaX, islandWidth);
        islandEl.style.setProperty("--island-offset-x", `${currentOffsetX}px`);
        invoke("set_window_horizontal_offset", { offsetX: currentOffsetX }).catch(console.error);
      }
    }

    function onWindowMouseUp(): void {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);

      isDragMouseDown = false;

      if (isDraggingIsland) {
        isDraggingIsland = false;
        document.body.classList.remove("is-dragging-island");
        islandEl.classList.remove("is-dragging");
        localStorage.setItem("baobao_offset_x", String(currentOffsetX));
      }
    }

    // --- Smooth Hover Expand / Collapse on the Island ---
    islandEl.addEventListener("mouseenter", () => {
      if (isDraggingIsland || isDragMouseDown) return;

      if (hoverExpandTimer) clearTimeout(hoverExpandTimer);
      hoverExpandTimer = setTimeout(() => {
        if (!isDraggingIsland && !isDragMouseDown) {
          expandIsland();
        }
      }, 120);
    });

    islandEl.addEventListener("mouseleave", () => {
      if (hoverExpandTimer) {
        clearTimeout(hoverExpandTimer);
        hoverExpandTimer = null;
      }
      if (isDraggingIsland || isDragMouseDown) return;
      collapseIsland();
    });
  }

  // --- Carousel Navigation Arrows ---
  document.getElementById("btn-prev-slide")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playSlide();
    setSlide(currentSlide - 1);
  });

  document.getElementById("btn-next-slide")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playSlide();
    setSlide(currentSlide + 1);
  });

  // Carousel dots click
  document.querySelectorAll(".carousel-dots .dot").forEach((dot) => {
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playSlide();
      const idx = parseInt((dot as HTMLElement).dataset.index || "0", 10);
      setSlide(idx);
    });
  });

  // --- Header Pin Button (Keep Island Expanded) ---
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

  // --- Header Settings Button ---
  const btnSettings = document.getElementById("btn-open-settings");
  btnSettings?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playClick();
    if (!isExpanded) {
      expandIsland();
      setSlide(3);
    } else {
      if (currentSlide === 3) {
        setSlide(0);
      } else {
        setSlide(3);
      }
    }
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

  // Calendar Date Picker for Deadline
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

  // Enter shortcut for quick saving
  const noteTitleInput = document.getElementById("note-title-input");
  noteTitleInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCurrentNote();
    }
  });

  // Toggle complete in editor header
  document.getElementById("btn-toggle-complete")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();
    if (activeNoteId) {
      toggleNoteCompletion(activeNoteId);
    }
  });

  // Back to list & Close editor buttons
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

  // --- Settings Tab Controls ---
  const savedTheme = localStorage.getItem("baobao_theme") || "gray";
  applyTheme(savedTheme);

  applyLanguage((localStorage.getItem("baobao_lang") as Lang) || "en");

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
      sfx.playPop();
      updateMiniLyricsPill();
    });
  }

  const toggleAutostart = document.getElementById("toggle-autostart") as HTMLInputElement | null;
  if (toggleAutostart) {
    try {
      const isAuto = await invoke<boolean>("get_autostart");
      toggleAutostart.checked = isAuto;
    } catch (_) {
      toggleAutostart.checked = true;
    }
    toggleAutostart.addEventListener("change", async (e) => {
      e.stopPropagation();
      sfx.playPop();
      try {
        await invoke("set_autostart", { enable: toggleAutostart.checked });
      } catch (err) {
        console.warn("Failed to set autostart:", err);
      }
    });
  }

  document.querySelectorAll(".theme-swatch").forEach((swatch) => {
    swatch.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playPop();
      const themeKey = (swatch as HTMLElement).dataset.theme || "gray";
      applyTheme(themeKey);
    });
  });

  // --- Shelf Stash Initialization & Drag-Drop Listeners ---
  loadShelfItems();

  // --- Auto-expand and switch to Shelf tab when file is dragged near Baobao ---
  try {
    listen("tauri://drag-enter", () => {
      isDraggingFile = true;
      expandIsland();
      setSlide(1);
    });
    listen("tauri://drag-over", () => {
      isDraggingFile = true;
      if (!isExpanded) expandIsland();
      if (currentSlide !== 1) setSlide(1);
    });
    listen("tauri://drag-leave", () => {
      isDraggingFile = false;
    });
    listen<{ paths: string[] }>("tauri://drag-drop", async (e) => {
      isDraggingFile = false;
      if (e.payload?.paths && e.payload.paths.length > 0) {
        expandIsland();
        setSlide(1);
        await addFilesToShelf(e.payload.paths);
      }
    });
  } catch (_) {}

  window.addEventListener("dragenter", (e) => {
    e.preventDefault();
    isDraggingFile = true;
    expandIsland();
    setSlide(1);
  });
  window.addEventListener("dragover", (e) => {
    e.preventDefault();
    isDraggingFile = true;
    if (!isExpanded) expandIsland();
    if (currentSlide !== 1) setSlide(1);
  });
  window.addEventListener("dragleave", () => {
    isDraggingFile = false;
  });

  const shelfZone = document.getElementById("shelf-drop-zone");
  const shelfGrid = document.getElementById("shelf-items-grid");
  if (shelfZone) {
    shelfZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      shelfZone.classList.add("dragover");
    });
    shelfZone.addEventListener("dragleave", () => {
      shelfZone.classList.remove("dragover");
    });
    shelfZone.addEventListener("drop", async (e) => {
      e.preventDefault();
      isDraggingFile = false;
      shelfZone.classList.remove("dragover");
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const paths: string[] = [];
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const f = e.dataTransfer.files[i] as unknown as { path?: string; name: string };
          if (f.path) paths.push(f.path);
        }
        if (paths.length > 0) {
          await addFilesToShelf(paths);
        }
      }
    });

    // Clear all button with bouncy explosion animation
    const btnShelfClearAll = document.getElementById("btn-shelf-clear-all");
    btnShelfClearAll?.addEventListener("click", (e) => {
      e.stopPropagation();
      clearAllShelfItems();
    });

    // View mode switch buttons: Slider vs Grid
    const btnShelfSlider = document.getElementById("btn-shelf-slider");
    const btnShelfGrid = document.getElementById("btn-shelf-grid");
    btnShelfSlider?.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playPop();
      setShelfView("slider");
    });
    btnShelfGrid?.addEventListener("click", (e) => {
      e.stopPropagation();
      sfx.playPop();
      setShelfView("grid");
    });

    // Dedicated mouse wheel inside shelf drop zone
    // In slider mode: scroll items horizontally
    // In grid mode: scroll items vertically
    // Stops propagation so island tab carousel is NOT switched!
    shelfZone.addEventListener(
      "wheel",
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!shelfGrid || shelfItems.length === 0) return;

        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (currentShelfView === "slider") {
          shelfGrid.scrollLeft += delta * 1.2;
        } else {
          shelfGrid.scrollTop += delta * 1.2;
        }
      },
      { passive: false }
    );
  }

  // --- Super Smooth Accordion Lyrics Toggle ---
  const btnLyrics = document.getElementById("btn-lyrics");
  const lyricsPane = document.getElementById("lyrics-pane");

  btnLyrics?.addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.playPop();

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

  // --- In-Island Dedicated Full Lyrics Mode Toggles ---
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

  // --- Native Windows Media Playback Controls ---
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

    // Optimistic local state update
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

  // Mouse wheel over volume control group to adjust volume
  volumeGroup?.addEventListener("wheel", (e) => {
    e.stopPropagation();
    e.preventDefault();
    const step = e.deltaY < 0 ? 0.03 : -0.03;
    setMasterVolume(currentVolume + step);
  }, { passive: false });

  // --- Mouse Wheel to Switch Tabs on Island ---
  let lastTabScrollTime = 0;
  const islandEl = document.getElementById("island");
  islandEl?.addEventListener("wheel", (e) => {
    const target = e.target as HTMLElement | null;
    // Don't switch tabs if scrolling over volume, full lyrics list, shelf box, or notes tab
    if (
      target?.closest("#volume-group") ||
      target?.closest("#full-lyrics-stream") ||
      target?.closest("#shelf-drop-zone") ||
      target?.closest("#shelf-items-grid") ||
      target?.closest("#slide-notes") ||
      target?.closest(".notes-container") ||
      isInFullLyricsMode
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastTabScrollTime < 240) return;

    if (e.deltaY > 15 || e.deltaX > 15) {
      lastTabScrollTime = now;
      sfx.playSlide();
      setSlide(currentSlide + 1);
    } else if (e.deltaY < -15 || e.deltaX < -15) {
      lastTabScrollTime = now;
      sfx.playSlide();
      setSlide(currentSlide - 1);
    }
  });

  // ============================================
  // Fetch Initial Media State Immediately on Load
  // ============================================
  try {
    const initialMedia = await invoke<MediaPayload>("get_media_state");
    console.log("[Baobao] Initial media state from Rust:", initialMedia);
    if (initialMedia && (initialMedia.title || initialMedia.is_playing)) {
      currentMedia = initialMedia;
      updateMediaUI(currentMedia);
    } else {
      // No initial track playing -> pause visualizer and enter idle
      document.querySelectorAll(".sound-wave").forEach((w) => w.classList.add("paused"));
      checkMusicIdleState();
    }
  } catch (err) {
    console.warn("[Baobao] Could not fetch initial media state:", err);
  }

  // Listen to event-driven SMTC changes emitted from Rust backend
  listen<MediaPayload>("media-changed", (event) => {
    currentMedia = event.payload;
    console.log("[Baobao] SMTC media-changed received:", currentMedia);
    updateMediaUI(currentMedia);
  });

  // Fallback Polling every 1.5s
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
