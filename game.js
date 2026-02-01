const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hud = {
  level: document.getElementById("level"),
  timer: document.getElementById("timer"),
  eruption: document.getElementById("eruption"),
  coins: document.getElementById("coins"),
  wood: document.getElementById("wood"),
  lives: document.getElementById("lives"),
  enemies: document.getElementById("enemies"),
  boss: document.getElementById("boss-lives"),
};

const keys = new Set();
let lastTime = 0;
let totalTime = 0;
let currentLevelIndex = 0;
let gameState = "playing";

const gravity = 2000;
const tileSize = 40;
const groundY = 420;
const grassHeight = 18;
const playerSize = { w: 34, h: 52 };

const player = {
  x: 120,
  y: groundY - playerSize.h,
  vx: 0,
  vy: 0,
  facing: 1,
  lives: 3,
  coins: 0,
  wood: 0,
  onGround: false,
  onPlatform: false,
  onVolcano: false,
  onWall: false,
  lastShot: 0,
  lastBuild: 0,
};

const bullets = [];
const enemyBullets = [];
const coins = [];
const buildables = [];
const shockwaves = [];

const levelData = [
  {
    blocks: 22,
    pits: [
      { start: 9, end: 11 },
      { start: 16, end: 18 },
    ],
    platforms: [
      { x: 6, y: 290, w: 3 },
      { x: 12.5, y: 260, w: 2 },
    ],
    enemies: [
      { x: 8, type: "sentry" },
      { x: 18.5, type: "patrol", range: 3 },
    ],
    trees: [3, 10.5, 19],
    coins: [5, 7.5, 13, 20.5],
    volcano: { x: 12 },
  },
  {
    blocks: 30,
    pits: [
      { start: 6, end: 8 },
      { start: 12, end: 15 },
      { start: 20, end: 22 },
    ],
    platforms: [
      { x: 4, y: 300, w: 3 },
      { x: 10, y: 260, w: 2.5 },
      { x: 17, y: 280, w: 3 },
    ],
    enemies: [
      { x: 7.5, type: "sentry" },
      { x: 15.5, type: "sentry" },
      { x: 24, type: "patrol", range: 4 },
    ],
    trees: [2.5, 9, 17.5, 26],
    coins: [4, 11, 14.5, 23, 28],
    volcano: { x: 15 },
  },
  {
    blocks: 40,
    pits: [
      { start: 8, end: 11 },
      { start: 14, end: 17 },
      { start: 22, end: 25 },
      { start: 30, end: 33 },
    ],
    platforms: [
      { x: 6, y: 300, w: 3 },
      { x: 12, y: 260, w: 3 },
      { x: 20, y: 250, w: 2 },
      { x: 28, y: 280, w: 4 },
    ],
    enemies: [
      { x: 9.5, type: "sentry" },
      { x: 16, type: "sentry" },
      { x: 24.5, type: "patrol", range: 3 },
      { x: 34, type: "sentry" },
    ],
    trees: [3, 10.5, 18, 26, 35],
    coins: [5.5, 13, 19.5, 27.5, 37],
    volcano: { x: 20 },
  },
  {
    blocks: 50,
    pits: [
      { start: 10, end: 13 },
      { start: 18, end: 21 },
      { start: 26, end: 29 },
      { start: 34, end: 37 },
      { start: 42, end: 45 },
    ],
    platforms: [
      { x: 7, y: 300, w: 4 },
      { x: 16, y: 250, w: 3 },
      { x: 24, y: 290, w: 4 },
      { x: 32, y: 260, w: 3 },
      { x: 40, y: 280, w: 4 },
    ],
    enemies: [
      { x: 12, type: "sentry" },
      { x: 21, type: "patrol", range: 4 },
      { x: 29.5, type: "sentry" },
      { x: 38, type: "sentry" },
      { x: 46, type: "patrol", range: 3 },
    ],
    trees: [4, 13.5, 22.5, 31, 40.5],
    coins: [6.5, 17, 25.5, 33.5, 43, 48],
    volcano: { x: 25 },
  },
  {
    blocks: 60,
    pits: [
      { start: 12, end: 15 },
      { start: 20, end: 24 },
      { start: 28, end: 31 },
      { start: 36, end: 39 },
      { start: 44, end: 47 },
      { start: 52, end: 55 },
    ],
    platforms: [
      { x: 8, y: 300, w: 4 },
      { x: 16.5, y: 260, w: 3 },
      { x: 26, y: 280, w: 3 },
      { x: 34, y: 240, w: 4 },
      { x: 42, y: 300, w: 4 },
      { x: 50, y: 260, w: 4 },
    ],
    enemies: [
      { x: 13.5, type: "sentry" },
      { x: 23.5, type: "sentry" },
      { x: 31.5, type: "patrol", range: 4 },
      { x: 41, type: "sentry" },
      { x: 53, type: "patrol", range: 4 },
    ],
    trees: [5, 14.5, 24.5, 33.5, 43.5, 55],
    coins: [7, 18.5, 27.5, 36, 46.5, 58],
    volcano: { x: 30 },
  },
];

const volcanoState = {
  lastEruption: 0,
  erupting: false,
  duration: 3.5,
  interval: 20,
};

const state = {
  enemies: [],
  trees: [],
  platforms: [],
  volcanoPlatforms: [],
  boss: null,
  levelWidth: 2000,
  minedTrees: 0,
  wallsBuilt: 0,
  jumpStart: null,
  jumpOverPit: false,
};

function toPixels(blocks) {
  return blocks * tileSize;
}

function resetLevel(index) {
  const level = levelData[index];
  state.levelWidth = toPixels(level.blocks);
  state.platforms = level.platforms.map((platform) => ({
    x: toPixels(platform.x),
    y: platform.y,
    w: toPixels(platform.w),
    h: 14,
  }));
  state.volcanoPlatforms = createVolcanoPlatforms(toPixels(level.volcano.x));
  state.enemies = level.enemies.map((enemy) => ({
    x: toPixels(enemy.x),
    y: groundY - 52,
    type: enemy.type,
    range: enemy.range ? toPixels(enemy.range) : 0,
    direction: enemy.type === "patrol" ? 1 : 0,
    home: toPixels(enemy.x),
    lastShot: 0,
    lives: 3,
    alive: true,
    telegraph: 0,
  }));
  state.trees = level.trees.map((tree) => ({
    x: toPixels(tree),
    mined: false,
  }));
  state.boss = {
    x: state.levelWidth - toPixels(4),
    y: groundY - 90,
    lives: 7,
    alive: true,
    state: "idle",
    timer: 0,
    invulnerable: 0,
    vx: 0,
  };
  coins.length = 0;
  level.coins.forEach((coinX) => {
    coins.push({
      x: toPixels(coinX),
      y: groundY - 120,
      collected: false,
      sparkle: Math.random() * Math.PI * 2,
    });
  });
  buildables.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  shockwaves.length = 0;
  player.x = 120;
  player.y = groundY - playerSize.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.onPlatform = false;
  player.onVolcano = false;
  player.onWall = false;
  state.minedTrees = 0;
  state.wallsBuilt = 0;
  state.jumpStart = null;
  state.jumpOverPit = false;
  volcanoState.lastEruption = totalTime;
  volcanoState.erupting = false;
  updateHud();
}

function updateHud() {
  hud.coins.textContent = `Coins: ${player.coins}`;
  hud.wood.textContent = `Wood: ${player.wood}`;
  hud.lives.textContent = `Lives: ${player.lives}`;
  const aliveEnemies = state.enemies.filter((enemy) => enemy.alive).length;
  hud.enemies.textContent = `Enemies: ${aliveEnemies}`;
  if (state.boss && state.boss.alive) {
    hud.boss.textContent = `Boss Lives: ${state.boss.lives}`;
  } else {
    hud.boss.textContent = "Boss Lives: 0";
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function isOverPit(x, pits) {
  return pits.some((pit) => x >= pit.start && x <= pit.end);
}

function getSurfaceYAt(x) {
  let surfaceY = groundY;
  state.platforms.forEach((platform) => {
    if (x >= platform.x && x <= platform.x + platform.w) {
      surfaceY = Math.min(surfaceY, platform.y);
    }
  });
  state.volcanoPlatforms.forEach((platform) => {
    if (x >= platform.x && x <= platform.x + platform.w) {
      surfaceY = Math.min(surfaceY, platform.y);
    }
  });
  buildables.forEach((platform) => {
    if (x >= platform.x && x <= platform.x + platform.w) {
      surfaceY = Math.min(surfaceY, platform.y);
    }
  });
  return surfaceY;
}

function checkLanding(platform) {
  return (
    player.x + playerSize.w > platform.x &&
    player.x < platform.x + platform.w &&
    player.y + playerSize.h >= platform.y &&
    player.y + playerSize.h <= platform.y + 20 &&
    player.vy >= 0
  );
}

function updatePlayer(delta) {
  const moveLeft = keys.has("ArrowLeft") || keys.has("a");
  const moveRight = keys.has("ArrowRight") || keys.has("d");
  const jump = keys.has("ArrowUp") || keys.has("w");

  if (moveLeft) {
    player.vx = -260;
    player.facing = -1;
  } else if (moveRight) {
    player.vx = 260;
    player.facing = 1;
  } else {
    player.vx = 0;
  }

  if (jump && player.onGround) {
    player.vy = -640;
    player.onGround = false;
    const pits = levelData[currentLevelIndex].pits.map((pit) => ({
      start: toPixels(pit.start),
      end: toPixels(pit.end),
    }));
    const nearPit = pits.some(
      (pit) =>
        Math.abs(player.x - pit.start) < 50 ||
        Math.abs(player.x + playerSize.w - pit.end) < 50
    );
    if (nearPit) {
      state.jumpStart = { x: player.x, y: player.y };
      state.jumpOverPit = true;
    }
  }

  player.vy += gravity * delta;
  player.x += player.vx * delta;
  player.y += player.vy * delta;

  player.x = clamp(player.x, 20, state.levelWidth - 60);

  const pits = levelData[currentLevelIndex].pits.map((pit) => ({
    start: toPixels(pit.start),
    end: toPixels(pit.end),
  }));
  const playerFeet = player.y + playerSize.h;
  const overPit = isOverPit(player.x + playerSize.w / 2, pits);

  player.onGround = false;
  player.onPlatform = false;
  player.onVolcano = false;
  player.onWall = false;

  if (!overPit && playerFeet >= groundY) {
    player.y = groundY - playerSize.h;
    player.vy = 0;
    player.onGround = true;
    state.jumpOverPit = false;
  }

  state.platforms.forEach((platform) => {
    if (checkLanding(platform)) {
      player.y = platform.y - playerSize.h;
      player.vy = 0;
      player.onGround = true;
      player.onPlatform = true;
      state.jumpOverPit = false;
    }
  });

  state.volcanoPlatforms.forEach((platform) => {
    if (checkLanding(platform)) {
      player.y = platform.y - playerSize.h;
      player.vy = 0;
      player.onGround = true;
      player.onVolcano = true;
      state.jumpOverPit = false;
    }
  });

  buildables.forEach((platform) => {
    if (checkLanding(platform)) {
      player.y = platform.y - playerSize.h;
      player.vy = 0;
      player.onGround = true;
      player.onWall = true;
      state.jumpOverPit = false;
    }
  });

  if (overPit && playerFeet >= groundY + 40) {
    loseLife();
  }
}

function loseLife() {
  if (gameState !== "playing") {
    return;
  }
  player.lives -= 1;
  updateHud();
  if (player.lives <= 0) {
    gameState = "gameover";
    return;
  }
  player.x = 120;
  player.y = groundY - playerSize.h;
  player.vx = 0;
  player.vy = 0;
}

function handleInputActions() {
  if (keys.has("x")) {
    if (!player.lastShot || totalTime - player.lastShot > 0.3) {
      bullets.push({
        x: player.x + (player.facing === 1 ? playerSize.w : -10),
        y: player.y + 24,
        vx: 740 * player.facing,
      });
      player.lastShot = totalTime;
    }
  }

  if (keys.has("m")) {
    const tree = state.trees.find(
      (item) => !item.mined && Math.abs(item.x - player.x) < 60
    );
    if (tree && (!tree.lastMined || totalTime - tree.lastMined > 0.6)) {
      tree.mined = true;
      tree.lastMined = totalTime;
      state.minedTrees += 1;
      player.coins += 3;
      player.wood = Math.floor(state.minedTrees / 2) - state.wallsBuilt;
      for (let i = 0; i < 3; i += 1) {
        coins.push({
          x: tree.x + i * 16,
          y: groundY - 140 - i * 6,
          collected: false,
          sparkle: Math.random() * Math.PI * 2,
        });
      }
      updateHud();
    }
  }

  if (keys.has("b")) {
    if (!player.lastBuild || totalTime - player.lastBuild > 0.6) {
      if (player.wood > 0 && player.onGround) {
        const buildX = Math.round((player.x + player.facing * 40) / 20) * 20;
        const surfaceY = getSurfaceYAt(buildX + 40);
        const wall = {
          x: buildX,
          y: surfaceY - 60,
          w: 120,
          h: 18,
          safe: true,
        };
        buildables.push(wall);
        for (let i = 0; i < 3; i += 1) {
          coins.push({
            x: wall.x + 20 + i * 30,
            y: wall.y - 20,
            collected: false,
            sparkle: Math.random() * Math.PI * 2,
          });
        }
        player.wood -= 1;
        state.wallsBuilt += 1;
        updateHud();
      }
      player.lastBuild = totalTime;
    }
  }
}

function updateBullets(delta) {
  bullets.forEach((bullet) => {
    bullet.x += bullet.vx * delta;
  });

  enemyBullets.forEach((bullet) => {
    bullet.x += bullet.vx * delta;
  });

  bullets.forEach((bullet) => {
    state.enemies.forEach((enemy) => {
      if (!enemy.alive) {
        return;
      }
      if (
        bullet.x > enemy.x &&
        bullet.x < enemy.x + 36 &&
        bullet.y > enemy.y &&
        bullet.y < enemy.y + 52
      ) {
        enemy.lives -= 1;
        bullet.hit = true;
        if (enemy.lives <= 0) {
          enemy.alive = false;
        }
      }
    });

    if (state.boss && state.boss.alive && state.boss.invulnerable <= 0) {
      if (
        bullet.x > state.boss.x &&
        bullet.x < state.boss.x + 110 &&
        bullet.y > state.boss.y &&
        bullet.y < state.boss.y + 90
      ) {
        state.boss.lives -= 1;
        bullet.hit = true;
        state.boss.invulnerable = 0.4;
        if (state.boss.lives <= 0) {
          state.boss.alive = false;
        }
      }
    }
  });

  enemyBullets.forEach((bullet) => {
    const safeZone = player.onVolcano || player.onWall;
    if (safeZone) {
      return;
    }
    if (
      bullet.x > player.x &&
      bullet.x < player.x + playerSize.w &&
      bullet.y > player.y &&
      bullet.y < player.y + playerSize.h
    ) {
      bullet.hit = true;
      loseLife();
    }
  });

  shockwaves.forEach((wave) => {
    wave.x += wave.vx * delta;
    if (!wave.hit && Math.abs(wave.x - (player.x + playerSize.w / 2)) < 24) {
      if (player.y + playerSize.h >= groundY - 16) {
        wave.hit = true;
        loseLife();
      }
    }
  });

  bullets.forEach((bullet) => {
    if (bullet.x > state.levelWidth || bullet.x < 0 || bullet.hit) {
      bullet.remove = true;
    }
  });

  enemyBullets.forEach((bullet) => {
    if (bullet.x < 0 || bullet.x > state.levelWidth || bullet.hit) {
      bullet.remove = true;
    }
  });

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    if (bullets[i].remove) {
      bullets.splice(i, 1);
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    if (enemyBullets[i].remove) {
      enemyBullets.splice(i, 1);
    }
  }

  for (let i = shockwaves.length - 1; i >= 0; i -= 1) {
    if (shockwaves[i].x < 0 || shockwaves[i].x > state.levelWidth) {
      shockwaves.splice(i, 1);
    }
  }
}

function updateEnemies(delta) {
  state.enemies.forEach((enemy) => {
    if (!enemy.alive) {
      return;
    }

    if (enemy.type === "patrol") {
      enemy.x += enemy.direction * 80 * delta;
      if (Math.abs(enemy.x - enemy.home) > enemy.range) {
        enemy.direction *= -1;
      }
    }

    const inRange = Math.abs(enemy.x - player.x) < 320;
    if (inRange && totalTime - enemy.lastShot > 1.6) {
      enemy.telegraph = 0.2;
      enemy.lastShot = totalTime;
    }

    if (enemy.telegraph > 0) {
      enemy.telegraph -= delta;
      if (enemy.telegraph <= 0) {
        enemyBullets.push({
          x: enemy.x,
          y: enemy.y + 22,
          vx: enemy.x > player.x ? -520 : 520,
        });
      }
    }
  });
}

function updateBoss(delta) {
  if (!state.boss || !state.boss.alive) {
    return;
  }
  const boss = state.boss;
  boss.invulnerable = Math.max(0, boss.invulnerable - delta);

  const arenaStart = state.levelWidth - toPixels(7);
  if (player.x < arenaStart) {
    return;
  }

  boss.timer += delta;

  if (boss.state === "idle" && boss.timer > 2) {
    const attacks = ["shockwave", "charge", "bite"];
    boss.state = attacks[Math.floor(Math.random() * attacks.length)];
    boss.timer = 0;
  }

  if (boss.state === "shockwave" && boss.timer > 0.6) {
    shockwaves.push({
      x: boss.x + 40,
      y: groundY - 12,
      vx: player.x < boss.x ? -420 : 420,
      hit: false,
    });
    boss.state = "idle";
    boss.timer = 0;
  }

  if (boss.state === "charge") {
    if (boss.timer < 0.4) {
      boss.vx = 0;
    } else if (boss.timer < 1.3) {
      boss.vx = player.x < boss.x ? -460 : 460;
      boss.x += boss.vx * delta;
    } else {
      boss.vx = 0;
      boss.state = "idle";
      boss.timer = 0;
    }
  }

  if (boss.state === "bite") {
    if (boss.timer > 0.4 && boss.timer < 0.8) {
      const direction = player.x < boss.x ? -1 : 1;
      boss.x += direction * 160 * delta;
      if (
        player.x + playerSize.w > boss.x &&
        player.x < boss.x + 100 &&
        player.y + playerSize.h > boss.y
      ) {
        loseLife();
      }
    }
    if (boss.timer >= 1.2) {
      boss.state = "idle";
      boss.timer = 0;
    }
  }

  boss.x = clamp(boss.x, arenaStart, state.levelWidth - 140);
}

function updateVolcano(delta) {
  if (totalTime - volcanoState.lastEruption > volcanoState.interval) {
    volcanoState.erupting = true;
    volcanoState.lastEruption = totalTime;
  }
  if (volcanoState.erupting && totalTime - volcanoState.lastEruption > volcanoState.duration) {
    volcanoState.erupting = false;
  }

  if (volcanoState.erupting) {
    if (state.jumpOverPit && !player.onGround) {
      if (state.jumpStart) {
        loseLife();
        player.x = state.jumpStart.x;
        player.y = state.jumpStart.y;
        player.vx = 0;
        player.vy = 0;
      }
      state.jumpOverPit = false;
    }
  }
}

function updateCoins(delta) {
  coins.forEach((coin) => {
    if (coin.collected) {
      return;
    }
    coin.sparkle += delta * 4;
    if (
      player.x + playerSize.w > coin.x - 10 &&
      player.x < coin.x + 10 &&
      player.y < coin.y + 20 &&
      player.y + playerSize.h > coin.y - 20
    ) {
      coin.collected = true;
      player.coins += 1;
      updateHud();
    }
  });
}

function updateLevelCompletion() {
  if (player.x >= state.levelWidth - 140) {
    currentLevelIndex += 1;
    if (currentLevelIndex >= levelData.length) {
      gameState = "complete";
    } else {
      resetLevel(currentLevelIndex);
      hud.level.textContent = `Level ${currentLevelIndex + 1}`;
    }
  }
}

function createVolcanoPlatforms(volcanoX) {
  const platforms = [];
  const width = toPixels(4);
  const craterWidth = toPixels(2);
  const leftX = volcanoX - width / 2;
  const rightX = volcanoX + width / 2;
  const stepHeights = [70, 110, 150];

  stepHeights.forEach((height, index) => {
    platforms.push({
      x: leftX + index * 18,
      y: groundY - height,
      w: width / 2 - index * 18,
      h: 14,
    });
    platforms.push({
      x: rightX - width / 2,
      y: groundY - height,
      w: width / 2 - index * 18,
      h: 14,
    });
  });

  platforms.push({
    x: volcanoX - craterWidth / 2,
    y: groundY - 170,
    w: craterWidth,
    h: 12,
  });

  return platforms;
}

function drawBackground(cameraX) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#5db9ff");
  gradient.addColorStop(0.6, "#89d6ff");
  gradient.addColorStop(1, "#d7f6ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  for (let i = 0; i < 4; i += 1) {
    const offset = (i * 240 - cameraX * 0.15) % (canvas.width + 200);
    ctx.beginPath();
    ctx.ellipse(offset, 90 + i * 12, 80, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(offset + 60, 90 + i * 12, 60, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#9bd18c";
  ctx.beginPath();
  ctx.moveTo(-cameraX * 0.25, 360);
  for (let x = -100; x <= canvas.width + 200; x += 120) {
    ctx.quadraticCurveTo(
      x + 60 - cameraX * 0.25,
      310 + (x % 240 === 0 ? 40 : -20),
      x + 120 - cameraX * 0.25,
      360
    );
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#6bb56c";
  ctx.beginPath();
  ctx.moveTo(-cameraX * 0.4, 380);
  for (let x = -100; x <= canvas.width + 200; x += 140) {
    ctx.quadraticCurveTo(
      x + 70 - cameraX * 0.4,
      340 + (x % 280 === 0 ? 30 : -24),
      x + 140 - cameraX * 0.4,
      380
    );
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function drawGround(cameraX) {
  ctx.fillStyle = "#3e2723";
  ctx.fillRect(-cameraX, groundY, state.levelWidth, canvas.height - groundY);

  const pits = levelData[currentLevelIndex].pits.map((pit) => ({
    start: toPixels(pit.start),
    end: toPixels(pit.end),
  }));

  pits.forEach((pit) => {
    ctx.fillStyle = "#f44336";
    ctx.fillRect(pit.start - cameraX, groundY, pit.end - pit.start, canvas.height - groundY);

    const waveGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    waveGradient.addColorStop(0, "#ff7043");
    waveGradient.addColorStop(1, "#ffab40");
    ctx.fillStyle = waveGradient;
    for (let x = pit.start - cameraX; x < pit.end - cameraX; x += 20) {
      ctx.beginPath();
      ctx.ellipse(x, groundY + 12, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.fillStyle = "#4caf50";
  ctx.fillRect(-cameraX, groundY - grassHeight, state.levelWidth, grassHeight);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  for (let x = -cameraX; x < state.levelWidth - cameraX; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, groundY - grassHeight + 2);
    ctx.lineTo(x + 4, groundY - 4);
    ctx.stroke();
  }
}

function drawPlatforms(cameraX) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  state.platforms.forEach((platform) => {
    ctx.fillRect(platform.x - cameraX, platform.y, platform.w, platform.h);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.strokeRect(platform.x - cameraX, platform.y, platform.w, platform.h);
  });
}

function drawTrees(cameraX) {
  state.trees.forEach((tree, index) => {
    if (tree.mined) {
      return;
    }
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(tree.x - cameraX, groundY - 110, 16, 80);
    ctx.fillStyle = "#355e3b";
    ctx.beginPath();
    if (index % 2 === 0) {
      ctx.arc(tree.x + 8 - cameraX, groundY - 120, 28, 0, Math.PI * 2);
    } else {
      ctx.arc(tree.x - cameraX, groundY - 120, 24, 0, Math.PI * 2);
      ctx.arc(tree.x + 22 - cameraX, groundY - 130, 24, 0, Math.PI * 2);
    }
    ctx.fill();
  });
}

function drawVolcano(cameraX) {
  const volcano = levelData[currentLevelIndex].volcano;
  const volcanoX = toPixels(volcano.x);
  const baseWidth = toPixels(4);
  const craterWidth = toPixels(2);

  ctx.fillStyle = "#5d4037";
  ctx.beginPath();
  ctx.moveTo(volcanoX - baseWidth / 2 - cameraX, groundY - 8);
  ctx.lineTo(volcanoX - craterWidth / 2 - cameraX, groundY - 170);
  ctx.lineTo(volcanoX + craterWidth / 2 - cameraX, groundY - 170);
  ctx.lineTo(volcanoX + baseWidth / 2 - cameraX, groundY - 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#3e2723";
  ctx.fillRect(volcanoX - craterWidth / 2 - cameraX, groundY - 182, craterWidth, 18);

  if (volcanoState.erupting) {
    ctx.fillStyle = "#ff9800";
    ctx.beginPath();
    ctx.arc(volcanoX - cameraX, groundY - 190, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 235, 59, 0.8)";
    ctx.beginPath();
    ctx.arc(volcanoX - cameraX, groundY - 190, 34, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawVolcanoPlatforms(cameraX) {
  state.volcanoPlatforms.forEach((platform) => {
    ctx.fillStyle = "rgba(120, 95, 80, 0.85)";
    ctx.fillRect(platform.x - cameraX, platform.y, platform.w, platform.h);
  });
}

function drawBuildables(cameraX) {
  buildables.forEach((platform) => {
    ctx.fillStyle = "#a1887f";
    ctx.fillRect(platform.x - cameraX, platform.y, platform.w, platform.h);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < platform.w; i += 20) {
      ctx.fillRect(platform.x - cameraX + i + 4, platform.y + 4, 10, 2);
    }
  });
}

function drawCoins(cameraX) {
  coins.forEach((coin) => {
    if (coin.collected) {
      return;
    }
    ctx.save();
    const pulse = 1 + Math.sin(coin.sparkle) * 0.1;
    ctx.translate(coin.x - cameraX, coin.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffecb3";
    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.lineTo(4, -1);
    ctx.stroke();
    ctx.restore();
  });
}

function drawPlayer(cameraX) {
  ctx.fillStyle = "#1a237e";
  ctx.fillRect(player.x - cameraX, player.y + 16, playerSize.w, playerSize.h - 16);

  ctx.fillStyle = "#00ff7f";
  ctx.fillRect(player.x - cameraX + 4, player.y, playerSize.w - 8, 18);

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(player.x - cameraX + 12, player.y + 8, 2, 0, Math.PI * 2);
  ctx.arc(player.x - cameraX + 22, player.y + 8, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(player.x - cameraX + 6, player.y + 30, 22, 4);

  ctx.fillStyle = "#ffffff";
  ctx.font = "12px sans-serif";
  ctx.fillText("P1", player.x - cameraX + 6, player.y - 6);
}

function drawEnemies(cameraX) {
  state.enemies.forEach((enemy) => {
    if (!enemy.alive) {
      return;
    }
    ctx.fillStyle = "#263238";
    ctx.fillRect(enemy.x - cameraX, enemy.y + 16, 36, 36);
    ctx.fillStyle = "#ff7a00";
    ctx.fillRect(enemy.x - cameraX + 4, enemy.y, 28, 16);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(enemy.x - cameraX + 12, enemy.y + 26, 8, 4);
    if (enemy.telegraph > 0) {
      ctx.strokeStyle = "#ffe082";
      ctx.beginPath();
      ctx.arc(enemy.x - cameraX + 18, enemy.y + 20, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function drawBoss(cameraX) {
  if (!state.boss || !state.boss.alive) {
    return;
  }
  const boss = state.boss;
  ctx.fillStyle = "#4e342e";
  ctx.fillRect(boss.x - cameraX, boss.y + 24, 110, 66);
  ctx.fillStyle = "#8d6e63";
  ctx.fillRect(boss.x - cameraX + 12, boss.y, 86, 32);
  ctx.fillStyle = "#ffccbc";
  ctx.fillRect(boss.x - cameraX + 70, boss.y + 8, 22, 12);
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px sans-serif";
  ctx.fillText("T-REX", boss.x - cameraX + 18, boss.y - 8);
  if (boss.invulnerable > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.strokeRect(boss.x - cameraX, boss.y, 110, 90);
  }
}

function drawBullets(cameraX) {
  ctx.fillStyle = "#fdd835";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x - cameraX, bullet.y, 12, 3);
  });

  ctx.fillStyle = "#ff5252";
  enemyBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x - cameraX, bullet.y, 8, 3);
  });

  ctx.fillStyle = "#80d8ff";
  shockwaves.forEach((wave) => {
    ctx.fillRect(wave.x - cameraX, wave.y, 40, 4);
  });
}

function drawMessage(text) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "28px sans-serif";
  ctx.fillText(text, canvas.width / 2 - 160, canvas.height / 2);
}

function gameLoop(timestamp) {
  const delta = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;
  if (gameState === "playing") {
    totalTime += delta;
  }

  hud.timer.textContent = formatTime(totalTime);
  const eruptionLeft = volcanoState.interval - (totalTime - volcanoState.lastEruption);
  const safeTimer = Math.max(0, eruptionLeft);
  hud.eruption.textContent = `Eruption: ${safeTimer.toFixed(1)}s`;
  hud.eruption.classList.toggle("hud__alert", safeTimer < 4);

  if (gameState === "playing") {
    handleInputActions();
    updatePlayer(delta);
    updateEnemies(delta);
    updateBoss(delta);
    updateBullets(delta);
    updateVolcano(delta);
    updateCoins(delta);
    updateLevelCompletion();
    updateHud();
  }

  const cameraX = clamp(player.x - canvas.width / 3, 0, state.levelWidth - canvas.width);

  drawBackground(cameraX);
  drawTrees(cameraX);
  drawVolcano(cameraX);
  drawGround(cameraX);
  drawPlatforms(cameraX);
  drawVolcanoPlatforms(cameraX);
  drawBuildables(cameraX);
  drawCoins(cameraX);
  drawEnemies(cameraX);
  drawBoss(cameraX);
  drawBullets(cameraX);
  drawPlayer(cameraX);

  if (gameState === "gameover") {
    drawMessage("Game Over");
  }

  if (gameState === "complete") {
    drawMessage("You Win!");
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

resetLevel(currentLevelIndex);
requestAnimationFrame(gameLoop);
