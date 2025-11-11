import { Component, For } from "solid-js";

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  "Processes",
  "Performance",
  "App History",
  "Startup",
  "Users",
  "Details",
  "Services",
];

export const Tabs: Component<TabsProps> = (props) => {
  return (
    <div class="tabs">
      <For each={tabs}>
        {(tab) => (
          <button
            class={props.activeTab === tab ? "active" : ""}
            onClick={() => props.onTabChange(tab)}
          >
            {tab}
          </button>
        )}
      </For>
    </div>
  );
};
