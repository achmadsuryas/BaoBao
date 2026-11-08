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

/// Toggle Play / Pause on the current active media session.
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
    #[cfg(target_os = "macos")]
    {
        let script = r#"
            if application "Spotify" is running then
                tell application "Spotify" to playpause
            else if application "Music" is running then
                tell application "Music" to playpause
            end if
        "#;
        let _ = std::process::Command::new("osascript").args(["-e", script]).output();
    }
    Ok(())
}

/// Skip to the next track on active media session.
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
    #[cfg(target_os = "macos")]
    {
        let script = r#"
            if application "Spotify" is running then
                tell application "Spotify" to next track
            else if application "Music" is running then
                tell application "Music" to next track
            end if
        "#;
        let _ = std::process::Command::new("osascript").args(["-e", script]).output();
    }
    Ok(())
}

/// Skip to the previous track on active media session.
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
    #[cfg(target_os = "macos")]
    {
        let script = r#"
            if application "Spotify" is running then
                tell application "Spotify" to previous track
            else if application "Music" is running then
                tell application "Music" to previous track
            end if
        "#;
        let _ = std::process::Command::new("osascript").args(["-e", script]).output();
    }
    Ok(())
}

/// Seek playback to a specific position in seconds.
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
    #[cfg(target_os = "macos")]
    {
        let script = format!(r#"
            if application "Spotify" is running then
                tell application "Spotify" to set player position to {}
            else if application "Music" is running then
                tell application "Music" to set player position to {}
            end if
        "#, position_secs, position_secs);
        let _ = std::process::Command::new("osascript").args(["-e", &script]).output();
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
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg("-a").arg("Spotify").spawn();
    }
}

/// Resolved metadata from a Windows .lnk shortcut file via COM IShellLinkW (0ms, no PowerShell)
#[cfg(windows)]
#[derive(Default, Debug, Clone)]
struct LnkDetails {
    target_path: String,
    arguments: String,
    working_dir: String,
    icon_path: String,
}

#[cfg(windows)]
fn resolve_lnk_details(path: &str) -> Option<LnkDetails> {
    if !path.to_lowercase().ends_with(".lnk") {
        return None;
    }
    use std::ffi::{c_void, OsStr};
    use std::os::windows::ffi::OsStrExt;
    use windows::core::GUID;
    use windows::Win32::System::Com::{CoInitializeEx, COINIT_APARTMENTTHREADED, COINIT_DISABLE_OLE1DDE};

    #[link(name = "ole32")]
    unsafe extern "system" {
        fn CoCreateInstance(
            rclsid: *const GUID,
            pUnkOuter: *mut c_void,
            dwClsContext: u32,
            riid: *const GUID,
            ppv: *mut *mut c_void,
        ) -> i32;
    }

    const CLSID_SHELL_LINK: GUID = GUID::from_u128(0x00021401_0000_0000_c000_000000000046);
    const IID_ISHELL_LINK_W: GUID = GUID::from_u128(0x000214f9_0000_0000_c000_000000000046);
    const IID_IPERSIST_FILE: GUID = GUID::from_u128(0x0000010b_0000_0000_c000_000000000046);
    const CLSCTX_INPROC_SERVER: u32 = 1;

    fn wide_buf_to_string(buf: &[u16]) -> String {
        let len = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
        String::from_utf16_lossy(&buf[..len]).trim().to_string()
    }

    unsafe {
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);

        let mut psl: *mut c_void = std::ptr::null_mut();
        if CoCreateInstance(
            &CLSID_SHELL_LINK,
            std::ptr::null_mut(),
            CLSCTX_INPROC_SERVER,
            &IID_ISHELL_LINK_W,
            &mut psl,
        ) < 0
            || psl.is_null()
        {
            return None;
        }

        let psl_vtbl = *(psl as *mut *const usize);
        let query_interface: unsafe extern "system" fn(*mut c_void, *const GUID, *mut *mut c_void) -> i32 =
            std::mem::transmute(*psl_vtbl.add(0));
        let release_psl: unsafe extern "system" fn(*mut c_void) -> u32 =
            std::mem::transmute(*psl_vtbl.add(2));

        let mut ppf: *mut c_void = std::ptr::null_mut();
        if query_interface(psl, &IID_IPERSIST_FILE, &mut ppf) < 0 || ppf.is_null() {
            release_psl(psl);
            return None;
        }

        let ppf_vtbl = *(ppf as *mut *const usize);
        let release_ppf: unsafe extern "system" fn(*mut c_void) -> u32 =
            std::mem::transmute(*ppf_vtbl.add(2));
        let load_file: unsafe extern "system" fn(*mut c_void, *const u16, u32) -> i32 =
            std::mem::transmute(*ppf_vtbl.add(5));

        let mut wide_path: Vec<u16> = OsStr::new(path).encode_wide().collect();
        wide_path.push(0);

        let hr = load_file(ppf, wide_path.as_ptr(), 0);
        release_ppf(ppf);

        if hr < 0 {
            release_psl(psl);
            return None;
        }

        let get_path: unsafe extern "system" fn(*mut c_void, *mut u16, i32, *mut c_void, u32) -> i32 =
            std::mem::transmute(*psl_vtbl.add(3));
        let get_working_dir: unsafe extern "system" fn(*mut c_void, *mut u16, i32) -> i32 =
            std::mem::transmute(*psl_vtbl.add(8));
        let get_arguments: unsafe extern "system" fn(*mut c_void, *mut u16, i32) -> i32 =
            std::mem::transmute(*psl_vtbl.add(10));
        let get_icon_loc: unsafe extern "system" fn(*mut c_void, *mut u16, i32, *mut i32) -> i32 =
            std::mem::transmute(*psl_vtbl.add(16));

        let mut target_buf = [0u16; 1024];
        let mut workdir_buf = [0u16; 1024];
        let mut args_buf = [0u16; 1024];
        let mut icon_buf = [0u16; 1024];
        let mut icon_idx: i32 = 0;

        let _ = get_path(psl, target_buf.as_mut_ptr(), 1024, std::ptr::null_mut(), 0);
        let _ = get_working_dir(psl, workdir_buf.as_mut_ptr(), 1024);
        let _ = get_arguments(psl, args_buf.as_mut_ptr(), 1024);
        let _ = get_icon_loc(psl, icon_buf.as_mut_ptr(), 1024, &mut icon_idx);

        release_psl(psl);

        Some(LnkDetails {
            target_path: wide_buf_to_string(&target_buf),
            arguments: wide_buf_to_string(&args_buf),
            working_dir: wide_buf_to_string(&workdir_buf),
            icon_path: wide_buf_to_string(&icon_buf),
        })
    }
}

/// Helper for Squirrel apps (like Discord/Slack) where Update.exe is stored in parent dir
#[cfg(windows)]
fn find_squirrel_app_exe(update_exe_path: &str) -> Option<(String, String)> {
    let p = std::path::Path::new(update_exe_path);
    let file_name = p.file_name()?.to_string_lossy().to_lowercase();
    if file_name != "update.exe" {
        return None;
    }
    let parent = p.parent()?;
    let app_folder_name = parent.file_name()?.to_string_lossy().to_string();
    let expected_exe = format!("{}.exe", app_folder_name);

    if let Ok(entries) = std::fs::read_dir(parent) {
        let mut best_exe: Option<String> = None;
        for entry in entries.flatten() {
            let ep = entry.path();
            if ep.is_dir() {
                if let Some(dn) = ep.file_name().map(|s| s.to_string_lossy().to_string()) {
                    if dn.starts_with("app-") {
                        let candidate = ep.join(&expected_exe);
                        if candidate.exists() {
                            best_exe = Some(candidate.to_string_lossy().to_string());
                        }
                    }
                }
            }
        }
        if let Some(exe_full) = best_exe {
            return Some((app_folder_name, exe_full));
        }
    }
    Some((app_folder_name, String::new()))
}

/// Open any file, folder, shortcut, or app with default application (non-blocking)
#[tauri::command]
async fn open_file_path(path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(windows)]
        {
            use std::ffi::OsStr;
            use std::os::windows::ffi::OsStrExt;
            use std::path::Path;
            use windows::Win32::System::Com::{CoInitializeEx, COINIT_APARTMENTTHREADED, COINIT_DISABLE_OLE1DDE};

            unsafe extern "system" {
                fn ShellExecuteW(
                    hwnd: isize,
                    lpOperation: *const u16,
                    lpFile: *const u16,
                    lpParameters: *const u16,
                    lpDirectory: *const u16,
                    nShowCmd: i32,
                ) -> isize;
            }

            fn to_wide(s: &str) -> Vec<u16> {
                let mut v: Vec<u16> = OsStr::new(s).encode_wide().collect();
                v.push(0);
                v
            }

            unsafe {
                let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);
            }

            let clean_path = path.trim_matches('"').to_string();
            let mut target_file = clean_path.clone();
            let mut target_args = String::new();
            let mut target_dir = Path::new(&clean_path)
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            if clean_path.to_lowercase().ends_with(".lnk") {
                if let Some(details) = resolve_lnk_details(&clean_path) {
                    if !details.target_path.is_empty() && Path::new(&details.target_path).exists() {
                        target_file = details.target_path.clone();
                        target_args = details.arguments;
                        if !details.working_dir.is_empty() && Path::new(&details.working_dir).is_dir() {
                            target_dir = details.working_dir;
                        } else {
                            target_dir = Path::new(&target_file)
                                .parent()
                                .map(|p| p.to_string_lossy().to_string())
                                .unwrap_or_default();
                        }
                    }
                }
            } else if let Some((app_name, _)) = find_squirrel_app_exe(&clean_path) {
                // If the saved path is a Squirrel Update.exe (e.g. Discord\Update.exe), pass --processStart
                target_args = format!("--processStart {}.exe", app_name);
            }

            let wide_file = to_wide(&target_file);
            let wide_args = to_wide(&target_args);
            let wide_dir = to_wide(&target_dir);
            let wide_open = to_wide("open");
            const SW_SHOWNORMAL: i32 = 1;

            let res = unsafe {
                let r1 = ShellExecuteW(
                    0,
                    std::ptr::null(),
                    wide_file.as_ptr(),
                    if target_args.is_empty() { std::ptr::null() } else { wide_args.as_ptr() },
                    if target_dir.is_empty() { std::ptr::null() } else { wide_dir.as_ptr() },
                    SW_SHOWNORMAL,
                );
                if r1 <= 32 {
                    ShellExecuteW(
                        0,
                        wide_open.as_ptr(),
                        wide_file.as_ptr(),
                        if target_args.is_empty() { std::ptr::null() } else { wide_args.as_ptr() },
                        if target_dir.is_empty() { std::ptr::null() } else { wide_dir.as_ptr() },
                        SW_SHOWNORMAL,
                    )
                } else {
                    r1
                }
            };

            if res <= 32 {
                use std::process::Command;
                let _ = Command::new("explorer")
                    .arg(&clean_path)
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
        }
        #[cfg(target_os = "macos")]
        {
            let _ = std::process::Command::new("open").arg(&path).spawn();
        }
        #[cfg(all(not(windows), not(target_os = "macos")))]
        {
            let _ = std::process::Command::new("xdg-open").arg(&path).spawn();
        }
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[derive(Clone, Serialize, Debug, Default)]
pub struct FileInfoPayload {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub is_dir: bool,
    pub ext: String,
    pub icon: Option<String>,
}

#[tauri::command]
async fn get_file_info(path: String) -> FileInfoPayload {
    tauri::async_runtime::spawn_blocking(move || {
        let clean = path.trim_matches('"').to_string();
        let p = std::path::Path::new(&clean);
        let mut raw_name = p
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| clean.clone());

        let mut is_dir = false;
        let mut size_bytes = 0u64;
        let mut inspect_path = clean.clone();
        let mut custom_icon_source: Option<String> = None;
        let is_lnk = clean.to_lowercase().ends_with(".lnk");

        #[cfg(windows)]
        {
            if is_lnk {
                if let Some(details) = resolve_lnk_details(&clean) {
                    if !details.target_path.is_empty() && std::path::Path::new(&details.target_path).exists() {
                        inspect_path = details.target_path.clone();
                        if let Some((_, real_exe)) = find_squirrel_app_exe(&inspect_path) {
                            if !real_exe.is_empty() {
                                custom_icon_source = Some(real_exe);
                            }
                        }
                    }
                    if custom_icon_source.is_none()
                        && !details.icon_path.is_empty()
                        && std::path::Path::new(&details.icon_path).exists()
                    {
                        custom_icon_source = Some(details.icon_path);
                    }
                }
            } else if let Some((app_name, real_exe)) = find_squirrel_app_exe(&clean) {
                raw_name = app_name;
                if !real_exe.is_empty() {
                    custom_icon_source = Some(real_exe);
                }
            }
        }

        let eff_p = std::path::Path::new(&inspect_path);
        if let Ok(meta) = std::fs::metadata(eff_p).or_else(|_| std::fs::metadata(p)) {
            is_dir = meta.is_dir();
            size_bytes = meta.len();
        }

        let ext = if is_dir {
            "FOLDER".to_string()
        } else if is_lnk && inspect_path == clean {
            // UWP / Shell shortcut without a direct disk target path
            "APP".to_string()
        } else {
            eff_p
                .extension()
                .or_else(|| p.extension())
                .map(|e| e.to_string_lossy().to_uppercase())
                .unwrap_or_else(|| "FILE".to_string())
        };

        #[cfg(windows)]
        let icon = custom_icon_source
            .as_deref()
            .and_then(icon_extractor::get_file_icon_base64)
            .or_else(|| {
                if inspect_path != clean {
                    icon_extractor::get_file_icon_base64(&inspect_path)
                } else {
                    None
                }
            })
            .or_else(|| icon_extractor::get_file_icon_base64(&clean));
        #[cfg(not(windows))]
        let icon = None;

        // Keep `clean` so .lnk files preserve their launch arguments & working directory
        FileInfoPayload {
            path: clean,
            name: raw_name,
            size_bytes,
            is_dir,
            ext,
            icon,
        }
    })
    .await
    .unwrap_or_default()
}

/// Native file picker dialog for the '+' button in File Tray (non-blocking, instant Win32 GetOpenFileNameW)
#[tauri::command]
async fn pick_files_dialog(window: tauri::WebviewWindow) -> Vec<String> {
    IS_MODAL_OPEN.store(true, Ordering::SeqCst);
    let _ = window.set_ignore_cursor_events(true);
    #[cfg(windows)]
    let hwnd_val = window.hwnd().ok().map(|h| h.0 as isize).unwrap_or(0);
    #[cfg(windows)]
    set_hwnd_modal_passthrough(hwnd_val, true);

    let result = tauri::async_runtime::spawn_blocking(move || {
        #[cfg(windows)]
        {
            use std::ffi::{c_void, OsStr};
            use std::os::windows::ffi::OsStrExt;
            use windows::Win32::System::Com::{CoInitializeEx, COINIT_APARTMENTTHREADED, COINIT_DISABLE_OLE1DDE};

            #[repr(C)]
            struct OPENFILENAMEW {
                l_struct_size: u32,
                hwnd_owner: isize,
                h_instance: isize,
                lpstr_filter: *const u16,
                lpstr_custom_filter: *mut u16,
                n_max_cust_filter: u32,
                n_filter_index: u32,
                lpstr_file: *mut u16,
                n_max_file: u32,
                lpstr_file_title: *mut u16,
                n_max_file_title: u32,
                lpstr_initial_dir: *const u16,
                lpstr_title: *const u16,
                flags: u32,
                n_file_offset: u16,
                n_file_extension: u16,
                lpstr_def_ext: *const u16,
                l_cust_data: isize,
                lpfn_hook: isize,
                lp_template_name: *const u16,
                pv_reserved: *mut c_void,
                dw_reserved: u32,
                flags_ex: u32,
            }

            #[link(name = "comdlg32")]
            unsafe extern "system" {
                fn GetOpenFileNameW(lpofn: *mut OPENFILENAMEW) -> i32;
            }

            unsafe extern "system" {
                fn CreateWindowExW(
                    dwExStyle: u32,
                    lpClassName: *const u16,
                    lpWindowName: *const u16,
                    dwStyle: u32,
                    x: i32,
                    y: i32,
                    nWidth: i32,
                    nHeight: i32,
                    hWndParent: isize,
                    hMenu: isize,
                    hInstance: isize,
                    lpParam: *mut c_void,
                ) -> isize;
                fn DestroyWindow(hWnd: isize) -> i32;
                fn SetForegroundWindow(hWnd: isize) -> i32;
                fn GetSystemMetrics(nIndex: i32) -> i32;
            }

            unsafe {
                let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);

                let screen_w = GetSystemMetrics(0);
                let screen_h = GetSystemMetrics(1);
                let cls: Vec<u16> = OsStr::new("STATIC\0").encode_wide().collect();
                // Create a tiny invisible TopMost owner on THIS thread so the dialog opens in front and centered
                let owner_hwnd = CreateWindowExW(
                    0x00000008 | 0x00000080, // WS_EX_TOPMOST | WS_EX_TOOLWINDOW
                    cls.as_ptr(),
                    cls.as_ptr(),
                    0x80000000, // WS_POPUP
                    (screen_w / 2 - 360).max(40),
                    (screen_h / 2 - 240).max(80),
                    1,
                    1,
                    0,
                    0,
                    0,
                    std::ptr::null_mut(),
                );
                if owner_hwnd != 0 {
                    let _ = SetForegroundWindow(owner_hwnd);
                }

                let filter: Vec<u16> = OsStr::new("All Files (*.*)\0*.*\0\0").encode_wide().collect();
                let title: Vec<u16> = OsStr::new("Select files or apps to add to BaoBao Tray\0")
                    .encode_wide()
                    .collect();
                let mut file_buf = vec![0u16; 32768];

                const OFN_NOCHANGEDIR: u32 = 0x00000008;
                const OFN_ALLOWMULTISELECT: u32 = 0x00000200;
                const OFN_PATHMUSTEXIST: u32 = 0x00000800;
                const OFN_FILEMUSTEXIST: u32 = 0x00001000;
                const OFN_EXPLORER: u32 = 0x00080000;
                const OFN_NODEREFERENCELINKS: u32 = 0x00100000;

                let mut ofn: OPENFILENAMEW = std::mem::zeroed();
                ofn.l_struct_size = std::mem::size_of::<OPENFILENAMEW>() as u32;
                ofn.hwnd_owner = owner_hwnd;
                ofn.lpstr_filter = filter.as_ptr();
                ofn.n_filter_index = 1;
                ofn.lpstr_file = file_buf.as_mut_ptr();
                ofn.n_max_file = file_buf.len() as u32;
                ofn.lpstr_title = title.as_ptr();
                ofn.flags = OFN_EXPLORER
                    | OFN_ALLOWMULTISELECT
                    | OFN_FILEMUSTEXIST
                    | OFN_PATHMUSTEXIST
                    | OFN_NOCHANGEDIR
                    | OFN_NODEREFERENCELINKS;

                let ok = GetOpenFileNameW(&mut ofn);
                if owner_hwnd != 0 {
                    let _ = DestroyWindow(owner_hwnd);
                }

                if ok == 0 {
                    return Vec::new();
                }

                let mut parts: Vec<String> = Vec::new();
                let mut start = 0usize;
                while start < file_buf.len() {
                    let mut end = start;
                    while end < file_buf.len() && file_buf[end] != 0 {
                        end += 1;
                    }
                    if end == start {
                        break;
                    }
                    parts.push(String::from_utf16_lossy(&file_buf[start..end]));
                    start = end + 1;
                }

                if parts.len() == 1 {
                    return vec![parts.remove(0)];
                } else if parts.len() > 1 {
                    let dir = std::path::PathBuf::from(&parts[0]);
                    return parts[1..]
                        .iter()
                        .map(|name| dir.join(name).to_string_lossy().to_string())
                        .collect();
                }
                Vec::new()
            }
        }
        #[cfg(target_os = "macos")]
        {
            use std::process::Command;
            let script = r#"
                set chosenFiles to choose file with prompt "Select files to add to BaoBao Tray" with multiple selections allowed
                set pathList to ""
                repeat with aFile in chosenFiles
                    set pathList to pathList & (POSIX path of aFile) & linefeed
                end repeat
                return pathList
            "#;
            if let Ok(out) = Command::new("osascript").args(["-e", script]).output() {
                let text = String::from_utf8_lossy(&out.stdout);
                return text
                    .lines()
                    .map(|l| l.trim().to_string())
                    .filter(|l| !l.is_empty())
                    .collect();
            }
            Vec::new()
        }
        #[cfg(not(any(windows, target_os = "macos")))]
        {
            Vec::new()
        }
    })
    .await
    .unwrap_or_default();

    IS_MODAL_OPEN.store(false, Ordering::SeqCst);
    #[cfg(windows)]
    set_hwnd_modal_passthrough(hwnd_val, false);
    result
}

/// Cross-platform native color picker fallback (non-blocking, instant Win32 ChooseColorW / macOS choose color)
#[tauri::command]
async fn pick_native_color(window: tauri::WebviewWindow, initial_hex: Option<String>) -> Option<String> {
    IS_MODAL_OPEN.store(true, Ordering::SeqCst);
    let _ = window.set_ignore_cursor_events(true);
    #[cfg(windows)]
    let hwnd_val = window.hwnd().ok().map(|h| h.0 as isize).unwrap_or(0);
    #[cfg(windows)]
    set_hwnd_modal_passthrough(hwnd_val, true);

    let result = tauri::async_runtime::spawn_blocking(move || {
        #[cfg(target_os = "macos")]
        {
            use std::process::Command;
            let hex = initial_hex.unwrap_or_else(|| "#3b82f6".to_string());
            let clean = hex.trim_start_matches('#');
            let (r, g, b) = if clean.len() == 6 {
                let r = u16::from_str_radix(&clean[0..2], 16).unwrap_or(59) * 257;
                let g = u16::from_str_radix(&clean[2..4], 16).unwrap_or(130) * 257;
                let b = u16::from_str_radix(&clean[4..6], 16).unwrap_or(246) * 257;
                (r, g, b)
            } else {
                (15163, 33410, 63222)
            };
            let script = format!(
                "set c to choose color default color {{{}, {}, {}}}\nreturn (item 1 of c) & \",\" & (item 2 of c) & \",\" & (item 3 of c)",
                r, g, b
            );
            if let Ok(out) = Command::new("osascript").args(["-e", &script]).output() {
                if out.status.success() {
                    let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    let parts: Vec<&str> = s.split(',').collect();
                    if parts.len() == 3 {
                        let r8 = (parts[0].trim().parse::<u32>().unwrap_or(0) / 257).min(255);
                        let g8 = (parts[1].trim().parse::<u32>().unwrap_or(0) / 257).min(255);
                        let b8 = (parts[2].trim().parse::<u32>().unwrap_or(0) / 257).min(255);
                        return Some(format!("#{:02x}{:02x}{:02x}", r8, g8, b8));
                    }
                }
            }
            None
        }
        #[cfg(windows)]
        {
            use std::ffi::{c_void, OsStr};
            use std::os::windows::ffi::OsStrExt;

            #[repr(C)]
            struct CHOOSECOLORW {
                l_struct_size: u32,
                hwnd_owner: isize,
                h_instance: isize,
                rgb_result: u32,
                lp_cust_colors: *mut u32,
                flags: u32,
                l_cust_data: isize,
                lpfn_hook: isize,
                lp_template_name: *const u16,
            }

            #[link(name = "comdlg32")]
            unsafe extern "system" {
                fn ChooseColorW(lpcc: *mut CHOOSECOLORW) -> i32;
            }

            unsafe extern "system" {
                fn CreateWindowExW(
                    dwExStyle: u32,
                    lpClassName: *const u16,
                    lpWindowName: *const u16,
                    dwStyle: u32,
                    x: i32,
                    y: i32,
                    nWidth: i32,
                    nHeight: i32,
                    hWndParent: isize,
                    hMenu: isize,
                    hInstance: isize,
                    lpParam: *mut c_void,
                ) -> isize;
                fn DestroyWindow(hWnd: isize) -> i32;
                fn SetForegroundWindow(hWnd: isize) -> i32;
                fn GetSystemMetrics(nIndex: i32) -> i32;
            }

            let hex = initial_hex.unwrap_or_else(|| "#3b82f6".to_string());
            let clean = hex.trim_start_matches('#');
            let (r, g, b) = if clean.len() == 6 {
                let r = u32::from_str_radix(&clean[0..2], 16).unwrap_or(59);
                let g = u32::from_str_radix(&clean[2..4], 16).unwrap_or(130);
                let b = u32::from_str_radix(&clean[4..6], 16).unwrap_or(246);
                (r, g, b)
            } else {
                (59, 130, 246)
            };

            unsafe {
                let screen_w = GetSystemMetrics(0);
                let screen_h = GetSystemMetrics(1);
                let cls: Vec<u16> = OsStr::new("STATIC\0").encode_wide().collect();
                let owner_hwnd = CreateWindowExW(
                    0x00000008 | 0x00000080,
                    cls.as_ptr(),
                    cls.as_ptr(),
                    0x80000000,
                    (screen_w / 2 - 220).max(40),
                    (screen_h / 2 - 200).max(80),
                    1,
                    1,
                    0,
                    0,
                    0,
                    std::ptr::null_mut(),
                );
                if owner_hwnd != 0 {
                    let _ = SetForegroundWindow(owner_hwnd);
                }

                let mut cust_colors = [0x00FFFFFFu32; 16];
                let mut cc: CHOOSECOLORW = std::mem::zeroed();
                cc.l_struct_size = std::mem::size_of::<CHOOSECOLORW>() as u32;
                cc.hwnd_owner = owner_hwnd;
                cc.rgb_result = r | (g << 8) | (b << 16);
                cc.lp_cust_colors = cust_colors.as_mut_ptr();
                cc.flags = 0x00000001 | 0x00000002 | 0x00000100; // CC_RGBINIT | CC_FULLOPEN | CC_ANYCOLOR

                let ok = ChooseColorW(&mut cc);
                if owner_hwnd != 0 {
                    let _ = DestroyWindow(owner_hwnd);
                }
                if ok != 0 {
                    let cr = cc.rgb_result & 0xFF;
                    let cg = (cc.rgb_result >> 8) & 0xFF;
                    let cb = (cc.rgb_result >> 16) & 0xFF;
                    return Some(format!("#{:02x}{:02x}{:02x}", cr, cg, cb));
                }
                None
            }
        }
        #[cfg(not(any(windows, target_os = "macos")))]
        {
            let _ = initial_hex;
            None
        }
    })
    .await
    .unwrap_or(None);

    IS_MODAL_OPEN.store(false, Ordering::SeqCst);
    #[cfg(windows)]
    set_hwnd_modal_passthrough(hwnd_val, false);
    result
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
            use windows::Win32::System::Com::{CoInitializeEx, COINIT_APARTMENTTHREADED, COINIT_DISABLE_OLE1DDE};
            let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);

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
async fn get_file_icon(path: String) -> Option<String> {
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(windows)]
        {
            icon_extractor::get_file_icon_base64(&path)
        }
        #[cfg(not(windows))]
        {
            let _ = path;
            None
        }
    })
    .await
    .unwrap_or(None)
}

/// Configure Windows autostart on boot via Registry Run key
#[tauri::command]
fn set_autostart(enable: bool) -> Result<(), String> {
    AUTOSTART_ENABLED.store(enable, Ordering::Relaxed);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        use std::process::{Command, Stdio};
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        if enable {
            #[cfg(debug_assertions)]
            {
                println!("[Baobao] Skipping autostart registration for debug/dev binary");
            }
            #[cfg(not(debug_assertions))]
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
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let app_path = std::env::current_exe()
            .ok()
            .and_then(|p| {
                let mut curr = p.as_path();
                while let Some(parent) = curr.parent() {
                    if curr.extension().and_then(|s| s.to_str()) == Some("app") {
                        return Some(curr.to_string_lossy().to_string());
                    }
                    curr = parent;
                }
                Some(p.to_string_lossy().to_string())
            })
            .unwrap_or_else(|| "/Applications/BaoBao.app".to_string());

        if enable {
            let script = format!(
                r#"tell application "System Events"
                    if not (exists login item "BaoBao") then
                        make new login item at end with properties {{name:"BaoBao", path:"{}", hidden:false}}
                    end if
                end tell"#,
                app_path
            );
            let _ = Command::new("osascript").args(["-e", &script]).output();
        } else {
            let script = r#"tell application "System Events"
                if exists login item "BaoBao" then
                    delete login item "BaoBao"
                end if
            end tell"#;
            let _ = Command::new("osascript").args(["-e", script]).output();
        }
    }
    Ok(())
}

#[tauri::command]
fn get_autostart() -> bool {
    #[cfg(debug_assertions)]
    {
        return AUTOSTART_ENABLED.load(Ordering::Relaxed);
    }
    #[cfg(not(debug_assertions))]
    {
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
        #[cfg(target_os = "macos")]
        {
            use std::process::Command;
            let script = r#"tell application "System Events" to (exists login item "BaoBao") as string"#;
            if let Ok(out) = Command::new("osascript").args(["-e", script]).output() {
                let res = String::from_utf8_lossy(&out.stdout).trim().to_lowercase();
                if res == "true" {
                    return true;
                }
            }
        }
        AUTOSTART_ENABLED.load(Ordering::Relaxed)
    }
}



use std::sync::atomic::{AtomicBool, AtomicI32, AtomicU32, AtomicU64, Ordering};

static AUTOSTART_ENABLED: AtomicBool = AtomicBool::new(true);
static IS_EXPANDED: AtomicBool = AtomicBool::new(false);
static WITH_LYRICS: AtomicBool = AtomicBool::new(false);
static WITH_MINI_LYRICS: AtomicBool = AtomicBool::new(false);
static IS_SETTINGS_OPEN: AtomicBool = AtomicBool::new(false);
static IS_MODAL_OPEN: AtomicBool = AtomicBool::new(false);
static MINI_WIDTH: AtomicU32 = AtomicU32::new(330);
static ISLAND_OFFSET_X: AtomicI32 = AtomicI32::new(0);
static SETTINGS_OFFSET_X: AtomicI32 = AtomicI32::new(0);
static SETTINGS_OFFSET_Y: AtomicI32 = AtomicI32::new(0);
static GLOBAL_HOTKEY_VK: AtomicU32 = AtomicU32::new(0xC0); // VK_OEM_3 (` ~)
static IS_HOTKEY_DOWN: AtomicBool = AtomicBool::new(false);
static LAST_TOGGLE_MS: AtomicU64 = AtomicU64::new(0);

/// Directly toggle click-through (WS_EX_TRANSPARENT) and Z-order (NOTOPMOST/TOPMOST) on Windows
/// so modal dialogs (file picker / color picker) are never covered or blocked by the overlay window.
#[cfg(windows)]
fn set_hwnd_modal_passthrough(hwnd_val: isize, modal_open: bool) {
    if hwnd_val == 0 {
        return;
    }
    unsafe extern "system" {
        fn GetWindowLongW(hWnd: isize, nIndex: i32) -> i32;
        fn SetWindowLongW(hWnd: isize, nIndex: i32, dwNewLong: i32) -> i32;
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
    const GWL_EXSTYLE: i32 = -20;
    const WS_EX_TRANSPARENT: i32 = 0x00000020;
    const WS_EX_LAYERED: i32 = 0x00080000;
    const SWP_NOSIZE: u32 = 0x0001;
    const SWP_NOMOVE: u32 = 0x0002;
    const SWP_NOACTIVATE: u32 = 0x0010;

    let raw_ptr = hwnd_val as *mut std::ffi::c_void;
    let hwnd_topmost = (-1isize) as *mut std::ffi::c_void;
    let hwnd_notopmost = (-2isize) as *mut std::ffi::c_void;

    unsafe {
        let ex_style = GetWindowLongW(hwnd_val, GWL_EXSTYLE);
        if modal_open {
            SetWindowLongW(hwnd_val, GWL_EXSTYLE, ex_style | WS_EX_LAYERED | WS_EX_TRANSPARENT);
            SetWindowPos(
                raw_ptr,
                hwnd_notopmost,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            );
        } else {
            SetWindowPos(
                raw_ptr,
                hwnd_topmost,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            );
        }
    }
}

fn perform_toggle(window: &tauri::WebviewWindow) {
    let now = now_ms() as u64;
    let prev = LAST_TOGGLE_MS.load(Ordering::Relaxed);
    if now.saturating_sub(prev) < 280 {
        return; // debounce 280ms to avoid flick and chatter
    }
    LAST_TOGGLE_MS.store(now, Ordering::Relaxed);

    if window.is_visible().unwrap_or(true) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Configure the global shortcut virtual key code (default: 0xC0 for `)
#[tauri::command]
fn set_toggle_shortcut(vk_code: u32) {
    GLOBAL_HOTKEY_VK.store(vk_code, Ordering::Relaxed);
}

/// Toggle visibility of the main window
#[tauri::command]
fn toggle_window_visibility(window: tauri::WebviewWindow) {
    perform_toggle(&window);
}

/// Notify Rust of the current island dimensions and horizontal offset for the click-through hit-test thread
#[tauri::command]
fn update_island_state(
    expanded: bool,
    with_lyrics: bool,
    with_mini_lyrics: bool,
    mini_width: Option<f64>,
    offset_x: Option<f64>,
    settings_open: Option<bool>,
    settings_offset_x: Option<f64>,
    settings_offset_y: Option<f64>,
) {
    IS_EXPANDED.store(expanded, Ordering::Relaxed);
    WITH_LYRICS.store(with_lyrics, Ordering::Relaxed);
    WITH_MINI_LYRICS.store(with_mini_lyrics, Ordering::Relaxed);
    if let Some(s_open) = settings_open {
        IS_SETTINGS_OPEN.store(s_open, Ordering::Relaxed);
    }
    if let Some(w) = mini_width {
        MINI_WIDTH.store(w.round() as u32, Ordering::Relaxed);
    }
    if let Some(off) = offset_x {
        ISLAND_OFFSET_X.store(off.round() as i32, Ordering::Relaxed);
    }
    if let Some(sx) = settings_offset_x {
        SETTINGS_OFFSET_X.store(sx.round() as i32, Ordering::Relaxed);
    }
    if let Some(sy) = settings_offset_y {
        SETTINGS_OFFSET_Y.store(sy.round() as i32, Ordering::Relaxed);
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
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let output = Command::new("osascript")
            .args(["-e", "output volume of (get volume settings)"])
            .output()
            .map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if let Ok(vol_pct) = text.parse::<f32>() {
            Ok((vol_pct / 100.0).clamp(0.0, 1.0))
        } else {
            Ok(1.0)
        }
    }
    #[cfg(not(any(windows, target_os = "macos")))]
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
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let vol_int = ((volume.clamp(0.0, 1.0)) * 100.0).round() as u32;
        let script = format!("set volume output volume {}", vol_int);
        let _ = Command::new("osascript").args(["-e", &script]).output();
        Ok(())
    }
    #[cfg(not(any(windows, target_os = "macos")))]
    Ok(())
}

#[derive(Clone, Serialize, Debug)]
pub struct BatteryPayload {
    pub percentage: u8,
    pub is_charging: bool,
    pub has_battery: bool,
}

#[tauri::command]
fn get_battery_status() -> BatteryPayload {
    #[cfg(windows)]
    {
        #[repr(C)]
        struct SYSTEM_POWER_STATUS {
            ac_line_status: u8,
            battery_flag: u8,
            battery_life_percent: u8,
            system_status_flag: u8,
            battery_life_time: u32,
            battery_full_life_time: u32,
        }
        unsafe extern "system" {
            fn GetSystemPowerStatus(lpSystemPowerStatus: *mut SYSTEM_POWER_STATUS) -> i32;
        }
        unsafe {
            let mut status: SYSTEM_POWER_STATUS = std::mem::zeroed();
            if GetSystemPowerStatus(&mut status) != 0 {
                let no_battery = (status.battery_flag & 128) != 0 || status.battery_life_percent > 100;
                let pct = if status.battery_life_percent <= 100 {
                    status.battery_life_percent
                } else {
                    100
                };
                let charging = status.ac_line_status == 1 || (status.battery_flag & 8) != 0;
                return BatteryPayload {
                    percentage: pct,
                    is_charging: charging,
                    has_battery: !no_battery,
                };
            }
        }
    }
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        if let Ok(out) = Command::new("pmset").args(["-g", "batt"]).output() {
            let text = String::from_utf8_lossy(&out.stdout);
            let is_charging = text.contains("AC Power") || (text.contains("charging") && !text.contains("discharging"));
            for part in text.split_whitespace() {
                if let Some(num_str) = part.strip_suffix("%;") .or_else(|| part.strip_suffix('%')) {
                    if let Ok(pct) = num_str.parse::<u8>() {
                        return BatteryPayload {
                            percentage: pct.min(100),
                            is_charging,
                            has_battery: true,
                        };
                    }
                }
            }
        }
    }
    BatteryPayload {
        percentage: 100,
        is_charging: false,
        has_battery: true,
    }
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

/// Position the window flush at top, spanning 100% of the active monitor's width.
fn position_top_center(window: &tauri::WebviewWindow) -> Result<(), String> {
    let monitor = window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or("No monitor detected")?;

    let monitor_size = monitor.size();
    let monitor_position = monitor.position();

    let full_w_phys = monitor_size.width;
    let h_phys = monitor_size.height.saturating_sub(2);

    let _ = window.set_size(PhysicalSize::new(full_w_phys, h_phys));

    let x = monitor_position.x;
    let y = monitor_position.y;
    let _ = window.set_position(PhysicalPosition::new(x, y));

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
                    full_w_phys as i32,
                    h_phys as i32,
                    0x0314, // SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED
                );
            }
            return Ok(());
        }
    }

    window
        .set_position(PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Update island horizontal offset in memory for hit-test calculations
#[tauri::command]
fn set_window_horizontal_offset(offset_x: f64) -> Result<(), String> {
    ISLAND_OFFSET_X.store(offset_x.round() as i32, Ordering::Relaxed);
    Ok(())
}

/// Reset the window horizontal offset back to exact center.
#[tauri::command]
fn reset_window_horizontal_offset(app: AppHandle) -> Result<(), String> {
    ISLAND_OFFSET_X.store(0, Ordering::Relaxed);
    if let Some(window) = app.get_webview_window("main") {
        let _ = position_top_center(&window);
    }
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

#[cfg(target_os = "macos")]
fn start_media_listener(app: AppHandle) {
    use std::process::Command;

    thread::spawn(move || {
        println!("[BaoBao] macOS media listener started (Spotify & Apple Music polling)");

        let mut last_title = String::new();
        let mut last_artist = String::new();
        let mut last_is_playing = false;
        let mut last_pos = 0.0;

        let script = r#"
            if application "Spotify" is running then
                tell application "Spotify"
                    set pState to player state as string
                    set cTrack to current track
                    set tName to name of cTrack
                    set tArtist to artist of cTrack
                    set tAlbum to album of cTrack
                    set tDur to (duration of cTrack) / 1000
                    set tPos to player position
                    set tArt to artwork url of cTrack
                    return pState & "|||" & tName & "|||" & tArtist & "|||" & tAlbum & "|||" & tDur & "|||" & tPos & "|||" & tArt
                end tell
            else if application "Music" is running then
                tell application "Music"
                    set pState to player state as string
                    set cTrack to current track
                    set tName to name of cTrack
                    set tArtist to artist of cTrack
                    set tAlbum to album of cTrack
                    set tDur to duration of cTrack
                    set tPos to player position
                    return pState & "|||" & tName & "|||" & tArtist & "|||" & tAlbum & "|||" & tDur & "|||" & tPos & "|||"
                end tell
            else
                return "inactive"
            end if
        "#;

        loop {
            thread::sleep(Duration::from_millis(1000));

            let output = Command::new("osascript")
                .args(["-e", script])
                .output();

            if let Ok(out) = output {
                let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if stdout == "inactive" || stdout.is_empty() {
                    let mut lock = CURRENT_MEDIA.lock().unwrap();
                    if lock.is_some() {
                        *lock = None;
                        drop(lock);
                        let _ = app.emit("media-changed", MediaPayload::default());
                    }
                    continue;
                }

                let parts: Vec<&str> = stdout.split("|||").collect();
                if parts.len() >= 6 {
                    let p_state = parts[0].trim().to_lowercase();
                    let is_playing = p_state == "playing";
                    let title = parts[1].trim().to_string();
                    let artist = parts[2].trim().to_string();
                    let album = parts[3].trim().to_string();
                    let duration_secs = parts[4].trim().parse::<f64>().unwrap_or(0.0);
                    let position_secs = parts[5].trim().parse::<f64>().unwrap_or(0.0);
                    let cover_data_url = if parts.len() > 6 && !parts[6].trim().is_empty() {
                        Some(parts[6].trim().to_string())
                    } else {
                        None
                    };

                    let has_changed = title != last_title
                        || artist != last_artist
                        || is_playing != last_is_playing
                        || (position_secs - last_pos).abs() > 2.5;

                    if has_changed {
                        last_title = title.clone();
                        last_artist = artist.clone();
                        last_is_playing = is_playing;
                        last_pos = position_secs;

                        let payload = MediaPayload {
                            title,
                            artist,
                            album,
                            is_playing,
                            position_secs,
                            position_at_ms: now_ms(),
                            duration_secs,
                            cover_data_url,
                        };

                        let mut lock = CURRENT_MEDIA.lock().unwrap();
                        *lock = Some(payload.clone());
                        drop(lock);

                        let _ = app.emit("media-changed", payload);
                    }
                }
            }
        }
    });
}

#[cfg(not(any(windows, target_os = "macos")))]
fn start_media_listener(_app: AppHandle) {
    eprintln!("[Baobao] Media listener is not supported on this platform");
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
        fn GetAsyncKeyState(vKey: i32) -> i16;
        fn GetWindowLongW(hWnd: isize, nIndex: i32) -> i32;
        fn SetWindowLongW(hWnd: isize, nIndex: i32, dwNewLong: i32) -> i32;
    }
    const GWL_EXSTYLE: i32 = -20;
    const WS_EX_TRANSPARENT: i32 = 0x00000020;
    const WS_EX_LAYERED: i32 = 0x00080000;

    thread::spawn(move || {
        let hwnd_raw = match window.hwnd() {
            Ok(h) => h.0 as *mut std::ffi::c_void,
            Err(_) => return,
        };
        let hwnd_isize = hwnd_raw as isize;

        let mut currently_ignoring = false;

        loop {
            thread::sleep(Duration::from_millis(25));

            if IS_MODAL_OPEN.load(Ordering::Relaxed) {
                if !currently_ignoring {
                    currently_ignoring = true;
                    unsafe {
                        let ex = GetWindowLongW(hwnd_isize, GWL_EXSTYLE);
                        SetWindowLongW(hwnd_isize, GWL_EXSTYLE, ex | WS_EX_LAYERED | WS_EX_TRANSPARENT);
                    }
                    let _ = window.set_ignore_cursor_events(true);
                }
                continue;
            }

            // Check global keyboard shortcut to toggle visibility
            let vk = GLOBAL_HOTKEY_VK.load(Ordering::Relaxed) as i32;
            if vk > 0 {
                let state = unsafe { GetAsyncKeyState(vk) };
                let is_down = (state as u16 & 0x8000) != 0;
                let was_down = IS_HOTKEY_DOWN.swap(is_down, Ordering::Relaxed);
                if is_down && !was_down {
                    perform_toggle(&window);
                }
            }

            if !window.is_visible().unwrap_or(true) {
                continue;
            }

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
            let settings_open = IS_SETTINGS_OPEN.load(Ordering::Relaxed);

            let (target_w, target_h) = if expanded {
                if with_lyrics { (660.0, 234.0) } else { (480.0, 234.0) }
            } else {
                let w = MINI_WIDTH.load(Ordering::Relaxed) as f64;
                let pill_w = if with_mini { w.max(210.0) } else { w.max(210.0) };
                (pill_w, 46.0)
            };

            let offset_x = ISLAND_OFFSET_X.load(Ordering::Relaxed) as f64;
            let center_x = (win_w_logical / 2.0) + offset_x;
            let left = center_x - (target_w / 2.0);
            let right = center_x + (target_w / 2.0);
            let margin = 10.0;

            let on_island = cx >= (left - margin)
                && cx <= (right + margin)
                && cy >= 0.0
                && cy <= (target_h + margin);

            let on_settings = if settings_open {
                let s_off_x = SETTINGS_OFFSET_X.load(Ordering::Relaxed) as f64;
                let s_off_y = SETTINGS_OFFSET_Y.load(Ordering::Relaxed) as f64;
                let s_w = 590.0;
                let s_h = 410.0;
                let s_center_x = (win_w_logical / 2.0) + s_off_x;
                let s_left = s_center_x - (s_w / 2.0);
                let s_right = s_center_x + (s_w / 2.0);
                let s_top = s_off_y;
                let s_bottom = s_top + s_h;
                cx >= (s_left - margin)
                    && cx <= (s_right + margin)
                    && cy >= (s_top - margin)
                    && cy <= (s_bottom + margin)
            } else {
                false
            };

            if on_island || on_settings {
                if currently_ignoring {
                    currently_ignoring = false;
                    unsafe {
                        let ex = GetWindowLongW(hwnd_isize, GWL_EXSTYLE);
                        SetWindowLongW(hwnd_isize, GWL_EXSTYLE, ex & !WS_EX_TRANSPARENT);
                    }
                    let _ = window.set_ignore_cursor_events(false);
                }
            } else {
                if !currently_ignoring {
                    currently_ignoring = true;
                    unsafe {
                        let ex = GetWindowLongW(hwnd_isize, GWL_EXSTYLE);
                        SetWindowLongW(hwnd_isize, GWL_EXSTYLE, ex | WS_EX_LAYERED | WS_EX_TRANSPARENT);
                    }
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

    let full_w_phys = monitor_size.width;
    let h_phys = monitor_size.height.saturating_sub(2);

    let _ = window.set_size(PhysicalSize::new(full_w_phys, h_phys));

    let x = monitor_position.x;
    let y = monitor_position.y;
    let _ = window.set_position(PhysicalPosition::new(x, y));
    ISLAND_OFFSET_X.store(0, Ordering::Relaxed);

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
                    full_w_phys as i32,
                    h_phys as i32,
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
            get_battery_status,
            open_file_path,
            get_file_icon,
            get_file_info,
            pick_files_dialog,
            pick_native_color,
            set_autostart,
            get_autostart,
            switch_monitor,
            get_monitors_count,
            get_current_monitor_label,
            set_window_horizontal_offset,
            reset_window_horizontal_offset,
            set_toggle_shortcut,
            toggle_window_visibility
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
