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
  const [deletedCustomerIds, setDeletedCustomerIds] = useState<string[]>([]);
  const [registeredCustomers, setRegisteredCustomers] = useState<any[]>([]);
  const [editedCustomers, setEditedCustomers] = useState<Record<string, any>>({});

  // Fetch the latest global dealership state from the backend (making state fully shared)
  const fetchState = () => {
    fetch("/api/dealership/state")
      .then((res) => {
        if (!res.ok) throw new Error("Onbekende serverfout");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.vehicles)) setVehicles(data.vehicles);
        if (Array.isArray(data.requests)) setRequests(data.requests);
        if (Array.isArray(data.sales)) setSales(data.sales);
        if (Array.isArray(data.deletedCustomerIds)) setDeletedCustomerIds(data.deletedCustomerIds);
        if (Array.isArray(data.registeredCustomers)) setRegisteredCustomers(data.registeredCustomers);
        if (data.editedCustomers) setEditedCustomers(data.editedCustomers);
      })
      .catch((err) => {
        console.warn("Mislukt om live dealership status te synchroniseren:", err);
      });
  };

  useEffect(() => {
    // Initial fetch on mount
    fetchState();

    // Setup periodic polling interval (every 3 seconds) to catch other clients' updates
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

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
      // Security: Validate message origin (support dynamic local window, run.app and onrender.com)
      const origin = event.origin;
      const isAllowedOrigin =
        origin === window.location.origin ||
        origin.endsWith(".run.app") ||
        origin.endsWith(".onrender.com") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1");

      if (!isAllowedOrigin) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const loggedInUser: DiscordUser = event.data.user;
        setUser(loggedInUser);

        // Register customer in persistent database on login
        fetch("/api/dealership/customers/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loggedInUser)
        })
          .then(() => fetchState())
          .catch(err => console.error("Could not register customer login:", err));
        
        // Routely navigate to appropriate pane based on requested pane
        if (requestedPane === "medewerkerpaneel") {
          if (loggedInUser.role === "Medewerker" || loggedInUser.isManager || loggedInUser.isOwner) {
            setActivePage(ActivePage.Medewerkerpaneel);
          } else {
            setActivePage(ActivePage.Klantenpaneel);
          }
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

    // Register customer in persistent database on login
    fetch("/api/dealership/customers/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(simulatedUser)
    })
      .then(() => fetchState())
      .catch(err => console.error("Could not register customer login:", err));
    
    // Auto-navigate based on requested pane
    if (requestedPane === "medewerkerpaneel") {
      if (simulatedUser.role === "Medewerker" || simulatedUser.isManager || simulatedUser.isOwner) {
        setActivePage(ActivePage.Medewerkerpaneel);
      } else {
        setActivePage(ActivePage.Klantenpaneel);
      }
    } else {
      setActivePage(ActivePage.Klantenpaneel);
    }
  };

  // Global modifiers for vehicles inventory (propagates updates in real-time)
  const handleUpdateVehicleStock = (id: string, newStock: number) => {
    const target = vehicles.find((v) => v.id === id);
    if (!target) return;
    const updated = { ...target, stock: newStock };
    setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));

    fetch("/api/dealership/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    })
      .then(() => fetchState())
      .catch((err) => console.error("Failed to sync vehicle stock:", err));
  };

  const handleUpdateVehiclePrice = (id: string, newPrice: number) => {
    const target = vehicles.find((v) => v.id === id);
    if (!target) return;
    const updated = { ...target, price: newPrice };
    setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));

    fetch("/api/dealership/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    })
      .then(() => fetchState())
      .catch((err) => console.error("Failed to sync vehicle price:", err));
  };

  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehicles((prev) => [...prev, newVehicle]);

    fetch("/api/dealership/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newVehicle),
    })
      .then(() => fetchState())
      .catch((err) => console.error("Failed to sync new vehicle:", err));
  };

  const handleEditCustomerDetails = (id: string, fullName: string, bsn: string, birthDate: string) => {
    fetch("/api/dealership/customers/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, fullName, bsn, birthDate })
    })
      .then(() => fetchState())
      .catch((err) => console.error("Mislukt om klantgegevens aan te passen:", err));
  };

  const handleEditVehicle = (updatedVehicle: Vehicle) => {
    setVehicles((prev) => prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v)));

    fetch("/api/dealership/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedVehicle),
    })
      .then(() => fetchState())
      .catch((err) => console.error("Failed to sync updated vehicle:", err));
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));

    fetch(`/api/dealership/vehicles/${id}`, {
      method: "DELETE",
    })
      .then(() => fetchState())
      .catch((err) => console.error("Failed to sync deleted vehicle:", err));
  };

  // Add Sale registered report and lower stock automatically
  const handleAddSale = (newSale: Omit<SaleRecord, "id" | "date">) => {
    const freshSale: SaleRecord = {
      ...newSale,
      id: `s_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
    };
    setSales((prev) => [freshSale, ...prev]);

    fetch("/api/dealership/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(freshSale),
    })
      .then(() => fetchState())
      .catch((err) => console.error("Failed to sync new sale:", err));

    return freshSale;
  };

  const handleDeleteSale = (saleId: string) => {
    setSales((prev) => prev.filter((s) => s.id !== saleId));

    fetch(`/api/dealership/sales/${saleId}`, {
      method: "DELETE",
    })
      .then(() => fetchState())
      .catch((err) => console.error("Failed to sync deleted sale:", err));
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

    fetch("/api/dealership/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(freshRequest),
    })
      .then(() => fetchState())
      .catch((err) => console.error("Failed to sync new purchase request:", err));
  };

  // Set deal status approved vs denied
  const handleUpdateRequestStatus = (id: string, status: "Goedgekeurd" | "Geweigerd") => {
    const targetReq = requests.find((r) => r.id === id);
    if (!targetReq) return;

    const updatedRequest: PurchaseRequest = { ...targetReq, status };
    setRequests((prev) => prev.map((r) => (r.id === id ? updatedRequest : r)));

    // Send update request to server
    fetch("/api/dealership/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedRequest),
    })
      .then(() => fetchState())
      .catch((err) => console.error("Failed to sync request status:", err));

    if (status === "Goedgekeurd") {
      // Find matching vehicle and decrease stock
      const targetVehicle = vehicles.find((v) => v.id === targetReq.vehicleId);
      if (targetVehicle && targetVehicle.stock > 0) {
        // Decrease stock on server & local state
        const updatedVehicle = { ...targetVehicle, stock: targetVehicle.stock - 1 };
        setVehicles((prev) => prev.map((v) => (v.id === targetVehicle.id ? updatedVehicle : v)));

        fetch("/api/dealership/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedVehicle),
        })
          .then(() => fetchState())
          .catch((err) => console.error("Failed to sync vehicle stock decrease:", err));

        // Log transaction sale automatism
        const freshSale: SaleRecord = {
          buyerDiscordId: targetReq.buyerDiscordId,
          buyerName: targetReq.buyerName,
          vehicleId: targetReq.vehicleId,
          vehicleName: targetReq.vehicleName,
          pricePaid: targetVehicle.price,
          salesperson: user ? `${user.globalName || user.username} (${user.id})` : "Perseus Manager",
          status: "Betaald",
          id: `s_${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
        };

        setSales((prev) => [freshSale, ...prev]);

        fetch("/api/dealership/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(freshSale),
        })
          .then(() => fetchState())
          .catch((err) => console.error("Failed to sync automatic sale record:", err));
      }
    }
  };

  const handleDeleteCustomer = (id: string) => {
    setDeletedCustomerIds((prev) => [...prev, id]);

    fetch(`/api/dealership/customers/${id}`, {
      method: "DELETE",
    })
      .then(() => fetchState())
      .catch((err) => console.error("Failed to sync deleted customer:", err));
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
              sales={sales}
              deletedCustomerIds={deletedCustomerIds}
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
              deletedCustomerIds={deletedCustomerIds}
              registeredCustomers={registeredCustomers}
              editedCustomers={editedCustomers}
              onDeleteCustomer={handleDeleteCustomer}
              onEditCustomerDetails={handleEditCustomerDetails}
              onStartOAuth={handleStartOAuth}
              onUpdateVehicleStock={handleUpdateVehicleStock}
              onUpdateVehiclePrice={handleUpdateVehiclePrice}
              onAddSale={handleAddSale}
              onDeleteSale={handleDeleteSale}
              onUpdateRequestStatus={handleUpdateRequestStatus}
              onAddVehicle={handleAddVehicle}
              onEditVehicle={handleEditVehicle}
              onDeleteVehicle={handleDeleteVehicle}
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
