import { Component, createSignal, Show } from "solid-js";
import Tabs from "./components/Tabs";
import ProcessTable from "./components/ProcessTable";
import Placeholder from "./components/Placeholder";

const App: Component = () => {
  const tabs = [
    "Processes",
    "Performance",
    "App History",
    "Startup",
    "Users",
    "Details",
    "Services",
  ];
  const [activeTab, setActiveTab] = createSignal("Processes");

  return (
    <div
      style={{ display: "flex", "flex-direction": "column", height: "100vh" }}
    >
      <Tabs tabs={tabs} activeTab={activeTab()} onTabChange={setActiveTab} />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Show when={activeTab() === "Processes"}>
          <ProcessTable />
        </Show>
        <Show when={activeTab() === "Performance"}>
          <Placeholder title="Performance" />
        </Show>
        <Show when={activeTab() === "App History"}>
          <Placeholder title="App History" />
        </Show>
        <Show when={activeTab() === "Startup"}>
          <Placeholder title="Startup" />
        </Show>
        <Show when={activeTab() === "Users"}>
          <Placeholder title="Users" />
        </Show>
        <Show when={activeTab() === "Details"}>
          <Placeholder title="Details" />
        </Show>
        <Show when={activeTab() === "Services"}>
          <Placeholder title="Services" />
        </Show>
      </div>
    </div>
  );
};

export default App;
