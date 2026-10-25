use base64::Engine;
use serde::Serialize;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize};

// ============================================
// Data Structures
// ============================================

/// Payload sent to frontend via Tauri event when media state changes.
#[derive(Clone, Serialize, Debug, Default)]
pub struct MediaPayload {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub is_playing: bool,
    pub position_secs: f64,
    pub position_at_ms: f64,
    pub duration_secs: f64,
    pub cover_data_url: Option<String>,
}

/// Global cached media state so frontend can fetch it immediately upon launch.
static CURRENT_MEDIA: Mutex<Option<MediaPayload>> = Mutex::new(None);

fn now_ms() -> f64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs_f64() * 1000.0)
        .unwrap_or(0.0)
}

/// Windows DateTime (100 ns ticks since 1601) -> Unix milliseconds.
pub fn windows_time_to_unix_ms(universal: i64) -> Option<f64> {
    const UNIX_EPOCH_TICKS: i64 = 116_444_736_000_000_000;
    (universal > 0).then(|| (universal - UNIX_EPOCH_TICKS) as f64 / 10_000.0)
}

// ============================================
// Tauri Commands
// ============================================

/// Return the currently active media state immediately without waiting for an event.
#[tauri::command]
fn get_media_state() -> MediaPayload {
    CURRENT_MEDIA
        .lock()
        .unwrap()
        .clone()
        .unwrap_or_default()
}

/// Toggle Play / Pause on the current Windows active media session.
#[tauri::command]
fn media_toggle_play_pause() -> Result<(), String> {
    #[cfg(windows)]
    {
        use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;
        let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;
        if let Some(session) = find_active_session(&manager) {
            let _ = session.TryTogglePlayPauseAsync();
        }
    }
    Ok(())
}

/// Skip to the next track on Windows active media session.
#[tauri::command]
fn media_next() -> Result<(), String> {
    #[cfg(windows)]
    {
        use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;
        let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;
        if let Some(session) = find_active_session(&manager) {
            let _ = session.TrySkipNextAsync();
        }
    }
    Ok(())
}

/// Skip to the previous track on Windows active media session.
#[tauri::command]
fn media_prev() -> Result<(), String> {
    #[cfg(windows)]
    {
        use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;
        let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;
        if let Some(session) = find_active_session(&manager) {
            let _ = session.TrySkipPreviousAsync();
        }
    }
    Ok(())
}

/// Seek playback to a specific position in seconds (Coucou port).
#[tauri::command]
fn media_seek(position_secs: f64) -> Result<(), String> {
    #[cfg(windows)]
    {
        use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;
        let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;
        if let Some(session) = find_active_session(&manager) {
            let ticks = (position_secs * 10_000_000.0).max(0.0) as i64;
            let _ = session.TryChangePlaybackPositionAsync(ticks);
        }
    }
    Ok(())
}

/// Open or bring Spotify app to front
#[tauri::command]
fn open_spotify() {
    #[cfg(windows)]
    {
        use std::process::Command;
        let _ = Command::new("cmd")
            .args(&["/C", "start", "spotify:"])
            .spawn();
    }
}

/// Open any file, folder, shortcut, or app with default application without console window flashing
#[tauri::command]
fn open_file_path(path: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let _ = Command::new("cmd")
            .args(&["/C", "start", "", &path])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(windows))]
    {
        let _ = std::process::Command::new("xdg-open").arg(&path).spawn();
    }
    Ok(())
}

#[cfg(windows)]
mod icon_extractor {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    #[repr(C)]
    struct SHFILEINFOW {
        h_icon: isize,
        i_icon: i32,
        dw_attributes: u32,
        sz_display_name: [u16; 260],
        sz_type_name: [u16; 80],
    }

    #[repr(C)]
    struct ICONINFO {
        f_icon: i32,
        x_hotspot: u32,
        y_hotspot: u32,
        hbm_mask: isize,
        hbm_color: isize,
    }

    #[repr(C)]
    struct BITMAP {
        bm_type: i32,
        bm_width: i32,
        bm_height: i32,
        bm_width_bytes: i32,
        bm_planes: u16,
        bm_bits_pixel: u16,
        bm_bits: usize,
    }

    #[repr(C)]
    struct BITMAPINFOHEADER {
        bi_size: u32,
        bi_width: i32,
        bi_height: i32,
        bi_planes: u16,
        bi_bit_count: u16,
        bi_compression: u32,
        bi_size_image: u32,
        bi_x_pels_per_meter: i32,
        bi_y_pels_per_meter: i32,
        bi_clr_used: u32,
        bi_clr_important: u32,
    }

    unsafe extern "system" {
        fn SHGetFileInfoW(
            pszPath: *const u16,
            dwFileAttributes: u32,
            psfi: *mut SHFILEINFOW,
            cbFileInfo: u32,
            uFlags: u32,
        ) -> usize;
        fn DestroyIcon(hIcon: isize) -> i32;
        fn GetIconInfo(hIcon: isize, piconinfo: *mut ICONINFO) -> i32;
        fn DeleteObject(hObject: isize) -> i32;
        fn GetObjectW(hgdiobj: isize, cbBuffer: i32, lpvObject: *mut u8) -> i32;
        fn CreateCompatibleDC(hdc: isize) -> isize;
        fn DeleteDC(hdc: isize) -> i32;
        fn GetDIBits(
            hdc: isize,
            hbm: isize,
            start: u32,
            cLines: u32,
            lpvBits: *mut u8,
            lpbmi: *mut BITMAPINFOHEADER,
            usage: u32,
        ) -> i32;
    }

    pub fn get_file_icon_base64(path: &str) -> Option<String> {
        unsafe {
            let mut wide_path: Vec<u16> = OsStr::new(path).encode_wide().collect();
            wide_path.push(0);

            let mut sfi = std::mem::zeroed::<SHFILEINFOW>();
            const SHGFI_ICON: u32 = 0x000000100;
            const SHGFI_LARGEICON: u32 = 0x000000000;

            let res = SHGetFileInfoW(
                wide_path.as_ptr(),
                0,
                &mut sfi,
                std::mem::size_of::<SHFILEINFOW>() as u32,
                SHGFI_ICON | SHGFI_LARGEICON,
            );

            if res == 0 || sfi.h_icon == 0 {
                return None;
            }

            let mut icon_info = std::mem::zeroed::<ICONINFO>();
            if GetIconInfo(sfi.h_icon, &mut icon_info) == 0 {
                DestroyIcon(sfi.h_icon);
                return None;
            }

            let mut bm = std::mem::zeroed::<BITMAP>();
            let bm_res = GetObjectW(
                icon_info.hbm_color,
                std::mem::size_of::<BITMAP>() as i32,
                &mut bm as *mut _ as *mut u8,
            );

            if bm_res == 0 || bm.bm_width <= 0 || bm.bm_height <= 0 {
                if icon_info.hbm_color != 0 { DeleteObject(icon_info.hbm_color); }
                if icon_info.hbm_mask != 0 { DeleteObject(icon_info.hbm_mask); }
                DestroyIcon(sfi.h_icon);
                return None;
            }

            let width = bm.bm_width;
            let height = bm.bm_height;
            let mut bmi = std::mem::zeroed::<BITMAPINFOHEADER>();
            bmi.bi_size = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
            bmi.bi_width = width;
            bmi.bi_height = -height;
            bmi.bi_planes = 1;
            bmi.bi_bit_count = 32;
            bmi.bi_compression = 0;

            let pixel_bytes_len = (width * height * 4) as usize;
            let mut pixels = vec![0u8; pixel_bytes_len];

            let hdc = CreateCompatibleDC(0);
            let lines = GetDIBits(
                hdc,
                icon_info.hbm_color,
                0,
                height as u32,
                pixels.as_mut_ptr(),
                &mut bmi,
                0,
            );
            DeleteDC(hdc);

            if icon_info.hbm_color != 0 { DeleteObject(icon_info.hbm_color); }
            if icon_info.hbm_mask != 0 { DeleteObject(icon_info.hbm_mask); }
            DestroyIcon(sfi.h_icon);

            if lines == 0 {
                return None;
            }

            let mut has_alpha = false;
            for chunk in pixels.chunks(4) {
                if chunk[3] > 0 {
                    has_alpha = true;
                    break;
                }
            }
            if !has_alpha {
                for chunk in pixels.chunks_mut(4) {
                    chunk[3] = 255;
                }
            }

            let file_header_len = 14usize;
            let info_header_len = 40usize;
            let total_file_size = (file_header_len + info_header_len + pixel_bytes_len) as u32;
            let bf_off_bits = (file_header_len + info_header_len) as u32;

            let mut bmp = Vec::with_capacity(total_file_size as usize);
            bmp.extend_from_slice(b"BM");
            bmp.extend_from_slice(&total_file_size.to_le_bytes());
            bmp.extend_from_slice(&0u32.to_le_bytes());
            bmp.extend_from_slice(&bf_off_bits.to_le_bytes());

            bmp.extend_from_slice(&(info_header_len as u32).to_le_bytes());
            bmp.extend_from_slice(&width.to_le_bytes());
            bmp.extend_from_slice(&(-height).to_le_bytes());
            bmp.extend_from_slice(&1u16.to_le_bytes());
            bmp.extend_from_slice(&32u16.to_le_bytes());
            bmp.extend_from_slice(&0u32.to_le_bytes());
            bmp.extend_from_slice(&(pixel_bytes_len as u32).to_le_bytes());
            bmp.extend_from_slice(&0i32.to_le_bytes());
            bmp.extend_from_slice(&0i32.to_le_bytes());
            bmp.extend_from_slice(&0u32.to_le_bytes());
            bmp.extend_from_slice(&0u32.to_le_bytes());
            bmp.extend_from_slice(&pixels);

            use base64::Engine;
            let b64 = base64::engine::general_purpose::STANDARD.encode(&bmp);
            Some(format!("data:image/bmp;base64,{}", b64))
        }
    }
}

/// Extract actual Windows icon of any file, folder, shortcut, or app and return as base64 BMP data URL
#[tauri::command]
fn get_file_icon(path: String) -> Option<String> {
    #[cfg(windows)]
    {
        icon_extractor::get_file_icon_base64(&path)
    }
    #[cfg(not(windows))]
    {
        let _ = path;
        None
    }
}

/// Configure Windows autostart on boot via Registry Run key
#[tauri::command]
fn set_autostart(enable: bool) -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        use std::process::{Command, Stdio};
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        if enable {
            if let Ok(exe_path) = std::env::current_exe() {
                let exe_str = format!("\"{}\"", exe_path.to_string_lossy());
                // Remove legacy keys if exist (silence output)
                let _ = Command::new("reg")
                    .args(&[
                        "delete",
                        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                        "/v",
                        "Baobao",
                        "/f",
                    ])
                    .creation_flags(CREATE_NO_WINDOW)
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .status();

                let _ = Command::new("reg")
                    .args(&[
                        "delete",
                        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run",
                        "/v",
                        "Baobao",
                        "/f",
                    ])
                    .creation_flags(CREATE_NO_WINDOW)
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .status();

                let _ = Command::new("reg")
                    .args(&[
                        "add",
                        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                        "/v",
                        "BaoBao",
                        "/t",
                        "REG_SZ",
                        "/d",
                        &exe_str,
                        "/f",
                    ])
                    .creation_flags(CREATE_NO_WINDOW)
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .status();
            }
        } else {
            let _ = Command::new("reg")
                .args(&[
                    "delete",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    "BaoBao",
                    "/f",
                ])
                .creation_flags(CREATE_NO_WINDOW)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status();
            let _ = Command::new("reg")
                .args(&[
                    "delete",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    "Baobao",
                    "/f",
                ])
                .creation_flags(CREATE_NO_WINDOW)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status();
            let _ = Command::new("reg")
                .args(&[
                    "delete",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run",
                    "/v",
                    "Baobao",
                    "/f",
                ])
                .creation_flags(CREATE_NO_WINDOW)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status();
        }
    }
    Ok(())
}

#[tauri::command]
fn get_autostart() -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let output = Command::new("reg")
            .args(&[
                "query",
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                "/v",
                "BaoBao",
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        if let Ok(out) = output {
            if out.status.success() {
                return true;
            }
        }
        let legacy_output = Command::new("reg")
            .args(&[
                "query",
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                "/v",
                "Baobao",
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        if let Ok(out) = legacy_output {
            return out.status.success();
        }
    }
    false
}



use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};

static IS_EXPANDED: AtomicBool = AtomicBool::new(false);
static WITH_LYRICS: AtomicBool = AtomicBool::new(false);
static WITH_MINI_LYRICS: AtomicBool = AtomicBool::new(false);
static MINI_WIDTH: AtomicU32 = AtomicU32::new(330);

/// Notify Rust of the current island dimensions for the click-through hit-test thread
#[tauri::command]
fn update_island_state(expanded: bool, with_lyrics: bool, with_mini_lyrics: bool, mini_width: Option<f64>) {
    IS_EXPANDED.store(expanded, Ordering::Relaxed);
    WITH_LYRICS.store(with_lyrics, Ordering::Relaxed);
    WITH_MINI_LYRICS.store(with_mini_lyrics, Ordering::Relaxed);
    if let Some(w) = mini_width {
        MINI_WIDTH.store(w.round() as u32, Ordering::Relaxed);
    }
}

#[cfg(windows)]
fn get_audio_endpoint_volume() -> windows::core::Result<windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume> {
    use windows::Win32::System::Com::*;
    use windows::Win32::Media::Audio::*;
    use windows::Win32::Media::Audio::Endpoints::*;

    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let enumerator: IMMDeviceEnumerator = CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)?;
        let device = enumerator.GetDefaultAudioEndpoint(eRender, eMultimedia)?;
        let endpoint_volume: IAudioEndpointVolume = device.Activate(CLSCTX_ALL, None)?;
        Ok(endpoint_volume)
    }
}

#[tauri::command]
fn get_volume() -> Result<f32, String> {
    #[cfg(windows)]
    {
        let ep = get_audio_endpoint_volume().map_err(|e| e.to_string())?;
        let level = unsafe {
            ep.GetMasterVolumeLevelScalar().map_err(|e| e.to_string())?
        };
        Ok(level)
    }
    #[cfg(not(windows))]
    Ok(1.0)
}

#[tauri::command]
fn set_volume(volume: f32) -> Result<(), String> {
    #[cfg(windows)]
    {
        let ep = get_audio_endpoint_volume().map_err(|e| e.to_string())?;
        let clamped = volume.clamp(0.0, 1.0);
        unsafe {
            ep.SetMasterVolumeLevelScalar(clamped, std::ptr::null()).map_err(|e| e.to_string())?;
        }
        Ok(())
    }
    #[cfg(not(windows))]
    Ok(())
}

/// Resize the Tauri window to the given logical width/height,
/// then reposition it to top-center of the current monitor.
#[tauri::command]
fn resize_window(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    let physical_width = (width * scale).round() as u32;
    let physical_height = (height * scale).round() as u32;

    let current_size = window.outer_size().map_err(|e| e.to_string())?;
    if current_size.width == physical_width && current_size.height == physical_height {
        return Ok(());
    }

    let monitor = window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or("No monitor detected")?;

    let monitor_size = monitor.size();
    let monitor_position = monitor.position();

    let x = monitor_position.x + ((monitor_size.width as i32 - physical_width as i32) / 2);
    let y = monitor_position.y;

    #[cfg(windows)]
    {
        if let Ok(hwnd_val) = window.hwnd() {
            unsafe extern "system" {
                fn SetWindowPos(
                    hwnd: *mut std::ffi::c_void,
                    hwnd_insert_after: *mut std::ffi::c_void,
                    x: i32,
                    y: i32,
                    cx: i32,
                    cy: i32,
                    flags: u32,
                ) -> i32;
            }
            let raw_ptr = hwnd_val.0 as *mut std::ffi::c_void;
            unsafe {
                SetWindowPos(
                    raw_ptr,
                    std::ptr::null_mut(),
                    x,
                    y,
                    physical_width as i32,
                    physical_height as i32,
                    0x0314, // SWP_NOACTIVATE | SWP_NOZORDER | SWP_NOOWNERZORDER | SWP_NOCOPYBITS
                );
            }
            return Ok(());
        }
    }

    window
        .set_size(PhysicalSize::new(physical_width, physical_height))
        .map_err(|e| e.to_string())?;

    position_top_center(&window)?;

    Ok(())
}

// ============================================
// Window Positioning
// ============================================

/// Position a window at the horizontal center of the monitor, offset 0px from top.
fn position_top_center(window: &tauri::WebviewWindow) -> Result<(), String> {
    let monitor = window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or("No monitor detected")?;

    let monitor_size = monitor.size();
    let monitor_position = monitor.position();
    let window_size = window.outer_size().map_err(|e| e.to_string())?;

    let x = monitor_position.x + ((monitor_size.width as i32 - window_size.width as i32) / 2);
    let y = monitor_position.y;

    window
        .set_position(PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================
// Windows SMTC (System Media Transport Controls)
// ============================================

#[cfg(windows)]
use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSession,
    GlobalSystemMediaTransportControlsSessionManager,
    GlobalSystemMediaTransportControlsSessionMediaProperties,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus,
};

#[cfg(windows)]
fn find_active_session(
    manager: &GlobalSystemMediaTransportControlsSessionManager,
) -> Option<GlobalSystemMediaTransportControlsSession> {
    manager.GetCurrentSession().ok()
}

/// Extract album art thumbnail directly from Windows SMTC session into a base64 data URL
#[cfg(windows)]
fn extract_thumbnail(props: &GlobalSystemMediaTransportControlsSessionMediaProperties) -> Option<String> {
    use windows::Storage::Streams::DataReader;

    let stream_ref = props.Thumbnail().ok()?;
    let stream = stream_ref.OpenReadAsync().ok()?.get().ok()?;
    let size = stream.Size().unwrap_or(0) as usize;
    if size == 0 || size > 3 * 1024 * 1024 {
        return None;
    }

    let reader = DataReader::CreateDataReader(&stream).ok()?;
    reader.LoadAsync(size as u32).ok()?.get().ok()?;

    let mut bytes = vec![0u8; size];
    reader.ReadBytes(&mut bytes).ok()?;

    let mime = if bytes.starts_with(&[0xff, 0xd8, 0xff]) {
        "image/jpeg"
    } else if bytes.starts_with(&[0x89, 0x50, 0x4e, 0x47]) {
        "image/png"
    } else if bytes.starts_with(b"GIF8") {
        "image/gif"
    } else {
        "image/jpeg"
    };

    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Some(format!("data:{mime};base64,{b64}"))
}

#[cfg(windows)]
fn read_media_snapshot(
    session: &GlobalSystemMediaTransportControlsSession,
    last_art_key: &mut String,
    cached_cover: &mut Option<String>,
) -> Option<MediaPayload> {
    let props = session.TryGetMediaPropertiesAsync().ok()?.get().ok()?;
    let title = props.Title().map(|s| s.to_string()).unwrap_or_default();
    let artist = props.Artist().map(|s| s.to_string()).unwrap_or_default();
    let album = props.AlbumTitle().map(|s| s.to_string()).unwrap_or_default();

    let is_playing = session
        .GetPlaybackInfo()
        .ok()
        .and_then(|info| info.PlaybackStatus().ok())
        .map(|status| status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing)
        .unwrap_or(false);

    let (position_secs, position_at_ms, duration_secs) = session
        .GetTimelineProperties()
        .map(|tl| {
            let start = tl.StartTime().map(|ts| ts.Duration).unwrap_or(0);
            let pos = tl
                .Position()
                .map(|ts| (ts.Duration - start).max(0) as f64 / 10_000_000.0)
                .unwrap_or(0.0);
            let dur = tl
                .EndTime()
                .map(|ts| (ts.Duration - start).max(0) as f64 / 10_000_000.0)
                .unwrap_or(0.0);

            // Coucou formula: Windows DateTime -> Unix milliseconds
            let now = now_ms();
            let updated_at = tl
                .LastUpdatedTime()
                .ok()
                .and_then(|ut| windows_time_to_unix_ms(ut.UniversalTime))
                .filter(|&t| t <= now)
                .unwrap_or(now);

            (pos, updated_at, dur)
        })
        .unwrap_or((0.0, now_ms(), 0.0));

    // Thumbnail caching
    let art_key = format!("{}:{}:{}", artist, album, title);
    if &art_key != last_art_key {
        *last_art_key = art_key;
        *cached_cover = extract_thumbnail(&props);
    }

    Some(MediaPayload {
        title,
        artist,
        album,
        is_playing,
        position_secs,
        position_at_ms,
        duration_secs,
        cover_data_url: cached_cover.clone(),
    })
}

/// Spawn a background thread that syncs with Windows SMTC using event-driven wakeups & bounded fallback.
#[cfg(windows)]
fn start_media_listener(app: AppHandle) {
    use std::sync::mpsc;
    use windows::Foundation::TypedEventHandler;

    thread::spawn(move || {
        let manager = match GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
            Ok(op) => match op.get() {
                Ok(m) => m,
                Err(e) => {
                    eprintln!("[Baobao] Failed to get SMTC session manager: {e}");
                    return;
                }
            },
            Err(e) => {
                eprintln!("[Baobao] Failed to request SMTC session manager: {e}");
                return;
            }
        };

        println!("[Baobao] SMTC event-driven listener started successfully");

        let (tx, rx) = mpsc::channel();

        // 1. Listen for new/changed media sessions (e.g. Spotify opened/closed)
        let _sessions_token = {
            let tx = tx.clone();
            manager
                .SessionsChanged(&TypedEventHandler::new(move |_, _| {
                    let _ = tx.send(());
                    Ok(())
                }))
                .ok()
        };

        let mut last_art_key = String::new();
        let mut cached_cover: Option<String> = None;
        let mut last_payload: Option<MediaPayload> = None;

        loop {
            let session_opt = find_active_session(&manager);

            let current_payload = match &session_opt {
                Some(session) => read_media_snapshot(session, &mut last_art_key, &mut cached_cover),
                None => None,
            };

            let payload = current_payload.unwrap_or_default();

            // Check if state changed significantly
            let state_changed = match &last_payload {
                None => true,
                Some(prev) => {
                    prev.title != payload.title
                        || prev.artist != payload.artist
                        || prev.is_playing != payload.is_playing
                        || (payload.position_secs - prev.position_secs).abs() > 1.5
                        || prev.cover_data_url != payload.cover_data_url
                }
            };

            if state_changed {
                last_payload = Some(payload.clone());
                *CURRENT_MEDIA.lock().unwrap() = Some(payload.clone());
                let _ = app.emit("media-changed", &payload);
            } else {
                // Keep the cache updated with the latest position anchor
                *CURRENT_MEDIA.lock().unwrap() = Some(payload.clone());
            }

            // Bind session change events if session exists
            if let Some(session) = &session_opt {
                let tx_p = tx.clone();
                let _ = session.PlaybackInfoChanged(&TypedEventHandler::new(move |_, _| {
                    let _ = tx_p.send(());
                    Ok(())
                }));

                let tx_t = tx.clone();
                let _ = session.TimelinePropertiesChanged(&TypedEventHandler::new(move |_, _| {
                    let _ = tx_t.send(());
                    Ok(())
                }));

                let tx_m = tx.clone();
                let _ = session.MediaPropertiesChanged(&TypedEventHandler::new(move |_, _| {
                    let _ = tx_m.send(());
                    Ok(())
                }));
            }

            // Wait for SMTC event with a 500ms bounded timeout (ensures seek/pause responds in <=0ms to 500ms max)
            let _ = rx.recv_timeout(Duration::from_millis(500));

            // Drain any pending burst events
            while let Ok(_) = rx.try_recv() {}
        }
    });
}

#[cfg(not(windows))]
fn start_media_listener(_app: AppHandle) {
    eprintln!("[Baobao] SMTC is only supported on Windows");
}

#[cfg(windows)]
fn start_cursor_hit_test(window: tauri::WebviewWindow) {
    #[repr(C)]
    struct POINT {
        x: i32,
        y: i32,
    }
    unsafe extern "system" {
        fn GetCursorPos(lpPoint: *mut POINT) -> i32;
        fn ScreenToClient(hWnd: *mut std::ffi::c_void, lpPoint: *mut POINT) -> i32;
    }

    thread::spawn(move || {
        let hwnd_raw = match window.hwnd() {
            Ok(h) => h.0 as *mut std::ffi::c_void,
            Err(_) => return,
        };

        let mut currently_ignoring = false;

        loop {
            thread::sleep(Duration::from_millis(25));

            let scale = window.scale_factor().unwrap_or(1.0);
            let win_size = window.inner_size().unwrap_or(PhysicalSize::new(960, 260));
            let win_w_logical = win_size.width as f64 / scale;

            let mut pt = POINT { x: 0, y: 0 };
            unsafe {
                if GetCursorPos(&mut pt) == 0 {
                    continue;
                }
                ScreenToClient(hwnd_raw, &mut pt);
            }

            let cx = pt.x as f64 / scale;
            let cy = pt.y as f64 / scale;

            let expanded = IS_EXPANDED.load(Ordering::Relaxed);
            let with_lyrics = WITH_LYRICS.load(Ordering::Relaxed);
            let with_mini = WITH_MINI_LYRICS.load(Ordering::Relaxed);

            let (target_w, target_h) = if expanded {
                if with_lyrics { (660.0, 222.0) } else { (480.0, 222.0) }
            } else {
                if with_mini {
                    let w = MINI_WIDTH.load(Ordering::Relaxed) as f64;
                    (w, 35.0)
                } else {
                    (210.0, 35.0)
                }
            };

            let left = (win_w_logical - target_w) / 2.0;
            let right = left + target_w;
            let margin = 10.0;

            let on_island = cx >= (left - margin)
                && cx <= (right + margin)
                && cy >= 0.0
                && cy <= (target_h + margin);

            if on_island {
                if currently_ignoring {
                    currently_ignoring = false;
                    let _ = window.set_ignore_cursor_events(false);
                }
            } else {
                if !currently_ignoring {
                    currently_ignoring = true;
                    let _ = window.set_ignore_cursor_events(true);
                }
            }
        }
    });
}

#[cfg(not(windows))]
fn start_cursor_hit_test(_window: tauri::WebviewWindow) {}

// ============================================
// Multi-Monitor Support
// ============================================

/// Returns the total number of connected monitors.
#[tauri::command]
fn get_monitors_count(app: AppHandle) -> Result<usize, String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;
    let monitors = window.available_monitors().map_err(|e| e.to_string())?;
    Ok(monitors.len())
}

/// Returns the label of the monitor BaoBao is currently on (e.g. "Monitor 1")
#[tauri::command]
fn get_current_monitor_label(app: AppHandle) -> Result<String, String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;
    let monitors = window.available_monitors().map_err(|e| e.to_string())?;
    let win_pos = window.outer_position().map_err(|e| e.to_string())?;
    let win_size = window.outer_size().map_err(|e| e.to_string())?;
    let center_x = win_pos.x + (win_size.width as i32 / 2);

    let current_idx = monitors.iter().position(|m| {
        let m_x = m.position().x;
        let m_w = m.size().width as i32;
        center_x >= m_x && center_x < (m_x + m_w)
    }).unwrap_or(0);

    Ok(format!("Monitor {}", current_idx + 1))
}

/// Switches BaoBao directly to the next monitor and locks it at top-center.
#[tauri::command]
fn switch_monitor(app: AppHandle) -> Result<String, String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    let monitors = window.available_monitors().map_err(|e| e.to_string())?;
    if monitors.is_empty() {
        return Err("No monitors detected".to_string());
    }

    let win_pos = window.outer_position().map_err(|e| e.to_string())?;
    let win_size = window.outer_size().map_err(|e| e.to_string())?;
    let center_x = win_pos.x + (win_size.width as i32 / 2);

    let current_idx = monitors.iter().position(|m| {
        let m_x = m.position().x;
        let m_w = m.size().width as i32;
        center_x >= m_x && center_x < (m_x + m_w)
    }).unwrap_or(0);

    let next_idx = (current_idx + 1) % monitors.len();
    let target_monitor = &monitors[next_idx];

    let monitor_size = target_monitor.size();
    let monitor_position = target_monitor.position();

    let x = monitor_position.x + ((monitor_size.width as i32 - win_size.width as i32) / 2);
    let y = monitor_position.y;

    #[cfg(windows)]
    {
        if let Ok(hwnd_val) = window.hwnd() {
            unsafe extern "system" {
                fn SetWindowPos(
                    hwnd: *mut std::ffi::c_void,
                    hwnd_insert_after: *mut std::ffi::c_void,
                    x: i32,
                    y: i32,
                    cx: i32,
                    cy: i32,
                    flags: u32,
                ) -> i32;
            }
            let raw_ptr = hwnd_val.0 as *mut std::ffi::c_void;
            unsafe {
                SetWindowPos(
                    raw_ptr,
                    std::ptr::null_mut(),
                    x,
                    y,
                    win_size.width as i32,
                    win_size.height as i32,
                    0x0314, // SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED
                );
            }
            return Ok(format!("Monitor {}", next_idx + 1));
        }
    }

    window.set_position(PhysicalPosition::new(x, y)).map_err(|e| e.to_string())?;
    Ok(format!("Monitor {}", next_idx + 1))
}

// ============================================
// App Entry Point
// ============================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            resize_window,
            get_media_state,
            media_toggle_play_pause,
            media_next,
            media_prev,
            media_seek,
            update_island_state,
            open_spotify,
            get_volume,
            set_volume,
            open_file_path,
            get_file_icon,
            set_autostart,
            get_autostart,
            switch_monitor,
            get_monitors_count,
            get_current_monitor_label
        ])
        .setup(|app| {
            println!("[Baobao] Setup starting...");

            let window = match app.get_webview_window("main") {
                Some(w) => {
                    println!("[Baobao] Main window found");
                    w
                }
                None => {
                    eprintln!("[Baobao] ERROR: Main window not found!");
                    return Ok(());
                }
            };

            // Position at top-center
            match position_top_center(&window) {
                Ok(_) => println!("[Baobao] Window positioned at top-center"),
                Err(e) => eprintln!("[Baobao] WARNING: Could not position window: {e}"),
            }

            // Show window
            match window.show() {
                Ok(_) => println!("[Baobao] Window shown"),
                Err(e) => eprintln!("[Baobao] WARNING: Could not show window: {e}"),
            }

            // Start cursor hit-test thread (Coucou click-through technique)
            start_cursor_hit_test(window);

            // Start background SMTC media listener
            start_media_listener(app.handle().clone());

            // Setup System Tray Icon with Exit context menu
            let show_i = tauri::menu::MenuItem::with_id(app, "show", "Show Baobao", true, None::<&str>)?;
            let exit_i = tauri::menu::MenuItem::with_id(app, "exit", "Exit", true, None::<&str>)?;
            let tray_menu = tauri::menu::Menu::with_items(app, &[&show_i, &exit_i])?;

            let tray_icon = tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png"))
                .ok()
                .or_else(|| app.default_window_icon().cloned());

            if let Some(icon) = tray_icon {
                let _tray = tauri::tray::TrayIconBuilder::with_id("baobao_tray")
                    .icon(icon)
                    .menu(&tray_menu)
                    .show_menu_on_left_click(false)
                    .tooltip("BaoBao")
                    .on_menu_event(|app, event| {
                        match event.id.as_ref() {
                            "show" => {
                                if let Some(w) = app.get_webview_window("main") {
                                    let _ = w.show();
                                    let _ = w.set_focus();
                                }
                            }
                            "exit" => {
                                app.exit(0);
                            }
                            _ => {}
                        }
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let tauri::tray::TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                            let app = tray.app_handle();
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    })
                    .build(app)?;
            }

            // Enable Windows autostart on boot by default
            let _ = set_autostart(true);

            println!("[Baobao] Setup complete!");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Baobao application");
}
