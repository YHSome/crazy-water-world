/* ═══════════════════════════════════════════════════════════════
   疯狂水世界 · soundscape
   One local BGM loop + synthesized Web Audio effects.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var HW = (window.HW = window.HW || {});
  var MUTE_KEY = 'crazywater.muted.v1';

  function AudioEngine() {
    this.ctx = null;
    this.master = null;
    this.ambientGain = null;
    this.noiseBuffer = null;
    this.built = false;
    this.bgm = null;
    this.bgmWanted = false;
    this.muted = false;
    HW.audio = this;
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch (err) {
      this.muted = false;
    }
  }

  AudioEngine.prototype.unlock = function () {
    if (!this.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch (err) {
        return;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.82;
      this.master.connect(this.ctx.destination);
      this.makeNoise();
      this.buildAmbient();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(function () {});
    }
    this.playBgm();
  };

  AudioEngine.prototype.initBgm = function () {
    if (this.bgm) return;
    try {
      var a = new Audio('assets/bgm-floodline.mp3');
      a.loop = true;
      a.preload = 'auto';
      a.volume = 0.19;
      this.bgm = a;
    } catch (err) {
      this.bgm = null;
    }
  };

  AudioEngine.prototype.playBgm = function () {
    this.bgmWanted = true;
    this.initBgm();
    if (!this.bgm || this.muted) return;
    var p = this.bgm.play();
    if (p && p.catch) p.catch(function () {});
  };

  AudioEngine.prototype.makeNoise = function () {
    if (!this.ctx) return;
    var rate = this.ctx.sampleRate;
    var length = Math.floor(rate * 2.2);
    var buffer = this.ctx.createBuffer(1, length, rate);
    var data = buffer.getChannelData(0);
    var last = 0;
    for (var i = 0; i < length; i++) {
      var white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    this.noiseBuffer = buffer;
  };

  AudioEngine.prototype.buildAmbient = function () {
    if (!this.ctx || this.built) return;
    this.built = true;

    var ctx = this.ctx;
    var bus = ctx.createGain();
    bus.gain.value = 0.0001;
    bus.connect(this.master);
    this.ambientGain = bus;

    // A slow low-pass sweep gives the water a sense of pressure.
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    filter.Q.value = 0.7;

    var lfo = ctx.createOscillator();
    var lfoDepth = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.055;
    lfoDepth.gain.value = 150;
    lfo.connect(lfoDepth);
    lfoDepth.connect(filter.frequency);
    lfo.start();

    if (this.noiseBuffer) {
      var noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.loop = true;
      var noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.085;
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(bus);
      noise.start();
    }

    var drone = [
      { f: 55, g: 0.12, type: 'sine' },
      { f: 82.5, g: 0.045, type: 'sine' },
      { f: 110.3, g: 0.018, type: 'triangle' }
    ];
    for (var i = 0; i < drone.length; i++) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var trem = ctx.createOscillator();
      var tremDepth = ctx.createGain();
      osc.type = drone[i].type;
      osc.frequency.value = drone[i].f;
      gain.gain.value = drone[i].g;
      trem.type = 'sine';
      trem.frequency.value = 0.07 + i * 0.031;
      tremDepth.gain.value = drone[i].g * 0.34;
      trem.connect(tremDepth);
      tremDepth.connect(gain.gain);
      osc.connect(gain);
      gain.connect(bus);
      osc.start();
      trem.start();
    }

    var now = ctx.currentTime;
    bus.gain.setValueAtTime(0.0001, now);
    bus.gain.exponentialRampToValueAtTime(0.15, now + 3.5);
  };

  AudioEngine.prototype.setMuted = function (muted) {
    this.muted = !!muted;
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch (err) {}
    if (this.master && this.ctx) {
      var now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.82, now, 0.04);
    }
    if (this.muted) {
      if (this.bgm) this.bgm.pause();
    } else if (this.bgmWanted) {
      this.playBgm();
    }
  };

  AudioEngine.prototype.toggleMuted = function () {
    this.setMuted(!this.muted);
    return this.muted;
  };

  AudioEngine.prototype.tone = function (freq, dur, type, vol, delay, slideTo) {
    if (!this.ctx || this.muted) return;
    var ctx = this.ctx;
    var t = ctx.currentTime + (delay || 0);
    dur = dur || 0.2;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(Math.max(20, freq), t);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    }
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol || 0.1), t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.04);
  };

  AudioEngine.prototype.noiseBurst = function (dur, vol, frequency, q, delay) {
    if (!this.ctx || !this.noiseBuffer || this.muted) return;
    var ctx = this.ctx;
    var t = ctx.currentTime + (delay || 0);
    dur = dur || 0.3;
    var src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency || 700, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, (frequency || 700) * 0.35), t + dur);
    filter.Q.value = q || 1.1;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0003, vol || 0.12), t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.05);
  };

  AudioEngine.prototype.click = function () {
    this.tone(620, 0.08, 'sine', 0.055, 0, 760);
  };

  AudioEngine.prototype.pickup = function (step) {
    var notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    var n = notes[Math.abs(step || 0) % notes.length];
    this.tone(n, 0.16, 'sine', 0.085);
    this.tone(n * 2, 0.11, 'sine', 0.028, 0.03);
  };

  AudioEngine.prototype.coin = function () {
    this.tone(880, 0.12, 'triangle', 0.095, 0, 1040);
    this.tone(1318.5, 0.22, 'sine', 0.065, 0.075);
  };

  AudioEngine.prototype.relic = function () {
    var notes = [392, 523.25, 659.25, 783.99, 1046.5];
    for (var i = 0; i < notes.length; i++) {
      this.tone(notes[i], 0.55, 'sine', 0.07, i * 0.085);
    }
    this.noiseBurst(0.7, 0.045, 2600, 1.8, 0.02);
  };

  AudioEngine.prototype.air = function () {
    this.noiseBurst(0.42, 0.075, 950, 0.9);
    this.tone(210, 0.4, 'sine', 0.07, 0, 520);
    this.tone(630, 0.3, 'sine', 0.04, 0.12, 840);
  };

  AudioEngine.prototype.repair = function () {
    this.tone(440, 0.18, 'triangle', 0.08);
    this.tone(660, 0.28, 'triangle', 0.075, 0.1);
    this.tone(880, 0.32, 'sine', 0.05, 0.2);
  };

  AudioEngine.prototype.dash = function () {
    this.noiseBurst(0.34, 0.1, 1500, 0.8);
    this.tone(140, 0.28, 'sawtooth', 0.035, 0, 380);
  };

  AudioEngine.prototype.hurt = function () {
    this.tone(150, 0.45, 'sawtooth', 0.16, 0, 46);
    this.tone(80, 0.5, 'sine', 0.12, 0.01, 38);
    this.noiseBurst(0.32, 0.12, 380, 0.8);
  };

  AudioEngine.prototype.warn = function () {
    this.tone(880, 0.12, 'square', 0.035);
    this.tone(880, 0.12, 'square', 0.03, 0.18);
  };

  AudioEngine.prototype.death = function () {
    var notes = [329.63, 293.66, 246.94, 196.0, 146.83];
    for (var i = 0; i < notes.length; i++) {
      this.tone(notes[i], 1.2, 'sine', 0.08, i * 0.18);
    }
    this.noiseBurst(1.8, 0.06, 520, 0.7, 0.1);
  };

  AudioEngine.prototype.record = function () {
    var notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    for (var i = 0; i < notes.length; i++) {
      this.tone(notes[i], 0.7, 'triangle', 0.055, i * 0.09);
    }
  };

  AudioEngine.prototype.buy = function () {
    this.tone(740, 0.12, 'triangle', 0.07);
    this.tone(988, 0.14, 'sine', 0.06, 0.07);
    this.tone(1480, 0.22, 'sine', 0.035, 0.14);
  };

  window.addEventListener('pagehide', function () {
    if (HW.audio && HW.audio.bgm) HW.audio.bgm.pause();
  });

  HW.AudioEngine = AudioEngine;
})();
