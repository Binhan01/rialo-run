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

// Player
const player = {
  x: canvas.width/2 - 20,
  y: canvas.height - 60,
  w: 40,
  h: 40,
  speed: 5,
  update() {
    if (keys['ArrowLeft'] && this.x > 0) this.x -= this.speed;
    if (keys['ArrowRight'] && this.x + this.w < canvas.width) this.x += this.speed;
    ctx.fillStyle = 'white';
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
};

const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Obstacles
class Obstacle {
  constructor(name, x, y, r, speed, color) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.r = r;
    this.speed = speed;
    this.color = color;
  }
  update(dt) {
    this.y += this.speed * dt/16;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
    ctx.fill();
    
    // Optional: draw name above obstacle
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, this.x, this.y - this.r - 5);
  }
  outOfScreen() { return this.y - this.r > canvas.height; }
}

function spawnObstacle() {
  const names = ['RialORCA','Chase','Jasper','Degen'];
  const colors = ['red','blue','yellow','purple'];
  const idx = Math.floor(Math.random() * names.length);
  const x = Math.random() * (canvas.width-30) + 15;
  const r = 15;
  const speed = 2 + Math.random() * 2;
  obstacles.push(new Obstacle(names[idx], x, -r, r, speed, colors[idx]));
}

// Collision helper
function circleRectCollision(cx, cy, r, rx, ry, rw, rh) {
  const distX = Math.abs(cx - rx - rw/2);
  const distY = Math.abs(cy - ry - rh/2);
  if(distX > (rw/2 + r) || distY > (rh/2 + r)) return false;
  if(distX <= (rw/2) || distY <= (rh/2)) return true;
  const dx = distX - rw/2;
  const dy = distY - rh/2;
  return dx*dx + dy*dy <= r*r;
}

// Game functions
function resetGame() {
  score = 0;
  obstacles = [];
  spawnTimer = 0;
  gameOver = false;
  player.x = canvas.width/2 - player.w/2;
}

function startGame() {
  resetGame();
  running = true;
  requestAnimationFrame(loop);
  startBtn.disabled = true;
  restartBtn.disabled = true;

  bgm.currentTime = 0;
  bgm.volume = 0.5;
  bgm.play().catch(()=>{});
}

function endGame() {
  running = false;
  gameOver = true;
  startBtn.disabled = false;
  restartBtn.disabled = false;

  bgm.pause();
  hitSound.currentTime = 0;
  hitSound.play().catch(()=>{});

  if(score > best){
    best = score;
    localStorage.setItem('rialo_best', best);
    bestEl.textContent = best;
  }
}

// Update game state
function update(dt){
  if(gameOver) return;

  player.update();

  score += dt*0.02;
  const s = Math.floor(score);
  scoreEl.textContent = s;

  spawnTimer += dt;
  if(spawnTimer > 700 - Math.min(500, s*2)){
    spawnTimer = 0;
    const n = Math.random()<0.12?2:1;
    for(let i=0;i<n;i++) spawnObstacle();
  }

  for(let i=obstacles.length-1;i>=0;i--){
    obstacles[i].update(dt);
    if(obstacles[i].outOfScreen()){
      obstacles.splice(i,1);
      continue;
    }
    if(circleRectCollision(obstacles[i].x, obstacles[i].y, obstacles[i].r,
                           player.x, player.y, player.w, player.h)){
      endGame();
    }
  }

  // badges
  if(s >= BADGE_BUILDER){
    badgeEl.textContent = 'Builder 🛠️';
    badgeIcon.src = 'assets/badge-builder.svg';
    badgeIcon.hidden = false;
  } else if(s >= BADGE_MEMBER){
    badgeEl.textContent = 'Rialo Club Member ⭐';
    badgeIcon.src = 'assets/badge-member.svg';
    badgeIcon.hidden = false;
  } else {
    badgeEl.textContent = '—';
    badgeIcon.hidden = true;
  }
}

// Game loop
let lastTime = performance.now();
function loop(timestamp){
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  update(dt);

  if(running) requestAnimationFrame(loop);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
