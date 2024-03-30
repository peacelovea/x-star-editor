import React, { useCallback, useEffect, useRef, useState } from "react";
import { boxesIntersect, useSelectionContainer } from "./index";
import "./styles.css";  
const MouseSelection = React.memo(({ onSelectionChange }) => {
  const { DragSelection } = useSelectionContainer({
    eventsElement: document.getElementById("root"),
    onSelectionChange,
    onSelectionStart: () => {
      console.log("OnSelectionStart");
    },
    onSelectionEnd: () => console.log("OnSelectionEnd")
  });

  return <DragSelection />;
});

const App = () => {
  const [selectionBox, setSelectionBox] = useState(); // 鼠标框选区域的位置信息
  const [selectedIndexes, setSelectedIndexes] = useState([]); // 鼠标框选矩形的索引
  const selectableItems = useRef([]); // 容器区域的位置信息

  // 初始化时候存储容器中每个矩形区域的位置信息
  useEffect(() => {
    const elementsContainer = document.getElementById("elements-container");
    if (elementsContainer) {
      Array.from(elementsContainer.childNodes).forEach((item) => {
        //   getBoundingClientRect是获取元素相对于视口的位置信息
        const { left, top, width, height } = item.getBoundingClientRect();
        selectableItems.current.push({
          left,
          top,
          width,
          height
        });
      });
    }
  }, []);

  // 框选时的处理函数
  const handleSelectionChange = useCallback(
    (box) => {
        console.log(box,'box')
      //   box是框选区域的位置信息
      setSelectionBox(box);
      const indexesToSelect = [];
      selectableItems.current.forEach((item, index) => {
        if (boxesIntersect(box, item)) {
          indexesToSelect.push(index);
        }
      });

      // 更新框选区域
      setSelectedIndexes(indexesToSelect);
    },
    [selectableItems]
  );

  return (
    <div className="container">
      <MouseSelection onSelectionChange={handleSelectionChange} />
      <div id="elements-container" className="elements-container">
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            className={`element ${
              selectedIndexes.includes(i) ? "selected" : ""
            } `}
          />
        ))}
      </div>

      <div className="selection-box-info">
        Selection Box:
        <div>top: {selectionBox?.top || ""}</div>
        <div>left: {selectionBox?.left || ""}</div>
        <div>width: {selectionBox?.width || ""}</div>
        <div>height: {selectionBox?.height || ""}</div>
      </div>
    </div>
  );
};

export default App;
