import { Component } from "solid-js";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: Component<SearchBarProps> = (props) => {
  return (
    <div style={{ padding: "10px", "background-color": "#2d2d2d" }}>
      <input
        type="text"
        placeholder="Search processes..."
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          "border-radius": "4px",
          border: "1px solid #3d3d3d",
          "background-color": "#1e1e1e",
          color: "#ffffff",
          "font-size": "14px",
        }}
      />
    </div>
  );
};

export default SearchBar;
