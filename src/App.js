import React, { Component } from "react";
import { createGameService, initialBoard } from "./gameOfLife";

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.gameService = createGameService(newBoard =>
      this.setState({ board: newBoard })
    );

    this.state = {
      board: initialBoard
    };
  }

  componentDidMount() {
    this.gameService.start();
  }

  componentWillUnmount() {
    this.gameService.stop();
  }

  render() {
    return (
      <div className="App">
        {this.state.board.map((row, i) => (
          <div key={i} className="Row">
            {row.map((value, j) => (
              <div key={j} className={"Cell " + (value ? "alive" : "dead")} />
            ))}
          </div>
        ))}
      </div>
    );
  }
}

export default App;
