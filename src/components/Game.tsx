import { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface GameProps {
  onExit: () => void;
}

interface Settings {
  sensitivity: number;   // 1–10
  difficulty: 'easy' | 'normal' | 'hard';
}

const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,1,0,1,1,0,1],
  [1,0,1,0,0,1,0,0,0,0,1,0,0,1,0,1],
  [1,0,1,0,1,1,1,1,1,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,0,1,0,0,1],
  [1,0,0,0,1,0,1,0,0,0,0,0,1,0,1,1],
  [1,1,1,0,1,0,1,1,1,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,1,1,0,0,1,0,0,0,1,0,1],
  [1,0,0,0,0,0,1,0,1,1,1,1,0,1,0,1],
  [1,0,1,1,1,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,0,0,0,1,1,1,0,1,1,0,1],
  [1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];
const MAP_W = MAP[0].length;
const MAP_H = MAP.length;
const FOV = Math.PI / 3;
const MAX_HP = 100;

interface Enemy { x:number; y:number; hp:number; alive:boolean; hitFlash:number; }
interface TouchTrack { id:number; zone:'move'|'look'|'ui'; startX:number; startY:number; curX:number; curY:number; }

const isWall = (x:number, y:number) => {
  const mx = Math.floor(x), my = Math.floor(y);
  if (mx<0||my<0||mx>=MAP_W||my>=MAP_H) return true;
  return MAP[my][mx] === 1;
};

const spawnEnemies = (count:number): Enemy[] => {
  const list:Enemy[] = [];
  let g = 0;
  while (list.length < count && g++ < 500) {
    const x = 1 + Math.random()*(MAP_W-2);
    const y = 1 + Math.random()*(MAP_H-2);
    if (!isWall(x,y) && (x<2||x>4||y<2||y>4))
      list.push({x,y,hp:100,alive:true,hitFlash:0});
  }
  return list;
};

// ─────────────────────────────────────────────────────────
//  Экран настроек
// ─────────────────────────────────────────────────────────
const SettingsScreen = ({
  settings, onChange, onStart, onExit,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onStart: () => void;
  onExit: () => void;
}) => (
  <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-sm space-y-7">
      <div>
        <div className="font-display font-700 text-4xl uppercase tracking-wide text-center">
          WAR<span className="text-primary">FRONT</span>
        </div>
        <div className="text-center text-muted-foreground font-display text-xs uppercase tracking-widest mt-1">Настройки игры</div>
      </div>

      {/* Чувствительность */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-display uppercase text-sm tracking-widest">Чувствительность</span>
          <span className="font-display text-primary text-xl font-700">{settings.sensitivity}</span>
        </div>
        <input
          type="range" min={1} max={10} step={1}
          value={settings.sensitivity}
          onChange={e => onChange({...settings, sensitivity: Number(e.target.value)})}
          className="w-full h-2 cursor-pointer"
          style={{accentColor:'hsl(var(--primary))'}}
        />
        <div className="flex justify-between font-display text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Медленно</span><span>Быстро</span>
        </div>
      </div>

      {/* Сложность */}
      <div className="space-y-3">
        <span className="font-display uppercase text-sm tracking-widest block">Сложность</span>
        <div className="grid grid-cols-3 gap-2">
          {(['easy','normal','hard'] as const).map(d => (
            <button
              key={d}
              onClick={() => onChange({...settings, difficulty: d})}
              className={`py-3 font-display uppercase text-xs tracking-widest border transition-colors ${
                settings.difficulty === d
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/40'
              }`}
            >
              {d === 'easy' ? 'Лёгко' : d === 'normal' ? 'Норм' : 'Хард'}
            </button>
          ))}
        </div>
      </div>

      {/* Управление */}
      <div className="border border-border p-4 space-y-2">
        <div className="font-display uppercase text-xs tracking-widest text-muted-foreground mb-2">Управление (телефон)</div>
        {[
          ['Движение','Левая половина — джойстик'],
          ['Обзор','Правая половина — свайп'],
          ['Огонь','Кнопка 🎯 справа внизу'],
          ['Перезарядка','Кнопка ↺ над огнём'],
        ].map(([k,v]) => (
          <div key={k} className="flex justify-between">
            <span className="font-display uppercase text-[11px] tracking-widest text-muted-foreground">{k}</span>
            <span className="text-foreground text-[11px]">{v}</span>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={onStart} className="w-full font-display uppercase tracking-widest h-14 rounded-none text-base">
        <Icon name="Crosshair" className="mr-2" size={20} /> В бой!
      </Button>
      <button onClick={onExit} className="w-full font-display uppercase text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors py-2">
        ← Вернуться на сайт
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
//  Точка входа
// ─────────────────────────────────────────────────────────
const Game = ({ onExit }: GameProps) => {
  const [screen, setScreen] = useState<'settings'|'game'>('settings');
  const [settings, setSettings] = useState<Settings>({ sensitivity: 5, difficulty: 'normal' });

  if (screen === 'settings') {
    return (
      <SettingsScreen
        settings={settings}
        onChange={setSettings}
        onStart={() => setScreen('game')}
        onExit={onExit}
      />
    );
  }
  return <GameCanvas onExit={onExit} onSettings={() => setScreen('settings')} settings={settings} />;
};

// ─────────────────────────────────────────────────────────
//  Игровой canvas
// ─────────────────────────────────────────────────────────
const GameCanvas = ({
  onExit, onSettings, settings,
}: {
  onExit: () => void;
  onSettings: () => void;
  settings: Settings;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  const [hp,        setHp]        = useState(MAX_HP);
  const [score,     setScore]     = useState(0);
  const [wave,      setWave]      = useState(1);
  const [ammo,      setAmmo]      = useState(12);
  const [gameOver,  setGameOver]  = useState(false);
  const [muzzle,    setMuzzle]    = useState(false);
  const [reloading, setReloading] = useState(false);
  const [joyDelta,  setJoyDelta]  = useState({dx:0,dy:0,active:false});

  const touches = useRef<TouchTrack[]>([]);

  const diffMult = settings.difficulty === 'easy' ? 0.45 : settings.difficulty === 'hard' ? 1.6 : 1.0;
  const sensMult = settings.sensitivity / 5;

  const state = useRef({
    px:2.5, py:2.5, dir:0,
    keys:{} as Record<string,boolean>,
    enemies: spawnEnemies(5),
    hp:MAX_HP, score:0, wave:1, ammo:12,
    over:false, reloading:false, shootCd:0,
  });

  useEffect(() => {
    const s = state.current;
    Object.assign(s,{px:2.5,py:2.5,dir:0,hp:MAX_HP,score:0,wave:1,ammo:12,over:false,reloading:false,shootCd:0});
    s.enemies = spawnEnemies(5);
    setHp(MAX_HP); setScore(0); setWave(1); setAmmo(12); setGameOver(false);
  }, []);

  const shoot = useCallback(() => {
    const s = state.current;
    if (s.over || s.reloading || s.ammo<=0 || s.shootCd>0) return;
    s.ammo--; s.shootCd = 10;
    setAmmo(s.ammo);
    setMuzzle(true);
    setTimeout(() => setMuzzle(false), 80);

    let best:Enemy|null = null;
    let bestDist = Infinity;
    for (const e of s.enemies) {
      if (!e.alive) continue;
      const dx=e.x-s.px, dy=e.y-s.py;
      const dist=Math.hypot(dx,dy);
      let ang = Math.atan2(dy,dx) - s.dir;
      while (ang < -Math.PI) ang += Math.PI*2;
      while (ang >  Math.PI) ang -= Math.PI*2;
      const tol = 0.18 / Math.max(0.5, dist*0.35);
      if (Math.abs(ang)<tol && dist<bestDist) {
        let blocked = false;
        const steps = Math.ceil(dist*8);
        for (let i=1;i<steps;i++) {
          if (isWall(s.px+dx*(i/steps), s.py+dy*(i/steps))) { blocked=true; break; }
        }
        if (!blocked) { best=e; bestDist=dist; }
      }
    }
    if (best) {
      best.hp -= 50; best.hitFlash = 8;
      if (best.hp<=0) {
        best.alive=false;
        s.score+=100; setScore(s.score);
        if (s.enemies.every(en=>!en.alive)) {
          s.wave++; setWave(s.wave);
          s.enemies=spawnEnemies(4+s.wave);
        }
      }
    }
    if (s.ammo<=0) doReload();
  }, []);

  const doReload = useCallback(() => {
    const s = state.current;
    if (s.reloading || s.ammo===12) return;
    s.reloading=true; setReloading(true);
    setTimeout(()=>{ s.ammo=12; s.reloading=false; setAmmo(12); setReloading(false); }, 900);
  }, []);

  // Клавиатура + мышь
  useEffect(() => {
    const s = state.current;
    const canvas = canvasRef.current!;
    const kd = (e:KeyboardEvent) => { s.keys[e.key.toLowerCase()]=true; if (e.key.toLowerCase()==='r') doReload(); };
    const ku = (e:KeyboardEvent) => { s.keys[e.key.toLowerCase()]=false; };
    const onMM = (e:MouseEvent) => { if (document.pointerLockElement===canvas) s.dir += e.movementX*0.003*sensMult; };
    const onMD = () => { if (document.pointerLockElement===canvas) shoot(); else canvas.requestPointerLock(); };
    window.addEventListener('keydown',kd);
    window.addEventListener('keyup',ku);
    window.addEventListener('mousemove',onMM);
    canvas.addEventListener('mousedown',onMD);
    return () => {
      window.removeEventListener('keydown',kd);
      window.removeEventListener('keyup',ku);
      window.removeEventListener('mousemove',onMM);
      canvas.removeEventListener('mousedown',onMD);
    };
  }, [shoot, doReload, sensMult]);

  // Мультитач
  useEffect(() => {
    const wrap = wrapRef.current!;
    const getZone = (x:number): TouchTrack['zone'] => x < wrap.clientWidth*0.5 ? 'move' : 'look';

    const onStart = (e:TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        // не добавляем тач если он уже есть (дубликат)
        if (touches.current.find(x=>x.id===t.identifier)) continue;
        touches.current.push({
          id:t.identifier, zone:getZone(t.clientX),
          startX:t.clientX, startY:t.clientY, curX:t.clientX, curY:t.clientY,
        });
      }
    };
    const onMove = (e:TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        const tr = touches.current.find(x=>x.id===t.identifier);
        if (tr) { tr.curX=t.clientX; tr.curY=t.clientY; }
      }
    };
    const onEnd = (e:TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches))
        touches.current=touches.current.filter(x=>x.id!==t.identifier);
      if (!touches.current.find(t=>t.zone==='move')) setJoyDelta({dx:0,dy:0,active:false});
    };

    wrap.addEventListener('touchstart',  onStart, {passive:false});
    wrap.addEventListener('touchmove',   onMove,  {passive:false});
    wrap.addEventListener('touchend',    onEnd,   {passive:false});
    wrap.addEventListener('touchcancel', onEnd,   {passive:false});
    return () => {
      wrap.removeEventListener('touchstart',  onStart);
      wrap.removeEventListener('touchmove',   onMove);
      wrap.removeEventListener('touchend',    onEnd);
      wrap.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  // Игровой цикл
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let last = performance.now();

    const resize = () => { canvas.width=canvas.clientWidth; canvas.height=canvas.clientHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tryMove = (nx:number, ny:number) => {
      const s = state.current;
      const m = 0.28;
      if (!isWall(nx+m,s.py) && !isWall(nx-m,s.py)) s.px=nx;
      if (!isWall(s.px,ny+m) && !isWall(s.px,ny-m)) s.py=ny;
    };

    const loop = (now:number) => {
      const dt=Math.min(0.05,(now-last)/1000); last=now;
      const s=state.current;
      const W=canvas.width, H=canvas.height;

      if (!s.over) {
        const speed=2.8*dt, rot=2.0*dt;
        let fwd=0, str=0;

        if (s.keys['w']||s.keys['arrowup'])    fwd+=1;
        if (s.keys['s']||s.keys['arrowdown'])  fwd-=1;
        if (s.keys['a'])                        str-=1;
        if (s.keys['d'])                        str+=1;
        if (s.keys['arrowleft'])  s.dir-=rot;
        if (s.keys['arrowright']) s.dir+=rot;

        // Джойстики мультитач
        let jdx=0, jdy=0;
        for (const tr of touches.current) {
          const ddx=tr.curX-tr.startX, ddy=tr.curY-tr.startY;
          const len=Math.hypot(ddx,ddy);
          if (tr.zone==='move' && len>8) {
            fwd+=-(ddy/len); str+=(ddx/len);
            jdx=Math.max(-52,Math.min(52,ddx));
            jdy=Math.max(-52,Math.min(52,ddy));
          }
          if (tr.zone==='look' && Math.abs(ddx)>4) {
            // delta-поворот: обновляем startX чтобы не копилось
            s.dir+=(ddx/(canvas.clientWidth*0.5))*5.0*dt*60*sensMult;
            tr.startX=tr.curX;
            tr.startY=tr.curY;
          }
        }

        const hasMoveTouch = !!touches.current.find(t=>t.zone==='move');
        setJoyDelta(hasMoveTouch ? {dx:jdx,dy:jdy,active:true} : {dx:0,dy:0,active:false});

        const mag=Math.hypot(fwd,str);
        if (mag>0) {
          const nf=fwd/Math.max(1,mag), ns=str/Math.max(1,mag);
          tryMove(
            s.px+Math.cos(s.dir)*nf*speed-Math.sin(s.dir)*ns*speed,
            s.py+Math.sin(s.dir)*nf*speed+Math.cos(s.dir)*ns*speed,
          );
        }
        if (s.shootCd>0) s.shootCd--;

        // AI врагов
        let dmg=0;
        for (const e of s.enemies) {
          if (!e.alive) continue;
          if (e.hitFlash>0) e.hitFlash--;
          const dx=s.px-e.x, dy=s.py-e.y;
          const dist=Math.hypot(dx,dy);
          if (dist>0.75) {
            const sp=(0.48+s.wave*0.04)*dt*diffMult;
            const nx=e.x+(dx/dist)*sp, ny=e.y+(dy/dist)*sp;
            if (!isWall(nx,e.y)) e.x=nx;
            if (!isWall(e.x,ny)) e.y=ny;
          } else {
            // вплотную — урон
            dmg+=10*dt*diffMult;
          }
        }
        if (dmg>0) {
          s.hp=Math.max(0,s.hp-dmg);
          setHp(Math.ceil(s.hp));
          if (s.hp<=0) { s.over=true; setGameOver(true); document.exitPointerLock?.(); }
        }
      }

      // ── РЕНДЕР ──
      const sky=ctx.createLinearGradient(0,0,0,H/2);
      sky.addColorStop(0,'#1a2030'); sky.addColorStop(1,'#0d0f14');
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H/2);
      const fl=ctx.createLinearGradient(0,H/2,0,H);
      fl.addColorStop(0,'#14110d'); fl.addColorStop(1,'#2a221a');
      ctx.fillStyle=fl; ctx.fillRect(0,H/2,W,H/2);

      // Raycasting
      const zbuf=new Float32Array(W);
      for (let i=0;i<W;i++) {
        const ra=s.dir-FOV/2+(i/W)*FOV;
        const cos=Math.cos(ra), sin=Math.sin(ra);
        let dist=0.05, hit=false, side=0;
        while (!hit && dist<20) {
          dist+=0.02;
          const tx=s.px+cos*dist, ty=s.py+sin*dist;
          if (isWall(tx,ty)) {
            hit=true;
            const fx=tx-Math.floor(tx), fy=ty-Math.floor(ty);
            side=Math.min(fx,1-fx)<Math.min(fy,1-fy)?0:1;
          }
        }
        const corr=dist*Math.cos(ra-s.dir);
        zbuf[i]=corr;
        const wH=Math.min(H,H/corr);
        const shade=Math.max(0,1-corr/12);
        const base=side===0?90:64;
        ctx.fillStyle=`rgb(${Math.floor(base*shade+20)},${Math.floor((base-20)*shade+12)},${Math.floor((base-35)*shade+10)})`;
        ctx.fillRect(i,(H-wH)/2,1,wH);
      }

      // Спрайты врагов
      s.enemies
        .filter(e=>e.alive)
        .map(e=>({e,d:Math.hypot(e.x-s.px,e.y-s.py)}))
        .sort((a,b)=>b.d-a.d)
        .forEach(({e,d}) => {
          let ang=Math.atan2(e.y-s.py,e.x-s.px)-s.dir;
          while (ang<-Math.PI) ang+=Math.PI*2;
          while (ang>Math.PI)  ang-=Math.PI*2;
          if (Math.abs(ang)>FOV/2+0.4) return;

          const sx=(0.5+ang/FOV)*W;
          const size=Math.min(H*1.4, H/Math.max(0.1,d));
          const sy=H/2;
          const col=Math.max(0,Math.min(W-1,Math.floor(sx)));

          // ✅ ИСПРАВЛЕНО: враг виден если БЛИЖЕ стены (d < zbuf)
          if (d >= zbuf[col]-0.05) return;

          const flash=e.hitFlash>0;
          ctx.save();
          ctx.globalAlpha=Math.min(1, 1.5/(Math.max(1,d)));

          // Тело
          ctx.fillStyle=flash?'#ff4422':'#8b2a1e';
          ctx.fillRect(sx-size*0.16, sy-size*0.28, size*0.32, size*0.5);
          // Голова
          const hr=size*0.13;
          ctx.fillStyle=flash?'#ffaa77':'#7a3828';
          ctx.beginPath(); ctx.arc(sx, sy-size*0.42, hr, 0, Math.PI*2); ctx.fill();
          // Каска
          ctx.fillStyle=flash?'#ffcc00':'#3a4a2a';
          ctx.beginPath(); ctx.arc(sx, sy-size*0.46, hr*0.85, Math.PI, Math.PI*2); ctx.fill();
          // Глаза
          ctx.fillStyle='#ff2200';
          ctx.fillRect(sx-size*0.06, sy-size*0.435, size*0.04, size*0.03);
          ctx.fillRect(sx+size*0.02, sy-size*0.435, size*0.04, size*0.03);
          // HP бар
          if (e.hp<100) {
            ctx.fillStyle='#111'; ctx.fillRect(sx-size*0.18, sy-size*0.60, size*0.36, size*0.035);
            ctx.fillStyle=e.hp>50?'#33dd55':'#ffaa00';
            ctx.fillRect(sx-size*0.18, sy-size*0.60, size*0.36*(e.hp/100), size*0.035);
          }
          ctx.restore();
        });

      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [diffMult, sensMult]);

  const restart = () => {
    const s=state.current;
    Object.assign(s,{px:2.5,py:2.5,dir:0,hp:MAX_HP,score:0,wave:1,ammo:12,over:false,reloading:false,shootCd:0});
    s.enemies=spawnEnemies(5);
    setHp(MAX_HP); setScore(0); setWave(1); setAmmo(12); setGameOver(false); setReloading(false);
  };

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-[100] bg-black select-none overflow-hidden"
      style={{touchAction:'none', userSelect:'none'}}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* HUD верх */}
      <div className="absolute top-0 inset-x-0 flex items-start justify-between p-3 pointer-events-none">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Icon name="Heart" className="text-red-500" size={16} />
            <div className="w-28 h-2.5 bg-black/60 border border-white/20">
              <div className="h-full bg-red-500 transition-all" style={{width:`${(hp/MAX_HP)*100}%`}} />
            </div>
            <span className="font-display text-white text-sm">{hp}</span>
          </div>
          <div className="font-display text-orange-400 text-xs uppercase tracking-widest">Волна {wave}</div>
        </div>
        <div className="text-center">
          <div className="font-display text-white text-2xl">{score.toLocaleString('ru-RU')}</div>
          <div className="font-display text-[9px] uppercase tracking-widest text-white/40">Очки</div>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <button
            className="bg-black/60 border border-white/20 p-2 active:border-orange-400"
            onTouchStart={e=>{e.stopPropagation(); onSettings();}}
            onClick={onSettings}
          >
            <Icon name="Settings" className="text-white" size={18} />
          </button>
          <button
            className="bg-black/60 border border-white/20 p-2 active:border-red-400"
            onTouchStart={e=>{e.stopPropagation(); onExit();}}
            onClick={onExit}
          >
            <Icon name="X" className="text-white" size={18} />
          </button>
        </div>
      </div>

      {/* Прицел */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {muzzle && <div className="absolute -inset-10 bg-orange-400/30 blur-2xl rounded-full" />}
          <svg width="40" height="40" viewBox="0 0 40 40">
            <line x1="20" y1="2"  x2="20" y2="14" stroke="#ea580c" strokeWidth="2"/>
            <line x1="20" y1="26" x2="20" y2="38" stroke="#ea580c" strokeWidth="2"/>
            <line x1="2"  y1="20" x2="14" y2="20" stroke="#ea580c" strokeWidth="2"/>
            <line x1="26" y1="20" x2="38" y2="20" stroke="#ea580c" strokeWidth="2"/>
            <circle cx="20" cy="20" r="3" fill="none" stroke="#ea580c" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      {/* Ствол */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none">
        <div
          className={`w-20 h-28 bg-gradient-to-t from-zinc-800 to-zinc-600 transition-transform ${muzzle?'translate-y-2':''}`}
          style={{clipPath:'polygon(35% 0,65% 0,80% 100%,20% 100%)',borderTop:'4px solid #27272a',borderLeft:'4px solid #18181b',borderRight:'4px solid #18181b'}}
        />
      </div>

      {/* Патроны */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Icon name="Zap" className="text-orange-400" size={15} />
          <span className="font-display text-white text-xl">{ammo}</span>
          <span className="font-display text-white/40">/12</span>
          {reloading && <span className="font-display text-yellow-400 text-xs uppercase animate-pulse ml-1">RLD…</span>}
        </div>
      </div>

      <div className="hidden md:block absolute bottom-3 left-3 font-display text-[10px] uppercase tracking-widest text-white/30 pointer-events-none">
        WASD · Мышь · ЛКМ = огонь · R = перезарядка
      </div>

      {/* ═══ МОБИЛЬНЫЙ UI ═══ */}
      <div className="md:hidden">
        {/* Джойстик движения (левая половина) */}
        <div className="absolute bottom-8 left-8 w-32 h-32 rounded-full border border-white/10 bg-white/[0.03] pointer-events-none flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center">
            <Icon name="Move" className="text-white/20" size={16} />
          </div>
          {joyDelta.active && (
            <div
              className="absolute w-11 h-11 rounded-full bg-orange-500/40 border-2 border-orange-400/70"
              style={{transform:`translate(${joyDelta.dx}px,${joyDelta.dy}px)`}}
            />
          )}
        </div>
        <div className="absolute bottom-[11.5rem] left-8 font-display text-[9px] uppercase tracking-widest text-white/20 pointer-events-none">
          ↕ Движение
        </div>

        {/* Подпись зоны обзора */}
        <div className="absolute bottom-[11.5rem] right-32 font-display text-[9px] uppercase tracking-widest text-white/20 pointer-events-none">
          Обзор ↔
        </div>

        {/* ОГОНЬ */}
        <button
          className="absolute bottom-8 right-4 w-24 h-24 rounded-full border-2 border-orange-500 flex items-center justify-center active:scale-90 transition-transform"
          style={{background:'rgba(234,88,12,0.18)', touchAction:'none'}}
          onTouchStart={e=>{e.stopPropagation(); e.preventDefault(); shoot();}}
        >
          <svg width="36" height="36" viewBox="0 0 40 40">
            <line x1="20" y1="2"  x2="20" y2="14" stroke="#ea580c" strokeWidth="2.5"/>
            <line x1="20" y1="26" x2="20" y2="38" stroke="#ea580c" strokeWidth="2.5"/>
            <line x1="2"  y1="20" x2="14" y2="20" stroke="#ea580c" strokeWidth="2.5"/>
            <line x1="26" y1="20" x2="38" y2="20" stroke="#ea580c" strokeWidth="2.5"/>
            <circle cx="20" cy="20" r="3.5" fill="none" stroke="#ea580c" strokeWidth="2"/>
          </svg>
        </button>

        {/* Перезарядка */}
        <button
          className="absolute bottom-36 right-5 w-14 h-14 rounded-full bg-black/50 border border-white/20 flex items-center justify-center active:scale-90 transition-transform"
          style={{touchAction:'none'}}
          onTouchStart={e=>{e.stopPropagation(); e.preventDefault(); doReload();}}
        >
          <Icon name="RotateCcw" className="text-white/60" size={20} />
        </button>
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center" style={{zIndex:200}}>
          <div className="font-display font-700 uppercase text-5xl text-red-500 tracking-wide">Вы пали</div>
          <div className="mt-3 font-display text-white text-lg">
            Очки: <span className="text-orange-400">{score.toLocaleString('ru-RU')}</span> · Волна {wave}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={restart} className="font-display uppercase tracking-widest rounded-none h-12 px-6">
              <Icon name="RotateCcw" className="mr-2" size={16}/> Заново
            </Button>
            <Button onClick={onSettings} variant="outline" className="font-display uppercase tracking-widest rounded-none h-12 px-6 border-white/30 text-white">
              <Icon name="Settings" className="mr-2" size={16}/> Настройки
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
