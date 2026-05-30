/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ActivePage {
  Home = "home",
  Catalogus = "catalogus",
  Klantenpaneel = "klantenpaneel",
  Medewerkerpaneel = "medewerkerpaneel",
}

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  category: "Super" | "Sports" | "SUV/Off-Road" | "Classic" | "Overige";
  price: number; // Verkoopprijs
  purchasePrice: number; // Inkoopprijs
  image: string;
  stock: number;
  topSpeedStock: number; // Topsnelheid Niet Getuned/Stock (km/h)
  topSpeedTuned: number; // Topsnelheid Getuned/Fully (km/h)
  description: string;
  inzittenden: number; // Aantal plekken/inzittenden
  featured?: boolean;
  isSoldOut?: boolean; // Of de auto expliciet als uitverkocht is aangeduid
}

export interface DiscordUser {
  id: string;
  username: string;
  globalName?: string;
  avatar: string | null;
  role: "Klant" | "Medewerker" | "Geen";
  guildMember?: boolean;
  discordRoleName?: string;
  isManager?: boolean;
  isOwner?: boolean;
  isCoordinator?: boolean;
}

export interface SaleRecord {
  id: string;
  buyerDiscordId: string;
  buyerName: string;
  vehicleId: string;
  vehicleName: string;
  pricePaid: number;
  date: string;
  salesperson: string;
  status: "Gereserveerd" | "Besteld" | "Betaald" | "Opgehaald";
}

export interface PurchaseRequest {
  id: string;
  vehicleId: string;
  vehicleName: string;
  buyerDiscordId: string;
  buyerName: string;
  buyerAvatar: string | null;
  status: "In Behandeling" | "Goedgekeurd" | "Geweigerd";
  date: string;
  paymentType: "In-game Dollars" | "Financiering";
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerDiscordId: string;
  vehicleName: string;
  amount: number;
  date: string;
  status: "Betaald" | "Openstaand";
}
