export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_mb: number;
  disk_usage_mb_s: number;
  network_mbps: number;
  parent_pid: number | null;
  category: "app" | "background" | "windows";
  children: ProcessInfo[];
  expanded?: boolean;
}

export type SortField =
  | "pid"
  | "name"
  | "cpu_percent"
  | "memory_mb"
  | "disk_usage_mb_s"
  | "network_mbps";
export type SortDirection = "asc" | "desc";
