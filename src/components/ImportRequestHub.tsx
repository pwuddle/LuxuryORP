import React, { useState, useEffect } from 'react';
import { ImportRequest } from '../types';
import { Ship, Anchor, PackageCheck, Layers, ClipboardList, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function ImportRequestHub() {
  const [requests, setRequests] = useState<ImportRequest[]>([]);
  const [spawnCode, setSpawnCode] = useState('');
  const [gtaName, setGtaName] = useState('');
  const [vehicleType, setVehicleType] = useState('Super');
  const [sourceUrl, setSourceUrl] = useState('');
  const [maxBudget, setMaxBudget] = useState<number>(350000);
  const [engineMod, setEngineMod] = useState<'Stage 1' | 'Stage 2' | 'Stage 3' | 'Drift Spec' | 'None'>('None');
  const [cosmeticMod, setCosmeticMod] = useState<'Standard' | 'Full Widebody' | 'Carbon Details' | 'None'>('None');
  const [customPlate, setCustomPlate] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState<ImportRequest | null>(null);

  // Load existing requests from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('veloce_import_requests');
    if (saved) {
      try {
        setRequests(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing import requests', e);
      }
    } else {
      // Default placeholder initial request to feel realistic
      const defaultReq: ImportRequest = {
        id: 'IMP-4091',
        spawnCode: 'rx7fd',
        gtaName: 'Mazda RX7 Veilside Import',
        vehicleType: 'JDM & Tuners',
        sourceUrl: 'https://gta5-mods.com/vehicles/mazda-rx7-veilside-fortune',
        maxBudget: 280000,
        engineModPackage: 'Stage 3',
        cosmeticModPackage: 'Full Widebody',
        customPlate: 'TOKYO_DRIFT',
        specialInstructions: 'Pas de luide roterende backfire uitlaat aan en installeer een driftstuurinrichting.',
        status: 'Shipped to Port',
        etaDays: 2
      };
      setRequests([defaultReq]);
      localStorage.setItem('veloce_import_requests', JSON.stringify([defaultReq]));
    }
  }, []);

  // Save requests helper
  const saveRequests = (updated: ImportRequest[]) => {
    setRequests(updated);
    localStorage.setItem('veloce_import_requests', JSON.stringify(updated));
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spawnCode || !gtaName) return;

    const newRequest: ImportRequest = {
      id: `IMP-${Math.floor(1000 + Math.random() * 9000)}`,
      spawnCode: spawnCode.toLowerCase().trim(),
      gtaName: gtaName.trim(),
      vehicleType,
      sourceUrl: sourceUrl.trim() || undefined,
      maxBudget,
      engineModPackage: engineMod,
      cosmeticModPackage: cosmeticMod,
      customPlate: customPlate.toUpperCase().trim() || 'IMPORT',
      specialInstructions: specialInstructions.trim(),
      status: 'Received',
      etaDays: Math.floor(3 + Math.random() * 5) // 3-8 days
    };

    const updated = [newRequest, ...requests];
    saveRequests(updated);
    setSelectedRequest(newRequest);

    // Reset Form
    setSpawnCode('');
    setGtaName('');
    setSourceUrl('');
    setCustomPlate('');
    setSpecialInstructions('');
    setEngineMod('None');
    setCosmeticMod('None');
  };

  const getStatusProgress = (status: ImportRequest['status']) => {
    switch (status) {
      case 'Received': return 25;
      case 'In Progress': return 50;
      case 'Shipped to Port': return 75;
      case 'Ready for Pickup': return 100;
      default: return 0;
    }
  };

  const translateStatus = (status: ImportRequest['status']) => {
    switch (status) {
      case 'Received': return 'Ontvangen';
      case 'In Progress': return 'In Behandeling';
      case 'Shipped to Port': return 'Onderweg naar Haven';
      case 'Ready for Pickup': return 'Klaar voor Afhalen';
      default: return status;
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl text-left bg-gradient-to-b from-neutral-900 to-neutral-950">
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 mb-6">
        <div className="p-2.5 bg-neutral-950 rounded-lg text-amber-500 border border-neutral-800">
          <Ship className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
            Veloce Luxe Import & Douanedok
          </h2>
          <p className="text-xs text-neutral-400">
            Bestel specifieke in-game voertuigen, modificaties of unieke modellen. Wij beheren de importlicenties, douane-inklaringen en aflevertuning.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Grid: The Order Form */}
        <form onSubmit={handleCreateRequest} className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-neutral-850 pb-2">
            <ClipboardList className="w-4 h-4 text-amber-500" />
            Speciaal Import-Aanvraagformulier
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                Spawn-code / ID (Cruciaal)
              </label>
              <input
                type="text"
                required
                placeholder="bijv. gtr35, sf90"
                value={spawnCode}
                onChange={(e) => setSpawnCode(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-100 font-mono tracking-wider"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                Volledige Naam van het Model
              </label>
              <input
                type="text"
                required
                placeholder="bijv. Nissan GTR R35 Nismo"
                value={gtaName}
                onChange={(e) => setGtaName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                Voertuigklasse / Categorie
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-200 font-medium cursor-pointer"
              >
                <option value="Hyper">Hyper Premium</option>
                <option value="Super">Supercar Klasse</option>
                <option value="JDM & Tuners">JDM of Street Tuner</option>
                <option value="SUV">Luxe SUV / Truck</option>
                <option value="Classic">Retro/Muscle Klassieker</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                Gepersonaliseerd Kenteken (Max. 8 tekens)
              </label>
              <input
                type="text"
                maxLength={8}
                placeholder="bijv. FAST RIDE"
                value={customPlate}
                onChange={(e) => setCustomPlate(e.target.value.toUpperCase())}
                className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-100 font-mono uppercase tracking-widest"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
              Modificatie-link / Bron-URL (Optioneel)
            </label>
            <input
              type="text"
              placeholder="bijv. gta5-mods.com/vehicles/..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-neutral-400 font-mono"
            />
          </div>

          <div className="border-t border-dashed border-neutral-850 my-2 pt-2"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
                Mechanische Prestatie-upgrades
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['None', 'Stage 2', 'Stage 3'] as const).map(pkg => (
                  <button
                    key={pkg}
                    type="button"
                    onClick={() => setEngineMod(pkg)}
                    className={`text-xs py-2 px-1 rounded-md border font-semibold transition-all ${
                      engineMod === pkg
                        ? 'bg-amber-500 border-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {pkg === 'None' ? 'Geen' : pkg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
                Cosmetische Aanpassingen
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['None', 'Full Widebody', 'Carbon Details'] as const).map(pkg => (
                  <button
                    key={pkg}
                    type="button"
                    onClick={() => setCosmeticMod(pkg)}
                    className={`text-xs py-2 px-1 rounded-md border font-semibold transition-all ${
                      cosmeticMod === pkg
                        ? 'bg-amber-500 border-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {pkg === 'Full Widebody' ? 'Widebody' : pkg === 'Carbon Details' ? 'Carbon' : 'Standaard'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                Maximaal Allocatiebudget ($)
              </label>
              <input
                type="number"
                min="50000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Math.max(50000, parseInt(e.target.value) || 0))}
                className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
              >
                Verstuur Luxe Importaanvraag
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
              Speciale Instructies voor Havenmonteurs
            </label>
            <textarea
              rows={2}
              placeholder="bijv. Underglow moet limoengroen zijn, ophanging uiterst laag afgesteld..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-100 resize-none"
            />
          </div>
        </form>

        {/* Right Grid: Live Track Orders & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-850 pb-2">
            <Anchor className="w-4 h-4 text-emerald-500 animate-bounce-subtle" />
            LIVE VOLG-SYSTEEM IMPORTCONTAINERS
          </h3>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-lg text-center">
                <p className="text-xs text-neutral-500 italic">Geen actieve importopdrachten in voortgang.</p>
              </div>
            ) : (
              requests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`w-full text-left p-4 rounded-lg border transition-all flex justify-between items-start ${
                    selectedRequest?.id === req.id
                      ? 'bg-neutral-800 border-amber-500 text-slate-100'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-750 text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 rounded text-amber-500">
                        {req.id}
                      </span>
                      <span className="text-[11px] font-semibold text-neutral-400 font-mono">
                        /{req.spawnCode}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 truncate max-w-[180px]">
                      {req.gtaName}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500/80" />
                      <span>Verwacht: {req.etaDays} Cargo-reizen</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-emerald-400 block">
                      ${req.maxBudget.toLocaleString()}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase mt-2.5 inline-block ${
                      req.status === 'Received' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      req.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      req.status === 'Shipped to Port' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {translateStatus(req.status)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Detailed Progress view for selected request */}
          {selectedRequest && (
            <div className="bg-neutral-950 p-5 rounded-lg border border-neutral-800 space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-neutral-850 pb-2.5">
                <span className="text-xs text-neutral-400 font-mono">STATUS TIJDLIJN — {selectedRequest.id}</span>
                <span className="text-xs font-bold text-amber-500">Voortgang: {getStatusProgress(selectedRequest.status)}%</span>
              </div>

              {/* Graphical Progress Bar */}
              <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-1000"
                  style={{ width: `${getStatusProgress(selectedRequest.status)}%` }}
                ></div>
              </div>

              {/* Timeline checkpoints */}
              <div className="space-y-3.5 relative pl-4 border-l border-neutral-800">
                {/* 1. Received */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full border ${
                    getStatusProgress(selectedRequest.status) >= 25
                      ? 'bg-amber-500 border-neutral-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-neutral-900 border-neutral-700'
                  }`}></div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-200">1. Speciale Bestelling Geregistreerd</div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Douane-agenten hebben de GTA-spawn-codes, specificaties en bronbestanden geverifieerd.</p>
                  </div>
                </div>

                {/* 2. In Progress */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full border ${
                    getStatusProgress(selectedRequest.status) >= 50
                      ? 'bg-amber-500 border-neutral-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-neutral-900 border-neutral-700'
                  }`}></div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-200">2. Haven-engineering & Tuning</div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Lopende montage van prestatie-upgrades ({selectedRequest.engineModPackage === 'None' ? 'Geen' : selectedRequest.engineModPackage}) en optionele cosmetica.</p>
                  </div>
                </div>

                {/* 3. Shipped to Port */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full border ${
                    getStatusProgress(selectedRequest.status) >= 75
                      ? 'bg-amber-500 border-neutral-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-neutral-900 border-neutral-700'
                  }`}></div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-200">3. Transport per Vrachtschip</div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Vrachtschip is vertrokken uit de overzeese haven en vaart momenteel de territoriale wateren van Los Santos binnen.</p>
                  </div>
                </div>

                {/* 4. Ready for Pickup */}
                <div className="relative">
                  <div className={`absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full border ${
                    getStatusProgress(selectedRequest.status) >= 100
                      ? 'bg-emerald-500 border-neutral-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : 'bg-neutral-900 border-neutral-700'
                  }`}></div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-200">4. Vrijgegeven door Douane & Klaar</div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Voertuig is volledig ingeklaard en voorzien van kentekenplaat {selectedRequest.customPlate}. Neem contact op met Luna Sterling voor de sleuteloverdracht.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
