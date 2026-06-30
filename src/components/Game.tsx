import { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface GameProps {
  onExit: () => void;
}

// Карта: 1 — стена, 0 — пусто
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
  x: number;
  y: number;
  hp: number;
  alive: boolean;
  hitFlash: number;
}

const isWall = (x: number, y: number) => {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H) return true;
  return MAP[my][mx] === 1;
};

const spawnEnemies = (count: number): Enemy[] => {
  const list: Enemy[] = [];
  let guard = 0;
  while (list.length < count && guard < 500) {
    guard++;
    const x = 1 + Math.random() * (MAP_W - 2);
    const y = 1 + Math.random() * (MAP_H - 2);
    if (!isWall(x, y) && (x < 2 || x > 4 || y < 2 || y > 4)) {
      list.push({ x, y, hp: 100, alive: true, hitFlash: 0 });
    }
  }
  return list;
};

const Game = ({ onExit }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hp, setHp] = useState(MAX_HP);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [ammo, setAmmo] = useState(12);
  const [gameOver, setGameOver] = useState(false);
  const [muzzle, setMuzzle] = useState(false);

  // изменяемое состояние игры в рефах (без перерендеров)
  const state = useRef({
    px: 2.5,
    py: 2.5,
    dir: 0,
    keys: {} as Record<string, boolean>,
    enemies: spawnEnemies(5),
    hp: MAX_HP,
    score: 0,
    wave: 1,
    ammo: 12,
    over: false,
    reloading: false,
    shootCd: 0,
    moveJoy: { x: 0, y: 0, active: false },
    lookJoy: { x: 0, y: 0, active: false },
  });

  const shoot = useCallback(() => {
    const s = state.current;
    if (s.over || s.reloading || s.ammo <= 0 || s.shootCd > 0) return;
    s.ammo -= 1;
    s.shootCd = 12;
    setAmmo(s.ammo);
    setMuzzle(true);
    setTimeout(() => setMuzzle(false), 70);

    // попадание в центр экрана
    let best: Enemy | null = null;
    const bestAng = 0.12;
    let bestDist = Infinity;
    for (const e of s.enemies) {
      if (!e.alive) continue;
      const dx = e.x - s.px;
      const dy = e.y - s.py;
      const dist = Math.hypot(dx, dy);
      let ang = Math.atan2(dy, dx) - s.dir;
      while (ang < -Math.PI) ang += Math.PI * 2;
      while (ang > Math.PI) ang -= Math.PI * 2;
      const tol = bestAng / Math.max(1, dist * 0.5);
      if (Math.abs(ang) < tol && dist < bestDist) {
        // проверка стены между игроком и врагом
        let blocked = false;
        const steps = Math.floor(dist * 8);
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          if (isWall(s.px + dx * t, s.py + dy * t)) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          best = e;
          bestDist = dist;
        }
      }
    }
    if (best) {
      best.hp -= 50;
      best.hitFlash = 6;
      if (best.hp <= 0) {
        best.alive = false;
        s.score += 100;
        setScore(s.score);
        if (s.enemies.every((en) => !en.alive)) {
          s.wave += 1;
          setWave(s.wave);
          s.enemies = spawnEnemies(4 + s.wave);
        }
      }
    }
    if (s.ammo <= 0) reload();
  }, []);

  const reload = useCallback(() => {
    const s = state.current;
    if (s.reloading || s.ammo === 12) return;
    s.reloading = true;
    setTimeout(() => {
      s.ammo = 12;
      s.reloading = false;
      setAmmo(12);
    }, 900);
  }, []);

  // ввод с клавиатуры / мыши
  useEffect(() => {
    const s = state.current;
    const kd = (e: KeyboardEvent) => {
      s.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'r') reload();
    };
    const ku = (e: KeyboardEvent) => {
      s.keys[e.key.toLowerCase()] = false;
    };
    const canvas = canvasRef.current!;
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        s.dir += e.movementX * 0.0025;
      }
    };
    const onClick = () => {
      if (document.pointerLockElement === canvas) shoot();
      else canvas.requestPointerLock();
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('mousemove', onMove);
    canvas.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mousedown', onClick);
    };
  }, [shoot, reload]);

  // главный игровой цикл + рендер
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const tryMove = (nx: number, ny: number) => {
      const s = state.current;
      if (!isWall(nx, s.py)) s.px = nx;
      if (!isWall(s.px, ny)) s.py = ny;
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = state.current;
      const W = canvas.width;
      const H = canvas.height;

      if (!s.over) {
        // движение
        const speed = 2.6 * dt;
        const rot = 1.8 * dt;
        let fwd = 0;
        let strafe = 0;
        if (s.keys['w'] || s.keys['arrowup']) fwd += 1;
        if (s.keys['s'] || s.keys['arrowdown']) fwd -= 1;
        if (s.keys['a']) strafe -= 1;
        if (s.keys['d']) strafe += 1;
        if (s.keys['arrowleft']) s.dir -= rot;
        if (s.keys['arrowright']) s.dir += rot;
        // джойстики (телефон)
        if (s.moveJoy.active) {
          fwd += -s.moveJoy.y;
          strafe += s.moveJoy.x;
        }
        if (s.lookJoy.active) s.dir += s.lookJoy.x * rot * 2.2;

        const mag = Math.hypot(fwd, strafe);
        if (mag > 0) {
          const nf = fwd / Math.max(1, mag);
          const ns = strafe / Math.max(1, mag);
          tryMove(
            s.px + Math.cos(s.dir) * nf * speed - Math.sin(s.dir) * ns * speed,
            s.py + Math.sin(s.dir) * nf * speed + Math.cos(s.dir) * ns * speed,
          );
        }
        if (s.shootCd > 0) s.shootCd -= 1;

        // AI врагов: идут к игроку, наносят урон вблизи
        let dmg = 0;
        for (const e of s.enemies) {
          if (!e.alive) continue;
          if (e.hitFlash > 0) e.hitFlash -= 1;
          const dx = s.px - e.x;
          const dy = s.py - e.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.8) {
            const sp = (0.55 + s.wave * 0.04) * dt;
            const nx = e.x + (dx / dist) * sp;
            const ny = e.y + (dy / dist) * sp;
            if (!isWall(nx, e.y)) e.x = nx;
            if (!isWall(e.x, ny)) e.y = ny;
          } else {
            dmg += 14 * dt;
          }
        }
        if (dmg > 0) {
          s.hp = Math.max(0, s.hp - dmg);
          setHp(Math.ceil(s.hp));
          if (s.hp <= 0) {
            s.over = true;
            setGameOver(true);
            document.exitPointerLock?.();
          }
        }
      }

      // === РЕНДЕР ===
      // небо
      const sky = ctx.createLinearGradient(0, 0, 0, H / 2);
      sky.addColorStop(0, '#1a2030');
      sky.addColorStop(1, '#0d0f14');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H / 2);
      // пол
      const fl = ctx.createLinearGradient(0, H / 2, 0, H);
      fl.addColorStop(0, '#14110d');
      fl.addColorStop(1, '#2a221a');
      ctx.fillStyle = fl;
      ctx.fillRect(0, H / 2, W, H / 2);

      // raycasting стен
      const zbuf = new Float32Array(W);
      const rays = W;
      for (let i = 0; i < rays; i++) {
        const ra = s.dir - FOV / 2 + (i / rays) * FOV;
        const cos = Math.cos(ra);
        const sin = Math.sin(ra);
        let dist = 0;
        let hit = false;
        let side = 0;
        while (!hit && dist < 20) {
          dist += 0.02;
          const tx = s.px + cos * dist;
          const ty = s.py + sin * dist;
          if (isWall(tx, ty)) {
            hit = true;
            const fx = tx - Math.floor(tx);
            const fy = ty - Math.floor(ty);
            side = Math.min(fx, 1 - fx) < Math.min(fy, 1 - fy) ? 0 : 1;
          }
        }
        const corrected = dist * Math.cos(ra - s.dir);
        zbuf[i] = corrected;
        const wallH = Math.min(H, H / corrected);
        const shade = Math.max(0, 1 - corrected / 12);
        const base = side === 0 ? 90 : 64;
        const r = Math.floor(base * shade + 20);
        const g = Math.floor((base - 20) * shade + 12);
        const b = Math.floor((base - 35) * shade + 10);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i, (H - wallH) / 2, 1, wallH);
      }

      // спрайты врагов (сортировка по дальности)
      const visible = s.enemies
        .filter((e) => e.alive)
        .map((e) => ({ e, d: Math.hypot(e.x - s.px, e.y - s.py) }))
        .sort((a, b) => b.d - a.d);
      for (const { e, d } of visible) {
        let ang = Math.atan2(e.y - s.py, e.x - s.px) - s.dir;
        while (ang < -Math.PI) ang += Math.PI * 2;
        while (ang > Math.PI) ang -= Math.PI * 2;
        if (Math.abs(ang) > FOV / 2 + 0.3) continue;
        const sx = (0.5 + ang / FOV) * W;
        const size = Math.min(H * 1.2, H / d);
        const sy = H / 2 + size * 0.1;
        const col = Math.floor(sx);
        if (col >= 0 && col < W && d > zbuf[Math.max(0, Math.min(W - 1, col))]) continue;

        const flash = e.hitFlash > 0;
        // тело
        ctx.fillStyle = flash ? '#ff5533' : '#b33327';
        ctx.fillRect(sx - size * 0.18, sy - size * 0.5, size * 0.36, size * 0.55);
        // голова
        ctx.fillStyle = flash ? '#ffaa88' : '#8a3f2f';
        ctx.beginPath();
        ctx.arc(sx, sy - size * 0.55, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        // глаза-индикатор
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(sx - size * 0.05, sy - size * 0.58, size * 0.03, size * 0.03);
        ctx.fillRect(sx + size * 0.02, sy - size * 0.58, size * 0.03, size * 0.03);
        // полоска HP
        if (e.hp < 100) {
          ctx.fillStyle = '#000';
          ctx.fillRect(sx - size * 0.18, sy - size * 0.62, size * 0.36, size * 0.03);
          ctx.fillStyle = '#33dd55';
          ctx.fillRect(sx - size * 0.18, sy - size * 0.62, size * 0.36 * (e.hp / 100), size * 0.03);
        }
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const restart = () => {
    const s = state.current;
    s.px = 2.5;
    s.py = 2.5;
    s.dir = 0;
    s.hp = MAX_HP;
    s.score = 0;
    s.wave = 1;
    s.ammo = 12;
    s.over = false;
    s.reloading = false;
    s.enemies = spawnEnemies(5);
    setHp(MAX_HP);
    setScore(0);
    setWave(1);
    setAmmo(12);
    setGameOver(false);
  };

  // сенсорные джойстики
  const moveTouch = (e: React.TouchEvent, joy: 'moveJoy' | 'lookJoy') => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const t = e.touches[0];
    let dx = (t.clientX - cx) / (rect.width / 2);
    let dy = (t.clientY - cy) / (rect.height / 2);
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));
    state.current[joy] = { x: dx, y: dy, active: true };
  };
  const endTouch = (joy: 'moveJoy' | 'lookJoy') => {
    state.current[joy] = { x: 0, y: 0, active: false };
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* HUD сверху */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between pointer-events-none">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon name="Heart" className="text-destructive" size={18} />
            <div className="w-40 h-3 bg-black/60 border border-white/20">
              <div
                className="h-full bg-destructive transition-all"
                style={{ width: `${(hp / MAX_HP) * 100}%` }}
              />
            </div>
            <span className="font-display text-white text-sm">{hp}</span>
          </div>
          <div className="font-display text-primary text-xs uppercase tracking-widest">
            Волна {wave}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-white text-3xl leading-none tracking-wide">
            {score.toLocaleString('ru-RU')}
          </div>
          <div className="font-display text-[10px] uppercase tracking-[0.3em] text-white/60">Очки</div>
        </div>
        <button
          onClick={onExit}
          className="pointer-events-auto bg-black/60 border border-white/20 p-2 hover:border-primary"
        >
          <Icon name="X" className="text-white" size={20} />
        </button>
      </div>

      {/* прицел + вспышка */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {muzzle && (
            <div className="absolute -inset-8 bg-primary/40 blur-xl rounded-full animate-fade-in" />
          )}
          <Icon name="Crosshair" className="text-primary relative" size={36} />
        </div>
      </div>

      {/* пушка снизу */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none">
        <div
          className={`w-24 h-32 bg-gradient-to-t from-zinc-800 to-zinc-600 border-x-4 border-t-4 border-zinc-900 transition-transform ${
            muzzle ? 'translate-y-2' : ''
          }`}
          style={{ clipPath: 'polygon(35% 0, 65% 0, 80% 100%, 20% 100%)' }}
        />
      </div>

      {/* патроны */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none">
        <Icon name="Zap" className="text-primary" size={18} />
        <span className="font-display text-white text-2xl tracking-wider">{ammo}</span>
        <span className="font-display text-white/50 text-lg">/12</span>
      </div>

      {/* подсказка управления (десктоп) */}
      <div className="hidden md:block absolute bottom-4 left-4 font-display text-[11px] uppercase tracking-widest text-white/50 pointer-events-none">
        WASD — движение · Мышь — обзор · Клик — огонь · R — перезарядка
      </div>

      {/* сенсорное управление (телефон) */}
      <div className="md:hidden">
        <div
          className="absolute bottom-6 left-6 w-32 h-32 rounded-full bg-white/5 border border-white/20 touch-none"
          onTouchStart={(e) => moveTouch(e, 'moveJoy')}
          onTouchMove={(e) => moveTouch(e, 'moveJoy')}
          onTouchEnd={() => endTouch('moveJoy')}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="Move" className="text-white/40" size={28} />
          </div>
        </div>
        <div
          className="absolute bottom-44 right-6 w-28 h-28 rounded-full bg-white/5 border border-white/20 touch-none"
          onTouchStart={(e) => moveTouch(e, 'lookJoy')}
          onTouchMove={(e) => moveTouch(e, 'lookJoy')}
          onTouchEnd={() => endTouch('lookJoy')}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="Eye" className="text-white/40" size={24} />
          </div>
        </div>
        <button
          onTouchStart={shoot}
          className="absolute bottom-6 right-6 w-20 h-20 rounded-full bg-primary/80 border-2 border-primary flex items-center justify-center active:scale-90 transition-transform touch-none"
        >
          <Icon name="Crosshair" className="text-primary-foreground" size={32} />
        </button>
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center animate-fade-in">
          <div className="font-display font-700 uppercase text-6xl text-destructive tracking-wide">
            Вы пали
          </div>
          <div className="mt-4 font-display text-white text-xl">
            Очки: <span className="text-primary">{score.toLocaleString('ru-RU')}</span> · Волна {wave}
          </div>
          <div className="mt-8 flex gap-4">
            <Button
              onClick={restart}
              className="font-display uppercase tracking-widest rounded-none h-12 px-8"
            >
              <Icon name="RotateCcw" className="mr-2" size={18} /> Заново
            </Button>
            <Button
              onClick={onExit}
              variant="outline"
              className="font-display uppercase tracking-widest rounded-none h-12 px-8 border-white/30 text-white"
            >
              Выход
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
