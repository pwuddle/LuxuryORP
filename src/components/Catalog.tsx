/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, Info, FileText, Check, AlertCircle, X, Gauge, Activity, Radio, Compass } from "lucide-react";
import { Vehicle, PurchaseRequest } from "../types";

interface CatalogProps {
  isDarkMode: boolean;
  vehicles: Vehicle[];
  user: any;
  onSubmitRequest: (request: Omit<PurchaseRequest, "id" | "date" | "status">) => void;
  onStartOAuth: (pane: "klantenpaneel" | "medewerkerpaneel") => void;
}

export default function Catalog({ isDarkMode, vehicles, user, onSubmitRequest, onStartOAuth }: CatalogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Alle");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  // Request forms
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [paymentType, setPaymentType] = useState<"In-game Dollars" | "Financiering">("In-game Dollars");
  const [requestType, setRequestType] = useState<"testrit" | "aankoop">("aankoop");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedVehicle(null);
      }
    };
    if (selectedVehicle) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVehicle]);

  // Filter & Search Vehicles
  const filteredVehicles = vehicles
    .filter((v) => {
      const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            v.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Alle" || v.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const isSoldOutA = !!(a.isSoldOut || a.stock <= 0);
      const isSoldOutB = !!(b.isSoldOut || b.stock <= 0);

      // Rule: Sold-out vehicles are always pushed to the bottom of the catalog
      if (isSoldOutA && !isSoldOutB) return 1;
      if (!isSoldOutA && isSoldOutB) return -1;

      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "speed") {
        const speedA = a.topSpeedTuned || a.topSpeedStock || 0;
        const speedB = b.topSpeedTuned || b.topSpeedStock || 0;
        return speedB - speedA;
      }
      if (sortBy === "brand") return a.brand.localeCompare(b.brand);
      // Default: featured first, then price desc
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.price - a.price;
    });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
  };

  const handleOpenSpec = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setRequestSubmitted(false);
  };

  const handleCloseSpec = () => {
    setSelectedVehicle(null);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedVehicle) return;

    onSubmitRequest({
      vehicleId: selectedVehicle.id,
      vehicleName: selectedVehicle.name,
      buyerDiscordId: user.id,
      buyerName: user.globalName || user.username,
      buyerAvatar: user.avatar,
      paymentType,
    });

    setRequestSubmitted(true);
    setTimeout(() => {
      setSelectedVehicle(null);
    }, 2000);
  };

  // Dark/Light styles
  const textPrimary = isDarkMode ? "text-[#f6f6f7]" : "text-[#060607]";
  const textSecondary = isDarkMode ? "text-[#dcddde]" : "text-[#2e3338]";
  const textMuted = isDarkMode ? "text-[#949ba4]" : "text-[#4f5660]";
  const bgCard = isDarkMode ? "bg-[#2b2d31] border border-white/5 shadow-xl" : "bg-[#f2f3f5] border border-neutral-200/50";
  const bgHeader = isDarkMode ? "bg-[#1e1f22]" : "bg-[#e3e5e8]";
  const borderCard = isDarkMode ? "border-white/5" : "border-[#e3e5e8]";

  const categories = ["Alle", "Super", "Sports", "SUV/Off-Road", "Classic", "Overige"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8" id="catalogus-page">
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#A87E43]/20 pb-4">
        <div>
          <h2 className={`text-2xl font-extrabold ${textPrimary} tracking-tight`}>
            AANBOD <span className="font-serif italic font-light text-[#A87E43]">& CATALOGUS</span>
          </h2>
          <p className={`text-xs ${textMuted} mt-1`}>Onze actuele voorraad van hoogwaardige import-voertuigen.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e9297]" />
          <input
            type="text"
            placeholder="Zoek voertuig of merk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border ${
              isDarkMode 
                ? "bg-[#202225] border-[#2f3136] text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]" 
                : "bg-white border-[#e3e5e8] text-black focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
            } outline-hidden transition-all`}
            id="v-search-input"
          />
        </div>
      </div>

      {/* Categories & Sorting Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Categories Selector */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                selectedCategory === c
                  ? "bg-[#d4af37] text-black"
                  : isDarkMode
                  ? "bg-[#2f3136] text-[#b9bbbe] hover:bg-[#35393e] hover:text-white"
                  : "bg-[#f2f3f5] text-[#2e3338] hover:bg-[#e3e5e8] hover:text-[#060607]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-[#8e9297] shrink-0" />
          <span className={`text-xs select-none ${textMuted}`}>Sorteer op:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`text-xs rounded-md px-3 py-1.5 font-semibold outline-hidden border ${
              isDarkMode 
                ? "bg-[#202225] border-[#2f3136] text-white focus:border-[#d4af37]" 
                : "bg-white border-[#e3e5e8] text-black focus:border-[#d4af37]"
            }`}
            id="sort-select"
          >
            <option value="featured">Aanbevolen</option>
            <option value="price-asc">Prijs: Laag naar Hoog</option>
            <option value="price-desc">Prijs: Hoog naar Laag</option>
            <option value="speed">Topsnelheid</option>
            <option value="brand">Merk (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="v-tiles-grid">
          {filteredVehicles.map((v) => {
            const isSoldOut = v.isSoldOut || v.stock <= 0;
            return (
              <motion.div
                key={v.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className={`rounded-xl overflow-hidden flex flex-col justify-between border ${borderCard} ${bgCard} shadow-md group relative transition-all duration-300 ${
                  isSoldOut 
                    ? "grayscale border-neutral-700/50 opacity-75 blur-[1.2px]" 
                    : "hover:-translate-y-1"
                }`}
              >
                {v.featured && !isSoldOut && (
                  <span className="absolute top-3 left-3 z-10 text-[9px] uppercase font-extrabold tracking-wider bg-[#d4af37] text-black px-2 py-0.5 rounded-sm shadow-sm">
                    Exclusief
                  </span>
                )}
                {isSoldOut && (
                  <span className="absolute top-3 left-3 z-10 text-[9px] uppercase font-extrabold tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-sm shadow-sm">
                    UITVERKOCHT
                  </span>
                )}
                
                {/* Product Image */}
                <div className="relative aspect-video overflow-hidden bg-black/10">
                  <img
                    src={v.image}
                    alt={v.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {!isSoldOut && (
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-[#d4af37] uppercase">{v.brand}</span>
                      <span className={`text-[10px] font-bold uppercase rounded-sm px-1.5 py-0.5 ${
                        !isSoldOut 
                          ? (isDarkMode ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-700")
                          : (isDarkMode ? "bg-red-500/10 text-red-500" : "bg-red-100 text-red-700")
                      }`}>
                        {!isSoldOut ? `${v.stock} op voorraad` : "uitverkocht"}
                      </span>
                    </div>
                    <h3 className={`text-base font-extrabold ${textPrimary} truncate mt-1`}>{v.name}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-[#8e9297] mt-1.5 flex-wrap">
                      <span className="bg-black/15 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">{v.category}</span>
                      <span className="bg-black/15 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                        {v.inzittenden} plekken
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#d4af37]/10 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`text-[10px] ${textMuted} uppercase`}>Catalogusprijs</span>
                      <span className="text-sm font-extrabold text-[#d4af37] font-sans">{formatPrice(v.price)}</span>
                    </div>
                    
                    <button
                      onClick={() => handleOpenSpec(v)}
                      className="px-3.5 py-1.5 bg-[#202225] group-hover:bg-[#d4af37] text-[#dcddde] group-hover:text-black font-extrabold text-xs rounded-md transition-all cursor-pointer flex items-center gap-1.5 border border-[#d4af37]/30 group-hover:border-transparent"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Details
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <AlertCircle className="w-12 h-12 text-[#d4af37] mx-auto opacity-75" />
          <h3 className={`text-lg font-bold ${textPrimary}`}>Geen voertuigen gevonden</h3>
          <p className={`text-xs ${textMuted} max-w-md mx-auto`}>
            We konden geen resultaten vinden die voldeden aan de zoekterm "{searchTerm}" of categorie-filter "{selectedCategory}". Probeer een andere term.
          </p>
        </div>
      )}      {/* Specifications & Request Modal (Read-Only) */}
      <AnimatePresence>
        {selectedVehicle && (
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border ${borderCard} ${
                isDarkMode ? "bg-[#2f3136]" : "bg-white"
              }`}
              id="spec-modal"
            >
              {/* Modal Banner */}
              <div className="relative aspect-video sm:aspect-21/9 bg-black">
                <img
                  src={selectedVehicle.image}
                  alt={selectedVehicle.name}
                  className="w-full h-full object-cover opacity-85"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
                <button
                  onClick={handleCloseSpec}
                  className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 p-2 rounded-full transition-colors cursor-pointer"
                  id="close-spec-modal-btn"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                  <div>
                    <span className="text-xs font-bold text-[#d4af37] uppercase bg-black/50 px-2 py-0.5 rounded-sm">
                      {selectedVehicle.brand}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1 leading-none">{selectedVehicle.name}</h3>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-[#d4af37] font-sans bg-black/70 px-3 py-1 rounded-md border border-[#d4af37]/30">
                    {formatPrice(selectedVehicle.price)}
                  </span>
                </div>
              </div>

              {/* Modal Info Panels */}
              <div className="p-6 space-y-6 leading-relaxed">
                <div className="space-y-2">
                  <h4 className={`text-xs font-bold uppercase ${textMuted} tracking-wider`}>Algemene Informatie</h4>
                  <p className={`text-xs ${textSecondary} leading-relaxed`}>{selectedVehicle.description}</p>
                </div>

                <div className="space-y-4 pt-3 border-t border-[#d4af37]/10">
                  <h4 className={`text-xs font-bold uppercase ${textMuted} tracking-wider`}>Voertuig Prestaties</h4>

                  {/* Progress bars & Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Topsnelheid Stock */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className={`inline-flex items-center gap-1.5 ${textSecondary}`}>
                          <Gauge className="w-3.5 h-3.5 text-amber-500" /> Topsnelheid (Stock)
                        </span>
                        <span className="text-amber-500 font-bold">{selectedVehicle.topSpeedStock} km/h</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/20 overflow-hidden">
                        <div className="bg-amber-600 h-full" style={{ width: `${Math.min(100, (selectedVehicle.topSpeedStock / 380) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Topsnelheid Tuned */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className={`inline-flex items-center gap-1.5 ${textSecondary}`}>
                          <Gauge className="w-3.5 h-3.5 text-[#d4af37]" /> Topsnelheid (Getuned/Fully)
                        </span>
                        <span className="text-[#d4af37] font-bold">{selectedVehicle.topSpeedTuned} km/h</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/20 overflow-hidden">
                        <div className="bg-[#d4af37] h-full" style={{ width: `${Math.min(100, (selectedVehicle.topSpeedTuned / 380) * 100)}%` }} />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Info summary box */}
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-[#202225]" : "bg-[#f2f3f5]"} grid grid-cols-3 gap-4 text-xs`}>
                  <div>
                    <span className={`${textMuted} uppercase text-[9px] block font-bold`}>Categorie</span>
                    <strong className={textPrimary}>{selectedVehicle.category}</strong>
                  </div>
                  <div>
                    <span className={`${textMuted} uppercase text-[9px] block font-bold`}>Inzittenden</span>
                    <strong className={textPrimary}>{selectedVehicle.inzittenden} plekken</strong>
                  </div>
                  <div>
                    <span className={`${textMuted} uppercase text-[9px] block font-bold`}>Voorraad Status</span>
                    <strong className={selectedVehicle.isSoldOut || selectedVehicle.stock <= 0 ? "text-rose-400" : "text-green-400"}>
                      {selectedVehicle.isSoldOut || selectedVehicle.stock <= 0 ? "Uitverkocht" : `${selectedVehicle.stock} stuks`}
                    </strong>
                  </div>
                </div>

                {/* Sub-text reminder stating that orders can only be made by salesperson */}
                <div className="text-[10px] text-center text-amber-500 bg-amber-500/10 border border-amber-500/25 p-2.5 rounded">
                  Let op: Het reserveren, bestellen of aanvragen van testritten kan uitsluitend in-character via een verkoopmedewerker in het Medewerkerpaneel geregistreerd worden.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
