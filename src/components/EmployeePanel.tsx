/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SafeUser } from "../App";
import { 
  Users, Car, Landmark, ArrowRight, ShieldAlert, CheckCircle, 
  XCircle, Coins, Plus, Minus, FilePlus, Sparkles, TrendingUp, RefreshCw, Lock,
  Edit, PlusCircle, Search, Calculator, Receipt, Phone, Download
} from "lucide-react";
import { SaleRecord, Vehicle, PurchaseRequest } from "../types";
import SearchableSelect from "./SearchableSelect";

interface EmployeePanelProps {
  isDarkMode: boolean;
  user: SafeUser | null;
  vehicles: Vehicle[];
  requests: PurchaseRequest[];
  sales: SaleRecord[];
  deletedCustomerIds: string[];
  registeredCustomers: any[];
  editedCustomers: Record<string, Partial<Customer>>;
  onDeleteCustomer: (id: string) => void;
  onEditCustomerDetails: (id: string, fullName: string, bsn: string, birthDate: string) => void;
  onStartOAuth: (pane: "klantenpaneel" | "medewerkerpaneel") => void;
  onUpdateVehicleStock: (id: string, newStock: number) => void;
  onUpdateVehiclePrice: (id: string, newPrice: number) => void;
  onAddSale: (sale: Omit<SaleRecord, "id" | "date">) => void;
  onDeleteSale: (id: string) => void;
  onUpdateRequestStatus: (id: string, status: "Goedgekeurd" | "Geweigerd") => void;
  onAddVehicle: (vehicle: Vehicle) => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onStateRefresh?: () => void;
}

const STAFF_MEMBERS = [
  { id: "987654321098765432", name: "Loek | Perseus Sales", role: "Verkoper" },
  { id: "112233445566778899", name: "Franklin | Perseus Manager", role: "Manager" },
  { id: "998877665544332211", name: "Michael | Perseus Owner", role: "Eigenaar" },
  { id: "555555555555555555", name: "Jimmy | Perseus Monteur", role: "Monteur" },
  { id: "444444444444444444", name: "Lamar | Perseus Schoonmaker", role: "Schoonmaker" }
];

interface Customer {
  id: string;
  username: string;
  globalName: string;
  avatar: string | null;
  hasLoggedIn: boolean;
  registrationDate: string;
  fullName?: string;
  bsn?: string;
  birthDate?: string;
}

const INITIAL_CUSTOMERS: Customer[] = [];

export default function EmployeePanel({
  isDarkMode,
  user,
  vehicles,
  requests,
  sales,
  deletedCustomerIds,
  registeredCustomers,
  editedCustomers,
  onDeleteCustomer,
  onEditCustomerDetails,
  onStartOAuth,
  onUpdateVehicleStock,
  onUpdateVehiclePrice,
  onAddSale,
  onDeleteSale,
  onUpdateRequestStatus,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onStateRefresh
}: EmployeePanelProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<"verkoop" | "klanten" | "catalogus" | "financieel" | "administratie">("verkoop");

  // Track confirmation of customer deletion
  const [confirmDeleteCustomerId, setConfirmDeleteCustomerId] = useState<string | null>(null);

  // Website Administratie States
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isSavingSpreadsheet, setIsSavingSpreadsheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [syncResult, setSyncResult] = useState<{ text: string; error: boolean } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ text: string; error: boolean } | null>(null);

  const isOwner = !!user?.isOwner;
  const isCoordinator = !!user?.isCoordinator;

  const checkActionPermission = () => {
    if (isCoordinator) {
      alert("Als Coördinator bezit u alleen kijk-rechten. U kunt geen mutaties of acties uitvoeren.");
      return false;
    }
    return true;
  };

  // Fetch secure Google Sheets configuration
  useEffect(() => {
    if (user?.isOwner) {
      fetch("/api/dealership/google-config")
        .then(res => res.json())
        .then(data => {
          if (data.spreadsheetUrl) setSpreadsheetUrl(data.spreadsheetUrl);
          if (data.googleClientId) setGoogleClientId(data.googleClientId);
          if (data.googleClientSecret) setGoogleClientSecret(data.googleClientSecret);
          setIsConnected(!!data.isConnected);
        })
        .catch(err => console.error("Fout bij laden Google Sheets config:", err));
    }
  }, [user]);

  // Listen for Google Sheets OAuth success message
  useEffect(() => {
    const handleGoogleMessage = (event: MessageEvent) => {
      if (event.data?.type === "GOOGLE_SHEETS_AUTH_SUCCESS") {
        setIsConnected(true);
        setSaveMessage({ text: "Google Sheets verbinding succesvol tot stand gebracht!", error: false });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    };
    window.addEventListener("message", handleGoogleMessage);
    return () => window.removeEventListener("message", handleGoogleMessage);
  }, []);

  // Save config values securely on the server
  const handleSaveGoogleConfig = (e: FormEvent) => {
    e.preventDefault();
    setIsSavingSpreadsheet(true);
    setSaveMessage(null);

    fetch("/api/dealership/google-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        url: spreadsheetUrl, 
        clientId: googleClientId, 
        clientSecret: googleClientSecret 
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Fout bij opslaan");
        return res.json();
      })
      .then(data => {
        setSaveMessage({ text: "Instellingen succesvol opgeslagen en beveiligd!", error: false });
        setTimeout(() => setSaveMessage(null), 4000);
      })
      .catch(() => {
        setSaveMessage({ text: "Er is een fout opgetreden bij het opslaan van de instellingen.", error: true });
      })
      .finally(() => {
        setIsSavingSpreadsheet(false);
      });
  };

  // Trigger popup authenticating Google account
  const handleGoogleConnect = () => {
    // Automatically save current input before starting auth popup
    fetch("/api/dealership/google-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        url: spreadsheetUrl, 
        clientId: googleClientId, 
        clientSecret: googleClientSecret 
      })
    })
      .then(() => {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const authWindow = window.open(
          "/api/dealership/google-auth-start",
          "google_sheets_oauth_popup",
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
        
        if (!authWindow) {
          alert("De Google login pop-up is geblokkeerd door uw browser. Schakel de pop-up blocker uit voor deze site.");
        }
      })
      .catch(err => {
        console.error("Fout bij automatisch opslaan voor Google autorisatie:", err);
      });
  };

  // Disconnect Google tokens
  const handleGoogleDisconnect = () => {
    if (!window.confirm("Weet u zeker dat u de koppeling met dit Google account wilt verbreken?")) return;
    fetch("/api/dealership/google-disconnect", { method: "POST" })
      .then(res => res.json())
      .then(() => {
        setIsConnected(false);
        setSaveMessage({ text: "Google-account succesvol ontkoppeld.", error: false });
        setTimeout(() => setSaveMessage(null), 4000);
      })
      .catch(err => {
        console.error("Fout bij ontkoppelen Google account:", err);
      });
  };

  // Force manual instant synchronisation
  const handleForceSync = () => {
    setIsSyncing(true);
    setSyncResult(null);
    fetch("/api/dealership/google-sync", { method: "POST" })
      .then(res => {
        if (!res.ok) throw new Error("Fout bij synchroniseren");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setSyncResult({ text: data.message, error: false });
        } else {
          setSyncResult({ text: data.message, error: true });
        }
      })
      .catch(() => {
        setSyncResult({ text: "Synchronisatie is mislukt vanwege een serverfout. Controleer uw verbinding.", error: true });
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  // Import / Read dataset from Google Sheets
  const handleImportFromGoogle = () => {
    if (!checkActionPermission()) return;
    setIsImporting(true);
    setImportResult(null);
    fetch("/api/dealership/google-import", { method: "POST" })
      .then(res => {
        if (!res.ok) throw new Error("Fout bij inlezen");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setImportResult({ text: data.message, error: false });
          if (onStateRefresh) {
            onStateRefresh();
          }
        } else {
          setImportResult({ text: data.message, error: true });
        }
      })
      .catch((err) => {
        console.error(err);
        setImportResult({ text: "Inlezen is mislukt vanwege een serverfout. Controleer uw credentials en spreadsheet tabs.", error: true });
      })
      .finally(() => {
        setIsImporting(false);
      });
  };

  // Dynamically derive customers from the current sales and requests, merged with manual edits
  const customers = useMemo(() => {
    // 1. Initial customers mapping
    const list = [...INITIAL_CUSTOMERS].map(c => ({
      ...c,
      ...(editedCustomers[c.id] || {})
    }));

    // 2. Merge registeredCustomers from login
    registeredCustomers.forEach(rc => {
      const idx = list.findIndex(c => c.id === rc.id);
      if (idx === -1) {
        list.push({
          id: rc.id,
          username: rc.username,
          globalName: rc.globalName,
          avatar: rc.avatar,
          hasLoggedIn: true,
          registrationDate: rc.registrationDate || "2026-05-12",
          fullName: "",
          bsn: "",
          birthDate: "",
          ...(editedCustomers[rc.id] || {})
        });
      } else {
        list[idx] = {
          ...list[idx],
          username: rc.username,
          globalName: rc.globalName,
          avatar: rc.avatar,
          hasLoggedIn: true,
          ...(editedCustomers[rc.id] || {})
        };
      }
    });

    // 3. Merge sales buyers
    sales.forEach(s => {
      if (!list.some(c => c.id === s.buyerDiscordId)) {
        const edited = editedCustomers[s.buyerDiscordId] || {};
        list.push({
          id: s.buyerDiscordId,
          username: s.buyerName.replace(/\s+/g, "_").toLowerCase(),
          globalName: s.buyerName,
          avatar: null,
          hasLoggedIn: true,
          registrationDate: s.date || "2026-05-12",
          fullName: "",
          bsn: "",
          birthDate: "",
          ...edited
        });
      }
    });

    // 4. Merge requests buyers
    requests.forEach(r => {
      if (!list.some(c => c.id === r.buyerDiscordId)) {
        const edited = editedCustomers[r.buyerDiscordId] || {};
        list.push({
          id: r.buyerDiscordId,
          username: r.buyerName.replace(/\s+/g, "_").toLowerCase(),
          globalName: r.buyerName,
          avatar: r.buyerAvatar,
          hasLoggedIn: true,
          registrationDate: r.date || "2026-05-28",
          fullName: "",
          bsn: "",
          birthDate: "",
          ...edited
        });
      }
    });

    return list.filter(c => !deletedCustomerIds.includes(c.id));
  }, [sales, requests, editedCustomers, deletedCustomerIds, registeredCustomers]);

  // Search & Selected Customer in Klantenbestand
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("123456789012345678");

  // Confirmation states for iframe security & usability
  const [confirmDeleteSaleId, setConfirmDeleteSaleId] = useState<string | null>(null);
  const [confirmDeleteVehicleId, setConfirmDeleteVehicleId] = useState<string | null>(null);

  // Form Inputs: Verkoopregistratie
  const [selectedClientAndBsnId, setSelectedClientAndBsnId] = useState("");
  const [selectedSalesperson, setSelectedSalesperson] = useState(user?.globalName || user?.username || "Loek | Perseus Sales");
  const [saleStatus, setSaleStatus] = useState<"Gereserveerd" | "Besteld" | "Betaald" | "Opgehaald">("Besteld");
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || "");
  const [salePrice, setSalePrice] = useState<number>(vehicles[0]?.price || 0);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // Form Inputs: Catalogus Beheer
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<"Super" | "Sports" | "SUV/Off-Road" | "Classic" | "Overige">("Sports");
  const [newPrice, setNewPrice] = useState(150000);
  const [newPurchasePrice, setNewPurchasePrice] = useState(100000);
  const [newStock, setNewStock] = useState(3);
  const [newTopSpeedStock, setNewTopSpeedStock] = useState(180);
  const [newTopSpeedTuned, setNewTopSpeedTuned] = useState(240);
  const [newInzittenden, setNewInzittenden] = useState(2);
  const [newDescription, setNewDescription] = useState("");
  const [newImage, setNewImage] = useState("");

  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Local edit states for Customer
  const [editingCustomerFields, setEditingCustomerFields] = useState<{
    id: string;
    fullName: string;
    bsn: string;
    birthDate: string;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingVehicle) {
          setEditingVehicle(null);
        }
        if (editingCustomerFields) {
          setEditingCustomerFields(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingVehicle, editingCustomerFields]);

  const getCustomerTier = (purchasesCount: number, totalSpend: number) => {
    if (totalSpend >= 15000000) {
      return { 
        name: "VIP Klant", 
        color: "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black", 
        label: "VIP (Spend ≥ €15.000.000)" 
      };
    }
    if (purchasesCount >= 10) {
      return { 
        name: "Premium Klant", 
        color: "bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold", 
        label: "Premium (≥ 10 aankopen)" 
      };
    }
    if (purchasesCount >= 5) {
      return { 
        name: "Geverifieerd Klant", 
        color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold", 
        label: "Geverifieerd (5-9 aankopen)" 
      };
    }
    if (purchasesCount >= 1) {
      return { 
        name: "Normale klant", 
        color: "bg-blue-500/20 text-blue-400 border border-blue-500/40", 
        label: "Normaal (1-4 aankopen)" 
      };
    }
    return { 
      name: "Nieuwe klant", 
      color: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/40", 
      label: "Nieuw (Geen aankopen)" 
    };
  };

  const handleSaveCustomerDetails = (e: FormEvent) => {
    e.preventDefault();
    if (!checkActionPermission()) return;
    if (!editingCustomerFields) return;
    onEditCustomerDetails(
      editingCustomerFields.id,
      editingCustomerFields.fullName,
      editingCustomerFields.bsn,
      editingCustomerFields.birthDate
    );
    setEditingCustomerFields(null);
  };

  // Financial commission variables (stateful modifiers)
  const [commissionRate, setCommissionRate] = useState<number>(10); // global editable 10%
  const [financialStartDate, setFinancialStartDate] = useState<string>("");
  const [selectedStaffPayslip, setSelectedStaffPayslip] = useState<string | null>(null);

  const getSaleProfit = (s: SaleRecord) => {
    const vehicle = vehicles.find(v => v.id === s.vehicleId);
    const cost = vehicle ? vehicle.purchasePrice : Math.floor(s.pricePaid * 0.70);
    return Math.max(0, s.pricePaid - cost);
  };

  // Permissions check
  const isManagerOrOwner = !!(user?.isManager || user?.isOwner);

  const filteredSalesForFinance = sales.filter(s => {
    if (!financialStartDate) return true;
    return s.date >= financialStartDate;
  });

  // Formatting helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
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
    if (!checkActionPermission()) return;
    if (!selectedClientAndBsnId || !selectedVehicleId) {
      alert("Selecteer a.u.b. een kantoor-geverifieerde klant en een voertuig.");
      return;
    }

    const targetCustomer = customers.find(c => c.id === selectedClientAndBsnId);
    if (!targetCustomer) {
      alert("Fout: Geselecteerde klant bestaat niet!");
      return;
    }

    // RULE VERIFICATION: "Wanneer de volledige naam & het BSN nummer nog niet beschikbaar zijn kun je de klant niet aanklikken."
    if (!targetCustomer.fullName || !targetCustomer.bsn) {
      alert("Fout: Deze klant heeft nog geen volledige naam en BSN nummer geregistreerd!");
      return;
    }

    const targetVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!targetVehicle) return;

    if (targetVehicle.stock <= 0) {
      alert("Fout: Dit voertuig is uitverkocht!");
      return;
    }

    const salespersonLabel = user ? `${user.globalName || user.username} (${user.id})` : "Perseus Manager";

    onAddSale({
      buyerDiscordId: targetCustomer.id,
      buyerName: targetCustomer.fullName,
      vehicleId: selectedVehicleId,
      vehicleName: targetVehicle.name,
      pricePaid: salePrice,
      salesperson: salespersonLabel,
      status: saleStatus,
    });

    onUpdateVehicleStock(selectedVehicleId, targetVehicle.stock - 1);
    setSaleSuccessMessage(`Succes: ${targetVehicle.name} (${saleStatus}) geregistreerd voor @${targetCustomer.fullName} door ${salespersonLabel}!`);
    setSelectedClientAndBsnId("");
    setSaleStatus("Besteld");

    setTimeout(() => setSaleSuccessMessage(null), 4000);
  };

  const handleCreateVehicleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!checkActionPermission()) return;
    if (!newBrand || !newName) {
      alert("Vul a.u.b. alle verplichte velden in.");
      return;
    }

    const defaultImg = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600";
     onAddVehicle({
      id: "v_" + Date.now(),
      brand: newBrand,
      name: newName,
      category: newCategory,
      price: newPrice,
      purchasePrice: newPurchasePrice,
      stock: newStock,
      topSpeedStock: newTopSpeedStock,
      topSpeedTuned: newTopSpeedTuned,
      inzittenden: newInzittenden,
      description: newDescription || "Geen beschrijving beschikbaar.",
      image: newImage || defaultImg,
      isSoldOut: false,
    });

    setShowAddForm(false);
    // Reset inputs
    setNewBrand("");
    setNewName("");
    setNewDescription("");
    setNewImage("");
    setNewPrice(150000);
    setNewPurchasePrice(100000);
    setNewStock(3);
    setNewTopSpeedStock(180);
    setNewTopSpeedTuned(240);
    setNewInzittenden(2);
  };

  // Styles
  const textPrimary = isDarkMode ? "text-[#f6f6f7]" : "text-[#060607]";
  const textSecondary = isDarkMode ? "text-[#dcddde]" : "text-[#2e3338]";
  const textMuted = isDarkMode ? "text-[#949ba4]" : "text-[#4f5660]";
  const bgCard = isDarkMode ? "bg-[#2b2d31] border border-white/5 shadow-xl" : "bg-[#f2f3f5] border border-neutral-200/50";
  const borderCard = isDarkMode ? "border-white/5" : "border-[#e3e5e8]";

  // Login check for medewerker
  if (!user || (user.role !== "Medewerker" && !user.isCoordinator)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-8 rounded-xl ${bgCard} border ${borderCard} shadow-xl space-y-6`}>
          <div className="w-16 h-16 bg-[#A87E43]/15 text-[#A87E43] rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className={`text-xl font-extrabold ${textPrimary} tracking-tight`}>Medewerkerpaneel Beveiliging</h3>
            <p className={`text-xs ${textMuted} max-w-sm mx-auto`}>Dit paneel is uitsluitend toegankelijk voor geautoriseerde verkoopmedewerkers en directieleden.</p>
          </div>
          <button onClick={() => onStartOAuth("medewerkerpaneel")} className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold rounded-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center gap-2 mx-auto cursor-pointer">
            Inloggen met Discord
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  // Search Select Options definitions
  const customerOptions = customers.map(c => {
    const isEligible = !!(c.fullName && c.bsn);
    return {
      value: c.id,
      label: `Discord ID: ${c.id} | ${c.fullName || "Naam incompleet"} (BSN: ${c.bsn || "BSN incompleet"})`,
      disabled: !isEligible
    };
  });

  const vehicleOptions = vehicles.map(v => {
    const isSoldOut = v.isSoldOut || v.stock <= 0;
    return {
      value: v.id,
      label: `${v.brand} ${v.name} (${isSoldOut ? "Uitverkocht" : `${v.stock} op voorraad`})`,
      disabled: isSoldOut
    };
  });

  // Filter customers for searching
  const filteredCustomers = customers.filter(c => 
    c.globalName.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.id.includes(customerSearch)
  );

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);
  const selectedCustomerPurchases = sales.filter(s => s.buyerDiscordId === selectedCustomerId);
  const selectedCustomerSpend = selectedCustomerPurchases.reduce((acc, p) => acc + p.pricePaid, 0);
  const selectedCustomerTier = selectedCustomerObj ? getCustomerTier(selectedCustomerPurchases.length, selectedCustomerSpend) : null;

  // Group sales by salesperson for commission logic
  const salespersonList = Array.from(new Set(sales.map(s => s.salesperson)));

  const tabClass = (tab: typeof activeTab) => 
    `px-4 py-2 text-xs font-black uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-2 ${
      activeTab === tab 
        ? "bg-[#A87E43] text-black shadow-md border-transparent" 
        : isDarkMode 
        ? "text-neutral-300 hover:bg-neutral-800 border-transparent" 
        : "text-neutral-700 hover:bg-neutral-200 border-transparent"
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Greetings Block */}
      <div className={`p-5 rounded-xl ${bgCard} border ${borderCard} flex flex-col sm:flex-row items-center justify-between gap-4`}>
        <div className="flex items-center gap-3 text-center sm:text-left flex-col sm:flex-row">
          <img src={user.avatar || ""} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-[#A87E43] object-cover bg-neutral-900" referrerPolicy="no-referrer" />
          <div>
            <h2 className={`text-base font-extrabold ${textPrimary}`}>Medewerkers-Dashboard Perseus</h2>
            <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Welkom back, {user.globalName || user.username} ({user.discordRoleName || "Verkoopmedewerker"})</p>
          </div>
        </div>
        <div className="text-xs font-semibold text-[#A87E43] flex items-center gap-1">
          <Sparkles className="w-4 h-4" /> Live Verkoop-Omgeving
        </div>
      </div>

      {isCoordinator && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-3 text-amber-500 shadow-sm animate-fade-in select-none">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-extrabold uppercase tracking-wider mb-1">Coördinator Kijk-modus Actief</h4>
            <p className="text-amber-500/80 leading-relaxed">
              Omdat u bent ingelogd met de <strong>Coördinator</strong> rol, bezit u alleen <strong>tijdelijke kijk-rechten</strong>. 
              U heeft volledige lees-toegang om gegevens in te zien, maar u kunt geen nieuwe auto&apos;s toevoegen, verkopen registreren of gegevens muteren.
            </p>
          </div>
        </div>
      )}

      {/* Sub-navigation tabs */}
      <div className={`flex flex-wrap gap-2 p-1.5 rounded-lg ${isDarkMode ? "bg-black/35" : "bg-neutral-100"}`}>
        <button onClick={() => setActiveTab("verkoop")} className={tabClass("verkoop")}><FilePlus className="w-4 h-4" /> Verkoopregistratie</button>
        <button onClick={() => setActiveTab("klanten")} className={tabClass("klanten")}><Users className="w-4 h-4" /> Klantenbestand</button>
        <button onClick={() => setActiveTab("catalogus")} className={tabClass("catalogus")}><Car className="w-4 h-4" /> Catalogus Beheer</button>
        <button onClick={() => setActiveTab("financieel")} className={tabClass("financieel")}><Landmark className="w-4 h-4" /> Financieel Beheer</button>
        {isOwner && (
          <button onClick={() => setActiveTab("administratie")} className={tabClass("administratie")}><Lock className="w-4 h-4" /> Website Administratie</button>
        )}
      </div>

      {/* Tab contents panel */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-6">
          
          {/* 1. VERKOOPREGISTRATIE */}
          {activeTab === "verkoop" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Registration Form */}
              <div className={`lg:col-span-6 p-6 rounded-xl ${bgCard} border ${borderCard} shadow-md space-y-4`}>
                <h3 className={`text-base font-black ${textPrimary} inline-flex items-center gap-2 border-b border-[#A87E43]/20 pb-2.5 w-full`}><FilePlus className="w-5 h-5 text-[#A87E43]" /> Nieuwe Verkoop Registreren</h3>
                <p className={`text-[11px] ${textMuted}`}>Selecteer een bestaande klant en een auto uit het wagenpark. De verkoopprijs wordt automatisch ingevoerd.</p>
                {saleSuccessMessage && <div className="p-3 bg-green-500/15 border border-green-500/30 text-green-400 font-bold rounded text-xs leading-relaxed">{saleSuccessMessage}</div>}
                
                <form onSubmit={handleRegisterSaleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-[10px] uppercase font-bold ${textMuted} mb-1`}>Klant</label>
                      <SearchableSelect
                        options={customerOptions}
                        value={selectedClientAndBsnId}
                        onChange={(val) => setSelectedClientAndBsnId(val)}
                        placeholder="-- Kies een geregistreerde klant --"
                        isDarkMode={isDarkMode}
                      />
                      <span className="text-[10px] text-gray-500 block mt-1 leading-normal">
                        Let op: Klanten zonder geregistreerde volledige naam of BSN zijn niet te selecteren.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-[10px] uppercase font-bold ${textMuted} mb-1`}>Auto</label>
                        <SearchableSelect
                          options={vehicleOptions}
                          value={selectedVehicleId}
                          onChange={(val) => handleVehicleSelectChange(val)}
                          placeholder="-- Kies een import auto --"
                          isDarkMode={isDarkMode}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] uppercase font-bold ${textMuted} mb-1`}>Verkoopprijs (Automatisch ingevoerd)</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={formatPrice(salePrice)} 
                          className={`w-full px-3 py-2 border rounded outline-hidden ${isDarkMode ? "bg-[#2a2d31] border-white/10 text-amber-400" : "bg-zinc-100 border-[#e3e5e8] text-amber-800"} font-extrabold`} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-[10px] uppercase font-bold ${textMuted} mb-1`}>Verkoper (Ingelogde Medewerker)</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={user ? `${user.globalName || user.username} (${user.id})` : "Perseus Manager"} 
                          className={`w-full px-3 py-2 border rounded outline-hidden ${isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde] focus:border-[#A87E43]" : "bg-white border-[#e3e5e8]"} text-xs font-semibold select-all`} 
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] uppercase font-bold ${textMuted} mb-1`}>Verkoopstatus</label>
                        <select 
                          required
                          value={saleStatus} 
                          onChange={(e) => setSaleStatus(e.target.value as any)} 
                          className={`w-full px-3 py-2 border rounded outline-hidden ${isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde] focus:border-[#A87E43]" : "bg-white border-[#e3e5e8]"} text-xs`}
                        >
                          <option value="Gereserveerd">Gereserveerd</option>
                          <option value="Besteld">Besteld</option>
                          <option value="Betaald">Betaald</option>
                          <option value="Opgehaald">Opgehaald</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isCoordinator}
                    className={`w-full mt-4 py-2.5 text-black text-xs font-black uppercase rounded-lg transition-transform ${
                      isCoordinator 
                        ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed" 
                        : "bg-[#A87E43] hover:bg-[#926b34] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-md"
                    } flex items-center justify-center gap-1.5`}
                  >
                    {isCoordinator ? "Registratie Uitgeschakeld (Kijk-modus)" : "Bestelling Plaatsen & Registreren"}
                  </button>
                </form>
              </div>

              {/* Recent registered sales/purchases */}
              <div className={`lg:col-span-6 p-6 rounded-xl ${bgCard} border ${borderCard} shadow-md space-y-4`}>
                <h3 className={`text-base font-black ${textPrimary} inline-flex items-center gap-2 border-b border-[#A87E43]/20 pb-2.5 w-full`}><Receipt className="w-5 h-5 text-[#A87E43]" /> Recente Bestellingen & Reserveringen</h3>
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black/10 [&::-webkit-scrollbar-thumb]:bg-[#A87E43]/40 [&::-webkit-scrollbar-thumb]:rounded-md">
                  {sales.length > 0 ? (
                    sales.map(sale => {
                      return (
                        <div key={sale.id} className="p-3.5 rounded-lg bg-black/15 border-l-2 border-[#A87E43] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white">{sale.buyerName}</span>
                              <span className="text-[10px] text-gray-500 font-mono">ID: {sale.buyerDiscordId}</span>
                            </div>
                            <p className="text-gray-300 font-bold">{sale.vehicleName}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                              <span>Verkoper: <strong className="text-zinc-300">{sale.salesperson}</strong></span>
                              <span>•</span>
                              <span>Datum: <strong className="text-zinc-300">{sale.date}</strong></span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                            <span className="text-amber-400 font-extrabold font-sans text-xs">{formatPrice(sale.pricePaid)}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                              sale.status === "Opgehaald" ? "bg-green-500/10 text-green-400" :
                              sale.status === "Betaald" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" :
                              sale.status === "Besteld" ? "bg-blue-500/15 text-blue-400" :
                              "bg-amber-500/15 text-amber-400"
                            }`}>
                              {sale.status || "In Behandeling"}
                            </span>
                            {confirmDeleteSaleId === sale.id ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[9px] text-rose-400 font-bold">Zeker?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (checkActionPermission()) {
                                      onDeleteSale(sale.id);
                                      setConfirmDeleteSaleId(null);
                                    }
                                  }}
                                  className="text-[9px] bg-rose-600 hover:bg-rose-700 text-white font-black px-2 py-0.5 rounded cursor-pointer"
                                >
                                  Ja
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteSaleId(null)}
                                  className="text-[9px] bg-zinc-600 hover:bg-zinc-700 text-white font-black px-2 py-0.5 rounded cursor-pointer"
                                >
                                  Nee
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSaleId(sale.id)}
                                className="text-[10px] text-rose-500 hover:text-rose-400 flex items-center gap-1.5 mt-1 cursor-pointer hover:underline"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Verwijderen
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className={`text-xs ${textMuted} text-center py-8`}>Er zijn geen recente bestellingen of reserveringen geregistreerd.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. KLANTENBESTAND */}
          {activeTab === "klanten" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Customer Directory List */}
              <div className={`lg:col-span-5 p-5 rounded-xl ${bgCard} border ${borderCard} space-y-4`}>
                <div className="flex items-center justify-between border-b border-[#A87E43]/20 pb-2.5">
                  <h3 className={`text-base font-black ${textPrimary} flex items-center gap-2`}><Users className="w-5 h-5 text-[#A87E43]" /> Klantendatabase</h3>
                </div>
                <div className="relative">
                  <input type="text" placeholder="Zoek op Discord ID of Naam..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className={`w-full px-3 py-2 text-xs rounded border outline-hidden ${isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde] focus:border-[#A87E43]" : "bg-white border-[#e3e5e8]"}`} />
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => {
                      const cPurchases = sales.filter(s => s.buyerDiscordId === c.id);
                      const cSpend = cPurchases.reduce((acc, p) => acc + p.pricePaid, 0);
                      const cTier = getCustomerTier(cPurchases.length, cSpend);
                      return (
                        <div key={c.id} onClick={() => setSelectedCustomerId(c.id)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${selectedCustomerId === c.id ? "bg-[#A87E43]/10 border-[#A87E43]" : "bg-black/10 border-transparent hover:border-white/5"}`}>
                          <div className="flex items-center gap-2.5 text-xs">
                            {c.avatar ? <img src={c.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" /> : <div className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs font-black">@</div>}
                            <div>
                              <strong className={`${textPrimary} block text-xs font-semibold`}>
                                {c.fullName ? c.fullName : <span className="text-amber-400/70 font-normal italic">In-character naam niet ingesteld</span>}
                              </strong>
                              <span className="text-[10px] text-gray-400 block mt-0.5 font-medium">
                                Discord: <span className="font-bold text-gray-300">{c.globalName || c.username}</span> (@{c.username || "onbekend"})
                              </span>
                              <span className="text-[9px] text-gray-500 font-mono block">ID: {c.id}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 mt-1 rounded-xs inline-block uppercase font-bold tracking-wider ${cTier.color}`}>
                                {cTier.name}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-sm font-black uppercase ${c.hasLoggedIn ? "bg-green-500/10 text-green-400" : "bg-rose-500/10 text-rose-400"}`}>
                            {c.hasLoggedIn ? "Ingelogd" : "Niet Ingelogd"}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className={`text-xs ${textMuted} text-center py-4`}>Geen klanten gevonden.</p>
                  )}
                </div>
              </div>

              {/* Selected Customer purchases details */}
              <div className={`lg:col-span-7 p-5 rounded-xl ${bgCard} border ${borderCard} space-y-4`}>
                {selectedCustomerObj && selectedCustomerTier ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                        <div className="flex items-center gap-3">
                          {selectedCustomerObj.avatar ? <img src={selectedCustomerObj.avatar} className="w-12 h-12 rounded-full border border-[#A87E43] shrink-0" /> : <div className="w-12 h-12 rounded-full bg-neutral-800 border border-[#A87E43] text-[#A87E43] flex items-center justify-center text-lg font-black">@</div>}
                          <div>
                            <h4 className={`text-base font-black ${textPrimary}`}>
                              {selectedCustomerObj.fullName || "Geen Karakter Naam ingesteld"}
                            </h4>
                            <p className="text-xs text-neutral-400 font-medium">
                              Discord: <span className="font-bold text-neutral-300">{selectedCustomerObj.globalName || selectedCustomerObj.username}</span> (@{selectedCustomerObj.username || "onbekend"})
                            </p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-xs mt-1.5 inline-block font-extrabold uppercase ${selectedCustomerObj.hasLoggedIn ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                              {selectedCustomerObj.hasLoggedIn ? "Verifieerbaar: Kan bestellen" : "Geblokkeerd: Moet inloggen"}
                            </span>
                          </div>
                        </div>
                        <div className={`text-right text-[11px] ${textMuted} space-y-1`}>
                          <p>Klant sinds: {selectedCustomerObj.registrationDate}</p>
                        </div>
                      </div>

                      {/* Customer Type / Badge */}
                      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode ? "bg-black/15 border-white/5" : "bg-white border-neutral-200"}`}>
                        <div>
                          <span className={`${textMuted} text-[10px] uppercase font-black block tracking-wider mb-0.5`}>Type Klant</span>
                          <strong className={`${textPrimary} text-base font-extrabold tracking-tight`}>{selectedCustomerTier.name}</strong>
                          <span className="text-[10px] block text-gray-400 leading-normal mt-0.5">Dynamisch berekend op basis van aankopen en uitgaven.</span>
                        </div>
                        <span className={`px-3 py-1.5 text-[10px] rounded uppercase font-extrabold text-center shrink-0 self-start sm:self-center ${selectedCustomerTier.color}`}>
                          {selectedCustomerTier.label}
                        </span>
                      </div>

                      {/* Display Core Identity Information: Naam, BSN, Geboortedatum */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold uppercase text-[#A87E43] tracking-widest">Klant Gegevens</h5>
                        <div className={`p-4 rounded-lg ${isDarkMode ? "bg-black/15 border-white/5" : "bg-white border-neutral-200"} border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs`}>
                          <div>
                            <span className={`${textMuted} uppercase text-[9px] block font-bold mb-0.5`}>Volledige Naam</span>
                            <strong className={`${textPrimary} text-xs font-extrabold`}>{selectedCustomerObj.fullName || "Niet geregistreerd"}</strong>
                          </div>
                          <div>
                            <span className={`${textMuted} uppercase text-[9px] block font-bold mb-0.5`}>BSN-Nummer</span>
                            <strong className={`${textPrimary} font-mono text-xs`}>{selectedCustomerObj.bsn || "Niet geregistreerd"}</strong>
                          </div>
                          <div>
                            <span className={`${textMuted} uppercase text-[9px] block font-bold mb-0.5`}>Geboortedatum</span>
                            <strong className={`${textPrimary} text-xs`}>{selectedCustomerObj.birthDate || "Niet geregistreerd"}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Option to Edit Customer Details */}
                      <div className="pt-2">
                        {editingCustomerFields && editingCustomerFields.id === selectedCustomerObj.id ? (
                          <form onSubmit={handleSaveCustomerDetails} className="p-4 rounded-lg bg-[#A87E43]/5 border border-[#A87E43]/30 space-y-4 text-xs">
                            <h5 className="font-extrabold text-[#A87E43] uppercase tracking-wider text-[11px] flex items-center gap-1">
                              <Edit className="w-4 h-4" /> Wijzig Klantgegevens
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className={`block text-[10px] uppercase font-bold ${textMuted} mb-1`}>Volledige Naam</label>
                                <input 
                                  type="text" 
                                  value={editingCustomerFields.fullName} 
                                  onChange={(e) => setEditingCustomerFields({ ...editingCustomerFields, fullName: e.target.value })} 
                                  className={`w-full px-3 py-2 border rounded outline-hidden ${isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde] focus:border-[#A87E43]" : "bg-white border-[#e3e5e8]"} text-xs`}
                                  required
                                />
                              </div>
                              <div>
                                <label className={`block text-[10px] uppercase font-bold ${textMuted} mb-1`}>BSN-Nummer</label>
                                <input 
                                  type="text" 
                                  value={editingCustomerFields.bsn} 
                                  onChange={(e) => setEditingCustomerFields({ ...editingCustomerFields, bsn: e.target.value })} 
                                  className={`w-full px-3 py-2 border rounded outline-hidden ${isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde] focus:border-[#A87E43]" : "bg-white border-[#e3e5e8]"} text-xs`}
                                  required
                                />
                              </div>
                              <div>
                                <label className={`block text-[10px] uppercase font-bold ${textMuted} mb-1`}>Geboortedatum</label>
                                <input 
                                  type="date" 
                                  value={editingCustomerFields.birthDate} 
                                  onChange={(e) => setEditingCustomerFields({ ...editingCustomerFields, birthDate: e.target.value })} 
                                  className={`w-full px-3 py-2 border rounded outline-hidden ${isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde] focus:border-[#A87E43]" : "bg-white border-[#e3e5e8]"} text-xs`}
                                  required
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                type="submit" 
                                disabled={isCoordinator}
                                className={`px-4 py-2 text-xs font-black uppercase rounded transition-colors ${
                                  isCoordinator 
                                    ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed" 
                                    : "bg-green-500 hover:bg-green-600 text-black cursor-pointer"
                                }`}
                              >
                                {isCoordinator ? "Opslaan Uitgeschakeld" : "Opslaan"}
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setEditingCustomerFields(null)} 
                                className={`px-4 py-2 ${isDarkMode ? "bg-neutral-800 text-white" : "bg-neutral-300 text-black"} text-xs font-black uppercase rounded transition-colors cursor-pointer`}
                              >
                                Annuleren
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between w-full gap-4 mt-2">
                            <div>
                              {confirmDeleteCustomerId === selectedCustomerObj.id ? (
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                                  <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-wider">Zeker weten?</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (checkActionPermission()) {
                                        onDeleteCustomer(selectedCustomerObj.id);
                                        setConfirmDeleteCustomerId(null);
                                        setSelectedCustomerId("");
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase rounded cursor-pointer transition-colors shadow-sm"
                                  >
                                    Ja, verwijder
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteCustomerId(null)}
                                    className="px-2.5 py-1 bg-zinc-600 hover:bg-zinc-700 text-white text-[10px] font-black uppercase rounded cursor-pointer transition-colors"
                                  >
                                    Nee
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCustomerId(selectedCustomerObj.id)}
                                  className="px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 text-xs font-black uppercase rounded-lg flex items-center gap-1.5 transition-all hover:-translate-y-0.5 cursor-pointer shadow-md"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Klant Verwijderen
                                </button>
                              )}
                            </div>

                            {selectedCustomerObj.hasLoggedIn ? (
                              <button 
                                onClick={() => {
                                  if (checkActionPermission()) {
                                    setEditingCustomerFields({
                                      id: selectedCustomerObj.id,
                                      fullName: selectedCustomerObj.fullName || "",
                                      bsn: selectedCustomerObj.bsn || "",
                                      birthDate: selectedCustomerObj.birthDate || ""
                                    });
                                  }
                                }}
                                className="px-4 py-2 bg-[#A87E43] hover:bg-[#926b34] text-black text-xs font-black uppercase rounded-lg flex items-center gap-1.5 transition-transform hover:-translate-y-0.5 cursor-pointer shadow-md"
                              >
                                <Edit className="w-3.5 h-3.5" /> Gegevens Aanpassen
                              </button>
                            ) : (
                              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-500 font-bold flex items-center gap-2 max-w-sm">
                                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Bewerken kan pas zodra de klant minimaal één keer heeft aangemeld.</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-xs font-bold uppercase text-[#A87E43] tracking-widest flex items-center gap-2">
                          <Receipt className="w-4 h-4" /> Geregistreerde Aankopen ({selectedCustomerPurchases.length})
                        </h5>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {selectedCustomerPurchases.length > 0 ? (
                            selectedCustomerPurchases.map(sale => (
                              <div key={sale.id} className="p-3 bg-black/20 rounded-lg border border-white/5 flex justify-between items-center text-xs">
                                <div>
                                  <span className={`font-extrabold ${textPrimary} block`}>{sale.vehicleName}</span>
                                  <span className="text-[10px] text-gray-500">Transactie-datum: {sale.date}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[#A87E43] font-black">{formatPrice(sale.pricePaid)}</span>
                                  <span className="text-[9px] text-gray-500 block font-mono">Medewerker: {sale.salesperson}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center bg-black/10 rounded-lg border border-dashed border-white/5">
                              <p className="text-xs text-gray-500">Deze klant heeft nog geen voertuigen besteld of afgerekend.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                ) : (
                  <p className={`text-xs ${textMuted} text-center py-12`}>Selecteer een klant uit het linkerbestand om de aankoophistorie te bekijken.</p>
                )}
              </div>
            </div>
          )}

          {/* 3. CATALOGUS BEHEER */}
          {activeTab === "catalogus" && (
            <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} shadow-md space-y-4 relative overflow-hidden`}>
              {!isManagerOrOwner && (
                <div className="absolute inset-0 bg-[#1e1f22]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
                  <Lock className="w-12 h-12 text-[#A87E43] bg-[#A87E43]/15 p-2.5 rounded-full" />
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Management Toegang Vereist</h4>
                    <p className="text-[11px] text-[#949ba4] max-w-sm mt-1">U dient lid te zijn van de directie of het management team om catalogusprijzen, voorraden, of nieuwe voertuigen te bewerken.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#A87E43]/20 pb-3 gap-3">
                <h3 className={`text-base font-black ${textPrimary} flex items-center gap-2`}><Car className="w-5 h-5 text-[#A87E43]" /> Voorraad- & Catalogusbeheer</h3>
                <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2 bg-[#A87E43] hover:bg-[#926b34] text-black font-extrabold text-[11px] uppercase tracking-wider rounded-md flex items-center gap-1.5 cursor-pointer">
                  <PlusCircle className="w-4 h-4" /> {showAddForm ? "Sluit formulier" : "Nieuwe Auto Toevoegen"}
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleCreateVehicleSubmit} className="p-4 bg-black/25 rounded-lg border border-[#A87E43]/30 space-y-4 text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wide">Nieuwe Import Auto Registreren</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-gray-400 mb-1 font-bold">Merk</label>
                      <input type="text" required value={newBrand} onChange={(e)=>setNewBrand(e.target.value)} placeholder="v.b. Pegassi" className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-bold">Modelnaam</label>
                      <input type="text" required value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="v.b. Osiris S" className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-bold">Categorie</label>
                      <select value={newCategory} onChange={(e:any)=>setNewCategory(e.target.value)} className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white">
                        <option value="Super">Super</option>
                        <option value="Sports">Sports</option>
                        <option value="SUV/Off-Road">SUV/Off-Road</option>
                        <option value="Classic">Classic</option>
                        <option value="Overige">Overige</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-bold">Verkoopprijs (€)</label>
                      <input type="number" required value={newPrice} onChange={(e)=>setNewPrice(Number(e.target.value))} className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-gray-400 mb-1 font-bold">Inkoopprijs (€)</label>
                      <input type="number" required value={newPurchasePrice} onChange={(e)=>setNewPurchasePrice(Number(e.target.value))} className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-bold">Beginvoorraad (Stock)</label>
                      <input type="number" value={newStock} onChange={(e)=>setNewStock(Number(e.target.value))} className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-bold">Inzittenden</label>
                      <input type="number" min={1} max={20} required value={newInzittenden} onChange={(e)=>setNewInzittenden(Number(e.target.value))} className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-bold">Topsnelheid Stock (km/h)</label>
                      <input type="number" value={newTopSpeedStock} onChange={(e)=>setNewTopSpeedStock(Number(e.target.value))} className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-bold">Topsnelheid Tuned (km/h)</label>
                      <input type="number" value={newTopSpeedTuned} onChange={(e)=>setNewTopSpeedTuned(Number(e.target.value))} className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 font-bold">Afbeelding URL</label>
                    <input type="text" value={newImage} onChange={(e)=>setNewImage(e.target.value)} placeholder="https://..." className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 font-bold">Beschrijving</label>
                    <textarea value={newDescription} onChange={(e)=>setNewDescription(e.target.value)} placeholder="Unieke in-character details..." rows={2} className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white" />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isCoordinator}
                    className={`px-5 py-2.5 font-black uppercase rounded text-xs transition-colors ${
                      isCoordinator 
                        ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed" 
                        : "bg-green-500 hover:bg-green-600 text-black cursor-pointer"
                    }`}
                  >
                    {isCoordinator ? "Publiceren Uitgeschakeld (Kijk-modus)" : "In Catalogus Publiceren"}
                  </button>
                </form>
              )}

              {/* Core Stock Modifier list / Edit Car */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {vehicles.map(v => {
                  const outOfStock = v.isSoldOut || v.stock <= 0;
                  return (
                    <div key={v.id} className={`p-4 rounded-lg bg-black/15 border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#A87E43]/40 transition-all ${outOfStock ? 'border-rose-500/20 bg-rose-500/5 opacity-80' : 'border-white/5'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-[#A87E43]">{v.brand}</span>
                          {outOfStock && (
                            <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.2 rounded font-black uppercase">Uitverkocht</span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-white">{v.name}</h4>
                        <div className="text-[10px] text-gray-500 space-y-0.5 mt-0.5">
                          <p>Verkoopprijs: <strong className="text-white">{formatPrice(v.price)}</strong> | Inkoopprijs: <strong className="text-gray-300">{formatPrice(v.purchasePrice || 0)}</strong></p>
                          <p>Categorie: <strong className="text-gray-400">{v.category}</strong> | Topsnelheid Stock: <strong className="text-gray-400">{v.topSpeedStock || 0} km/h</strong> | Tuned: <strong className="text-gray-400">{v.topSpeedTuned || 0} km/h</strong></p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                        {/* Stock controls */}
                        <div className="flex items-center gap-1.5 bg-black/45 rounded-md px-1.5 py-1">
                          <button type="button" onClick={() => { if (checkActionPermission()) onUpdateVehicleStock(v.id, Math.max(0, v.stock - 1)); }} className="p-1 hover:text-white transition-colors cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="text-xs font-black text-white min-w-[20px] text-center">{v.stock}</span>
                          <button type="button" onClick={() => { if (checkActionPermission()) onUpdateVehicleStock(v.id, v.stock + 1); }} className="p-1 hover:text-white transition-colors cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                        </div>

                        {/* Soldout Toggle */}
                        <button
                          type="button"
                          onClick={() => { if (checkActionPermission()) onEditVehicle({ ...v, isSoldOut: !v.isSoldOut }); }}
                          className={`px-2 py-1 font-bold text-[9px] uppercase rounded transition-all cursor-pointer ${
                            v.isSoldOut 
                              ? 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30' 
                              : 'bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-black border border-rose-500/30'
                          }`}
                        >
                          {v.isSoldOut ? "Als Verkrijgbaar" : "Uitverkocht toggle"}
                        </button>

                        {/* Advanced Edit Modal Trigger */}
                        <button 
                          type="button"
                          onClick={() => setEditingVehicle(v)} 
                          className="px-2 py-1 bg-blue-500/15 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 font-bold text-[9px] uppercase rounded transition-all cursor-pointer"
                        >
                          Bewerken
                        </button>

                        {/* Delete */}
                        {confirmDeleteVehicleId === v.id ? (
                          <div className="flex items-center gap-1 bg-red-600/10 border border-red-500/20 rounded px-2 py-1">
                            <span className="text-[9px] text-red-400 font-bold mr-1">Wissen?</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (checkActionPermission()) {
                                  onDeleteVehicle(v.id);
                                  setConfirmDeleteVehicleId(null);
                                }
                              }}
                              className="text-[9px] bg-red-600 hover:bg-red-700 text-white font-black px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              Ja
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteVehicleId(null)}
                              className="text-[9px] bg-zinc-600 hover:bg-zinc-700 text-white font-black px-1.5 py-0.5 rounded cursor-pointer ml-1"
                            >
                              Nee
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => setConfirmDeleteVehicleId(v.id)} 
                            className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 font-bold text-[9px] uppercase rounded transition-all cursor-pointer"
                          >
                            Verwijderen
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* VEHICLE EDIT MODAL */}
              <AnimatePresence>
                {editingVehicle && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className={`w-full max-w-2xl rounded-xl shadow-2xl p-6 border ${borderCard} ${
                        isDarkMode ? "bg-[#2f3136]" : "bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-[#A87E43]/20 pb-3 mb-4">
                        <h3 className={`text-sm font-black ${textPrimary} uppercase tracking-wider`}>Voertuig Gegevens Aanpassen</h3>
                        <button
                          type="button"
                          onClick={() => setEditingVehicle(null)}
                          className="text-gray-400 hover:text-white text-sm"
                        >
                          ✕
                        </button>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (checkActionPermission()) {
                            onEditVehicle(editingVehicle);
                            setEditingVehicle(null);
                          }
                        }}
                        className="space-y-4 text-xs"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">Automerk</label>
                            <input
                              type="text"
                              required
                              value={editingVehicle.brand}
                              onChange={(e) => setEditingVehicle({ ...editingVehicle, brand: e.target.value })}
                              className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">Automodelnaam</label>
                            <input
                              type="text"
                              required
                              value={editingVehicle.name}
                              onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                              className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">Categorie</label>
                            <select
                              value={editingVehicle.category}
                              onChange={(e: any) => setEditingVehicle({ ...editingVehicle, category: e.target.value })}
                              className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white"
                            >
                              <option value="Super">Super</option>
                              <option value="Sports">Sports</option>
                              <option value="SUV/Off-Road">SUV/Off-Road</option>
                              <option value="Classic">Classic</option>
                              <option value="Overige">Overige</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">Verkoopprijs (€)</label>
                            <input
                              type="number"
                              required
                              value={editingVehicle.price}
                              onChange={(e) => setEditingVehicle({ ...editingVehicle, price: Number(e.target.value) })}
                              className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">Inkoopprijs (€)</label>
                            <input
                              type="number"
                              required
                              value={editingVehicle.purchasePrice || 0}
                              onChange={(e) => setEditingVehicle({ ...editingVehicle, purchasePrice: Number(e.target.value) })}
                              className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">Voorraad Status</label>
                            <input
                              type="number"
                              required
                              value={editingVehicle.stock}
                              onChange={(e) => setEditingVehicle({ ...editingVehicle, stock: Number(e.target.value) })}
                              className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">Inzittenden</label>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              required
                              value={editingVehicle.inzittenden}
                              onChange={(e) => setEditingVehicle({ ...editingVehicle, inzittenden: Number(e.target.value) })}
                              className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">Topsnelheid Stock</label>
                            <input
                              type="number"
                              required
                              value={editingVehicle.topSpeedStock || 0}
                              onChange={(e) => setEditingVehicle({ ...editingVehicle, topSpeedStock: Number(e.target.value) })}
                              className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">Topsnelheid Getuned</label>
                            <input
                              type="number"
                              required
                              value={editingVehicle.topSpeedTuned || 0}
                              onChange={(e) => setEditingVehicle({ ...editingVehicle, topSpeedTuned: Number(e.target.value) })}
                              className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">Afbeelding URL</label>
                          <input
                            type="text"
                            required
                            value={editingVehicle.image}
                            onChange={(e) => setEditingVehicle({ ...editingVehicle, image: e.target.value })}
                            className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">Beschrijving</label>
                          <textarea
                            rows={2}
                            value={editingVehicle.description}
                            onChange={(e) => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                            className="w-full p-2 bg-[#1e1f22] border border-white/5 rounded text-white"
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-[#A87E43]/20">
                          <button
                            type="button"
                            onClick={() => setEditingVehicle(null)}
                            className="px-4 py-2 bg-zinc-755 hover:bg-zinc-700 text-white font-bold rounded"
                          >
                            Annuleren
                          </button>
                          <button
                            type="submit"
                            disabled={isCoordinator}
                            className={`px-5 py-2 font-black uppercase rounded ${
                              isCoordinator
                                ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
                                : "bg-[#A87E43] hover:bg-[#926b34] text-black cursor-pointer"
                            }`}
                          >
                            {isCoordinator ? "Opslaan Uitgeschakeld" : "Wijzigingen opslaan"}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 4. FINANCIEEL BEHEER */}
          {activeTab === "financieel" && (
            <div className="space-y-6 relative overflow-hidden">
              {!(isManagerOrOwner || isCoordinator) && (
                <div className="absolute inset-0 bg-[#1e1f22]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
                  <Lock className="w-12 h-12 text-[#A87E43] bg-[#A87E43]/15 p-2.5 rounded-full" />
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Management Toegang Vereist</h4>
                    <p className="text-[11px] text-[#949ba4] max-w-sm mt-1">De financiële omzetcijfers en salaris-bon calculators zijn afgeschermd en enkel in te zien door Managers of Eigenaren.</p>
                  </div>
                </div>
              )}

              {/* Date selection filter */}
              <div className={`p-5 rounded-xl ${bgCard} border ${borderCard} flex flex-col sm:flex-row gap-4 items-end justify-between shadow-md`}>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>🗓️ Filter op Datum</span>
                  </h4>
                  <p className={`text-[11px] ${textMuted}`}>Selecteer een begindatum om de omzet, netto winst en salaris/commissie berekeningen vanaf die specifieke datum te filteren.</p>
                </div>
                <div className="flex gap-2 items-center w-full sm:w-auto">
                  <input 
                    type="date" 
                    value={financialStartDate} 
                    onChange={(e) => setFinancialStartDate(e.target.value)} 
                    className={`px-3 py-2 text-xs rounded border outline-hidden ${isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde] focus:border-[#A87E43]" : "bg-white border-[#e3e5e8]"} cursor-pointer font-bold`}
                  />
                  {financialStartDate && (
                    <button 
                      onClick={() => setFinancialStartDate("")} 
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded transition-all cursor-pointer whitespace-nowrap"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Financial Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className={`p-5 rounded-xl ${bgCard} border ${borderCard} shadow flex items-center justify-between`}>
                  <div>
                    <span className={`text-[10px] uppercase font-black tracking-wider ${textMuted} block`}>Totale Omzet (Inkomsten)</span>
                    <strong className="text-xl font-sans font-black text-green-400">
                      {formatPrice(filteredSalesForFinance.reduce((sum, s) => sum + s.pricePaid, 0))}
                    </strong>
                    {financialStartDate && <span className="text-[9px] text-gray-500 block">Vanaf: {financialStartDate}</span>}
                  </div>
                  <div className="w-10 h-10 bg-green-500/10 text-green-400 rounded-lg flex items-center justify-center"><Coins className="w-5 h-5" /></div>
                </div>
                <div className={`p-5 rounded-xl ${bgCard} border ${borderCard} shadow flex items-center justify-between`}>
                  <div>
                    <span className={`text-[10px] uppercase font-black tracking-wider ${textMuted} block`}>Dealership Netto Winst (25%)</span>
                    <strong className="text-xl font-sans font-black text-[#A87E43]">
                      {formatPrice(filteredSalesForFinance.reduce((sum, s) => sum + s.pricePaid, 0) * 0.25)}
                    </strong>
                    {financialStartDate && <span className="text-[9px] text-gray-500 block">Vanaf: {financialStartDate}</span>}
                  </div>
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
                </div>
                <div className={`p-5 rounded-xl ${bgCard} border ${borderCard} shadow flex items-center justify-between`}>
                  <div>
                    <span className={`text-[10px] uppercase font-black tracking-wider ${textMuted} block`}>Aantal Uitgevoerde Transacties</span>
                    <strong className={`text-xl font-black ${textPrimary}`}>{filteredSalesForFinance.length} Verkopen</strong>
                    {financialStartDate && <span className="text-[9px] text-gray-500 block">Vanaf: {financialStartDate}</span>}
                  </div>
                  <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center"><Receipt className="w-5 h-5" /></div>
                </div>
              </div>

              {/* Salary & commission calculator list */}
              <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} space-y-4 shadow-md`}>
                <div className="border-b border-[#A87E43]/20 pb-3">
                  <h3 className={`text-base font-black ${textPrimary} flex items-center gap-2`}><Calculator className="w-5 h-5 text-[#A87E43]" /> Medewerkers Salaris & Commissie Calculator</h3>
                  <p className={`text-[11px] ${textMuted} mt-0.5`}>Bereken de verdiensten van verkoopmedewerkers op basis van hun geregistreerde autoverkopen. Wijzig globale parameters direct.</p>
                </div>

                {/* Adjustments Panel */}
                <div className="p-4 bg-black/15 rounded-lg border border-white/5 text-xs">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex justify-between font-bold text-white">
                      <span>Provisie Tarief (Verkoop Commissie):</span>
                      <span className="text-[#A87E43]">{commissionRate}% van de nettowinst (verkoop - inkoop)</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="25" 
                      value={commissionRate} 
                      disabled={isCoordinator}
                      onChange={(e) => {
                        if (checkActionPermission()) {
                          setCommissionRate(Number(e.target.value));
                        }
                      }} 
                      className={`w-full text-[#A87E43] rounded accent-[#A87E43] ${isCoordinator ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`} 
                    />
                    <span className="text-[10px] text-gray-500 block leading-normal mt-1">
                      Medewerkers ontvangen geen vaste basisvergoeding, maar uitsluitend commissie over de winst van de door hen succesvol afgehandelde autoverkopen (Status: Betaald/Opgehaald).
                    </span>
                  </div>
                </div>

                {/* Salespersons Calculations Tables */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {Array.from(new Set(filteredSalesForFinance.map(s => s.salesperson))).length > 0 ? (
                    Array.from(new Set(filteredSalesForFinance.map(s => s.salesperson))).map(salesperson => {
                      const staffSales = filteredSalesForFinance.filter(s => s.salesperson === salesperson);
                      const staffTotalSalesVolume = staffSales.reduce((sum, s) => sum + s.pricePaid, 0);
                      const staffTotalProfit = staffSales.reduce((sum, s) => sum + getSaleProfit(s), 0);
                      const staffCommission = (staffTotalProfit * commissionRate) / 100;
                      const totalStaffPay = staffCommission;

                      return (
                        <div key={salesperson} className="p-4 rounded-lg bg-black/25 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                          <div className="space-y-1">
                            <strong className="text-white text-sm block">👤 {salesperson}</strong>
                            <span className="text-[10px] text-gray-500">
                              Volume: <strong className="text-white font-sans">{formatPrice(staffTotalSalesVolume)}</strong> | 
                              Winst: <strong className="text-[#A87E43] font-sans">{formatPrice(staffTotalProfit)}</strong> ({staffSales.length} verkopen)
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-left md:text-right">
                            <div>
                              <span className="text-[10px] text-gray-500 block font-bold">Commissie ({commissionRate}% winst)</span>
                              <strong className="text-white font-sans">{formatPrice(staffCommission)}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-green-400 font-bold block">Totaalloon</span>
                              <strong className="text-green-400 font-sans font-black">{formatPrice(totalStaffPay)}</strong>
                            </div>
                          </div>
                          <button onClick={() => setSelectedStaffPayslip(salesperson)} className="px-3 py-1.5 bg-[#A87E43]/15 hover:bg-[#A87E43] text-[#A87E43] hover:text-black font-extrabold text-[10px] uppercase rounded cursor-pointer shrink-0 transition-all">Salarisstrook</button>
                        </div>
                      );
                    })
                  ) : (
                    <p className={`text-xs ${textMuted} text-center py-6`}>Geen actieve verkopen gevonden binnen deze selectie.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. WEBSITE ADMINISTRATIE */}
          {activeTab === "administratie" && (
            <div className="space-y-6 relative overflow-hidden animate-fade-in text-xs">
              {!isOwner && (
                <div className="absolute inset-0 bg-[#1e1f22]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
                  <Lock className="w-12 h-12 text-[#A87E43] bg-[#A87E43]/15 p-2.5 rounded-full" />
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider font-sans">Eigenaar Toegang Toegestaan</h4>
                    <p className="text-[11px] text-[#949ba4] max-w-sm mt-1">U hebt geen rechten om deze pagina te bekijken. Alleen de eigenaar kan de website-administratie beheren.</p>
                  </div>
                </div>
              )}

              <div className={`p-6 rounded-xl ${bgCard} border ${borderCard} space-y-6 shadow-md`}>
                <div className="border-b border-[#A87E43]/20 pb-4">
                  <h3 className={`text-base font-black ${textPrimary} flex items-center gap-2`}><Lock className="w-5 h-5 text-[#A87E43]" /> Website Administratie & Databasekoppeling</h3>
                  <p className={`text-[11px] ${textMuted} mt-0.5`}>Koppel uw website veilig met Google Sheets. De server houdt al uw gegevens live gesynchroniseerd in de cloud.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
                  <form onSubmit={handleSaveGoogleConfig} className="lg:col-span-7 space-y-5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-[#A87E43] pl-2">1. Google Credentials</h4>

                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold text-[#A87E43]">Google Spreadsheet URL / Link</label>
                      <input 
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                        value={spreadsheetUrl}
                        onChange={(e) => setSpreadsheetUrl(e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded border outline-hidden ${isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde] focus:border-[#A87E43]" : "bg-white border-[#e3e5e8] focus:border-[#A87E43]"} font-medium`}
                        required
                      />
                      <p className="text-[10px] text-gray-500">
                        De link van uw spreadsheet dat gebruikt zal worden voor gegevensopslag (tabs &quot;Catalogus&quot;, &quot;Klanten&quot;, &quot;Verkopen&quot; worden automatisch aangemaakt).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-[#A87E43]">Google Client ID</label>
                        <input 
                          type="text"
                          placeholder="xxxxxxxxxx.apps.googleusercontent.com"
                          value={googleClientId}
                          onChange={(e) => setGoogleClientId(e.target.value)}
                          className={`w-full px-3 py-2 text-xs rounded border outline-hidden ${isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde] focus:border-[#A87E43]" : "bg-white border-[#e3e5e8] focus:border-[#A87E43]"} font-mono`}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-[#A87E43]">Google Client Secret</label>
                        <input 
                          type="password"
                          placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                          value={googleClientSecret}
                          onChange={(e) => setGoogleClientSecret(e.target.value)}
                          className={`w-full px-3 py-2 text-xs rounded border outline-hidden ${isDarkMode ? "bg-[#1e1f22] border-white/5 text-[#dcddde] focus:border-[#A87E43]" : "bg-white border-[#e3e5e8] focus:border-[#A87E43]"} font-mono`}
                          required
                        />
                      </div>
                    </div>

                    {saveMessage && (
                      <div className={`p-3 text-xs font-bold rounded ${saveMessage.error ? "bg-red-500/15 border border-red-500/30 text-red-400" : "bg-green-500/15 border border-green-500/30 text-green-400"}`}>
                        {saveMessage.text}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button 
                        type="submit" 
                        disabled={isSavingSpreadsheet}
                        className="px-4 py-2 bg-black/40 hover:bg-[#A87E43] hover:text-black text-[#A87E43] border border-[#A87E43]/40 hover:border-[#A87E43] font-extrabold uppercase rounded shadow transition-all cursor-pointer text-[10px]"
                      >
                        {isSavingSpreadsheet ? "Opslaan..." : "Wijzigingen Opslaan"}
                      </button>
                    </div>
                  </form>

                  <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-lg bg-black/15 border border-white/5 space-y-5">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 border-l-2 border-[#A87E43] pl-2">2. Systeem Status</h4>
                      
                      <div className="space-y-3 mt-4 text-[11px]">
                        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span className="text-gray-400">Google OAuth Connectie:</span>
                          {isConnected ? (
                            <span className="px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/30 font-bold uppercase rounded text-[9px] flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Verbonden
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 font-bold uppercase rounded text-[9px] flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Ontkoppeld
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span className="text-gray-400">Automatische Real-Time Auto-Sync:</span>
                          {isConnected && spreadsheetUrl ? (
                            <span className="px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/30 font-bold uppercase rounded text-[9px] flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Stand-by / Live Actief
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-neutral-500/15 text-neutral-400 border border-neutral-500/30 font-bold uppercase rounded text-[9px] flex items-center gap-1">
                              Inactief
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3">
                      <div className="flex flex-col gap-2">
                        {!isConnected ? (
                          <button 
                            type="button"
                            onClick={handleGoogleConnect}
                            className="w-full py-2 bg-[#A87E43] hover:bg-[#8e6933] text-black font-extrabold uppercase rounded shadow transition-all cursor-pointer text-[10px] text-center"
                          >
                            🔑 Koppel Google Account
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <button 
                              type="button"
                              onClick={handleForceSync}
                              disabled={isSyncing}
                              className="w-full py-2 bg-green-500/20 hover:bg-green-500 hover:text-black text-green-400 border border-green-500/40 font-extrabold uppercase rounded shadow transition-all cursor-pointer text-[10px] flex items-center justify-center gap-1"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                              {isSyncing ? "Synchroniseren..." : "Exporteren naar Spreadsheet"}
                            </button>

                            <button 
                              type="button"
                              onClick={handleImportFromGoogle}
                              disabled={isImporting}
                              className="w-full py-2 bg-[#A87E43]/20 hover:bg-[#A87E43] hover:text-black text-[#A87E43] border border-[#A87E43]/40 font-extrabold uppercase rounded shadow transition-all cursor-pointer text-[10px] flex items-center justify-center gap-1"
                            >
                              <Download className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
                              {isImporting ? "Inlezen..." : "Inlezen / Importeer uit Spreadsheet"}
                            </button>

                            <button 
                              type="button"
                              onClick={handleGoogleDisconnect}
                              className="w-full py-2 bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-extrabold uppercase rounded shadow transition-all cursor-pointer text-[10px] text-center"
                            >
                              Ontkoppelen van Google
                            </button>
                          </div>
                        )}
                      </div>

                      {syncResult && (
                        <div className={`p-2.5 text-[10px] font-bold rounded ${syncResult.error ? "bg-red-500/15 border border-red-500/30 text-red-400" : "bg-green-500/15 border border-green-500/30 text-green-400"}`}>
                          {syncResult.text}
                        </div>
                      )}

                      {importResult && (
                        <div className={`p-2.5 text-[10px] font-bold rounded ${importResult.error ? "bg-red-500/15 border border-red-500/30 text-red-400" : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"}`}>
                          {importResult.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#A87E43]/20 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 border-l-2 border-[#A87E43] pl-2">Handleiding: Google Cloud API Sleutels Maken (100% Gratis & Snel)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-[#dcddde] leading-relaxed">
                    <div className="p-3 bg-black/10 rounded-lg border border-white/5 space-y-1">
                      <strong className="text-xs text-[#A87E43] block">1. Maak Project aan</strong>
                      <p className="text-[10px] text-gray-400">
                        Ga naar de <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-[#A87E43] underline font-bold">Google Cloud Console</a>, maak een nieuw, volledig gratis project aan en schakel de <strong>Google Sheets API</strong> in via de API-bibliotheek.
                      </p>
                    </div>

                    <div className="p-3 bg-black/10 rounded-lg border border-white/5 space-y-1">
                      <strong className="text-xs text-[#A87E43] block">2. Configureer OAuth Consent&quot;</strong>
                      <p className="text-[10px] text-gray-400">
                        Ga naar &apos;OAuth consent screen&apos;, kies &apos;External&apos;, en geef uw app een willekeurige naam. Voeg de scope <code>.../auth/spreadsheets</code> toe en voeg uw eigen e-mailadres toe als testgebruiker.
                      </p>
                    </div>

                    <div className="p-3 bg-black/10 rounded-lg border border-white/5 space-y-1">
                      <strong className="text-xs text-[#A87E43] block">3. Genereer Credentials</strong>
                      <p className="text-[10px] text-gray-400">
                        Klik op &apos;Credentials&apos;, kies &apos;OAuth client ID&apos;, type &apos;Web Application&apos;. Voeg bij &apos;Authorized redirect URIs&apos; exact de link van deze website toe met het pad: <code>/api/dealership/google-auth-callback</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Salary payslip popup */}
      <AnimatePresence>
        {selectedStaffPayslip && (() => {
          const staffSales = filteredSalesForFinance.filter(s => s.salesperson === selectedStaffPayslip);
          const totalVolume = staffSales.reduce((sum, s) => sum + s.pricePaid, 0);
          const totalProfit = staffSales.reduce((sum, s) => sum + getSaleProfit(s), 0);
          const calculatedComm = (totalProfit * commissionRate) / 100;
          const calculatedTotal = calculatedComm;

          return (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className={`w-full max-w-lg p-6 rounded-xl ${isDarkMode ? "bg-[#2f3136]" : "bg-white"} border ${borderCard} space-y-6 text-xs`}>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5"><Receipt className="text-[#A87E43] w-4 h-4" /> Uitbetalingsbon / Salarisstrook</h4>
                  <button onClick={() => setSelectedStaffPayslip(null)} className="text-gray-400 hover:text-white uppercase font-bold text-[10px]">Sluit</button>
                </div>
                <div className="space-y-3 bg-black/25 p-4 rounded-lg font-mono text-gray-300">
                  <p className="border-b border-dashed border-white/10 pb-2 text-center text-white font-extrabold uppercase">=== PERSEUS AUTOMOTIVE SALARY ===</p>
                  <div>
                    <p>Medewerker: {selectedStaffPayslip}</p>
                    <p>Datum: {new Date().toISOString().split("T")[0]}</p>
                    {financialStartDate && <p>Periode: Vanaf {financialStartDate}</p>}
                    <p>Status: Geautoriseerd door {user?.globalName || user?.username}</p>
                  </div>
                  <div className="border-t border-dashed border-white/10 pt-2 space-y-1">
                    <p className="flex justify-between"><span>Verkopen volume:</span> <span>{formatPrice(totalVolume)} ({staffSales.length}x)</span></p>
                    <p className="flex justify-between"><span>Totale Nettowinst:</span> <span>{formatPrice(totalProfit)}</span></p>
                    <p className="flex justify-between text-[#A87E43] font-bold"><span>Commissie ({commissionRate}% winst):</span> <span>{formatPrice(calculatedComm)}</span></p>
                  </div>
                  <div className="border-t-2 border-dashed border-white/10 pt-2 flex justify-between font-black text-green-400 text-sm">
                    <span>NETTO SALARIS:</span> <span>{formatPrice(calculatedTotal)}</span>
                  </div>
                </div>
                <button onClick={() => { alert("Bon is virtueel uitgeprint en geregistreerd in de RP-logs!"); setSelectedStaffPayslip(null); }} className="w-full py-2 bg-[#A87E43] hover:bg-[#926b34] text-black font-extrabold uppercase rounded shadow transition-all cursor-pointer">Salaris Uitbetaling Bevestigen</button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
