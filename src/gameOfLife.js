import { Machine, interpret } from "xstate";

const range = n => {
  const iter = (n, acc) => (n === 0 ? acc : iter(n - 1, [n, ...acc]));
  return iter(n, []);
};

const withPadding = padding => board => {
  const rows = range(board.length + 2 * padding);
  const columns = range(board[0].length + 2 * padding);

  return rows.map(i =>
    columns.map(
      j =>
        (board[i - padding - 1] && board[i - padding - 1][j - padding - 1]) || 0
    )
  );
};

// A pulsar
// export const initialBoard = [[0, 1, 0], [0, 1, 0], [0, 1, 0]];

// An example with inifinite growth
export const initialBoard = withPadding(10)([
  [1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0],
  [0, 0, 0, 1, 1],
  [0, 1, 1, 0, 1],
  [1, 0, 1, 0, 1]
]);

const cellId = (i, j) => `cell_${i}_${j}`;

const stateToBoard = stateValue =>
  initialBoard.map((initialRow, i) =>
    initialRow.map((initialValue, j) =>
      stateValue[cellId(i, j)] === "alive" ? 1 : 0
    )
  );

const neighbourCount = (i, j, stateValue) =>
  [
    cellId(i - 1, j - 1),
    cellId(i - 1, j),
    cellId(i - 1, j + 1),
    cellId(i, j - 1),
    cellId(i, j + 1),
    cellId(i + 1, j - 1),
    cellId(i + 1, j),
    cellId(i + 1, j + 1)
  ].reduce((acc, id) => (stateValue[id] === "alive" ? acc + 1 : acc), 0);

const underpopulation = (i, j) => (ctx, event) =>
  neighbourCount(i, j, event.stateValue) < 2;
const overpopulation = (i, j) => (ctx, event) =>
  neighbourCount(i, j, event.stateValue) > 3;
const reproduction = (i, j) => (ctx, event) =>
  neighbourCount(i, j, event.stateValue) === 3;

const gameMachine = Machine({
  id: "game",
  type: "parallel",
  states: initialBoard.reduce(
    (acc, initialRow, i) => ({
      ...acc,
      ...initialRow.reduce(
        (acc, initialValue, j) => ({
          ...acc,
          [cellId(i, j)]: {
            initial: initialValue ? "alive" : "dead",
            states: {
              alive: {
                on: {
                  PLAY: [
                    { target: "dead", cond: underpopulation(i, j) },
                    { target: "dead", cond: overpopulation(i, j) }
                  ]
                }
              },
              dead: {
                on: {
                  PLAY: {
                    target: "alive",
                    cond: reproduction(i, j)
                  }
                }
              }
            }
          }
        }),
        {}
      )
    }),
    {}
  )
});

let times = 0;
console.time(`iteration ${0}`);

export const createGameService = onBoardChange => {
  const gameService = interpret(gameMachine).onTransition(state => {
    onBoardChange(stateToBoard(state.value));

    console.timeEnd(`iteration ${times}`);

    requestAnimationFrame(() =>
      setTimeout(() => {
        times++;
        console.time(`iteration ${times}`);
        gameService.send({ type: "PLAY", stateValue: state.value });
      }, 1000)
    );
  });

  return gameService;
};
