/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vehicle, SaleRecord, PurchaseRequest, Invoice } from "./types";

export const INITIAL_VEHICLES: Vehicle[] = [];

export const SIMULATED_USERS = {
  klant: {
    id: "123456789012345678",
    username: "Davey_Santos",
    globalName: "Davey Santos",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    role: "Klant" as const,
    guildMember: true,
  },
  medewerker: {
    id: "987654321098765432",
    username: "Perseus_Loek",
    globalName: "Loek | Perseus Sales",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    role: "Medewerker" as const,
    guildMember: true,
    discordRoleName: "Perseus Senior Sales",
  },
  manager: {
    id: "112233445566778899",
    username: "Perseus_Manager",
    globalName: "Franklin | Perseus Manager",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop",
    role: "Medewerker" as const,
    guildMember: true,
    discordRoleName: "Perseus Manager",
    isManager: true,
  },
  eigenaar: {
    id: "998877665544332211",
    username: "Perseus_Owner",
    globalName: "Michael | Perseus Owner",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop",
    role: "Medewerker" as const,
    guildMember: true,
    discordRoleName: "Eigenaar",
    isManager: true,
    isOwner: true,
  },
  coordinator: {
    id: "334455667788990011",
    username: "Perseus_Coordinator",
    globalName: "Sophie | Perseus Coördinator",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
    role: "Klant" as const,
    guildMember: true,
    discordRoleName: "Coördinator",
    isCoordinator: true,
  },
  invalid: {
    id: "456123789045612378",
    username: "GTA_GamerPro",
    globalName: "GamerPro",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
    role: "Geen" as const,
    guildMember: false,
  },
};

export const INITIAL_USER_VEHICLES: any[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_SALES: SaleRecord[] = [];

export const INITIAL_REQUESTS: PurchaseRequest[] = [];
