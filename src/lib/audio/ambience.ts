"use client";

/**
 * 수족관 소리.
 *
 * 오디오 파일을 쓰지 않고 WebAudio로 직접 만든다 — 로딩이 없고, 루프 이음매가 없고,
 * 매번 조금씩 다르다. 층은 셋:
 *   ① 물의 저역 웅얼거림 (브라운 노이즈 → 저역통과)
 *   ② 여과기 펌프의 아주 낮은 모터음
 *   ③ 산소 방울 — 짧은 사인 스윕. 가끔 몇 개가 몰려 "꼬르륵"이 된다.
 */

export class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private bubbleTimer: number | null = null;
  private running = false;

  get active() {
    return this.running;
  }

  async start(volume = 0.5) {
    if (this.running) return;

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    if (ctx.state === "suspended") await ctx.resume();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    this.buildWaterBed(ctx, master);
    this.buildPump(ctx, master);

    // 페이드 인 — 갑자기 소리가 나면 놀란다
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 3.5);

    this.running = true;
    this.scheduleBubbles();
  }

  stop() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master = this.master;

    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);

    if (this.bubbleTimer !== null) {
      window.clearTimeout(this.bubbleTimer);
      this.bubbleTimer = null;
    }

    window.setTimeout(() => {
      for (const n of this.nodes) {
        try {
          (n as OscillatorNode | AudioBufferSourceNode).stop?.();
        } catch {
          /* 이미 멈춘 노드 */
        }
        n.disconnect();
      }
      this.nodes = [];
      ctx.close().catch(() => {});
      this.ctx = null;
      this.master = null;
    }, 1400);

    this.running = false;
  }

  setVolume(v: number) {
    if (!this.ctx || !this.master) return;
    this.master.gain.linearRampToValueAtTime(v * 0.5, this.ctx.currentTime + 0.4);
  }

  /* ── ① 물 ── */
  private buildWaterBed(ctx: AudioContext, out: AudioNode) {
    const len = ctx.sampleRate * 6;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);

    // 브라운 노이즈 — 화이트보다 훨씬 물에 가깝다
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.019 * white) / 1.019;
      data[i] = last * 3.4;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    lp.Q.value = 0.6;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 45;

    const g = ctx.createGain();
    g.gain.value = 0.34;

    // 아주 느린 물결 — 소리가 살아 있게
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.055;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();

    src.connect(hp).connect(lp).connect(g).connect(out);
    src.start();

    this.nodes.push(src, lfo, lp, hp, g, lfoGain);
  }

  /* ── ② 여과기 펌프 ── */
  private buildPump(ctx: AudioContext, out: AudioNode) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 58;

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = 117;

    const g = ctx.createGain();
    g.gain.value = 0.035;
    const g2 = ctx.createGain();
    g2.gain.value = 0.012;

    // 미세한 흔들림 — 기계가 돌고 있다는 느낌
    const wobble = ctx.createOscillator();
    wobble.frequency.value = 0.7;
    const wobbleGain = ctx.createGain();
    wobbleGain.gain.value = 1.8;
    wobble.connect(wobbleGain).connect(osc.frequency);
    wobble.start();

    osc.connect(g).connect(out);
    osc2.connect(g2).connect(out);
    osc.start();
    osc2.start();

    this.nodes.push(osc, osc2, wobble, g, g2, wobbleGain);
  }

  /* ── ③ 방울 ── */
  private bubble(delay = 0, size = 1) {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out) return;

    const t = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    // 작은 방울은 높고 빠르게, 큰 방울은 낮고 길게 — 실제 물리와 같은 방향
    const base = 420 / size;
    osc.frequency.setValueAtTime(base * 0.55, t);
    osc.frequency.exponentialRampToValueAtTime(base * 2.1, t + 0.035 * size);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05 * size, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075 * size);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = base * 1.4;
    bp.Q.value = 2.2;

    osc.connect(bp).connect(g).connect(out);
    osc.start(t);
    osc.stop(t + 0.12 * size + 0.05);
  }

  /** 다음 방울(들)을 예약한다. 가끔 여러 개가 몰려 꼬르륵 소리가 난다. */
  private scheduleBubbles() {
    if (!this.running && this.bubbleTimer === null && !this.ctx) return;

    const burst = Math.random() < 0.22;
    if (burst) {
      // 꼬르륵 — 4~9개가 빠르게
      const n = 4 + Math.floor(Math.random() * 6);
      for (let i = 0; i < n; i++) {
        this.bubble(i * (0.035 + Math.random() * 0.05), 0.7 + Math.random() * 0.6);
      }
    } else {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        this.bubble(i * (0.12 + Math.random() * 0.3), 0.8 + Math.random() * 0.9);
      }
    }

    const wait = burst ? 2600 + Math.random() * 4200 : 900 + Math.random() * 2600;
    this.bubbleTimer = window.setTimeout(() => {
      if (this.ctx) this.scheduleBubbles();
    }, wait);
  }

  /** 밥 줄 때 — 수면을 톡톡 두드리는 소리 */
  plop() {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out) return;
    for (let i = 0; i < 5; i++) {
      this.bubble(i * 0.06 + Math.random() * 0.04, 1.3 + Math.random() * 0.5);
    }
  }

  /** 물갈이 — 물이 쏟아지는 소리 */
  pour() {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out) return;

    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 2.4);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.04 * white) / 1.04;
      data[i] = last * 2.6;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.linearRampToValueAtTime(1600, t + 1.1);
    bp.frequency.linearRampToValueAtTime(500, t + 2.4);
    bp.Q.value = 1.1;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.25);
    g.gain.setValueAtTime(0.12, t + 1.6);
    g.gain.linearRampToValueAtTime(0, t + 2.4);

    src.connect(bp).connect(g).connect(out);
    src.start(t);

    for (let i = 0; i < 14; i++) {
      this.bubble(0.2 + Math.random() * 1.9, 0.6 + Math.random() * 0.9);
    }
  }
}

let singleton: Ambience | null = null;

export function ambience(): Ambience {
  if (!singleton) singleton = new Ambience();
  return singleton;
}
