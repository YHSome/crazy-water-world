/* ═══════════════════════════════════════════════════════════════
   疯狂水世界 · 废料拼图
   A flooded control-room match-3. Swap salvage crates, make three,
   and let the chain reaction pay for the sanctuary.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CW = window.CW;
  if (!CW || !CW.Arcade) return;
  var clamp = CW.clamp;
  var lerp = CW.lerp;
  var rand = CW.rand;
  var chance = CW.chance;
  var mod = CW.mod;
  var TAU = CW.TAU;
  var fmt = CW.fmt;

  var TILES = [
    { name: '废铁', color: '#9fb2b4', dark: '#40585d', key: 'metal' },
    { name: '燃料', color: '#ffb15e', dark: '#78401f', key: 'fuel' },
    { name: '纤维', color: '#93dda3', dark: '#2f6248', key: 'fiber' },
    { name: '芯片', color: '#7ed7ff', dark: '#1e566e', key: 'chip' },
    { name: '医疗包', color: '#f6e7c7', dark: '#715445', key: 'med' }
  ];

  var MATCH_BG = new Image();
  MATCH_BG.decoding = 'async';
  MATCH_BG.src = 'assets/bg-match.webp';

  var TILE_IMAGES = [];
  ['tile-metal', 'tile-fuel', 'tile-fiber', 'tile-chip', 'tile-medkit'].forEach(function (name) {
    var img = new Image();
    img.src = 'assets/icons/' + name + '.svg';
    TILE_IMAGES.push(img);
  });
  var COLLECTIBLE_IMAGES = {};
  function collectibleImage(src) {
    if (!COLLECTIBLE_IMAGES[src]) {
      var img = new Image();
      img.src = src;
      COLLECTIBLE_IMAGES[src] = img;
    }
    return COLLECTIBLE_IMAGES[src];
  }

  function drawCover(ctx, img, w, h, fx, fy) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    var scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    var dw = img.naturalWidth * scale;
    var dh = img.naturalHeight * scale;
    ctx.drawImage(img, (w - dw) * (fx == null ? 0.5 : fx), (h - dh) * (fy == null ? 0.5 : fy), dw, dh);
    return true;
  }

  function MatchGame(arcade, config) {
    this.arcade = arcade;
    this.audio = arcade.audio;
    this.w = config.w;
    this.h = config.h;
    this.condition = config.condition || null;
    this.movesStart = config.moves || 30;
    this.movesLeft = this.movesStart;
    this.landscape = this.w > this.h;
    this.cols = this.landscape ? 9 : 7;
    this.rows = this.landscape ? 6 : 8;
    this.grid = [];
    this.selected = null;
    this.dragStart = null;
    this.swapA = null;
    this.swapB = null;
    this.phase = 'waiting';
    this.swapTimer = 0;
    this.swapDuration = 0.16;
    this.popTimer = 0;
    this.invalidTimer = 0;
    this.time = 0;
    this.flash = 0;
    this.specialFx = [];
    this.fallCells = {};
    this.fallTimer = 0;
    this.fallDuration = 0.22;
    this.tileSprites = null;
    this.bgCache = null;
    this.score = 0;
    this.combo = 0;
    this.moves = 0;
    this.counts = [0, 0, 0, 0, 0];
    this.matched = [];
    this.collectibles = [];
    this.collectibleCell = null;
    this.particles = [];
    this.popups = [];
    this.done = false;
    this.result = null;
    this.cell = 40;
    this.boardX = 0;
    this.boardY = 0;
    this.buildBoard();
    this.layout();
  }

  MatchGame.prototype.layout = function () {
    var top = this.landscape ? 96 : 108;
    var bottom = 64;
    var available = Math.max(140, this.h - top - bottom);
    var cell = Math.min((this.w - 26) / this.cols, available / this.rows, 64);
    cell = Math.max(24, cell);
    this.cell = cell;
    this.boardW = cell * this.cols;
    this.boardH = cell * this.rows;
    this.boardX = (this.w - this.boardW) / 2;
    this.boardY = top + Math.max(0, (available - this.boardH) / 2);
    this.tileSprites = null;
    this.bgCache = null;
  };

  MatchGame.prototype.resize = function (w, h) {
    this.w = w;
    this.h = h;
    this.layout();
  };

  MatchGame.prototype.begin = function () {
    this.movesLeft = this.movesStart;
    this.score = 0;
    this.combo = 0;
    this.counts = [0, 0, 0, 0, 0];
    this.matched = [];
    this.selected = null;
    this.dragStart = null;
    this.specialFx = [];
    this.collectibles = [];
    this.collectibleCell = null;
    this.fallCells = {};
    this.fallTimer = 0;
    this.flash = 0;
    this.phase = 'idle';
    this.time = 0;
    this.done = false;
    this.buildBoard();
    this.audio.click();
  };

  MatchGame.prototype.buildBoard = function () {
    var tries = 0;
    do {
      this.grid = [];
      for (var r = 0; r < this.rows; r++) {
        var row = [];
        for (var c = 0; c < this.cols; c++) {
          var t = (Math.random() * TILES.length) | 0;
          var guard = 0;
          while (this.wouldImmediate(row, r, c, t) && guard++ < 30) t = (Math.random() * TILES.length) | 0;
          row.push(t);
        }
        this.grid.push(row);
      }
      tries++;
    } while (!this.hasPossibleMove() && tries < 30);
    this.collectibleCell = null;
    if (CW.rollCollectibleDef && chance(0.3)) {
      var cdef = CW.rollCollectibleDef();
      this.collectibleCell = {
        r: (Math.random() * this.rows) | 0,
        c: (Math.random() * this.cols) | 0,
        id: cdef.id,
        def: cdef
      };
    }
  };

  MatchGame.prototype.wouldImmediate = function (row, r, c, t) {
    if (c >= 2 && row[c - 1] === t && row[c - 2] === t) return true;
    if (r >= 2 && this.grid[r - 1][c] === t && this.grid[r - 2][c] === t) return true;
    return false;
  };

  MatchGame.prototype.copyGrid = function () {
    var out = [];
    for (var r = 0; r < this.rows; r++) out.push(this.grid[r].slice());
    return out;
  };

  MatchGame.prototype.swapWouldMatch = function (a, b) {
    var copy = this.copyGrid();
    var tmp = copy[a.r][a.c];
    copy[a.r][a.c] = copy[b.r][b.c];
    copy[b.r][b.c] = tmp;
    return this.findOn(copy).length > 0;
  };

  MatchGame.prototype.hasPossibleMove = function () {
    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        if (c + 1 < this.cols && this.swapWouldMatch({ r: r, c: c }, { r: r, c: c + 1 })) return true;
        if (r + 1 < this.rows && this.swapWouldMatch({ r: r, c: c }, { r: r + 1, c: c })) return true;
      }
    }
    return false;
  };

  MatchGame.prototype.findOn = function (grid) {
    var marks = [];
    var r, c;
    for (r = 0; r < this.rows; r++) marks.push(new Array(this.cols).fill(false));
    var found = [];
    for (r = 0; r < this.rows; r++) {
      c = 0;
      while (c < this.cols) {
        var t = grid[r][c];
        var end = c + 1;
        while (end < this.cols && grid[r][end] === t) end++;
        if (end - c >= 3) {
          for (var x = c; x < end; x++) {
            if (!marks[r][x]) { marks[r][x] = true; found.push({ r: r, c: x, t: t }); }
          }
        }
        c = end;
      }
    }
    for (c = 0; c < this.cols; c++) {
      r = 0;
      while (r < this.rows) {
        var t2 = grid[r][c];
        var end2 = r + 1;
        while (end2 < this.rows && grid[end2][c] === t2) end2++;
        if (end2 - r >= 3) {
          for (var y = r; y < end2; y++) {
            if (!marks[y][c]) { marks[y][c] = true; found.push({ r: y, c: c, t: t2 }); }
          }
        }
        r = end2;
      }
    }
    return found;
  };

  MatchGame.prototype.findMatches = function () {
    return this.findOn(this.grid);
  };

  MatchGame.prototype.scanRuns = function (grid) {
    var runs = [];
    var r, c;
    for (r = 0; r < this.rows; r++) {
      c = 0;
      while (c < this.cols) {
        var t = grid[r][c];
        var end = c + 1;
        while (end < this.cols && grid[r][end] === t) end++;
        if (t !== null && end - c >= 3) runs.push({ dir: 'h', r: r, c: c, end: end, t: t, len: end - c });
        c = end;
      }
    }
    for (c = 0; c < this.cols; c++) {
      r = 0;
      while (r < this.rows) {
        var t2 = grid[r][c];
        var end2 = r + 1;
        while (end2 < this.rows && grid[end2][c] === t2) end2++;
        if (t2 !== null && end2 - r >= 3) runs.push({ dir: 'v', r: r, c: c, end: end2, t: t2, len: end2 - r });
        r = end2;
      }
    }
    return runs;
  };

  MatchGame.prototype.hitTest = function (x, y) {
    if (x < this.boardX || x > this.boardX + this.boardW || y < this.boardY || y > this.boardY + this.boardH) return null;
    var c = Math.floor((x - this.boardX) / this.cell);
    var r = Math.floor((y - this.boardY) / this.cell);
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    return { r: r, c: c };
  };

  MatchGame.prototype.pointerDown = function (x, y) {
    if (this.phase !== 'idle') return;
    var cell = this.hitTest(x, y);
    if (!cell) { this.selected = null; this.dragStart = null; return; }
    this.dragStart = cell;
  };
  MatchGame.prototype.pointerUp = function (x, y) {
    if (this.phase !== 'idle' || !this.dragStart) return;
    var start = this.dragStart;
    this.dragStart = null;
    var end = this.hitTest(x, y);
    if (!end) return;
    var dx = Math.abs(start.r - end.r) + Math.abs(start.c - end.c);
    if (dx === 1) {
      this.selected = null;
      this.trySwap(start, end);
      return;
    }
    if (start.r !== end.r || start.c !== end.c) {
      this.selected = end;
      this.audio.click();
      return;
    }
    if (this.selected && this.selected.r === start.r && this.selected.c === start.c) {
      this.selected = null;
      return;
    }
    if (this.selected &&
        Math.abs(this.selected.r - start.r) + Math.abs(this.selected.c - start.c) === 1) {
      var previous = this.selected;
      this.selected = null;
      this.trySwap(previous, start);
      return;
    }
    this.selected = start;
    this.audio.click();
  };

  MatchGame.prototype.trySwap = function (a, b) {
    if (!this.swapWouldMatch(a, b)) {
      this.invalidTimer = 0.28;
      this.audio.warn();
      return;
    }
    var tmp = this.grid[a.r][a.c];
    this.grid[a.r][a.c] = this.grid[b.r][b.c];
    this.grid[b.r][b.c] = tmp;
    this.movesLeft = Math.max(0, this.movesLeft - 1);
    this.phase = 'swap';
    this.swapDuration = 0.16;
    this.swapTimer = this.swapDuration;
    this.swapA = a;
    this.swapB = b;
    this.spawnBurst(this.boardX + a.c * this.cell + this.cell / 2, this.boardY + a.r * this.cell + this.cell / 2, TILES[this.grid[a.r][a.c]].color, 7);
    this.spawnBurst(this.boardX + b.c * this.cell + this.cell / 2, this.boardY + b.r * this.cell + this.cell / 2, TILES[this.grid[b.r][b.c]].color, 7);
    this.audio.pickup(0);
  };

  MatchGame.prototype.resolveMatches = function () {
    var matches = this.findMatches();
    if (!matches.length) {
      this.finishTurn();
      return;
    }
    var runs = this.scanRuns(this.grid);
    var cells = [];
    var seen = {};

    function addCell(r, c) {
      var key = r + ':' + c;
      if (seen[key] || r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
      if (this.grid[r][c] === null) return;
      seen[key] = true;
      cells.push({ r: r, c: c, t: this.grid[r][c] });
    }

    for (var i = 0; i < matches.length; i++) addCell.call(this, matches[i].r, matches[i].c);

    for (var ri = 0; ri < runs.length; ri++) {
      var run = runs[ri];
      if (run.len < 4) continue;
      var isFive = run.len >= 5;
      var added = 0;
      if (isFive) {
        for (var rr = 0; rr < this.rows; rr++) {
          for (var cc = 0; cc < this.cols; cc++) {
            if (this.grid[rr][cc] === run.t && !seen[rr + ':' + cc]) {
              addCell.call(this, rr, cc);
              added++;
            }
          }
        }
        this.specialFx.push({
          type: 'rainbow',
          t: run.t,
          color: TILES[run.t].color,
          x: this.boardX + this.boardW / 2,
          y: this.boardY + this.boardH / 2,
          life: 0.75,
          maxLife: 0.75
        });
        this.flash = Math.max(this.flash, 0.28);
        this.popups.push({
          x: this.w / 2,
          y: this.boardY + this.boardH / 2,
          text: '五连 · 同色清除',
          life: 1.15,
          maxLife: 1.15,
          color: '#9feeff',
          size: 16
        });
        this.audio.relic();
      } else {
        if (run.dir === 'h') {
          for (var c2 = 0; c2 < this.cols; c2++) {
            if (!seen[run.r + ':' + c2]) { addCell.call(this, run.r, c2); added++; }
          }
          this.specialFx.push({
            type: 'line', dir: 'h', r: run.r,
            color: TILES[run.t].color,
            life: 0.5, maxLife: 0.5
          });
        } else {
          for (var r2 = 0; r2 < this.rows; r2++) {
            if (!seen[r2 + ':' + run.c]) { addCell.call(this, r2, run.c); added++; }
          }
          this.specialFx.push({
            type: 'line', dir: 'v', c: run.c,
            color: TILES[run.t].color,
            life: 0.5, maxLife: 0.5
          });
        }
        this.popups.push({
          x: this.boardX + (run.c + run.end) / 2 * this.cell,
          y: this.boardY + run.r * this.cell + this.cell / 2,
          text: '四连 · 线扫',
          life: 0.9,
          maxLife: 0.9,
          color: '#ffd166',
          size: 13
        });
        this.audio.pickup(4);
      }
    }

    this.combo += 1;
    this.phase = 'pop';
    this.popTimer = 0.24;
    this.matched = cells;
    if (this.collectibleCell) {
      for (var mc = 0; mc < cells.length; mc++) {
        if (cells[mc].r === this.collectibleCell.r && cells[mc].c === this.collectibleCell.c) {
          this.collectibles.push(this.collectibleCell.id);
          this.popups.push({
            x: this.boardX + this.collectibleCell.c * this.cell + this.cell / 2,
            y: this.boardY + this.collectibleCell.r * this.cell,
            text: '收藏品！' + this.collectibleCell.def.name,
            life: 1.5, maxLife: 1.5,
            color: CW.COLLECTIBLE_RARITY_MAP[this.collectibleCell.def.rarity].color,
            size: 10
          });
          this.audio.relic();
          this.collectibleCell = null;
          break;
        }
      }
    }
    for (var m = 0; m < cells.length; m++) {
      var cell = cells[m];
      this.counts[cell.t] += 1;
      this.score += 10 * this.combo;
      if (chance(0.15)) {
        this.spawnBurst(
          this.boardX + cell.c * this.cell + this.cell / 2,
          this.boardY + cell.r * this.cell + this.cell / 2,
          TILES[cell.t].color, 4
        );
      }
    }
    if (this.combo > 1) {
      this.popups.push({
        x: this.w / 2,
        y: this.boardY - 12,
        text: '连锁 ×' + this.combo,
        life: 1.0,
        maxLife: 1.0,
        color: '#ffd166',
        size: 16
      });
    }
    this.audio.pickup(this.combo % 6);
  };

  MatchGame.prototype.applyPop = function () {
    var matched = this.matched;
    for (var i = 0; i < matched.length; i++) this.grid[matched[i].r][matched[i].c] = null;
    this.matched = [];
    this.collapse();
    var next = this.findMatches();
    if (next.length) {
      this.resolveMatches();
      return;
    }
    this.finishTurn();
  };

  MatchGame.prototype.collapse = function () {
    this.fallCells = {};
    this.fallTimer = this.fallDuration;
    for (var c = 0; c < this.cols; c++) {
      var vals = [];
      for (var r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) vals.push({ v: this.grid[r][c], from: r });
      }
      for (var clear = 0; clear < this.rows; clear++) this.grid[clear][c] = null;
      var write = this.rows - 1;
      for (var i = 0; i < vals.length; i++) {
        this.grid[write][c] = vals[i].v;
        if (write !== vals[i].from) this.fallCells[write + ':' + c] = { from: vals[i].from };
        write--;
      }
      while (write >= 0) {
        this.grid[write][c] = (Math.random() * TILES.length) | 0;
        this.fallCells[write + ':' + c] = { from: write - 2.2, fresh: true };
        write--;
      }
    }
  };

  MatchGame.prototype.finishTurn = function () {
    this.combo = 0;
    this.phase = 'idle';
    if (this.movesLeft <= 0) {
      this.finish();
      return;
    }
    if (!this.hasPossibleMove()) {
      this.buildBoard();
      this.popups.push({ x: this.w / 2, y: this.boardY - 10, text: '废料重排', life: 1.1, maxLife: 1.1, color: '#6fffe0', size: 13 });
    }
  };

  MatchGame.prototype.spawnBurst = function (x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var a = Math.random() * TAU;
      var v = rand(30, 130);
      this.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: rand(0.3, 0.7),
        maxLife: 0.7,
        size: rand(1, 3.2),
        color: color
      });
    }
    if (this.particles.length > 120) this.particles.splice(0, this.particles.length - 120);
  };

  MatchGame.prototype.update = function (dt) {
    if (this.phase === 'waiting' || this.phase === 'done') return;
    this.time += dt;
    this.invalidTimer = Math.max(0, this.invalidTimer - dt);
    this.flash = Math.max(0, this.flash - dt * 2.8);
    if (this.fallTimer > 0) {
      this.fallTimer = Math.max(0, this.fallTimer - dt);
      if (this.fallTimer <= 0) this.fallCells = {};
    }
    for (var f = this.specialFx.length - 1; f >= 0; f--) {
      this.specialFx[f].life -= dt;
      if (this.specialFx[f].life <= 0) this.specialFx.splice(f, 1);
    }

    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.2, dt);
      p.vy *= Math.pow(0.2, dt);
    }
    for (var j = this.popups.length - 1; j >= 0; j--) {
      var t = this.popups[j];
      t.life -= dt;
      t.y -= 26 * dt;
      if (t.life <= 0) this.popups.splice(j, 1);
    }

    if (this.phase === 'swap') {
      this.swapTimer -= dt;
      if (this.swapTimer <= 0) {
        this.phase = 'resolving';
        this.resolveMatches();
      }
    } else if (this.phase === 'pop') {
      this.popTimer -= dt;
      if (this.popTimer <= 0) this.applyPop();
    }
  };

  MatchGame.prototype.getScore = function () { return this.score; };
  MatchGame.prototype.getHud = function () {
    return {
      statLabel: '剩余步数',
      stat: String(this.movesLeft),
      loot: {
        metal: Math.floor(this.counts[0] / 4),
        fuel: Math.floor(this.counts[1] / 4),
        fiber: Math.floor(this.counts[2] / 4),
        chip: Math.floor(this.counts[3] / 4)
      },
      hasAction: false,
      hint: '滑动相邻废料箱，或点选两格交换 · 四连扫线、五连同色清除'
    };
  };

  MatchGame.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    this.phase = 'done';
    this.popups = [];
    var credits = 50 + Math.round(this.score * 0.22) + this.counts[4] * 12;
    this.result = {
      type: 'match',
      score: this.score,
      collectibles: this.collectibles.slice(),
      credits: credits,
      filters: (((this.arcade.hub.data.filterPity || 0) >= 7) || (this.score >= 1200 && chance(0.05))) ? 1 : 0,
      materials: {
        metal: Math.floor(this.counts[0] / 4),
        fuel: Math.floor(this.counts[1] / 4),
        fiber: Math.floor(this.counts[2] / 4),
        chip: Math.floor(this.counts[3] / 4)
      }
    };
  };

  MatchGame.prototype.render = function (ctx) {
    var w = this.w;
    var h = this.h;
    this.drawBackdrop(ctx);

    var bx = this.boardX;
    var by = this.boardY;
    var cell = this.cell;

    // board frame
    ctx.save();
    var frame = ctx.createLinearGradient(bx - 12, by - 12, bx + this.boardW + 12, by + this.boardH + 12);
    frame.addColorStop(0, 'rgba(28, 61, 68, 0.94)');
    frame.addColorStop(1, 'rgba(4, 25, 34, 0.97)');
    ctx.fillStyle = frame;
    ctx.beginPath();
    ctx.roundRect(bx - 12, by - 12, this.boardW + 24, this.boardH + 24, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 178, 116, 0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // rivets
    ctx.fillStyle = 'rgba(255, 205, 151, 0.14)';
    for (var i = 0; i < 8; i++) {
      var rx = bx - 5 + i * (this.boardW + 10) / 7;
      ctx.beginPath();
      ctx.arc(rx, by - 6, 1.4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx, by + this.boardH + 6, 1.4, 0, TAU);
      ctx.fill();
    }

    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        var x = bx + c * cell;
        var y = by + r * cell;
        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(7, 37, 45, 0.64)' : 'rgba(5, 31, 39, 0.7)';
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      }
    }

    // selected cell
    if (this.selected) {
      var sx = bx + this.selected.c * cell;
      var sy = by + this.selected.r * cell;
      ctx.strokeStyle = 'rgba(255, 218, 144, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(sx + 2, sy + 2, cell - 4, cell - 4, 7);
      ctx.stroke();
    }

    // tiles
    var matchedSet = {};
    for (var m = 0; m < this.matched.length; m++) matchedSet[this.matched[m].r + ':' + this.matched[m].c] = true;
    var invalidX = this.invalidTimer > 0 ? Math.sin(this.time * 60) * 4 : 0;
    var swapping = this.phase === 'swap' && this.swapA && this.swapB;
    var swapP = swapping ? clamp(1 - this.swapTimer / this.swapDuration, 0, 1) : 1;

    for (var rr = 0; rr < this.rows; rr++) {
      for (var cc = 0; cc < this.cols; cc++) {
        var val = this.grid[rr][cc];
        if (val === null || val === undefined) continue;
        if (swapping && ((rr === this.swapA.r && cc === this.swapA.c) || (rr === this.swapB.r && cc === this.swapB.c))) continue;
        var tx = bx + cc * cell + cell / 2;
        var ty = by + rr * cell + cell / 2;
        var isMatch = matchedSet[rr + ':' + cc];
        var popScale = 1;
        var popAlpha = 1;
        if (isMatch && this.phase === 'pop') {
          var k = clamp(this.popTimer / 0.24, 0, 1);
          popScale = 0.55 + k * 0.45;
          popAlpha = 0.25 + k * 0.75;
        }
        var fall = this.fallCells[rr + ':' + cc];
        if (fall && this.fallTimer > 0) {
          var fp = 1 - this.fallTimer / this.fallDuration;
          var fe = 1 - Math.pow(1 - fp, 3);
          ty += (fall.from - rr) * cell * (1 - fe);
          if (fall.fresh) popScale *= 0.8 + fe * 0.2;
        }
        if (this.invalidTimer > 0) tx += invalidX;
        this.drawTile(ctx, tx, ty, cell, val, popScale, popAlpha);
        if (this.collectibleCell && this.collectibleCell.r === rr && this.collectibleCell.c === cc) {
          this.drawCollectibleMini(ctx, tx, ty, cell, this.collectibleCell.def);
        }
      }
    }

    if (swapping) {
      var ease = 1 - Math.pow(1 - swapP, 3);
      var ax = bx + this.swapA.c * cell + cell / 2;
      var ay = by + this.swapA.r * cell + cell / 2;
      var bx2 = bx + this.swapB.c * cell + cell / 2;
      var by2 = by + this.swapB.r * cell + cell / 2;
      var lift = 1 + Math.sin(swapP * Math.PI) * 0.07;
      this.drawTile(ctx, lerp(bx2, ax, ease), lerp(by2, ay, ease), cell, this.grid[this.swapA.r][this.swapA.c], lift, 1);
      this.drawTile(ctx, lerp(ax, bx2, ease), lerp(ay, by2, ease), cell, this.grid[this.swapB.r][this.swapB.c], lift, 1);
    }

    this.drawSpecialFx(ctx);

    // particles
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var p = 0; p < this.particles.length; p++) {
      var pt = this.particles[p];
      var a = clamp(pt.life / pt.maxLife, 0, 1);
      ctx.fillStyle = this.hexA(pt.color, a * 0.7);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * a, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // popups
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var q = 0; q < this.popups.length; q++) {
      var pop = this.popups[q];
      var pa = clamp(pop.life / pop.maxLife, 0, 1);
      ctx.font = '800 ' + (pop.size || 12) + 'px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = 'rgba(0, 8, 13, ' + (pa * 0.45).toFixed(3) + ')';
      ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
      ctx.fillStyle = pop.color;
      ctx.globalAlpha = pa;
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (this.combo > 1) {
      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = '900 13px "Cascadia Mono", monospace';
      ctx.fillStyle = 'rgba(255, 209, 102, 0.8)';
      ctx.fillText('COMBO ×' + this.combo, bx + this.boardW, by + this.boardH + 32);
      ctx.restore();
    }
    ctx.restore();

    if (this.flash > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(172, 251, 255, ' + (this.flash * 0.28).toFixed(3) + ')';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  };

  MatchGame.prototype.drawSpecialFx = function (ctx) {
    if (!this.specialFx.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.specialFx.length; i++) {
      var fx = this.specialFx[i];
      var a = clamp(fx.life / fx.maxLife, 0, 1);
      if (fx.type === 'line') {
        ctx.fillStyle = this.hexA(fx.color, a * 0.16);
        if (fx.dir === 'h') {
          var y = this.boardY + fx.r * this.cell + this.cell / 2;
          ctx.fillRect(this.boardX - 6, y - this.cell * 0.34, this.boardW + 12, this.cell * 0.68);
          ctx.fillStyle = this.hexA(fx.color, a * 0.7);
          ctx.fillRect(this.boardX - 6, y - 1.5, this.boardW + 12, 3);
        } else {
          var x = this.boardX + fx.c * this.cell + this.cell / 2;
          ctx.fillRect(x - this.cell * 0.34, this.boardY - 6, this.cell * 0.68, this.boardH + 12);
          ctx.fillStyle = this.hexA(fx.color, a * 0.7);
          ctx.fillRect(x - 1.5, this.boardY - 6, 3, this.boardH + 12);
        }
      } else if (fx.type === 'rainbow') {
        var r = this.cell * (2.5 + (1 - a) * 5);
        var g = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, r);
        g.addColorStop(0, this.hexA(fx.color, a * 0.38));
        g.addColorStop(0.5, this.hexA('#9feeff', a * 0.16));
        g.addColorStop(1, this.hexA(fx.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = this.hexA(fx.color, a * 0.7);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, this.cell * 1.2 + (1 - a) * this.cell * 4, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  MatchGame.prototype.buildBgCache = function () {
    if (!MATCH_BG.complete || !MATCH_BG.naturalWidth) { this.bgCache = null; return; }
    var w = Math.max(1, Math.round(this.w));
    var h = Math.max(1, Math.round(this.h));
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var g = c.getContext('2d');
    g.fillStyle = '#020e14';
    g.fillRect(0, 0, w, h);
    drawCover(g, MATCH_BG, w, h, 0.5, 0.45);
    g.fillStyle = 'rgba(1, 14, 20, 0.34)';
    g.fillRect(0, 0, w, h);
    var shade = g.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, 'rgba(0, 7, 12, 0.58)');
    shade.addColorStop(0.25, 'rgba(0, 7, 12, 0.06)');
    shade.addColorStop(0.75, 'rgba(0, 7, 12, 0.22)');
    shade.addColorStop(1, 'rgba(0, 7, 12, 0.75)');
    g.fillStyle = shade;
    g.fillRect(0, 0, w, h);
    var vignette = g.createRadialGradient(w * 0.5, h * 0.48, Math.min(w, h) * 0.2, w * 0.5, h * 0.52, Math.max(w, h) * 0.7);
    vignette.addColorStop(0, 'rgba(0, 6, 10, 0)');
    vignette.addColorStop(1, 'rgba(0, 5, 9, 0.48)');
    g.fillStyle = vignette;
    g.fillRect(0, 0, w, h);
    this.bgCache = c;
  };

  MatchGame.prototype.drawBackdrop = function (ctx) {
    var w = this.w;
    var h = this.h;
    if (!this.bgCache) this.buildBgCache();
    if (this.bgCache) {
      ctx.drawImage(this.bgCache, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#020e14';
      ctx.fillRect(0, 0, w, h);
    }

    // floating dust
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var d = 0; d < 22; d++) {
      var dx = mod(hash(d * 5.7) * w + this.time * (1 + hash(d * 2.3) * 2), w);
      var dy = mod(hash(d * 7.1) * h - this.time * (2 + hash(d * 4.7) * 3), h);
      ctx.fillStyle = 'rgba(159, 226, 219, ' + (0.025 + hash(d) * 0.04).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(dx, dy, 0.5 + hash(d * 3.2) * 1.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  MatchGame.prototype.drawCollectibleMini = function (ctx, cx, cy, cell, def) {
    var s = cell * 0.36;
    var img = collectibleImage(def.icon);
    var color = CW.COLLECTIBLE_RARITY_MAP[def.rarity].color;
    ctx.save();
    ctx.translate(cx + cell * 0.24, cy - cell * 0.24);
    ctx.fillStyle = 'rgba(1, 10, 15, 0.82)';
    ctx.beginPath();
    ctx.roundRect(-s / 2 - 2, -s / 2 - 2, s + 4, s + 4, 3);
    ctx.fill();
    if (img.complete && img.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-s / 2, -s / 2, s, s, 2);
      ctx.clip();
      ctx.drawImage(img, -s / 2, -s / 2, s, s);
      ctx.restore();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-s / 2, -s / 2, s, s, 2);
    ctx.stroke();
    ctx.restore();
  };

  MatchGame.prototype.buildTileSprites = function () {
    for (var k = 0; k < TILE_IMAGES.length; k++) {
      if (!TILE_IMAGES[k].complete || !TILE_IMAGES[k].naturalWidth) return;
    }
    var cell = Math.ceil(this.cell);
    var out = [];
    for (var type = 0; type < TILES.length; type++) {
      var data = TILES[type];
      var c = document.createElement('canvas');
      c.width = cell;
      c.height = cell;
      var g = c.getContext('2d');
      g.translate(cell / 2, cell / 2);
      var s = this.cell * 0.84;
      g.fillStyle = 'rgba(0, 5, 9, 0.34)';
      g.beginPath();
      g.roundRect(-s / 2 + 1, -s / 2 + 3, s, s, s * 0.17);
      g.fill();

      var rim = g.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
      rim.addColorStop(0, 'rgba(210, 245, 244, 0.22)');
      rim.addColorStop(0.34, 'rgba(43, 78, 83, 0.9)');
      rim.addColorStop(1, 'rgba(1, 15, 22, 0.98)');
      g.fillStyle = rim;
      g.beginPath();
      g.roundRect(-s / 2 - 2, -s / 2 - 2, s + 4, s + 4, s * 0.18);
      g.fill();

      var body = g.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
      body.addColorStop(0, data.color);
      body.addColorStop(0.38, data.dark);
      body.addColorStop(1, '#0a222c');
      g.fillStyle = body;
      g.beginPath();
      g.roundRect(-s / 2, -s / 2, s, s, s * 0.15);
      g.fill();

      g.save();
      g.beginPath();
      g.roundRect(-s / 2, -s / 2, s, s, s * 0.15);
      g.clip();
      g.fillStyle = 'rgba(255, 255, 255, 0.14)';
      g.beginPath();
      g.moveTo(-s / 2, -s / 2);
      g.lineTo(s * 0.05, -s / 2);
      g.lineTo(-s / 2, s * 0.12);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(0, 0, 0, 0.14)';
      g.fillRect(-s / 2, s * 0.32, s, s * 0.18);
      g.restore();

      g.fillStyle = 'rgba(1, 14, 20, 0.42)';
      g.beginPath();
      g.arc(0, 0, s * 0.315, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(225, 255, 251, 0.18)';
      g.lineWidth = 1;
      g.stroke();

      var icon = TILE_IMAGES[type];
      g.drawImage(icon, -s * 0.27, -s * 0.27, s * 0.54, s * 0.54);

      g.fillStyle = 'rgba(255, 217, 158, 0.38)';
      var dots = [[-s * 0.37, -s * 0.37], [s * 0.37, -s * 0.37], [-s * 0.37, s * 0.37], [s * 0.37, s * 0.37]];
      for (var d = 0; d < dots.length; d++) {
        g.beginPath();
        g.arc(dots[d][0], dots[d][1], 1.2, 0, TAU);
        g.fill();
      }

      g.strokeStyle = 'rgba(223, 255, 249, 0.24)';
      g.lineWidth = 1;
      g.beginPath();
      g.roundRect(-s / 2, -s / 2, s, s, s * 0.15);
      g.stroke();
      out.push(c);
    }
    this.tileSprites = out;
  };

  MatchGame.prototype.drawTile = function (ctx, cx, cy, cell, type, scale, alpha) {
    if (!this.tileSprites) this.buildTileSprites();
    var sprite = this.tileSprites && this.tileSprites[type];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    if (sprite) {
      ctx.drawImage(sprite, -cell / 2, -cell / 2, cell, cell);
    } else {
      var data = TILES[type];
      ctx.fillStyle = data.dark;
      ctx.beginPath();
      ctx.roundRect(-cell * 0.4, -cell * 0.4, cell * 0.8, cell * 0.8, cell * 0.12);
      ctx.fill();
    }
    ctx.restore();
  };

  MatchGame.prototype.hexA = function (hex, a) {
    var s = hex.replace('#', '');
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    var n = parseInt(s, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  };

  function hash(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }

  CW.MatchGame = MatchGame;
})();
