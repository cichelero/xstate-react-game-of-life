import { Machine, interpret, actions } from "xstate";

const { send } = actions;

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
  neighbourCount(i, j, ctx.getStateValue()) < 2;
const overpopulation = (i, j) => (ctx, event) =>
  neighbourCount(i, j, ctx.getStateValue()) > 3;
const reproduction = (i, j) => (ctx, event) =>
  neighbourCount(i, j, ctx.getStateValue()) === 3;

const boardMachine = {
  id: "boardMachine",
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
                  EVOLVE: [
                    { target: "dead", cond: underpopulation(i, j) },
                    { target: "dead", cond: overpopulation(i, j) }
                  ]
                }
              },
              dead: {
                on: {
                  EVOLVE: {
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
};

const pulse = {
  id: "pulse",
  initial: "manual",
  states: {
    manual: {
      on: {
        AUTO: "auto",
        STEP: {
          actions: send("EVOLVE")
        }
      }
    },
    auto: {
      after: {
        1000: "auto"
      },
      onExit: send("EVOLVE"),
      on: {
        MANUAL: "manual"
      }
    }
  }
};

const gameMachine = Machine({
  id: "game",
  type: "parallel",
  states: {
    pulse,
    board: boardMachine
  }
});

export const createGameService = onBoardChange => {
  const getStateValue = () => gameService.state.value.board;

  const gameMachineWithState = gameMachine.withContext({ getStateValue });

  const gameService = interpret(gameMachineWithState).onTransition(() => {
    // console.log("state.value", state.value)
    onBoardChange(stateToBoard(getStateValue()));
  });

  return gameService;
};
