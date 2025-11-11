#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod process_manager;

use process_manager::{end_process, get_processes, ProcessInfo};

#[tauri::command]
fn get_processes() -> Vec<ProcessInfo> {
    process_manager::get_processes()
}

#[tauri::command]
fn end_process(pid: u32) -> Result<(), String> {
    process_manager::end_process(pid).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_processes, end_process])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
