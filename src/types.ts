export interface Vehicle {
  id: string;
  name: string;
  realModel?: string;
  category: 'Super' | 'Sport' | 'Off-Road' | 'Sedan';
  price: number;
  purchasePrice?: number;
  topSpeed: number; // in mph or km/h
  passengers: number; // Max passengers count
  stock: number;
  badge?: string;
  badgeColor?: string; // Hex color code for the badge
  imageUrl: string; // URL for vehicle photo, fallback to SVG if empty/not URL
  featured: boolean;
}

export interface CustomizationOptions {
  paintType: 'Glossy' | 'Metallic' | 'Matte' | 'Chrome';
  primaryColor: string;
  secondaryColor: string;
  pearlescent: string;
  underglowColor: string;
  underglowOn: boolean;
  rimStyle: string;
  windowTint: 'None' | 'Light' | 'Dark' | 'Limo';
  spoilerLevel: 'Stock' | 'Low-Profile' | 'Carbon Track' | 'GT Wing';
  licensePlateText: string;
  licensePlateStyle: 'SA_EXOTIC' | 'SA_BLACK' | 'YANKTON' | 'CAR_DEALER';
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerDiscord: string;
  vehicleId: string;
  bookingType: 'Test Drive' | 'Showroom Viewing' | 'Financing Consult' | 'Private Appraisal';
  date: string;
  timeSlot: string;
  customNotes?: string;
  status: 'Approved' | 'Pending' | 'Completed';
}

export interface ImportRequest {
  id: string;
  spawnCode: string; // The in-game vehicle spawn code
  gtaName: string; // E.g., '17skyline' or 'sf90'
  vehicleType: string;
  sourceUrl?: string; // e.g. GTA5-mods link
  maxBudget: number;
  engineModPackage: 'Stage 1' | 'Stage 2' | 'Stage 3' | 'Drift Spec' | 'None';
  cosmeticModPackage: 'Standard' | 'Full Widebody' | 'Carbon Details' | 'None';
  customPlate: string;
  specialInstructions: string;
  status: 'Received' | 'In Progress' | 'Shipped to Port' | 'Ready for Pickup';
  etaDays: number;
}

export interface Staff {
  name: string;
  role: string;
  discord: string;
  phone: string;
  status: 'Active' | 'In City' | 'Offline' | 'Importing';
  avatarUrl: string;
}

export interface Sale {
  id: string;
  customerName: string;
  vehicleName: string;
  price: number;
  date: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Leasing Loan';
  salesAgent: string;
  bsnNumber?: string;
  birthDate?: string;
  vehicleType?: string;
  rushCosts?: boolean;
  delivered?: boolean | 'reserved';
}
