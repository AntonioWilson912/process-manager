import { Component, Show } from "solid-js";
import { ProcessTree } from "../types/process";

interface ProcessRowProps {
  process: ProcessTree;
  depth: number;
  selected: boolean;
  onSelect: (pid: number) => void;
  onToggle: (pid: number) => void;
}

export const ProcessRow: Component<ProcessRowProps> = (props) => {
  const hasChildren = () => props.process.children.length > 0;

  return (
    <tr
      class={props.selected ? "selected" : ""}
      onClick={() => props.onSelect(props.process.pid)}
    >
      <td style={{ "padding-left": `${props.depth * 20 + 10}px` }}>
        <Show when={hasChildren()}>
          <button
            class="toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              props.onToggle(props.process.pid);
            }}
          >
            {props.process.expanded ? "▼" : "▶"}
          </button>
        </Show>
        {props.process.name}
      </td>
      <td>{props.process.pid}</td>
      <td>{props.process.cpu.toFixed(1)}%</td>
      <td>{props.process.memory.toFixed(1)} MB</td>
      <td>{props.process.disk.toFixed(2)} MB/s</td>
      <td>{props.process.network.toFixed(2)} Mbps</td>
    </tr>
  );
};
