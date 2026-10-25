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
    this.movesStart = config.moves || 30;
    this.movesLeft = this.movesStart;
    this.landscape = this.w > this.h;
    this.cols = this.landscape ? 9 : 7;
    this.rows = this.landscape ? 6 : 8;
    this.grid = [];
    this.selected = null;
    this.swapA = null;
    this.swapB = null;
    this.phase = 'waiting';
    this.swapTimer = 0;
    this.popTimer = 0;
    this.invalidTimer = 0;
    this.time = 0;
    this.score = 0;
    this.combo = 0;
    this.moves = 0;
    this.counts = [0, 0, 0, 0, 0];
    this.matched = [];
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
    if (!cell) { this.selected = null; return; }
    if (!this.selected) {
      this.selected = cell;
      this.audio.click();
      return;
    }
    if (this.selected.r === cell.r && this.selected.c === cell.c) {
      this.selected = null;
      return;
    }
    var dist = Math.abs(this.selected.r - cell.r) + Math.abs(this.selected.c - cell.c);
    if (dist === 1) {
      this.trySwap(this.selected, cell);
      this.selected = null;
    } else {
      this.selected = cell;
      this.audio.click();
    }
  };
  MatchGame.prototype.pointerUp = function () {};

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
    this.swapTimer = 0.12;
    this.swapA = a;
    this.swapB = b;
    this.audio.pickup(0);
  };

  MatchGame.prototype.resolveMatches = function () {
    var matches = this.findMatches();
    if (!matches.length) {
      this.finishTurn();
      return;
    }
    this.combo += 1;
    this.phase = 'pop';
    this.popTimer = 0.24;
    this.matched = matches;
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      this.counts[m.t] += 1;
      this.score += 10 * this.combo;
      if (chance(0.15)) {
        this.spawnBurst(this.boardX + m.c * this.cell + this.cell / 2, this.boardY + m.r * this.cell + this.cell / 2, TILES[m.t].color, 4);
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
    for (var c = 0; c < this.cols; c++) {
      var write = this.rows - 1;
      for (var r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          this.grid[write][c] = this.grid[r][c];
          if (write !== r) this.grid[r][c] = null;
          write--;
        }
      }
      while (write >= 0) {
        this.grid[write][c] = (Math.random() * TILES.length) | 0;
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
    if (this.particles.length > 180) this.particles.splice(0, this.particles.length - 180);
  };

  MatchGame.prototype.update = function (dt) {
    if (this.phase === 'waiting' || this.phase === 'done') return;
    this.time += dt;
    this.invalidTimer = Math.max(0, this.invalidTimer - dt);

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
      hint: '点两个相邻废料箱交换 · 连锁消除会加分'
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

    for (var rr = 0; rr < this.rows; rr++) {
      for (var cc = 0; cc < this.cols; cc++) {
        var val = this.grid[rr][cc];
        if (val === null || val === undefined) continue;
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
        if (this.invalidTimer > 0) tx += invalidX;
        this.drawTile(ctx, tx, ty, cell, val, popScale, popAlpha);
      }
    }

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
  };

  MatchGame.prototype.drawBackdrop = function (ctx) {
    var w = this.w;
    var h = this.h;
    ctx.fillStyle = '#020e14';
    ctx.fillRect(0, 0, w, h);
    var ok = drawCover(ctx, MATCH_BG, w, h, 0.5, 0.45);
    if (!ok) {
      var fallback = ctx.createLinearGradient(0, 0, 0, h);
      fallback.addColorStop(0, '#08262f');
      fallback.addColorStop(1, '#010a10');
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = 'rgba(1, 14, 20, 0.34)';
    ctx.fillRect(0, 0, w, h);
    var shade = ctx.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, 'rgba(0, 7, 12, 0.58)');
    shade.addColorStop(0.25, 'rgba(0, 7, 12, 0.06)');
    shade.addColorStop(0.75, 'rgba(0, 7, 12, 0.22)');
    shade.addColorStop(1, 'rgba(0, 7, 12, 0.75)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);

    var vignette = ctx.createRadialGradient(w * 0.5, h * 0.48, Math.min(w, h) * 0.2, w * 0.5, h * 0.52, Math.max(w, h) * 0.7);
    vignette.addColorStop(0, 'rgba(0, 6, 10, 0)');
    vignette.addColorStop(1, 'rgba(0, 5, 9, 0.48)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

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

  MatchGame.prototype.drawTile = function (ctx, cx, cy, cell, type, scale, alpha) {
    var data = TILES[type];
    var size = cell * 0.8 * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);

    // shadow
    ctx.fillStyle = 'rgba(0, 6, 10, 0.32)';
    ctx.beginPath();
    ctx.roundRect(-size / 2 + 1, -size / 2 + 2, size, size, size * 0.17);
    ctx.fill();

    var g = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
    g.addColorStop(0, data.color);
    g.addColorStop(0.58, data.dark);
    g.addColorStop(1, '#102b33');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(220, 255, 246, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    ctx.roundRect(-size / 2 + 2, -size / 2 + 2, size - 4, size * 0.25, size * 0.1);
    ctx.fill();

    var icon = TILE_IMAGES[type];
    if (icon && icon.complete && icon.naturalWidth) {
      ctx.drawImage(icon, -size * 0.32, -size * 0.32, size * 0.64, size * 0.64);
    } else {
      ctx.fillStyle = 'rgba(235, 255, 251, 0.9)';
      ctx.font = '800 ' + (size * 0.34) + 'px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.name.slice(0, 1), 0, 2);
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
