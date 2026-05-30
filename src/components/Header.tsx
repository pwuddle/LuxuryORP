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
    { id: ActivePage.Medewerkerpaneel, label: "Medewerkerpaneel" },
  ];

  return (
    <header className={`${bgHeader} sticky top-0 z-30 transition-all backdrop-blur-md px-4 sm:px-6 lg:px-8`} id="perseus-header">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 md:h-20" id="header-content">
        
        {/* Brand Group (Perseus Only Text) */}
        <div 
          onClick={() => onNavigate(ActivePage.Home)}
          className="flex flex-col justify-center cursor-pointer group"
          id="brand-navigation"
        >
          <h1 className="text-xl sm:text-2xl font-black tracking-widest text-[#A87E43] font-serif leading-none italic uppercase">
            PERSEUS
          </h1>
          <span className="text-[9px] uppercase font-bold tracking-wider text-[#A87E43] block mt-0.5">Exclusive Motors</span>
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
