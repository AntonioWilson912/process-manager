use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use sysinfo::{Pid, Process, System};

#[derive(Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pid: u32,
    name: String,
    cpu: f32,
    memory: f64,
    disk: f64,
    network: f64,
    parent_pid: Option<u32>,
    category: String,
}

#[cfg(target_os = "windows")]
fn categorize_process(process: &Process, sys: &System) -> String {
    // Check if process has a visible window (GUI app)
    // This is a simplified check - full implementation would use Windows API
    let name = process.name().to_lowercase();

    if name.ends_with(".exe") {
        // System processes
        if name.contains("svchost")
            || name.contains("csrss")
            || name.contains("wininit")
            || name.contains("services")
            || name.contains("lsass")
            || name.contains("smss")
        {
            return "windows".to_string();
        }

        // Check for GUI indicators
        if !process.cmd().is_empty()
            && (process.memory() > 50_000_000 || // > 50MB typically indicates GUI
            name.contains("chrome") ||
            name.contains("firefox") ||
            name.contains("edge") ||
            name.contains("explorer"))
        {
            return "app".to_string();
        }
    }

    "background".to_string()
}

#[cfg(target_os = "macos")]
fn categorize_process(process: &Process, _sys: &System) -> String {
    let name = process.name().to_lowercase();

    // macOS system processes
    if name.starts_with("com.apple")
        || name.contains("launchd")
        || name.contains("kernel")
        || name.contains("windowserver")
    {
        return "windows".to_string();
    }

    // Check for .app bundle (GUI apps)
    if let Some(exe) = process.exe() {
        if exe.to_string_lossy().contains(".app/") {
            return "app".to_string();
        }
    }

    "background".to_string()
}

#[cfg(target_os = "linux")]
fn categorize_process(process: &Process, _sys: &System) -> String {
    let name = process.name().to_lowercase();
    let pid = process.pid().as_u32();

    // System processes (low PIDs or kernel threads)
    if pid < 300 || name.starts_with("[") || name.ends_with("]") {
        return "windows".to_string();
    }

    // Check for GUI by looking at environment or common GUI apps
    if name.contains("gnome")
        || name.contains("kde")
        || name.contains("firefox")
        || name.contains("chrome")
        || name.contains("nautilus")
    {
        return "app".to_string();
    }

    "background".to_string()
}

#[tauri::command]
fn get_processes() -> Result<Vec<ProcessInfo>, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let mut processes: Vec<ProcessInfo> = Vec::new();

    for (pid, process) in sys.processes() {
        let pid_u32 = pid.as_u32();

        let disk_bytes = process.disk_usage();
        let disk_mb_s = ((disk_bytes.read_bytes + disk_bytes.written_bytes) as f64) / 1_048_576.0;

        let category = categorize_process(process, &sys);
        let parent_pid = process.parent().map(|p| p.as_u32());

        processes.push(ProcessInfo {
            pid: pid_u32,
            name: process.name().to_string(),
            cpu: process.cpu_usage(),
            memory: (process.memory() as f64) / 1_048_576.0,
            disk: disk_mb_s,
            network: 0.0,
            parent_pid,
            category,
        });
    }

    Ok(processes)
}

#[tauri::command]
fn end_process(pid: u32) -> Result<(), String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let pid_obj = Pid::from_u32(pid);

    if let Some(process) = sys.process(pid_obj) {
        // Check if we have permission to kill the process
        if process.kill() {
            Ok(())
        } else {
            Err(format!(
                "Failed to end process {}. Permission denied or process is protected.",
                pid
            ))
        }
    } else {
        Err(format!("Process {} not found", pid))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_processes, end_process])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
