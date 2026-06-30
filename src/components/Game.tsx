import { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface GameProps {
  onExit: () => void;
}

const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
const MAP_W = MAP[0].length;
const MAP_H = MAP.length;
const FOV = Math.PI / 3;
const MAX_HP = 100;

interface Enemy {
  x: number; y: number; hp: number; alive: boolean; hitFlash: number;
}

// Трекинг пальцев для мультитач
interface TouchTrack {
  id: number;       // identifier касания
  zone: 'move' | 'look' | 'fire';
  startX: number; startY: number;
  curX: number; curY: number;
}

const isWall = (x: number, y: number) => {
  const mx = Math.floor(x), my = Math.floor(y);
  if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H) return true;
  return MAP[my][mx] === 1;
};

const spawnEnemies = (count: number): Enemy[] => {
  const list: Enemy[] = [];
  let g = 0;
  while (list.length < count && g++ < 500) {
    const x = 1 + Math.random() * (MAP_W - 2);
    const y = 1 + Math.random() * (MAP_H - 2);
    if (!isWall(x, y) && (x < 2 || x > 4 || y < 2 || y > 4))
      list.push({ x, y, hp: 100, alive: true, hitFlash: 0 });
  }
  return list;
};

const Game = ({ onExit }: GameProps) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [hp,       setHp]       = useState(MAX_HP);
  const [score,    setScore]    = useState(0);
  const [wave,     setWave]     = useState(1);
  const [ammo,     setAmmo]     = useState(12);
  const [gameOver, setGameOver] = useState(false);
  const [muzzle,   setMuzzle]   = useState(false);
  const [reloading,setReloading]= useState(false);

  const touches = useRef<TouchTrack[]>([]);

  const state = useRef({
    px: 2.5, py: 2.5, dir: 0,
    keys: {} as Record<string, boolean>,
    enemies: spawnEnemies(5),
    hp: MAX_HP, score: 0, wave: 1, ammo: 12,
    over: false, reloading: false, shootCd: 0,
  });

  // ── СТРЕЛЬБА ────────────────────────────────────────────
  const shoot = useCallback(() => {
    const s = state.current;
    if (s.over || s.reloading || s.ammo <= 0 || s.shootCd > 0) return;
    s.ammo -= 1; s.shootCd = 10;
    setAmmo(s.ammo);
    setMuzzle(true);
    setTimeout(() => setMuzzle(false), 80);

    let best: Enemy | null = null;
    let bestDist = Infinity;
    for (const e of s.enemies) {
      if (!e.alive) continue;
      const dx = e.x - s.px, dy = e.y - s.py;
      const dist = Math.hypot(dx, dy);
      let ang = Math.atan2(dy, dx) - s.dir;
      while (ang < -Math.PI) ang += Math.PI * 2;
      while (ang >  Math.PI) ang -= Math.PI * 2;
      const tol = 0.14 / Math.max(1, dist * 0.4);
      if (Math.abs(ang) < tol && dist < bestDist) {
        let blocked = false;
        const steps = Math.floor(dist * 8);
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          if (isWall(s.px + dx * t, s.py + dy * t)) { blocked = true; break; }
        }
        if (!blocked) { best = e; bestDist = dist; }
      }
    }
    if (best) {
      best.hp -= 50; best.hitFlash = 6;
      if (best.hp <= 0) {
        best.alive = false;
        s.score += 100; setScore(s.score);
        if (s.enemies.every(en => !en.alive)) {
          s.wave += 1; setWave(s.wave);
          s.enemies = spawnEnemies(4 + s.wave);
        }
      }
    }
    if (s.ammo <= 0) reload();
  }, []);

  const reload = useCallback(() => {
    const s = state.current;
    if (s.reloading || s.ammo === 12) return;
    s.reloading = true; setReloading(true);
    setTimeout(() => { s.ammo = 12; s.reloading = false; setAmmo(12); setReloading(false); }, 900);
  }, []);

  // ── КЛАВИАТУРА + МЫШЬ ───────────────────────────────────
  useEffect(() => {
    const s = state.current;
    const canvas = canvasRef.current!;

    const kd = (e: KeyboardEvent) => {
      s.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'r') reload();
    };
    const ku = (e: KeyboardEvent) => { s.keys[e.key.toLowerCase()] = false; };
    const onMouse = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) s.dir += e.movementX * 0.0025;
    };
    const onClick = () => {
      if (document.pointerLockElement === canvas) shoot();
      else canvas.requestPointerLock();
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('mousemove', onMouse);
    canvas.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('mousedown', onClick);
    };
  }, [shoot, reload]);

  // ── МУЛЬТИТАЧ ───────────────────────────────────────────
  useEffect(() => {
    const wrap = wrapperRef.current!;
    const W = () => wrap.clientWidth;

    const zone = (x: number): TouchTrack['zone'] => {
      if (x < W() * 0.45) return 'move';   // левая 45% — движение
      if (x > W() * 0.82) return 'fire';   // правая 18% — огонь
      return 'look';                         // центр — обзор
    };

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        const z = zone(t.clientX);
        touches.current.push({ id: t.identifier, zone: z, startX: t.clientX, startY: t.clientY, curX: t.clientX, curY: t.clientY });
        if (z === 'fire') shoot();
      }
    };

    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        const tr = touches.current.find(x => x.id === t.identifier);
        if (tr) { tr.curX = t.clientX; tr.curY = t.clientY; }
      }
    };

    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches))
        touches.current = touches.current.filter(x => x.id !== t.identifier);
    };

    wrap.addEventListener('touchstart',  onStart, { passive: false });
    wrap.addEventListener('touchmove',   onMove,  { passive: false });
    wrap.addEventListener('touchend',    onEnd,   { passive: false });
    wrap.addEventListener('touchcancel', onEnd,   { passive: false });
    return () => {
      wrap.removeEventListener('touchstart',  onStart);
      wrap.removeEventListener('touchmove',   onMove);
      wrap.removeEventListener('touchend',    onEnd);
      wrap.removeEventListener('touchcancel', onEnd);
    };
  }, [shoot]);

  // ── ИГРОВОЙ ЦИКЛ ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let last = performance.now();

    const resize = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tryMove = (nx: number, ny: number) => {
      const s = state.current;
      if (!isWall(nx, s.py)) s.px = nx;
      if (!isWall(s.px, ny)) s.py = ny;
    };

    const loop = (now: number) => {
      const dt  = Math.min(0.05, (now - last) / 1000); last = now;
      const s   = state.current;
      const W   = canvas.width, H = canvas.height;

      if (!s.over) {
        const speed = 2.6 * dt, rot = 1.8 * dt;
        let fwd = 0, str = 0;

        if (s.keys['w'] || s.keys['arrowup'])    fwd += 1;
        if (s.keys['s'] || s.keys['arrowdown'])  fwd -= 1;
        if (s.keys['a'])                          str -= 1;
        if (s.keys['d'])                          str += 1;
        if (s.keys['arrowleft'])                  s.dir -= rot;
        if (s.keys['arrowright'])                 s.dir += rot;

        // читаем джойстики из мультитач
        const wrap = wrapperRef.current!;
        const ww = wrap.clientWidth;
        const DEAD = 8; // мёртвая зона px

        for (const tr of touches.current) {
          const dx = tr.curX - tr.startX;
          const dy = tr.curY - tr.startY;
          if (tr.zone === 'move') {
            const len = Math.hypot(dx, dy);
            if (len > DEAD) { fwd += -dy / len; str += dx / len; }
          }
          if (tr.zone === 'look') {
            if (Math.abs(dx) > DEAD) s.dir += (dx / ww) * 6 * dt * 60;
          }
        }

        const mag = Math.hypot(fwd, str);
        if (mag > 0) {
          const nf = fwd / Math.max(1, mag), ns = str / Math.max(1, mag);
          tryMove(
            s.px + Math.cos(s.dir) * nf * speed - Math.sin(s.dir) * ns * speed,
            s.py + Math.sin(s.dir) * nf * speed + Math.cos(s.dir) * ns * speed,
          );
        }
        if (s.shootCd > 0) s.shootCd -= 1;

        // AI
        let dmg = 0;
        for (const e of s.enemies) {
          if (!e.alive) continue;
          if (e.hitFlash > 0) e.hitFlash -= 1;
          const dx = s.px - e.x, dy = s.py - e.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.8) {
            const sp = (0.55 + s.wave * 0.04) * dt;
            const nx = e.x + (dx / dist) * sp, ny = e.y + (dy / dist) * sp;
            if (!isWall(nx, e.y)) e.x = nx;
            if (!isWall(e.x, ny)) e.y = ny;
          } else { dmg += 14 * dt; }
        }
        if (dmg > 0) {
          s.hp = Math.max(0, s.hp - dmg);
          setHp(Math.ceil(s.hp));
          if (s.hp <= 0) { s.over = true; setGameOver(true); document.exitPointerLock?.(); }
        }
      }

      // ── РЕНДЕР ──
      const sky = ctx.createLinearGradient(0, 0, 0, H / 2);
      sky.addColorStop(0, '#1a2030'); sky.addColorStop(1, '#0d0f14');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H / 2);
      const fl = ctx.createLinearGradient(0, H / 2, 0, H);
      fl.addColorStop(0, '#14110d'); fl.addColorStop(1, '#2a221a');
      ctx.fillStyle = fl; ctx.fillRect(0, H / 2, W, H / 2);

      // raycasting
      const zbuf = new Float32Array(W);
      for (let i = 0; i < W; i++) {
        const ra  = s.dir - FOV / 2 + (i / W) * FOV;
        const cos = Math.cos(ra), sin = Math.sin(ra);
        let dist = 0, hit = false, side = 0;
        while (!hit && dist < 20) {
          dist += 0.02;
          const tx = s.px + cos * dist, ty = s.py + sin * dist;
          if (isWall(tx, ty)) {
            hit = true;
            const fx = tx - Math.floor(tx), fy = ty - Math.floor(ty);
            side = Math.min(fx, 1 - fx) < Math.min(fy, 1 - fy) ? 0 : 1;
          }
        }
        const corr = dist * Math.cos(ra - s.dir);
        zbuf[i] = corr;
        const wH   = Math.min(H, H / corr);
        const shade = Math.max(0, 1 - corr / 12);
        const base  = side === 0 ? 90 : 64;
        const r = Math.floor(base * shade + 20);
        const g = Math.floor((base - 20) * shade + 12);
        const b = Math.floor((base - 35) * shade + 10);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i, (H - wH) / 2, 1, wH);
      }

      // спрайты
      s.enemies
        .filter(e => e.alive)
        .map(e => ({ e, d: Math.hypot(e.x - s.px, e.y - s.py) }))
        .sort((a, b) => b.d - a.d)
        .forEach(({ e, d }) => {
          let ang = Math.atan2(e.y - s.py, e.x - s.px) - s.dir;
          while (ang < -Math.PI) ang += Math.PI * 2;
          while (ang >  Math.PI) ang -= Math.PI * 2;
          if (Math.abs(ang) > FOV / 2 + 0.3) return;
          const sx   = (0.5 + ang / FOV) * W;
          const size = Math.min(H * 1.2, H / d);
          const sy   = H / 2 + size * 0.1;
          const col  = Math.floor(sx);
          if (col >= 0 && col < W && d > zbuf[Math.max(0, Math.min(W - 1, col))]) return;
          const flash = e.hitFlash > 0;
          ctx.fillStyle = flash ? '#ff5533' : '#b33327';
          ctx.fillRect(sx - size * 0.18, sy - size * 0.5, size * 0.36, size * 0.55);
          ctx.fillStyle = flash ? '#ffaa88' : '#8a3f2f';
          ctx.beginPath(); ctx.arc(sx, sy - size * 0.55, size * 0.12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffcc00';
          ctx.fillRect(sx - size * 0.05, sy - size * 0.58, size * 0.03, size * 0.03);
          ctx.fillRect(sx + size * 0.02, sy - size * 0.58, size * 0.03, size * 0.03);
          if (e.hp < 100) {
            ctx.fillStyle = '#000'; ctx.fillRect(sx - size * 0.18, sy - size * 0.62, size * 0.36, size * 0.03);
            ctx.fillStyle = '#33dd55'; ctx.fillRect(sx - size * 0.18, sy - size * 0.62, size * 0.36 * (e.hp / 100), size * 0.03);
          }
        });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  const restart = () => {
    const s = state.current;
    Object.assign(s, { px: 2.5, py: 2.5, dir: 0, hp: MAX_HP, score: 0, wave: 1, ammo: 12, over: false, reloading: false, shootCd: 0 });
    s.enemies = spawnEnemies(5);
    setHp(MAX_HP); setScore(0); setWave(1); setAmmo(12); setGameOver(false); setReloading(false);
  };

  // ── РЕНДЕР UI ───────────────────────────────────────────
  // Координаты джойстиков для отрисовки индикатора
  const getMoveJoy  = () => touches.current.find(t => t.zone === 'move');
  const getLookJoy  = () => touches.current.find(t => t.zone === 'look');

  return (
    <div ref={wrapperRef} className="fixed inset-0 z-[100] bg-black select-none overflow-hidden"
      style={{ touchAction: 'none', userSelect: 'none' }}>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* HUD верх */}
      <div className="absolute top-0 inset-x-0 flex items-start justify-between p-3 pointer-events-none">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Icon name="Heart" className="text-destructive" size={16} />
            <div className="w-32 h-2.5 bg-black/60 border border-white/20">
              <div className="h-full bg-destructive transition-all" style={{ width: `${(hp / MAX_HP) * 100}%` }} />
            </div>
            <span className="font-display text-white text-sm">{hp}</span>
          </div>
          <div className="font-display text-primary text-xs uppercase tracking-widest">Волна {wave}</div>
        </div>
        <div className="text-center">
          <div className="font-display text-white text-2xl">{score.toLocaleString('ru-RU')}</div>
          <div className="font-display text-[9px] uppercase tracking-widest text-white/50">Очки</div>
        </div>
        <button
          className="pointer-events-auto bg-black/60 border border-white/20 p-2"
          onTouchStart={(e) => { e.stopPropagation(); onExit(); }}
          onClick={onExit}
        >
          <Icon name="X" className="text-white" size={18} />
        </button>
      </div>

      {/* Прицел */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {muzzle && <div className="absolute -inset-8 bg-orange-400/40 blur-xl rounded-full" />}
          <Icon name="Crosshair" className="text-primary relative" size={32} />
        </div>
      </div>

      {/* Ствол */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none">
        <div
          className={`w-20 h-28 bg-gradient-to-t from-zinc-800 to-zinc-600 border-x-4 border-t-4 border-zinc-900 transition-transform ${muzzle ? 'translate-y-2' : ''}`}
          style={{ clipPath: 'polygon(35% 0, 65% 0, 80% 100%, 20% 100%)' }}
        />
      </div>

      {/* Патроны */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none" style={{ right: '20%' }}>
        <Icon name="Zap" className="text-primary" size={16} />
        <span className="font-display text-white text-xl">{ammo}</span>
        <span className="font-display text-white/40 text-base">/12</span>
        {reloading && <span className="font-display text-yellow-400 text-xs uppercase animate-pulse ml-1">Перезарядка…</span>}
      </div>

      {/* Подсказка десктоп */}
      <div className="hidden md:block absolute bottom-3 left-3 font-display text-[10px] uppercase tracking-widest text-white/40 pointer-events-none">
        WASD · Мышь · Клик = огонь · R = перезарядка
      </div>

      {/* ═══ МОБИЛЬНЫЙ UI ═══ */}
      <div className="md:hidden pointer-events-none absolute inset-0">

        {/* Зона движения (левая часть) — полупрозрачный круг */}
        <div className="absolute bottom-6 left-6 w-36 h-36 rounded-full border-2 border-white/15 bg-white/5 flex items-center justify-center">
          <Icon name="Move" className="text-white/25" size={32} />
          {/* индикатор пальца */}
          {getMoveJoy() && (() => {
            const t = getMoveJoy()!;
            const dx = Math.max(-50, Math.min(50, t.curX - t.startX));
            const dy = Math.max(-50, Math.min(50, t.curY - t.startY));
            return (
              <div className="absolute w-10 h-10 rounded-full bg-primary/60 border border-primary"
                style={{ transform: `translate(${dx}px, ${dy}px)` }} />
            );
          })()}
        </div>

        {/* Зона обзора (центр) — подпись */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <span className="font-display text-[9px] uppercase tracking-widest text-white/20">← обзор →</span>
        </div>

        {/* Кнопка огня (правый нижний угол) — БОЛЬШАЯ */}
        <button
          className="pointer-events-auto absolute bottom-6 right-4 w-24 h-24 rounded-full flex items-center justify-center border-2 border-primary active:scale-90 transition-transform"
          style={{ background: 'rgba(234,88,12,0.25)' }}
          onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); shoot(); }}
        >
          <Icon name="Crosshair" className="text-primary" size={36} />
        </button>

        {/* Кнопка перезарядки */}
        <button
          className="pointer-events-auto absolute bottom-36 right-4 w-14 h-14 rounded-full bg-black/50 border border-white/25 flex items-center justify-center active:scale-90 transition-transform"
          onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); reload(); }}
        >
          <Icon name="RotateCcw" className="text-white/70" size={22} />
        </button>
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center" style={{ zIndex: 200 }}>
          <div className="font-display font-700 uppercase text-5xl text-destructive tracking-wide">Вы пали</div>
          <div className="mt-3 font-display text-white text-lg">
            Очки: <span className="text-primary">{score.toLocaleString('ru-RU')}</span> · Волна {wave}
          </div>
          <div className="mt-8 flex gap-4">
            <Button onClick={restart} className="font-display uppercase tracking-widest rounded-none h-12 px-6">
              <Icon name="RotateCcw" className="mr-2" size={16} /> Заново
            </Button>
            <Button onClick={onExit} variant="outline" className="font-display uppercase tracking-widest rounded-none h-12 px-6 border-white/30 text-white">
              Выход
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
