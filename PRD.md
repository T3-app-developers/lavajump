# Lava Jump — Product Requirements Document (PRD)
Version: 1.2 (Gameplay decisions)  
Owner: Creative Director (Pete)  
Delivery Lead: Executive Producer (EP) + Producer/PM  
Status: Updated draft for MDT alignment

## Change log (v1.2)
Gameplay decisions locked for MVP:
- Player laser is fixed horizontal only (fires in facing direction).
- Enemy behavior split into Sentry Shooter (majority) and Patroller Shooter (minority).
- Boss moveset locked to 3 attacks: stomp shockwave, charge, bite lunge.
- Mining uses a dedicated Interact input (separate from Shoot).
- Wall creation is player-placed with placement constraints.
- Coins are primarily score/collection in MVP; unlocks are post-MVP.
- Add eruption timer UI element for fairness/readability.

## Change log (v1.1)
Integrated Creative Director gameplay requirements:
- Coin collection, laser shooting (X), enemy shooters, 5 fixed levels with scaling sizes
- T-Rex boss in every level with 7 lives
- Volcano hazard/structure with timed eruptions and a special respawn rule
- Tree mining → coins → crafting a wooden wall safe zone
- Lives system for player and enemies

---

## 1) Executive summary
Lava Jump is a premium-feeling 2D side-scrolling platformer in a minimalist vector/flat art style. The core loop combines precision jumping over lava, platform traversal, coin collection, and light combat via a laser gun. Each of five levels scales up in size and enemy count, culminating in a T-Rex boss encounter while a volcano erupts on a fixed timer.

The visual identity remains clean, geometric, high-contrast, and readable, with layered parallax backgrounds and tile-like ground/platform shapes.

---

## 2) Goals and success criteria

### Product goals
- “One more try” feel: instant retry, clear cause-and-effect, fair deaths.
- A clean visual identity that reads at speed (combat + platforming).
- A structured 5-level progression that escalates size, threat density, and mastery.
- A complete MVP that can be iterated into more content and polish.

### Success metrics (for playtests + demo)
- Movement satisfaction and clarity (qualitative “feel” score)
- Level completion funnel (how many reach each level)
- Death causes distribution (lava vs enemies vs boss vs volcano)
- Session length and replay rate (retries per minute)
- Coins collected per level and “did players understand mining/crafting?”

### Non-goals (guardrails)
- No open world.
- No deep crafting tree beyond the single wooden wall mechanic (MVP).
- No long narrative dependencies for MVP.

---

## 3) Target platform and distribution
Default: PC (Steam) first, keyboard + controller support.  
(Controller mapping should mirror keyboard; “X to shoot” maps to an equivalent controller button.)

---

## 4) Design pillars (decision rules)
1. Instant Retry — respawn is fast and consistent.
2. Fair Difficulty — hazards and enemy shots are readable and telegraphed.
3. Flow > Friction — minimal downtime, simple UI, quick restarts.
4. Crisp Controls — platforming is enjoyable even without enemies.
5. Readable Art — minimalist look never compromises gameplay clarity.

---

## 5) Visual direction (unchanged, with additions for new gameplay)

### Perspective & rendering
- 2D side-scroller platformer, orthographic
- Minimalist vector/flat art, low-poly vibe in 2D
- Built from geometric shapes (rectangles/circles), limited textures

### Palette (approx hex)
- Sky: #6CBFF8
- Hills: #A3D48F
- Tree foliage: #355E3B
- Tree trunks: #8B5A2B
- Dirt: #3E2723
- Grass: #4CAF50
- Player head: #00FF7F
- Player body: #1A237E
- Enemy head: Black (#000000)
- Enemy body: Orange (recommend #FF7A00 to stay vivid in this palette)
- UI text: White (#FFFFFF), eye dots: Black (#000000)

### Layer breakdown (back to front)
- Layer 0: Sky (solid fill)
- Layer 1: Parallax hills (slow scroll)
- Layer 2: Trees (mineable)
- Layer 3: Ground/platforms + lava pits (gameplay)
- Layer 4: Characters (player, enemies, boss)
- Layer 5: UI (“P1” label above player; lives/coins display)

### New art requirements
- Coins: simple circular or hex token with a single highlight notch (no detailed texture)
- Laser projectile: thin bright line/bolt; readable against sky and ground; must never blend into hills
- Volcano: 4 blocks wide with a 2-block pit (crater) in the middle; eruption VFX must be bold but clean
- Wooden wall: simple plank rectangle silhouette; includes 3 coin pickups placed along its top edge

---

## 6) Core gameplay requirements (v1.2)

### 6.1 Primary loop
Traverse platforms over lava → collect coins → fight enemy shooters → survive volcano eruptions → defeat T-Rex boss → finish level.

### 6.2 Player character
- Appearance: green head, blue body; blocky geometric figure
- Ability: shoot laser (press **X**)
- Lives: Player has **3 lives**
- Damage rules:
  - Falling into lava = lose 1 life and respawn (standard respawn point rules)
  - Taking a hit from enemy laser or boss = lose 1 life (unless you decide otherwise in balancing)

### 6.3 Controls (MVP baseline)
- Move: left/right
- Jump
- Shoot: **X**
- Interact: dedicated input for mining
- Optional later (not required for MVP unless needed): aim direction, dash, reload, etc.

### 6.4 Enemies (attacking men)
- Visual: black head, orange body, laser gun
- Lives: **3 lives**
- Behavior mix (locked for MVP):
  - Type A: **Sentry Shooter** (majority)
    - Stands still or paces in a tiny range.
    - Fires horizontally at the player when in line-of-sight and within range.
    - Telegraph: brief charge flash or gun glow.
  - Type B: **Patroller Shooter** (minority, later levels)
    - Walks back and forth on a short patrol route.
    - Same firing rules as Type A, but only shoots when stopped or at patrol endpoints.
- Fairness rules:
  - Enemy fire cadence is slow enough that platforming remains primary.
  - Projectiles are high-contrast and never blend into background hills.
  - No off-screen snipes: enemies don’t fire unless the player is within camera bounds (or a tiny margin).

### 6.5 Boss (every level)
- Boss type: T-Rex dinosaur
- Lives: **7 lives**
- Boss arena: must exist in each level (can vary placement)
- Boss attacks (locked for MVP):
  - **Stomp Shockwave**
    - Telegraph: raises foot + rumble cue.
    - Effect: ground shockwave travels along the floor (jump to avoid).
    - Visual: a single expanding line/arc.
  - **Charge**
    - Telegraph: head low + short roar.
    - Effect: runs horizontally across the arena; player must jump/position.
    - Optional: hits a wall and briefly stuns itself (damage window).
  - **Bite Lunge**
    - Telegraph: short wind-up, head pulls back.
    - Effect: short forward burst; punishes hugging too close.
- Boss damage rules:
  - Boss takes damage from player laser
  - Boss invulnerability frames after hit (brief) to prevent instant melts
- Readability rule:
  - During boss, reduce or remove regular enemy shooters unless playtests show it remains fair.

### 6.6 Volcano hazard (every level)
- Volcano geometry: **4 blocks wide** with a **2-block pit** in the middle (crater)
- “You have to go up it”: volcano functions as a climbable structure (ramps/steps implied by geometry)
- Eruption:
  - Timer: **every 20 seconds**
  - On eruption, if the player is **jumping over a lava pit**, special rule triggers:
    - Player respawns at the position “where you first were about to jump” (jump start marker)
    - Player loses **1 life**
- Safety zones:
  - If player is **on the volcano** (standing on it), they are safe from enemies (cannot be damaged by enemy shots)
  - If player is **on the wooden wall**, also safe from enemies

Important implementation detail:
- The “jump start marker” is a saved position at the moment the player leaves solid ground for a jump across lava.

### 6.7 Platforms and lava pits
- Platforms are above lava; missing a jump means falling into lava.
- There are “spaces between platform and real ground”:
  - Interpret as multi-tier layout: some platforms float above ground-level paths, with lava below platforms.
- Gaps/pits are sharp-edged in art; physics edges must be consistent and non-sticky.

### 6.8 Coins
- Coins scattered in every level
- Coins are collected on contact
- Coins are used for:
  - Reward loop (score/progression)
  - Crafting outcome ties (see Trees/Walls)
  - End-of-level results (coins collected, best run stats)
- Post-MVP (explicitly later):
  - Cosmetic unlocks (player skins, laser color variants, label styles)
  - Extra challenge levels or “hard routes”
  - Optional assists (extra life, eruption warning buff)

### 6.9 Trees → mining → crafting wooden wall
- Trees appear in levels (Layer 2/3 boundary visually)
- Mining interaction:
  - When mined, a tree yields **3 coins**
  - Mining action input: **dedicated Interact** near a tree (hold or repeated taps; choose in slice)
- Crafting:
  - If player mines **2 trees**, they can create a **wooden wall**
  - Wooden wall properties:
    - A placed object/platform safe zone
    - **3 coins on top** (pickup placements)
    - Standing on wall makes player safe from enemies
- Placement rules (MVP):
  - Player-placed wall (not predefined).
  - Placement is grid-aligned to blocks.
  - Only place on valid surfaces (solid ground/platforms), not mid-air.
  - Optional “placement sockets” in level markup if we want tighter control.

---

## 7) Level design specification (fixed 5-level structure)
All measurements are defined in **blocks**. You stated blocks are “2 cm each.” For production, we treat this as a design unit (tile size) and map it to engine units for camera/physics.

### Level sizes and enemy counts
- Level 1: **60 blocks** (standardized length), **2 attacking men**
- Level 2: **60 blocks**, **3 attacking men**
- Level 3: **60 blocks**, **4 attacking men**
- Level 4: **60 blocks**, **5 attacking men**
- Level 5: **60 blocks**, **5 attacking men**
- Every level includes:
  - Coins scattered
  - Volcano structure + 20s eruption rule
  - T-Rex boss with 7 lives
  - Trees for mining

Design intent:
- Level length is standardized to avoid any stage feeling truncated.
- Threat density increases through:
  - More enemy shooters
  - More complex platform over-lava sequences
  - Boss pressure + eruption timer

### Recommended refinement (to avoid repetitive “boss every level” fatigue)
Keep “boss present every level” as you want, but vary the boss encounter format:
- Levels 1–2: “mini-boss” behavior set (same T-Rex model, fewer moves, same 7 lives but slower)
- Levels 3–4: full moveset
- Level 5: same T-Rex with an added phase tied to eruption timing

This preserves your requirement while improving pacing and variety.

---

## 8) UI/UX requirements (v1.2)
- Floating label “P1” above player (white sans-serif)
- HUD:
  - Player lives (3)
  - Coins count
  - Boss lives (7) displayed during boss encounter
  - Eruption timer indicator (subtle icon that pulses as it nears 20s)
- Pause menu:
  - Resume
  - Restart level
  - Settings
- Settings (MVP):
  - Audio sliders (music/SFX)
  - Screen shake toggle
  - Controls view (and remap if we include it in MVP)

---

## 9) Audio requirements (v1.1)
- SFX:
  - Jump, land, death, coin pickup, laser shot, enemy shot, hit confirm, volcano rumble, eruption blast, mining “chop,” wall creation
- Music:
  - 1 theme for early levels, 1 for mid, 1 for final/boss emphasis
- Mix priorities:
  - Platforming feedback > combat > ambience > music

---

## 10) Technical requirements (v1.2)

### Systems to implement
- Player controller tuned for precision
- Projectile system (player + enemies)
- Health/lives system:
  - Player: 3 lives
  - Enemies: 3 lives
  - Boss: 7 lives
- Respawn system:
  - Standard checkpoint respawn
  - Special volcano eruption mid-jump respawn to jump-start marker + life loss
- Volcano timer system (20 seconds, consistent and visible)
- Safe zone system:
  - On volcano or on wooden wall: enemy shots do not damage player
- Mining system:
  - Trees can be mined; grant 3 coins
  - After 2 trees mined: wall becomes available/spawns
- Level data format:
  - Level length in blocks
  - Enemy spawn points
  - Coin placements
  - Tree placements
  - Volcano position
  - Boss arena bounds

### Telemetry (highly recommended)
- Death events with cause: lava / enemy / boss / eruption penalty
- Time spent per segment
- Coins collected per segment
- Eruption timing: how often the special respawn triggers

---

## 11) MDT integration notes (what the team will align on)
When integrating these new mechanics, the MDT will make the following “pro pipeline” decisions to avoid rework:

1) Define exactly how “60 blocks” maps to camera framing and movement speed so levels don’t feel cramped or empty.
2) Decide whether enemies shoot straight lines only, or can aim (aiming increases complexity and unfairness risk).
3) Decide the “mining” input and wall placement rule (predefined location recommended for MVP).
4) Clarify the eruption hazard: keep it as a timing penalty mid-jump (no extra projectiles/knockback for MVP).
5) Ensure readability: coin sparkle, laser bolts, eruption effects must not clutter minimalist style.

---

## 12) Updated milestone plan and tasks (v1.2)

### Milestone 0: Sprint 0 — Lock gameplay specs (1 week)
Key additions:
- Finalize combat rules:
  - Laser fire rate, damage per hit, enemy cadence, boss damage model
- Finalize lives UI and boss UI
- Finalize volcano eruption behavior and special respawn marker
- Decide mining + wall placement UX

### Milestone 1: Vertical Slice (3–5 weeks)
Slice must include:
- One complete level segment with:
  - Platforms over lava, coins, 1–2 enemies, 1 tree mine, wall unlock/spawn, volcano timer + one eruption event
  - Micro boss encounter with T-Rex (7 lives) in a small arena
- Respawn special rule:
  - Demonstrate eruption mid-jump → respawn to jump-start marker with life loss

### Milestone 2: MVP Alpha (4–6 weeks)
Deliver all five levels with correct block lengths and enemy counts:
- Level 1: 60 blocks, 2 enemies, boss, volcano
- Level 2: 60 blocks, 3 enemies, boss, volcano
- Level 3: 60 blocks, 4 enemies, boss, volcano
- Level 4: 60 blocks, 5 enemies, boss, volcano
- Level 5: 60 blocks, 5 enemies, boss, volcano
Plus:
- Coins across levels
- Trees and wall crafting loop in each level

### Milestone 3: MVP Beta (3–4 weeks)
Polish focus:
- Combat readability (telegraphs and projectile clarity)
- Difficulty ramp (avoid sudden spikes due to more enemies + boss + eruption)
- Camera and controls feel
- UI clarity for lives, boss lives, eruption timer

### Milestone 4: Launch Candidate (2–3 weeks)
- Final QA gating, performance stabilization, store assets, trailer

---

## 13) Risks and mitigations (expanded)
Risk: Too many mechanics for a clean MVP (platforming + shooting + boss + eruption + mining/crafting).  
Mitigation: build vertical slice first, and strictly cap boss moveset + crafting complexity.

Risk: Boss every level becomes repetitive or exhausting.  
Mitigation: vary encounter format/arena, not the boss identity; keep phases tied to eruption timing only late-game.

Risk: Eruption penalty feels unfair.  
Mitigation:
- Add clear pre-eruption telegraph (rumble + screen cue)
- Show an eruption timer UI element (subtle but visible)
- Ensure the jump-start marker is predictable (player understands why they reset)

Risk: Safe zones trivialize enemies.  
Mitigation: safe zones are positional advantages but not permanent; enemy placement and coin routes encourage movement.

---

## 14) Open questions (must resolve next)
1) Interact input feel: hold vs repeated taps for mining?
2) Boss charge stun window: duration and damage window tuning?
3) Placement control: do we need sockets in all levels or only in complex segments?
