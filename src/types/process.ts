export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  parent_pid: number | null;
  category: "app" | "background" | "windows";
}

export interface ProcessTree extends ProcessInfo {
  children: ProcessTree[];
  expanded: boolean;
}

export interface ExpandedState {
  [key: number]: boolean;
}

export type SortKey = "pid" | "name" | "cpu" | "memory" | "disk" | "network";
export type SortDirection = "asc" | "desc";
