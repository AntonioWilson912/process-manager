import { Component } from "solid-js";

interface PlaceholderProps {
  title: string;
}

const Placeholder: Component<PlaceholderProps> = (props) => {
  return (
    <div
      style={{
        display: "flex",
        "justify-content": "center",
        "align-items": "center",
        height: "100%",
        "font-size": "24px",
        color: "#888",
      }}
    >
      {props.title} - Not Implemented
    </div>
  );
};

export default Placeholder;
