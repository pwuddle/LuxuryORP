/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Catalog from "./components/Catalog";
import ClientPanel from "./components/ClientPanel";
import EmployeePanel from "./components/EmployeePanel";
import OAuthSimulatorModal from "./components/OAuthSimulatorModal";
import { ActivePage, DiscordUser, Vehicle, PurchaseRequest, SaleRecord } from "./types";
import { INITIAL_VEHICLES, INITIAL_REQUESTS, INITIAL_SALES } from "./data";

export type SafeUser = DiscordUser;

export default function App() {
  // Discord Light/Dark Mode (Defaulting to Discord Classic Dark Theme)
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activePage, setActivePage] = useState<ActivePage>(ActivePage.Home);
  const [user, setUser] = useState<SafeUser | null>(null);

  // Core dealership database stored in React state for full reactivity
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [requests, setRequests] = useState<PurchaseRequest[]>(INITIAL_REQUESTS);
  const [sales, setSales] = useState<SaleRecord[]>(INITIAL_SALES);

  // OAuth Simulator toggle and flow trackers
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [requestedPane, setRequestedPane] = useState<"klantenpaneel" | "medewerkerpaneel">("klantenpaneel");

  // Toggle Dark/Light Theme (bronze accent is constant - persistent styling)
  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Logout handler (clears state)
  const handleLogout = () => {
    setUser(null);
    setActivePage(ActivePage.Home);
  };

  // Listen for real Discord OAuth callbacks via postMessage
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Security: Validate message origin (either .run.app or localhost)
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const loggedInUser: DiscordUser = event.data.user;
        setUser(loggedInUser);
        
        // Routely navigate to appropriate pane based on Discord authorization role
        if (loggedInUser.role === "Medewerker") {
          setActivePage(ActivePage.Medewerkerpaneel);
        } else {
          setActivePage(ActivePage.Klantenpaneel);
        }
      }

      if (event.data?.type === "OAUTH_AUTH_FAILURE") {
        alert(event.data.error || "U bezit niet de benodigde rol om in te loggen.");
        if (event.data.user) {
          // If they successfully logged in to Discord but lack guild membership roles,
          // we can optionally set user with role === "Geen" for debugging.
          setUser(null);
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, []);

  // Initiate real Discord login popup or open the embedded Discord simulator
  const handleStartOAuth = async (pane: "klantenpaneel" | "medewerkerpaneel") => {
    setRequestedPane(pane);
    try {
      const response = await fetch(`/api/auth/url?pane=${pane}`);
      if (!response.ok) {
        throw new Error("Mislukt om verificatie status te scannen.");
      }

      const data = await response.json();
      if (data.simulate) {
        // App credentials are empty, open embedded Simulator
        setSimulatorOpen(true);
      } else {
        // App coordinates are configured, trigger live Discord authorization window
        const width = 600;
        const height = 750;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const authWindow = window.open(
          data.url,
          "discord_oauth_popup",
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        if (!authWindow) {
          alert("De popup is geblokkeerd door uw browser. Sta popups toe voor deze website om in te loggen.");
        }
      }
    } catch (err) {
      console.error("Could not fetch auth configuration, fallback to simulator:", err);
      setSimulatorOpen(true);
    }
  };

  // Simulator success handler
  const handleSimulatorSuccess = (simulatedUser: DiscordUser) => {
    setSimulatorOpen(false);
    
    if (simulatedUser.role === "Geen") {
      alert("Simulatie-afwijzing: Deze discord-gebruiker heeft niet de benodigde rollen op de Discord server!");
      setUser(null);
      return;
    }

    setUser(simulatedUser);
    
    // Auto-navigate
    if (simulatedUser.role === "Medewerker") {
      setActivePage(ActivePage.Medewerkerpaneel);
    } else {
      setActivePage(ActivePage.Klantenpaneel);
    }
  };

  // Global modifiers for vehicles inventory (propagates updates in real-time)
  const handleUpdateVehicleStock = (id: string, newStock: number) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, stock: newStock } : v)));
  };

  const handleUpdateVehiclePrice = (id: string, newPrice: number) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, price: newPrice } : v)));
  };

  // Add Sale registered report and lower stock automatically
  const handleAddSale = (newSale: Omit<SaleRecord, "id" | "date">) => {
    const freshSale: SaleRecord = {
      ...newSale,
      id: `s_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
    };
    setSales((prev) => [freshSale, ...prev]);
  };

  // Submit dynamic quote request
  const handleAddRequest = (newRequest: Omit<PurchaseRequest, "id" | "date" | "status">) => {
    const freshRequest: PurchaseRequest = {
      ...newRequest,
      id: `r_${Date.now()}`,
      status: "In Behandeling",
      date: new Date().toISOString().split("T")[0],
    };
    setRequests((prev) => [freshRequest, ...prev]);
  };

  // Set deal status approved vs denied
  const handleUpdateRequestStatus = (id: string, status: "Goedgekeurd" | "Geweigerd") => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    
    const targetReq = requests.find(r => r.id === id);
    if (status === "Goedgekeurd" && targetReq) {
      // Find matching vehicle and decrease stock
      const targetVehicle = vehicles.find(v => v.id === targetReq.vehicleId);
      if (targetVehicle && targetVehicle.stock > 0) {
        handleUpdateVehicleStock(targetVehicle.id, targetVehicle.stock - 1);
        
        // Log transaction sale automatism
        handleAddSale({
          buyerDiscordId: targetReq.buyerDiscordId,
          buyerName: targetReq.buyerName,
          vehicleId: targetReq.vehicleId,
          vehicleName: targetReq.vehicleName,
          pricePaid: targetVehicle.price,
          salesperson: user?.globalName || user?.username || "Perseus Manager",
        });
      }
    }
  };

  // Core background layouts depending on current theme selector
  const mainBgClass = isDarkMode ? "bg-[#313338] text-[#dcddde]" : "bg-white text-slate-800";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${mainBgClass}`}>
      
      {/* Dealership navigation header */}
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        onLogout={handleLogout}
      />

      {/* Pages Container */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          {activePage === ActivePage.Home && (
            <Home
              isDarkMode={isDarkMode}
              onNavigate={setActivePage}
              onStartOAuth={handleStartOAuth}
              user={user}
            />
          )}

          {activePage === ActivePage.Catalogus && (
            <Catalog
              isDarkMode={isDarkMode}
              vehicles={vehicles}
              user={user}
              onSubmitRequest={handleAddRequest}
              onStartOAuth={handleStartOAuth}
            />
          )}

          {activePage === ActivePage.Klantenpaneel && (
            <ClientPanel
              isDarkMode={isDarkMode}
              user={user}
              requests={requests}
              onStartOAuth={handleStartOAuth}
            />
          )}

          {activePage === ActivePage.Medewerkerpaneel && (
            <EmployeePanel
              isDarkMode={isDarkMode}
              user={user}
              vehicles={vehicles}
              requests={requests}
              sales={sales}
              onStartOAuth={handleStartOAuth}
              onUpdateVehicleStock={handleUpdateVehicleStock}
              onUpdateVehiclePrice={handleUpdateVehiclePrice}
              onAddSale={handleAddSale}
              onUpdateRequestStatus={handleUpdateRequestStatus}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Dealership core footer */}
      <Footer isDarkMode={isDarkMode} />

      {/* Embedded Dialog Frame representing simulated login fallback */}
      <AnimatePresence>
        {simulatorOpen && (
          <OAuthSimulatorModal
            onClose={() => setSimulatorOpen(false)}
            onSuccess={handleSimulatorSuccess}
            requestedPanel={requestedPane}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
