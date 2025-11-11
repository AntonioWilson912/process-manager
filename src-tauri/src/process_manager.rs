use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use sysinfo::{Pid, Process, System};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ProcessError {
    #[error("Process not found: {0}")]
    NotFound(u32),
    #[error("Permission denied to terminate process: {0}")]
    PermissionDenied(u32),
    #[error("Failed to terminate process: {0}")]
    TerminationFailed(String),
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_percent: f32,
    pub memory_mb: f64,
    pub disk_usage_mb_s: f64,
    pub network_mbps: f64,
    pub parent_pid: Option<u32>,
    pub category: String,
    pub children: Vec<ProcessInfo>,
    pub expanded: bool,
}

pub fn get_processes() -> Vec<ProcessInfo> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let processes = sys.processes();
    let mut process_map: HashMap<u32, ProcessInfo> = HashMap::new();
    let mut children_map: HashMap<u32, Vec<u32>> = HashMap::new();

    // First pass: create all process info
    for (pid, process) in processes {
        let pid_u32 = pid.as_u32();
        let parent_pid = process.parent().map(|p| p.as_u32());

        let category = categorize_process(process);

        let info = ProcessInfo {
            pid: pid_u32,
            name: process.name().to_string(),
            cpu_percent: process.cpu_usage(),
            memory_mb: process.memory() as f64 / 1024.0 / 1024.0,
            disk_usage_mb_s: (process.disk_usage().read_bytes + process.disk_usage().written_bytes)
                as f64
                / 1024.0
                / 1024.0,
            network_mbps: 0.0, // Network per-process not directly available
            parent_pid,
            category,
            children: vec![],
            expanded: false,
        };

        process_map.insert(pid_u32, info);

        if let Some(parent) = parent_pid {
            children_map
                .entry(parent)
                .or_insert_with(Vec::new)
                .push(pid_u32);
        }
    }

    // Second pass: build tree structure
    let mut root_processes: Vec<ProcessInfo> = vec![];

    for (pid, mut process) in process_map.clone() {
        if let Some(children_pids) = children_map.get(&pid) {
            for child_pid in children_pids {
                if let Some(child) = process_map.get(child_pid) {
                    process.children.push(child.clone());
                }
            }
        }
        process_map.insert(pid, process);
    }

    // Find root processes (no parent or parent not in list)
    for (pid, process) in &process_map {
        let is_root = match process.parent_pid {
            None => true,
            Some(parent) => !process_map.contains_key(&parent),
        };

        if is_root {
            let mut root = process.clone();
            build_children_tree(&mut root, &process_map, &children_map);
            root_processes.push(root);
        }
    }

    root_processes
}

fn build_children_tree(
    process: &mut ProcessInfo,
    process_map: &HashMap<u32, ProcessInfo>,
    children_map: &HashMap<u32, Vec<u32>>,
) {
    if let Some(children_pids) = children_map.get(&process.pid) {
        for child_pid in children_pids {
            if let Some(child_info) = process_map.get(child_pid) {
                let mut child = child_info.clone();
                build_children_tree(&mut child, process_map, children_map);
                process.children.push(child);
            }
        }
    }
}

fn categorize_process(process: &Process) -> String {
    let name = process.name().to_lowercase();

    // Windows system processes
    if name.ends_with(".exe") {
        if name.contains("svchost")
            || name.contains("csrss")
            || name.contains("wininit")
            || name.contains("services")
            || name.contains("lsass")
        {
            return "windows".to_string();
        }
    }

    // Background processes (services, daemons)
    if name.contains("service")
        || name.contains("daemon")
        || name.contains("agent")
        || name.ends_with("d") && !name.contains(" ")
    {
        return "background".to_string();
    }

    // Default to app
    "app".to_string()
}

pub fn end_process(pid: u32) -> Result<(), ProcessError> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let process_pid = Pid::from_u32(pid);

    if let Some(process) = sys.process(process_pid) {
        if process.kill() {
            Ok(())
        } else {
            Err(ProcessError::PermissionDenied(pid))
        }
    } else {
        Err(ProcessError::NotFound(pid))
    }
}
