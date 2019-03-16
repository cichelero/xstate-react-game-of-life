import React from "react";
import { initialBoard } from "./gameOfLife";
import useGame from "./useGame";

import "./App.css";

const App = () => {
  const board = useGame(initialBoard);

  return (
    <div className="App">
      {board.map((row, i) => (
        <div key={i} className="Row">
          {row.map((value, j) => (
            <div key={j} className={"Cell " + (value ? "alive" : "dead")} />
          ))}
        </div>
      ))}
    </div>
  );
};
export default App;
