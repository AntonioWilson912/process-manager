import {
  Component,
  createSignal,
  createEffect,
  onCleanup,
  Show,
} from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { Tabs } from "./components/Tabs";
import { ProcessTable } from "./components/ProcessTable";
import { SearchBar } from "./components/SearchBar";
import {
  ProcessInfo,
  ProcessTree,
  SortKey,
  SortDirection,
} from "./types/process";
import { fuzzySearch } from "./utils/fuzzySearch";

const App: Component = () => {
  const [activeTab, setActiveTab] = createSignal("Processes");
  const [processes, setProcesses] = createSignal<ProcessTree[]>([]);
  const [selectedPid, setSelectedPid] = createSignal<number | null>(null);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [sortKey, setSortKey] = createSignal<SortKey>("name");
  const [sortDirection, setSortDirection] = createSignal<SortDirection>("asc");
  const [error, setError] = createSignal<string | null>(null);
  const [processCount, setProcessCount] = createSignal(0);

  const buildProcessTree = (processes: ProcessInfo[]): ProcessTree[] => {
    const processMap = new Map<number, ProcessTree>();
    const roots: ProcessTree[] = [];

    // Create tree nodes
    processes.forEach((p) => {
      processMap.set(p.pid, { ...p, children: [], expanded: true });
    });

    // Build tree structure
    processes.forEach((p) => {
      const node = processMap.get(p.pid)!;
      if (p.parent_pid && processMap.has(p.parent_pid)) {
        processMap.get(p.parent_pid)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const categorizeProcesses = (trees: ProcessTree[]): ProcessTree[] => {
    const apps: ProcessTree[] = [];
    const background: ProcessTree[] = [];
    const windows: ProcessTree[] = [];

    trees.forEach((tree) => {
      switch (tree.category) {
        case "app":
          apps.push(tree);
          break;
        case "background":
          background.push(tree);
          break;
        case "windows":
          windows.push(tree);
          break;
      }
    });

    const sortTrees = (trees: ProcessTree[]): ProcessTree[] => {
      return [...trees].sort((a, b) => {
        let comparison = 0;
        switch (sortKey()) {
          case "pid":
            comparison = a.pid - b.pid;
            break;
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "cpu":
            comparison = a.cpu - b.cpu;
            break;
          case "memory":
            comparison = a.memory - b.memory;
            break;
          case "disk":
            comparison = a.disk - b.disk;
            break;
          case "network":
            comparison = a.network - b.network;
            break;
        }
        return sortDirection() === "asc" ? comparison : -comparison;
      });
    };

    const createCategoryNode = (
      name: string,
      processes: ProcessTree[]
    ): ProcessTree => ({
      pid: -1,
      name,
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
      parent_pid: null,
      category: "app",
      children: sortTrees(processes),
      expanded: true,
    });

    const result: ProcessTree[] = [];
    if (apps.length > 0) {
      result.push(createCategoryNode(`Apps (${apps.length})`, apps));
    }
    if (background.length > 0) {
      result.push(
        createCategoryNode(
          `Background processes (${background.length})`,
          background
        )
      );
    }
    if (windows.length > 0) {
      result.push(
        createCategoryNode(`Windows processes (${windows.length})`, windows)
      );
    }

    return result;
  };

  const filterProcesses = (trees: ProcessTree[]): ProcessTree[] => {
    const query = searchQuery();
    if (!query) return trees;

    const filterTree = (tree: ProcessTree): ProcessTree | null => {
      const matchesSearch = fuzzySearch(query, tree.name);
      const filteredChildren = tree.children
        .map(filterTree)
        .filter((child): child is ProcessTree => child !== null);

      if (matchesSearch || filteredChildren.length > 0) {
        return { ...tree, children: filteredChildren };
      }
      return null;
    };

    return trees
      .map(filterTree)
      .filter((tree): tree is ProcessTree => tree !== null);
  };

  const fetchProcesses = async () => {
    try {
      const data = await invoke<ProcessInfo[]>("get_processes");
      setProcessCount(data.length);
      const tree = buildProcessTree(data);
      const categorized = categorizeProcesses(tree);
      const filtered = filterProcesses(categorized);
      setProcesses(filtered);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch processes: ${err}`);
    }
  };

  const toggleProcess = (pid: number) => {
    const toggle = (trees: ProcessTree[]): ProcessTree[] => {
      return trees.map((tree) => {
        if (tree.pid === pid) {
          return { ...tree, expanded: !tree.expanded };
        }
        return { ...tree, children: toggle(tree.children) };
      });
    };
    setProcesses(toggle(processes()));
  };

  const handleSort = (key: SortKey) => {
    if (sortKey() === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const endTask = async () => {
    const pid = selectedPid();
    if (pid === null || pid < 0) return;

    try {
      await invoke("end_process", { pid });
      setSelectedPid(null);
      await fetchProcesses();
    } catch (err) {
      setError(`Failed to end process: ${err}`);
    }
  };

  createEffect(() => {
    if (activeTab() === "Processes") {
      fetchProcesses();
      const interval = setInterval(fetchProcesses, 1000);
      onCleanup(() => clearInterval(interval));
    }
  });

  createEffect(() => {
    searchQuery();
    sortKey();
    sortDirection();
    fetchProcesses();
  });

  return (
    <div class="app">
      <Tabs activeTab={activeTab()} onTabChange={setActiveTab} />

      <Show when={error()}>
        <div class="error-message">{error()}</div>
      </Show>

      <Show
        when={activeTab() === "Processes"}
        fallback={
          <div class="placeholder">{activeTab()} - Not Implemented</div>
        }
      >
        <div class="toolbar">
          <SearchBar value={searchQuery()} onInput={setSearchQuery} />
          <button
            class="end-task-btn"
            disabled={selectedPid() === null || selectedPid()! < 0}
            onClick={endTask}
          >
            End Task
          </button>
        </div>

        <ProcessTable
          processes={processes()}
          selectedPid={selectedPid()}
          sortKey={sortKey()}
          sortDirection={sortDirection()}
          onSelect={setSelectedPid}
          onToggle={toggleProcess}
          onSort={handleSort}
        />

        <div class="status-bar">
          Processes: {processCount()} | Selected:{" "}
          {selectedPid() !== null && selectedPid()! >= 0
            ? selectedPid()
            : "None"}
        </div>
      </Show>
    </div>
  );
};

export default App;
