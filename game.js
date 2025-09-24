const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const badgeEl = document.getElementById('badge');
const badgeIcon = document.getElementById('badgeIcon');

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const bgm = document.getElementById('bgm');
const hitSound = document.getElementById('hitSound');

let running = false;
let gameOver = false;
let score = 0;
let best = parseInt(localStorage.getItem('rialo_best') || 0);

let obstacles = [];
let spawnTimer = 0;

const BADGE_MEMBER = 50;
const BADGE_BUILDER = 150;

function resetGame() {
  score = 0;
  obstacles = [];
  spawnTimer = 0;
  gameOver = false;
}

function startGame() {
  resetGame();
  running = true;
  requestAnimationFrame(loop);
  startBtn.disabled = true;
  restartBtn.disabled = true;

  bgm.currentTime = 0;
  bgm.volume = 0.5;
  bgm.play().catch(() => {});
}

function endGame() {
  running = false;
  gameOver = true;
  startBtn.disabled = false;
  restartBtn.disabled = false;

  bgm.pause();
  hitSound.currentTime = 0;
  hitSound.play().catch(() => {});

  if (score > best) {
    best = score;
    localStorage.setItem('rialo_best', best);
    bestEl.textContent = best;
  }
}

function update(dt) {
  if (gameOver) return;

  score += dt * 0.02;
  const s = Math.floor(score);
  scoreEl.textContent = s;

  spawnTimer += dt;
  if (spawnTimer > 700 - Math.min(500, s * 2)) {
    spawnTimer = 0;
    spawnObstacle();
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update(dt);
    if (obstacles[i].outOfScreen()) {
      obstacles.splice(i, 1);
      continue;
    }
    if (circleRectCollision(obstacles[i].x, obstacles[i].y, obstacles[i].r,
                            player.x, player.y, player.w, player.h)) {
      endGame();
    }
  }

  if (s >= BADGE_BUILDER) {
    badgeEl.textContent = 'Builder 🛠️';
    badgeIcon.src = 'assets/badge-builder.svg';
    badgeIcon.hidden = false;
  } else if (s >= BADGE_MEMBER) {
    badgeEl.textContent = 'Rialo Club Member ⭐';
    badgeIcon.src = 'assets/badge-member.svg';
    badgeIcon.hidden = false;
  } else {
    badgeEl.textContent = '—';
    badgeIcon.hidden = true;
  }
}

function loop(timestamp) {
  if (!running) return;
  requestAnimationFrame(loop);

  // ... game render logic
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
