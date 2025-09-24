// Constants
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
const jumpSound = document.getElementById('jumpSound');

const W = canvas.width;
const H = canvas.height;

let player, obstacles, score, best, spawnTimer, running, gameOver, lastTime;

// Badge mốc điểm
const BADGE_MEMBER = 50;
const BADGE_BUILDER = 150;

// Player class
class Player {
  constructor() {
    this.w = 40;
    this.h = 40;
    this.x = W / 2 - this.w / 2;
    this.y = H - 80;
    this.speed = 6;

    // nhảy
    this.baseY = this.y;
    this.vy = 0;
    this.gravity = 0.6;
    this.jumpPower = -12;
    this.isOnGround = true;
  }

  jump() {
    if (this.isOnGround) {
      this.vy = this.jumpPower;
      this.isOnGround = false;

      // phát âm thanh nhảy
      jumpSound.currentTime = 0;
      jumpSound.play().catch(() => {});
    }
  }

  update() {
    // di chuyển trái/phải
    if (keys['ArrowLeft']) this.x -= this.speed;
    if (keys['ArrowRight']) this.x += this.speed;
    this.x = Math.max(0, Math.min(W - this.w, this.x));

    // nhảy
    this.y += this.vy;
    if (!this.isOnGround) {
      this.vy += this.gravity;
      if (this.y >= this.baseY) {
        this.y = this.baseY;
        this.vy = 0;
        this.isOnGround = true;
      }
    }
  }

  draw() {
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

// Obstacle class
class Obstacle {
  constructor() {
    this.r = 20 + Math.random() * 15;
    this.x = Math.random() * (W - this.r * 2) + this.r;
    this.y = -this.r;
    this.speed = 2 + Math.random() * 2;
    const names = ['RialORCA', 'Chase', 'Jasper', 'Degen'];
    this.label = names[Math.floor(Math.random() * names.length)];
  }
  update(dt) {
    this.y += this.speed * dt * 0.05;
  }
  outOfScreen() {
    return this.y - this.r > H;
  }
  draw() {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.label, this.x, this.y + 4);
  }
}

// Input
let keys = {};
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.code === 'Space') player?.jump();
});
document.addEventListener('keyup', e => keys[e.key] = false);

// Collision check
function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < cr * cr;
}

// Reset game
function resetGame() {
  player = new Player();
  obstacles = [];
  score = 0;
  spawnTimer = 0;
  gameOver = false;
  scoreEl.textContent = 0;
  badgeEl.textContent = '—';
  badgeIcon.hidden = true;
}

// Start game
function startGame() {
  resetGame();
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
  startBtn.disabled = true;
  restartBtn.disabled = true;

  // Nhạc nền
  bgm.currentTime = 0;
  bgm.volume = 0.5;
  bgm.play().catch(() => {});
}

// End game
function endGame() {
  running = false;
  gameOver = true;
  startBtn.disabled = false;
  restartBtn.disabled = false;

  // Dừng nhạc
  bgm.pause();

  // Âm thanh va chạm
  hitSound.currentTime = 0;
  hitSound.play().catch(() => {});

  if (score > best) {
    best = score;
    localStorage.setItem('rialo_best', best);
    bestEl.textContent = best;
  }
}

// Update
function update(dt) {
  if (gameOver) return;

  player.update();

  score += dt * 0.02;
  const s = Math.floor(score);
  scoreEl.textContent = s;

  // Spawn obstacle
  spawnTimer += dt;
  if (spawnTimer > 700 - Math.min(500, s * 2)) {
    spawnTimer = 0;
    const n = Math.random() < 0.12 ? 2 : 1;
    for (let i = 0; i < n; i++) obstacles.push(new Obstacle());
  }

  // Update obstacle
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update(dt);
    if (obstacles[i].outOfScreen()) {
      obstacles.splice(i, 1);
      continue;
    }
    if (circleRectCollision(
      obstacles[i].x, obstacles[i].y, obstacles[i].r,
      player.x, player.y, player.w, player.h
    )) {
      endGame();
    }
  }

  // Badge
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

// Render
function render() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);

  player.draw();
  obstacles.forEach(o => o.draw());
}

// Game loop
function loop(ts) {
  if (!running) return;
  const dt = ts - lastTime;
  lastTime = ts;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

// Buttons
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Load best score
best = parseInt(localStorage.getItem('rialo_best') || '0', 10);
bestEl.textContent = best;
