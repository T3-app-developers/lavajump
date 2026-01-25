const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hud = {
  level: document.getElementById("level"),
  timer: document.getElementById("timer"),
  coins: document.getElementById("coins"),
  wood: document.getElementById("wood"),
  lives: document.getElementById("lives"),
  enemyLives: document.getElementById("enemy-lives"),
};

const keys = new Set();
let lastTime = 0;
let totalTime = 0;
let currentLevelIndex = 0;
let gameState = "playing";

const gravity = 1800;
const groundY = 420;
const grassHeight = 18;
const playerSize = { w: 34, h: 52 };

const player = {
  x: 120,
  y: groundY - playerSize.h,
  vx: 0,
  vy: 0,
  lives: 3,
  coins: 0,
  wood: 0,
  onGround: false,
};

const buildables = [];
const bullets = [];
const enemyBullets = [];
const coins = [];

const levelData = [
  {
    width: 2000,
    pits: [
      { start: 520, end: 640 },
      { start: 1040, end: 1160 },
    ],
    enemies: [
      { x: 720, y: groundY - 52 },
      { x: 1260, y: groundY - 52 },
    ],
    trees: [
      { x: 320 },
      { x: 860 },
      { x: 1480 },
    ],
    volcano: { x: 1000 },
  },
  {
    width: 2600,
    pits: [
      { start: 420, end: 560 },
      { start: 900, end: 1080 },
      { start: 1580, end: 1760 },
    ],
    enemies: [
      { x: 620, y: groundY - 52 },
      { x: 1220, y: groundY - 52 },
      { x: 1840, y: groundY - 52 },
    ],
    trees: [
      { x: 240 },
      { x: 700 },
      { x: 1340 },
      { x: 2100 },
    ],
    volcano: { x: 1300 },
  },
  {
    width: 3200,
    pits: [
      { start: 480, end: 660 },
      { start: 980, end: 1180 },
      { start: 1560, end: 1760 },
      { start: 2140, end: 2320 },
    ],
    enemies: [
      { x: 740, y: groundY - 52 },
      { x: 1260, y: groundY - 52 },
      { x: 1860, y: groundY - 52 },
      { x: 2460, y: groundY - 52 },
    ],
    trees: [
      { x: 220 },
      { x: 860 },
      { x: 1460 },
      { x: 2020 },
      { x: 2780 },
    ],
    volcano: { x: 1600 },
  },
  {
    width: 3800,
    pits: [
      { start: 520, end: 720 },
      { start: 1120, end: 1340 },
      { start: 1760, end: 1980 },
      { start: 2440, end: 2660 },
      { start: 3000, end: 3200 },
    ],
    enemies: [
      { x: 780, y: groundY - 52 },
      { x: 1440, y: groundY - 52 },
      { x: 2100, y: groundY - 52 },
      { x: 2760, y: groundY - 52 },
    ],
    trees: [
      { x: 300 },
      { x: 980 },
      { x: 1680 },
      { x: 2320 },
      { x: 3120 },
    ],
    volcano: { x: 1900 },
    boss: { x: 3400, y: groundY - 90, lives: 5 },
  },
];

const volcanoState = {
  lastEruption: 0,
  erupting: false,
  duration: 4000,
  interval: 20000,
};

const state = {
  enemies: [],
  trees: [],
  boss: null,
  levelWidth: 2000,
};

function resetLevel(index) {
  const level = levelData[index];
  state.levelWidth = level.width;
  state.enemies = level.enemies.map((enemy) => ({
    ...enemy,
    lives: 3,
    lastShot: 0,
    alive: true,
  }));
  state.trees = level.trees.map((tree) => ({
    ...tree,
    mined: false,
  }));
  state.boss = level.boss
    ? {
        ...level.boss,
        lastShot: 0,
        alive: true,
      }
    : null;
  buildables.length = 0;
  coins.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  player.x = 120;
  player.y = groundY - playerSize.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  volcanoState.lastEruption = totalTime;
  volcanoState.erupting = false;
  hud.enemyLives.textContent = "Enemy Lives: 3";
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

function updatePlayer(delta) {
  const moveLeft = keys.has("ArrowLeft") || keys.has("a");
  const moveRight = keys.has("ArrowRight") || keys.has("d");
  const jump = keys.has("ArrowUp") || keys.has("w");

  if (moveLeft) {
    player.vx = -260;
  } else if (moveRight) {
    player.vx = 260;
  } else {
    player.vx = 0;
  }

  if (jump && player.onGround) {
    player.vy = -620;
    player.onGround = false;
  }

  player.vy += gravity * delta;
  player.x += player.vx * delta;
  player.y += player.vy * delta;

  player.x = clamp(player.x, 20, state.levelWidth - 60);

  const pits = levelData[currentLevelIndex].pits;
  const playerFeet = player.y + playerSize.h;
  const overPit = isOverPit(player.x + playerSize.w / 2, pits);

  if (!overPit && playerFeet >= groundY) {
    player.y = groundY - playerSize.h;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  if (overPit && playerFeet >= groundY + 40) {
    loseLife();
  }

  buildables.forEach((platform) => {
    if (
      player.x + playerSize.w > platform.x &&
      player.x < platform.x + platform.w &&
      player.y + playerSize.h >= platform.y &&
      player.y + playerSize.h <= platform.y + 20 &&
      player.vy >= 0
    ) {
      player.y = platform.y - playerSize.h;
      player.vy = 0;
      player.onGround = true;
    }
  });
}

function loseLife() {
  if (gameState !== "playing") {
    return;
  }
  player.lives -= 1;
  hud.lives.textContent = `Lives: ${player.lives}`;
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
    if (!player.lastShot || totalTime - player.lastShot > 0.4) {
      bullets.push({
        x: player.x + playerSize.w,
        y: player.y + 20,
        vx: 520,
      });
      player.lastShot = totalTime;
    }
  }

  if (keys.has("m")) {
    const tree = state.trees.find(
      (item) => !item.mined && Math.abs(item.x - player.x) < 60
    );
    if (tree) {
      tree.mined = true;
      player.wood += 1;
      hud.wood.textContent = `Wood: ${player.wood}`;
    }
  }

  if (keys.has("b")) {
    if (!player.lastBuild || totalTime - player.lastBuild > 0.4) {
      if (player.wood > 0) {
        buildables.push({
          x: player.x + 40,
          y: player.y - 10,
          w: 100,
          h: 12,
          coinId: buildables.length,
        });
        coins.push({
          x: player.x + 80,
          y: player.y - 40,
          collected: false,
        });
        player.wood -= 1;
        hud.wood.textContent = `Wood: ${player.wood}`;
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
        hud.enemyLives.textContent = `Enemy Lives: ${enemy.lives}`;
      }
    });

    if (state.boss && state.boss.alive) {
      if (
        bullet.x > state.boss.x &&
        bullet.x < state.boss.x + 90 &&
        bullet.y > state.boss.y &&
        bullet.y < state.boss.y + 90
      ) {
        state.boss.lives -= 1;
        bullet.hit = true;
        if (state.boss.lives <= 0) {
          state.boss.alive = false;
        }
        hud.enemyLives.textContent = `Enemy Lives: ${state.boss.lives}`;
      }
    }
  });

  enemyBullets.forEach((bullet) => {
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

  bullets.forEach((bullet) => {
    if (bullet.x > state.levelWidth || bullet.hit) {
      bullet.remove = true;
    }
  });

  enemyBullets.forEach((bullet) => {
    if (bullet.x < 0 || bullet.hit) {
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
}

function updateEnemies(delta) {
  state.enemies.forEach((enemy) => {
    if (!enemy.alive) {
      return;
    }
    if (Math.abs(enemy.x - player.x) < 260) {
      if (totalTime - enemy.lastShot > 1.4) {
        enemyBullets.push({
          x: enemy.x,
          y: enemy.y + 18,
          vx: -400,
        });
        enemy.lastShot = totalTime;
      }
    }
  });

  if (state.boss && state.boss.alive) {
    if (Math.abs(state.boss.x - player.x) < 360) {
      if (totalTime - state.boss.lastShot > 1.2) {
        enemyBullets.push({
          x: state.boss.x,
          y: state.boss.y + 30,
          vx: -520,
        });
        state.boss.lastShot = totalTime;
      }
    }
  }
}

function updateVolcano(delta) {
  if (totalTime - volcanoState.lastEruption > volcanoState.interval / 1000) {
    volcanoState.erupting = true;
    volcanoState.lastEruption = totalTime;
  }
  if (volcanoState.erupting && totalTime - volcanoState.lastEruption > volcanoState.duration / 1000) {
    volcanoState.erupting = false;
  }

  if (volcanoState.erupting) {
    const volcanoX = levelData[currentLevelIndex].volcano.x;
    const distance = Math.abs(player.x - volcanoX);
    if (distance < 80 && player.y + playerSize.h >= groundY - 40) {
      loseLife();
    }
  }
}

function updateCoins() {
  coins.forEach((coin) => {
    if (!coin.collected) {
      if (
        player.x + playerSize.w > coin.x - 10 &&
        player.x < coin.x + 10 &&
        player.y < coin.y + 20 &&
        player.y + playerSize.h > coin.y - 20
      ) {
        coin.collected = true;
        player.coins += 1;
        hud.coins.textContent = `Coins: ${player.coins}`;
      }
    }
  });
}

function updateLevelCompletion() {
  if (player.x >= state.levelWidth - 100) {
    currentLevelIndex += 1;
    if (currentLevelIndex >= levelData.length) {
      gameState = "complete";
    } else {
      resetLevel(currentLevelIndex);
      hud.level.textContent = `Level ${currentLevelIndex + 1}`;
    }
  }
}

function drawBackground(cameraX) {
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--sky");
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--hills");
  ctx.beginPath();
  ctx.moveTo(-cameraX * 0.2, 360);
  for (let x = -100; x <= canvas.width + 100; x += 100) {
    ctx.quadraticCurveTo(
      x + 50 - cameraX * 0.2,
      300 + (x % 200 === 0 ? 40 : -20),
      x + 100 - cameraX * 0.2,
      360
    );
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function drawGround(cameraX) {
  const pits = levelData[currentLevelIndex].pits;
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--dirt");
  ctx.fillRect(-cameraX, groundY, state.levelWidth, canvas.height - groundY);

  pits.forEach((pit) => {
    ctx.clearRect(pit.start - cameraX, groundY, pit.end - pit.start, canvas.height - groundY);
    ctx.fillStyle = "#ff5722";
    ctx.fillRect(pit.start - cameraX, groundY, pit.end - pit.start, canvas.height - groundY);
  });

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--grass");
  ctx.fillRect(-cameraX, groundY - grassHeight, state.levelWidth, grassHeight);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  for (let x = -cameraX; x < state.levelWidth - cameraX; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, groundY - grassHeight + 2);
    ctx.lineTo(x, groundY - 4);
    ctx.stroke();
  }
}

function drawTrees(cameraX) {
  state.trees.forEach((tree, index) => {
    if (tree.mined) {
      return;
    }
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--trunk");
    ctx.fillRect(tree.x - cameraX, groundY - 110, 16, 80);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--tree");
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
  ctx.fillStyle = "#5d4037";
  ctx.beginPath();
  ctx.moveTo(volcano.x - 80 - cameraX, groundY - 10);
  ctx.lineTo(volcano.x - cameraX, groundY - 140);
  ctx.lineTo(volcano.x + 80 - cameraX, groundY - 10);
  ctx.closePath();
  ctx.fill();

  if (volcanoState.erupting) {
    ctx.fillStyle = "#ff9800";
    ctx.beginPath();
    ctx.arc(volcano.x - cameraX, groundY - 150, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#2e7d32";
  ctx.fillRect(volcano.x + 80 - cameraX, groundY - 70, 20, 60);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--tree");
  ctx.beginPath();
  ctx.arc(volcano.x + 90 - cameraX, groundY - 80, 18, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatforms(cameraX) {
  buildables.forEach((platform) => {
    ctx.fillStyle = "#a1887f";
    ctx.fillRect(platform.x - cameraX, platform.y, platform.w, platform.h);
  });
}

function drawCoins(cameraX) {
  coins.forEach((coin) => {
    if (coin.collected) {
      return;
    }
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(coin.x - cameraX, coin.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer(cameraX) {
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--player-body");
  ctx.fillRect(player.x - cameraX, player.y + 16, playerSize.w, playerSize.h - 16);

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--player-head");
  ctx.fillRect(player.x - cameraX + 4, player.y, playerSize.w - 8, 18);

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(player.x - cameraX + 12, player.y + 8, 2, 0, Math.PI * 2);
  ctx.arc(player.x - cameraX + 22, player.y + 8, 2, 0, Math.PI * 2);
  ctx.fill();

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
    ctx.fillStyle = "#ef5350";
    ctx.fillRect(enemy.x - cameraX + 4, enemy.y, 28, 16);
  });

  if (state.boss && state.boss.alive) {
    ctx.fillStyle = "#4e342e";
    ctx.fillRect(state.boss.x - cameraX, state.boss.y + 20, 90, 70);
    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(state.boss.x - cameraX + 10, state.boss.y, 70, 30);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("T-REX", state.boss.x - cameraX + 14, state.boss.y - 8);
  }
}

function drawBullets(cameraX) {
  ctx.fillStyle = "#fdd835";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x - cameraX, bullet.y, 8, 4);
  });

  ctx.fillStyle = "#ff5252";
  enemyBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x - cameraX, bullet.y, 8, 4);
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

  if (gameState === "playing") {
    handleInputActions();
    updatePlayer(delta);
    updateEnemies(delta);
    updateBullets(delta);
    updateVolcano(delta);
    updateCoins();
    updateLevelCompletion();
  }

  const cameraX = clamp(player.x - canvas.width / 3, 0, state.levelWidth - canvas.width);

  drawBackground(cameraX);
  drawTrees(cameraX);
  drawVolcano(cameraX);
  drawGround(cameraX);
  drawPlatforms(cameraX);
  drawCoins(cameraX);
  drawEnemies(cameraX);
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
