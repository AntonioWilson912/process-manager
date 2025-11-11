import { Component, For } from "solid-js";

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Tabs: Component<TabsProps> = (props) => {
  return (
    <div
      style={{
        display: "flex",
        "background-color": "#2d2d2d",
        "border-bottom": "1px solid #3d3d3d",
      }}
    >
      <For each={props.tabs}>
        {(tab) => (
          <button
            onClick={() => props.onTabChange(tab)}
            style={{
              padding: "12px 24px",
              border: "none",
              background: props.activeTab === tab ? "#1e1e1e" : "transparent",
              color: props.activeTab === tab ? "#ffffff" : "#888888",
              cursor: "pointer",
              "font-size": "14px",
              "border-bottom":
                props.activeTab === tab
                  ? "2px solid #0078d4"
                  : "2px solid transparent",
            }}
          >
            {tab}
          </button>
        )}
      </For>
    </div>
  );
};

export default Tabs;
