import React, { useState, useEffect } from 'react';
import { Vehicle, CustomizationOptions } from '../types';
import { PAINT_PRESETS, UNDERGLOW_PRESETS, RIM_PRESETS } from '../data';
import LicensePlateDesigner from './LicensePlateDesigner';
import { Palette, Layers, Sparkles, Check, CheckSquare, Zap, Eye, Compass } from 'lucide-react';

interface TuningVisualizerProps {
  vehicle: Vehicle;
  onSpecsCalculate?: (extraCost: number, finalSpecs: { topSpeed: number }) => void;
}

export default function TuningVisualizer({ vehicle, onSpecsCalculate }: TuningVisualizerProps) {
  // Setup default customization state
  const [paintType, setPaintType] = useState<CustomizationOptions['paintType']>('Metallic');
  const [primaryColor, setPrimaryColor] = useState('#f8fafc'); // Default Alabaster White
  const [secondaryColor, setSecondaryColor] = useState('#0d0d0d'); // Default Carbon/Midnight
  const [pearlescent, setPearlescent] = useState('#ca8a04'); // Gold pearlescent
  const [underglowOn, setUnderglowOn] = useState(false);
  const [underglowColor, setUnderglowColor] = useState('#06b6d4'); // Cyan underglow
  const [rimStyle, setRimStyle] = useState(RIM_PRESETS[0].name);
  const [windowTint, setWindowTint] = useState<CustomizationOptions['windowTint']>('Dark');
  const [spoilerLevel, setSpoilerLevel] = useState<CustomizationOptions['spoilerLevel']>('Stock');
  const [plateText, setPlateText] = useState('VELOCE_1');
  const [plateStyle, setPlateStyle] = useState<CustomizationOptions['licensePlateStyle']>('CAR_DEALER');

  // Specs increments from upgrades
  const [tunedTopSpeed, setTunedTopSpeed] = useState(vehicle.topSpeed);
  const [customizationCost, setCustomizationCost] = useState(0);

  // Recalculate cost and performance specs in real-time
  useEffect(() => {
    let extraCost = 0;

    // Paint fees
    const pPreset = PAINT_PRESETS.find(p => p.hex.toLowerCase() === primaryColor.toLowerCase());
    if (pPreset) extraCost += pPreset.cost;
    if (paintType === 'Chrome') extraCost += 12000;
    if (paintType === 'Matte') extraCost += 6000;

    // Underglow cost
    if (underglowOn) {
      extraCost += 4500;
    }

    // Spoiler package cost
    let speedBonus = 0;
    if (spoilerLevel === 'Low-Profile') {
      extraCost += 3500;
    } else if (spoilerLevel === 'Carbon Track') {
      extraCost += 8500;
      speedBonus += 2;
    } else if (spoilerLevel === 'GT Wing') {
      extraCost += 15000;
      speedBonus -= 1; // Slight drag down top speed
    }

    // Window tint fees
    if (windowTint === 'Light') extraCost += 800;
    if (windowTint === 'Dark') extraCost += 1800;
    if (windowTint === 'Limo') extraCost += 3500;

    // Rim package fees
    const rPreset = RIM_PRESETS.find(r => r.name === rimStyle);
    if (rPreset) extraCost += rPreset.cost;

    setCustomizationCost(extraCost);

    // Calculate upgraded tuned specs
    const finalSpeed = vehicle.topSpeed + speedBonus;
    setTunedTopSpeed(finalSpeed);

    if (onSpecsCalculate) {
      onSpecsCalculate(extraCost, { topSpeed: finalSpeed });
    }
  }, [
    vehicle,
    paintType,
    primaryColor,
    secondaryColor,
    underglowOn,
    underglowColor,
    spoilerLevel,
    windowTint,
    rimStyle,
    onSpecsCalculate
  ]);

  // Handle local change of plate
  const handlePlateChange = (text: string, style: CustomizationOptions['licensePlateStyle']) => {
    setPlateText(text);
    setPlateStyle(style);
  };

  // Translate paint finish type for headers
  const translatePaintType = (type: CustomizationOptions['paintType']) => {
    switch (type) {
      case 'Glossy': return 'GLANZEND';
      case 'Metallic': return 'METALLIC';
      case 'Matte': return 'MAT';
      case 'Chrome': return 'CHROOM';
      default: return String(type).toUpperCase();
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl text-left bg-gradient-to-b from-neutral-900 to-neutral-950">
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 mb-6">
        <div className="p-2.5 bg-neutral-950 rounded-lg text-amber-500 border border-neutral-800">
          <Palette className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
            Showroom Tuningvloer
            <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">LIVE WORKSHOP</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Lak, neon, spoiler-aerodynamica, blinderen van ruiten en nummerplaten op maat. Simuleert perfecte visuele resultaten en prijzen in de stad.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Dynamic Vector Supercar Illustration */}
        <div className="lg:col-span-6 flex flex-col justify-between items-center bg-neutral-950 p-6 rounded-xl border border-neutral-850 relative min-h-[440px]">
          <div className="absolute top-3 left-3 flex gap-1.5 z-10">
            <span className="text-[10px] font-mono font-bold bg-neutral-900 text-amber-500 border border-neutral-800 px-2 py-0.5 rounded">
              AANPASSING WORKSHOP ACTIEF
            </span>
            <span className="text-[10px] font-mono font-bold bg-neutral-900 text-emerald-400 border border-neutral-800 px-2 py-0.5 rounded">
              {translatePaintType(paintType)} LAKAFWERKING
            </span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5 text-neutral-500 text-[10px] font-mono">
            <Compass className="w-3.5 h-3.5 text-neutral-600 animate-spin-slow" />
            <span>360° VIEWPORT</span>
          </div>

          {/* Interactive Supercar SVG Art Frame */}
          <div className="w-full my-auto py-10 flex flex-col items-center justify-center relative">
            
            {/* Ambient Underglow Light Bloom Ring */}
            {underglowOn && (
              <div
                className="absolute duration-300 rounded-full blur-3xl opacity-65 w-72 h-36"
                style={{
                  backgroundColor: underglowColor,
                  filter: 'blur(45px)',
                  transform: 'translateY(40px)'
                }}
              ></div>
            )}

            {/* Simulated 2D Supercar Chassis Blueprint Vector */}
            <svg viewBox="0 0 400 200" className="w-full max-w-md relative z-10 transition-transform duration-300 select-none">
              <defs>
                {/* Shiny/Chrome/Matte Linear Gradients */}
                <linearGradient id="paintGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity={paintType === 'Chrome' ? 0.9 : 1} />
                  <stop offset="50%" stopColor={paintType === 'Metallic' ? '#ffffff' : primaryColor} stopOpacity={paintType === 'Chrome' ? 0.6 : 0.8} />
                  <stop offset="100%" stopColor={primaryColor} />
                </linearGradient>
                
                <linearGradient id="secGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={secondaryColor} />
                  <stop offset="100%" stopColor="#0a0a0a" />
                </linearGradient>

                <filter id="neonGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* 1. UNDERGLOW TUBES (If active) */}
              {underglowOn && (
                <rect x="70" y="145" width="260" height="4" fill={underglowColor} rx="2" filter="url(#neonGlow)" />
              )}

              {/* 2. REAR SPOILER (UPGRADES) */}
              {spoilerLevel !== 'Stock' && (
                <g className="transition-all duration-300">
                  {/* Spoiler Brackets */}
                  <rect x="75" y={spoilerLevel === 'GT Wing' ? '70' : spoilerLevel === 'Carbon Track' ? '82' : '92'} width="4" height={spoilerLevel === 'GT Wing' ? '30' : spoilerLevel === 'Carbon Track' ? '18' : '8'} fill="#171717" />
                  <rect x="95" y={spoilerLevel === 'GT Wing' ? '70' : spoilerLevel === 'Carbon Track' ? '82' : '92'} width="4" height={spoilerLevel === 'GT Wing' ? '30' : spoilerLevel === 'Carbon Track' ? '18' : '8'} fill="#171717" />
                  
                  {/* Spoiler Blade Wing */}
                  <path
                    d={
                      spoilerLevel === 'GT Wing'
                        ? 'M 60 70 L 115 70 L 110 66 L 58 67 Z'
                        : spoilerLevel === 'Carbon Track'
                        ? 'M 65 82 L 110 82 L 105 79 L 63 79 Z'
                        : 'M 72 92 L 102 92 L 98 90 L 70 90 Z'
                    }
                    fill={spoilerLevel === 'GT Wing' ? '#0a0a0a' : 'url(#secGrad)'}
                    stroke={spoilerLevel === 'GT Wing' ? '#ef4444' : 'none'}
                    strokeWidth="0.5"
                  />
                </g>
              )}

              {/* 3. WHEEL ARCHES & REAR DIFFUSER */}
              <path d="M 60 145 H 105 A 24 24 0 0 1 150 145 H 250 A 24 24 0 0 1 295 145 H 345 H 370 A 15 15 0 0 0 380 130 H 20" fill="#121212" />

              {/* 4. MAIN BODY SHELL (PRI COLOR) */}
              <path
                d="M 68 140 H 112 A 20 20 0 0 0 144 125 A 40 40 0 0 1 180 115 A 120 120 0 0 1 230 114 A 20 20 0 0 0 248 122 H 298 A 20 20 0 0 0 330 140 H 360 C 375 140, 385 130, 385 110 C 385 95, 365 92, 345 92 Q 330 92, 312 94 C 295 80, 260 75, 205 75 Q 155 75, 125 90 C 105 92, 85 94, 68 102 C 55 110, 52 120, 54 128 C 55 134, 60 140, 68 140 Z"
                fill="url(#paintGrad)"
                stroke="#1c1917"
                strokeWidth="1.5"
                className="transition-all duration-300"
              />

              {/* 5. AESTHETIC CARBON STRIPES (SEC COLOR) */}
              <path
                d="M 125 90 C 112 92, 95 94, 80 98 L 92 105 L 140 92 Z"
                fill="url(#secGrad)"
                className="transition-all duration-300"
              />
              <path
                d="M 330 115 H 368 L 360 126 H 325 Z"
                fill="url(#secGrad)"
                className="transition-all duration-300"
              />

              {/* 6. COCKPIT WINDOWS (TINTING) */}
              <path
                d="M 175 110 C 185 100, 205 85, 222 83 C 260 83, 275 87, 285 96 C 285 96, 255 96, 235 98 C 215 98, 175 110, 175 110 Z"
                fill={windowTint === 'None' ? '#7dd3fc' : '#171717'}
                fillOpacity={
                  windowTint === 'None' ? 0.35 :
                  windowTint === 'Light' ? 0.55 :
                  windowTint === 'Dark' ? 0.85 : 0.96
                }
                stroke="#27272a"
                strokeWidth="1"
                className="transition-all duration-300"
              />

              {/* 7. FRONT & REAR LIGHTS */}
              <path d="M 52 114 Q 50 118, 56 120 Q 58 112, 52 114 Z" fill="#ef4444" filter="url(#neonGlow)" /> {/* Tail light */}
              <path d="M 382 110 Q 386 114, 381 118" stroke="#38bdf8" strokeWidth="2.5" fill="none" filter="url(#neonGlow)" /> {/* Headlight wire */}

              {/* 8. WHEELS/RIMS AND TIRES */}
              {/* Back Wheel */}
              <g className="transition-all duration-300">
                <circle cx="127" cy="145" r="21" fill="#1c1917" stroke="#09090b" strokeWidth="3" />
                <circle cx="127" cy="145" r="14" fill="#2d2a29" stroke="#52525b" strokeWidth="1.5" />
                {/* Spokes lines representing rim styles */}
                <line x1="127" y1="131" x2="127" y2="159" stroke={primaryColor} strokeWidth="1.5" />
                <line x1="113" y1="145" x2="141" y2="145" stroke={primaryColor} strokeWidth="1.5" />
                <line x1="117" y1="135" x2="137" y2="155" stroke={primaryColor} strokeWidth="1.5" />
                <line x1="117" y1="155" x2="137" y2="135" stroke={primaryColor} strokeWidth="1.5" />
                <circle cx="127" cy="145" r="4.5" fill="#18181b" />
              </g>

              {/* Front Wheel */}
              <g className="transition-all duration-300">
                <circle cx="272" cy="145" r="21" fill="#1c1917" stroke="#09090b" strokeWidth="3" />
                <circle cx="272" cy="145" r="14" fill="#2d2a29" stroke="#52525b" strokeWidth="1.5" />
                <line x1="272" y1="131" x2="272" y2="159" stroke={primaryColor} strokeWidth="1.5" />
                <line x1="258" y1="145" x2="286" y2="145" stroke={primaryColor} strokeWidth="1.5" />
                <line x1="262" y1="135" x2="282" y2="155" stroke={primaryColor} strokeWidth="1.5" />
                <line x1="262" y1="155" x2="282" y2="135" stroke={primaryColor} strokeWidth="1.5" />
                <circle cx="272" cy="145" r="4.5" fill="#18181b" />
              </g>

              {/* 9. THE BUMPER LICENSE PLATE (Embedded!) */}
              <g transform="translate(48, 126) rotate(4)" className="transition-all duration-300">
                <rect width="18" height="9" fill={plateStyle === 'SA_BLACK' ? '#0f0f11' : plateStyle === 'YANKTON' ? '#fef3c7' : '#f5f5f4'} rx="1" stroke="#44403c" strokeWidth="0.5" />
                <text x="9" y="7" fontSize="5" fontFamily="monospace" fontWeight="bold" fill={plateStyle === 'SA_BLACK' ? '#eab308' : plateStyle === 'SA_EXOTIC' ? '#1e3a8a' : '#1c1917'} textAnchor="middle" letterSpacing="0.2">
                  {plateText.substring(0, 5)}
                </text>
              </g>
            </svg>

            <span className="text-stone-500 text-[11px] font-mono mt-4 block">MODEL: {vehicle.realModel || 'Super Import'} | SPECIFICATIE: AWD CHASSIS</span>
          </div>

          {/* Core Tuned Result Summary Display */}
          <div className="w-full bg-neutral-900 border border-neutral-850 rounded-lg p-4 text-center">
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase tracking-widest font-bold">EXTRA BIJKOMENDE TUNINGSKOSTEN</span>
              <span className="text-lg font-extrabold text-amber-500 font-mono">+{customizationCost === 0 ? '€0' : `€${customizationCost.toLocaleString()}`}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Options Customizer Controls Panels */}
        <div className="lg:col-span-6 space-y-5 h-[440px] overflow-y-auto pr-1">
          {/* Section A: Paint Options */}
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-850">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-neutral-900 pb-2">
              <Palette className="w-4 h-4 text-amber-500" />
              Primaire Lakconfiguratie
            </h4>

            {/* Paint Styles Selector */}
            <div className="grid grid-cols-4 gap-1 mb-4">
              {(['Glossy', 'Metallic', 'Matte', 'Chrome'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setPaintType(type)}
                  className={`text-[10px] py-1.5 px-0.5 rounded border uppercase tracking-wider font-extrabold transition-all ${
                    paintType === type
                      ? 'bg-amber-500 border-amber-500 text-neutral-950'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                  }`}
                >
                  {type === 'Glossy' ? 'Glanzend' : type === 'Metallic' ? 'Metallic' : type === 'Matte' ? 'Mat' : 'Chroom'}
                </button>
              ))}
            </div>

            {/* Colors Grid Presets */}
            <div className="grid grid-cols-8 gap-2">
              {PAINT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setPrimaryColor(preset.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 active:scale-90 relative cursor-pointer ${
                    primaryColor.toLowerCase() === preset.hex.toLowerCase()
                      ? 'border-amber-500 scale-105'
                      : 'border-white/10'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  title={`${preset.name} (+$${preset.cost})`}
                >
                  {primaryColor.toLowerCase() === preset.hex.toLowerCase() && (
                    <span className="absolute inset-0.5 rounded-full border border-neutral-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-neutral-100 mix-blend-difference" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section B: Spoilers & Window Tints */}
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-850 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Spoiler Height upgrades */}
            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
                Aerodynamische Spoilers & Bodykits
              </label>
              <select
                value={spoilerLevel}
                onChange={(e) => setSpoilerLevel(e.target.value as CustomizationOptions['spoilerLevel'])}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-200 cursor-pointer"
              >
                <option value="Stock">Standaard spoiler ($0)</option>
                <option value="Low-Profile">Low-Profile Ducktail ($3.500)</option>
                <option value="Carbon Track">Carbon circuit-fin ($8.500)</option>
                <option value="GT Wing">Gepersonaliseerde GT-zwanenhals vleugel ($15.000)</option>
              </select>
            </div>

            {/* Glass Tints selection */}
            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
                Blinderen van Ruiten (DMV-Norm)
              </label>
              <select
                value={windowTint}
                onChange={(e) => setWindowTint(e.target.value as CustomizationOptions['windowTint'])}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-200 cursor-pointer"
              >
                <option value="None">Helder veiligheidsglas ($0)</option>
                <option value="Light">35% Licht gerookt ($800)</option>
                <option value="Dark">15% Donker houtskool ($1.800)</option>
                <option value="Limo">5% Zware Limo Premium ($3.500)</option>
              </select>
            </div>
          </div>

          {/* Section C: Underglow and Rims */}
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-850 space-y-3.5">
            {/* Underglow Toggle check */}
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="underglowCheck"
                  checked={underglowOn}
                  onChange={(e) => setUnderglowOn(e.target.checked)}
                  className="w-4 h-4 bg-neutral-900 border-neutral-800 text-amber-500 focus:ring-amber-500/20 rounded cursor-pointer"
                />
                <label htmlFor="underglowCheck" className="text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer">
                  Neon LED Underglow Pakket (+$4.500)
                </label>
              </div>
              <Zap className={`w-4 h-4 ${underglowOn ? 'text-amber-500 animate-pulse' : 'text-neutral-700'}`} />
            </div>

            {/* Underglow Colors Presets Grid */}
            {underglowOn && (
              <div className="flex gap-2.5 animate-fadeIn">
                {UNDERGLOW_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setUnderglowColor(preset.hex)}
                    className={`w-6 h-6 rounded border transition-all ${
                      underglowColor === preset.hex ? 'border-amber-500 scale-110 shadow-lg' : 'border-white/10'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.name}
                  >
                    {underglowColor === preset.hex && (
                      <span className="block w-1.5 h-1.5 bg-neutral-950 rounded-full mx-auto shadow"></span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Custom Rims Selection */}
            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
                Gesmede Lichtmetalen Performance-Velgen
              </label>
              <select
                value={rimStyle}
                onChange={(e) => setRimStyle(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-200 cursor-pointer"
              >
                {RIM_PRESETS.map(r => (
                  <option key={r.name} value={r.name}>{r.name} (+${r.cost.toLocaleString()})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section D: Linked Plate Customization */}
          <div>
            <LicensePlateDesigner
              currentText={plateText}
              currentStyle={plateStyle}
              onPlateChange={handlePlateChange}
              compact={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
