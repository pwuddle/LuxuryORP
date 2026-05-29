/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { SafeUser } from "../App";
import { 
  Car, FileText, Landmark, Clock, CheckCircle, HelpCircle, 
  ArrowRight, ShieldAlert, BadgeInfo, CreditCard, Send, Sparkles 
} from "lucide-react";
import { INITIAL_USER_VEHICLES, INITIAL_INVOICES } from "../data";
import { Invoice, PurchaseRequest } from "../types";

interface ClientPanelProps {
  isDarkMode: boolean;
  user: SafeUser | null;
  requests: PurchaseRequest[];
  onStartOAuth: (pane: "klantenpaneel" | "medewerkerpaneel") => void;
}

export default function ClientPanel({ isDarkMode, user, requests, onStartOAuth }: ClientPanelProps) {
  // Local state for client data
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [userVehicles, setUserVehicles] = useState(INITIAL_USER_VEHICLES);
  const [supportMessage, setSupportMessage] = useState("");
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);

  // Filter requests submitted by this client
  const clientRequests = requests.filter(
    (r) => r.buyerDiscordId === (user?.id || "")
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
  };

  const handlePayInvoice = (invoiceId: string) => {
    setInvoices(prev => 
      prev.map(inv => inv.id === invoiceId ? { ...inv, status: "Betaald" } : inv)
    );
  };

  const handleCreateTicket = (e: FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setTicketStatus("Je supportticket is aangemaakt! Onze medewerkers reageren zo snel mogelijk in de Discord guild.");
    setSupportMessage("");
    setTimeout(() => {
      setTicketStatus(null);
    }, 5000);
  };

  // Styling helpers
  const textPrimary = isDarkMode ? "text-[#f6f6f7]" : "text-[#060607]";
  const textSecondary = isDarkMode ? "text-[#dcddde]" : "text-[#2e3338]";
  const textMuted = isDarkMode ? "text-[#949ba4]" : "text-[#4f5660]";
  const bgCard = isDarkMode ? "bg-[#2b2d31] border border-white/5 shadow-xl" : "bg-[#f2f3f5] border border-neutral-200/50";
  const bgPanel = isDarkMode ? "bg-[#1e1f22]" : "bg-[#e3e5e8]";
  const borderCard = isDarkMode ? "border-white/5" : "border-[#e3e5e8]";

  // Login Gate (if user is logged out or doesn't have the appropriate client role)
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6" id="client-login-gate">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-8 rounded-xl ${bgCard} border ${borderCard} shadow-xl space-y-6`}
        >
          <div className="w-16 h-16 bg-[#5865F2]/10 text-[#5865F2] rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.9-.65,1.76-1.34,2.58-2a75.52,75.52,0,0,0,72.9,0c.82.71,1.68,1.4,2.58,2a68.47,68.47,0,0,1-10.5,5,77.76,77.76,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,50.77,123.63,28,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h3 className={`text-xl font-extrabold ${textPrimary} tracking-tight`}>
              Klantenpaneel Beveiliging
            </h3>
            <p className={`text-xs ${textMuted} max-w-md mx-auto`}>
              Om uw aankopen, garagemodelen, facturen en offertes te bekijken dient u in te loggen via uw Discord account.
            </p>
          </div>

          <div className="p-4 bg-[#A87E43]/10 rounded-lg flex items-start gap-3 border border-[#A87E43]/30 text-left">
            <ShieldAlert className="w-5 h-5 text-[#A87E43] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-[#A87E43] block">Rol Controle vereist</span>
              <p className={`text-[10px] ${textSecondary} mt-0.5 leading-relaxed`}>
                Onze Discord-bot verifieert automatisch of u lid bent van de server én beschikt over de juiste <strong className="text-[#A87E43]">Klant</strong> rol-identiteit.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onStartOAuth("klantenpaneel")}
              className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center gap-2 mx-auto cursor-pointer"
              id="request-discord-oauth-btn"
            >
              Inloggen met Discord
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active Client View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8" id="client-panel-active">
      {/* Client Profile Header */}
      <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} flex flex-col md:flex-row items-center justify-between gap-6`}>
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="relative">
            <img
              src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150"}
              alt="Discord Avatar"
              className="w-16 h-16 rounded-full border-2 border-[#A87E43] shadow-md object-cover bg-neutral-900"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-green-500 border-2 border-[#2f3136] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h2 className={`text-xl font-bold ${textPrimary}`}>{user.globalName || user.username}</h2>
              <span className="text-xs text-[#A87E43] font-semibold bg-[#A87E43]/10 px-2 py-0.5 rounded uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <p className={`text-xs ${textMuted} mt-0.5`}>Gekoppeld account: @{user.username} ({user.id})</p>
          </div>
        </div>

        {/* Dynamic Greeting */}
        <div className="text-center md:text-right space-y-1">
          <span className="text-xs font-semibold text-[#A87E43] flex items-center gap-1 justify-center md:justify-end">
            <Sparkles className="w-3.5 h-3.5" /> Perseus VIP Toegang
          </span>
          <p className={`text-[11px] ${textMuted}`}>Lidmaatschap status: Actief • Live Beveiligd</p>
        </div>
      </div>

      {/* Grid: Columns of Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Garage & Invoices */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Garage Vehicles List */}
          <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} shadow-md space-y-4`}>
            <div className="flex items-center justify-between border-b border-[#A87E43]/15 pb-3">
              <h3 className={`text-base font-extrabold ${textPrimary} flex items-center gap-2`}>
                <Car className="w-5 h-5 text-[#A87E43]" />
                Mijn Geregistreerde Voertuigen
              </h3>
              <span className={`text-xs ${textMuted} bg-[#2b2d31] px-2 py-0.5 rounded`}>
                {userVehicles.length} Voertuigen
              </span>
            </div>

            {userVehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userVehicles.map((v) => (
                  <div key={v.id} className={`p-4 rounded-lg ${bgPanel} flex flex-col justify-between space-y-3 relative overflow-hidden border-t-2 border-[#A87E43]/60`}>
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-black ${textPrimary}`}>{v.vehicleName}</h4>
                        <span className="text-[10px] font-mono tracking-wider font-bold bg-black/35 text-[#A87E43] px-1.5 py-0.5 rounded">
                          {v.plate}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-[#8e9297] mt-3">
                        <div>
                          <span>Aankoopdatum:</span>
                          <strong className={`block ${textSecondary} mt-0.5`}>{v.purchaseDate}</strong>
                        </div>
                        <div>
                          <span>Volgende Beurt:</span>
                          <strong className={`block ${textSecondary} mt-0.5`}>{v.nextService}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-black/10 text-[10px]">
                      <span className={`inline-flex items-center gap-1 ${
                        v.maintenanceStatus === "Uitstekend" ? "text-green-400" : "text-[#A87E43]"
                      }`}>
                        <CheckCircle className="w-3.5 h-3.5" /> {v.maintenanceStatus}
                      </span>
                      <span className={`${textMuted}`}>{v.insurance}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Car className="w-10 h-10 text-[#8e9297] mx-auto opacity-40 mb-2" />
                <p className={`text-xs ${textMuted}`}>U bezit momenteel geen geregistreerde Perseus-voertuigen.</p>
              </div>
            )}
          </div>

          {/* Invoice section */}
          <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} shadow-md space-y-4`}>
            <h3 className={`text-base font-extrabold ${textPrimary} flex items-center gap-2 border-b border-[#A87E43]/15 pb-3`}>
              <Landmark className="w-5 h-5 text-[#A87E43]" />
              Mijn Facturen
            </h3>

            <div className="space-y-3" id="client-invoice-logs">
              {invoices.map((inv) => (
                <div key={inv.id} className={`p-4 rounded-lg ${bgPanel} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#A87E43] uppercase bg-[#A87E43]/10 px-2 py-0.5 rounded">
                        {inv.invoiceNumber}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        inv.status === "Betaald" 
                          ? "bg-green-500/10 text-green-400" 
                          : "bg-red-500/10 text-red-400 animate-pulse"
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <h4 className={`text-xs font-bold ${textPrimary}`}>{inv.vehicleName}</h4>
                    <p className={`text-[10px] ${textMuted}`}>Facturatiedatum: {inv.date}</p>
                  </div>

                  <div className="flex items-center gap-4 justify-between w-full sm:w-auto">
                    <span className="text-xs font-extrabold text-[#A87E43] font-sans">{formatPrice(inv.amount)}</span>
                    {inv.status === "Openstaand" && (
                      <button
                        onClick={() => handlePayInvoice(inv.id)}
                        className="px-3 py-1.5 bg-[#43b581] hover:bg-[#3ca374] text-white font-extrabold text-[10px] uppercase rounded-md shadow-sm transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <CreditCard className="w-3 h-3" />
                        Betaal
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quotes & Actions / Support */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* My requests list */}
          <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} shadow-md space-y-4`}>
            <h3 className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2 border-b border-[#A87E43]/15 pb-3`}>
              <Clock className="w-5 h-5 text-[#A87E43]" />
              Actieve Offertes & Aanvragen
            </h3>

            {clientRequests.length > 0 ? (
              <div className="space-y-3">
                {clientRequests.map((req) => (
                  <div key={req.id} className={`p-3.5 rounded-lg ${bgPanel} space-y-2 border-l-2 ${
                    req.status === "Goedgekeurd" 
                      ? "border-green-500" 
                      : req.status === "Geweigerd" 
                      ? "border-red-500" 
                      : "border-yellow-500"
                  }`}>
                    <div className="flex justify-between items-start">
                      <h4 className={`text-[11px] font-bold ${textPrimary} truncate max-w-[150px]`}>{req.vehicleName}</h4>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        req.status === "Goedgekeurd"
                          ? "bg-green-500/10 text-green-400"
                          : req.status === "Geweigerd"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-[#8e9297] pt-1">
                      <span>Status: {req.status === "In Behandeling" ? "In Behandeling" : req.status}</span>
                      <span>{req.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-[#8e9297] mx-auto opacity-40 mb-2" />
                <p className={`text-[11px] ${textMuted}`}>Geen lopende offertes of testritten geregistreerd.</p>
              </div>
            )}
          </div>

          {/* Support Ticket Panel */}
          <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} shadow-md space-y-4`}>
            <h3 className={`text-sm font-extrabold ${textPrimary} flex items-center gap-2 border-b border-[#A87E43]/15 pb-3`}>
              <HelpCircle className="w-5 h-5 text-[#A87E43]" />
              Support & Vragen
            </h3>

            <p className={`text-[11px] ${textMuted} leading-relaxed`}>
              Vragen over uw facturatie of garagedossier? Dien direct een ticket in; onze medewerkers nemen contact met u op via Discord DM.
            </p>

            {ticketStatus && (
              <div className="p-3 bg-green-500/15 border border-green-500/30 rounded text-[10px] text-green-400 leading-relaxed">
                {ticketStatus}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                rows={3}
                placeholder="Schrijf hier je vraag of opmerking..."
                className={`w-full p-2.5 text-xs rounded border focus:border-[#A87E43] focus:ring-1 focus:ring-[#A87E43] outline-hidden ${
                  isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde]" : "bg-white border-[#e3e5e8] text-black"
                }`}
                id="ticket-textarea"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#A87E43] hover:bg-[#926b34] text-black text-xs font-bold rounded-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1 cursor-pointer shadow-md"
                id="submit-ticket-btn"
              >
                <Send className="w-3 h-3" />
                Ticket Aanmaken
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
