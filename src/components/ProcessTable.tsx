import { Component, For, createMemo, createEffect } from "solid-js";
import { ProcessTree, SortKey } from "../types/process";
import { ProcessRow } from "./ProcessRow";

interface ProcessTableProps {
  processes: ProcessTree[];
  selectedPid: number | null;
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSelect: (pid: number) => void;
  onToggle: (pid: number) => void;
  onSort: (key: SortKey) => void;
  scrollPosition?: number;
  onScroll?: (position: number) => void;
}

export const ProcessTable: Component<ProcessTableProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;

  // Restore scroll position after render
  createEffect(() => {
    if (containerRef && props.scrollPosition !== undefined) {
      containerRef.scrollTop = props.scrollPosition;
    }
  });

  const handleScroll = () => {
    if (containerRef && props.onScroll) {
      props.onScroll(containerRef.scrollTop);
    }
  };
  const flattenProcesses = (
    processes: ProcessTree[],
    depth: number = 0
  ): Array<{ process: ProcessTree; depth: number }> => {
    const result: Array<{ process: ProcessTree; depth: number }> = [];

    for (const process of processes) {
      result.push({ process, depth });
      if (process.expanded && process.children.length > 0) {
        result.push(...flattenProcesses(process.children, depth + 1));
      }
    }

    return result;
  };

  const flatList = createMemo(() => flattenProcesses(props.processes));

  const getSortIndicator = (key: SortKey) => {
    if (props.sortKey !== key) return "";
    return props.sortDirection === "asc" ? " ▲" : " ▼";
  };

  return (
    <div
      class="process-table-container"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <table class="process-table">
        <thead>
          <tr>
            <th onClick={() => props.onSort("name")}>
              Name{getSortIndicator("name")}
            </th>
            <th onClick={() => props.onSort("pid")}>
              PID{getSortIndicator("pid")}
            </th>
            <th onClick={() => props.onSort("cpu")}>
              CPU %{getSortIndicator("cpu")}
            </th>
            <th onClick={() => props.onSort("memory")}>
              Memory{getSortIndicator("memory")}
            </th>
            <th onClick={() => props.onSort("disk")}>
              Disk{getSortIndicator("disk")}
            </th>
            <th onClick={() => props.onSort("network")}>
              Network{getSortIndicator("network")}
            </th>
          </tr>
        </thead>
        <tbody>
          <For each={flatList()}>
            {(item) => (
              <ProcessRow
                process={item.process}
                depth={item.depth}
                selected={props.selectedPid === item.process.pid}
                onSelect={props.onSelect}
                onToggle={props.onToggle}
              />
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
};
