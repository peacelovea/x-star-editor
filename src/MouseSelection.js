import React from "react";
import { useSelectionContainer } from "./hooks/useSelectionContainer";

const MouseSelection = ({ onSelectionChange }) => {
  const { DragSelection } = useSelectionContainer({
    eventsElement: document.getElementById("root"),
    onSelectionChange,
    onSelectionStart: () => {
      console.log("OnSelectionStart");
    },
    onSelectionEnd: () => console.log("OnSelectionEnd")
  });

  return <DragSelection />;
};

export default React.memo(MouseSelection);
