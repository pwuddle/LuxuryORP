/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Sparkles, Check, AlertTriangle, ShieldCheck, UserCheck, EyeOff } from "lucide-react";
import { useEffect } from "react";
import { SIMULATED_USERS } from "../data";
import { DiscordUser } from "../types";

interface OAuthSimulatorModalProps {
  onClose: () => void;
  onSuccess: (user: DiscordUser) => void;
  requestedPanel: "klantenpaneel" | "medewerkerpaneel";
}

export default function OAuthSimulatorModal({ onClose, onSuccess, requestedPanel }: OAuthSimulatorModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSimulate = (userType: "klant" | "medewerker" | "manager" | "eigenaar" | "coordinator" | "invalid") => {
    const selectedUser = SIMULATED_USERS[userType];
    onSuccess(selectedUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-[#2f3136] rounded-lg overflow-hidden shadow-2xl text-[#dcddde] border border-[#202225]"
        id="discord-oauth-simulator"
      >
        {/* Discord Simulation Header */}
        <div className="bg-[#202225] p-5 flex items-center justify-between border-b border-[#2f3136] select-none">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-[#5865F2]"
              fill="currentColor"
              viewBox="0 0 127.14 96.36"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.9-.65,1.76-1.34,2.58-2a75.52,75.52,0,0,0,72.9,0c.82.71,1.68,1.4,2.58,2a68.47,68.47,0,0,1-10.5,5,77.76,77.76,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,50.77,123.63,28,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
            </svg>
            <div>
              <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
                Discord <span className="text-[#5865f2] text-xs font-semibold uppercase bg-[#5865f2]/10 px-1.5 py-0.5 rounded">OAuth2 Simulator</span>
              </h3>
              <p className="text-xs text-[#8e9297]">Perseus Dealership autorisatie-aanvraag</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8e9297] hover:text-white transition-colors text-xs bg-black/20 hover:bg-black/40 px-2.5 py-1 rounded-md"
            id="close-sim-btn"
          >
            Annuleren
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 space-y-5">
          <div className="bg-[#202225]/40 border border-[#202225] rounded-lg p-4 space-y-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A87E43]">
              <Sparkles className="w-3.5 h-3.5" />
              Systeembericht: Geen Discord Config Gedetecteerd
            </span>
            <p className="text-xs text-[#b9bbbe] leading-relaxed">
              Er is geen live Discord client-secret of bot token geconfigureerd in je <strong className="text-white">.env / secrets panel</strong> in AI Studio. 
              Dit is volkomen normaal in de preview modus! Gebruik deze interactieve simulator om te testen hoe de website reageert op verschillende rollen in je server.
            </p>
          </div>

          <div className="text-center pb-2 border-b border-[#202225]">
            <h4 className="text-xs font-bold text-[#8e9297] uppercase tracking-wider mb-1">
              Selecteer een profiel om de loginstroom te simuleren
            </h4>
            <p className="text-xs text-[#b9bbbe]">Je simuleert op dit moment toegang tot het <strong className="text-[#A87E43] capitalize">{requestedPanel}</strong></p>
          </div>

          {/* User Options */}
          <div className="space-y-3">
            {/* option 1: Klant */}
            <div
              className={`p-4 bg-[#202225] hover:bg-[#35393e] border border-[#202225] hover:border-[#5865F2]/40 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                requestedPanel === "klantenpaneel" ? "ring-1 ring-[#A87E43]/40" : ""
              }`}
              onClick={() => handleSimulate("klant")}
              id="sim-profile-customer"
            >
              <div className="flex items-center gap-3">
                <img
                  src={SIMULATED_USERS.klant.avatar}
                  alt="Klant avatar"
                  className="w-11 h-11 rounded-full bg-cover border border-[#40444b]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white group-hover:text-[#5865F2] transition-colors">
                      {SIMULATED_USERS.klant.globalName}
                    </span>
                    <span className="text-xs text-[#8e9297]">@{SIMULATED_USERS.klant.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded-sm">
                      Serverlid
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-[#A87E43]/15 text-[#A87E43] rounded-sm">
                      Klant-Rol
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium">
                  <UserCheck className="w-3.5 h-3.5" /> Directe Toegang
                </span>
                <span className="text-[10px] text-[#8e9297] mt-0.5">Geschikt voor Klantenpaneel</span>
              </div>
            </div>

            {/* option 2: Medewerker */}
            <div
              className={`p-4 bg-[#202225] hover:bg-[#35393e] border border-[#202225] hover:border-[#5865F2]/40 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                requestedPanel === "medewerkerpaneel" ? "ring-1 ring-[#5865F2]/40" : ""
              }`}
              onClick={() => handleSimulate("medewerker")}
              id="sim-profile-staff"
            >
              <div className="flex items-center gap-3">
                <img
                  src={SIMULATED_USERS.medewerker.avatar}
                  alt="Medewerker avatar"
                  className="w-11 h-11 rounded-full bg-cover border border-[#40444b]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white group-hover:text-[#5865F2] transition-colors">
                      {SIMULATED_USERS.medewerker.globalName}
                    </span>
                    <span className="text-xs text-[#8e9297]">@{SIMULATED_USERS.medewerker.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded-sm">
                      Serverlid
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-purple-500/15 text-purple-400 rounded-sm">
                      Medewerker-Rol
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="inline-flex items-center gap-1 text-xs text-purple-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Beheerders Toegang
                </span>
                <span className="text-[10px] text-[#8e9297] mt-0.5">Alleen Sales Registreren</span>
              </div>
            </div>

            {/* option 2b: Manager */}
            <div
              className={`p-4 bg-[#202225] hover:bg-[#35393e] border border-[#202225] hover:border-[#A87E43]/40 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                requestedPanel === "medewerkerpaneel" ? "ring-1 ring-[#A87E43]/40" : ""
              }`}
              onClick={() => handleSimulate("manager")}
              id="sim-profile-manager"
            >
              <div className="flex items-center gap-3">
                <img
                  src={SIMULATED_USERS.manager.avatar}
                  alt="Manager avatar"
                  className="w-11 h-11 rounded-full bg-cover border border-[#40444b]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white group-hover:text-[#A87E43] transition-colors">
                      {SIMULATED_USERS.manager.globalName}
                    </span>
                    <span className="text-xs text-[#8e9297]">@{SIMULATED_USERS.manager.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded-sm">
                      Serverlid
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-sm">
                      Manager-Rol
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Full Management
                </span>
                <span className="text-[10px] text-[#8e9297] mt-0.5">Catalogus & Financiën Beheer</span>
              </div>
            </div>

            {/* option 2c: Owner / Eigenaar */}
            <div
              className={`p-4 bg-[#202225] hover:bg-[#35393e] border border-[#202225] hover:border-[#FF5555]/40 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                requestedPanel === "medewerkerpaneel" ? "ring-1 ring-[#FF5555]/40" : ""
              }`}
              onClick={() => handleSimulate("eigenaar")}
              id="sim-profile-owner"
            >
              <div className="flex items-center gap-3">
                <img
                  src={SIMULATED_USERS.eigenaar.avatar}
                  alt="Eigenaar avatar"
                  className="w-11 h-11 rounded-full bg-cover border border-[#40444b]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white group-hover:text-[#FF5555] transition-colors">
                      {SIMULATED_USERS.eigenaar.globalName}
                    </span>
                    <span className="text-xs text-[#8e9297]">@{SIMULATED_USERS.eigenaar.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded-sm">
                      Serverlid
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded-sm">
                      Eigenaar-Rol
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Eigenaar Rechten
                </span>
                <span className="text-[10px] text-[#8e9297] mt-0.5">Alle Rechten & Beheer</span>
              </div>
            </div>

            {/* option 2d: Coordinator */}
            <div
              className={`p-4 bg-[#202225] hover:bg-[#35393e] border border-[#202225] hover:border-[#A87E43]/40 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                requestedPanel === "medewerkerpaneel" ? "ring-1 ring-[#A87E43]/40" : ""
              }`}
              onClick={() => handleSimulate("coordinator")}
              id="sim-profile-coordinator"
            >
              <div className="flex items-center gap-3">
                <img
                  src={SIMULATED_USERS.coordinator.avatar}
                  alt="Coördinator avatar"
                  className="w-11 h-11 rounded-full bg-cover border border-[#40444b]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white group-hover:text-[#A87E43] transition-colors">
                      {SIMULATED_USERS.coordinator.globalName}
                    </span>
                    <span className="text-xs text-[#8e9297]">@{SIMULATED_USERS.coordinator.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded-sm">
                      Serverlid
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-[#A87E43]/15 text-[#A87E43] rounded-sm">
                      Coördinator-Rol (Lees-rechten)
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="inline-flex items-center gap-1 text-xs text-[#A87E43] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Kijk Toegang
                </span>
                <span className="text-[10px] text-[#8e9297] mt-0.5">Medewerkerpaneel Meekijken</span>
              </div>
            </div>

            {/* option 3: Invalid / No Role */}
            <div
              className="p-4 bg-[#202225] hover:bg-[#35393e] border border-[#202225] hover:border-[#ed4245]/40 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
              onClick={() => handleSimulate("invalid")}
              id="sim-profile-no-role"
            >
              <div className="flex items-center gap-3">
                <img
                  src={SIMULATED_USERS.invalid.avatar}
                  alt="Invalid avatar"
                  className="w-11 h-11 rounded-full bg-cover border border-[#40444b]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white group-hover:text-[#ed4245] transition-colors">
                      {SIMULATED_USERS.invalid.globalName}
                    </span>
                    <span className="text-xs text-[#8e9297]">@{SIMULATED_USERS.invalid.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded-sm">
                      Geen serverlid
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium">
                  <EyeOff className="w-3.5 h-3.5" /> Geen Toegang
                </span>
                <span className="text-[10px] text-[#8e9297] mt-0.5">Test rol-afwijzing flow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="bg-[#202225] p-4 text-xs text-[#8e9297] flex items-start gap-2.5 border-t border-[#2f3136] select-none">
          <AlertTriangle className="w-5 h-5 text-[#A87E43] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Wanneer je deze app naar <strong className="text-[#b9bbbe]">Render</strong> of een andere server host, gebruikt de backend 
            de officiële Discord OAuth endpoints. Je hoeft deze simulator dus niet handmatig uit te zetten; het fungeert automatisch als vangnet!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
