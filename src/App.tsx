import React, { useState, useEffect } from 'react';
import { VEHICLES, PAINT_PRESETS, STAFF } from './data';
import { DISCORD_CONFIG } from './discordConfig';
import { Vehicle, Sale } from './types';
import TuningVisualizer from './components/TuningVisualizer';
import FinanceCalculator from './components/FinanceCalculator';
import ImportRequestHub from './components/ImportRequestHub';
import BookingCalendar from './components/BookingCalendar';
import StaffDirectory from './components/StaffDirectory';
import CompanyLogoImg from '../assets/CompanyLogo.png';

// Premium Logo for SOVEREIGN using uploaded asset
const CompanyLogo = () => (
  <img 
    src={CompanyLogoImg} 
    alt="Sovereign Logo" 
    className="w-12 h-12 object-contain select-none"
    referrerPolicy="no-referrer"
  />
);

const getBadgeColor = (badge?: string, fallbackColor?: string): string => {
  if (!badge) return '#f59e0b';
  const upper = badge.toUpperCase();
  const colors: Record<string, string> = {
    'NIEUW': '#3be866',
    'TIJDELIJK': '#3b6fe8',
    'BINNENKORT': '#d34a4a',
    'BODYKIT': '#4a53d3',
    'STAGED': '#a84ad3'
  };
  return colors[upper] || fallbackColor || '#f59e0b';
};

// Lucide Icons
import {
  Car,
  Landmark,
  Ship,
  Calendar,
  ShieldCheck,
  Search,
  Filter,
  Sparkles,
  Sliders,
  Gauge,
  Zap,
  Clock,
  ChevronRight,
  MapPin,
  ExternalLink,
  Cpu,
  Bookmark,
  Bell,
  Heart,
  Lock,
  Unlock,
  Users,
  CheckCircle,
  X,
  Trash2,
  TrendingUp,
  CreditCard,
  Building,
  LogOut,
  ChevronUp,
  FileText,
  PlusCircle,
  ClipboardList,
  Eye,
  Pencil,
  Sun,
  Moon,
  Key,
  Bot,
  Copy,
  Terminal,
  MessageSquare,
  Settings,
  Code,
  AlertCircle,
  Globe
} from 'lucide-react';

const TABS = [
  { id: 'catalog' as const, label: 'Catalogus', icon: Car },
  { id: 'employee' as const, label: 'Medewerkers login', icon: ShieldCheck }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'employee'>('catalog');
  const [activeCatalogSubView, setActiveCatalogSubView] = useState<'showroom' | 'tuner' | 'finance' | 'imports' | 'bookings' | 'staff' | null>(null);
  
  // Theme state dark and light mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('veloce_theme');
    return saved !== 'light'; // default to true (dark)
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextVal = !prev;
      localStorage.setItem('veloce_theme', nextVal ? 'dark' : 'light');
      return nextVal;
    });
  };
  
  // Simulated employee authentication with Discord login simulation
  const [isEmployeeLoggedIn, setIsEmployeeLoggedIn] = useState(false);
  const [employeeCallSign, setEmployeeCallSign] = useState('Luna Sterling');
  const [loginError, setLoginError] = useState('');
  const [activeEmployeeSubTab, setActiveEmployeeSubTab] = useState<'stock' | 'sales' | 'roster' | 'financials'>('stock');
  const [activeFinancesSubView, setActiveFinancesSubView] = useState<'overview' | 'payout_calculator'>('overview');
  const [activeAdminSubView, setActiveAdminSubView] = useState<'sales_history' | 'customer_database'>('sales_history');
  const [discordStaff, setDiscordStaff] = useState<any[]>(() => STAFF);
  const [selectedCalcEmployee, setSelectedCalcEmployee] = useState('Luna Sterling');

  useEffect(() => {
    let active = true;
    fetch('/api/discord/members')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError("Gevraagde gegevens zijn geen JSON formaat.");
        }
        return res.json();
      })
      .then(data => {
        if (active && data && Array.isArray(data.members) && data.members.length > 0) {
          const mapped = data.members.map((m: any) => ({
            name: m.displayName,
            role: m.role || 'Medewerker',
            discord: '@' + m.discordTag,
            phone: m.phone || 'Koppel Discord',
            status: m.status || 'Active',
            avatarUrl: m.avatarUrl || m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
          }));
          setDiscordStaff(mapped);
          
          const exists = mapped.some((st: any) => st.name === 'Luna Sterling');
          if (!exists) {
            setSelectedCalcEmployee(mapped[0].name);
          }
        }
      })
      .catch(err => {
        console.warn('Kon actieve Discord medewerkers niet inladen - gebruik kwalitatieve fallback data:', err);
      });
    return () => {
      active = false;
    };
  }, []);
  const [calcDate, setCalcDate] = useState('2026-05-01');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerBsn, setSelectedCustomerBsn] = useState<string | null>(null);
  const [customerStatuses, setCustomerStatuses] = useState<Record<string, { status: string; note: string }>>(() => {
    const saved = localStorage.getItem('veloce_customer_statuses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      'ORP-BSN-10029384': { status: 'Actief / Geautoriseerd', note: 'Trouwe klant, altijd snelle bank betalingen.' },
      'ORP-BSN-99827384': { status: 'VIP Status', note: 'Michael De Santa, belangrijk persoon in de stad, geef altijd VIP service.' },
      'ORP-BSN-11223344': { status: 'In Screening', note: 'Volgt momenteel achtergrond controle voor premium financiering.' },
      'ORP-BSN-55667788': { status: 'Actief / Geautoriseerd', note: 'Wade, koopt veel tuners. Geen problemen geconstateerd.' },
      'ORP-BSN-13374242': { status: 'VIP Status', note: 'Lester Crest, heeft zojuist een superjacht gekocht! Absolute prioriteit.' }
    };
  });

  const updateCustomerStatusInStorage = (bsn: string, status: string, note: string) => {
    const updated = { ...customerStatuses, [bsn]: { status, note } };
    setCustomerStatuses(updated);
    localStorage.setItem('veloce_customer_statuses', JSON.stringify(updated));
  };
  const [saleError, setSaleError] = useState('');
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [realDiscordUser, setRealDiscordUser] = useState<any>(null);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_COMPLETED') {
        setDiscordLoading(false);
        const payload = event.data.payload;
        if (!payload) return;

        if (payload.status === 'error') {
          if (payload.error === 'NOT_IN_GUILD') {
            setLoginError(
              `TOEGANG GEWEIGERD: Jouw Discord profiel (@${payload.user?.username || 'onbekend'}) is succesvol geverifieerd via OAuth2, maar je bent geen lid van de '${DISCORD_CONFIG.guildName}' Discord Server (ID: ${payload.guildId || DISCORD_CONFIG.guildId}).`
            );
          } else {
            setLoginError(`Discord OAuth Fout: ${payload.error}`);
          }
          return;
        }

        if (payload.status === 'success') {
          const user = payload.user;         
          const userRoles = payload.roles || []; 
          
          const allowedRoleIds = DISCORD_CONFIG.requiredRoles.map(r => r.roleId);
          const hasPermittedRole = userRoles.some((roleId: string) => allowedRoleIds.includes(roleId));

          if (hasPermittedRole) {
            setEmployeeCallSign(user.nickname || user.globalName || user.username);
            setRealDiscordUser({
              ...user,
              avatarUrl: user.avatar 
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                : null
            });
            setIsEmployeeLoggedIn(true);
            setLoginError('');
          } else {
            setLoginError(
              `TOEGANG GEWEIGERD: Jouw Discord profiel (@${user.username}) bezit geen geautoriseerde rollen in de Discord-server.\n` +
              `Vereist is ten minste één van de volgende rollen:\n` +
              `${DISCORD_CONFIG.requiredRoles.map(r => `@${r.roleName} (ID: ${r.roleId})`).join(', ')}.\n\n` +
              `Jouw profiel heeft de volgende rol-IDs: [${userRoles.length > 0 ? userRoles.join(', ') : 'GEEN ROLLEN'}].\n\n` +
              `Tip: Als dit je eigen server is, pas dan deze rol-ID's aan in 'src/discordConfig.ts'!`
            );
          }
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const handleDiscordRealOAuth = async () => {
    setLoginError('');
    setDiscordLoading(true);
    try {
      const response = await fetch('/api/auth/discord/url');
      if (!response.ok) {
        throw new Error(`Verbindingsfout met server (status: ${response.status}). Probeer simulatie.`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new TypeError("De backend server leverde geen JSON geformatteerde data. Neem contact op met support.");
      }
      const data = await response.json();
      
      if (data.error === 'DISCORD_CLIENT_ID_MISSING' || !data.url) {
        setDiscordLoading(false);
        setShowDiscordModal(true);
        return;
      }

      const authWindow = window.open(
        data.url,
        'discord_oauth',
        'width=600,height=750'
      );

      if (!authWindow) {
        setDiscordLoading(false);
        setLoginError('Mislukt om verificatiescherm te openen. Staat je browser popups toe? Controleer de instellingen.');
      }
    } catch (err: any) {
      setDiscordLoading(false);
      setLoginError(err.message || 'Onbekende fout bij het laden van Discord OAuth url.');
    }
  };
  const [selectedDiscordUser, setSelectedDiscordUser] = useState('Luna Sterling');
  const [loginMethod, setLoginMethod] = useState<'oauth' | 'bot_pincode'>('bot_pincode');
  const [pinInput, setPinInput] = useState('');
  const [generatedPins, setGeneratedPins] = useState<Record<string, string>>({
    'Luna Sterling': '284915',
    'Trevor Vance': '592831',
    'Marco Vercetti': '847116',
    'Enzo Ferrari': '371289',
    'Dealership Admin': '904128'
  });
  const [pinGeneratedFor, setPinGeneratedFor] = useState<string>('');
  const [pinTimer, setPinTimer] = useState<number>(300); // 5 minutes in seconds
  const [botChatLogs, setBotChatLogs] = useState<Array<{ sender: string, text: string, time: string, isBot?: boolean, avatarColor?: string }>>([
    { sender: 'Sovereign Bot', text: '🤖 Sovereign Discord Bot is opgestart en verbonden met gilde [ID: 109283748293749283].', time: '11:15', isBot: true, avatarColor: 'bg-[#5865F2]' },
    { sender: 'Sovereign Bot', text: '💡 Medewerkers kunnen nu inlogcodes genereren met het `/login` slash-commando.', time: '11:15', isBot: true, avatarColor: 'bg-[#5865F2]' }
  ]);
  const [hasCopiedPin, setHasCopiedPin] = useState(false);
  const [showRealBotCode, setShowRealBotCode] = useState(false);
  const [selectedBotLang, setSelectedBotLang] = useState<'js' | 'py'>('js');

  // Shared reactive storage lists for local synchronization
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [allImports, setAllImports] = useState<any[]>([]);

  const loadAllLocalStorageData = () => {
    const savedBookings = localStorage.getItem('veloce_showroom_bookings');
    if (savedBookings) {
      try {
        setAllBookings(JSON.parse(savedBookings));
      } catch (e) {
        console.error(e);
      }
    }
    const savedImports = localStorage.getItem('veloce_import_requests');
    if (savedImports) {
      try {
        setAllImports(JSON.parse(savedImports));
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    loadAllLocalStorageData();
  }, [activeTab, activeCatalogSubView]);

  useEffect(() => {
    let interval: any = null;
    if (pinTimer > 0) {
      interval = setInterval(() => {
        setPinTimer(t => t - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pinTimer]);

  const handleApproveDenyBooking = (id: string, newStatus: 'Approved' | 'Declined' | 'Pending') => {
    const updated = allBookings.map(b => b.id === id ? { ...b, status: newStatus } : b);
    setAllBookings(updated);
    localStorage.setItem('veloce_showroom_bookings', JSON.stringify(updated));
  };

  const handleDeleteBookingInConsole = (id: string) => {
    const updated = allBookings.filter(b => b.id !== id);
    setAllBookings(updated);
    localStorage.setItem('veloce_showroom_bookings', JSON.stringify(updated));
  };

  const handleAdvanceImportStatus = (id: string) => {
    const statusSequence = ['Received', 'In Progress', 'Shipped to Port', 'Ready for Pickup'];
    const updated = allImports.map(req => {
      if (req.id === id) {
        const curIndex = statusSequence.indexOf(req.status);
        if (curIndex === -1) return { ...req, status: 'Received' };
        const nextIndex = Math.min(statusSequence.length - 1, curIndex + 1);
        const nextStatus = statusSequence[nextIndex];
        return {
          ...req,
          status: nextStatus,
          etaDays: nextStatus === 'Ready for Pickup' ? 0 : Math.max(0, req.etaDays - 1)
        };
      }
      return req;
    });
    setAllImports(updated);
    localStorage.setItem('veloce_import_requests', JSON.stringify(updated));
  };

  const handleDeleteImportInConsole = (id: string) => {
    const updated = allImports.filter(req => req.id !== id);
    setAllImports(updated);
    localStorage.setItem('veloce_import_requests', JSON.stringify(updated));
  };

  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('veloce_showroom_vehicles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return VEHICLES;
  });

  useEffect(() => {
    localStorage.setItem('veloce_showroom_vehicles', JSON.stringify(vehiclesList));
  }, [vehiclesList]);

  const [salesList, setSalesList] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('veloce_showroom_sales');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((sale: Sale) => {
            if (sale.id.startsWith('S-')) {
              const oldNum = parseInt(sale.id.replace('S-700', '').replace('S-70', '').replace('S-', ''), 10);
              if (!isNaN(oldNum)) {
                // If it was 7001-7006, map it to 1-6, otherwise keep sequence or map sequence
                const finalNum = oldNum >= 7000 ? oldNum - 7000 : oldNum;
                return { ...sale, id: `SVG-${String(finalNum).padStart(4, '0')}` };
              }
            }
            return sale;
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    const DEFAULT_SALES: Sale[] = [
      { id: 'SVG-0001', customerName: 'Franklin Clinton', vehicleName: 'Pegassi Revuelto', price: 1550000, date: '2026-05-10', paymentMethod: 'Bank Transfer', salesAgent: 'Luna Sterling', bsnNumber: 'ORP-BSN-10029384', birthDate: '1988-10-30', vehicleType: 'Super', rushCosts: false, delivered: true },
      { id: 'SVG-0002', customerName: 'Michael De Santa', vehicleName: 'Pfister Comet GT3', price: 695000, date: '2026-05-12', paymentMethod: 'Bank Transfer', salesAgent: 'Enzo Russo', bsnNumber: 'ORP-BSN-99827384', birthDate: '1967-12-14', vehicleType: 'Super', rushCosts: true, delivered: true },
      { id: 'SVG-0003', customerName: 'Jimmy Boston', vehicleName: 'Grotti SF90 Stradale', price: 1250000, date: '2026-05-18', paymentMethod: 'Bank Transfer', salesAgent: 'Luna Sterling', bsnNumber: 'ORP-BSN-11223344', birthDate: '1990-04-20', vehicleType: 'Super', rushCosts: false, delivered: true },
      { id: 'SVG-0004', customerName: 'Beverly Felton', vehicleName: 'Benefactor G-Wagon G63', price: 420000, date: '2026-05-20', paymentMethod: 'Bank Transfer', salesAgent: 'Marco "Apex" Vercetti', bsnNumber: 'ORP-BSN-44556677', birthDate: '1984-07-08', vehicleType: 'Off-Road', rushCosts: false, delivered: true },
      { id: 'SVG-0005', customerName: 'Tanisha Jackson', vehicleName: 'Übermacht Sentinel M-Spec', price: 305000, date: '2026-05-22', paymentMethod: 'Bank Transfer', salesAgent: 'Luna Sterling', bsnNumber: 'ORP-BSN-77889900', birthDate: '1989-02-15', vehicleType: 'Sedan', rushCosts: true, delivered: false },
      
      { id: 'SVG-0006', customerName: 'Wade Hebert', vehicleName: 'Dinka Jester MKV', price: 245000, date: '2026-05-24', paymentMethod: 'Bank Transfer', salesAgent: 'Trevor "Gearbox" Vance', bsnNumber: 'ORP-BSN-55667788', birthDate: '1992-09-02', vehicleType: 'Sport', rushCosts: false, delivered: false },
      { id: 'SVG-0007', customerName: 'Wade Hebert', vehicleName: 'Pegassi Revuelto', price: 1550000, date: '2026-05-25', paymentMethod: 'Bank Transfer', salesAgent: 'Luna Sterling', bsnNumber: 'ORP-BSN-55667788', birthDate: '1992-09-02', vehicleType: 'Super', rushCosts: false, delivered: true },
      { id: 'SVG-0008', customerName: 'Wade Hebert', vehicleName: 'Pfister Comet GT3', price: 695000, date: '2026-05-26', paymentMethod: 'Bank Transfer', salesAgent: 'Luna Sterling', bsnNumber: 'ORP-BSN-55667788', birthDate: '1992-09-02', vehicleType: 'Super', rushCosts: false, delivered: true },
      { id: 'SVG-0009', customerName: 'Wade Hebert', vehicleName: 'Benefactor G-Wagon G63', price: 420000, date: '2026-05-27', paymentMethod: 'Bank Transfer', salesAgent: 'Luna Sterling', bsnNumber: 'ORP-BSN-55667788', birthDate: '1992-09-02', vehicleType: 'Off-Road', rushCosts: false, delivered: true },
      { id: 'SVG-0010', customerName: 'Wade Hebert', vehicleName: 'Übermacht Sentinel M-Spec', price: 305000, date: '2026-05-28', paymentMethod: 'Bank Transfer', salesAgent: 'Luna Sterling', bsnNumber: 'ORP-BSN-55667788', birthDate: '1992-09-02', vehicleType: 'Sedan', rushCosts: false, delivered: true },
      { id: 'SVG-0011', customerName: 'Wade Hebert', vehicleName: 'Grotti SF90 Stradale', price: 1250000, date: '2026-05-28', paymentMethod: 'Bank Transfer', salesAgent: 'Luna Sterling', bsnNumber: 'ORP-BSN-55667788', birthDate: '1992-09-02', vehicleType: 'Super', rushCosts: false, delivered: true },

      { id: 'SVG-0012', customerName: 'Lester Crest', vehicleName: 'Sovereign Ultra-Yacht Black', price: 15500000, date: '2026-05-28', paymentMethod: 'Bank Transfer', salesAgent: 'Marco "Apex" Vercetti', bsnNumber: 'ORP-BSN-13374242', birthDate: '1974-11-25', vehicleType: 'Super', rushCosts: true, delivered: true },
    ];
    return DEFAULT_SALES;
  });

  useEffect(() => {
    localStorage.setItem('veloce_showroom_sales', JSON.stringify(salesList));
  }, [salesList]);

  // Handle BSN formatting helper
  const handleBsnChange = (val: string, setter: (v: string) => void) => {
    if (!val) {
      setter('');
      return;
    }
    let clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean.startsWith('ORPBSN')) {
      const digitMatch = val.replace(/[^0-9]/g, '');
      const digits = digitMatch.slice(0, 8);
      setter(digits ? `ORP-BSN-${digits}` : 'ORP-BSN-');
    } else {
      const digits = clean.slice(6).replace(/[^0-9]/g, '').slice(0, 8);
      setter(`ORP-BSN-${digits}`);
    }
  };

  // Form states to add new cars
  const [newCarName, setNewCarName] = useState('');
  const [newCarCategory, setNewCarCategory] = useState<'Super' | 'Sport' | 'Off-Road' | 'Sedan'>('Super');
  const [newCarPrice, setNewCarPrice] = useState(350000);
  const [newCarPurchasePrice, setNewCarPurchasePrice] = useState(260000);
  const [newCarTopSpeed, setNewCarTopSpeed] = useState(180);
  const [newCarPassengers, setNewCarPassengers] = useState(2);
  const [newCarStock, setNewCarStock] = useState(2);
  const [newCarBadge, setNewCarBadge] = useState('NIEUW');
  const [newCarImageUrl, setNewCarImageUrl] = useState('');
  const [newCarFeatured, setNewCarFeatured] = useState(false);
  const [addCarSuccess, setAddCarSuccess] = useState('');

  // Previous Sales Filters and states
  const [salesSearch, setSalesSearch] = useState('');
  const [salesPriceFilter, setSalesPriceFilter] = useState<'All' | 'under-1m' | '1m-2.5m' | '2.5m-5m' | 'over-5m'>('All');
  const [salesSort, setSalesSort] = useState<'date-desc' | 'date-asc' | 'price-desc' | 'price-asc' | 'customer' | 'car'>('date-desc');

  // Manual record previous sale states
  const [saleCustName, setSaleCustName] = useState('');
  const [saleBsn, setSaleBsn] = useState('');
  const [saleBirthDate, setSaleBirthDate] = useState('');
  const [saleAgentName, setSaleAgentName] = useState('');
  const [saleCarId, setSaleCarId] = useState('');
  const [saleVehicleType, setSaleVehicleType] = useState('Super');
  const [salePrice, setSalePrice] = useState(350000);
  const [saleRushCosts, setSaleRushCosts] = useState(false);
  const [saleDelivered, setSaleDelivered] = useState<boolean | 'reserved'>(true);
  const [salePayMethod, setSalePayMethod] = useState<'Cash' | 'Bank Transfer' | 'Leasing Loan'>('Bank Transfer');
  const [saleSuccess, setSaleSuccess] = useState('');

  // Previous sales interactive actions states
  const [openedSale, setOpenedSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Edit Sale Form Fields
  const [editSaleCustName, setEditSaleCustName] = useState('');
  const [editSaleBsn, setEditSaleBsn] = useState('');
  const [editSaleBirthDate, setEditSaleBirthDate] = useState('');
  const [editSaleAgent, setEditSaleAgent] = useState('');
  const [editSaleVehicle, setEditSaleVehicle] = useState('');
  const [editSaleVehicleType, setEditSaleVehicleType] = useState('Super');
  const [editSalePrice, setEditSalePrice] = useState(0);
  const [editSaleRushCosts, setEditSaleRushCosts] = useState(false);
  const [editSaleDelivered, setEditSaleDelivered] = useState<boolean | 'reserved'>(true);
  const [editSalePayMethod, setEditSalePayMethod] = useState<'Cash' | 'Bank Transfer' | 'Leasing Loan'>('Bank Transfer');
  const [editSaleDate, setEditSaleDate] = useState('');

  // Automatically calculate salePrice based on saleCarId and saleRushCosts
  useEffect(() => {
    const selected = vehiclesList.find(v => v.id === saleCarId);
    if (selected) {
      const calculatedPrice = selected.price + (saleRushCosts ? 50000 : 0);
      setSalePrice(calculatedPrice);
      setSaleVehicleType(selected.category);
    }
  }, [saleCarId, saleRushCosts, vehiclesList]);

  // Automatically calculate editSalePrice based on editSaleVehicle and editSaleRushCosts
  useEffect(() => {
    if (!editingSale) return;
    const selected = vehiclesList.find(v => v.name === editSaleVehicle);
    if (selected) {
      const calculatedPrice = selected.price + (editSaleRushCosts ? 50000 : 0);
      setEditSalePrice(calculatedPrice);
      setEditSaleVehicleType(selected.category);
    }
  }, [editSaleVehicle, editSaleRushCosts, vehiclesList, editingSale]);

  // Vehicle edit state and handlers
  const [stockSearch, setStockSearch] = useState('');
  const [showAddNewCarForm, setShowAddNewCarForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editCarName, setEditCarName] = useState('');
  const [editCarCategory, setEditCarCategory] = useState<'Super' | 'Sport' | 'Off-Road' | 'Sedan'>('Super');
  const [editCarPrice, setEditCarPrice] = useState(350000);
  const [editCarPurchasePrice, setEditCarPurchasePrice] = useState(260000);
  const [editCarTopSpeed, setEditCarTopSpeed] = useState(180);
  const [editCarPassengers, setEditCarPassengers] = useState(2);
  const [editCarStock, setEditCarStock] = useState(2);
  const [editCarBadge, setEditCarBadge] = useState('NIEUW');
  const [editCarImageUrl, setEditCarImageUrl] = useState('');
  const [editCarFeatured, setEditCarFeatured] = useState(false);

  const handleIncreaseStock = (vehicleId: string) => {
    const updated = vehiclesList.map(v => v.id === vehicleId ? { ...v, stock: Math.min(100, v.stock + 1) } : v);
    setVehiclesList(updated);
  };

  const handleDecreaseStock = (vehicleId: string) => {
    const updated = vehiclesList.map(v => v.id === vehicleId ? { ...v, stock: Math.max(-1, v.stock - 1) } : v);
    setVehiclesList(updated);
  };

  const handleDeleteVehicleInConsole = (vehicleId: string) => {
    const updated = vehiclesList.filter(v => v.id !== vehicleId);
    setVehiclesList(updated);
  };

  const handleStartEditVehicle = (v: Vehicle) => {
    setEditingVehicleId(v.id);
    setEditCarName(v.name);
    setEditCarCategory(v.category);
    setEditCarPrice(v.price);
    setEditCarPurchasePrice(v.purchasePrice || Math.round(v.price * 0.75));
    setEditCarTopSpeed(v.topSpeed);
    setEditCarPassengers(v.passengers || 2);
    setEditCarStock(v.stock);
    setEditCarBadge(v.badge || '');
    setEditCarImageUrl(v.imageUrl || '');
    setEditCarFeatured(!!v.featured);
  };

  const handleSaveEditVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicleId) return;

    const updated = vehiclesList.map(v => {
      if (v.id === editingVehicleId) {
        return {
          ...v,
          name: editCarName.trim(),
          category: editCarCategory,
          price: Number(editCarPrice),
          purchasePrice: Number(editCarPurchasePrice),
          topSpeed: Number(editCarTopSpeed),
          passengers: Number(editCarPassengers),
          stock: Math.max(-1, Math.min(100, Number(editCarStock))),
          badge: editCarBadge.trim() || undefined,
          badgeColor: getBadgeColor(editCarBadge),
          imageUrl: editCarImageUrl.trim(),
          featured: editCarFeatured,
        };
      }
      return v;
    });

    setVehiclesList(updated);
    setEditingVehicleId(null);
    setAddCarSuccess(`✓ Voertuig "${editCarName}" succesvol aangepast!`);
    setTimeout(() => setAddCarSuccess(''), 5000);
  };

  const handleAddCarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCarName.trim()) return;

    const newVehicle: Vehicle = {
      id: 'custom-' + Date.now(),
      name: newCarName.trim(),
      realModel: '',
      category: newCarCategory,
      price: Number(newCarPrice),
      purchasePrice: Number(newCarPurchasePrice),
      topSpeed: Number(newCarTopSpeed),
      passengers: Number(newCarPassengers),
      stock: Math.max(-1, Math.min(100, Number(newCarStock))),
      badge: newCarBadge.trim() || undefined,
      badgeColor: getBadgeColor(newCarBadge),
      imageUrl: newCarImageUrl.trim(),
      featured: newCarFeatured,
    };

    const updated = [newVehicle, ...vehiclesList];
    setVehiclesList(updated);
    setAddCarSuccess(`✓ Showroom-catalogus bijgewerkt! "${newCarName}" is toegevoegd aan de categorie ${newCarCategory}.`);
    
    // Reset form
    setNewCarName('');
    setNewCarBadge('NIEUW');
    setNewCarImageUrl('');
    setTimeout(() => setAddCarSuccess(''), 5000);
  };

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleCustName.trim() || !saleCarId || !saleBsn.trim() || !saleBirthDate || !saleAgentName) return;

    const matchedCar = vehiclesList.find(v => v.id === saleCarId);
    if (!matchedCar) return;

    if (matchedCar.stock <= 0) {
      setSaleError(`Fout: Er is onvoldoende voorraad van de ${matchedCar.name} (Huidige voorraad: ${matchedCar.stock}). U kunt alleen een bestelling uitschrijven als de voorraad hoger is dan 0.`);
      setTimeout(() => setSaleError(''), 10000);
      return;
    }

    setSaleError('');

    // Find highest sale number to compute next sequence starting at SVG-0001
    let maxSaleNum = 0;
    salesList.forEach(s => {
      const match = s.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxSaleNum) {
          maxSaleNum = num;
        }
      }
    });
    const nextSaleNum = maxSaleNum + 1;
    const computedId = `SVG-${String(nextSaleNum).padStart(4, '0')}`;

    const newSale: Sale = {
      id: computedId,
      customerName: saleCustName.trim(),
      vehicleName: matchedCar.name,
      price: Number(salePrice),
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer',
      salesAgent: saleAgentName,
      bsnNumber: saleBsn.trim(),
      birthDate: saleBirthDate,
      vehicleType: saleVehicleType,
      rushCosts: saleRushCosts,
      delivered: saleDelivered,
    };

    const updatedSales = [newSale, ...salesList];
    setSalesList(updatedSales);
    setSaleSuccess(`✓ Verkoop succesvol geregistreerd in het beveiligde kluisboek.`);

    // Decrement stock in catalog if available (down to -1)
    if (matchedCar.stock > -1) {
      const updatedVehicles = vehiclesList.map(v => v.id === matchedCar.id ? { ...v, stock: Math.max(-1, v.stock - 1) } : v);
      setVehiclesList(updatedVehicles);
    }

    // Reset fields
    setSaleCustName('');
    setSaleBsn('');
    setSaleBirthDate('');
    setSaleRushCosts(false);
    setSaleDelivered(true);
    setTimeout(() => setSaleSuccess(''), 5000);
  };

  const handleDeleteSale = (id: string) => {
    if (deleteConfirmId === id) {
      const updated = salesList.filter(s => s.id !== id);
      setSalesList(updated);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => {
        setDeleteConfirmId(prev => prev === id ? null : prev);
      }, 5000); // Reset confirmation highlight after 5 seconds
    }
  };

  const handleStartEditSale = (s: Sale) => {
    setEditingSale(s);
    setEditSaleCustName(s.customerName);
    setEditSaleBsn(s.bsnNumber || '');
    setEditSaleBirthDate(s.birthDate || '');
    setEditSaleAgent(s.salesAgent);
    setEditSaleVehicle(s.vehicleName);
    setEditSaleVehicleType(s.vehicleType || 'Super');
    setEditSalePrice(s.price);
    setEditSaleRushCosts(s.rushCosts || false);
    setEditSaleDelivered(s.delivered ?? false);
    setEditSalePayMethod('Bank Transfer');
    setEditSaleDate(s.date);
  };

  const handleSaveSaleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    const updated = salesList.map(s => s.id === editingSale.id ? {
      ...s,
      customerName: editSaleCustName.trim(),
      bsnNumber: editSaleBsn.trim(),
      birthDate: editSaleBirthDate,
      salesAgent: editSaleAgent,
      vehicleName: editSaleVehicle,
      vehicleType: editSaleVehicleType,
      price: Number(editSalePrice),
      rushCosts: editSaleRushCosts,
      delivered: editSaleDelivered,
      paymentMethod: 'Bank Transfer' as const,
      date: editSaleDate,
    } : s);

    setSalesList(updated);
    setEditingSale(null);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(() => vehiclesList[0] || VEHICLES[0]);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [serverTime, setServerTime] = useState('');
  const [likes, setLikes] = useState<Record<string, boolean>>({});

  // Dynamic Simulating Los Santos Time ticker
  useEffect(() => {
    const updateTime = () => {
      const gtaTime = new Date();
      // Fast forward GTA V style multiplier optional, let's keep it beautifully formatted with standard timezone helper or readable UTC tag
      setServerTime(gtaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // News ticker simulating active rollings
  const TICKER_MESSAGES = [
    'LS PORT TRANSIT: Vrachtschip-container aangekomen uit Tokio, Japan met 1x [Annis Elegy GT-R R35].',
    'MAZE BANK AUTO: James Miller heeft het 5.5% leaseschema voldaan op de Pegassi Revuelto.',
    'VELOCE TUNING: Trevor Vance heeft de Stage 3 carbon dyno-afstelling voltooid op de Pfister GT3.',
    'SHOWROOM ALERTS: Exclusieve carbon-gouden kentekenplaat geregistreerd: [TOKYO_V8].',
    'STADSVEILIGHEID: De DMV waarschuwt automobilisten om alle speciale importen bij het hoofdbureau van Los Santos te registreren.',
    'VIP BEKENDMAKING: 1-op-1 showroombezoek voor Jimmy De Santa goedgekeurd door Luna Sterling.'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % TICKER_MESSAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const filteredVehicles = vehiclesList.filter(v => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = v.name.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Super', 'Sport', 'Off-Road', 'Sedan'];

  const handleTuneVehicle = (v: Vehicle) => {
    setSelectedVehicle(v);
    setActiveCatalogSubView('tuner');
  };

  const handleFinanceVehicle = (v: Vehicle) => {
    setSelectedVehicle(v);
    setActiveCatalogSubView('finance');
  };

  const handleBookVehicle = (v: Vehicle) => {
    setSelectedVehicle(v);
    setActiveCatalogSubView('bookings');
  };

  const toggleLike = (vehicleId: string) => {
    setLikes(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }));
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-neutral-950 text-slate-100' : 'light bg-neutral-50 text-neutral-900'} font-sans selection:bg-amber-500 selection:text-neutral-950 flex flex-col justify-between transition-colors duration-300`}>
      
      {/* Primary Header Section */}
      <header className={`border-b sticky top-0 z-40 shadow-xl backdrop-blur-md bg-opacity-95 transition-colors duration-300 ${isDarkMode ? 'border-neutral-850 bg-neutral-950/95 text-slate-100' : 'border-neutral-200 bg-white/95 text-neutral-900'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4.5 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Brand/Dealership logo */}
          <div className="flex items-center gap-3">
            <div className={`p-1 px-2 border rounded-lg shadow-inner flex items-center justify-center transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-neutral-800 to-neutral-950 border-amber-500/30' 
                : 'bg-amber-50 border-amber-500/20'
            }`}>
              <CompanyLogo />
            </div>
            <div>
              <h1 className={`text-xl font-extrabold tracking-widest flex items-center gap-1.5 transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300' 
                  : 'text-neutral-900'
              }`}>
                SOVEREIGN
                <span className={`text-[10px] tracking-wider font-bold px-1.5 py-0.5 rounded border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-amber-500 bg-neutral-900 border-neutral-800' 
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}>
                  ORANJESTAD
                </span>
              </h1>
              <p className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase mt-0.5">
                ORANJESTAD IMPORTS & LUXURY DEALERSHIP
              </p>
            </div>
          </div>

          {/* Navigation Action tabs */}
          <div className="flex items-center gap-3">
            <nav className="flex flex-wrap items-center justify-center gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-black shadow-md'
                        : isDarkMode
                          ? 'hover:bg-neutral-905 hover:text-slate-100 text-neutral-400'
                          : 'hover:bg-neutral-100 hover:text-neutral-900 text-neutral-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={toggleTheme}
              className={`p-1.5 px-2 border rounded-lg transition-all cursor-pointer flex items-center gap-2 font-mono text-[11px] ${
                isDarkMode 
                  ? 'bg-neutral-900 border-neutral-800 text-amber-500 hover:text-amber-400 hover:bg-neutral-800' 
                  : 'bg-white border-neutral-300 text-amber-600 hover:text-amber-700 hover:bg-neutral-50'
              }`}
              title={isDarkMode ? "Lichte Modus" : "Donkere Modus"}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-bold uppercase tracking-wider">{isDarkMode ? 'LIGHT' : 'DARK'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow">
            {/* TAB 1: CATALOGUE OVERVIEW */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            
            {/* Filter Hub Actions bar */}
            <div className={`border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-300 ${
              isDarkMode ? 'bg-neutral-900 border-neutral-850' : 'bg-white border-neutral-200 shadow-xs'
            }`}>
              
              {/* Search input field */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Zoek showroommodellen (bijv. Pfister, GT3)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full border focus:border-amber-500 focus:outline-none rounded-lg pl-9 pr-4 py-1.5 text-xs transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-750 text-slate-100 placeholder-neutral-500' 
                      : 'bg-neutral-100 border-neutral-200 hover:border-neutral-300 text-neutral-900 placeholder-neutral-500'
                  }`}
                />
              </div>

              {/* Category tags */}
              <div className="flex flex-wrap items-center justify-center gap-1 w-full md:w-auto">
                <Filter className="w-3.5 h-3.5 text-neutral-500 mr-1 hidden sm:block" />
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? isDarkMode
                          ? 'bg-neutral-800 text-amber-500 border border-amber-500/20'
                          : 'bg-amber-500 text-neutral-950 font-extrabold border border-amber-600/20 shadow-xs'
                        : isDarkMode
                          ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-950'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                    }`}
                  >
                    {cat === 'All' ? 'Alles' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Showing Showroom catalog Grid */}
            <div className="max-h-[720px] overflow-y-auto pr-1.5 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVehicles.map((vehicle) => {
                  const liked = !!likes[vehicle.id];
                  return (
                    <div
                      key={vehicle.id}
                      className={`border rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 relative group shadow-md ${
                        isDarkMode 
                          ? 'bg-neutral-900 hover:bg-neutral-900/90 border-neutral-850 hover:border-neutral-750' 
                          : 'bg-white hover:bg-neutral-50/80 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      
                      {/* Top action badge or category tag */}
                      <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                        {vehicle.badge && (() => {
                          const bColor = getBadgeColor(vehicle.badge, vehicle.badgeColor);
                          return (
                            <span 
                              className="text-[9px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded backdrop-blur-md border"
                              style={{ 
                                backgroundColor: `${bColor}45`,
                                borderColor: `${bColor}65`,
                                color: bColor 
                              }}
                            >
                              {vehicle.badge}
                            </span>
                          );
                        })()}
                        <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded backdrop-blur-xs font-mono transition-colors duration-300 ${
                          isDarkMode ? 'bg-neutral-950/80 text-neutral-400' : 'bg-neutral-100/90 text-neutral-600 border border-neutral-200'
                        }`}>
                          {vehicle.category}
                        </span>
                      </div>

                      {/* Like heart */}
                      <button
                        onClick={() => toggleLike(vehicle.id)}
                        className={`absolute top-3 right-3 p-1.5 border hover:border-red-500/20 rounded-lg transition-all z-10 backdrop-blur-xs active:scale-90 ${
                          isDarkMode 
                            ? 'bg-neutral-950/80 hover:bg-neutral-950 border-white/5 text-neutral-400 hover:text-red-500' 
                            : 'bg-neutral-100/90 hover:bg-neutral-200 border-neutral-200 text-neutral-500 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      {/* Large illustrative display background card */}
                      <div className={`h-44 relative overflow-hidden flex items-center justify-center border-b transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gradient-to-b from-neutral-950 to-neutral-900 border-neutral-850' 
                          : 'bg-gradient-to-b from-neutral-100 to-neutral-50 border-neutral-200'
                      }`}>
                        
                        {/* Stylized background glow */}
                        <div
                          className="absolute w-28 h-28 rounded-full blur-2xl opacity-15 select-none bg-amber-500/20"
                        ></div>

                        {/* Cool Vector Supercar Outline Art or Real Image */}
                        {vehicle.imageUrl && vehicle.imageUrl.startsWith('http') ? (
                          <img 
                            src={vehicle.imageUrl} 
                            alt={vehicle.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="p-4 flex items-center justify-center w-full h-full">
                            <svg viewBox="0 0 100 50" className="w-full max-w-[140px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] transform group-hover:scale-105 transition-transform duration-300">
                              <defs>
                                <linearGradient id={`grad-${vehicle.id}`} x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#ca8a04" />
                                  <stop offset="100%" stopColor={isDarkMode ? "#121212" : "#f1f5f9"} />
                                </linearGradient>
                              </defs>
                              {/* Wheel Arch ground and body */}
                              <path d="M 5 35 H 95" stroke={isDarkMode ? "#262626" : "#cbd5e1"} strokeWidth="2" />
                              <path
                                d="M 10 35 H 25 A 7 7 0 0 1 39 35 H 65 A 7 7 0 0 1 79 35 H 90 Q 94 35, 93 28 Q 91 22, 80 22 C 70 22, 60 17, 48 17 Q 35 17, 25 21 C 18 24, 15 28, 10 31 Z"
                                fill="url(#grad-fallback)"
                                stroke={isDarkMode ? "#404040" : "#94a3b8"}
                                strokeWidth="0.8"
                              />
                              {/* Glass cabin details */}
                              <path d="M 40 22 L 50 18 L 65 18 C 72 18, 70 22, 60 22 Z" fill={isDarkMode ? "#171717" : "#64748b"} fillOpacity="0.8" />
                              {/* Wheels shadows */}
                              <circle cx="32" cy="35" r="5" fill={isDarkMode ? "#09090b" : "#1e293b"} stroke={isDarkMode ? "#4b5563" : "#94a3b8"} strokeWidth="1" />
                              <circle cx="72" cy="35" r="5" fill={isDarkMode ? "#09090b" : "#1e293b"} stroke={isDarkMode ? "#4b5563" : "#94a3b8"} strokeWidth="1" />
                            </svg>
                          </div>
                        )}

                        {/* Bottom stock / spawn trigger */}
                        <div className="absolute bottom-2 left-3 text-[10px] font-mono z-10">
                          {vehicle.stock === -1 ? (
                            <span className="px-2 py-0.5 rounded font-bold text-red-500 border border-red-500/10 backdrop-blur-md bg-neutral-950/75 shadow-lg">
                              GEEN VOORRAAD
                            </span>
                          ) : vehicle.stock === 0 ? (
                            <span className="px-2 py-0.5 rounded font-bold text-amber-500 border border-amber-500/10 backdrop-blur-md bg-neutral-950/75 shadow-lg">
                              HUIDIGE VOORRAAD VERKOCHT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded font-bold text-emerald-500 border border-emerald-500/10 backdrop-blur-md bg-neutral-950/75 shadow-lg">
                              HUIDIGE VOORRAAD: {vehicle.stock}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Catalogue description information */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div>
                            <h3 className={`text-sm font-black uppercase tracking-wide truncate text-center w-full transition-colors duration-300 ${
                              isDarkMode ? 'text-slate-100' : 'text-neutral-900'
                            }`}>
                              {vehicle.name}
                            </h3>
                          </div>

                          {/* topsnelheid & passengers showing side-by-side */}
                          <div className={`grid grid-cols-2 border-y py-2 my-3 text-center transition-colors duration-300 divide-x ${
                            isDarkMode ? 'border-neutral-850 divide-neutral-800' : 'border-neutral-250 divide-neutral-200'
                          }`}>
                            <div>
                              <span className="text-[9.5px] text-neutral-500 block font-mono uppercase">Topsnelheid</span>
                              <span className={`text-xs font-black font-mono transition-colors duration-300 ${
                                isDarkMode ? 'text-slate-200' : 'text-neutral-800'
                              }`}>{vehicle.topSpeed} km/u</span>
                            </div>
                            <div>
                              <span className="text-[9.5px] text-neutral-500 block font-mono uppercase">Passagiers</span>
                              <span className={`text-xs font-black font-mono transition-colors duration-300 ${
                                isDarkMode ? 'text-slate-200' : 'text-neutral-800'
                              }`}>{vehicle.passengers !== undefined ? vehicle.passengers : 2}</span>
                            </div>
                          </div>
                        </div>

                        {/* ONLY showing Price */}
                        <div className="flex justify-between items-baseline pt-1">
                          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider font-mono">PRIJS:</span>
                          <span className="text-sm font-black text-amber-500 font-mono">
                            € {vehicle.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zero state matches */}
            {filteredVehicles.length === 0 && (
              <div className={`p-12 border rounded-xl text-center transition-all duration-300 ${
                isDarkMode ? 'bg-neutral-900 border-neutral-850' : 'bg-white border-neutral-200 shadow-sm'
              }`}>
                <Search className={`w-10 h-10 mx-auto mb-2.5 transition-colors duration-300 ${
                  isDarkMode ? 'text-neutral-700' : 'text-neutral-300'
                }`} />
                <h3 className={`text-sm font-black uppercase tracking-widest transition-colors duration-300 ${
                  isDarkMode ? 'text-slate-300' : 'text-neutral-800'
                }`}>GEEN SHOWROOMMODELLEN GEVONDEN</h3>
                <p className={`text-xs mt-1 max-w-sm mx-auto leading-relaxed transition-colors duration-300 ${
                  isDarkMode ? 'text-neutral-500' : 'text-neutral-600'
                }`}>
                  We hebben momenteel geen modellen op voorraad die overeenkomen met je zoekopdracht. Probeer een andere zoekterm.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE EMPLOYEE COCKPIT */}
        {activeTab === 'employee' && (
          <div className="max-w-6xl mx-auto text-left animate-fadeIn">
            {!isEmployeeLoggedIn ? (
              <div className="space-y-8 animate-fadeIn">
                {/* Centered Login Card */}
                <div className="max-w-md mx-auto py-12">
                  <div className={`border rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-neutral-900 border-neutral-850 shadow-black' : 'bg-white border-neutral-200'}`}>
                    {/* Top Accent Strip */}
                    <div className="h-1 bg-gradient-to-r from-[#5865F2] to-amber-500"></div>
                    
                    <div className="p-6 space-y-5">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center mx-auto mb-2">
                          <svg className="w-6.5 h-6.5 animate-pulse" fill="currentColor" viewBox="0 0 127.14 96.36">
                            <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53a105.73,105.73,0,0,0,32,16.29,81.84,81.84,0,0,0,6.71-11,68.6,68.6,0,0,1-10.64-5.12c.91-.67,1.81-1.37,2.65-2.1a75.22,75.22,0,0,0,73.8,0c.84.73,1.74,1.43,2.65,2.1a68.86,68.86,0,0,1-10.64,5.12,81.84,81.84,0,0,0,6.72,11,105.73,105.73,0,0,0,32-16.29C129.24,48.51,123.29,25.79,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.9,46,53.9,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.14,46,96.14,53,91,65.69,84.69,65.69Z" />
                          </svg>
                        </div>
                        <h3 className={`text-md font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>
                          Medewerker Authenticatie
                        </h3>
                      </div>

                      {loginError && (
                        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-550 dark:text-red-400 text-xs font-mono leading-relaxed space-y-2">
                          <div>
                            <span className="font-bold block mb-1">Authenticatiefout:</span>
                            {loginError}
                          </div>
                          <div className="pt-2 border-t border-red-500/10 text-center">
                            <button
                              onClick={() => {
                                setLoginError('');
                                setShowDiscordModal(true);
                              }}
                              className="text-[10px] uppercase font-bold text-amber-500 hover:text-amber-400 transition-colors cursor-pointer bg-neutral-950/30 px-2 py-1 rounded border border-amber-500/15"
                            >
                              ⚙️ Start Simulatie-modus (Testen) →
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleDiscordRealOAuth}
                        disabled={discordLoading}
                        className="w-full py-3 bg-[#5865F2] hover:bg-[#4752c4] disabled:bg-[#5865F2]/50 text-white font-black rounded-lg text-xs uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(88,101,242,0.25)] hover:shadow-[0_6px_20px_rgba(88,101,242,0.4)] cursor-pointer flex items-center justify-center gap-2"
                      >
                        {discordLoading ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                            Verbinding Maken...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 127.14 96.36">
                              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53a105.73,105.73,0,0,0,32,16.29,81.84,81.84,0,0,0,6.71-11,68.6,68.6,0,0,1-10.64-5.12c.91-.67,1.81-1.37,2.65-2.1a75.22,75.22,0,0,0,73.8,0c.84.73,1.74,1.43,2.65,2.1a68.86,68.86,0,0,1-10.64,5.12,81.84,81.84,0,0,0,6.72,11,105.73,105.73,0,0,0,32-16.29C129.24,48.51,123.29,25.79,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.9,46,53.9,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.14,46,96.14,53,91,65.69,84.69,65.69Z" />
                            </svg>
                            Inloggen met Discord
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {showDiscordModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn text-left">
                    <div className="bg-[#313338] border border-[#232428] rounded-lg shadow-2xl w-full max-w-[440px] overflow-hidden text-[#dbdee1] font-sans">
                      
                      {/* Discord Header Logo and Apps details */}
                      <div className="p-6 pb-2 text-center relative">
                        <div className="w-16 h-16 rounded-full bg-[#5865F2] text-white flex items-center justify-center mx-auto mb-3 shadow-[0_4px_10px_rgba(88,101,242,0.4)]">
                          <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 127.14 96.36">
                            <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53a105.73,105.73,0,0,0,32,16.29,81.84,81.84,0,0,0,6.71-11,68.6,68.6,0,0,1-10.64-5.12c.91-.67,1.81-1.37,2.65-2.1a75.22,75.22,0,0,0,73.8,0c.84.73,1.74,1.43,2.65,2.1a68.86,68.86,0,0,1-10.64,5.12,81.84,81.84,0,0,0,6.72,11,105.73,105.73,0,0,0,32-16.29C129.24,48.51,123.29,25.79,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.9,46,53.9,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.14,46,96.14,53,91,65.69,84.69,65.69Z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-black text-[#949ba4] tracking-widest uppercase block mb-1">AUTORISATIE VERZOEK</span>
                        <h3 className="text-md font-extrabold text-white">Sovereign Paneel</h3>
                      </div>

                      {/* Content block with permissions requested */}
                      <div className="px-5 py-4 space-y-3.5 bg-[#2b2d31]">
                        <p className="text-[12px] text-[#dbdee1] leading-relaxed">
                          De externe applicatie <strong className="text-white">Sovereign</strong> wil toegang krijgen tot jouw Discord account om in te loggen:
                        </p>

                        <div className="space-y-2.5 border-t border-b border-[#35363c] py-3.5 text-[11px] text-[#b5bac1]">
                          <div className="mb-4">
                            <label className="text-[10px] font-black text-[#949ba4] tracking-wider uppercase block mb-1">
                              KIES ACCOUNT OM TE SIMULEREN
                            </label>
                            <select
                              value={selectedDiscordUser}
                              onChange={(e) => {
                                setSelectedDiscordUser(e.target.value);
                                setLoginError(null);
                              }}
                              className="w-full text-xs font-semibold rounded-lg px-3 py-2 bg-[#1e1f22] border border-[#232428] text-white outline-none focus:border-[#5865F2] transition-colors"
                            >
                              <option value="Luna Sterling">Luna Sterling (Staff & Management)</option>
                              <option value="Trevor Vance">Trevor Vance (Staff / Monteur)</option>
                              <option value="Marco Vercetti">Marco Vercetti (Staff & Directie)</option>
                              <option value="Enzo Ferrari">Enzo Ferrari (Smarte Verkoper)</option>
                              <option value="Dealership Admin">Executive Dealer Directeur (Directie)</option>
                            </select>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="text-[#23a55a] font-black text-xs">✓</span>
                            <div>
                              <strong className="text-white">Gebruiksnaam en avatar inzien</strong>
                              Toegang tot {selectedDiscordUser === 'Luna Sterling' ? 'Luna#1337' : selectedDiscordUser === 'Trevor Vance' ? 'Trevor#5151' : selectedDiscordUser === 'Marco Vercetti' ? 'Marco#4545' : selectedDiscordUser === 'Enzo Ferrari' ? 'Enzo#1212' : 'Admin#9999'}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-[#23a55a] font-black text-xs">✓</span>
                            <div>
                              <strong className="text-white">Rollen controleren op server '{DISCORD_CONFIG.guildName}'</strong>
                              Controleert of je een van de geautoriseerde rol IDs bezit: <span className="text-[#e2e3e5] font-semibold bg-[#232428] px-1.5 py-0.5 rounded text-[10px] font-mono">{DISCORD_CONFIG.requiredRoles.map(r => `@${r.roleName}`).join(' of ')}</span>.
                            </div>
                          </div>
                        </div>

                        {/* Connection avatar preview */}
                        <div className="p-3 bg-[#1e1f22] rounded-md flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5865F2] to-[#f59e0b] font-extrabold text-[11px] text-[#1e1f22] flex items-center justify-center font-mono animate-pulse">
                              {selectedDiscordUser.split(' ').map(x => x[0]).join('')}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white leading-tight">{selectedDiscordUser}</div>
                              <div className="text-[10px] text-[#949ba4] font-mono leading-none mt-0.5">
                                {selectedDiscordUser === 'Luna Sterling' ? 'Luna#1337' : selectedDiscordUser === 'Trevor Vance' ? 'Trevor#5151' : selectedDiscordUser === 'Marco Vercetti' ? 'Marco#4545' : selectedDiscordUser === 'Enzo Ferrari' ? 'Enzo#1212' : 'Admin#9999'}
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] bg-[#23a55a]/10 text-[#23a55a] border border-[#23a55a]/20 px-1.5 py-0.5 rounded uppercase font-bold font-mono">
                            OAuth2 Actief
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 bg-[#2b2d31] flex justify-end gap-3.5 border-t border-[#3f4147]">
                        <button
                          onClick={() => setShowDiscordModal(false)}
                          className="px-4 py-1.5 text-xs text-white hover:underline rounded outline-none cursor-pointer"
                        >
                          Annuleren
                        </button>
                        <button
                          onClick={() => {
                            setDiscordLoading(true);
                            setTimeout(() => {
                              setDiscordLoading(false);
                              
                              // Check roles mapping from DISCORD_CONFIG
                              const userRoles = ['1509514357950910595'];
                              const allowedRoleIds = DISCORD_CONFIG.requiredRoles.map(r => r.roleId);
                              const hasPermittedRole = userRoles.some(roleId => allowedRoleIds.includes(roleId));

                              if (hasPermittedRole) {
                                setShowDiscordModal(false);
                                setEmployeeCallSign(selectedDiscordUser);
                                setIsEmployeeLoggedIn(true);
                                setLoginError(null);
                              } else {
                                setShowDiscordModal(false);
                                setLoginError(
                                  `TOEGANG GEWEIGERD: Jouw Discord profiel bezit geen geldige rollen in Guild ID [${DISCORD_CONFIG.guildId}]. ` +
                                  `Vereist is ten minste één van de volgende rollen: ` +
                                  `${DISCORD_CONFIG.requiredRoles.map(r => `@${r.roleName} (ID: ${r.roleId})`).join(', ')}. ` +
                                  `Jouw profiel heeft momenteel: [${userRoles.length > 0 ? userRoles.join(', ') : 'GEEN ROLLEN'}].`
                                );
                              }
                            }, 1000);
                          }}
                          className="px-6 py-1.5 bg-[#248046] hover:bg-[#1a5c32] text-white font-semibold text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer shadow outline-none"
                        >
                          {discordLoading ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                              Autoriseren...
                            </>
                          ) : 'Autoriseren'}
                        </button>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* Decrypted Veloce Executive Station Control Console */
              <div className="space-y-6">

                {/* Employee Welcome & Control Center Status Bar */}
                <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
                  isDarkMode ? 'bg-neutral-900 border-neutral-800 animate-fadeIn' : 'bg-white border-neutral-200 shadow-sm animate-fadeIn'
                }`}>
                  <div className="flex items-center gap-3">
                    {realDiscordUser && realDiscordUser.avatarUrl ? (
                      <img 
                        src={realDiscordUser.avatarUrl} 
                        alt="Discord Avatar" 
                        className="w-10 h-10 rounded-full border-2 border-[#5865F2] shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 font-black text-neutral-950 flex items-center justify-center font-mono">
                        {employeeCallSign.split(' ').map((x: string) => x[0]).join('')}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[12px] font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                          {employeeCallSign}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                          realDiscordUser 
                            ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {realDiscordUser ? 'Echte Discord Geverifieerd' : 'Geautoriseerde Medewerker'}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        {realDiscordUser 
                          ? `Gekoppeld Discord ID: ${realDiscordUser.id} | Server: ${DISCORD_CONFIG.guildName}` 
                          : `Sovereign RP Showroom Systeem • Handmatige Verificatie`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <button
                      onClick={() => {
                        setIsEmployeeLoggedIn(false);
                        setRealDiscordUser(null);
                        setPinInput('');
                        setLoginError('');
                      }}
                      className={`w-full md:w-auto px-4 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isDarkMode 
                          ? 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800' 
                          : 'border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                    >
                      Uitloggen Portal
                    </button>
                  </div>
                </div>
                
                {/* Sub components inside Admin Roster Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Console Sidebar Menus */}
                  {[
                    { id: 'stock' as const, label: 'Huidige voorraad', badge: vehiclesList.length, icon: Car },
                    { id: 'sales' as const, label: 'Administratie', badge: salesList.length, icon: ClipboardList },
                    { id: 'roster' as const, label: 'Actieve Personeelslijst', badge: 4, icon: Users },
                    { id: 'financials' as const, label: 'Financiën', badge: null, icon: TrendingUp }
                  ].map(subTab => {
                    const Icon = subTab.icon;
                    return (
                      <button
                        key={subTab.id}
                        onClick={() => setActiveEmployeeSubTab(subTab.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left text-[10px] uppercase tracking-wide cursor-pointer transition-colors duration-300 ${
                          activeEmployeeSubTab === subTab.id
                            ? isDarkMode
                              ? 'bg-neutral-800 border-amber-500 font-extrabold text-amber-500 shadow-md animate-pulse-subtle'
                              : 'bg-amber-100 border-amber-500 font-extrabold text-amber-900 shadow-sm'
                            : isDarkMode
                              ? 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-slate-100 hover:border-neutral-700'
                              : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{subTab.label}</span>
                        </div>
                        {subTab.badge !== null && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-colors duration-300 ${
                            activeEmployeeSubTab === subTab.id 
                              ? 'bg-amber-500 text-neutral-950' 
                              : isDarkMode 
                                ? 'bg-neutral-900 text-neutral-400' 
                                : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {subTab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content boards */}
                <div className={`border p-6 rounded-xl min-h-[400px] transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-neutral-900 border-neutral-850' 
                    : 'bg-white border-neutral-200 shadow-xs'
                }`}>
                  
                  {/* HUIDIGE VOORRAAD (CURRENT STOCK MANAGEMENT) BOARD */}
                  {activeEmployeeSubTab === 'stock' && (
                    <div className="space-y-6 text-left animate-fadeIn">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-3 gap-4">
                        <div>
                          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">HUIDIGE VOORRAAD BEHEREN</h3>
                          <p className="text-[11px] text-neutral-500 mt-0.5 font-mono">
                            Pas voorraadwaardes ter plekke aan, bewerk voertuiggegevens direct of voeg nieuwe import- of tuned modellen toe.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] bg-neutral-950 text-neutral-404 font-mono px-2.5 py-1 rounded border border-neutral-850">
                            Unieke Modellen: {vehiclesList.length} Types
                          </span>
                          <button
                            onClick={() => setShowAddNewCarForm(!showAddNewCarForm)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 outline-none font-sans"
                          >
                            {showAddNewCarForm ? '✓ Sluit Formulier' : '+ Nieuwe Auto'}
                          </button>
                        </div>
                      </div>

                      {addCarSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-mono select-none">
                          {addCarSuccess}
                        </div>
                      )}

                      {/* NEW VEHICLE REGISTRATION FORM (COLLAPSIBLE SECTION) */}
                      {showAddNewCarForm && (
                        <div className={`p-5 rounded-xl space-y-4 animate-fadeIn border transition-colors duration-300 ${
                          isDarkMode ? 'bg-neutral-955 border-amber-500/30' : 'bg-white border-amber-500/20 shadow-md'
                        }`}>
                          <div className={`border-b pb-2 ${isDarkMode ? 'border-neutral-850' : 'border-neutral-100'}`}>
                            <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider font-mono">NIEUW MODEL TOEVOEGEN AAN DE CATALOGUS</h4>
                            <p className={`text-[10px] font-mono mt-0.5 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Vul alle technische gegevens in om het model direct te publiceren.</p>
                          </div>

                          <form onSubmit={(e) => {
                            handleAddCarSubmit(e);
                            setShowAddNewCarForm(false);
                          }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Name */}
                              <div>
                                <label className={`text-[10px] font-bold block mb-1 uppercase tracking-wider font-mono ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                  Modelnaam Voertuig
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="bijv. Pegassi Tempesta"
                                  value={newCarName}
                                  onChange={(e) => setNewCarName(e.target.value)}
                                  className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-950 border-neutral-850 text-slate-100 placeholder-neutral-700' : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400'
                                  }`}
                                />
                              </div>

                              {/* Category */}
                              <div>
                                <label className={`text-[10px] font-bold block mb-1 uppercase tracking-wider font-mono ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                  Voertuigklasse
                                </label>
                                <select
                                  value={newCarCategory}
                                  onChange={(e) => setNewCarCategory(e.target.value as any)}
                                  className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs font-bold transition-colors duration-300 cursor-pointer ${
                                    isDarkMode ? 'bg-neutral-955 border-neutral-800 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                  }`}
                                >
                                  <option value="Super">Super (High-Performance Super- & Hypercar)</option>
                                  <option value="Sport">Sport (Straat- en Tuningklasse)</option>
                                  <option value="Off-Road">Off-Road (SUVs & Terreinwagens)</option>
                                  <option value="Sedan">Sedan (Luxe executive sedans)</option>
                                </select>
                              </div>

                              {/* Price */}
                              <div>
                                <label className={`text-[10px] font-bold block mb-1 uppercase tracking-wider font-mono ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                  Catalogusprijs (€)
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={newCarPrice}
                                  onChange={(e) => setNewCarPrice(Number(e.target.value))}
                                  className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs font-mono transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-950 border-neutral-850 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                  }`}
                                />
                              </div>

                              {/* Inkoopprijs */}
                              <div>
                                <label className="text-[10px] font-bold text-amber-500 block mb-1 uppercase tracking-wider font-mono">
                                  Inkoopprijs (€) <span className={`text-[9px] font-normal lowercase italic ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>(Alleen Medewerkers)</span>
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={newCarPurchasePrice}
                                  onChange={(e) => setNewCarPurchasePrice(Number(e.target.value))}
                                  className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs font-mono transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-950 border-neutral-850 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                  }`}
                                />
                              </div>

                              {/* Top Speed */}
                              <div>
                                <label className={`text-[10px] font-bold block mb-1 uppercase tracking-wider font-mono ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                  Topsnelheid (km/u)
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="10"
                                  value={newCarTopSpeed}
                                  onChange={(e) => setNewCarTopSpeed(Number(e.target.value))}
                                  className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs font-mono transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-950 border-neutral-850 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                  }`}
                                />
                              </div>

                              {/* Passengers */}
                              <div>
                                <label className={`text-[10px] font-bold block mb-1 uppercase tracking-wider font-mono ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                  Max. Passagiers
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={newCarPassengers}
                                  onChange={(e) => setNewCarPassengers(Number(e.target.value))}
                                  className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs font-mono transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-950 border-neutral-850 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                  }`}
                                />
                              </div>

                                {/* Stock */}
                                <div>
                                  <label className={`text-[10px] font-bold block mb-1 uppercase tracking-wider font-mono ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Initiële Voorraad
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min="-1"
                                    max="100"
                                    value={newCarStock}
                                  onChange={(e) => setNewCarStock(Number(e.target.value))}
                                  className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs font-mono transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-850 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                  }`}
                                />
                              </div>

                              {/* Badge */}
                              <div>
                                <label className={`text-[10px] font-bold block mb-1 uppercase tracking-wider font-mono ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                  Catalogus Label
                                </label>
                                <select
                                  value={newCarBadge}
                                  onChange={(e) => setNewCarBadge(e.target.value)}
                                  className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-850 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                  }`}
                                >
                                  <option value="">Geen label</option>
                                  <option value="NIEUW">NIEUW</option>
                                  <option value="TIJDELIJK">TIJDELIJK</option>
                                  <option value="BINNENKORT">BINNENKORT</option>
                                  <option value="BODYKIT">BODYKIT</option>
                                  <option value="STAGED">STAGED</option>
                                </select>
                              </div>

                              {/* Foto URL */}
                              <div>
                                <label className={`text-[10px] font-bold block mb-1 uppercase tracking-wider font-mono ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                  Foto URL (Afbeelding)
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://images.unsplash.com/... (of leeg voor vector template)"
                                  value={newCarImageUrl}
                                  onChange={(e) => setNewCarImageUrl(e.target.value)}
                                  className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-950 border-neutral-850 text-slate-100 placeholder-neutral-700' : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400'
                                  }`}
                                />
                              </div>
                            </div>



                            <button
                              type="submit"
                              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md inline-block outline-none"
                            >
                              Registreer & Publiceer naar Catalogus
                            </button>
                          </form>
                        </div>
                      )}

                      {/* LIVE DATABASE TABLE - FILTER CONTROLS */}
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-neutral-950/40 border border-neutral-850 rounded-xl">
                        <div className="relative w-full md:w-80">
                          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-500" />
                          <input
                            type="text"
                            placeholder="Zoek auto op modelnaam..."
                            value={stockSearch}
                            onChange={(e) => setStockSearch(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-850 focus:border-amber-500 focus:outline-none rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 font-sans"
                          />
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400">
                          Toont <strong className="text-amber-500 font-bold">{
                            vehiclesList.filter(v => v.name.toLowerCase().includes(stockSearch.toLowerCase())).length
                          }</strong> van de {vehiclesList.length} geregistreerde modellen.
                        </div>
                      </div>

                      {/* VECHICLE LIST GRID WITH REAL-TIME ACTION RIGGING */}
                      <div className="max-h-[600px] overflow-y-auto pr-1.5 scrollbar-thin">
                        <div className="grid grid-cols-1 gap-4">
                          {vehiclesList
                            .filter(v => v.name.toLowerCase().includes(stockSearch.toLowerCase()))
                            .map((vehicle) => (
                              <div
                                key={vehicle.id}
                                className="p-4 bg-neutral-950/20 border border-neutral-850 hover:border-neutral-750 rounded-xl transition-all flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none"
                              >
                              {/* Left specs preview layout */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left">
                                <div
                                  className="w-16 h-16 rounded-xl border border-neutral-850 flex flex-col items-center justify-center relative overflow-hidden bg-neutral-955"
                                  style={{ boxShadow: 'inset 0 0 12px rgba(245, 158, 11, 0.15)' }}
                                >
                                  {vehicle.imageUrl && vehicle.imageUrl.startsWith('http') ? (
                                    <img 
                                      src={vehicle.imageUrl} 
                                      alt={vehicle.name} 
                                      referrerPolicy="no-referrer"
                                      className="w-12 h-10 object-contain"
                                    />
                                  ) : (
                                    <Car className="w-6 h-6 text-neutral-600" />
                                  )}
                                  <span className="text-[8px] font-mono font-bold text-neutral-500 mt-0.5 uppercase">
                                    {vehicle.category}
                                  </span>
                                  <div
                                    className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500"
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-slate-100 uppercase font-sans">
                                      {vehicle.name}
                                    </h4>
                                    {vehicle.badge && (() => {
                                      const bColor = getBadgeColor(vehicle.badge, vehicle.badgeColor);
                                      return (
                                        <span 
                                          className="text-[7.5px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase leading-none border"
                                          style={{
                                            backgroundColor: `${bColor}30`,
                                            borderColor: `${bColor}50`,
                                            color: bColor
                                          }}
                                        >
                                          {vehicle.badge}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-[10px] font-bold text-neutral-400 font-mono mt-0.5">
                                    Prijs: <span className="text-amber-500">€{vehicle.price.toLocaleString('nl-NL')}</span>
                                  </p>
                                  <div className="flex items-center gap-3 text-[9px] text-neutral-500 font-mono mt-1.5 border-t border-neutral-950 pt-1">
                                    <span>Topspeed: {vehicle.topSpeed} km/u</span>
                                    <span className="text-neutral-700">|</span>
                                    <span>Passagiers: {vehicle.passengers !== undefined ? vehicle.passengers : 2}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right interactive operations and stock counter */}
                              <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 transition-colors duration-300 ${
                                isDarkMode ? 'border-neutral-950' : 'border-transparent'
                              }`}>
                                
                                {/* Real-time Stock Quantities Correction block */}
                                <div className={`p-2 border rounded-lg flex items-center justify-between sm:justify-center gap-4 transition-colors duration-300 ${
                                  isDarkMode ? 'bg-neutral-955 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
                                }`}>
                                  <span className={`text-[9px] font-bold font-mono block uppercase tracking-wider pl-1 select-none transition-colors duration-300 ${
                                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                                  }`}>
                                    Voorraad:
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleDecreaseStock(vehicle.id)}
                                      disabled={vehicle.stock <= -1}
                                      className={`w-6 h-6 rounded text-xs font-black flex items-center justify-center transition-all cursor-pointer shadow border ${
                                        isDarkMode
                                          ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
                                          : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900'
                                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    >
                                      -
                                    </button>
                                    <div className={`w-8 text-center text-xs font-black font-mono py-0.5 rounded border transition-colors duration-300 ${
                                      isDarkMode
                                        ? 'text-slate-100 bg-neutral-950 border-neutral-900'
                                        : 'text-neutral-900 bg-white border-neutral-300'
                                    }`}>
                                      {vehicle.stock}
                                    </div>
                                    <button
                                      onClick={() => handleIncreaseStock(vehicle.id)}
                                      disabled={vehicle.stock >= 100}
                                      className={`w-6 h-6 rounded text-xs font-black flex items-center justify-center transition-all cursor-pointer shadow border ${
                                        isDarkMode
                                          ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
                                          : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900'
                                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                {/* Manage configurations triggers */}
                                <div className="flex gap-2 items-center justify-end">
                                  <button
                                    onClick={() => handleStartEditVehicle(vehicle)}
                                    className="px-3.5 py-2 bg-neutral-950 border border-neutral-800 hover:border-amber-500 hover:text-amber-500 text-neutral-400 text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 outline-none"
                                  >
                                    AANPASSEN
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVehicleInConsole(vehicle.id)}
                                    className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-neutral-950 rounded-lg transition-all cursor-pointer flex items-center justify-center outline-none border border-neutral-850"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* EDIT VEHICLE POP-UP MODAL OVERLAY */}
                      {editingVehicleId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
                          <div className={`rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-left relative transition-colors duration-300 ${
                            isDarkMode ? 'bg-neutral-900 border border-neutral-800 text-slate-200' : 'bg-white border border-neutral-250 text-neutral-900'
                          }`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                            
                            {/* Modal structure Header */}
                            <div className={`p-4 border-b flex items-center justify-between transition-colors duration-300 ${isDarkMode ? 'border-neutral-850' : 'border-neutral-100'}`}>
                              <div>
                                <h3 className={`text-xs font-black uppercase tracking-wider font-mono transition-colors duration-300 ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>SPECIFICATIES EN VOORRAAD BEWERKEN</h3>
                                <p className={`text-[10px] font-mono mt-0.5 transition-colors duration-300 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Laad specifieke modelwaarden van de dealership catalogus.</p>
                              </div>
                              <button
                                onClick={() => setEditingVehicleId(null)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer outline-none transition-colors duration-300 ${
                                  isDarkMode
                                    ? 'bg-neutral-950 hover:bg-neutral-800 border border-neutral-850 text-neutral-400 hover:text-white'
                                    : 'bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Modal contents Form */}
                            <form onSubmit={handleSaveEditVehicle} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                {/* Name */}
                                <div>
                                  <label className={`text-[9px] font-bold block mb-1 uppercase tracking-wider font-mono transition-colors duration-300 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Modelnaam Voertuig
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={editCarName}
                                    onChange={(e) => setEditCarName(e.target.value)}
                                    className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs transition-colors duration-300 ${
                                      isDarkMode ? 'bg-[#1e1f22] border-neutral-800 text-slate-100 font-sans' : 'bg-neutral-50 border-neutral-300 text-neutral-900 font-sans'
                                    }`}
                                  />
                                </div>

                                {/* Category */}
                                <div>
                                  <label className={`text-[9px] font-bold block mb-1 uppercase tracking-wider font-mono transition-colors duration-300 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Voertuigklasse
                                  </label>
                                  <select
                                    value={editCarCategory}
                                    onChange={(e) => setEditCarCategory(e.target.value as any)}
                                    className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs transition-colors duration-300 cursor-pointer font-bold ${
                                      isDarkMode ? 'bg-[#1e1f22] border-neutral-800 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                    }`}
                                  >
                                    <option value="Super">Super (Superclass Models)</option>
                                    <option value="Sport">Sport (Tuner & Drift Models)</option>
                                    <option value="Off-Road">Off-Road (SUVs & Trucks)</option>
                                    <option value="Sedan">Sedan (Executive Luxury Saloon)</option>
                                  </select>
                                </div>

                                {/* Price */}
                                <div>
                                  <label className={`text-[9px] font-bold block mb-1 uppercase tracking-wider font-mono transition-colors duration-300 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Catalogusprijs (€)
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    value={editCarPrice}
                                    onChange={(e) => setEditCarPrice(Number(e.target.value))}
                                    className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs font-mono transition-colors duration-300 ${
                                      isDarkMode ? 'bg-[#1e1f22] border-neutral-800 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                    }`}
                                  />
                                </div>

                                {/* Inkoopprijs */}
                                <div>
                                  <label className="text-[9px] font-bold text-amber-500 block mb-1 uppercase tracking-wider font-mono">
                                    Inkoopprijs (€) <span className={`text-[8px] font-normal lowercase italic transition-colors duration-300 ${isDarkMode ? 'text-neutral-550' : 'text-neutral-400'}`}>(Alleen Directie/Medewerkers)</span>
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    value={editCarPurchasePrice}
                                    onChange={(e) => setEditCarPurchasePrice(Number(e.target.value))}
                                    className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs font-mono transition-colors duration-300 ${
                                      isDarkMode ? 'bg-[#1e1f22] border-neutral-800 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                    }`}
                                  />
                                </div>

                                {/* Top speed */}
                                <div>
                                  <label className={`text-[9px] font-bold block mb-1 uppercase tracking-wider font-mono transition-colors duration-300 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Topsnelheid (km/u)
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    value={editCarTopSpeed}
                                    onChange={(e) => setEditCarTopSpeed(Number(e.target.value))}
                                    className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs font-mono transition-colors duration-300 ${
                                      isDarkMode ? 'bg-[#1e1f22] border-neutral-800 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                    }`}
                                  />
                                </div>

                                {/* Passengers edit */}
                                <div>
                                  <label className={`text-[9px] font-bold block mb-1 uppercase tracking-wider font-mono transition-colors duration-300 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Max. Passagiers
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min="1"
                                    value={editCarPassengers}
                                    onChange={(e) => setEditCarPassengers(Number(e.target.value))}
                                    className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs font-mono transition-colors duration-300 ${
                                      isDarkMode ? 'bg-[#1e1f22] border-neutral-800 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                    }`}
                                  />
                                </div>

                                {/* Stock edit */}
                                <div>
                                  <label className={`text-[9px] font-bold block mb-1 uppercase tracking-wider font-mono transition-colors duration-300 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Gecorrigeerde Voorraad
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min="-1"
                                    max="100"
                                    value={editCarStock}
                                    onChange={(e) => setEditCarStock(Number(e.target.value))}
                                    className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs font-mono transition-colors duration-300 ${
                                      isDarkMode ? 'bg-[#1e1f22] border-neutral-800 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                    }`}
                                  />
                                </div>

                                {/* Badge */}
                                <div>
                                  <label className={`text-[9px] font-bold block mb-1 uppercase tracking-wider font-mono transition-colors duration-300 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Catalogus status-label
                                  </label>
                                  <select
                                    value={editCarBadge}
                                    onChange={(e) => setEditCarBadge(e.target.value)}
                                    className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs transition-colors duration-300 ${
                                      isDarkMode ? 'bg-[#1e1f22] border-neutral-800 text-slate-100 font-sans' : 'bg-neutral-50 border-neutral-300 text-neutral-900 font-sans'
                                    }`}
                                  >
                                    <option value="">Geen label</option>
                                    <option value="NIEUW">NIEUW</option>
                                    <option value="TIJDELIJK">TIJDELIJK</option>
                                    <option value="BINNENKORT">BINNENKORT</option>
                                    <option value="BODYKIT">BODYKIT</option>
                                    <option value="STAGED">STAGED</option>
                                  </select>
                                </div>

                                {/* Foto URL */}
                                <div>
                                  <label className={`text-[9px] font-bold block mb-1 uppercase tracking-wider font-mono transition-colors duration-300 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Foto URL (Afbeelding)
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://images.unsplash.com/... (of leeg)"
                                    value={editCarImageUrl}
                                    onChange={(e) => setEditCarImageUrl(e.target.value)}
                                    className={`w-full focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs transition-colors duration-300 ${
                                      isDarkMode ? 'bg-[#1e1f22] border-neutral-800 text-slate-100 placeholder-neutral-700' : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400'
                                    }`}
                                  />
                                </div>
                              </div>



                              {/* Featured highlight toggle */}
                              <div className={`flex items-center gap-2 border-t pt-3 select-none transition-colors duration-300 ${isDarkMode ? 'border-neutral-850' : 'border-neutral-100'}`}>
                                <input
                                  type="checkbox"
                                  id="editCarFeatured"
                                  checked={editCarFeatured}
                                  onChange={(e) => setEditCarFeatured(e.target.checked)}
                                  className={`w-4 h-4 accent-amber-500 rounded transition-colors duration-300 ${
                                    isDarkMode ? 'border-neutral-800 bg-[#1e1f22]' : 'border-neutral-300 bg-neutral-100'
                                  }`}
                                />
                                <label htmlFor="editCarFeatured" className={`text-[10px] font-bold font-mono cursor-pointer transition-colors duration-300 ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                  Zet op de Uitgelichte Showroom-box
                                </label>
                              </div>

                              {/* Save cancel actions */}
                              <div className={`flex justify-end gap-2.5 pt-2 border-t transition-colors duration-300 ${isDarkMode ? 'border-neutral-850' : 'border-neutral-100'}`}>
                                <button
                                  type="button"
                                  onClick={() => setEditingVehicleId(null)}
                                  className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer outline-none ${
                                    isDarkMode 
                                      ? 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-400' 
                                      : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-250 text-neutral-600'
                                  }`}
                                >
                                  Annuleren
                                </button>
                                <button
                                  type="submit"
                                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-900 text-xs font-black uppercase rounded-lg transition-all cursor-pointer shadow-lg outline-none"
                                >
                                  WIJZIGINGEN OPSLAAN
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* PREVIOUS SALES LEDGER BOARD */}
                  {activeEmployeeSubTab === 'sales' && (
                    <div className="space-y-6 text-left animate-fadeIn">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-850 pb-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">ADMINISTRATIE & BEHEER</h3>
                          <p className="text-[11px] text-neutral-500 mt-0.5 font-mono font-sans">Controleer alle showroomverkopen, beheer het klantenbestand en onderhoud de transactieadministratie.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] bg-neutral-950 text-neutral-400 font-mono px-2 py-1 rounded border border-neutral-850">
                            Geregistreerde Verkopen: {salesList.length} Stuks
                          </span>
                        </div>
                      </div>

                      {/* Sub-navigatie binnen Administratie */}
                      <div className="flex border-b border-neutral-800/15 dark:border-neutral-850 gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveAdminSubView('sales_history')}
                          className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                            activeAdminSubView === 'sales_history'
                              ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                              : 'border-transparent text-neutral-400 hover:text-slate-100 hover:bg-neutral-900/10'
                          }`}
                        >
                          Eerdere Verkopen
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAdminSubView('customer_database')}
                          className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                            activeAdminSubView === 'customer_database'
                              ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                              : 'border-transparent text-neutral-400 hover:text-slate-100 hover:bg-neutral-900/10'
                          }`}
                        >
                          Klantenbestand
                        </button>
                      </div>

                      {activeAdminSubView === 'customer_database' ? (
                        /* KLANTENBESTAND VIEW */
                        <div className="space-y-6 animate-fadeIn pb-4">
                          {/* Search & List block */}
                          <div className={`p-4 border rounded-xl transition-colors duration-300 ${
                            isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-white border-neutral-200 shadow-sm'
                          }`}>
                            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-end mb-6 border-b pb-4 border-neutral-800/10 dark:border-neutral-850/60">
                              <div className="w-full lg:max-w-md">
                                <label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-400 block mb-1">
                                  Klant Opzoeken (Naam of BSN)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Typ klantnaam of BSN-nummer..."
                                  value={customerSearch}
                                  onChange={(e) => setCustomerSearch(e.target.value)}
                                  className={`w-full focus:border-amber-500 focus:outline-none rounded px-3.5 py-1.5 text-xs transition-colors duration-300 ${
                                    isDarkMode ? 'bg-neutral-900 border-neutral-850 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                  }`}
                                />
                              </div>
                              <div className="flex flex-wrap gap-2 text-[9px] font-mono">
                                <div className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                                  <span className="font-extrabold">★ VIP Klant:</span>
                                  <span className="text-neutral-405 dark:text-neutral-400">&gt; €15M</span>
                                </div>
                                <div className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-650 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                  <span className="font-extrabold">✦ Premium:</span>
                                  <span className="text-neutral-405 dark:text-neutral-400">&gt; 10 Auto's</span>
                                </div>
                                <div className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                  <span className="font-extrabold">✔ Geverifieerd:</span>
                                  <span className="text-neutral-450 dark:text-neutral-400">&gt; 5 Auto's</span>
                                </div>
                                <div className="px-2.5 py-1 rounded bg-neutral-500/15 text-neutral-500 dark:text-neutral-400 border border-neutral-500/10 flex items-center gap-1">
                                  <span className="font-extrabold">👤 Regulier:</span>
                                  <span className="text-neutral-500 dark:text-neutral-400">Standaard</span>
                                </div>
                              </div>
                            </div>

                            {/* Main customer list */}
                            {(() => {
                              const uniqueCustomersMap = new Map<string, {
                                customerName: string;
                                bsnNumber: string;
                                birthDate: string;
                                totalSpent: number;
                                carsBoughtCount: number;
                                carsBought: string[];
                                history: Sale[];
                              }>();

                              salesList.forEach(sale => {
                                if (!sale.customerName) return;
                                const key = sale.bsnNumber ? sale.bsnNumber.trim().toUpperCase() : sale.customerName.trim().toLowerCase();
                                const existing = uniqueCustomersMap.get(key);
                                if (existing) {
                                  existing.totalSpent += sale.price;
                                  existing.carsBoughtCount += 1;
                                  if (!existing.carsBought.includes(sale.vehicleName)) {
                                    existing.carsBought.push(sale.vehicleName);
                                  }
                                  existing.history.push(sale);
                                } else {
                                  uniqueCustomersMap.set(key, {
                                    customerName: sale.customerName,
                                    bsnNumber: sale.bsnNumber || 'Onbekend',
                                    birthDate: sale.birthDate || 'Onbekend',
                                    totalSpent: sale.price,
                                    carsBoughtCount: 1,
                                    carsBought: [sale.vehicleName],
                                    history: [sale]
                                  });
                                }
                              });

                              const customersList = Array.from(uniqueCustomersMap.values());
                              const filteredCustomers = customersList.filter(c => 
                                c.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                c.bsnNumber.toLowerCase().includes(customerSearch.toLowerCase())
                              );

                              if (filteredCustomers.length === 0) {
                                return (
                                  <p className="text-xs text-neutral-500 italic font-mono py-4 text-center">Geen actieve klanten gevonden die voldoen aan deze zoekcriteria.</p>
                                );
                              }

                              return (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {/* Left list panel */}
                                  <div className="lg:col-span-1 space-y-2 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
                                    <div className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider mb-2">Geregistreerde Leden ({filteredCustomers.length})</div>
                                    {filteredCustomers.map(c => {
                                      const isSelected = selectedCustomerBsn === c.bsnNumber;
                                      return (
                                        <button
                                          key={c.bsnNumber}
                                          type="button"
                                          onClick={() => setSelectedCustomerBsn(c.bsnNumber)}
                                          className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                                            isSelected 
                                              ? 'border-amber-500 bg-amber-500/5' 
                                              : isDarkMode 
                                                ? 'bg-neutral-900 border-neutral-850 hover:bg-neutral-850 hover:border-neutral-700' 
                                                : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 shadow-xs'
                                          }`}
                                        >
                                          <div className={`font-bold text-xs ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>{c.customerName}</div>
                                          <div className="text-[10px] font-mono text-neutral-500 mt-1">BSN: {c.bsnNumber}</div>
                                          
                                          {/* Mini status indicators */}
                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                            {false && (
                                              <span className={`px-1 py-0.2 rounded text-[7.5px] font-extrabold uppercase tracking-wider border ${
                                                customerStatuses[c.bsnNumber].status === 'Actief / Geautoriseerd'
                                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                  : customerStatuses[c.bsnNumber].status === 'VIP Status'
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm'
                                                    : customerStatuses[c.bsnNumber].status === 'In Screening'
                                                      ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                                                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                              }`}>
                                                🛡️ {customerStatuses[c.bsnNumber].status.split(' ')[0]}
                                              </span>
                                            )}
                                            {c.totalSpent >= 15000000 && (
                                              <span className="px-1 py-0.2 rounded text-[7.5px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                ★ VIP
                                              </span>
                                            )}
                                            {c.carsBoughtCount >= 10 && (
                                              <span className="px-1 py-0.2 rounded text-[7.5px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                ✦ Premium
                                              </span>
                                            )}
                                            {c.carsBoughtCount >= 5 && (
                                              <span className="px-1 py-0.2 rounded text-[7.5px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                ✔ Geverifieerd
                                              </span>
                                            )}
                                            {!(c.totalSpent >= 15000000 || c.carsBoughtCount >= 10 || c.carsBoughtCount >= 5) && (
                                              <span className="px-1 py-0.2 rounded text-[7.5px] font-medium uppercase tracking-wider bg-neutral-500/10 text-neutral-400 border border-neutral-500/10">
                                                👤 Regulier
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex justify-between items-center mt-2 pt-1 border-t border-neutral-800/10 dark:border-neutral-800 text-[9px] font-mono text-neutral-400">
                                            <span>{c.carsBoughtCount} x auto's</span>
                                            <span className="font-extrabold text-amber-500">€ {c.totalSpent.toLocaleString()}</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Right details panel */}
                                  <div className="lg:col-span-2">
                                    {(() => {
                                      const activeCustomer = customersList.find(c => c.bsnNumber === (selectedCustomerBsn || (filteredCustomers[0] ? filteredCustomers[0].bsnNumber : '')));
                                      if (!activeCustomer) {
                                        return (
                                          <div className={`h-full flex items-center justify-center p-6 border border-dashed rounded-lg ${isDarkMode ? 'border-neutral-800 text-neutral-500' : 'border-neutral-300 text-neutral-400'}`}>
                                            <p className="text-xs font-mono">Selecteer een klant aan de linkerkant om de aankoophistorie en financiële statistieken op te vragen.</p>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div className="space-y-4 animate-fadeIn">
                                          {/* Customer Card header */}
                                          <div className={`p-4 border rounded-lg ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-250 shadow-xs'}`}>
                                            <span className="text-[9px] font-bold font-mono text-amber-500 tracking-widest uppercase">PROFIELLOGBOEK</span>
                                            <h4 className={`text-base font-black uppercase tracking-tight mt-1 ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>{activeCustomer.customerName}</h4>
                                            
                                            {/* Statuses based on spending and vehicles purchased */}
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                              {activeCustomer.totalSpent >= 15000000 && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                  ★ VIP klant
                                                </span>
                                              )}
                                              {activeCustomer.carsBoughtCount >= 10 && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                  ✦ Premium klant
                                                </span>
                                              )}
                                              {activeCustomer.carsBoughtCount >= 5 && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-450 dark:text-blue-400 border border-blue-500/20">
                                                  ✔ Geverifieerd klant
                                                </span>
                                              )}
                                              {!(activeCustomer.totalSpent >= 15000000 || activeCustomer.carsBoughtCount >= 10 || activeCustomer.carsBoughtCount >= 5) && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-neutral-500/15 text-neutral-400 border border-neutral-500/10">
                                                  👤 Reguliere klant
                                                </span>
                                              )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-neutral-800/10 dark:border-neutral-800 text-[11px] font-mono font-sans">
                                              <div>
                                                <span className="text-[9px] text-neutral-400 block uppercase font-mono">BSN-nummer</span>
                                                <span className="font-bold">{activeCustomer.bsnNumber}</span>
                                              </div>
                                              <div>
                                                <span className="text-[9px] text-neutral-400 block uppercase font-mono">Geboortedatum</span>
                                                <span className="font-bold">{activeCustomer.birthDate}</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Key statistics metrics container */}
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className={`p-3 border rounded-lg ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-250 shadow-xs'}`}>
                                              <span className="text-[9px] font-mono text-neutral-400 uppercase block">Totaal Geïnvesteerd</span>
                                              <div className="text-lg font-bold font-mono text-emerald-500 mt-1">€ {activeCustomer.totalSpent.toLocaleString()}</div>
                                            </div>
                                            <div className={`p-3 border rounded-lg ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-250 shadow-xs'}`}>
                                              <span className="text-[9px] font-mono text-neutral-400 uppercase block">Gekochte Voertuigen</span>
                                              <div className="text-lg font-bold font-mono text-amber-500 mt-1">{activeCustomer.carsBoughtCount} Gekocht</div>
                                            </div>
                                          </div>

                                          {/* Interactive Sovereign CRM Client Status */}
                                          <div className={`p-4 border rounded-xl space-y-4 text-left ${
                                            isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-250 shadow-xs'
                                          }`}>
                                            <div className="flex items-center justify-between border-b pb-2 border-neutral-800/10 dark:border-neutral-850">
                                              <div className="flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-amber-500 animate-pulse" />
                                                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>
                                                  INTERNE KLANTNOTITIES
                                                </span>
                                              </div>
                                              <span className="text-[8px] font-mono bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-amber-500/20">
                                                NOTITIES & MEMO
                                              </span>
                                            </div>

                                            <div className="space-y-3">


                                              <div>
                                                <label className="text-[8.5px] font-extrabold uppercase tracking-wider text-neutral-400 block font-mono mb-1.5">
                                                  Persoonlijke Notities / Aantekeningen
                                                </label>
                                                <textarea
                                                  value={customerStatuses[activeCustomer.bsnNumber]?.note || ''}
                                                  placeholder="Typ hier aantekeningen over de betaalkracht, gedrag of achtergrond van de klant..."
                                                  onChange={(e) => {
                                                    const currentStatus = customerStatuses[activeCustomer.bsnNumber]?.status || 'Actief / Geautoriseerd';
                                                    updateCustomerStatusInStorage(activeCustomer.bsnNumber, currentStatus, e.target.value);
                                                  }}
                                                  className={`w-full text-xs rounded p-2.5 outline-none border transition-colors h-16 resize-none font-sans ${
                                                    isDarkMode ? 'bg-[#0f0f11] border-neutral-800 text-slate-200 focus:border-amber-500' : 'bg-white border-neutral-300 text-neutral-800 focus:border-amber-500'
                                                  }`}
                                                />
                                              </div>
                                            </div>
                                          </div>

                                          {/* List of models bought */}
                                          <div className={`p-3.5 border rounded-lg space-y-1.5 ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-250 shadow-xs'}`}>
                                            <span className="text-[9px] font-mono text-neutral-400 uppercase block font-mono">Geregistreerde Wagenpark Modellen</span>
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                              {activeCustomer.carsBought.map(car => (
                                                <span 
                                                  key={car} 
                                                  className="px-2 py-0.5 rounded font-bold font-sans text-[10px] bg-amber-500/15 border border-amber-500/20 text-amber-500"
                                                >
                                                  {car}
                                                </span>
                                              ))}
                                            </div>
                                          </div>

                                          {/* Historical transaction table */}
                                          <div className={`p-4 border rounded-lg space-y-3 ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-250 shadow-xs'}`}>
                                            <h5 className={`text-xs font-black uppercase font-sans tracking-wide ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>Aankoopgeschiedenis & Facturen</h5>
                                            
                                            <div className="overflow-x-auto max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                                              <table className="w-full text-left border-collapse text-[10.5px]">
                                                <thead>
                                                  <tr className={`border-b text-[9px] font-mono uppercase ${isDarkMode ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-500'}`}>
                                                    <th className="py-2">Datum</th>
                                                    <th className="py-2">Model</th>
                                                    <th className="py-2">Bedrag</th>
                                                    <th className="py-2 text-right font-sans">Status</th>
                                                  </tr>
                                                </thead>
                                                <tbody className={`divide-y font-mono ${isDarkMode ? 'divide-neutral-800/50' : 'divide-neutral-200'}`}>
                                                  {activeCustomer.history.map(hist => (
                                                    <tr key={hist.id} className={`transition-colors ${isDarkMode ? 'text-neutral-300 hover:text-white font-sans' : 'text-neutral-750 font-sans'}`}>
                                                      <td className="py-2 text-neutral-450 font-mono text-[10px]">{hist.date}</td>
                                                      <td className="py-2 font-bold font-sans">{hist.vehicleName}</td>
                                                      <td className="py-2 font-bold font-mono">€ {hist.price.toLocaleString()}</td>
                                                      <td className="py-2 text-right font-sans">
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                                                          hist.delivered === true
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                            : hist.delivered === 'reserved'
                                                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                          {hist.delivered === true ? 'GELEVERD' : hist.delivered === 'reserved' ? 'GERESERVEERD' : 'PENDING'}
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        /* CURRENT LOGBOOK TABLE VIEW (EERDERE VERKOPEN) */
                        <>
                          {/* Filter Controls Tool */}
                          <div className={`p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 border transition-colors duration-300 ${
                            isDarkMode ? 'bg-neutral-950/40 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
                          }`}>
                        {/* Search */}
                        <div>
                          <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>Zoek Klant of Voertuig</label>
                          <input
                            type="text"
                            placeholder="Typ naam van de klant of auto..."
                            value={salesSearch}
                            onChange={(e) => setSalesSearch(e.target.value)}
                            className={`w-full focus:border-amber-500 focus:outline-none rounded px-3.5 py-1.5 text-xs transition-colors duration-300 ${
                              isDarkMode ? 'bg-neutral-950 border-neutral-850 text-slate-100' : 'bg-white border-neutral-300 text-neutral-900 shadow-sm'
                            }`}
                          />
                        </div>

                        {/* Price Filter */}
                        <div>
                          <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>Filter Prijsklasse</label>
                          <select
                            value={salesPriceFilter}
                            onChange={(e) => setSalesPriceFilter(e.target.value as any)}
                            className={`w-full focus:border-amber-500 focus:outline-none rounded px-3 py-1.5 text-xs font-sans cursor-pointer font-semibold transition-colors duration-300 ${
                              isDarkMode ? 'bg-neutral-950 border-neutral-850 text-slate-100' : 'bg-white border-neutral-300 text-neutral-900 shadow-sm'
                            }`}
                          >
                            <option value="All">Alle Prijsklassen</option>
                            <option value="under-1m">Onder € 1 miljoen</option>
                            <option value="1m-2.5m">Tussen € 1 en 2.5 miljoen</option>
                            <option value="2.5m-5m">Tussen € 2.5 en 5 miljoen</option>
                            <option value="over-5m">Boven € 5 miljoen</option>
                          </select>
                        </div>

                        {/* Sorting */}
                        <div>
                          <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>Sorteer Facturen Op</label>
                          <select
                            value={salesSort}
                            onChange={(e) => setSalesSort(e.target.value as any)}
                            className={`w-full focus:border-amber-500 focus:outline-none rounded px-3 py-1.5 text-xs font-sans cursor-pointer font-semibold transition-colors duration-300 ${
                              isDarkMode ? 'bg-neutral-950 border-neutral-850 text-slate-100' : 'bg-white border-neutral-300 text-neutral-900 shadow-sm'
                            }`}
                          >
                            <option value="date-desc">Datum: Nieuwste Eerst</option>
                            <option value="date-asc">Datum: Oudste Eerst</option>
                            <option value="price-desc">Prijs: Hoogste Eerst</option>
                            <option value="price-asc">Prijs: Laagste Eerst</option>
                            <option value="customer">Klant (A-Z)</option>
                            <option value="car">Modelnaam Voertuig (A-Z)</option>
                          </select>
                        </div>
                      </div>

                      {/* RECORD NEW SALES SUB-FORM */}
                      <div className={`p-4 rounded-xl space-y-4 border transition-colors duration-300 ${
                        isDarkMode ? 'bg-neutral-950/80 border-neutral-850' : 'bg-neutral-50/80 border-neutral-200 shadow-sm'
                      }`}>
                        <div className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? 'border-neutral-900' : 'border-neutral-200'}`}>
                          <h4 className="text-[10px] font-black text-amber-500 tracking-widest font-mono uppercase">Snelle Registratie van Showroomverkoop</h4>
                          <span className={`text-[9px] border px-1.5 py-0.5 rounded font-mono ${
                            isDarkMode ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>BBS & Rijbewijs Geregistreerd</span>
                        </div>
                        {saleSuccess && (
                          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md text-[11px] font-mono animate-pulse">
                            {saleSuccess}
                          </div>
                        )}
                        {saleError && (
                          <div className="p-2.5 bg-rose-500/15 border border-rose-505/20 text-rose-500 rounded-md text-[11.5px] font-mono font-black">
                            {saleError}
                          </div>
                        )}
                        <form onSubmit={handleRecordSale} className="space-y-4">
                          {/* Snelkoppeling Bestaande Klant */}
                          {(() => {
                            const uniqueCustomers: Sale[] = Array.from(
                              new Map<string, Sale>(
                                salesList
                                  .filter(s => s.customerName && s.customerName.trim() !== '')
                                  .map(s => [s.customerName.trim().toLowerCase(), s])
                              ).values()
                            );
                            if (uniqueCustomers.length > 0) {
                              return (
                                <div className="p-3 bg-neutral-900/25 dark:bg-neutral-950/25 rounded-lg border border-neutral-800/10 dark:border-neutral-850">
                                  <label className="text-[10px] font-black tracking-wider font-mono block uppercase mb-1.5 text-amber-500">
                                    Snelkoppeling: Bestaande Klant Selecteren (Optioneel)
                                  </label>
                                  <select
                                    onChange={(e) => {
                                      const selectedBsn = e.target.value;
                                      if (selectedBsn) {
                                        const client = uniqueCustomers.find(c => c.bsnNumber === selectedBsn);
                                        if (client) {
                                          setSaleCustName(client.customerName);
                                          setSaleBsn(client.bsnNumber);
                                          setSaleBirthDate(client.birthDate || '');
                                        }
                                      } else {
                                        setSaleCustName('');
                                        setSaleBsn('');
                                        setSaleBirthDate('');
                                      }
                                    }}
                                    className={`w-full max-w-md border rounded px-3 py-1.5 text-xs font-sans cursor-pointer focus:outline-none transition-colors duration-300 ${
                                      isDarkMode 
                                        ? 'bg-neutral-900 border-neutral-850 text-slate-100 focus:border-amber-500/80' 
                                        : 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-505'
                                    }`}
                                  >
                                    <option value="">-- Selecteer klant om gegevens automatisch in te vullen --</option>
                                    {uniqueCustomers.map(c => (
                                      <option key={c.bsnNumber} value={c.bsnNumber}>
                                        {c.customerName} (BSN: {c.bsnNumber})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-505'}`}>BSN-nummer Klant</label>
                              <input
                                type="text"
                                required
                                placeholder="ORP-BSN-12345678"
                                value={saleBsn}
                                onChange={(e) => handleBsnChange(e.target.value, setSaleBsn)}
                                className={`w-full border rounded px-3 py-1.5 text-xs font-mono focus:outline-none transition-colors duration-300 ${
                                  isDarkMode 
                                    ? 'bg-neutral-900 border-neutral-850 text-slate-100 focus:border-amber-500/80' 
                                    : 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-505'
                                }`}
                              />
                            </div>

                            <div>
                              <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-505'}`}>Geboortedatum Klant</label>
                              <input
                                type="date"
                                required
                                value={saleBirthDate}
                                onChange={(e) => setSaleBirthDate(e.target.value)}
                                className={`w-full border rounded px-3 py-1.5 text-xs font-mono cursor-pointer focus:outline-none transition-colors duration-300 ${
                                  isDarkMode 
                                    ? 'bg-neutral-900 border-neutral-850 text-slate-100 focus:border-amber-500/80' 
                                    : 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-505'
                                }`}
                              />
                            </div>

                            <div>
                              <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-505'}`}>Volledige Naam Klant</label>
                              <input
                                type="text"
                                required
                                placeholder="bijv. Franklin Clinton"
                                value={saleCustName}
                                onChange={(e) => setSaleCustName(e.target.value)}
                                className={`w-full border rounded px-3 py-1.5 text-xs font-sans focus:outline-none transition-colors duration-300 ${
                                  isDarkMode 
                                    ? 'bg-neutral-900 border-neutral-850 text-slate-100 focus:border-amber-500/80' 
                                    : 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-505'
                                }`}
                              />
                            </div>

                            <div>
                              <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-505'}`}>Volledige Naam Verkoper</label>
                              <select
                                required
                                value={saleAgentName}
                                onChange={(e) => setSaleAgentName(e.target.value)}
                                className={`w-full border rounded px-3 py-1.5 text-xs font-sans cursor-pointer font-bold focus:outline-none transition-colors duration-300 ${
                                  isDarkMode 
                                    ? 'bg-neutral-900 border-neutral-850 text-slate-100 focus:border-amber-500/80' 
                                    : 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-505'
                                }`}
                              >
                                <option value="">-- Kies Verkoper --</option>
                                {discordStaff.map(st => (
                                  <option key={st.name} value={st.name}>
                                    {st.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-505'}`}>Het Voertuig</label>
                              <select
                                required
                                value={saleCarId}
                                onChange={(e) => setSaleCarId(e.target.value)}
                                className={`w-full border rounded px-3 py-1.5 text-xs font-sans cursor-pointer font-bold focus:outline-none transition-colors duration-300 ${
                                  isDarkMode 
                                    ? 'bg-neutral-900 border-neutral-850 text-slate-100 focus:border-amber-500/80' 
                                    : 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-505'
                                }`}
                              >
                                <option value="">-- Kies Voertuig --</option>
                                {vehiclesList.map(v => (
                                  <option key={v.id} value={v.id}>
                                    {v.name} (€ {v.price.toLocaleString()}) {v.stock === -1 ? '[GEEN VOORRAAD]' : v.stock === 0 ? '[HUIDIGE VOORRAAD VERKOCHT]' : `[HUIDIGE VOORRAAD: ${v.stock}]`}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-505'}`}>Type Voertuig</label>
                              <select
                                required
                                disabled
                                value={saleVehicleType}
                                onChange={(e) => setSaleVehicleType(e.target.value)}
                                className={`w-full opacity-75 cursor-not-allowed border rounded px-3 py-1.5 text-xs font-sans font-bold focus:outline-none transition-colors duration-300 ${
                                  isDarkMode 
                                    ? 'bg-neutral-900/50 border-neutral-850 text-slate-100' 
                                    : 'bg-neutral-200/50 border-neutral-300 text-neutral-900/80'
                                }`}
                              >
                                <option value="Super">Super</option>
                                <option value="Sport">Sport</option>
                                <option value="Off-Road">Off-Road</option>
                                <option value="Sedan">Sedan</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-amber-500 tracking-wider font-mono block uppercase mb-1">
                                Kosten van de Aankoop (€) <span className="text-[8px] text-neutral-500 lowercase italic">(automatisch berekend)</span>
                              </label>
                              <input
                                type="text"
                                disabled
                                value={`€ ${salePrice.toLocaleString()}`}
                                className={`w-full border rounded px-3 py-1.5 text-xs font-mono focus:outline-none cursor-not-allowed font-bold transition-colors duration-300 ${
                                  isDarkMode 
                                    ? 'bg-neutral-900/65 border-neutral-850 text-amber-500' 
                                    : 'bg-neutral-100/70 border-neutral-250 text-amber-600'
                                }`}
                              />
                            </div>

                            <div>
                              <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-505'}`}>Spoedkosten (+ €50.000)</label>
                              <select
                                value={saleRushCosts ? "TRUE" : "FALSE"}
                                onChange={(e) => setSaleRushCosts(e.target.value === "TRUE")}
                                className={`w-full border rounded px-3 py-1.5 text-xs font-sans cursor-pointer font-bold focus:outline-none transition-colors duration-300 ${
                                  isDarkMode 
                                    ? 'bg-neutral-900 border-neutral-850 text-slate-100 focus:border-amber-500/80' 
                                    : 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-505'
                                }`}
                              >
                                <option value="FALSE">Nee (Standaard levering)</option>
                                <option value="TRUE">Ja (Spoedlevering + €50.000)</option>
                              </select>
                            </div>

                            <div>
                              <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-505'}`}>Status Aangeleverd</label>
                              <select
                                value={saleDelivered === 'reserved' ? "RESERVED" : saleDelivered ? "YES" : "NO"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "YES") setSaleDelivered(true);
                                  else if (val === "RESERVED") setSaleDelivered('reserved');
                                  else setSaleDelivered(false);
                                }}
                                className={`w-full border rounded px-3 py-1.5 text-xs font-sans cursor-pointer font-bold focus:outline-none transition-colors duration-300 ${
                                  isDarkMode 
                                    ? 'bg-neutral-900 border-neutral-850 text-slate-100 focus:border-amber-500/80' 
                                    : 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-505'
                                }`}
                              >
                                <option value="YES">Ja, auto is direct aangeleverd</option>
                                <option value="NO">Nee, alleen administratief (Nog niet geleverd)</option>
                                <option value="RESERVED">Gereserveerd</option>
                              </select>
                            </div>
                          </div>

                          <div className={`flex justify-end pt-2 border-t ${isDarkMode ? 'border-neutral-900' : 'border-neutral-200'}`}>
                            <button
                              type="submit"
                              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/10"
                            >
                              Factureer & Boek Verkoop
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Display grid table rows */}
                      <div className="max-h-[600px] overflow-y-auto pr-1.5 scrollbar-thin">
                        <div className="space-y-2.5">
                          {(() => {
                          let filteredSales = [...salesList];
                          if (salesSearch.trim()) {
                            const q = salesSearch.toLowerCase();
                            filteredSales = filteredSales.filter(s =>
                              s.customerName.toLowerCase().includes(q) ||
                              s.vehicleName.toLowerCase().includes(q)
                            );
                          }
                           if (salesPriceFilter !== 'All') {
                            filteredSales = filteredSales.filter(s => {
                              if (salesPriceFilter === 'under-1m') return s.price < 1000000;
                              if (salesPriceFilter === '1m-2.5m') return s.price >= 1000000 && s.price < 2500000;
                              if (salesPriceFilter === '2.5m-5m') return s.price >= 2500000 && s.price < 5000000;
                              if (salesPriceFilter === 'over-5m') return s.price >= 5000000;
                              return true;
                            });
                          }
                          filteredSales.sort((a,b) => {
                            if (salesSort === 'price-desc') return b.price - a.price;
                            if (salesSort === 'price-asc') return a.price - b.price;
                            if (salesSort === 'customer') return a.customerName.localeCompare(b.customerName);
                            if (salesSort === 'car') return a.vehicleName.localeCompare(b.vehicleName);
                            if (salesSort === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
                            return new Date(b.date).getTime() - new Date(a.date).getTime();
                          });

                          if (filteredSales.length === 0) {
                            return <p className="text-xs text-neutral-500 italic py-8 text-center bg-neutral-950 border border-neutral-850 rounded-lg">Geen eerdere verkopen gevonden die voldoen aan de filters.</p>;
                          }

                          return filteredSales.map((s) => {
                            const isDelivered = s.delivered === true;
                            const isReserved = s.delivered === 'reserved';

                            let cardBorderClass = '';
                            let indicatorClass = '';
                            let badgeStyle = '';
                            let badgeText = '';

                            if (isDelivered) {
                              cardBorderClass = isDarkMode ? 'border-neutral-855' : 'border-neutral-200 shadow-xs';
                              indicatorClass = 'bg-emerald-500';
                              badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                              badgeText = '✓ Geleverd';
                            } else if (isReserved) {
                              cardBorderClass = isDarkMode ? 'border-blue-900/40 shadow-[0_0_15px_rgba(59,130,246,0.03)]' : 'border-blue-200 shadow-xs';
                              indicatorClass = 'bg-blue-500';
                              badgeStyle = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                              badgeText = '✉ Gereserveerd';
                            } else {
                              cardBorderClass = isDarkMode ? 'border-rose-900/40 shadow-[0_0_15px_rgba(239,68,68,0.02)]' : 'border-rose-300 shadow-xs';
                              indicatorClass = 'bg-rose-500 animate-pulse';
                              badgeStyle = 'bg-rose-500/15 text-rose-400 border border-rose-500/25';
                              badgeText = '⚠️ Niet Geleverd';
                            }

                            return (
                              <div key={s.id} className={`p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden transition-all border ${
                                isDarkMode ? 'bg-neutral-950 ' + cardBorderClass : 'bg-white shadow-xs ' + cardBorderClass
                              }`}>
                                <div className={`absolute left-0 top-0 h-full w-1 ${indicatorClass}`}></div>
                                <div className="space-y-1.5 flex-grow">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-[10px] font-mono font-bold border px-1.5 py-0.5 rounded ${badgeStyle}`}>
                                      {s.id}
                                    </span>
                                    <h4 className={`text-xs font-black uppercase tracking-wide ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>{s.customerName}</h4>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-bold ${badgeStyle}`}>
                                      {badgeText}
                                    </span>
                                  <span className={`text-[10px] border font-mono px-2 py-0.5 rounded select-none ${
                                    isDarkMode ? 'bg-neutral-950 border-neutral-850 text-neutral-400' : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                                  }`}>
                                    {s.paymentMethod}
                                  </span>
                                  {s.rushCosts && (
                                    <span className="text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/20 font-mono font-extrabold px-1.5 py-0.5 rounded select-none uppercase tracking-wide animate-pulse">
                                      ⚡ SPOED
                                    </span>
                                  )}
                                  {s.bsnNumber && (
                                    <span className={`text-[9px] border font-mono font-bold px-1.5 py-0.5 rounded select-none ${
                                      isDarkMode ? 'bg-neutral-950 text-slate-350 border-neutral-850' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                    }`}>
                                      BSN: {s.bsnNumber}
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[11px] ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                  Model: <strong className={`font-extrabold ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>{s.vehicleName}</strong> 
                                  {s.vehicleType && <span className="text-neutral-500"> ({s.vehicleType})</span>} • Datum: <span className={`font-mono text-[10.5px] ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{s.date}</span>
                                </div>
                                <p className="text-[10px] text-neutral-500 font-mono">
                                  VERKOPER: <strong className="text-amber-500">{s.salesAgent}</strong> {s.birthDate && <span>• GEBOORTEDATUM: <strong className={`${isDarkMode ? 'text-neutral-400' : 'text-neutral-650'} font-mono`}>{s.birthDate}</strong></span>}
                                </p>
                              </div>

                              <div className={`flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 ${
                                isDarkMode ? 'border-neutral-850' : 'border-neutral-200'
                              }`}>
                                <div className="text-left sm:text-right">
                                  <div className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider">Totaal Factuurbedrag</div>
                                  <div className={`text-md font-black font-mono ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>€ {s.price.toLocaleString()}</div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setOpenedSale(s)}
                                    className={`p-1 px-2.5 border font-bold text-[10px] uppercase rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm font-sans ${
                                      isDarkMode 
                                        ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700 text-slate-100 hover:text-amber-500' 
                                        : 'bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-305 text-amber-800 hover:text-amber-905 shadow-sm'
                                    }`}
                                    title="Openen"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-amber-500" /> Openen
                                  </button>
                                  <button
                                    onClick={() => handleStartEditSale(s)}
                                    className={`p-1 px-2.5 border font-bold text-[10px] uppercase rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm font-sans ${
                                      isDarkMode 
                                        ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700 text-slate-100 hover:text-blue-400' 
                                        : 'bg-blue-50 hover:bg-blue-105 border-blue-200 hover:border-blue-305 text-blue-800 hover:text-blue-905 shadow-sm'
                                    }`}
                                    title="Aanpassen"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-blue-500" /> Aanpassen
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSale(s.id)}
                                    className={`p-1 px-2.5 border font-bold text-[10px] uppercase rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm font-sans ${
                                      deleteConfirmId === s.id
                                        ? 'bg-rose-600 border-rose-500 text-neutral-950 scale-105 active:scale-95 animate-pulse font-extrabold shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                                        : isDarkMode
                                          ? 'bg-rose-955/20 hover:bg-rose-950/40 border-rose-900/40 hover:border-rose-900 text-rose-455'
                                          : 'bg-rose-50 hover:bg-rose-100 border-rose-200 hover:border-rose-300 text-rose-800'
                                    }`}
                                    title="Verwijderen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {deleteConfirmId === s.id ? 'Zeker?' : 'Verwijderen'}
                                  </button>
                                  {deleteConfirmId === s.id && (
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className={`p-1 px-2.5 border font-bold text-[10px] uppercase rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm font-sans ${
                                        isDarkMode
                                          ? 'bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800 hover:bg-neutral-800'
                                          : 'bg-neutral-200 text-neutral-700 hover:text-neutral-900 border-neutral-300 hover:bg-neutral-300'
                                      }`}
                                    >
                                      Annuleren
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        });
                        })()}
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                )}

                  {/* BOOKINGS TABLE BOARD */}
                  {activeEmployeeSubTab === 'bookings' && (
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-105 uppercase tracking-wider">ACTIEVE VIP AFSPRAKEN & BEZOEKEN</h3>
                          <p className="text-[11px] text-neutral-500 mt-0.5 font-mono">Realtime synchronisatie van showroom ticket reserveringslogs.</p>
                        </div>
                        <span className="text-[10px] bg-neutral-950 text-neutral-404 font-mono px-2 py-1 rounded">
                          Totaal gereserveerde slots: {allBookings.length}
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {allBookings.length === 0 ? (
                          <p className="text-xs text-neutral-505 italic py-6 text-center">Geen VIP-bezoeken of afspraken gepland in het showroom-systeem.</p>
                        ) : (
                          allBookings.map((b) => (
                            <div key={b.id} className="bg-neutral-950 border border-neutral-850 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group">
                              <div className="absolute left-0 top-0 h-full w-1 bg-amber-500"></div>
                              
                              <div className="space-y-1.5 flex-1 max-w-xl">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    {b.id}
                                  </span>
                                  <h4 className="text-xs font-black text-slate-100 uppercase">{b.customerName}</h4>
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    b.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    b.status === 'Declined' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    'bg-amber-500/10 text-amber-400'
                                  }`}>
                                    {b.status === 'Approved' ? 'Goedgekeurd' : b.status === 'Declined' ? 'Afgewezen' : 'In afwachting'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-300">
                                  <strong>Doelvoertuig code:</strong> {b.vehicleId.toUpperCase()} • <strong>Reservering:</strong> {b.bookingType} • <strong>Datum/tijd slot:</strong> {b.date} / {b.timeSlot}
                                </div>
                                <div className="text-[11px] text-neutral-400 italic font-mono">
                                  Telefoon: <strong className="text-slate-200">{b.customerPhone}</strong> | Discord: <strong className="text-slate-200">{b.customerDiscord}</strong>
                                </div>
                                {b.customNotes && (
                                  <div className="p-2 bg-neutral-900 border border-neutral-850 text-[10px] text-neutral-400 rounded mt-1">
                                    &ldquo;{b.customNotes}&rdquo;
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2.5 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 border-neutral-850 pt-2.5 md:pt-0">
                                {b.status !== 'Approved' && (
                                  <button
                                    onClick={() => handleApproveDenyBooking(b.id, 'Approved')}
                                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-[10px] uppercase rounded transition-all cursor-pointer"
                                  >
                                    Keur Afspraak Goed
                                  </button>
                                )}
                                {b.status !== 'Declined' && (
                                  <button
                                    onClick={() => handleApproveDenyBooking(b.id, 'Declined')}
                                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 text-red-400 border border-neutral-850 text-[10px] uppercase rounded transition-all cursor-pointer"
                                  >
                                    Afwijzen
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteBookingInConsole(b.id)}
                                  className="p-1 px-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-500 hover:text-white text-[10px] rounded transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Verwijderen
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                   {/* IMPORTS MANAGEMENT BOARD */}
                {activeEmployeeSubTab === 'imports' && (
                  <div className="space-y-4 text-left animate-fadeIn">
                    <div className={`flex justify-between items-center border-b pb-3 ${
                      isDarkMode ? 'border-neutral-800' : 'border-neutral-200'
                    }`}>
                      <div>
                        <h3 className={`text-sm font-black uppercase tracking-wider ${
                          isDarkMode ? 'text-slate-100' : 'text-neutral-900'
                        }`}>BEHEER SPECIALE BESTELLINGEN</h3>
                        <p className={`text-[11px] mt-0.5 font-mono ${
                          isDarkMode ? 'text-neutral-500' : 'text-neutral-600'
                        }`}>Volg scheepvaart, beheer douanevergunningen en vorder zeecontainers.</p>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-1 rounded transition-colors duration-300 ${
                        isDarkMode ? 'bg-neutral-950 text-neutral-400' : 'bg-neutral-100 text-neutral-600 border border-neutral-200 shadow-sm'
                      }`}>
                        Geregistreerde Imports: {allImports.length}
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {allImports.length === 0 ? (
                        <p className="text-xs text-neutral-500 italic py-6 text-center">Geen actieve bestellingen op de havenbuffers.</p>
                      ) : (
                        allImports.map((req) => (
                          <div key={req.id} className={`p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group border transition-all ${
                            isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-white border-neutral-200 shadow-sm'
                          }`}>
                            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-cyan-505"></div>

                            <div className="space-y-1.5 flex-1 max-w-xl text-left">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                                  {req.id}
                                </span>
                                <h4 className={`text-xs font-black uppercase tracking-wide ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>/{req.spawnCode} — {req.gtaName}</h4>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                  req.status === 'Ready for Pickup' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'border border-neutral-500/20 bg-neutral-900/55 text-neutral-400'
                                }`}>
                                  {req.status === 'Ready for Pickup' ? 'Gereed voor afhalen' : req.status === 'In Transit' ? 'Onderweg' : 'Besteld'}
                                </span>
                              </div>
                              <div className={`text-[11px] ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                Voertuigklasse: <strong className={isDarkMode ? 'text-white' : 'text-neutral-800'}>{req.vehicleType}</strong> • Kenteken: <span className="font-mono font-extrabold text-amber-500">{req.customPlate}</span> • Budgetallocatie: <strong className={isDarkMode ? 'text-white' : 'text-neutral-800'}>${req.maxBudget.toLocaleString()}</strong>
                              </div>
                              <div className={`text-[11px] font-mono ${isDarkMode ? 'text-neutral-400' : 'text-neutral-550'}`}>
                                Upgrades: Mechanisch {req.engineModPackage} Carbon | Styling {req.cosmeticModPackage} Pakket
                              </div>
                              {req.specialInstructions && (
                                <div className={`p-2 border text-[10px] rounded mt-1 font-sans transition-colors duration-300 ${
                                  isDarkMode ? 'bg-neutral-900 border-neutral-850 text-neutral-400' : 'bg-neutral-50 border-neutral-205 text-neutral-600'
                                }`}>
                                  Instructies: "{req.specialInstructions}"
                                </div>
                              )}
                            </div>

                            <div className={`flex gap-2.5 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-2.5 md:pt-0 ${
                              isDarkMode ? 'border-neutral-850' : 'border-neutral-200'
                            }`}>
                              {req.status !== 'Ready for Pickup' ? (
                                <button
                                  onClick={() => handleAdvanceImportStatus(req.id)}
                                  className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 text-neutral-950 font-extrabold text-[10px] uppercase rounded transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Status Vorderen
                                </button>
                              ) : (
                                <span className="text-[10px] text-emerald-400 font-bold uppercase py-1 px-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                                  ✓ Vrijgegeven door douane
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteImportInConsole(req.id)}
                                className={`p-1 px-2.5 border text-[10px] rounded transition-all cursor-pointer flex items-center gap-1 transition-colors duration-300 ${
                                  isDarkMode 
                                    ? 'bg-neutral-950 hover:bg-neutral-850 border-neutral-859 text-neutral-500 hover:text-white' 
                                    : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-605 hover:text-neutral-900'
                                }`}
                              >
                                <Trash2 className="w-3 h-3" />
                                Verwijderen
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                         {/* ACTIVE STAFF DIRECTORY BOARD */}
                  {activeEmployeeSubTab === 'roster' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className={`border-b pb-3 mb-4 text-left transition-colors duration-300 ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <h3 className={`text-sm font-black uppercase tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>ACTIEVE MEDEWERKERSLIJST</h3>
                      </div>
                      <StaffDirectory isDarkMode={isDarkMode} />
                    </div>
                  )}

                  {/* FINANCIAL AUDIT LEDGER */}
                  {activeEmployeeSubTab === 'financials' && (() => {
                    const totalRevenue = salesList.reduce((acc, s) => acc + s.price, 0);

                    const totalProfit = salesList.reduce((acc, s) => {
                      const matchedCar = vehiclesList.find(v => v.name === s.vehicleName);
                      const purchasePrice = matchedCar?.purchasePrice ?? Math.round(s.price * 0.75);
                      return acc + (s.price - purchasePrice);
                    }, 0);

                    const twoWeeksAgo = new Date();
                    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                    const salesLastTwoWeeks = salesList.filter(s => {
                      const saleDate = new Date(s.date);
                      return saleDate.getTime() >= twoWeeksAgo.getTime();
                    });

                    const revenueLastTwoWeeks = salesLastTwoWeeks.reduce((acc, s) => acc + s.price, 0);
                    const taxToPay = Math.round(revenueLastTwoWeeks * 0.07);

                    return (
                      <div className="space-y-6 text-left animate-fadeIn">
                        <div className={`border-b pb-3 transition-colors duration-300 ${
                          isDarkMode ? 'border-neutral-850' : 'border-neutral-200'
                        }`}>
                          <h3 className={`text-sm font-black uppercase tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>FINANCIËN</h3>
                          <p className={`text-[11px] mt-0.5 font-mono transition-colors duration-300 ${isDarkMode ? 'text-neutral-500' : 'text-neutral-600'}`}>Realtime financiële analyse, winstmarges, inkoopprijzen en uitbetaling calculator.</p>
                        </div>

                        {/* Sub-navigatie binnen Financiën */}
                        <div className="flex border-b border-neutral-800/15 dark:border-neutral-850 gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveFinancesSubView('overview')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                              activeFinancesSubView === 'overview'
                                ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                                : 'border-transparent text-neutral-400 hover:text-slate-100 hover:bg-neutral-900/10'
                            }`}
                          >
                            Bedrijfsrekening & Overzicht
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveFinancesSubView('payout_calculator')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                              activeFinancesSubView === 'payout_calculator'
                                ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                                : 'border-transparent text-neutral-400 hover:text-slate-100 hover:bg-neutral-900/10'
                            }`}
                          >
                            Uitbetaling Calculator
                          </button>
                        </div>

                        {activeFinancesSubView === 'payout_calculator' ? (
                          /* UITBETALING CALCULATOR VIEW */
                          <div className="space-y-6 animate-fadeIn pb-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Left parameters panel */}
                              <div className={`lg:col-span-1 p-4 border rounded-xl space-y-4 ${
                                isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-white border-neutral-200 shadow-sm'
                              }`}>
                                <h4 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>Instellingen Calculator</h4>
                                
                                {/* Employee selection */}
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block font-mono">
                                    Medewerker Selecteren
                                  </label>
                                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                                    {discordStaff.map(st => {
                                      const isSelected = selectedCalcEmployee === st.name;
                                      return (
                                        <button
                                          key={st.name}
                                          type="button"
                                          onClick={() => setSelectedCalcEmployee(st.name)}
                                          className={`w-full text-left p-2.5 rounded-lg border flex items-center gap-2.5 transition-all cursor-pointer ${
                                            isSelected 
                                              ? 'border-amber-500 bg-amber-500/5' 
                                              : isDarkMode 
                                                ? 'bg-neutral-900 border-neutral-850 hover:bg-neutral-850 hover:border-neutral-750' 
                                                : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 shadow-xs'
                                          }`}
                                        >
                                          <img
                                            src={st.avatarUrl}
                                            alt={st.name}
                                            referrerPolicy="no-referrer"
                                            className="w-6 h-6 rounded-full object-cover border border-amber-500/20"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <div className="text-[11px] font-bold truncate leading-tight">{st.name}</div>
                                            <div className="text-[8px] text-neutral-500 truncate leading-none mt-0.5">{st.role}</div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Date Input */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block font-mono">
                                    Ingangsdatum voor Winsten
                                  </label>
                                  <input
                                    type="date"
                                    value={calcDate}
                                    onChange={(e) => setCalcDate(e.target.value)}
                                    className={`w-full font-mono rounded px-3 py-2 text-xs transition-colors duration-300 ${
                                      isDarkMode ? 'bg-neutral-900 border-neutral-850 text-slate-100' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                                    }`}
                                  />
                                  <span className="text-[8.5px] text-neutral-500 block font-sans italic">Berekent de winst van alle verkopen vanaf deze datum.</span>
                                </div>
                              </div>

                              {/* Right calculation explanation & results */}
                              <div className="lg:col-span-2 space-y-4">
                                {(() => {
                                  const employeeSales = salesList.filter(s => {
                                    if (s.salesAgent !== selectedCalcEmployee) return false;
                                    const saleDateStr = s.date;
                                    return saleDateStr >= calcDate;
                                  });

                                  let employeeTotalRevenue = 0;
                                  let employeeTotalProfit = 0;

                                  const breakdowns = employeeSales.map(s => {
                                    const matchedCar = vehiclesList.find(v => v.name === s.vehicleName);
                                    const purchasePrice = matchedCar?.purchasePrice ?? Math.round(s.price * 0.75);
                                    const profit = s.price - purchasePrice;
                                    
                                    employeeTotalRevenue += s.price;
                                    employeeTotalProfit += profit;

                                    return {
                                      id: s.id,
                                      date: s.date,
                                      vehicleName: s.vehicleName,
                                      price: s.price,
                                      purchasePrice,
                                      profit,
                                      commission: Math.round(profit * 0.10)
                                    };
                                  });

                                  const payoutAmount = Math.round(employeeTotalProfit * 0.10);
                                  const selectedStaffObj = discordStaff.find(st => st.name === selectedCalcEmployee);

                                  return (
                                    <div className="space-y-4 animate-fadeIn">
                                      {/* Massive payout statistics banner */}
                                      <div className={`p-5 border rounded-xl relative overflow-hidden transition-all text-left ${
                                        isDarkMode 
                                          ? 'bg-neutral-950 border-neutral-855 shadow-inner' 
                                          : 'bg-white border-neutral-200 shadow-sm'
                                      }`}>
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] select-none text-9xl font-black font-sans tracking-tight">€</div>
                                        <div className="flex items-start gap-4">
                                          <img
                                            src={selectedStaffObj?.avatarUrl}
                                            alt={selectedCalcEmployee}
                                            referrerPolicy="no-referrer"
                                            className="w-12 h-12 rounded-full object-cover border border-amber-500/30 shadow-md"
                                          />
                                          <div className="space-y-1">
                                            <span className="text-[9px] font-bold font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">CALCULATOR RESULTAAT</span>
                                            <h4 className="text-base font-black uppercase tracking-tight">{selectedCalcEmployee}</h4>
                                            <p className="text-[10px] text-neutral-500 font-mono">Periode: Vanaf {calcDate} tot Heden ({employeeSales.length} Transacties)</p>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-neutral-850/5 dark:border-neutral-850">
                                          <div>
                                            <span className="text-[9px] text-neutral-400 font-mono uppercase block">Verkoopwaarde</span>
                                            <span className="text-sm font-bold font-mono">€ {employeeTotalRevenue.toLocaleString()}</span>
                                          </div>
                                          <div>
                                            <span className="text-[9px] text-neutral-400 font-mono uppercase block">Gegenereerde Winst</span>
                                            <span className="text-sm font-bold font-mono text-emerald-500">€ {employeeTotalProfit.toLocaleString()}</span>
                                          </div>
                                          <div>
                                            <span className="text-[9px] font-bold font-mono text-amber-500 uppercase block">Berekening Uitbetaling (10%)</span>
                                            <span className="text-xl font-black font-mono text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.15)]">€ {payoutAmount.toLocaleString()}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Transaction list contributing */}
                                      <div className={`p-4 border rounded-xl space-y-3 ${
                                        isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-white border-neutral-250 shadow-sm'
                                      }`}>
                                        <h5 className="text-xs font-black uppercase tracking-wide">Transactie-overzicht & Provisieaandeel</h5>
                                        {breakdowns.length === 0 ? (
                                          <p className="text-xs text-neutral-500 italic py-4 font-mono text-center">Er zijn geen verkopen geregistreerd voor deze medewerker in de geselecteerde periode.</p>
                                        ) : (
                                          <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                                            <table className="w-full text-left border-collapse text-[10px]">
                                              <thead>
                                                <tr className="border-b border-neutral-850/5 dark:border-neutral-850 text-[9px] font-mono uppercase text-neutral-500">
                                                  <th className="py-2.5">ID</th>
                                                  <th className="py-2.5">Voertuig</th>
                                                  <th className="py-2.5 font-sans">Inkoopprijs</th>
                                                  <th className="py-2.5 font-sans">Verkoopwaarde</th>
                                                  <th className="py-2.5 font-sans">Winst</th>
                                                  <th className="py-2.5 text-right font-bold text-amber-500 font-sans">Uitbetaling (10%)</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-neutral-850/2 dark:divide-neutral-850/40 font-mono">
                                                {breakdowns.map(row => (
                                                  <tr key={row.id} className="hover:text-slate-150 transition-colors">
                                                    <td className="py-2 text-neutral-450">{row.id}</td>
                                                    <td className="py-2 font-bold font-sans">{row.vehicleName}</td>
                                                    <td className="py-2 text-neutral-500">€ {row.purchasePrice.toLocaleString()}</td>
                                                    <td className="py-2">€ {row.price.toLocaleString()}</td>
                                                    <td className="py-2 text-emerald-500 font-bold">€ {row.profit.toLocaleString()}</td>
                                                    <td className="py-2 text-right font-black text-amber-500">€ {row.commission.toLocaleString()}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* STANDARD OVERVIEW VIEW */
                          <>
                            {/* Financial Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className={`p-4 border rounded-lg shadow-sm transition-colors duration-300 ${
                                isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-white border-neutral-200 shadow-sm'
                              }`}>
                                <span className={`text-[9px] font-mono uppercase tracking-wider block ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Totale Opbrengst (Verkoopwaarde)</span>
                                <div className={`text-xl font-bold font-mono mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600 font-extrabold'}`}>€ {totalRevenue.toLocaleString()}</div>
                                <span className={`text-[8px] block mt-1 uppercase font-mono ${isDarkMode ? 'text-neutral-600' : 'text-neutral-500'}`}>Op basis van {salesList.length} verwerkte verkopen</span>
                              </div>
                              
                              <div className={`p-4 border rounded-lg shadow-sm transition-colors duration-300 ${
                                isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-white border-neutral-200 shadow-sm'
                              }`}>
                                <span className={`text-[9px] font-mono uppercase tracking-wider block ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Nettowinst over de Voertuigen</span>
                                <div className={`text-xl font-bold font-mono mt-1 ${isDarkMode ? 'text-amber-500' : 'text-emerald-700'}`}>€ {totalProfit.toLocaleString()}</div>
                                <span className={`text-[8px] block mt-1 uppercase font-mono ${isDarkMode ? 'text-neutral-600' : 'text-neutral-500'}`}>Verkoopwaarde minus de inkoopprijzen</span>
                              </div>

                              <div className={`p-4 border rounded-lg shadow-sm transition-colors duration-300 ${
                                isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-white border-neutral-200 shadow-sm'
                              }`}>
                                <span className={`text-[9px] font-mono uppercase tracking-wider block ${isDarkMode ? 'text-rose-400' : 'text-rose-700 font-bold'}`}>Te Betalen Belasting (7%) <span className="text-neutral-500 lowercase italic">(afgelopen 2 weken)</span></span>
                                <div className="text-xl font-bold font-mono text-rose-550 text-rose-600 mt-1">€ {taxToPay.toLocaleString()}</div>
                                <span className={`text-[8px] block mt-1 uppercase font-mono ${isDarkMode ? 'text-rose-600' : 'text-rose-750 text-rose-700'}`}>Berekend over € {revenueLastTwoWeeks.toLocaleString()} (laatste 14 dagen)</span>
                              </div>
                            </div>

                            {/* Sales contributing to the 14 days tax */}
                            <div className={`p-4 rounded-lg space-y-3 border transition-colors duration-300 ${
                              isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-white border-neutral-200 shadow-sm'
                            }`}>
                              <div className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? 'border-neutral-900' : 'border-neutral-200'}`}>
                                <h4 className={`text-xs font-black uppercase tracking-wider font-sans ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>Verkopen van de afgelopen twee weken</h4>
                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded transition-colors duration-300 ${
                                  isDarkMode ? 'bg-neutral-900 text-neutral-400' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                                }`}>
                                  {salesLastTwoWeeks.length} verkopen gevonden
                                </span>
                              </div>

                              {salesLastTwoWeeks.length === 0 ? (
                                <p className="text-[11px] text-neutral-500 italic py-2 font-mono">Er zijn geen verkopen geregistreerd in de afgelopen 14 dagen.</p>
                              ) : (
                                <div className="overflow-x-auto font-sans max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                                  <table className="w-full text-left border-collapse font-sans">
                                    <thead>
                                      <tr className={`border-b text-[10px] font-mono uppercase ${isDarkMode ? 'border-neutral-900 text-neutral-400' : 'border-neutral-200 text-neutral-500'}`}>
                                        <th className="py-2 font-sans">Datum</th>
                                        <th className="py-2 font-sans">Klant</th>
                                        <th className="py-2 font-sans">Voertuig</th>
                                        <th className="py-2 font-sans">Bedrag</th>
                                        <th className="py-2 text-right font-sans">Belastingaandeel (7%)</th>
                                      </tr>
                                    </thead>
                                    <tbody className={`divide-y font-mono text-[10.5px] ${isDarkMode ? 'divide-neutral-900/50' : 'divide-neutral-200'}`}>
                                      {salesLastTwoWeeks.map(s => (
                                        <tr key={s.id} className={`transition-colors hover:bg-neutral-50/50 ${isDarkMode ? 'text-neutral-300 hover:text-white hover:bg-neutral-900/10' : 'text-neutral-700 hover:text-neutral-900'}`}>
                                          <td className={`py-1.5 font-bold ${isDarkMode ? 'text-neutral-500' : 'text-neutral-450'}`}>{s.date}</td>
                                          <td className="py-1.5 font-sans font-extrabold">{s.customerName}</td>
                                          <td className={`py-1.5 font-bold ${isDarkMode ? 'text-amber-500' : 'text-amber-600'}`}>{s.vehicleName}</td>
                                          <td className="py-1.5 font-bold">€ {s.price.toLocaleString()}</td>
                                          <td className={`py-1.5 text-right font-bold ${isDarkMode ? 'text-rose-500' : 'text-rose-600'}`}>€ {Math.round(s.price * 0.07).toLocaleString()}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                      </div>
                    );
                  })()}

                </div>
              </div>
            )
          }
        </div>
      )}
                 {activeCatalogSubView && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className={`border rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col transition-colors duration-300 ${
              isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}>
              {/* Modal Header */}
              <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors duration-300 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 border rounded-lg shadow-inner animate-pulse transition-colors duration-300 ${
                    isDarkMode ? 'bg-neutral-900 border-amber-500' : 'bg-white border-amber-500'
                  }`}>
                    <Car className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">Interactief Showroom Centrum</span>
                    <h3 className={`text-sm font-black uppercase tracking-widest transition-colors duration-300 ${
                      isDarkMode ? 'text-slate-100' : 'text-neutral-900'
                    }`}>
                      {activeCatalogSubView === 'tuner' ? `Tuning Configurator — ${selectedVehicle.name}` :
                       activeCatalogSubView === 'finance' ? `Lease & Financiering — ${selectedVehicle.name}` :
                       activeCatalogSubView === 'bookings' ? `VIP Afsprakenplanner — ${selectedVehicle.name}` :
                       activeCatalogSubView === 'staff' ? `Veloce Conciërge Hub` :
                       `Speciale Customs Importhaven`}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveCatalogSubView(null);
                    loadAllLocalStorageData(); // reload syncs
                  }}
                  className={`px-3.5 py-1.5 border text-xs font-mono rounded-lg transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-white' 
                      : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  ESC [✕] Sluit programma
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className={`p-6 overflow-y-auto flex-grow transition-colors duration-300 ${
                isDarkMode ? 'bg-neutral-950' : 'bg-neutral-50/50'
              }`}>
                {activeCatalogSubView === 'tuner' && <TuningVisualizer vehicle={selectedVehicle} />}
                {activeCatalogSubView === 'finance' && <FinanceCalculator initialVehicle={selectedVehicle} />}
                {activeCatalogSubView === 'bookings' && <BookingCalendar initialVehicle={selectedVehicle} />}
                {activeCatalogSubView === 'imports' && <ImportRequestHub />}
                {activeCatalogSubView === 'staff' && <StaffDirectory isDarkMode={isDarkMode} />}
              </div>
            </div>
          </div>
        )}

        {/* INVOICE DETAILS MODAL */}
        {openedSale && (
          <div className="fixed inset-0 z-[115] overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn no-print">
            <div className={`border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] transition-colors duration-300 ${
              isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}>
              {/* Modal Header */}
              <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors duration-300 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 border rounded-lg shadow-inner transition-colors duration-300 ${
                    isDarkMode ? 'bg-neutral-900 border-amber-500' : 'bg-white border-amber-500'
                  }`}>
                    <FileText className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">Officiële Verkoopfactuur</span>
                    <h3 className={`text-sm font-black uppercase tracking-widest transition-colors duration-300 ${
                      isDarkMode ? 'text-slate-100' : 'text-neutral-900'
                    }`}>Factuur #{openedSale.id}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setOpenedSale(null)}
                  className={`px-3 py-1 border text-xs font-mono rounded transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-white' 
                      : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  SLUITEN [✕]
                </button>
              </div>

              {/* Printable Invoice Board */}
              <div id="print-area" className={`p-6 overflow-y-auto flex-grow select-text transition-colors duration-300 ${
                isDarkMode ? 'bg-neutral-950 text-slate-100' : 'bg-neutral-50 border-neutral-200 text-neutral-800'
              }`}>
                <div className={`border p-8 rounded-xl space-y-6 relative overflow-hidden backdrop-blur-md transition-colors duration-300 ${
                  isDarkMode ? 'border-neutral-850 bg-neutral-900/45 text-slate-100' : 'border-neutral-200 bg-white text-neutral-900 shadow-sm'
                }`}>
                  {/* Watermark/Accent */}
                  <div className="absolute -right-16 -top-16 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

                  {/* Logo Center */}
                  <div className={`flex flex-col items-center text-center pb-4 border-b transition-colors duration-300 ${
                    isDarkMode ? 'border-neutral-850' : 'border-neutral-200'
                  }`}>
                    <img 
                      src={CompanyLogoImg} 
                      alt="Sovereign" 
                      className={`w-40 h-auto object-contain mb-3 ${isDarkMode ? 'brightness-110 drop-shadow-[0_2px_10px_rgba(251,191,36,0.15)]' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-[10px] text-amber-500 font-mono tracking-widest uppercase font-black">Sovereign Dealership</div>
                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">locationPlaceholder</div>
                  </div>

                  {/* Customer vs Billing Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-left">
                    <div className={`space-y-2 p-3.5 rounded-lg border transition-colors duration-300 ${
                      isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
                    }`}>
                      <h4 className="text-[9px] font-mono font-bold text-amber-500 block tracking-widest uppercase">AFNEMER (KLANT GEGEVENS)</h4>
                      <div className="space-y-1">
                        <p><span className="text-neutral-500 font-medium">Naam:</span> <strong className={isDarkMode ? 'text-slate-200' : 'text-neutral-800'}>{openedSale.customerName}</strong></p>
                        <p><span className="text-neutral-500 font-medium">BSN nummer:</span> <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-neutral-700'}`}>{openedSale.bsnNumber || 'Niet Geregistreerd'}</span></p>
                        <p><span className="text-neutral-500 font-medium">Geboortedatum:</span> <span className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-neutral-700'}`}>{openedSale.birthDate || 'Niet Geregistreerd'}</span></p>
                      </div>
                    </div>

                    <div className={`space-y-2 p-3.5 rounded-lg border transition-colors duration-300 ${
                      isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
                    }`}>
                      <h4 className="text-[9px] font-mono font-bold text-amber-500 block tracking-widest uppercase">TRANSACTIE DETAILS</h4>
                      <div className="space-y-1">
                        <p><span className="text-neutral-500 font-medium">Factuurnr:</span> <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-neutral-800'}`}>{openedSale.id}</span></p>
                        <p><span className="text-neutral-500 font-medium">Factuurdatum:</span> <span className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-neutral-700'}`}>{openedSale.date}</span></p>
                        <p><span className="text-neutral-500 font-medium">Betaalmethode:</span> <strong className="text-emerald-500">{openedSale.paymentMethod}</strong></p>
                        <p><span className="text-neutral-500 font-medium">Geregistreerde Dealer:</span> <strong className="text-amber-500">{openedSale.salesAgent}</strong></p>
                      </div>
                    </div>
                  </div>

                  {/* Voertuig specificaties */}
                  <div className="space-y-3">
                    <h4 className={`text-[10px] font-mono font-bold tracking-wider uppercase text-left ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>GEKOCHT VOERTUIG</h4>
                    <div className={`w-full rounded-lg border overflow-hidden transition-colors duration-300 ${
                      isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-white border-neutral-200 shadow-sm'
                    }`}>
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className={`border-b text-[10px] uppercase font-mono transition-colors duration-300 ${
                            isDarkMode ? 'bg-neutral-900 border-neutral-850 text-neutral-400' : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                          }`}>
                            <th className="p-3">Omschrijving</th>
                            <th className="p-3">Type</th>
                            <th className="p-3 text-right">Prijs exclusief opties</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className={`border-b transition-colors duration-300 ${isDarkMode ? 'border-neutral-850/50' : 'border-neutral-200/60'}`}>
                            <td className={`p-3 font-bold ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>{openedSale.vehicleName}</td>
                            <td className={`p-3 font-sans ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{openedSale.vehicleType || 'Super'}</td>
                            <td className={`p-3 text-right font-mono font-bold ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}`}>€ {openedSale.price.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial calculation info */}
                  <div className={`space-y-2.5 pt-2 border-t transition-colors duration-300 ${isDarkMode ? 'border-neutral-850' : 'border-neutral-200'}`}>
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Subtotaal voertuigaankoop</span>
                      <span className="font-mono font-semibold">€ {openedSale.price.toLocaleString()}</span>
                    </div>
                    {openedSale.rushCosts ? (
                      <div className="flex justify-between text-xs text-rose-500 font-bold">
                        <span className="flex items-center gap-1">⚡ Spoedlevering en registratie toeslag (Inclusief)</span>
                        <span className="font-mono">Inbegrepen</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs text-neutral-500">
                        <span>Spoedtoeslag (Niet van toepassing)</span>
                        <span className="font-mono">€ 0</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Milieutax & Kentekenleges (5.5%)</span>
                      <span className="font-mono">Mvst. Vrijgesteld</span>
                    </div>

                    <div className={`p-3 rounded-lg flex justify-between items-center border mt-4 transition-colors duration-300 ${
                      isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-neutral-50 border-neutral-200 shadow-inner'
                    }`}>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-500 block uppercase">TOTAAL FINALE CONTRACTSOM</span>
                        <span className="text-[9px] text-neutral-500">Onder voorbehoud van acceptatie door de directie van Sovereign</span>
                      </div>
                      <div className={`text-xl font-black font-mono ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        € {openedSale.price.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-8 pt-8 text-[11px] text-center text-neutral-500 font-mono">
                    <div className="space-y-8">
                      <p className={`border-b pb-1 italic font-sans ${isDarkMode ? 'border-neutral-800 text-slate-200' : 'border-neutral-300 text-neutral-800'}`}>{openedSale.customerName}</p>
                      <p>Handtekening Afnemer</p>
                    </div>
                    <div className="space-y-8">
                      <p className={`border-b pb-1 italic font-sans ${isDarkMode ? 'border-neutral-805 text-slate-200' : 'border-neutral-300 text-neutral-800'}`}>{openedSale.salesAgent}</p>
                      <p>Verkoopadviseur Sovereign</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for download / print / close */}
              <div className={`p-4 border-t flex justify-end gap-3.5 transition-colors duration-300 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Factuur ${openedSale.id} - Sovereign</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <script>
                              tailwind.config = {
                                theme: {
                                  extend: {
                                    colors: {
                                      neutral: {
                                        800: '#262626',
                                        850: '#1f1f1f',
                                        900: '#171717',
                                        950: '#0a0a0a'
                                      }
                                    }
                                  }
                                }
                              }
                            </script>
                            <style>
                              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
                              * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                              }
                              body {
                                font-family: 'Inter', sans-serif;
                                background-color: ${isDarkMode ? '#0a0a0a' : '#fafafa'} !important;
                                color: ${isDarkMode ? '#f1f5f9' : '#262626'} !important;
                                margin: 0;
                                padding: 2rem;
                              }
                              .print-invoice-card {
                                background-color: ${isDarkMode ? '#171717' : '#ffffff'} !important;
                                border-color: ${isDarkMode ? '#262626' : '#e5e7eb'} !important;
                                color: ${isDarkMode ? '#f1f5f9' : '#171717'} !important;
                              }
                              .print-bg-block {
                                background-color: ${isDarkMode ? '#0a0a0a' : '#f9fafb'} !important;
                                border-color: ${isDarkMode ? '#262626' : '#e5e7eb'} !important;
                              }
                              .print-table-header {
                                background-color: ${isDarkMode ? '#171717' : '#f3f4f6'} !important;
                                border-color: ${isDarkMode ? '#262626' : '#e5e7eb'} !important;
                              }
                              @page {
                                size: A4;
                                margin: 10mm;
                              }
                            </style>
                          </head>
                          <body>
                            <div class="max-w-[800px] mx-auto space-y-8">
                              <div class="border p-8 rounded-xl space-y-6 relative overflow-hidden print-invoice-card">
                                <!-- Watermark/Accent -->
                                <div class="absolute -right-16 -top-16 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

                                <!-- Logo Center -->
                                <div class="flex flex-col items-center text-center pb-4 border-b ${
                                  isDarkMode ? 'border-neutral-800' : 'border-neutral-200'
                                }">
                                  <img 
                                    src="${CompanyLogoImg}" 
                                    alt="Sovereign" 
                                    class="w-40 h-auto object-contain mb-3 ${isDarkMode ? 'brightness-110' : ''}"
                                  />
                                  <div class="text-[10px] text-amber-500 font-mono tracking-widest uppercase font-black">Sovereign Dealership</div>
                                  <div class="text-[10px] text-neutral-500 font-mono mt-0.5">locationPlaceholder</div>
                                </div>

                                <!-- Customer vs Billing Grid -->
                                <div class="grid grid-cols-2 gap-6 text-xs text-left font-sans">
                                  <div class="space-y-2 p-3.5 rounded-lg border print-bg-block">
                                    <h4 class="text-[9px] font-mono font-bold text-amber-500 block tracking-widest uppercase">AFNEMER (KLANT GEGEVENS)</h4>
                                    <div class="space-y-1">
                                      <p><span class="text-neutral-500 font-semibold font-semibold">Naam:</span> <strong class="${isDarkMode ? 'text-slate-100' : 'text-neutral-950'}">${openedSale.customerName}</strong></p>
                                      <p><span class="text-neutral-500 font-medium">BSN nummer:</span> <span class="font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-neutral-700'}">${openedSale.bsnNumber || 'Niet Geregistreerd'}</span></p>
                                      <p><span class="text-neutral-500 font-medium font-semibold">Geboortedatum:</span> <span class="font-mono ${isDarkMode ? 'text-slate-300' : 'text-neutral-700'}">${openedSale.birthDate || 'Niet Geregistreerd'}</span></p>
                                    </div>
                                  </div>

                                  <div class="space-y-2 p-3.5 rounded-lg border print-bg-block">
                                    <h4 class="text-[9px] font-mono font-bold text-amber-500 block tracking-widest uppercase">TRANSACTIE DETAILS</h4>
                                    <div class="space-y-1">
                                      <p><span class="text-neutral-500 font-medium">Factuurnr:</span> <span class="font-mono font-bold ${isDarkMode ? 'text-slate-100' : 'text-neutral-950'}">${openedSale.id}</span></p>
                                      <p><span class="text-neutral-500 font-medium">Factuurdatum:</span> <span class="font-mono ${isDarkMode ? 'text-slate-300' : 'text-neutral-700'}">${openedSale.date}</span></p>
                                      <p><span class="text-neutral-500 font-medium">Betaalmethode:</span> <strong class="text-emerald-500">${openedSale.paymentMethod}</strong></p>
                                      <p><span class="text-neutral-500 font-medium">Geregistreerde Dealer:</span> <strong class="text-amber-500">${openedSale.salesAgent}</strong></p>
                                    </div>
                                  </div>
                                </div>

                                <!-- Purchase Details -->
                                <div class="space-y-3">
                                  <h4 class="text-[10px] font-mono font-bold tracking-wider uppercase text-left ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}">GEKOCHT VOERTUIG</h4>
                                  <div class="w-full rounded-lg border overflow-hidden print-bg-block">
                                    <table class="w-full text-xs text-left">
                                      <thead>
                                        <tr class="border-b text-[10px] uppercase font-mono print-table-header">
                                          <th class="p-3">Omschrijving</th>
                                          <th class="p-3">Type</th>
                                          <th class="p-3 text-right">Prijs exclusief opties</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr class="border-b ${isDarkMode ? 'border-neutral-800/50' : 'border-neutral-200/60'}">
                                          <td class="p-3 font-bold ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}">${openedSale.vehicleName}</td>
                                          <td class="p-3 font-sans ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}">${openedSale.vehicleType || 'Super'}</td>
                                          <td class="p-3 text-right font-mono font-bold ${isDarkMode ? 'text-slate-100' : 'text-neutral-900'}">€ ${openedSale.price.toLocaleString()}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                <!-- Financial summary -->
                                <div class="space-y-2.5 pt-2 border-t ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}">
                                  <div class="flex justify-between text-xs text-neutral-500">
                                    <span>Subtotaal voertuigaankoop</span>
                                    <span class="font-mono font-semibold">€ ${openedSale.price.toLocaleString()}</span>
                                  </div>
                                  ${openedSale.rushCosts ? `
                                    <div class="flex justify-between text-xs text-rose-500 font-bold">
                                      <span class="flex items-center gap-1">⚡ Spoedlevering en registratie toeslag (Inclusief)</span>
                                      <span class="font-mono">Inbegrepen</span>
                                    </div>
                                  ` : `
                                    <div class="flex justify-between text-xs text-neutral-500">
                                      <span>Spoedtoeslag (Niet van toepassing)</span>
                                      <span class="font-mono">€ 0</span>
                                    </div>
                                  `}
                                  <div class="flex justify-between text-xs text-neutral-500">
                                    <span>Milieutax & Kentekenleges (5.5%)</span>
                                    <span class="font-mono">Mvst. Vrijgesteld</span>
                                  </div>

                                  <div class="p-3 rounded-lg flex justify-between items-center border mt-4 print-bg-block">
                                    <div class="text-left">
                                      <span class="text-[10px] font-mono font-bold text-amber-500 block uppercase">TOTAAL FINALE CONTRACTSOM</span>
                                      <span class="text-[9px] text-neutral-500">Onder voorbehoud van acceptatie door de directie van Sovereign</span>
                                    </div>
                                    <div class="text-xl font-black font-mono ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}">
                                      € ${openedSale.price.toLocaleString()}
                                    </div>
                                  </div>
                                </div>

                                <!-- Signatures -->
                                <div class="grid grid-cols-2 gap-8 pt-8 text-[11px] text-center text-neutral-500 font-mono">
                                  <div class="space-y-8">
                                    <p class="border-b pb-1 italic font-sans ${isDarkMode ? 'border-neutral-800 text-slate-200' : 'border-neutral-300 text-neutral-800'}">${openedSale.customerName}</p>
                                    <p>Handtekening Afnemer</p>
                                  </div>
                                  <div class="space-y-8">
                                    <p class="border-b pb-1 italic font-sans ${isDarkMode ? 'border-neutral-800 text-slate-200' : 'border-neutral-300 text-neutral-800'}">${openedSale.salesAgent}</p>
                                    <p>Verkoopadviseur Sovereign</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <script>
                              window.onload = function() {
                                setTimeout(function() {
                                  window.print();
                                }, 800);
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  className="px-5 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-xs uppercase rounded transition-all cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <FileText className="w-3.5 h-3.5" /> Printen Factuur
                </button>
                <button
                  onClick={() => setOpenedSale(null)}
                  className={`px-5 py-1.5 border font-bold text-xs uppercase rounded transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 text-white' 
                      : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                  }`}
                >
                  Venster Sluiten
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT SALE FORM MODAL */}
        {editingSale && (
          <div className="fixed inset-0 z-[115] overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className={`border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[95vh] text-left transition-colors duration-300 ${
              isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}>
              {/* Modal Header */}
              <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors duration-300 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 border rounded-lg shadow-inner transition-colors duration-300 ${
                    isDarkMode ? 'bg-neutral-900 border-blue-500' : 'bg-white border-blue-500'
                  }`}>
                    <Pencil className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">Beheerderspaneel</span>
                    <h3 className={`text-sm font-black uppercase tracking-widest transition-colors duration-300 ${
                      isDarkMode ? 'text-slate-100' : 'text-neutral-900'
                    }`}>Factuur Wijzigen #{editingSale.id}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setEditingSale(null)}
                  className={`px-3.5 py-1 border text-xs font-mono rounded cursor-pointer transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-white' 
                      : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  ANNULEREN [✕]
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveSaleEdit} className={`flex flex-col flex-grow overflow-hidden transition-colors duration-300 ${
                isDarkMode ? 'bg-neutral-950 text-slate-100' : 'bg-neutral-50/70 text-neutral-800'
              }`}>
                <div className="p-6 overflow-y-auto space-y-4 max-h-[70vh]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* BSN */}
                    <div>
                      <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>BSN-nummer Klant</label>
                      <input
                        type="text"
                        required
                        placeholder="ORP-BSN-12345678"
                        value={editSaleBsn}
                        onChange={(e) => handleBsnChange(e.target.value, setEditSaleBsn)}
                        className={`w-full border focus:outline-none rounded px-3 py-1.5 text-xs font-mono transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-neutral-900 border-neutral-850 focus:border-blue-500 text-slate-100' 
                            : 'bg-white border-neutral-305 focus:border-blue-600 text-neutral-900 shadow-sm'
                        }`}
                      />
                    </div>

                    {/* Geboortedatum */}
                    <div>
                      <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Geboortedatum Klant</label>
                      <input
                        type="date"
                        required
                        value={editSaleBirthDate}
                        onChange={(e) => setEditSaleBirthDate(e.target.value)}
                        className={`w-full border focus:outline-none rounded px-3 py-1.5 text-xs font-mono cursor-pointer transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-neutral-900 border-neutral-850 focus:border-blue-500 text-slate-100' 
                            : 'bg-white border-neutral-305 focus:border-blue-600 text-neutral-900 shadow-sm'
                        }`}
                      />
                    </div>

                    {/* Volledige Naam Klant */}
                    <div>
                      <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Volledige Naam Klant</label>
                      <input
                        type="text"
                        required
                        value={editSaleCustName}
                        onChange={(e) => setEditSaleCustName(e.target.value)}
                        className={`w-full border focus:outline-none rounded px-3 py-1.5 text-xs font-sans transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-neutral-900 border-neutral-850 focus:border-blue-500 text-slate-100' 
                            : 'bg-white border-neutral-305 focus:border-blue-600 text-neutral-900 shadow-sm'
                        }`}
                      />
                    </div>

                    {/* Verkoper Dropdown */}
                    <div>
                      <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Volledige Naam Verkoper</label>
                      <select
                        required
                        value={editSaleAgent}
                        onChange={(e) => setEditSaleAgent(e.target.value)}
                        className={`w-full border focus:outline-none rounded px-3 py-1.5 text-xs font-sans cursor-pointer font-bold transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-neutral-900 border-neutral-850 focus:border-blue-500 text-slate-100' 
                            : 'bg-white border-neutral-305 focus:border-blue-600 text-neutral-900 shadow-sm'
                        }`}
                      >
                        <option value="">-- Kies Verkoper --</option>
                        {discordStaff.map(st => (
                          <option key={st.name} value={st.name}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Het Voertuig */}
                    <div>
                      <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Modelnaam Voertuig</label>
                      <select
                        required
                        value={vehiclesList.some(v => v.name === editSaleVehicle) ? vehiclesList.find(v => v.name === editSaleVehicle)?.id : ""}
                        onChange={(e) => {
                          const v = vehiclesList.find(x => x.id === e.target.value);
                          if (v) {
                            setEditSaleVehicle(v.name);
                            setEditSalePrice(v.price);
                            setEditSaleVehicleType(v.category);
                          }
                        }}
                        className={`w-full border focus:outline-none rounded px-3 py-1.5 text-xs font-sans cursor-pointer font-bold transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-neutral-900 border-neutral-850 focus:border-blue-500 text-slate-100' 
                            : 'bg-white border-neutral-305 focus:border-blue-600 text-neutral-900 shadow-sm'
                        }`}
                      >
                        <option value="">-- Kies Voertuig --</option>
                        {vehiclesList.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} (€ {v.price.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type Voertuig */}
                    <div>
                      <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Type Voertuig</label>
                      <select
                        required
                        disabled
                        value={editSaleVehicleType}
                        onChange={(e) => setEditSaleVehicleType(e.target.value)}
                        className={`w-full opacity-75 cursor-not-allowed border focus:outline-none rounded px-3 py-1.5 text-xs font-sans font-bold transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-neutral-900/55 border-neutral-850 text-slate-100/70' 
                            : 'bg-neutral-200/50 border-neutral-300 text-neutral-900/70'
                        }`}
                      >
                        <option value="Super">Super</option>
                        <option value="Sport">Sport</option>
                        <option value="Off-Road">Off-Road</option>
                        <option value="Sedan">Sedan</option>
                      </select>
                    </div>

                    {/* Kosten aankoop */}
                    <div>
                      <label className="text-[9px] font-bold text-amber-500 tracking-wider font-mono block uppercase mb-1">
                        Kosten van de Aankoop (€) <span className="text-[8px] text-neutral-500 lowercase italic">(automatisch berekend)</span>
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`€ ${editSalePrice.toLocaleString()}`}
                        className={`w-full opacity-75 cursor-not-allowed border focus:outline-none rounded px-3 py-1.5 text-xs font-mono font-bold transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-neutral-900/55 border-neutral-855 text-amber-500' 
                            : 'bg-neutral-200/50 border-neutral-300 text-amber-600'
                        }`}
                      />
                    </div>

                    {/* Spoedkosten */}
                    <div>
                      <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Spoedkosten (+ €50.000)</label>
                      <select
                        value={editSaleRushCosts ? "TRUE" : "FALSE"}
                        onChange={(e) => setEditSaleRushCosts(e.target.value === "TRUE")}
                        className={`w-full border focus:outline-none rounded px-3 py-1.5 text-xs font-sans cursor-pointer font-bold transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-neutral-900 border-neutral-850 focus:border-blue-500 text-slate-100' 
                            : 'bg-white border-neutral-305 focus:border-blue-600 text-neutral-900 shadow-sm'
                        }`}
                      >
                        <option value="FALSE">Nee (Standaard levering)</option>
                        <option value="TRUE">Ja (Spoedlevering + €50.000)</option>
                      </select>
                    </div>

                    {/* Status Aangeleverd */}
                    <div>
                      <label className={`text-[9px] font-bold tracking-wider font-mono block uppercase mb-1 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Status Aangeleverd</label>
                      <select
                        value={editSaleDelivered === 'reserved' ? "RESERVED" : editSaleDelivered ? "YES" : "NO"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "YES") setEditSaleDelivered(true);
                          else if (val === "RESERVED") setEditSaleDelivered('reserved');
                          else setEditSaleDelivered(false);
                        }}
                        className={`w-full border focus:outline-none rounded px-3 py-1.5 text-xs font-sans cursor-pointer font-bold transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-neutral-900 border-neutral-850 focus:border-blue-500 text-slate-100' 
                            : 'bg-white border-neutral-305 focus:border-blue-600 text-neutral-900 shadow-sm'
                        }`}
                      >
                        <option value="YES">Ja, auto is geleverd aan klant</option>
                        <option value="NO">Nee, alleen administratief (Nog niet geleverd)</option>
                        <option value="RESERVED">Gereserveerd</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* Footer Buttons */}
                <div className={`p-4 border-t flex justify-end gap-3.5 transition-colors duration-300 ${
                  isDarkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-neutral-100 border-neutral-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setEditingSale(null)}
                    className={`px-4 py-1.5 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer duration-300 ${
                      isDarkMode 
                        ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white' 
                        : 'bg-white border-neutral-300 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 shadow-sm'
                    }`}
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-1.5 bg-blue-500 hover:bg-blue-600 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md"
                  >
                    Wijzigingen Opslaan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Main Footer Copyright */}
      <footer className="border-t border-neutral-850 bg-neutral-950 py-6 text-center text-xs text-neutral-500 no-print select-none">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-mono text-[10px] tracking-widest uppercase text-amber-500 font-bold">
            SOVEREIGN • ORANJESTAD CAR DEALERSHIP
          </p>
          <p>
            &copy; {new Date().getFullYear()} Sovereign. Alle voertuigmodellen, merken en logo's zijn geregistreerde fictieve eigendommen onder GTA roleplay-richtlijnen en FiveM community normen.
          </p>
        </div>
      </footer>
    </div>
  );
}
