/* ═══════════════════════════════════════════════════════════════
   疯狂水世界 · 末日海景
   Photography-based backdrop: the drowned world and the last boat.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CW = window.CW;
  if (!CW || !CW.Hub) return;
  var Hub = CW.Hub;
  var clamp = CW.clamp;
  var rand = CW.rand;
  var mod = CW.mod;

  function loadImage(src) {
    var img = new Image();
    img.decoding = 'async';
    img.src = src;
    return img;
  }

  Hub.prototype.initScene = function () {
    this.titleBg = loadImage('assets/bg-title.webp');
    this.hubBg = loadImage('assets/bg-hub.webp');
    this.buildRain();
    this.lightningFlash = 0;
    this.lightningTimer = 9;
    this.waterline = this.h * 0.76;
    this.targetWaterline = this.waterline;
  };

  Hub.prototype.resizeScene = function () {
    this.buildRain();
  };

  Hub.prototype.buildRain = function () {
    this.rain = [];
    var n = this.lowFx ? Math.round(clamp(this.w / 80, 6, 12)) : Math.round(clamp(this.w / 38, 14, 36));
    for (var i = 0; i < n; i++) {
      this.rain.push({
        x: Math.random(),
        y: Math.random(),
        speed: rand(0.22, 0.6),
        len: rand(7, 17),
        alpha: rand(0.025, 0.07)
      });
    }
  };

  Hub.prototype.updateScene = function (dt) {
    this.lightningFlash = 0;
  };

  Hub.prototype.drawCover = function (ctx, img, dw, dh, focusX, focusY) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    var scale = Math.max(dw / img.naturalWidth, dh / img.naturalHeight);
    var w = img.naturalWidth * scale;
    var h = img.naturalHeight * scale;
    var dx = (dw - w) * (focusX == null ? 0.5 : focusX);
    var dy = (dh - h) * (focusY == null ? 0.5 : focusY);
    ctx.drawImage(img, dx, dy, w, h);
    return true;
  };

  Hub.prototype.renderScene = function () {
    var ctx = this.ctx;
    var w = this.w;
    var h = this.h;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#bfeef2';
    ctx.fillRect(0, 0, w, h);

    var isTitle = this.state === 'title';
    var frameH = h;
    if (!isTitle && !this.sideLayout && this.dom.panel && !this.dom.panel.classList.contains('hidden')) {
      var panelTop = this.dom.panel.getBoundingClientRect().top;
      if (panelTop > 120) frameH = panelTop;
    }

    var img = isTitle ? this.titleBg : this.hubBg;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, frameH);
    ctx.clip();
    var ok = this.drawCover(ctx, img, w, frameH, isTitle ? 0.5 : 0.46, isTitle ? 0.62 : 0.5);
    if (!ok) {
      var fallback = ctx.createLinearGradient(0, 0, 0, frameH);
      fallback.addColorStop(0, '#e8fbf6');
      fallback.addColorStop(1, '#72d6d4');
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, w, frameH);
    }
    ctx.restore();

    // Bright coastal wash: keep the photo sunny instead of grading it dark.
    ctx.fillStyle = isTitle ? 'rgba(255, 248, 224, 0.04)' : 'rgba(255, 250, 234, 0.06)';
    ctx.fillRect(0, 0, w, h);

    var sun = ctx.createRadialGradient(w * 0.78, -h * 0.08, 0, w * 0.78, -h * 0.08, h * 1.05);
    sun.addColorStop(0, 'rgba(255, 244, 185, 0.34)');
    sun.addColorStop(0.45, 'rgba(255, 244, 205, 0.08)');
    sun.addColorStop(1, 'rgba(255, 248, 225, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);

    var bottomShade = ctx.createLinearGradient(0, h * 0.62, 0, h);
    bottomShade.addColorStop(0, 'rgba(255, 249, 233, 0)');
    bottomShade.addColorStop(1, 'rgba(255, 249, 233, 0.3)');
    ctx.fillStyle = bottomShade;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);

    this.drawRain(ctx);

    // Side-panel backdrop: keep the panel readable even when the browser
    // composites the canvas in a separate layer over the DOM sheet.
    if (!isTitle && this.sideLayout && this.dom.panel && !this.dom.panel.classList.contains('hidden')) {
      var pr = this.dom.panel.getBoundingClientRect();
      if (pr.width > 0) {
        ctx.fillStyle = '#fffdf7';
        ctx.beginPath();
        ctx.roundRect(pr.left, pr.top, pr.width, pr.height, 22);
        ctx.fill();
      }
    }
  };

  Hub.prototype.drawRain = function (ctx) {
    if (this.lowFx) return;
    if (!this.rain || !this.rain.length) return;
    ctx.save();
    ctx.lineCap = 'round';
    for (var i = 0; i < this.rain.length; i++) {
      var r = this.rain[i];
      var speed = 58 * r.speed;
      var y = mod(r.y * this.h + this.time * speed, this.h + 40) - 20;
      var x = r.x * this.w + Math.sin(this.time * 0.3 + i) * 3;
      var l = r.len;
      ctx.strokeStyle = 'rgba(255, 255, 250, ' + r.alpha.toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 1.5, y + l);
      ctx.stroke();
    }
    ctx.restore();
  };

  CW.loadImage = CW.loadImage || loadImage;
})();
