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

#[tauri::command]
fn get_processes() -> Result<Vec<ProcessInfo>, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let mut processes: Vec<ProcessInfo> = Vec::new();
    let mut disk_usage: HashMap<u32, f64> = HashMap::new();

    for (pid, process) in sys.processes() {
        let pid_u32 = pid.as_u32();

        // Calculate disk usage (read + write bytes per second, converted to MB/s)
        let disk_bytes = process.disk_usage();
        let disk_mb_s = ((disk_bytes.read_bytes + disk_bytes.written_bytes) as f64) / 1_048_576.0;
        disk_usage.insert(pid_u32, disk_mb_s);

        // Determine category based on process characteristics
        let category = if process.name().ends_with(".exe")
            || process.name().contains("app")
            || !process.cmd().is_empty()
        {
            if process.name().to_lowercase().contains("svc")
                || process.name().to_lowercase().contains("service")
                || process.name().to_lowercase().contains("daemon")
            {
                "windows"
            } else if process.parent().is_some() {
                "app"
            } else {
                "background"
            }
        } else {
            "background"
        };

        let parent_pid = process.parent().map(|p| p.as_u32());

        processes.push(ProcessInfo {
            pid: pid_u32,
            name: process.name().to_string(),
            cpu: process.cpu_usage(),
            memory: (process.memory() as f64) / 1_048_576.0, // Convert to MB
            disk: disk_mb_s,
            network: 0.0, // Network per-process is not directly available in sysinfo
            parent_pid,
            category: category.to_string(),
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
