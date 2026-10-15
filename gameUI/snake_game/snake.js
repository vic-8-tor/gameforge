const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const CELL = 20;
const CELLS = canvas.width / CELL;
const SPEED = 120; // ms per move

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");

let snake, dir, nextDir, food, score, timer;

const KEYS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function start() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  placeFood();
  clearInterval(timer);
  timer = setInterval(tick, SPEED);
  messageEl.textContent = "Use arrow keys or W A S D";
  startBtn.textContent = "Restart";
  updateScore();
  draw();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * CELLS),
      y: Math.floor(Math.random() * CELLS),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
}

function tick() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  const hitWall = head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS;
  const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);
  if (hitWall || hitSelf) return gameOver();

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    placeFood();
    updateScore();
  } else {
    snake.pop();
  }
  draw();
}

function gameOver() {
  clearInterval(timer);
  saveScore("snake", score);
  updateScore();
  messageEl.textContent = `Game over! You scored ${score}.`;
  startBtn.textContent = "Play again";
}

function updateScore() {
  scoreEl.textContent = score;
  bestEl.textContent = getScores().snake || 0;
}

function draw() {
  ctx.fillStyle = "#08142b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ff4d7d";
  ctx.fillRect(food.x * CELL, food.y * CELL, CELL - 2, CELL - 2);

  snake.forEach((part, i) => {
    ctx.fillStyle = i === 0 ? "#a855f7" : "#4d7cff";
    ctx.fillRect(part.x * CELL, part.y * CELL, CELL - 2, CELL - 2);
  });
}

document.addEventListener("keydown", (e) => {
  const next = KEYS[e.key];
  if (!next) return;
  e.preventDefault(); // stop arrow keys from scrolling the page
  if (!dir) return; // game not started yet
  const isReverse = next.x === -dir.x && next.y === -dir.y;
  if (!isReverse) nextDir = next;
});

startBtn.addEventListener("click", start);

// Idle screen before the first game
score = 0;
snake = [];
food = { x: -1, y: -1 };
updateScore();
draw();
