import { Component, Show, For } from "solid-js";
import { ProcessInfo } from "../types/process";

interface ProcessRowProps {
  process: ProcessInfo;
  depth: number;
  selected: boolean;
  onSelect: (pid: number) => void;
  onToggle: (pid: number) => void;
}

const ProcessRow: Component<ProcessRowProps> = (props) => {
  const hasChildren = () => props.process.children.length > 0;

  return (
    <>
      <tr
        onClick={() => props.onSelect(props.process.pid)}
        style={{
          "background-color": props.selected ? "#0078d4" : "transparent",
          cursor: "pointer",
        }}
      >
        <td
          style={{
            padding: "8px",
            "padding-left": `${20 + props.depth * 20}px`,
          }}
        >
          <Show when={hasChildren()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                props.onToggle(props.process.pid);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#888",
                cursor: "pointer",
                "margin-right": "8px",
              }}
            >
              {props.process.expanded ? "▼" : "▶"}
            </button>
          </Show>
          {props.process.name}
        </td>
        <td style={{ padding: "8px" }}>{props.process.pid}</td>
        <td style={{ padding: "8px" }}>
          {props.process.cpu_percent.toFixed(1)}%
        </td>
        <td style={{ padding: "8px" }}>
          {props.process.memory_mb.toFixed(1)} MB
        </td>
        <td style={{ padding: "8px" }}>
          {props.process.disk_usage_mb_s.toFixed(2)} MB/s
        </td>
        <td style={{ padding: "8px" }}>
          {props.process.network_mbps.toFixed(2)} Mbps
        </td>
      </tr>
      <Show when={props.process.expanded && hasChildren()}>
        <For each={props.process.children}>
          {(child) => (
            <ProcessRow
              process={child}
              depth={props.depth + 1}
              selected={props.selected}
              onSelect={props.onSelect}
              onToggle={props.onToggle}
            />
          )}
        </For>
      </Show>
    </>
  );
};

export default ProcessRow;
