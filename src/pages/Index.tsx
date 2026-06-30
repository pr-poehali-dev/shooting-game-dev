import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import Game from '@/components/Game';

const HERO_IMG =
  'https://cdn.poehali.dev/projects/5a6d7fdb-1994-4da6-9cb0-372660687c52/files/27997b54-add4-434f-b5b1-22041c39ba25.jpg';
const WEAPON_IMG =
  'https://cdn.poehali.dev/projects/5a6d7fdb-1994-4da6-9cb0-372660687c52/files/89c27a11-05e8-4599-aba3-86aa849fc152.jpg';

const NAV = [
  { label: 'Арсенал', href: '#arsenal' },
  { label: 'Карты', href: '#maps' },
  { label: 'Враги', href: '#enemies' },
  { label: 'Прогресс', href: '#progress' },
];

const WEAPONS = [
  { name: 'VEKTOR-7', type: 'Штурмовая винтовка', dmg: 86, rate: 92, range: 74, mods: 5 },
  { name: 'RAVEN SMG', type: 'Пистолет-пулемёт', dmg: 64, rate: 98, range: 52, mods: 4 },
  { name: 'HALO .50', type: 'Снайперская', dmg: 99, rate: 32, range: 96, mods: 6 },
  { name: 'BREACHER', type: 'Дробовик', dmg: 91, rate: 48, range: 38, mods: 3 },
];

const MAPS = [
  { name: 'РУБЕЖ', tag: 'Промзона', size: 'Большая', icon: 'Factory' },
  { name: 'КАРАВАН', tag: 'Пустыня', size: 'Средняя', icon: 'Sun' },
  { name: 'ШАХТА', tag: 'Подземелье', size: 'Малая', icon: 'Mountain' },
  { name: 'ПРИЧАЛ', tag: 'Порт', size: 'Большая', icon: 'Anchor' },
];

const ENEMIES = [
  { name: 'Разведчик', desc: 'Фланкирует и вызывает подкрепление', icon: 'Eye', threat: 'Низкая' },
  { name: 'Штурмовик', desc: 'Давит огнём и использует укрытия', icon: 'Crosshair', threat: 'Средняя' },
  { name: 'Тяжёлый', desc: 'Бронирован, подавляет позиции', icon: 'Shield', threat: 'Высокая' },
  { name: 'Снайпер', desc: 'Просчитывает линии видимости', icon: 'Scan', threat: 'Высокая' },
];

const RANKS = [
  { rank: 'Рекрут', lvl: '1—9', icon: 'User' },
  { rank: 'Боец', lvl: '10—29', icon: 'Star' },
  { rank: 'Ветеран', lvl: '30—59', icon: 'Award' },
  { rank: 'Легенда', lvl: '60+', icon: 'Crown' },
];

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex justify-between text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
    <div className="h-1 bg-secondary overflow-hidden">
      <div className="h-full bg-primary" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const Index = () => {
  const [menu, setMenu] = useState(false);
  const [playing, setPlaying] = useState(false);

  if (playing) return <Game onExit={() => setPlaying(false)} />;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <a href="#" className="font-display font-700 text-2xl tracking-[0.2em]">
            WAR<span className="text-primary">FRONT</span>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="font-display uppercase text-sm tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <Button
            onClick={() => setPlaying(true)}
            className="hidden md:inline-flex font-display uppercase tracking-widest clip-tag rounded-none"
          >
            Играть
          </Button>
          <button className="md:hidden" onClick={() => setMenu(!menu)}>
            <Icon name={menu ? 'X' : 'Menu'} size={26} />
          </button>
        </div>
        {menu && (
          <div className="md:hidden border-t border-border/60 bg-background animate-fade-in">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenu(false)}
                className="block px-6 py-4 font-display uppercase tracking-widest text-sm border-b border-border/40"
              >
                {n.label}
              </a>
            ))}
            <div className="p-4">
              <Button
                onClick={() => {
                  setMenu(false);
                  setPlaying(true);
                }}
                className="w-full font-display uppercase tracking-widest rounded-none"
              >
                Играть
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-end pb-20 pt-24">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="WARFRONT" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent" />
          <div className="absolute inset-0 grid-overlay opacity-30 animate-scan" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 border border-primary/50 bg-primary/10 clip-tag animate-fade-up">
              <span className="w-2 h-2 bg-primary animate-glow-pulse rounded-full" />
              <span className="font-display text-xs uppercase tracking-[0.3em] text-primary">
                Сезон 01 · В разработке
              </span>
            </div>
            <h1
              className="font-display font-700 leading-[0.9] text-6xl sm:text-7xl lg:text-8xl uppercase animate-fade-up"
              style={{ animationDelay: '0.1s', opacity: 0 }}
            >
              Зона<br />
              <span className="text-stroke">боевых</span><br />
              действий
            </h1>
            <p
              className="mt-6 text-lg text-muted-foreground max-w-lg animate-fade-up"
              style={{ animationDelay: '0.25s', opacity: 0 }}
            >
              Реалистичный 3D-шутер с полной свободой движения. Детальная физика,
              умные враги и сотни вариантов снаряжения в твоём кармане.
            </p>
            <div
              className="mt-9 flex flex-wrap gap-4 animate-fade-up"
              style={{ animationDelay: '0.4s', opacity: 0 }}
            >
              <Button
                size="lg"
                onClick={() => setPlaying(true)}
                className="font-display uppercase tracking-widest text-base h-14 px-8 rounded-none clip-tag animate-glow-pulse"
              >
                <Icon name="Crosshair" className="mr-2" size={20} /> Играть сейчас
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="font-display uppercase tracking-widest text-base h-14 px-8 rounded-none border-foreground/30"
              >
                <Icon name="Play" className="mr-2" size={20} /> Трейлер
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground animate-fade-in">
          <span className="font-display text-[10px] uppercase tracking-[0.3em]">Скролл</span>
          <Icon name="ChevronDown" size={18} className="animate-bounce" />
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-border bg-card">
        <div className="container grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            { v: '40+', l: 'Видов оружия' },
            { v: '12', l: 'Карт и локаций' },
            { v: '60', l: 'Уровней прогресса' },
            { v: '120 fps', l: 'На мобильных' },
          ].map((s) => (
            <div key={s.l} className="py-8 px-4 text-center">
              <div className="font-display font-700 text-4xl text-primary">{s.v}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ARSENAL */}
      <section id="arsenal" className="py-24 relative">
        <div className="container">
          <SectionHead idx="01" title="Арсенал" sub="Оружие и модификации" />
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative group">
              <div className="absolute -inset-2 bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all" />
              <img
                src={WEAPON_IMG}
                alt="Оружие"
                className="relative w-full clip-slant border border-border"
              />
              <div className="absolute bottom-6 left-6 z-10">
                <div className="font-display text-xs uppercase tracking-[0.3em] text-primary">Featured</div>
                <div className="font-display font-700 text-3xl">VEKTOR-7</div>
              </div>
            </div>
            <div className="space-y-3">
              {WEAPONS.map((w, i) => (
                <div
                  key={w.name}
                  className="group p-5 bg-card border border-border hover:border-primary/60 transition-colors clip-tag"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-display font-600 text-xl tracking-wide group-hover:text-primary transition-colors">
                        {w.name}
                      </div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">{w.type}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-accent font-display text-sm">
                      <Icon name="Wrench" size={15} /> {w.mods} модов
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Stat label="Урон" value={w.dmg} />
                    <Stat label="Скор." value={w.rate} />
                    <Stat label="Дальн." value={w.range} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAPS */}
      <section id="maps" className="py-24 bg-card border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-20" />
        <div className="container relative">
          <SectionHead idx="02" title="Карты" sub="Локации и поля боя" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MAPS.map((m) => (
              <div
                key={m.name}
                className="group relative p-6 h-56 flex flex-col justify-between bg-background border border-border hover:border-accent/60 transition-all overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Icon name={m.icon as never} size={120} />
                </div>
                <div className="relative">
                  <span className="font-display text-xs uppercase tracking-[0.3em] text-accent">{m.tag}</span>
                </div>
                <div className="relative">
                  <div className="font-display font-700 text-3xl tracking-wide">{m.name}</div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    <Icon name="Maximize2" size={13} /> {m.size}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENEMIES */}
      <section id="enemies" className="py-24">
        <div className="container">
          <SectionHead idx="03" title="Враги" sub="Интеллектуальный AI" />
          <div className="grid md:grid-cols-2 gap-5">
            {ENEMIES.map((e) => (
              <div
                key={e.name}
                className="group flex items-start gap-5 p-6 bg-card border border-border hover:border-destructive/60 transition-colors"
              >
                <div className="shrink-0 w-14 h-14 flex items-center justify-center bg-secondary border border-border group-hover:bg-destructive/10 group-hover:border-destructive/50 transition-colors">
                  <Icon name={e.icon as never} size={26} className="text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-600 text-xl tracking-wide">{e.name}</h3>
                    <span className="font-display text-[10px] uppercase tracking-widest px-2 py-1 border border-border text-muted-foreground">
                      Угроза: {e.threat}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRESS */}
      <section id="progress" className="py-24 bg-card border-y border-border">
        <div className="container">
          <SectionHead idx="04" title="Прогресс" sub="Профиль и звания" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {RANKS.map((r, i) => (
              <div
                key={r.rank}
                className="relative p-8 text-center bg-background border border-border hover:border-primary/60 transition-colors clip-slant"
              >
                <div className="absolute top-3 left-4 font-display font-700 text-5xl text-border">
                  0{i + 1}
                </div>
                <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-secondary border border-primary/40">
                  <Icon name={r.icon as never} size={30} className="text-primary" />
                </div>
                <div className="font-display font-700 text-2xl tracking-wide uppercase">{r.rank}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  Уровни {r.lvl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 noise opacity-10" />
        <div className="container relative text-center">
          <h2 className="font-display font-700 uppercase text-5xl sm:text-6xl lg:text-7xl leading-[0.95]">
            Готов выйти<br /><span className="text-primary">на передовую?</span>
          </h2>
          <p className="mt-5 text-muted-foreground max-w-md mx-auto">
            Скачай WARFRONT и вступай в бой. Доступно на iOS и Android с адаптивным управлением.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => setPlaying(true)}
              className="font-display uppercase tracking-widest h-14 px-8 rounded-none clip-tag animate-glow-pulse"
            >
              <Icon name="Crosshair" className="mr-2" size={20} /> Играть в браузере
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display font-700 text-xl tracking-[0.2em]">
            WAR<span className="text-primary">FRONT</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-primary transition-colors">
                {n.label}
              </a>
            ))}
          </div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">© 2026 WARFRONT</div>
        </div>
      </footer>
    </div>
  );
};

const SectionHead = ({ idx, title, sub }: { idx: string; title: string; sub: string }) => (
  <div className="mb-12">
    <div className="flex items-center gap-3 mb-3">
      <span className="font-display text-sm text-primary tracking-[0.3em]">/ {idx}</span>
      <span className="h-px flex-1 bg-border max-w-24" />
      <span className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">{sub}</span>
    </div>
    <h2 className="font-display font-700 uppercase text-5xl sm:text-6xl tracking-wide">{title}</h2>
  </div>
);

export default Index;