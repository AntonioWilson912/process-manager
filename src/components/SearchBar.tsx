import { Component } from "solid-js";

interface SearchBarProps {
  value: string;
  onInput: (value: string) => void;
}

export const SearchBar: Component<SearchBarProps> = (props) => {
  return (
    <div class="search-bar">
      <input
        type="text"
        placeholder="Search processes..."
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
      />
    </div>
  );
};
