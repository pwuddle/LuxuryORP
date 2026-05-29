/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Sparkles, Compass, Shield, Award, Clock, ArrowRight, MessageSquare, Car, Users, TrendingUp } from "lucide-react";

import { ActivePage, DiscordUser } from "../types";

interface HomeProps {
  isDarkMode: boolean;
  onNavigate: (page: ActivePage) => void;
  onStartOAuth: (pane: "klantenpaneel" | "medewerkerpaneel") => void;
  user: DiscordUser | null;
}

export default function Home({ isDarkMode, onNavigate, onStartOAuth, user }: HomeProps) {
  // Theme colors
  const textPrimary = isDarkMode ? "text-[#f6f6f7]" : "text-[#060607]";
  const textSecondary = isDarkMode ? "text-[#dcddde]" : "text-[#2e3338]";
  const textMuted = isDarkMode ? "text-[#949ba4]" : "text-[#4f5660]";
  const bgCard = isDarkMode ? "bg-[#2b2d31] border border-white/5 shadow-2xl" : "bg-[#f2f3f5] border border-neutral-200/50";
  const bgPanel = isDarkMode ? "bg-[#1e1f22]/90" : "bg-[#e3e5e8]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      id="home-page-container"
    >
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-transparent" id="hero-banner">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-out hover:scale-105" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200&auto=format&fit=crop')" }} 
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/75 to-black/30" />
        
        {/* Decorative Bronze Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-[#A87E43]" />

        <div className="relative z-10 max-w-3xl px-8 py-16 md:py-24 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A87E43]/10 border border-[#A87E43]/30 text-xs font-semibold text-[#A87E43] tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Vijfsterren FiveM Ervaring
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
            PERSEUS <br />
            <span className="text-[#A87E43] font-serif font-light italic">Car Dealership</span>
          </h1>
          <p className="text-[#dcddde] text-sm md:text-base leading-relaxed max-w-xl">
            Stap binnen in de meest exclusieve showroom van de stad. Perseus combineert legendarische mythe met hypermoderne pk-monsters. Ontdek onze gecatologeerde importvoertuigen of beheer uw dossier in ons beveiligde portaal.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => onNavigate(ActivePage.Catalogus)}
              className="px-6 py-3 bg-[#A87E43] hover:bg-[#926b34] text-black font-bold rounded-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center gap-2"
              id="hero-catalog-btn"
            >
              <Car className="w-4 h-4" />
              Bekijk Catalogus
              <ArrowRight className="w-4 h-4" />
            </button>
            
            {!user ? (
              <button
                onClick={() => onStartOAuth("klantenpaneel")}
                className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center gap-2"
                id="hero-login-btn"
              >
                <MessageSquare className="w-4 h-4" />
                Inloggen via Discord
              </button>
            ) : (
              <button
                onClick={() => onNavigate(user.role === "Medewerker" ? ActivePage.Medewerkerpaneel : ActivePage.Klantenpaneel)}
                className="px-6 py-3 bg-[#43b581] hover:bg-[#3ca374] text-white font-bold rounded-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center gap-2"
                id="hero-panel-btn"
              >
                Naar Jouw Paneel ({user.role})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="features-highlights">
        {/* Card 1 */}
        <div className={`p-6 rounded-xl ${bgCard} hover:border-[#A87E43]/40 transition-all shadow-md group`}>
          <div className="w-12 h-12 bg-[#A87E43]/10 rounded-lg flex items-center justify-center text-[#A87E43] mb-4 group-hover:scale-110 transition-transform">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>Exclusieve Imports</h3>
          <p className={`text-xs ${textMuted} leading-relaxed`}>
            Onze vloot bestaat uit unieke supercars, legendarische custom muscle cars en robuuste terreinwagens. Stuk voor stuk tuningsklaar en direct te leveren in Los Santos.
          </p>
        </div>

        {/* Card 2 */}
        <div className={`p-6 rounded-xl ${bgCard} hover:border-[#A87E43]/40 transition-all shadow-md group`}>
          <div className="w-12 h-12 bg-[#A87E43]/10 rounded-lg flex items-center justify-center text-[#A87E43] mb-4 group-hover:scale-110 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>Discord Geverifieerd</h3>
          <p className={`text-xs ${textMuted} leading-relaxed`}>
            Dankzij volledige Discord synchronisatie logt u direct in met uw eigen Discord account. Rollen bepalen direct uw toegang voor verkoopregistratie of uw eigen garage.
          </p>
        </div>

        {/* Card 3 */}
        <div className={`p-6 rounded-xl ${bgCard} hover:border-[#A87E43]/40 transition-all shadow-md group`}>
          <div className="w-12 h-12 bg-[#A87E43]/10 rounded-lg flex items-center justify-center text-[#A87E43] mb-4 group-hover:scale-110 transition-transform">
            <Award className="w-6 h-6" />
          </div>
          <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>Financiering Mogelijk</h3>
          <p className={`text-xs ${textMuted} leading-relaxed`}>
            Koop uw voertuig contant of maak gebruik van de flexibele Perseus in-game financiering. Dien direct een offerte of testrit-aanvraag in via ons klantenportaal.
          </p>
        </div>
      </div>

      {/* Main Row: Opening hours, Dealership Statistics and Invitation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch" id="details-row">
        {/* Opening Hours & Server details */}
        <div className={`lg:col-span-5 p-6 rounded-xl ${bgCard} flex flex-col justify-between shadow-md space-y-6`}>
          <div className="space-y-4">
            <h3 className={`text-xl font-extrabold ${textPrimary} flex items-center gap-2 border-b border-[#A87E43]/30 pb-3`}>
              <Clock className="w-5 h-5 text-[#A87E43]" />
              Informatie & Openingstijden
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className={`font-medium ${textSecondary}`}>Maandag - Vrijdag</span>
                <span className="text-[#A87E43] font-semibold bg-[#A87E43]/10 px-2 py-0.5 rounded">19:00 - 23:00</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={`font-medium ${textSecondary}`}>Zaterdag</span>
                <span className="text-[#A87E43] font-semibold bg-[#A87E43]/10 px-2 py-0.5 rounded">15:00 - 23:59</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={`font-medium ${textSecondary}`}>Zondag</span>
                <span className="text-[#A87E43] font-semibold bg-[#A87E43]/10 px-2 py-0.5 rounded">Gesloten / Op Afspraak</span>
              </div>
            </div>
          </div>

          {/* Mini Dealership KPI Panel */}
          <div className={`p-4 rounded-lg ${bgPanel} space-y-3`}>
            <h4 className={`text-xs font-bold ${textPrimary} uppercase tracking-wider`}>In-Game Live Status</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-[#A87E43]" />
                <div>
                   <div className={`text-sm font-extrabold ${textPrimary}`}>8 Modellen</div>
                  <div className={`text-[10px] ${textMuted}`}>Gecatalogeerd</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#A87E43]" />
                <div>
                  <div className="text-sm font-extrabold text-green-500">Actief</div>
                  <div className={`text-[10px] ${textMuted}`}>Import Kanaal</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Discord Join Call-To-Action (Discord layout themed) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 bg-[#5865F2] hover:bg-[#5865F2]/95 text-white rounded-xl shadow-xl border-t-4 border-[#A87E43]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase bg-black/20 px-2.5 py-1 rounded-sm text-[#A87E43] tracking-wider">
                Word lid van de community
              </span>
              <svg
                className="w-8 h-8 text-white opacity-80"
                fill="currentColor"
                viewBox="0 0 127.14 96.36"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.9-.65,1.76-1.34,2.58-2a75.52,75.52,0,0,0,72.9,0c.82.71,1.68,1.4,2.58,2a68.47,68.47,0,0,1-10.5,5,77.76,77.76,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,50.77,123.63,28,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
              </svg>
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">Onze Discord Guild</h3>
            <p className="text-sm text-blue-50 leading-relaxed">
              Krijg toegang tot exclusieve import drops, wekelijkse evenementen, kortingscodes en praat rechtstreeks met onze verkoopmedewerkers. Dit is tevens de sleutel om uw Klanten- of Medewerkerpaneel te ontgrendelen!
            </p>
          </div>

          <div className="pt-6 flex items-center justify-between flex-wrap gap-4 border-t border-white/20 mt-6">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-[#5865F2] bg-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150" alt="" />
                <img className="w-8 h-8 rounded-full border-2 border-[#5865F2] bg-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150" alt="" />
                <img className="w-8 h-8 rounded-full border-2 border-[#5865F2] bg-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150" alt="" />
              </div>
              <span className="text-xs font-bold text-blue-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#43b581]" /> 1,420 Spelers online
              </span>
            </div>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="px-5 py-2.5 bg-white text-black font-extrabold text-sm rounded-md shadow-md hover:bg-slate-100 transition-all flex items-center gap-1.5"
              id="join-discord-btn"
            >
              Lid Worden van Discord
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
