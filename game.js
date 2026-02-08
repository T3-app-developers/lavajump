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
    width: 22,
    height: 28,
    platforms: [
      { x: 2, y: 3, w: 4 },
      { x: 10, y: 5, w: 3 },
      { x: 5, y: 8, w: 4 },
      { x: 13.5, y: 10, w: 4 },
      { x: 3, y: 13, w: 3.5 },
      { x: 9, y: 16, w: 3 },
      { x: 15, y: 19, w: 3.5 },
      { x: 6.5, y: 22, w: 4 },
      { x: 12, y: 25, w: 3 },
    ],
    enemies: [
      { x: 6, y: 8, type: "sentry" },
      { x: 14, y: 13, type: "patrol", range: 2.5 },
    ],
    trees: [
      { x: 3.5, y: 3 },
      { x: 11.5, y: 10 },
      { x: 7, y: 22 },
    ],
    coins: [
      { x: 4, y: 4 },
      { x: 12.5, y: 6 },
      { x: 8, y: 14 },
      { x: 15.5, y: 18 },
      { x: 9, y: 24 },
    ],
    volcano: { x: 10.5, y: 15 },
  },
  {
    width: 22,
    height: 34,
    platforms: [
      { x: 2, y: 3, w: 3.5 },
      { x: 8, y: 6, w: 4 },
      { x: 14.5, y: 8, w: 3 },
      { x: 4, y: 11, w: 4 },
      { x: 11, y: 14, w: 3.5 },
      { x: 6, y: 17, w: 4 },
      { x: 13, y: 20, w: 4 },
      { x: 4.5, y: 23, w: 3 },
      { x: 10, y: 26, w: 4 },
      { x: 15, y: 29, w: 3 },
      { x: 7, y: 32, w: 4 },
    ],
    enemies: [
      { x: 9, y: 6, type: "sentry" },
      { x: 13, y: 17, type: "sentry" },
      { x: 5, y: 23, type: "patrol", range: 2 },
    ],
    trees: [
      { x: 3.5, y: 3 },
      { x: 12, y: 14 },
      { x: 6.5, y: 23 },
      { x: 9, y: 32 },
    ],
    coins: [
      { x: 4, y: 4 },
      { x: 15, y: 9 },
      { x: 6.5, y: 18 },
      { x: 12.5, y: 25 },
      { x: 8, y: 33 },
    ],
    volcano: { x: 12.5, y: 19 },
  },
  {
    width: 22,
    height: 40,
    platforms: [
      { x: 3, y: 4, w: 4 },
      { x: 11, y: 7, w: 3.5 },
      { x: 6, y: 10, w: 4 },
      { x: 14.5, y: 13, w: 3 },
      { x: 4, y: 16, w: 3.5 },
      { x: 9, y: 19, w: 4 },
      { x: 15, y: 22, w: 3 },
      { x: 5.5, y: 26, w: 4 },
      { x: 12, y: 29, w: 4 },
      { x: 7, y: 33, w: 3.5 },
      { x: 14, y: 36, w: 3.5 },
      { x: 4.5, y: 38, w: 4 },
    ],
    enemies: [
      { x: 12, y: 7, type: "sentry" },
      { x: 6, y: 16, type: "patrol", range: 2.5 },
      { x: 14, y: 26, type: "sentry" },
      { x: 7, y: 33, type: "patrol", range: 2.5 },
    ],
    trees: [
      { x: 4, y: 4 },
      { x: 9.5, y: 19 },
      { x: 6, y: 26 },
      { x: 14.5, y: 36 },
    ],
    coins: [
      { x: 5, y: 5 },
      { x: 14.5, y: 13 },
      { x: 10, y: 22 },
      { x: 6.5, y: 30 },
      { x: 13, y: 38 },
    ],
    volcano: { x: 9.5, y: 24 },
  },
  {
    width: 22,
    height: 46,
    platforms: [
      { x: 2.5, y: 4, w: 4 },
      { x: 10, y: 7, w: 4 },
      { x: 15, y: 10, w: 3 },
      { x: 6, y: 13, w: 4 },
      { x: 12.5, y: 16, w: 3.5 },
      { x: 4, y: 19, w: 3.5 },
      { x: 9, y: 22, w: 4 },
      { x: 14.5, y: 25, w: 3 },
      { x: 5.5, y: 29, w: 4 },
      { x: 12, y: 32, w: 4 },
      { x: 6.5, y: 36, w: 3.5 },
      { x: 14, y: 39, w: 3.5 },
      { x: 4.5, y: 42, w: 4 },
      { x: 10.5, y: 45, w: 4 },
    ],
    enemies: [
      { x: 11, y: 7, type: "sentry" },
      { x: 4.5, y: 19, type: "patrol", range: 2.5 },
      { x: 14.5, y: 25, type: "sentry" },
      { x: 8, y: 36, type: "patrol", range: 2.5 },
      { x: 13, y: 45, type: "sentry" },
    ],
    trees: [
      { x: 3.5, y: 4 },
      { x: 13, y: 16 },
      { x: 7, y: 29 },
      { x: 11, y: 45 },
    ],
    coins: [
      { x: 5, y: 5 },
      { x: 15.5, y: 11 },
      { x: 10.5, y: 22 },
      { x: 6, y: 33 },
      { x: 12, y: 43 },
      { x: 8.5, y: 46 },
    ],
    volcano: { x: 11, y: 28 },
  },
  {
    width: 22,
    height: 54,
    platforms: [
      { x: 2.5, y: 4, w: 4 },
      { x: 9.5, y: 7, w: 4 },
      { x: 15.5, y: 10, w: 3 },
      { x: 5.5, y: 13, w: 4 },
      { x: 12, y: 16, w: 3.5 },
      { x: 4, y: 19, w: 3.5 },
      { x: 9, y: 22, w: 4 },
      { x: 14.5, y: 25, w: 3 },
      { x: 5.5, y: 28, w: 4 },
      { x: 12, y: 31, w: 4 },
      { x: 6.5, y: 35, w: 3.5 },
      { x: 14, y: 38, w: 3.5 },
      { x: 4.5, y: 42, w: 4 },
      { x: 10.5, y: 45, w: 4 },
      { x: 15.5, y: 48, w: 3 },
      { x: 7, y: 51, w: 4 },
    ],
    enemies: [
      { x: 10.5, y: 7, type: "sentry" },
      { x: 4.5, y: 19, type: "patrol", range: 2.5 },
      { x: 14.5, y: 25, type: "sentry" },
      { x: 8, y: 35, type: "patrol", range: 2.5 },
      { x: 12, y: 45, type: "sentry" },
      { x: 6.5, y: 51, type: "patrol", range: 2 },
    ],
    trees: [
      { x: 3.5, y: 4 },
      { x: 12.5, y: 16 },
      { x: 6.5, y: 28 },
      { x: 10.5, y: 45 },
      { x: 7.5, y: 51 },
    ],
    coins: [
      { x: 5, y: 5 },
      { x: 15.5, y: 11 },
      { x: 10.5, y: 22 },
      { x: 6, y: 33 },
      { x: 12, y: 43 },
      { x: 14.5, y: 49 },
      { x: 8, y: 53 },
    ],
    volcano: { x: 11, y: 30 },
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
  levelHeight: 0,
  levelTop: 0,
  minedTrees: 0,
  wallsBuilt: 0,
};

function toPixels(blocks) {
  return blocks * tileSize;
}

function resetLevel(index) {
  const level = levelData[index];
  state.levelWidth = toPixels(level.width);
  state.levelHeight = toPixels(level.height);
  state.levelTop = groundY - state.levelHeight;
  state.platforms = level.platforms.map((platform) => ({
    x: toPixels(platform.x),
    y: groundY - toPixels(platform.y),
    w: toPixels(platform.w),
    h: 14,
  }));
  state.volcanoPlatforms = createVolcanoPlatforms(
    toPixels(level.volcano.x),
    groundY - toPixels(level.volcano.y)
  );
  state.enemies = level.enemies.map((enemy) => ({
    x: toPixels(enemy.x),
    y: groundY - toPixels(enemy.y) - 52,
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
    x: toPixels(tree.x),
    y: groundY - toPixels(tree.y),
    mined: false,
  }));
  state.boss = {
    x: state.levelWidth - toPixels(4),
    y: state.levelTop + 70,
    lives: 7,
    alive: true,
    state: "idle",
    timer: 0,
    invulnerable: 0,
    vx: 0,
  };
  coins.length = 0;
  level.coins.forEach((coin) => {
    coins.push({
      x: toPixels(coin.x),
      y: groundY - toPixels(coin.y),
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
  }

  player.vy += gravity * delta;
  player.x += player.vx * delta;
  player.y += player.vy * delta;

  player.x = clamp(player.x, 20, state.levelWidth - 60);
  const playerFeet = player.y + playerSize.h;

  player.onGround = false;
  player.onPlatform = false;
  player.onVolcano = false;
  player.onWall = false;

  if (playerFeet >= groundY) {
    player.y = groundY - playerSize.h;
    player.vy = 0;
    player.onGround = true;
  }

  state.platforms.forEach((platform) => {
    if (checkLanding(platform)) {
      player.y = platform.y - playerSize.h;
      player.vy = 0;
      player.onGround = true;
      player.onPlatform = true;
    }
  });

  state.volcanoPlatforms.forEach((platform) => {
    if (checkLanding(platform)) {
      player.y = platform.y - playerSize.h;
      player.vy = 0;
      player.onGround = true;
      player.onVolcano = true;
    }
  });

  buildables.forEach((platform) => {
    if (checkLanding(platform)) {
      player.y = platform.y - playerSize.h;
      player.vy = 0;
      player.onGround = true;
      player.onWall = true;
    }
  });

  if (playerFeet >= groundY + 120) {
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
      (item) =>
        !item.mined &&
        Math.abs(item.x - player.x) < 60 &&
        Math.abs(item.y - player.y) < 80
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
          y: tree.y - 80 - i * 6,
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
      if (state.boss && player.y + playerSize.h >= state.boss.y + 60) {
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

    const inRange =
      Math.abs(enemy.x - player.x) < 320 && Math.abs(enemy.y - player.y) < 220;
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

  if (player.y > state.levelTop + 160) {
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
      y: boss.y + 76,
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
        player.y + playerSize.h > boss.y &&
        player.y < boss.y + 90
      ) {
        loseLife();
      }
    }
    if (boss.timer >= 1.2) {
      boss.state = "idle";
      boss.timer = 0;
    }
  }

  const arenaStart = state.levelWidth - toPixels(7);
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
    const volcano = levelData[currentLevelIndex].volcano;
    const volcanoX = toPixels(volcano.x);
    const volcanoY = groundY - toPixels(volcano.y);
    const closeToVent =
      Math.abs(player.x + playerSize.w / 2 - volcanoX) < 60 &&
      player.y < volcanoY + 40 &&
      player.y + playerSize.h > volcanoY - 90;
    if (closeToVent && !(player.onVolcano || player.onWall)) {
      loseLife();
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
  const bossDefeated = !state.boss || !state.boss.alive;
  if (player.y <= state.levelTop + 40 && bossDefeated) {
    currentLevelIndex += 1;
    if (currentLevelIndex >= levelData.length) {
      gameState = "complete";
    } else {
      resetLevel(currentLevelIndex);
      hud.level.textContent = `Level ${currentLevelIndex + 1}`;
    }
  }
}

function createVolcanoPlatforms(volcanoX, volcanoY) {
  const platforms = [];
  const width = toPixels(4);
  const craterWidth = toPixels(2);
  const leftX = volcanoX - width / 2;
  const rightX = volcanoX + width / 2;
  const stepHeights = [70, 110, 150];

  stepHeights.forEach((height, index) => {
    platforms.push({
      x: leftX + index * 18,
      y: volcanoY - height,
      w: width / 2 - index * 18,
      h: 14,
    });
    platforms.push({
      x: rightX - width / 2,
      y: volcanoY - height,
      w: width / 2 - index * 18,
      h: 14,
    });
  });

  platforms.push({
    x: volcanoX - craterWidth / 2,
    y: volcanoY - 170,
    w: craterWidth,
    h: 12,
  });

  return platforms;
}

function drawBackground(cameraY) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#5db9ff");
  gradient.addColorStop(0.6, "#89d6ff");
  gradient.addColorStop(1, "#d7f6ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  for (let i = 0; i < 4; i += 1) {
    const offset = (i * 240 + cameraY * 0.12) % (canvas.width + 200);
    ctx.beginPath();
    ctx.ellipse(offset, 90 + i * 18, 80, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(offset + 60, 90 + i * 18, 60, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#9bd18c";
  ctx.beginPath();
  ctx.moveTo(0, 360);
  for (let x = -100; x <= canvas.width + 200; x += 120) {
    ctx.quadraticCurveTo(
      x + 60,
      310 + (x % 240 === 0 ? 40 : -20),
      x + 120,
      360
    );
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#6bb56c";
  ctx.beginPath();
  ctx.moveTo(0, 380);
  for (let x = -100; x <= canvas.width + 200; x += 140) {
    ctx.quadraticCurveTo(
      x + 70,
      340 + (x % 280 === 0 ? 30 : -24),
      x + 140,
      380
    );
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function drawGround() {
  ctx.fillStyle = "#3e2723";
  ctx.fillRect(0, groundY, state.levelWidth, state.levelHeight + canvas.height);

  ctx.fillStyle = "#f44336";
  ctx.fillRect(0, groundY + 10, state.levelWidth, state.levelHeight + canvas.height);

  const waveGradient = ctx.createLinearGradient(0, groundY + 10, 0, groundY + 140);
  waveGradient.addColorStop(0, "#ff7043");
  waveGradient.addColorStop(1, "#ffab40");
  ctx.fillStyle = waveGradient;
  for (let x = 0; x < state.levelWidth; x += 24) {
    ctx.beginPath();
    ctx.ellipse(x, groundY + 32, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#4caf50";
  ctx.fillRect(0, groundY - grassHeight, state.levelWidth, grassHeight);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  for (let x = 0; x < state.levelWidth; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, groundY - grassHeight + 2);
    ctx.lineTo(x + 4, groundY - 4);
    ctx.stroke();
  }
}

function drawPlatforms() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  state.platforms.forEach((platform) => {
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.strokeRect(platform.x, platform.y, platform.w, platform.h);
  });
}

function drawTrees() {
  state.trees.forEach((tree, index) => {
    if (tree.mined) {
      return;
    }
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(tree.x, tree.y - 80, 16, 80);
    ctx.fillStyle = "#355e3b";
    ctx.beginPath();
    if (index % 2 === 0) {
      ctx.arc(tree.x + 8, tree.y - 90, 28, 0, Math.PI * 2);
    } else {
      ctx.arc(tree.x, tree.y - 90, 24, 0, Math.PI * 2);
      ctx.arc(tree.x + 22, tree.y - 100, 24, 0, Math.PI * 2);
    }
    ctx.fill();
  });
}

function drawVolcano() {
  const volcano = levelData[currentLevelIndex].volcano;
  const volcanoX = toPixels(volcano.x);
  const volcanoY = groundY - toPixels(volcano.y);
  const baseWidth = toPixels(4);
  const craterWidth = toPixels(2);

  ctx.fillStyle = "#5d4037";
  ctx.beginPath();
  ctx.moveTo(volcanoX - baseWidth / 2, volcanoY + 12);
  ctx.lineTo(volcanoX - craterWidth / 2, volcanoY - 150);
  ctx.lineTo(volcanoX + craterWidth / 2, volcanoY - 150);
  ctx.lineTo(volcanoX + baseWidth / 2, volcanoY + 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#3e2723";
  ctx.fillRect(volcanoX - craterWidth / 2, volcanoY - 162, craterWidth, 18);

  if (volcanoState.erupting) {
    ctx.fillStyle = "#ff9800";
    ctx.beginPath();
    ctx.arc(volcanoX, volcanoY - 170, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 235, 59, 0.8)";
    ctx.beginPath();
    ctx.arc(volcanoX, volcanoY - 170, 34, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawVolcanoPlatforms() {
  state.volcanoPlatforms.forEach((platform) => {
    ctx.fillStyle = "rgba(120, 95, 80, 0.85)";
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
  });
}

function drawBuildables() {
  buildables.forEach((platform) => {
    ctx.fillStyle = "#a1887f";
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < platform.w; i += 20) {
      ctx.fillRect(platform.x + i + 4, platform.y + 4, 10, 2);
    }
  });
}

function drawCoins() {
  coins.forEach((coin) => {
    if (coin.collected) {
      return;
    }
    ctx.save();
    const pulse = 1 + Math.sin(coin.sparkle) * 0.1;
    ctx.translate(coin.x, coin.y);
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

function drawPlayer() {
  ctx.fillStyle = "#1a237e";
  ctx.fillRect(player.x, player.y + 16, playerSize.w, playerSize.h - 16);

  ctx.fillStyle = "#00ff7f";
  ctx.fillRect(player.x + 4, player.y, playerSize.w - 8, 18);

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(player.x + 12, player.y + 8, 2, 0, Math.PI * 2);
  ctx.arc(player.x + 22, player.y + 8, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(player.x + 6, player.y + 30, 22, 4);

  ctx.fillStyle = "#ffffff";
  ctx.font = "12px sans-serif";
  ctx.fillText("P1", player.x + 6, player.y - 6);
}

function drawEnemies() {
  state.enemies.forEach((enemy) => {
    if (!enemy.alive) {
      return;
    }
    ctx.fillStyle = "#263238";
    ctx.fillRect(enemy.x, enemy.y + 16, 36, 36);
    ctx.fillStyle = "#ff7a00";
    ctx.fillRect(enemy.x + 4, enemy.y, 28, 16);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(enemy.x + 12, enemy.y + 26, 8, 4);
    if (enemy.telegraph > 0) {
      ctx.strokeStyle = "#ffe082";
      ctx.beginPath();
      ctx.arc(enemy.x + 18, enemy.y + 20, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function drawBoss() {
  if (!state.boss || !state.boss.alive) {
    return;
  }
  const boss = state.boss;
  ctx.fillStyle = "#4e342e";
  ctx.fillRect(boss.x, boss.y + 24, 110, 66);
  ctx.fillStyle = "#8d6e63";
  ctx.fillRect(boss.x + 12, boss.y, 86, 32);
  ctx.fillStyle = "#ffccbc";
  ctx.fillRect(boss.x + 70, boss.y + 8, 22, 12);
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px sans-serif";
  ctx.fillText("T-REX", boss.x + 18, boss.y - 8);
  if (boss.invulnerable > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.strokeRect(boss.x, boss.y, 110, 90);
  }
}

function drawBullets() {
  ctx.fillStyle = "#fdd835";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, 12, 3);
  });

  ctx.fillStyle = "#ff5252";
  enemyBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, 8, 3);
  });

  ctx.fillStyle = "#80d8ff";
  shockwaves.forEach((wave) => {
    ctx.fillRect(wave.x, wave.y, 40, 4);
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

  const cameraY = clamp(player.y - canvas.height * 0.6, state.levelTop, 0);

  drawBackground(cameraY);
  ctx.save();
  ctx.translate(0, -cameraY);
  drawTrees();
  drawVolcano();
  drawGround();
  drawPlatforms();
  drawVolcanoPlatforms();
  drawBuildables();
  drawCoins();
  drawEnemies();
  drawBoss();
  drawBullets();
  drawPlayer();
  ctx.restore();

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
