import React, { useState } from 'react';
import { CustomizationOptions } from '../types';
import { CreditCard, Sparkles, Check, Copy } from 'lucide-react';

interface PlateDesignerProps {
  currentText: string;
  currentStyle: CustomizationOptions['licensePlateStyle'];
  onPlateChange: (text: string, style: CustomizationOptions['licensePlateStyle']) => void;
  compact?: boolean;
}

export const PLATE_STYLES = [
  {
    id: 'SA_EXOTIC' as const,
    name: 'San Andreas Liberty (Wit, Blauwe letters)',
    bgClass: 'bg-stone-100 border-stone-300 text-blue-900',
    bannerText: 'SAN ANDREAS',
    bannerClass: 'text-red-600 font-extrabold tracking-widest text-[10px] uppercase text-center',
    plateTextClass: 'font-mono uppercase font-black text-center tracking-wider text-4xl text-blue-900 drop-shadow-sm',
    cost: 500,
  },
  {
    id: 'SA_BLACK' as const,
    name: 'San Andreas Vintage (Geel op Zwart)',
    bgClass: 'bg-neutral-900 border-yellow-600 text-yellow-500',
    bannerText: 'SAN ANDREAS',
    bannerClass: 'text-yellow-600 font-bold tracking-wider text-[9px] uppercase text-center',
    plateTextClass: 'font-mono uppercase font-bold text-center tracking-widest text-4xl text-yellow-500',
    cost: 1500,
  },
  {
    id: 'YANKTON' as const,
    name: 'Yankton State (Sneeuw Editie)',
    bgClass: 'bg-amber-100 border-amber-300 relative overflow-hidden',
    bannerText: 'YANKTON',
    bannerClass: 'text-red-700 font-serif font-black tracking-widest text-[9.5px] text-center',
    plateTextClass: 'font-mono uppercase font-bold text-center tracking-widest text-4xl text-zinc-800 relative z-10',
    cost: 5000,
    hasSnow: true,
  },
  {
    id: 'CAR_DEALER' as const,
    name: 'Veloce Custom (Carbon-Goud)',
    bgClass: 'bg-gradient-to-br from-neutral-800 to-neutral-950 border-amber-500',
    bannerText: 'VELOCE IMPORTS',
    bannerClass: 'text-amber-500 font-bold tracking-widest text-[10px] text-center uppercase font-sans',
    plateTextClass: 'font-mono uppercase font-extrabold text-center tracking-widest text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
    cost: 3000,
  }
];

export default function LicensePlateDesigner({
  currentText,
  currentStyle,
  onPlateChange,
  compact = false
}: PlateDesignerProps) {
  const [copied, setCopied] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limiteer tot 8 tekens en filter speciale tekens
    const rawVal = e.target.value;
    const cleanVal = rawVal.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().slice(0, 8);
    onPlateChange(cleanVal, currentStyle);
  };

  const handleStyleChange = (styleId: CustomizationOptions['licensePlateStyle']) => {
    onPlateChange(currentText, styleId);
  };

  const currentConfig = PLATE_STYLES.find(s => s.id === currentStyle) || PLATE_STYLES[0];

  const copyPlate = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-xl p-6 ${compact ? 'max-w-md' : 'w-full'}`}>
      {!compact && (
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            Kentekenplaat Ontwerper
          </h3>
          <p className="text-xs text-neutral-400">
            Ontwerp een gepersonaliseerde kentekenplaat. Bestellingen worden automatisch gesynchroniseerd met stadsdatabases.
          </p>
        </div>
      )}

      {/* Plate Showcase Card */}
      <div className="flex flex-col items-center justify-center p-6 bg-neutral-950 rounded-lg border border-neutral-800 mb-6 relative">
        <div className="absolute top-2 left-2 text-[10px] font-mono text-neutral-600">PREVIEW OMGEVING</div>
        
        {/* De metalen plaat */}
        <div className={`w-72 h-36 rounded-2xl border-4 ${currentConfig.bgClass} flex flex-col justify-between py-3 px-4 shadow-[0_15px_30px_rgba(0,0,0,0.5)] transition-all duration-300 relative`}>
          {/* Sneeuweffecten voor Yankton */}
          {currentConfig.hasSnow && (
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute top-0 left-0 w-full h-4 bg-white/40 blur-xs"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 bg-white/20 rounded-full blur-md"></div>
              <div className="absolute top-1/2 left-1/3 w-6 h-6 bg-white/10 rounded-full blur-xs"></div>
            </div>
          )}

          {/* Schroefgaten */}
          <div className="flex justify-between items-center px-4 absolute top-2 left-0 w-full pointer-events-none z-20">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 shadow-inner border border-zinc-900/60 relative">
              <div className="absolute inset-0.5 bg-zinc-500 rounded-full"></div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 shadow-inner border border-zinc-900/60 relative">
              <div className="absolute inset-0.5 bg-zinc-500 rounded-full"></div>
            </div>
          </div>

          <div className="flex justify-between items-center px-4 absolute bottom-2 left-0 w-full pointer-events-none z-20">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 shadow-inner border border-zinc-900/60 relative">
              <div className="absolute inset-0.5 bg-zinc-500 rounded-full"></div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 shadow-inner border border-zinc-900/60 relative">
              <div className="absolute inset-0.5 bg-zinc-500 rounded-full"></div>
            </div>
          </div>

          {/* Bannertekst */}
          <div className={`${currentConfig.bannerClass} mt-1 select-none font-bold relative z-10 font-sans tracking-widest`}>
            {currentConfig.bannerText}
          </div>

          {/* Hoofdtekens */}
          <div className="my-auto flex justify-center items-center h-14 relative z-10">
            <span className={`${currentConfig.plateTextClass} font-mono block select-all font-black text-4xl`}>
              {currentText || 'LSR-999'}
            </span>
          </div>

          {/* Optionele sticker onderaan */}
          <div className="text-center text-[8px] font-sans tracking-widest opacity-60 pointer-events-none z-10 font-bold">
            {currentStyle === 'YANKTON' ? 'STATE OF YANKTON' : 'LOS SANTOS EXOTICS'}
          </div>
        </div>

        {/* Kopieerknop */}
        <button
          onClick={copyPlate}
          className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-700 hover:border-amber-500 hover:bg-neutral-800 text-xs text-neutral-300 rounded-md transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-400 font-medium">Kenteken Gekopieerd!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Kopieer Spawn-code</span>
            </>
          )}
        </button>
      </div>

      {/* Nummerplaatopties */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
            Gepersonaliseerd Kenteken (Max. 8 tekens)
          </label>
          <input
            type="text"
            className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-100 placeholder-neutral-700 font-mono tracking-widest text-lg uppercase"
            placeholder="BIJV. SNEL V8"
            value={currentText}
            onChange={handleTextChange}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-neutral-400 block mb-2 uppercase tracking-wider">
            Selecteer Achtergrond / Stijl
          </label>
          <div className="grid grid-cols-1 gap-2">
            {PLATE_STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => handleStyleChange(style.id)}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                  currentStyle === style.id
                    ? 'bg-amber-500/10 border-amber-500 text-amber-100'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-3.5 rounded border ${style.bgClass.split(' ')[0]} border-white/20`}></div>
                  <span className="text-xs font-medium">{style.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-neutral-400">
                    +${style.cost.toLocaleString()}
                  </span>
                  {currentStyle === style.id && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
