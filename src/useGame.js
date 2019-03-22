import { useState, useEffect } from "react";
import { createGameService } from "./gameOfLife";

const useGame = initialBoard => {
  const [board, setBoard] = useState(initialBoard);

  useEffect(() => {
    const game = createGameService(setBoard);
    game.start();
    game.send("AUTO");

    return () => game.stop();
  }, []);

  return board;
};

export default useGame;
