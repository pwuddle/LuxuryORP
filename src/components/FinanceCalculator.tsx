import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { VEHICLES } from '../data';
import { Calculator, ShieldCheck, Landmark, Check, AlertCircle, Sparkles, Printer } from 'lucide-react';

interface FinanceCalculatorProps {
  initialVehicle?: Vehicle;
}

const INTEREST_RATES = [
  { termWeeks: 12, rate: 3.5, label: '12 Weken (Snelplan)' },
  { termWeeks: 24, rate: 5.5, label: '24 Weken (Gebalanceerd Plan)' },
  { termWeeks: 36, rate: 7.2, label: '36 Weken (Spaarplan)' },
  { termWeeks: 52, rate: 9.8, label: '52 Weken (Ultra-Flexibel Plan)' }
];

export default function FinanceCalculator({ initialVehicle }: FinanceCalculatorProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(initialVehicle || VEHICLES[0]);
  const [priceInput, setPriceInput] = useState<number>(selectedVehicle.price);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20); // default 20%
  const [termWeeks, setTermWeeks] = useState<number>(24);
  const [certified, setCertified] = useState<boolean>(false);
  const [applicantName, setApplicantName] = useState<string>('');
  const [showAgreement, setShowAgreement] = useState<boolean>(false);

  // Sync state if initial vehicle changes
  useEffect(() => {
    if (initialVehicle) {
      setSelectedVehicle(initialVehicle);
      setPriceInput(initialVehicle.price);
    }
  }, [initialVehicle]);

  // Keep manual price input in sync when selected vehicle changes
  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = VEHICLES.find(item => item.id === e.target.value);
    if (v) {
      setSelectedVehicle(v);
      setPriceInput(v.price);
    }
  };

  // Calculations
  const downPaymentAmount = Math.round((priceInput * downPaymentPercent) / 100);
  const principalLoanAmount = priceInput - downPaymentAmount;
  
  const currentRateObj = INTEREST_RATES.find(rate => rate.termWeeks === termWeeks) || INTEREST_RATES[1];
  const totalInterestPercent = currentRateObj.rate;
  const totalInterestAmount = Math.round((principalLoanAmount * totalInterestPercent) / 100);
  
  const totalFinancedCost = principalLoanAmount + totalInterestAmount;
  const weeklyPayment = Math.round(totalFinancedCost / termWeeks);
  const fullFinancingPrice = downPaymentAmount + totalFinancedCost;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl text-left bg-gradient-to-b from-neutral-900 to-neutral-950">
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 mb-6">
        <div className="p-2.5 bg-neutral-950 rounded-lg text-amber-500 border border-neutral-800">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
            Maze Bank Financieel Centrum
          </h2>
          <p className="text-xs text-neutral-400">
            Simuleer wekelijkse autoleningen met lage rente, speciaal afgestemd op de burgers van Los Santos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Inputs */}
        <div className="lg:col-span-7 space-y-5">
          {/* Select Vehicle */}
          <div>
            <label className="text-xs font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
              Kies Showroommodel
            </label>
            <select
              value={selectedVehicle.id}
              onChange={handleVehicleChange}
              className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none transition-all cursor-pointer font-medium"
            >
              {VEHICLES.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} — ${v.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Valuation Override */}
          <div>
            <label className="text-xs font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
              Basiswaarde Voertuig ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-neutral-500 text-sm">$</span>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg pl-8 pr-4 py-2 text-sm text-slate-100 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Down Payment Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
              <span>Aanbetaling ({downPaymentPercent}%)</span>
              <span className="text-amber-500 font-mono">${downPaymentAmount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
              <span>10% Min aanbetaling</span>
              <span>90% Max aanbetaling</span>
            </div>
          </div>

          {/* Payment Terms Duration */}
          <div>
            <label className="text-xs font-bold text-neutral-400 block mb-2 uppercase tracking-wider animate-pulse-subtle">
              Looptijd Lening (Weken in de Stad)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INTEREST_RATES.map((rateObj) => (
                <button
                  key={rateObj.termWeeks}
                  onClick={() => setTermWeeks(rateObj.termWeeks)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    termWeeks === rateObj.termWeeks
                      ? 'bg-amber-500/10 border-amber-500 text-amber-100'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-200">{rateObj.termWeeks} Weken</div>
                  <div className="flex justify-between items-center text-[11px] text-neutral-400 mt-0.5">
                    <span>Voet</span>
                    <span className="text-emerald-400 font-mono">+{rateObj.rate}% j.r.</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Credit Check Prerequisites */}
          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg">
            <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Geldende Kwalificatie-eisen voor Leningen
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-neutral-400">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Geldig Stad-Rijbewijs (DMV)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Geen Actieve Arrestatiebevelen</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Maze Banksaldo &gt; Aanbetaling</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Discord gesynchroniseerd voor notificaties</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Outputs & Agreement */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="bg-neutral-950 rounded-xl p-5 border border-amber-500/20 shadow-inner space-y-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest text-center border-b border-neutral-800 pb-3 flex justify-center items-center gap-1.5">
              <Landmark className="w-4 h-4 text-amber-500" />
              SCHATTING VAN LENINGSOVERZICHT
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Rijklaarprijs Voertuig:</span>
                <span className="font-mono text-slate-200">${priceInput.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Initiële Contante Aanbetaling:</span>
                <span className="font-mono text-amber-400">-${downPaymentAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Gefinancierde Hoofdsom:</span>
                <span className="font-mono text-slate-200">${principalLoanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Opgebouwde Rente (+{totalInterestPercent}% j.r.):</span>
                <span className="font-mono text-red-400">+${totalInterestAmount.toLocaleString()}</span>
              </div>
              
              <div className="border-t border-dashed border-neutral-850 my-2 pt-2"></div>

              <div className="flex justify-between text-neutral-300">
                <span>Totale Betalingsverplichting:</span>
                <span className="font-mono text-slate-100">${fullFinancingPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Giant Weekly Payment Number */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-4 text-center">
              <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-widest mb-1">
                Jouw Wekelijkse Betaling
              </span>
              <span className="text-3xl font-black text-amber-500 font-mono tracking-tight">
                ${weeklyPayment.toLocaleString()}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-1">
                gedurende {termWeeks} opeenvolgende weken
              </span>
            </div>

            {/* Application Certificate trigger */}
            {!showAgreement ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Voer volledige naam van personage in..."
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
                <button
                  disabled={!applicantName.trim()}
                  onClick={() => setShowAgreement(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Genereer Financieringsconcept
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAgreement(false)}
                className="w-full py-2 bg-neutral-900 border border-neutral-700 hover:border-neutral-600 text-neutral-300 text-xs rounded-lg transition-all"
              >
                Wijzig Financieringsvoorwaarden
              </button>
            )}
          </div>

          <p className="text-[10px] text-neutral-500 italic mt-3 text-center">
            *Onderhevig aan achtergrondonderzoek door de dealer. Wanbetaling kan leiden tot gedwongen inbeslagname in de stad, sleepvorderingen of kredietverlaging.
          </p>
        </div>
      </div>

      {/* Show Agreement Modal/Certificate Section */}
      {showAgreement && (
        <div className="mt-8 border-2 border-stone-100 bg-stone-50 text-stone-900 p-8 rounded-lg shadow-xl relative overflow-hidden font-serif select-none max-w-2xl mx-auto border-double text-center animate-fadeIn">
          {/* Watermark Logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
            <Landmark className="w-96 h-96 text-stone-950" />
          </div>

          <div className="border border-stone-800/40 p-6 self-center relative z-10">
            {/* Agreement Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black tracking-widest uppercase font-serif border-b-2 border-stone-900 pb-2">
                MAZE CREDIT CO.
              </h2>
              <div className="text-[10px] tracking-widest font-sans font-bold text-stone-500 mt-1 uppercase">
                Officieel Certificaat van Autolening
              </div>
            </div>

            {/* Agreement Details */}
            <div className="text-left space-y-4 mb-8 font-sans text-xs text-stone-800 leading-relaxed">
              <p>
                Dit document certificeert dat <strong className="font-bold underline text-stone-950">{applicantName}</strong> hierbij vooraf is goedgekeurd voor financiële lease van het volgende motorvoertuig onder de geldende regionale retail-autowetgeving:
              </p>

              <div className="bg-stone-200/60 p-3 rounded border border-stone-300 grid grid-cols-2 gap-y-2 gap-x-4 font-mono text-[11px] text-stone-900">
                <div>Modelklasse Voertuig:</div>
                <div className="font-bold">{selectedVehicle.realModel || 'Super Import'}</div>

                <div>Naam in de Stad:</div>
                <div className="font-bold">{selectedVehicle.name}</div>

                <div>Getaxeerde Waarde:</div>
                <div className="font-bold">${priceInput.toLocaleString()}</div>

                <div>Voldane Aanbetaling:</div>
                <div className="font-bold text-emerald-800">${downPaymentAmount.toLocaleString()} ({downPaymentPercent}%)</div>

                <div>Terugbetalingsperiode:</div>
                <div className="font-bold">{termWeeks} Weken (Stadstermijn)</div>

                <div>Samengestelde Rente:</div>
                <div className="font-bold text-amber-900">+{totalInterestPercent}% j.r. (APR)</div>

                <div className="pt-2 border-t border-stone-300 font-sans text-[11px] font-bold">REPAYMENT/WEEK:</div>
                <div className="pt-2 border-t border-stone-300 font-black text-xs text-red-800">${weeklyPayment.toLocaleString()} /wk</div>
              </div>

              <p className="text-[10px] text-stone-600 leading-normal italic text-center">
                Ik ga er hiermee akkoord dat het niet op tijd voldoen aan de leasevoorwaarden kan leiden tot inbeslagname van het voertuig, vergrendeling, schorsing van het DMV-kenteken en opname op de krediet-blacklist. Alle betalingen worden per direct automatisch geïnd via Maze ATM of een handmatige storting.
              </p>
            </div>

            {/* Agreement Footer/Signature block */}
            <div className="flex justify-between items-end border-t border-stone-300 pt-6">
              <div className="text-left">
                <div className="font-mono text-[9px] text-stone-500">BEVOEGDE CO-DEALER</div>
                <div className="font-serif italic font-bold text-stone-800 text-sm mt-1">Luna Sterling (Conciërge)</div>
                <div className="w-32 border-b border-stone-800/40 my-1"></div>
                <div className="text-[8px] font-sans text-stone-500 uppercase">FiveM Import Executive Goedkeuring</div>
              </div>

              <div className="text-right">
                <div className="font-mono text-[9px] text-stone-500">HANDTEKENING KLANT</div>
                <div className="font-serif italic text-stone-950 font-bold text-lg mt-1 pr-4" style={{ fontFamily: 'Georgia, serif' }}>
                  {applicantName}
                </div>
                <div className="w-40 border-b border-stone-800/60 my-1"></div>
                <div className="text-[8px] font-sans text-stone-500 uppercase">Bevestiging Leasenemer</div>
              </div>
            </div>

            {/* Action Bar inside certificate */}
            <div className="mt-8 flex justify-center gap-3 no-print">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Druk Leningsovereenkomst Af
              </button>
              <button
                onClick={() => setCertified(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {certified ? (
                  <>
                    <Check className="w-4 h-4" />
                    Overeenkomst Borg Gesteld & Opgeslagen
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Vergrendel Overeenkomst
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
