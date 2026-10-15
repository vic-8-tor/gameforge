const CHOICES = ["rock", "paper", "scissors"];
const ICONS = { rock: "✊", paper: "✋", scissors: "✌️" };
const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };

let wins = 0;
let losses = 0;

const winsEl = document.getElementById("wins");
const lossesEl = document.getElementById("losses");
const bestEl = document.getElementById("best");
const resultEl = document.getElementById("result");

function render() {
  winsEl.textContent = wins;
  lossesEl.textContent = losses;
  bestEl.textContent = getScores().rps || 0;
}

function play(choice) {
  const cpu = CHOICES[Math.floor(Math.random() * CHOICES.length)];
  let outcome;

  if (choice === cpu) {
    outcome = "It's a draw";
  } else if (BEATS[choice] === cpu) {
    wins++;
    outcome = "You win";
    saveScore("rps", wins);
  } else {
    losses++;
    outcome = "You lose";
  }

  resultEl.textContent = `${ICONS[choice]} vs ${ICONS[cpu]}: ${outcome}!`;
  render();
}

document.querySelectorAll("[data-choice]").forEach((btn) => {
  btn.addEventListener("click", () => play(btn.dataset.choice));
});

document.getElementById("resetBtn").addEventListener("click", () => {
  wins = 0;
  losses = 0;
  resultEl.textContent = "Pick your move";
  render();
});

render();
