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
  category: "Super" | "Sports" | "SUV/Offroad" | "Classic" | "Muscle";
  price: number;
  image: string;
  stock: number;
  topSpeed: number; // in km/h
  acceleration: number; // 0-100 index (e.g. 85)
  braking: number; // 0-100 index (e.g. 70)
  handling: number; // 0-100 index (e.g. 90)
  engine: string;
  transmission: "Handgeschakeld" | "Automaat";
  description: string;
  featured?: boolean;
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
