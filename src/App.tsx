import React, { useMemo, useState } from "react";

type YeastId = "instant" | "dry" | "fresh";

type FlourPreset = {
  hydration: number; // sugerowana hydracja %
  protein: number; // uśredniona zawartość białka %
};

const FLOUR_PRESETS: Record<string, FlourPreset> = {
  // Specjalistyczne włoskie
  "Caputo Pizzeria (00)": { hydration: 62, protein: 12.5 },
  "Caputo Manitoba Oro": { hydration: 65, protein: 14.5 },
  "Caputo Nuvola": { hydration: 68, protein: 13.0 },
  "Inna włoska 00 (pizza)": { hydration: 60, protein: 12.0 },

  // Domowe / marketowe
  "Zwykła typ 00 (marketowa)": { hydration: 58, protein: 11.0 },
  "Typ 450 (tortowa)": { hydration: 56, protein: 9.0 },
  "Typ 500/550 (uniwersalna)": { hydration: 60, protein: 10.5 },
  "Typ 650 (chlebowa/uniwersalna)": { hydration: 62, protein: 12.0 },
  "Typ 750 (mocniejsza chlebowa)": { hydration: 64, protein: 12.5 },
  'Mieszanka "mąka do pizzy" (marketowa)': { hydration: 61, protein: 11.5 },
};

const yeastOptions: { id: YeastId; label: string }[] = [
  { id: "instant", label: "Drożdże instant" },
  { id: "dry", label: "Drożdże suche aktywne" },
  { id: "fresh", label: "Drożdże świeże" },
];

function computeYeastPct(
  tkHours: number,
  toHours: number,
  tkTemp: number,
  toTemp: number,
  yeastType: YeastId
): number {
  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));

  const q10 = 2;
  const baseTemp = 22;

  // Równoważne czasy fermentacji dla temperatur referencyjnych
  const rtEqTo = toHours * Math.pow(q10, (toTemp - baseTemp) / 10);
  const rtEqTk = tkHours * Math.pow(q10, (tkTemp - baseTemp) / 10);

  let effectiveHours = rtEqTo + rtEqTk;
  if (!isFinite(effectiveHours) || effectiveHours <= 0) effectiveHours = 4;

  // Baza dla drożdży instant
  let instantPct = 0.8 / effectiveHours;
  instantPct = clamp(instantPct, 0.01, 1.0);

  let factor = 1;
  if (yeastType === "dry") factor = 1.5;
  if (yeastType === "fresh") factor = 3;

  return Number((instantPct * factor).toFixed(3));
}

// Proste "testy" computeYeastPct do ręcznej weryfikacji w konsoli podczas dev
if (typeof console !== "undefined" && import.meta.env.DEV) {
  const yeastTestCases: {
    label: string;
    args: [number, number, number, number, YeastId];
  }[] = [
    {
      label: "Pokój 8h, instant",
      args: [0, 8, 4, 22, "instant"],
    },
    {
      label: "24h lodówka 4°C + 2h 22°C, instant",
      args: [24, 2, 4, 22, "instant"],
    },
    {
      label: "5h RT 24°C, świeże",
      args: [0, 5, 4, 24, "fresh"],
    },
  ];

  yeastTestCases.forEach((t) => {
    const v = computeYeastPct(...t.args);
    console.log(`[yeast test] ${t.label}:`, v, "%");
  });
}

const DoughCalculator: React.FC = () => {
  const [flourType, setFlourType] = useState<string>("Caputo Pizzeria (00)");
  const [balls, setBalls] = useState<number>(4);
  const [heroVisible, setHeroVisible] = useState<boolean>(true);
  const [heroOffset, setHeroOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const [hydration, setHydration] = useState<number>(
    FLOUR_PRESETS["Caputo Pizzeria (00)"].hydration
  );
  const [saltPct, setSaltPct] = useState<number>(2.8);
  const [oilPct, setOilPct] = useState<number>(2);
  const [yeastType, setYeastType] = useState<YeastId>("instant");

  const [tkHours, setTkHours] = useState<number>(24);
  const [toHours, setToHours] = useState<number>(2);
  const [tkTemp, setTkTemp] = useState<number>(4);
  const [toTemp, setToTemp] = useState<number>(22);

  const totalDoughWeight = useMemo(() => balls * 250, [balls]);

  const yeastPct = useMemo(
    () => computeYeastPct(tkHours, toHours, tkTemp, toTemp, yeastType),
    [tkHours, toHours, tkTemp, toTemp, yeastType]
  );

  const { flour, water, salt, oil, yeast } = useMemo(() => {
    const bakerFactor =
      1 + hydration / 100 + saltPct / 100 + oilPct / 100 + yeastPct / 100;
    const flour = totalDoughWeight / bakerFactor;
    return {
      flour,
      water: (flour * hydration) / 100,
      salt: (flour * saltPct) / 100,
      oil: (flour * oilPct) / 100,
      yeast: (flour * yeastPct) / 100,
    };
  }, [totalDoughWeight, hydration, saltPct, oilPct, yeastPct]);

  const format = (v: number) => v.toFixed(1);

  const currentFlour = FLOUR_PRESETS[flourType];
  const proteinBarWidth = Math.max(
    0,
    Math.min(100, (currentFlour.protein - 8) * 12)
  );
  const heroImage = `${import.meta.env.BASE_URL}papa-pietro.jpg`;

  const kneadingPlan = useMemo(() => {
    const clamp = (v: number, min: number, max: number) =>
      Math.min(max, Math.max(min, v));
    const hydrationFactor = Math.max(0, hydration - 60) * 0.35;
    const proteinFactor = Math.max(0, currentFlour.protein - 11) * 0.8;
    const kneadMinutes = clamp(6 + hydrationFactor + proteinFactor, 6, 22);
    const planetary = clamp(kneadMinutes * 0.55, 4, 15);
    const handMixer = clamp(kneadMinutes * 0.75, 5, 18);
    const wetDough = hydration >= 67;
    const folds = wetDough ? 3 : 2;
    const foldInterval = wetDough ? 12 : 15; // minutes
    const totalFoldTime = (folds - 1) * foldInterval;
    return {
      kneadMinutes: Math.round(kneadMinutes),
      planetary: Math.round(planetary),
      handMixer: Math.round(handMixer),
      folds,
      foldInterval,
      totalFoldTime,
      wetDough,
    };
  }, [hydration, currentFlour.protein]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl glass rounded-2xl p-8 space-y-8 backdrop-blur-xl">
        <header className="space-y-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-wide text-cyan-300 font-display">
            Papa Pietro – Pizza Calculator
            </h1>
            {heroVisible && (
              <div className="w-full md:w-56 h-32">
                <div
                  className="relative h-full rounded-xl border border-slate-700/70 shadow-lg shadow-cyan-900/30 overflow-hidden group bg-slate-950/50"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
                    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;
                    setHeroOffset({
                      x: xRatio * 65, // percent for transform translate
                      y: yRatio * 65,
                    });
                  }}
                  onMouseLeave={() => setHeroOffset({ x: 0, y: 0 })}
                >
                  <img
                    src={heroImage}
                    alt="Papa Pietro dusting pizza with chili flakes"
                    className="w-full h-full object-cover transition-transform duration-200 ease-out"
                    style={{
                      transform: `translate(${heroOffset.x}%, ${heroOffset.y}%) scale(2.3)`,
                    }}
                    loading="lazy"
                    onError={() => setHeroVisible(false)}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-900/40 to-transparent" />
                </div>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Wybierz mąkę (w tym marketowe typy), profil TK/TO i pozwól, żeby
            Papa Pietro wyliczył drożdże i składniki.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs mb-1 text-slate-400">
                Rodzaj mąki
              </label>
              <select
                className="w-full bg-slate-900/40 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={flourType}
                onChange={(e) => {
                  const v = e.target.value;
                  setFlourType(v);
                  setHydration(FLOUR_PRESETS[v].hydration);
                }}
              >
                {Object.keys(FLOUR_PRESETS).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <span>Białko: {currentFlour.protein}%</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${proteinBarWidth}%` }}
                  />
                </div>
                <span className="text-cyan-300">siła</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Białko: {currentFlour.protein}% (siła mąki) · domyślna hydracja:{" "}
                {currentFlour.hydration}%
              </p>
            </div>

            <div>
              <label className="block text-xs mb-1 text-slate-400">
                Liczba kulek (po 250 g)
              </label>
              <input
                type="number"
                className="w-full bg-slate-900/40 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={balls}
                min={1}
                onChange={(e) =>
                  setBalls(Math.max(1, Number(e.target.value) || 1))
                }
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Łączna masa ciasta: {totalDoughWeight} g
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  Hydracja %
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-900/40 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={hydration}
                  onChange={(e) => setHydration(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  Sól %
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-900/40 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={saltPct}
                  onChange={(e) => setSaltPct(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  Oliwa %
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-900/40 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={oilPct}
                  onChange={(e) => setOilPct(Number(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* TK/TO i drożdże */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs mb-1 text-slate-400">
                Rodzaj drożdży
              </label>
              <select
                className="w-full bg-slate-900/40 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={yeastType}
                onChange={(e) => setYeastType(e.target.value as YeastId)}
              >
                {yeastOptions.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  TK (h)
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-900/40 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={tkHours}
                  onChange={(e) => setTkHours(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  TK °C
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-900/40 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={tkTemp}
                  onChange={(e) => setTkTemp(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  TO (h)
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-900/40 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={toHours}
                  onChange={(e) => setToHours(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  TO °C
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-900/40 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={toTemp}
                  onChange={(e) => setToTemp(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="text-xs text-cyan-300/80">
              Drożdże: {yeastPct}% (auto z TK/TO)
            </div>

            <div className="text-xs text-slate-200/80 bg-slate-900/40 border border-slate-700/70 rounded-xl p-3 space-y-1">
              <div className="text-sm font-semibold text-cyan-200">
                Czas wyrabiania (sugestia)
              </div>
              <div>
                Ręczne wyrabianie:{" "}
                <span className="text-cyan-300 font-semibold">
                  {kneadingPlan.kneadMinutes} min
                </span>
              </div>
              <div>
                Mikser planetarny:{" "}
                <span className="text-cyan-300 font-semibold">
                  {kneadingPlan.planetary} min
                </span>{" "}
                (spirala / hak)
              </div>
              <div>
                Mikser ręczny z hakami:{" "}
                <span className="text-cyan-300 font-semibold">
                  {kneadingPlan.handMixer} min
                </span>
              </div>
              <div>
                Składania/gluten: {kneadingPlan.folds}× co{" "}
                {kneadingPlan.foldInterval} min (ok.{" "}
                {kneadingPlan.totalFoldTime} min)
              </div>
              <div className="text-[11px] text-slate-400">
                {kneadingPlan.wetDough
                  ? "Wysoka hydracja: postaw na składania zamiast długiego wyrabiania."
                  : "Standardowa hydracja: krótka przerwa + 2 składania wystarczą."}
              </div>
            </div>
          </div>
        </section>

        {/* Wyniki */}
        <section className="pt-4 border-t border-slate-700/40">
          <h2 className="text-sm font-semibold mb-3 text-cyan-200 tracking-wide">
            Składniki (g)
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">Mąka</div>
              <div className="text-lg font-semibold text-cyan-200">
                {format(flour)}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">Woda</div>
              <div className="text-lg font-semibold text-cyan-200">
                {format(water)}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">Sól</div>
              <div className="text-lg font-semibold text-cyan-200">
                {format(salt)}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">Oliwa</div>
              <div className="text-lg font-semibold text-cyan-200">
                {format(oil)}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-1">Drożdże</div>
              <div className="text-lg font-semibold text-cyan-200">
                {format(yeast)}
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            Mąka liczona jest z sumy procentów (1 + hydracja + sól + oliwa +
            drożdże), a następnie wyprowadzane są pozostałe składniki.
          </p>
        </section>
      </div>
    </div>
  );
};

export default DoughCalculator;
