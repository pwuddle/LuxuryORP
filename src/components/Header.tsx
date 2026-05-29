/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sun, Moon, LogOut, Menu, X, ShieldAlert, Sparkles, MessageSquare } from "lucide-react";
import { useState } from "react";
import { ActivePage, DiscordUser } from "../types";

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  user: DiscordUser | null;
  onLogout: () => void;
}

export default function Header({
  isDarkMode,
  onToggleTheme,
  activePage,
  onNavigate,
  user,
  onLogout,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Themes mapping
  const textPrimary = isDarkMode ? "text-[#f6f6f7]" : "text-[#060607]";
  const textSecondary = isDarkMode ? "text-[#dcddde]" : "text-[#2e3338]";
  const bgHeader = isDarkMode ? "bg-[#1e1f22]/95 border-[#A87E43] border-b-2" : "bg-[#f2f3f5]/95 border-[#e3e5e8]/90 border-b";

  const navItems = [
    { id: ActivePage.Home, label: "Home" },
    { id: ActivePage.Catalogus, label: "Catalogus" },
    { id: ActivePage.Klantenpaneel, label: "Klantenpaneel" },
    { id: ActivePage.Medewerkerpaneel, label: "Employee Area" },
  ];

  return (
    <header className={`${bgHeader} sticky top-0 z-30 transition-all backdrop-blur-md px-4 sm:px-6 lg:px-8`} id="perseus-header">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 md:h-20" id="header-content">
        
        {/* Brand Group (Perseus + SVG Logo) */}
        <div 
          onClick={() => onNavigate(ActivePage.Home)}
          className="flex items-center gap-3 cursor-pointer group"
          id="brand-navigation"
        >
          {/* Bespoke Perseus Silhouette SVG Logo in Gold/Bronze */}
          <div className="w-10 h-10 shrink-0 transform group-hover:scale-105 transition-transform">
            <svg
              viewBox="0 0 512 512"
              className="w-full h-full text-[#A87E43]"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g>
                {/* Ancient Helmet / Crest outline */}
                <path d="M256,16C230,16,160,50,160,116c0,23,12,38,30,48c-12,25-18,52-18,80c0,10,3,20,8,29c-31,24-50,60-50,101C130,443,186,496,256,496s126-53,126-122c0-41-19-77-50-101c5-9,8-19,8-29c0-28-6-55-18-80c18-10,30-25,30-48C352,50,282,16,256,16z M256,48c18,0,32,15,48,48c3,6,6,15,8,22c-15,3-36,5-56,5s-41-2-56-5c2-7,5-16,8-22C224,63,238,48,256,48z M214,142c11,4,26,7,42,7s31-3,42-7c6,13,10,28,10,44c0,50-23,73-52,73s-52-23-52-73C204,170,208,155,214,142z M256,360c-26,0-48,7-62,18c-3,2-6,5-8,8c3,12,18,22,42,27c9,2,18,3,28,3s19-1,28-3c24-5,39-15,42-27c-2-3-5-6-8-8C304,367,282,360,256,360z" />
                {/* Left wing detailing */}
                <path d="M128,240c-20,0-48,16-48,48c0,20,10,32,24,38c-8,14-12,30-12,46c0,42,34,76,76,76s76-34,76-76c0-16-4-32-12-46c14-6,24-18,24-38C256,256,228,240,128,240z" opacity="0.35" />
                {/* Right wing detailing */}
                <path d="M384,240c-100,0-128,16-128,48c0,20,10,32,24,38c-8,14-12,30-12,46c0,42,34,76,76,76s76-34,76-76c0-16-4-32-12-46c14-6,24-18,24-38C432,256,404,240,384,240z" opacity="0.35" />
              </g>
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-widest text-[#A87E43] font-serif leading-none italic uppercase">
              PERSEUS
            </h1>
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#A87E43] block">Exclusive Motors</span>
          </div>
        </div>

        {/* Desktop Navigation Menus */}
        <nav className="hidden lg:flex items-center gap-1.5" id="desktop-routing-links">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-4 py-2 font-bold text-xs uppercase tracking-wide rounded-md transition-all cursor-pointer ${
                activePage === item.id
                  ? "bg-[#A87E43] text-black shadow-sm"
                  : isDarkMode
                  ? "text-[#dcddde] hover:bg-[#2f3136] hover:text-white"
                  : "text-[#2e3338] hover:bg-[#e3e5e8] hover:text-[#060607]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action Controls (Theme, Session avatar, Logout, Mobile trigger) */}
        <div className="flex items-center gap-3">
          
          {/* Discord Styled Theme Switcher Toggle (Light/Dark Switcher) */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg transition-all focus:outline-hidden cursor-pointer border ${
              isDarkMode 
                ? "bg-[#2f3136] hover:bg-[#35393e] text-[#A87E43] border-neutral-700/70" 
                : "bg-white hover:bg-neutral-50 text-[#A87E43] border-neutral-200"
            }`}
            title={isDarkMode ? "Inschakelen Discord Light Mode" : "Inschakelen Discord Classic Dark Mode"}
            id="discord-theme-switch-btn"
          >
            {isDarkMode ? (
              <Sun className="w-4.5 h-4.5" />
            ) : (
              <Moon className="w-4.5 h-4.5" />
            )}
          </button>

          {/* User Auth indicator */}
          {user ? (
            <div className="hidden sm:flex items-center gap-3 bg-black/15 p-1 px-3 rounded-full border border-[#A87E43]/20">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatar || ""}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full border border-[#A87E43] bg-cover shrink-0 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col text-left">
                  <span className={`text-[10px] font-bold ${textPrimary} truncate max-w-[80px]`}>
                    {user.globalName || user.username}
                  </span>
                  <span className="text-[8px] font-black uppercase text-[#A87E43] leading-none">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1 hover:text-red-400 text-rose-500 rounded-lg transition-colors cursor-pointer"
                title="Log Uit"
                id="header-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate(ActivePage.Klantenpaneel)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs rounded-md shadow-md transition-all cursor-pointer"
              id="header-direct-login"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Log in
            </button>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 lg:hidden rounded-lg border ${
              isDarkMode ? "bg-[#2f3136] text-white border-neutral-700/60" : "bg-white text-slate-900 border-neutral-200"
            }`}
            id="mobile-menu-trigger"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden p-4 border-t border-[#A87E43]/10 space-y-3 animate-slide-in" id="mobile-menu-dropdown">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs uppercase font-bold rounded-md transition-all cursor-pointer ${
                  activePage === item.id
                    ? "bg-[#A87E43] text-black"
                    : isDarkMode
                    ? "text-[#dcddde] hover:bg-[#2f3136]"
                    : "text-[#2e3338] hover:bg-[#e3e5e8]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile User Details */}
          {user ? (
            <div className="p-3 bg-black/15 rounded-lg flex items-center justify-between border border-[#A87E43]/20 select-none">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatar || ""}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-[#A87E43] bg-cover object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col text-left">
                  <span className={`text-[11px] font-bold ${textPrimary}`}>
                    {user.globalName || user.username}
                  </span>
                  <span className="text-[9px] font-black uppercase text-[#A87E43]">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="p-1 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded text-xs font-bold transition-all cursor-pointer"
                id="mobile-logout-btn"
              >
                Log Uit
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onNavigate(ActivePage.Klantenpaneel);
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs rounded-md shadow-md flex items-center justify-center gap-1 cursor-pointer"
              id="mobile-login"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Log in met Discord
            </button>
          )}
        </div>
      )}
    </header>
  );
}
