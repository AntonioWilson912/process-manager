import {
  Component,
  createSignal,
  createEffect,
  onCleanup,
  For,
  Show,
} from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { ProcessInfo, SortField, SortDirection } from "../types/process";
import { fuzzySearchScore } from "../utils/fuzzySearch";
import ProcessRow from "./ProcessRow";
import SearchBar from "./SearchBar";

const ProcessTable: Component = () => {
  const [processes, setProcesses] = createSignal<ProcessInfo[]>([]);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedPid, setSelectedPid] = createSignal<number | null>(null);
  const [sortField, setSortField] = createSignal<SortField>("name");
  const [sortDirection, setSortDirection] = createSignal<SortDirection>("asc");
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const fetchProcesses = async () => {
    try {
      setError(null);
      const result = await invoke<ProcessInfo[]>("get_processes");
      setProcesses(result);
    } catch (err) {
      setError(`Failed to fetch processes: ${err}`);
      console.error(err);
    }
  };

  createEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 1000);
    onCleanup(() => clearInterval(interval));
  });

  const toggleProcess = (pid: number) => {
    setProcesses((prev) => {
      const updateExpanded = (procs: ProcessInfo[]): ProcessInfo[] => {
        return procs.map((p) => {
          if (p.pid === pid) {
            return { ...p, expanded: !p.expanded };
          }
          if (p.children.length > 0) {
            return { ...p, children: updateExpanded(p.children) };
          }
          return p;
        });
      };
      return updateExpanded(prev);
    });
  };

  const endTask = async () => {
    const pid = selectedPid();
    if (pid === null) return;

    try {
      setLoading(true);
      await invoke("end_process", { pid });
      setSelectedPid(null);
      await fetchProcesses();
    } catch (err) {
      setError(`Failed to end process: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const sortProcesses = (procs: ProcessInfo[]): ProcessInfo[] => {
    const field = sortField();
    const direction = sortDirection();

    return [...procs]
      .sort((a, b) => {
        let comparison = 0;

        if (field === "name") {
          comparison = a.name.localeCompare(b.name);
        } else {
          comparison = (a[field] as number) - (b[field] as number);
        }

        return direction === "asc" ? comparison : -comparison;
      })
      .map((p) => ({
        ...p,
        children: sortProcesses(p.children),
      }));
  };

  const filterProcesses = (procs: ProcessInfo[]): ProcessInfo[] => {
    const query = searchQuery();
    if (!query) return procs;

    return procs
      .filter((p) => {
        const score = fuzzySearchScore(query, p.name);
        const hasMatchingChildren = filterProcesses(p.children).length > 0;
        return score > 0 || hasMatchingChildren;
      })
      .map((p) => ({
        ...p,
        children: filterProcesses(p.children),
      }));
  };

  const categorizedProcesses = () => {
    const filtered = filterProcesses(processes());
    const sorted = sortProcesses(filtered);

    const apps = sorted.filter((p) => p.category === "app");
    const background = sorted.filter((p) => p.category === "background");
    const windows = sorted.filter((p) => p.category === "windows");

    return { apps, background, windows };
  };

  const handleSort = (field: SortField) => {
    if (sortField() === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const headerStyle = {
    padding: "12px 8px",
    "text-align": "left" as const,
    "background-color": "#2d2d2d",
    cursor: "pointer",
    "user-select": "none" as const,
  };

  return (
    <div
      style={{ display: "flex", "flex-direction": "column", height: "100%" }}
    >
      <SearchBar value={searchQuery()} onChange={setSearchQuery} />

      <Show when={error()}>
        <div
          style={{
            padding: "10px",
            "background-color": "#d32f2f",
            color: "white",
          }}
        >
          {error()}
        </div>
      </Show>

      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", "border-collapse": "collapse" }}>
          <thead>
            <tr>
              <th style={headerStyle} onClick={() => handleSort("name")}>
                Name{" "}
                {sortField() === "name" &&
                  (sortDirection() === "asc" ? "↑" : "↓")}
              </th>
              <th style={headerStyle} onClick={() => handleSort("pid")}>
                PID{" "}
                {sortField() === "pid" &&
                  (sortDirection() === "asc" ? "↑" : "↓")}
              </th>
              <th style={headerStyle} onClick={() => handleSort("cpu_percent")}>
                CPU %{" "}
                {sortField() === "cpu_percent" &&
                  (sortDirection() === "asc" ? "↑" : "↓")}
              </th>
              <th style={headerStyle} onClick={() => handleSort("memory_mb")}>
                Memory{" "}
                {sortField() === "memory_mb" &&
                  (sortDirection() === "asc" ? "↑" : "↓")}
              </th>
              <th
                style={headerStyle}
                onClick={() => handleSort("disk_usage_mb_s")}
              >
                Disk{" "}
                {sortField() === "disk_usage_mb_s" &&
                  (sortDirection() === "asc" ? "↑" : "↓")}
              </th>
              <th
                style={headerStyle}
                onClick={() => handleSort("network_mbps")}
              >
                Network{" "}
                {sortField() === "network_mbps" &&
                  (sortDirection() === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colspan="6"
                style={{
                  padding: "8px",
                  "font-weight": "bold",
                  "background-color": "#3d3d3d",
                }}
              >
                Apps ({categorizedProcesses().apps.length})
              </td>
            </tr>
            <For each={categorizedProcesses().apps}>
              {(process) => (
                <ProcessRow
                  process={process}
                  depth={0}
                  selected={selectedPid() === process.pid}
                  onSelect={setSelectedPid}
                  onToggle={toggleProcess}
                />
              )}
            </For>

            <tr>
              <td
                colspan="6"
                style={{
                  padding: "8px",
                  "font-weight": "bold",
                  "background-color": "#3d3d3d",
                }}
              >
                Background Processes ({categorizedProcesses().background.length}
                )
              </td>
            </tr>
            <For each={categorizedProcesses().background}>
              {(process) => (
                <ProcessRow
                  process={process}
                  depth={0}
                  selected={selectedPid() === process.pid}
                  onSelect={setSelectedPid}
                  onToggle={toggleProcess}
                />
              )}
            </For>

            <tr>
              <td
                colspan="6"
                style={{
                  padding: "8px",
                  "font-weight": "bold",
                  "background-color": "#3d3d3d",
                }}
              >
                Windows Processes ({categorizedProcesses().windows.length})
              </td>
            </tr>
            <For each={categorizedProcesses().windows}>
              {(process) => (
                <ProcessRow
                  process={process}
                  depth={0}
                  selected={selectedPid() === process.pid}
                  onSelect={setSelectedPid}
                  onToggle={toggleProcess}
                />
              )}
            </For>
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: "10px",
          "background-color": "#2d2d2d",
          "text-align": "right",
        }}
      >
        <button
          onClick={endTask}
          disabled={selectedPid() === null || loading()}
          style={{
            padding: "8px 16px",
            "background-color": selectedPid() !== null ? "#d32f2f" : "#555",
            color: "white",
            border: "none",
            "border-radius": "4px",
            cursor: selectedPid() !== null ? "pointer" : "not-allowed",
            opacity: loading() ? 0.7 : 1,
          }}
        >
          {loading() ? "Ending..." : "End Task"}
        </button>
      </div>
    </div>
  );
};

export default ProcessTable;
