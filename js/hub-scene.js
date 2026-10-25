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
    var n = Math.round(clamp(this.w / 24, 24, 72));
    for (var i = 0; i < n; i++) {
      this.rain.push({
        x: Math.random(),
        y: Math.random(),
        speed: rand(0.35, 1.0),
        len: rand(10, 26),
        alpha: rand(0.04, 0.15)
      });
    }
  };

  Hub.prototype.updateScene = function (dt) {
    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3.2);
    this.lightningTimer -= dt;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = rand(9, 19);
      this.lightningFlash = 1;
    }
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
    ctx.fillStyle = '#020a10';
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
      fallback.addColorStop(0, '#04151f');
      fallback.addColorStop(1, '#01070b');
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, w, frameH);
    }
    ctx.restore();

    // Darken the photo so HUD / panels stay readable.
    ctx.fillStyle = isTitle ? 'rgba(1, 12, 19, 0.18)' : 'rgba(1, 12, 18, 0.24)';
    ctx.fillRect(0, 0, w, h);

    var topShade = ctx.createLinearGradient(0, 0, 0, Math.min(180, h * 0.28));
    topShade.addColorStop(0, 'rgba(0, 7, 12, 0.72)');
    topShade.addColorStop(1, 'rgba(0, 7, 12, 0)');
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, w, Math.min(180, h * 0.28));

    var bottomShade = ctx.createLinearGradient(0, h * 0.52, 0, h);
    bottomShade.addColorStop(0, 'rgba(0, 7, 11, 0)');
    bottomShade.addColorStop(0.7, 'rgba(0, 7, 11, 0.5)');
    bottomShade.addColorStop(1, 'rgba(0, 7, 11, 0.82)');
    ctx.fillStyle = bottomShade;
    ctx.fillRect(0, h * 0.52, w, h * 0.48);

    var vignette = ctx.createRadialGradient(w * 0.5, h * 0.46, Math.min(w, h) * 0.22, w * 0.5, h * 0.5, Math.max(w, h) * 0.76);
    vignette.addColorStop(0, 'rgba(0, 6, 10, 0)');
    vignette.addColorStop(1, 'rgba(0, 5, 9, 0.62)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    this.drawRain(ctx);

    if (this.lightningFlash > 0) {
      ctx.fillStyle = 'rgba(198, 232, 242, ' + (this.lightningFlash * 0.13).toFixed(3) + ')';
      ctx.fillRect(0, 0, w, h);
    }
  };

  Hub.prototype.drawRain = function (ctx) {
    if (!this.rain || !this.rain.length) return;
    ctx.save();
    ctx.lineCap = 'round';
    for (var i = 0; i < this.rain.length; i++) {
      var r = this.rain[i];
      var speed = 58 * r.speed;
      var y = mod(r.y * this.h + this.time * speed, this.h + 40) - 20;
      var x = r.x * this.w + Math.sin(this.time * 0.3 + i) * 3;
      var l = r.len;
      ctx.strokeStyle = 'rgba(180, 222, 231, ' + r.alpha.toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2.5, y + l);
      ctx.stroke();
    }
    ctx.restore();
  };

  CW.loadImage = CW.loadImage || loadImage;
})();
