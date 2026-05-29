/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { SafeUser } from "../App";
import { 
  Users, Car, Landmark, ArrowRight, ShieldAlert, CheckCircle, 
  XCircle, Coins, Plus, Minus, FilePlus, Sparkles, TrendingUp, RefreshCw 
} from "lucide-react";
import { INITIAL_SALES } from "../data";
import { SaleRecord, Vehicle, PurchaseRequest } from "../types";

interface EmployeePanelProps {
  isDarkMode: boolean;
  user: SafeUser | null;
  vehicles: Vehicle[];
  requests: PurchaseRequest[];
  sales: SaleRecord[];
  onStartOAuth: (pane: "klantenpaneel" | "medewerkerpaneel") => void;
  onUpdateVehicleStock: (id: string, newStock: number) => void;
  onUpdateVehiclePrice: (id: string, newPrice: number) => void;
  onAddSale: (sale: Omit<SaleRecord, "id" | "date">) => void;
  onUpdateRequestStatus: (id: string, status: "Goedgekeurd" | "Geweigerd") => void;
}

export default function EmployeePanel({
  isDarkMode,
  user,
  vehicles,
  requests,
  sales,
  onStartOAuth,
  onUpdateVehicleStock,
  onUpdateVehiclePrice,
  onAddSale,
  onUpdateRequestStatus,
}: EmployeePanelProps) {
  // Local state for administrative inputs
  const [buyerDiscordId, setBuyerDiscordId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || "");
  const [salePrice, setSalePrice] = useState<number>(vehicles[0]?.price || 0);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // Stats calculation
  const totalRevenue = sales.reduce((sum, item) => sum + item.pricePaid, 0);
  const activeRequestsCount = requests.filter(r => r.status === "In Behandeling").length;
  const totalVehiclesStock = vehicles.reduce((sum, item) => sum + item.stock, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
  };

  const handleVehicleSelectChange = (id: string) => {
    setSelectedVehicleId(id);
    const targetVehicle = vehicles.find(v => v.id === id);
    if (targetVehicle) {
      setSalePrice(targetVehicle.price);
    }
  };

  const handleRegisterSaleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!buyerDiscordId || !buyerName || !selectedVehicleId) return;

    const targetVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!targetVehicle) return;

    if (targetVehicle.stock <= 0) {
      alert("Fout: Dit voertuig is momenteel uitverkocht en kan niet verkocht worden!");
      return;
    }

    // Register sale via handler
    onAddSale({
      buyerDiscordId,
      buyerName,
      vehicleId: selectedVehicleId,
      vehicleName: targetVehicle.name,
      pricePaid: salePrice,
      salesperson: user?.globalName || user?.username || "Perseus Medewerker",
    });

    // Reduce stock by -1
    onUpdateVehicleStock(selectedVehicleId, targetVehicle.stock - 1);

    setSaleSuccessMessage(`Voertuig ${targetVehicle.name} succesvol geregistreerd op naam van @${buyerName}!`);
    
    // Clear form inputs
    setBuyerDiscordId("");
    setBuyerName("");

    setTimeout(() => {
      setSaleSuccessMessage(null);
    }, 4000);
  };

  // Theme colors
  const textPrimary = isDarkMode ? "text-[#f6f6f7]" : "text-[#060607]";
  const textSecondary = isDarkMode ? "text-[#dcddde]" : "text-[#2e3338]";
  const textMuted = isDarkMode ? "text-[#949ba4]" : "text-[#4f5660]";
  const bgCard = isDarkMode ? "bg-[#2b2d31] border border-white/5 shadow-xl" : "bg-[#f2f3f5] border border-neutral-200/50";
  const bgPanel = isDarkMode ? "bg-[#1e1f22]" : "bg-[#e3e5e8]";
  const borderCard = isDarkMode ? "border-white/5" : "border-[#e3e5e8]";

  // Security gate if user is logged out OR does not possess the employee role
  if (!user || user.role !== "Medewerker") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6" id="staff-gate-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-8 rounded-xl ${bgCard} border ${borderCard} shadow-xl space-y-6`}
        >
          {/* Lock icon */}
          <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.9-.65,1.76-1.34,2.58-2a75.52,75.52,0,0,0,72.9,0c.82.71,1.68,1.4,2.58,2a68.47,68.47,0,0,1-10.5,5,77.76,77.76,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,50.77,123.63,28,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h3 className={`text-xl font-extrabold ${textPrimary} tracking-tight`}>
              Medewerkerpaneel Beveiliging
            </h3>
            <p className={`text-xs ${textMuted} max-w-sm mx-auto`}>
              Dit paneel is uitsluitend toegankelijk voor geautoriseerde Perseus verkoopmedewerkers en beheerders.
            </p>
          </div>

          {user && user.role !== "Medewerker" && (
            <div className="p-3.5 bg-red-500/10 rounded-md border border-red-500/20 text-xs text-red-400 font-medium max-w-sm mx-auto">
              Je bent ingelogd als <strong>@{user.username}</strong>, maar bezit niet de rol <strong className="uppercase">Medewerker</strong> in onze Discord server.
            </div>
          )}

          <div className="p-4 bg-[#A87E43]/10 rounded-lg flex items-start gap-3 border border-[#A87E43]/30 text-left">
            <ShieldAlert className="w-5 h-5 text-[#A87E43] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-[#A87E43] block">Gekoesterde Beveiligingslaag</span>
              <p className={`text-[10px] ${textSecondary} mt-0.5 leading-relaxed`}>
                Discord verificatie en in-game synchronisatie sluiten fraude uit door uw live server-rollen te scannen.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onStartOAuth("medewerkerpaneel")}
              className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center gap-2 mx-auto cursor-pointer"
              id="staff-request-oauth-btn"
            >
              Inloggen als Medewerker
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Staff View Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8" id="staff-panel-active">
      {/* Staff Greetings bar */}
      <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} flex flex-col sm:flex-row items-center justify-between gap-6`}>
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
          <div className="relative">
            <img
              src={user.avatar || ""}
              alt="Medewerker Avatar"
              className="w-14 h-14 rounded-full border-2 border-[#A87E43] object-cover bg-neutral-900"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 border-2 border-[#2f3136] rounded-full" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${textPrimary}`}>Welkom, {user.globalName || user.username}</h2>
            <p className={`text-xs text-purple-400 font-semibold uppercase tracking-wider mt-0.5`}>
              Rol: {user.discordRoleName || "Medewerker"}
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right">
          <p className={`text-[10px] ${textMuted}`}>Sessie Type: In-memory • Logout-on-refresh</p>
          <span className="text-xs font-bold text-[#A87E43] flex items-center gap-1 justify-center sm:justify-end mt-1">
            <Sparkles className="w-3.5 h-3.5" /> Showroom Beheerdersrechten
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="metrics-panel-row">
        {/* Metric 1 */}
        <div className={`p-5 rounded-xl ${bgCard} border ${borderCard} shadow-md flex items-center justify-between`}>
          <div>
            <span className={`text-[10px] ${textMuted} uppercase block`}>Totale Omzet</span>
            <strong className={`text-lg font-black ${textPrimary} font-sans`}>{formatPrice(totalRevenue)}</strong>
          </div>
          <div className="w-10 h-10 bg-[#A87E43]/15 text-[#A87E43] rounded-lg flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className={`p-5 rounded-xl ${bgCard} border ${borderCard} shadow-md flex items-center justify-between`}>
          <div>
            <span className={`text-[10px] ${textMuted} uppercase block`}>Aantal Verkopen</span>
            <strong className={`text-lg font-black ${textPrimary}`}>{sales.length} geregistreerd</strong>
          </div>
          <div className="w-10 h-10 bg-green-500/10 text-green-400 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className={`p-5 rounded-xl ${bgCard} border ${borderCard} shadow-md flex items-center justify-between`}>
          <div>
            <span className={`text-[10px] ${textMuted} uppercase block`}>Lopende Offertes</span>
            <strong className={`text-lg font-black ${activeRequestsCount > 0 ? "text-yellow-500" : textPrimary}`}>
              {activeRequestsCount} Verzoek{activeRequestsCount !== 1 ? "en" : ""}
            </strong>
          </div>
          <div className="w-10 h-10 bg-yellow-500/10 text-yellow-400 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className={`p-5 rounded-xl ${bgCard} border ${borderCard} shadow-md flex items-center justify-between`}>
          <div>
            <span className={`text-[10px] ${textMuted} uppercase block`}>Totale Voorraad</span>
            <strong className={`text-lg font-black ${textPrimary}`}>{totalVehiclesStock} Voertuigen</strong>
          </div>
          <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Row splits of Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Sales Logger & Approvals */}
        <div className="lg:col-span-6 space-y-8">
          
          {/* Register Sale Logger Form */}
          <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} shadow-md space-y-4`}>
            <h3 className={`text-base font-extrabold ${textPrimary} flex items-center gap-2 border-b border-[#A87E43]/15 pb-3`}>
              <FilePlus className="w-5 h-5 text-[#A87E43]" />
              Verkoop Registreren
            </h3>

            {saleSuccessMessage && (
              <div className="p-3 bg-green-500/15 border border-green-500/30 rounded text-xs text-green-400 leading-relaxed font-semibold">
                {saleSuccessMessage}
              </div>
            )}

            <form onSubmit={handleRegisterSaleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-bold uppercase ${textMuted} mb-1`}>Koper Discord ID</label>
                  <input
                    type="text"
                    required
                    placeholder="bijv. 1234567890..."
                    value={buyerDiscordId}
                    onChange={(e) => setBuyerDiscordId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:border-[#A87E43] focus:ring-1 focus:ring-[#A87E43] outline-hidden ${
                      isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde]" : "bg-white border-[#e3e5e8]"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase ${textMuted} mb-1`}>In-Game Naam Koper</label>
                  <input
                    type="text"
                    required
                    placeholder="bijv. Davey Santos"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:border-[#A87E43] focus:ring-1 focus:ring-[#A87E43] outline-hidden ${
                      isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde]" : "bg-white border-[#e3e5e8]"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-bold uppercase ${textMuted} mb-1`}>Selecteer Voertuig</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => handleVehicleSelectChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded focus:border-[#A87E43] focus:ring-1 focus:ring-[#A87E43] outline-hidden ${
                      isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde]" : "bg-white border-[#e3e5e8]"
                    }`}
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                        {v.brand} {v.name} ({v.stock} in stock)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase ${textMuted} mb-1`}>Afgesproken Prijs ($)</label>
                  <input
                    type="number"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded focus:border-[#A87E43] focus:ring-1 focus:ring-[#A87E43] outline-hidden ${
                      isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde]" : "bg-white border-[#e3e5e8]"
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#A87E43] hover:bg-[#926b34] text-black text-xs font-bold rounded-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-md mt-2"
                id="staff-log-sale-btn"
              >
                Transactie & Verkoop Registreren
              </button>
            </form>
          </div>

          {/* Active Client requests reviewer */}
          <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} shadow-md space-y-4`}>
            <h3 className={`text-base font-extrabold ${textPrimary} flex items-center gap-2 border-b border-[#A87E43]/15 pb-3`}>
              <Users className="w-5 h-5 text-[#A87E43]" />
              Offerte & Testrit Aanvragen
            </h3>

            {requests.length > 0 ? (
              <div className="space-y-3" id="live-requests-reviewer">
                {requests.map((req) => (
                  <div key={req.id} className={`p-4 rounded-lg bg-black/15 flex flex-col sm:flex-row overflow-hidden justify-between items-start sm:items-center gap-4 border-l-2 ${
                    req.status === "Goedgekeurd" 
                      ? "border-green-500" 
                      : req.status === "Geweigerd" 
                      ? "border-red-500" 
                      : "border-yellow-500 animate-pulse-slow"
                  }`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <img 
                          src={req.buyerAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150"} 
                          alt="Buyer img" 
                          className="w-6 h-6 rounded-full object-cover border border-[#A87E43]/30 bg-neutral-900"
                        />
                        <span className={`text-[10px] font-bold ${textPrimary}`}>@{req.buyerName}</span>
                        <span className="text-[9px] text-[#8e9297]">• {req.date}</span>
                      </div>
                      <h4 className={`text-xs font-bold text-white`}>{req.vehicleName}</h4>
                      <p className="text-[10px] text-yellow-500 font-semibold mt-0.5">Betaling via: {req.paymentType}</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {req.status === "In Behandeling" ? (
                        <>
                          <button
                            onClick={() => onUpdateRequestStatus(req.id, "Goedgekeurd")}
                            className="px-2.5 py-1.5 bg-green-500/25 hover:bg-green-500/40 text-green-400 rounded text-[9px] uppercase font-black transition-colors cursor-pointer flex items-center gap-1"
                            id={`approve-req-btn-${req.id}`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Goedkeuren
                          </button>
                          <button
                            onClick={() => onUpdateRequestStatus(req.id, "Geweigerd")}
                            className="px-2.5 py-1.5 bg-red-500/25 hover:bg-red-500/40 text-red-00 rounded text-[9px] text-red-400 uppercase font-black transition-colors cursor-pointer flex items-center gap-1"
                            id={`decline-req-btn-${req.id}`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Weigeren
                          </button>
                        </>
                      ) : (
                        <span className={`text-[9px] uppercase font-extrabold px-2 py-1 rounded bg-black/35 ${
                          req.status === "Goedgekeurd" ? "text-green-400" : "text-red-400"
                        }`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-[#8e9297] mx-auto opacity-40 mb-2" />
                <p className={`text-xs ${textMuted}`}>Er zijn momenteel geen actieve offertes om te behandelen.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Manage Stock & Prices */}
        <div className="lg:col-span-6 space-y-8">
          
          {/* Inventory Fleet Controller */}
          <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} shadow-md space-y-4`}>
            <div className="flex items-center justify-between border-b border-[#A87E43]/15 pb-3">
              <h3 className={`text-base font-extrabold ${textPrimary} flex items-center gap-2`}>
                <Car className="w-5 h-5 text-[#A87E43]" />
                Catalogus & Stock Beheer
              </h3>
              <span className={`text-xs ${textMuted}`}>Direct bewerken</span>
            </div>

            <p className={`text-[10px] ${textMuted}`}>
              Beheer live voorraadcijfers of stel nieuwe prijscatalogi in. Updates vloeien direct door naar de klantenzijde.
            </p>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1" id="stock-manager-fleet">
              {vehicles.map((v) => (
                <div key={v.id} className={`p-4 rounded-lg bg-black/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-transparent hover:border-[#A87E43]/20 transition-all`}>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-[#A87E43]">{v.brand}</span>
                    <h4 className={`text-xs font-extrabold text-white truncate max-w-[200px]`}>{v.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-[#8e9297]">
                      <span>Categorie: {v.category}</span>
                      <span>•</span>
                      <span>Price: {formatPrice(v.price)}</span>
                    </div>
                  </div>

                  {/* Stock modifier controls */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5 bg-black/35 rounded-md px-1 py-0.5">
                      <button
                        onClick={() => onUpdateVehicleStock(v.id, Math.max(0, v.stock - 1))}
                        disabled={v.stock <= 0}
                        className="p-1 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-inherit cursor-pointer"
                        id={`minus-stock-btn-${v.id}`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-white min-w-[24px] text-center select-none">
                        {v.stock}
                      </span>
                      <button
                        onClick={() => onUpdateVehicleStock(v.id, v.stock + 1)}
                        className="p-1 hover:text-white transition-colors cursor-pointer"
                        id={`plus-stock-btn-${v.id}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Fast pricing override dialog trigger */}
                    <button
                      onClick={() => {
                        const newPrice = Number(prompt(`Nieuwe prijs invoeren voor ${v.name}:`, String(v.price)));
                        if (newPrice && !isNaN(newPrice)) {
                          onUpdateVehiclePrice(v.id, newPrice);
                        }
                      }}
                      className="px-2 py-1.5 bg-[#A87E43]/15 hover:bg-[#A87E43] text-[#A87E43] hover:text-black font-extrabold text-[9px] uppercase rounded-md transition-all cursor-pointer"
                    >
                      Prijs Aanpassen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent registered sales history log */}
          <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} shadow-md space-y-4`}>
            <h3 className={`text-sm font-extrabold ${textPrimary} border-b border-[#A87E43]/15 pb-2`}>
              Recente Transacties (Geschiedenis)
            </h3>

            <div className="space-y-3">
              {sales.map((item) => (
                <div key={item.id} className="p-3 bg-black/10 rounded flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-white block">{item.vehicleName}</strong>
                    <span className={`text-[10px] ${textMuted}`}>Koper: @{item.buyerName} ({item.buyerDiscordId})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#A87E43] block font-sans">{formatPrice(item.pricePaid)}</span>
                    <span className={`text-[9px] ${textMuted}`}>Door: {item.salesperson}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
