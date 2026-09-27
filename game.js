'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins ─────────────────────────────────────────────────────────────────────
// Cada skin define línea, llama del propulsor y silueta propia.
// `tail` es la x donde arranca la llama en espacio local de la nave.
// `scale` amplía la nave (tamaño y colisión); `pointsMult` multiplica los puntos.
const SKINS = [
  { name: 'CLÁSICA',  stroke: '#fff', scale: 1, pointsMult: 1,
    flame: 'rgba(255, 130, 0, 0.85)', tail: -8,
    verts: [[20, 0], [-12, -9], [-7, 0], [-12, 9]] },
  { name: 'FLECHA',   stroke: '#4ff', scale: 1, pointsMult: 1,
    flame: 'rgba(120, 255, 160, 0.85)', tail: -6,
    verts: [[22, 0], [-9, -5], [-4, 0], [-9, 5]] },
  { name: 'DELTA',    stroke: '#ffd24a', scale: 1, pointsMult: 1,
    flame: 'rgba(255, 190, 60, 0.85)', tail: -8,
    verts: [[19, 0], [-14, -12], [-8, 0], [-14, 12]] },
  { name: 'DIAMANTE', stroke: '#ff6cf5', scale: 1, pointsMult: 1,
    flame: 'rgba(255, 108, 245, 0.85)', tail: -13,
    verts: [[21, 0], [0, -8], [-14, 0], [0, 8]] },
  { name: 'MORADA',   stroke: '#a855f7', scale: 2, pointsMult: 2,
    flame: 'rgba(168, 85, 247, 0.85)', tail: -12,
    verts: [[23, 0], [-10, -15], [-16, 0], [-10, 15]] },
];

const SKIN_KEY = 'asteroids.skin';
let currentSkin = 0;

function loadSkin() {
  try {
    const i = parseInt(localStorage.getItem(SKIN_KEY), 10);
    if (Number.isInteger(i) && i >= 0 && i < SKINS.length) currentSkin = i;
  } catch (e) { /* storage no disponible */ }
}

function saveSkin() {
  try { localStorage.setItem(SKIN_KEY, String(currentSkin)); }
  catch (e) { /* storage no disponible */ }
}

function stepSkin(dir) {
  currentSkin = wrap(currentSkin + dir, SKINS.length);
  // El tamaño de la nave depende de la skin: se aplica al instante
  if (ship) ship.radius = SHIP_RADIUS * skinScale();
  saveSkin();
}

const skinScale  = () => SKINS[currentSkin].scale;
const pointsMult = () => SKINS[currentSkin].pointsMult;

loadSkin();

function strokePoly(pts, scale = 1) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0] * scale, pts[0][1] * scale);
  for (let i = 1; i < pts.length; i++)
    ctx.lineTo(pts[i][0] * scale, pts[i][1] * scale);
  ctx.closePath();
  ctx.stroke();
}

// ── Ship ──────────────────────────────────────────────────────────────────────
const SHIP_RADIUS = 12;   // radio base de colisión (se amplía con skin.scale)

class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = SHIP_RADIUS * skinScale();
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;   // power-up Velocidad activo
    this.shieldTimer   = 0;   // power-up Escudo activo
    this.tripleTimer   = 0;   // power-up Triple Shot activo
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.shieldTimer   > 0) this.shieldTimer   -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const MULT   = this.speedTimer > 0 ? 2 : 1;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * MULT * dt;
      this.vy += Math.sin(this.angle) * THRUST * MULT * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const scale = skinScale();
    const NOSE = 21 * scale;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleTimer > 0) {
      // 3 balas paralelas: misma dirección, desplazadas en perpendicular
      const OFFSET = 8 * scale;
      const px = Math.cos(this.angle + Math.PI / 2) * OFFSET;
      const py = Math.sin(this.angle + Math.PI / 2) * OFFSET;
      return [
        new Bullet(ox - px, oy - py, this.angle),
        new Bullet(ox,      oy,      this.angle),
        new Bullet(ox + px, oy + py, this.angle),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;

    // Burbuja del escudo (se dibuja aunque la nave parpadee)
    if (this.shieldTimer > 0) {
      const alpha = 0.45 + 0.35 * Math.sin(this.shieldTimer * 6);
      ctx.save();
      ctx.strokeStyle = `rgba(187, 102, 255, ${alpha.toFixed(2)})`;   // #b6f
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 22 * skinScale(), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[currentSkin];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(skin.scale, skin.scale);   // naves más grandes (p. ej. MORADA x2)
    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth   = 1.5 / skin.scale;  // mismo grosor visual que el resto
    ctx.lineJoin    = 'round';

    // Silueta de la skin activa
    strokePoly(skin.verts);

    // Llama del propulsor (cian con power-up Velocidad activo)
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(skin.tail, -4);
      ctx.lineTo(skin.tail - rand(6, 14), 0);
      ctx.lineTo(skin.tail,  4);
      ctx.strokeStyle = this.speedTimer > 0
        ? 'rgba(0, 255, 255, 0.9)'
        : skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Power-up (Velocidad / Escudo / Triple Shot) ───────────────────────────────
const POWERUPS = {
  speed:  { color: '#4ff', duration: 5 },
  shield: { color: '#b6f', duration: 6 },
  triple: { color: '#f6a', duration: 5 },
};

class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x = x;
    this.y = y;
    this.type = type;      // 'speed' | 'shield' | 'triple'
    this.radius = 14;
    this.ttl = 8;          // vida en pantalla
    this.rot = rand(0, Math.PI * 2);
    this.dead = false;
  }

  update(dt) {
    this.rot += 1.5 * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en los últimos 2 s
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = POWERUPS[this.type].color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    if (this.type === 'shield') {
      // Anillo interior
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === 'triple') {
      // Triple Shot: 3 puntos en línea recta
      ctx.fillStyle = POWERUPS[this.type].color;
      for (const dx of [-5, 0, 5]) {
        ctx.beginPath();
        ctx.arc(dx, 0, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Chevron central
      ctx.beginPath();
      ctx.moveTo(-4, -6);
      ctx.lineTo( 5,  0);
      ctx.lineTo(-4,  6);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const STAR_POINTS = 150;   // puntos por destruirla

class ShootingStar {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.ttl  = 5;         // desaparece a los 5 s
    this.life = 5;
    this.dead = false;

    const speed = rand(200, 260);   // más rápida que cualquier asteroide
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-2.5, 2.5);
    this.rot = rand(0, Math.PI * 2);

    // Polígono de 4 puntas (radio externo / interno alternados)
    this.verts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? this.radius : this.radius * 0.38;
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }

    this.trail = [];       // estela de partículas doradas
    this.trailTimer = 0;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;

    // Estela: un punto nuevo cada 0.03 s, vive 0.5 s
    this.trailTimer += dt;
    if (this.trailTimer >= 0.03) {
      this.trailTimer = 0;
      const last = this.trail[this.trail.length - 1];
      // Si dio la vuelta al borde, cortar la estela
      if (last && Math.hypot(this.x - last.x, this.y - last.y) > 100)
        this.trail.length = 0;
      this.trail.push({ x: this.x, y: this.y, age: 0 });
    }
    for (const t of this.trail) t.age += dt;
    this.trail = this.trail.filter(t => t.age < 0.5);
  }

  draw() {
    if (this.ttl < 1 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.globalAlpha = Math.min(1, this.ttl / 2);   // fundido en los últimos 2 s

    // Estela
    for (const t of this.trail) {
      const k = 1 - t.age / 0.5;
      ctx.fillStyle = `rgba(255, 210, 74, ${(k * 0.7).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * 0.45 * k, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.shadowColor = 'rgba(255, 190, 60, 0.9)';
    ctx.shadowBlur  = 12;
    ctx.strokeStyle  = '#ffd24a';
    ctx.fillStyle    = 'rgba(255, 210, 74, 0.35)';
    ctx.lineWidth    = 1.5;
    ctx.lineJoin     = 'round';

    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles;
let powerUps;
let shootingStars;
let powerUpSpawnTimer, starSpawnTimer;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover' | 'skins'
let stateBeforeSkins = 'playing';
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnPowerUp() {
  const SAFE_DIST = 130;
  let x, y;
  do {
    x = rand(0, W);
    y = rand(0, H);
  } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
  const keys = Object.keys(POWERUPS);
  const type = keys[Math.floor(Math.random() * keys.length)];
  powerUps.push(new PowerUp(x, y, type));
}

function spawnShootingStar() {
  const SAFE_DIST = 120;
  // Entra por un borde aleatorio apuntando hacia el lado opuesto
  const side = randInt(0, 3);
  let x = 0, y = 0, angle = 0;
  for (let i = 0; i < 10; i++) {
    if (side === 0)      { x = rand(0, W); y = 0; angle =  Math.PI / 2 + rand(-0.5, 0.5); }
    else if (side === 1) { x = W; y = rand(0, H); angle = Math.PI + rand(-0.5, 0.5); }
    else if (side === 2) { x = rand(0, W); y = H; angle = -Math.PI / 2 + rand(-0.5, 0.5); }
    else                 { x = 0; y = rand(0, H); angle = rand(-0.5, 0.5); }
    if (Math.hypot(x - ship.x, y - ship.y) >= SAFE_DIST) break;
  }
  shootingStars.push(new ShootingStar(x, y, angle));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  shootingStars = [];
  powerUpSpawnTimer = 8;
  starSpawnTimer = rand(10, 16);
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  shootingStars = [];
  powerUpSpawnTimer = 8;
  starSpawnTimer = rand(10, 16);
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Selector de skins: pausa el juego mientras está abierto
  if (state !== 'skins' && pressed('KeyS')) {
    stateBeforeSkins = state;
    state = 'skins';
    // Descarta pulsaciones viejas de las teclas del panel
    ['ArrowLeft', 'ArrowRight', 'Space', 'Escape'].forEach(c => {
      justPressed[c] = false;
    });
    return;
  }

  if (state === 'skins') {
    if (pressed('ArrowLeft'))  stepSkin(-1);
    if (pressed('ArrowRight')) stepSkin(1);
    // Se evalúan por separado para consumir las tres aunque una sea true
    const okSpace   = pressed('Space');
    const okEscape  = pressed('Escape');
    const okKeyS    = pressed('KeyS');
    if (okSpace || okEscape || okKeyS) state = stateBeforeSkins;
    return;
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  // Spawn periódico de power-ups
  powerUpSpawnTimer -= dt;
  if (powerUpSpawnTimer <= 0) {
    if (powerUps.length === 0) spawnPowerUp();
    powerUpSpawnTimer = rand(10, 16);
  }

  // Spawn periódico de estrellas fugaces
  starSpawnTimer -= dt;
  if (starSpawnTimer <= 0) {
    spawnShootingStar();
    starSpawnTimer = rand(12, 20);
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  shootingStars.forEach(s => s.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps  = powerUps.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Nave vs power-up
  for (const p of powerUps) {
    if (dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      const def = POWERUPS[p.type];
      ship[`${p.type}Timer`] = def.duration;
      explode(p.x, p.y, 6);
    }
  }
  powerUps = powerUps.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size] * pointsMult();
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz (no se parte: desaparece con una sola bala)
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += STAR_POINTS * pointsMult();
        explode(s.x, s.y, 12);
      }
    }
  }
  shootingStars = shootingStars.filter(s => !s.dead);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide (el escudo los vaporiza sin dañar la nave)
  if (ship.invincible <= 0) {
    const shielded = ship.shieldTimer > 0;
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (shielded) {
          a.dead = true;
          explode(a.x, a.y, a.size * 4);
        } else {
          killShip();
          break;
        }
      }
    }

    // Nave vs estrella fugaz
    if (!ship.dead) {
      for (const s of shootingStars) {
        if (dist(ship, s) < ship.radius + s.radius * 0.82) {
          if (shielded) {
            s.dead = true;
            explode(s.x, s.y, 10);
          } else {
            killShip();
            break;
          }
        }
      }
    }
  }

  // Limpieza de objetos vaporizados por el escudo
  asteroids     = asteroids.filter(a => !a.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[currentSkin];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.stroke;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  strokePoly(skin.verts, 0.45 / skin.scale);   // tamaño fijo en el HUD
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  let statusY = 48;
  if (ship.speedTimer > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4ff';
    ctx.fillText(`VELOCIDAD ${ship.speedTimer.toFixed(1)}s`, 14, statusY);
    statusY += 22;
  }
  if (ship.shieldTimer > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#b6f';
    ctx.fillText(`ESCUDO ${ship.shieldTimer.toFixed(1)}s`, 14, statusY);
    statusY += 22;
  }

  if (ship.tripleTimer > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f6a';
    ctx.fillText(`TRIPLE ${ship.tripleTimer.toFixed(1)}s`, 14, statusY);
    statusY += 22;
  }

  const skin = SKINS[currentSkin];
  if (skin.pointsMult > 1) {
    ctx.textAlign = 'left';
    ctx.fillStyle = skin.stroke;
    ctx.fillText(`${skin.pointsMult}X PUNTOS`, 14, statusY);
    statusY += 22;
  }

  ctx.textAlign   = 'left';
  ctx.font        = '12px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.4)';
  ctx.fillText('S  SKINS', 14, H - 14);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function drawSkinMenu() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 34px monospace';
  ctx.fillText('ELIGE TU SKIN', W / 2, 92);

  const CELL = 76;
  const GAP  = 40;
  const total = SKINS.length * CELL + (SKINS.length - 1) * GAP;
  let x = W / 2 - total / 2 + CELL / 2;
  const y = H / 2 - 16;

  for (let i = 0; i < SKINS.length; i++) {
    const skin = SKINS[i];
    const sel  = i === currentSkin;

    if (sel) {
      ctx.strokeStyle = '#4ff';
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(x - CELL / 2, y - CELL / 2, CELL, CELL);
    }

    // Vista previa de la silueta (nariz arriba), siempre del mismo tamaño en pantalla
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = sel ? skin.stroke : 'rgba(255,255,255,0.3)';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    strokePoly(skin.verts, 1.6 / skin.scale);
    ctx.restore();

    ctx.font      = sel ? 'bold 15px monospace' : '13px monospace';
    ctx.fillStyle = sel ? '#4ff' : 'rgba(255,255,255,0.5)';
    ctx.fillText(skin.name, x, y + CELL / 2 + 24);

    if (skin.pointsMult > 1) {
      ctx.font      = sel ? 'bold 13px monospace' : '12px monospace';
      ctx.fillStyle = sel ? skin.stroke : 'rgba(255,255,255,0.35)';
      ctx.fillText(`${skin.pointsMult}X PUNTOS`, x, y + CELL / 2 + 44);
    }

    x += CELL + GAP;
  }

  ctx.font      = '15px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('← →  CAMBIAR       ESPACIO / ESC / S  CONFIRMAR',
               W / 2, H - 74);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font      = '13px monospace';
  ctx.fillText(`SKIN ACTIVA: ${SKINS[currentSkin].name}`, W / 2, H - 46);

  ctx.restore();
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  shootingStars.forEach(s => s.draw());
  bullets.forEach(b => b.draw());
  powerUps.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);

  if (state === 'skins')
    drawSkinMenu();
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
