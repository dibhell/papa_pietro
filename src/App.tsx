import React, { useId, useMemo, useRef, useState } from "react";

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

const normalizeInputValue = (value: string, min = 0) => {
  if (value.trim() === "") return "";

  const sanitized = value.replace(",", ".");
  const parsed = Number(sanitized);

  if (!Number.isFinite(parsed)) return "";

  return Math.max(min, parsed).toString();
};

const toNumberValue = (value: string, min = 0) => {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, parsed);
};

type NumericInputProps = {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  step?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange">;

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  min = 0,
  step = 1,
  className = "",
  ...inputProps
}) => {
  const touchStartY = useRef<number | null>(null);

  const adjustValue = (direction: 1 | -1) => {
    const base = Number(value.replace(",", "."));
    const safeBase = Number.isFinite(base) ? base : 0;
    const next = Math.max(min, Number((safeBase + direction * step).toFixed(2)));
    onChange(next.toString());
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (document.activeElement !== e.currentTarget) return;
    e.preventDefault();
    adjustValue(e.deltaY < 0 ? 1 : -1);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLInputElement>) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLInputElement>) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.touches[0].clientY;
    if (Math.abs(deltaY) > 16) {
      adjustValue(deltaY > 0 ? 1 : -1);
      touchStartY.current = e.touches[0].clientY;
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      <input
        {...inputProps}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        className={`w-full bg-slate-900/40 border border-slate-700 rounded-xl px-3 pr-14 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 ${className}`}
        value={value}
        onChange={(e) => {
          if (e.target.value.includes("-")) return;
          onChange(normalizeInputValue(e.target.value, min));
        }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      />
      <div className="absolute inset-y-1 right-1 flex flex-col overflow-hidden rounded-lg border border-slate-700/70 bg-slate-800/60">
        <button
          type="button"
          className="flex-1 px-2 text-[11px] leading-[18px] text-slate-100 hover:bg-slate-700/70 active:bg-slate-600/70"
          onClick={() => adjustValue(1)}
          tabIndex={-1}
        >
          &uarr;
        </button>
        <div className="h-px bg-slate-700/80" />
        <button
          type="button"
          className="flex-1 px-2 text-[11px] leading-[18px] text-slate-100 hover:bg-slate-700/70 active:bg-slate-600/70"
          onClick={() => adjustValue(-1)}
          tabIndex={-1}
        >
          &darr;
        </button>
      </div>
    </div>
  );
};

const CircularTitle: React.FC = () => {
  const pathId = useId();

  return (
    <div className="relative w-36 h-36 shrink-0 flex items-center justify-center text-cyan-300">
      <svg viewBox="0 0 200 200" className="absolute inset-0" aria-hidden="true">
        <defs>
          <path
            id={pathId}
            d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0"
          />
        </defs>
        <text className="fill-current font-semibold tracking-[0.2em] text-[12px] uppercase">
          <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
            Papa Pietro • Pizza Calculator •
          </textPath>
        </text>
      </svg>
      <div className="w-14 h-14 rounded-full bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-3xl shadow-lg shadow-cyan-900/30">
        🍕
      </div>
      <span className="sr-only">Papa Pietro Pizza Calculator</span>
    </div>
  );
};

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
  const [ballsInput, setBallsInput] = useState<string>("4");
  const [heroVisible, setHeroVisible] = useState<boolean>(true);
  const heroRef = useRef<HTMLDivElement | null>(null);

  const [hydrationInput, setHydrationInput] = useState<string>(
    FLOUR_PRESETS["Caputo Pizzeria (00)"].hydration.toString()
  );
  const [saltPctInput, setSaltPctInput] = useState<string>("2.8");
  const [oilPctInput, setOilPctInput] = useState<string>("2");
  const [yeastType, setYeastType] = useState<YeastId>("instant");

  const [tkHoursInput, setTkHoursInput] = useState<string>("24");
  const [toHoursInput, setToHoursInput] = useState<string>("2");
  const [tkTempInput, setTkTempInput] = useState<string>("4");
  const [toTempInput, setToTempInput] = useState<string>("22");

  const balls = useMemo(() => toNumberValue(ballsInput, 1), [ballsInput]);
  const hydration = useMemo(
    () => toNumberValue(hydrationInput),
    [hydrationInput]
  );
  const saltPct = useMemo(() => toNumberValue(saltPctInput), [saltPctInput]);
  const oilPct = useMemo(() => toNumberValue(oilPctInput), [oilPctInput]);
  const tkHours = useMemo(() => toNumberValue(tkHoursInput), [tkHoursInput]);
  const toHours = useMemo(() => toNumberValue(toHoursInput), [toHoursInput]);
  const tkTemp = useMemo(() => toNumberValue(tkTempInput), [tkTempInput]);
  const toTemp = useMemo(() => toNumberValue(toTempInput), [toTempInput]);

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

  const ingredients = [
    { label: "Woda", value: water },
    { label: "Drożdże", value: yeast },
    { label: "Mąka", value: flour },
    { label: "Oliwa", value: oil },
    { label: "Sól", value: salt },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl glass rounded-2xl p-8 space-y-8 backdrop-blur-xl">
        <header className="space-y-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <CircularTitle />
              <h1 className="sr-only">Papa Pietro Pizza Calculator</h1>
            </div>
            {heroVisible && (
              <div className="w-full md:w-52 lg:w-56 aspect-[2/3]">
                <div
                  className="relative h-full rounded-xl border border-slate-700/70 shadow-lg shadow-cyan-900/30 overflow-hidden bg-slate-950/50"
                  ref={heroRef}
                >
                  <img
                    src={heroImage}
                    alt="Papa Pietro dusting pizza with chili flakes"
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={() => setHeroVisible(false)}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-900/40 to-transparent" />
                </div>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Wybierz mąkę (w tym marketowe typy), profil TK/TO i pozwól, żeby Papa
            Pietro wyliczył drożdże i składniki.
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
                  setHydrationInput(FLOUR_PRESETS[v].hydration.toString());
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
                Białko: {currentFlour.protein}% (siła mąki) • domyślna hydracja:{" "}
                {currentFlour.hydration}%
              </p>
            </div>

            <div>
              <label className="block text-xs mb-1 text-slate-400">
                Liczba kulek (po 250 g)
              </label>
              <NumericInput
                value={ballsInput}
                min={1}
                step={1}
                onChange={setBallsInput}
                aria-label="Liczba kulek"
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
                <NumericInput
                  value={hydrationInput}
                  step={0.5}
                  onChange={setHydrationInput}
                  aria-label="Hydracja"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  Sól %
                </label>
                <NumericInput
                  value={saltPctInput}
                  step={0.1}
                  onChange={setSaltPctInput}
                  aria-label="Sól procent"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  Oliwa %
                </label>
                <NumericInput
                  value={oilPctInput}
                  step={0.1}
                  onChange={setOilPctInput}
                  aria-label="Oliwa procent"
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
                <NumericInput
                  value={tkHoursInput}
                  step={0.5}
                  onChange={setTkHoursInput}
                  aria-label="TK godziny"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  TK °C
                </label>
                <NumericInput
                  value={tkTempInput}
                  step={0.5}
                  onChange={setTkTempInput}
                  aria-label="TK temperatura"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  TO (h)
                </label>
                <NumericInput
                  value={toHoursInput}
                  step={0.5}
                  onChange={setToHoursInput}
                  aria-label="TO godziny"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">
                  TO °C
                </label>
                <NumericInput
                  value={toTempInput}
                  step={0.5}
                  onChange={setToTempInput}
                  aria-label="TO temperatura"
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
                {kneadingPlan.foldInterval} min (ok. {kneadingPlan.totalFoldTime}{" "}
                min)
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
            {ingredients.map((item) => (
              <div
                key={item.label}
                className="bg-slate-900/50 border border-slate-700 rounded-xl p-3"
              >
                <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                <div className="text-lg font-semibold text-cyan-200">
                  {format(item.value)}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            Sól dodaj pod koniec wyrabiania, a oliwa jest opcjonalna w
            klasycznym neapolitańskim przepisie.
          </p>
        </section>
      </div>
    </div>
  );
};

export default DoughCalculator;
