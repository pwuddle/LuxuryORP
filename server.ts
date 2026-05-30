/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { INITIAL_VEHICLES, INITIAL_REQUESTS, INITIAL_SALES } from "./src/data";
import { Vehicle, PurchaseRequest, SaleRecord } from "./src/types";

// Load environment variables
dotenv.config();

const STATE_FILE_PATH = path.join(process.cwd(), "dealership_state.json");

let vehicles: Vehicle[] = [...INITIAL_VEHICLES];
let requests: PurchaseRequest[] = [...INITIAL_REQUESTS];
let sales: SaleRecord[] = [...INITIAL_SALES];
let deletedCustomerIds: string[] = [];
let registeredCustomers: any[] = [];
let editedCustomers: Record<string, any> = {};
let spreadsheetUrl: string = "";

// Google API configuration and OAuth tokens
let googleClientId: string = "";
let googleClientSecret: string = "";
let googleAccessToken: string = "";
let googleRefreshToken: string = "";
let googleTokenExpiry: number = 0;

let onStateChangeCallback: (() => void) | null = null;

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf-8"));
      
      const mockVehicleIds = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8"];
      if (Array.isArray(data.vehicles)) {
        vehicles = data.vehicles.filter((v: any) => v && !mockVehicleIds.includes(v.id));
      } else {
        vehicles = [...INITIAL_VEHICLES];
      }

      if (Array.isArray(data.requests)) {
        requests = data.requests;
      } else {
        requests = [...INITIAL_REQUESTS];
      }

      const mockSaleIds = ["s1", "s2"];
      if (Array.isArray(data.sales)) {
        sales = data.sales.filter((s: any) => s && !mockSaleIds.includes(s.id));
      } else {
        sales = [...INITIAL_SALES];
      }

      if (Array.isArray(data.deletedCustomerIds)) deletedCustomerIds = data.deletedCustomerIds;

      const mockCustomerIds = ["123456789012345678", "888888888888888888", "111111111111111111", "222222222222222222", "333333333333333333", "444444444444444444", "555555555555555555"];
      if (Array.isArray(data.registeredCustomers)) {
        registeredCustomers = data.registeredCustomers.filter((c: any) => c && !mockCustomerIds.includes(c.id));
      } else {
        registeredCustomers = [];
      }

      if (data.editedCustomers) {
        editedCustomers = { ...data.editedCustomers };
        for (const mid of mockCustomerIds) {
          delete editedCustomers[mid];
        }
      } else {
        editedCustomers = {};
      }

      if (typeof data.spreadsheetUrl === "string") spreadsheetUrl = data.spreadsheetUrl;
      if (typeof data.googleClientId === "string") googleClientId = data.googleClientId;
      if (typeof data.googleClientSecret === "string") googleClientSecret = data.googleClientSecret;
      if (typeof data.googleAccessToken === "string") googleAccessToken = data.googleAccessToken;
      if (typeof data.googleRefreshToken === "string") googleRefreshToken = data.googleRefreshToken;
      if (typeof data.googleTokenExpiry === "number") googleTokenExpiry = data.googleTokenExpiry;

      console.log("Successfully loaded dealership state from persistent file and removed mock presets/voorbeeld data.");
      // Instantly save state to clean persistent file too
      saveState(true);
    } else {
      console.log("No persistent dealership state file found. Using default initial state.");
      saveState(true);
    }
  } catch (err) {
    console.error("Failed to load dealership state from file:", err);
  }
}

function saveState(skipGoogleSync: boolean = false) {
  try {
    fs.writeFileSync(
      STATE_FILE_PATH,
      JSON.stringify({ 
        vehicles, 
        requests, 
        sales, 
        deletedCustomerIds, 
        registeredCustomers, 
        editedCustomers, 
        spreadsheetUrl,
        googleClientId,
        googleClientSecret,
        googleAccessToken,
        googleRefreshToken,
        googleTokenExpiry
      }, null, 2),
      "utf-8"
    );
    if (onStateChangeCallback && !skipGoogleSync) {
      onStateChangeCallback();
    }
  } catch (err) {
    console.error("Failed to save dealership state to file:", err);
  }
}

// Load current persistent state info on startup
loadState();

async function startServer() {
  const app = express();
  app.enable("trust proxy");
  const PORT = 3000;

  // Helper to extract clean secure host for redirects (e.g. enforce https for OAuth on non-localhost)
  function getRequestHost(req: express.Request): string {
    if (process.env.APP_URL) {
      return process.env.APP_URL.replace(/\/$/, "");
    }
    const rawHost = req.get("host") || "";
    const isLocal = rawHost.includes("localhost") || rawHost.includes("127.0.0.1");
    const protocol = isLocal ? req.protocol : "https";
    return `${protocol}://${rawHost}`;
  }

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route: Get the current global dealership state
  app.get("/api/dealership/state", (req, res) => {
    res.json({ vehicles, requests, sales, deletedCustomerIds, registeredCustomers, editedCustomers });
  });

  // Helper to extract Spreadsheet ID
  function getSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  // Helper to refresh Google Token if needed
  async function refreshGoogleAccessToken(): Promise<string | null> {
    if (!googleRefreshToken) {
      console.log("Unable to refresh Google access token: No refresh token stored.");
      return null;
    }
    if (googleAccessToken && googleTokenExpiry && Date.now() < googleTokenExpiry) {
      return googleAccessToken;
    }

    try {
      const tokenUrl = "https://oauth2.googleapis.com/token";
      const bodyParams = new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: googleRefreshToken,
        grant_type: "refresh_token"
      });

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: bodyParams.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google token refresh request failed:", errorText);
        return null;
      }

      const data = await response.json();
      googleAccessToken = data.access_token;
      if (data.expires_in) {
        googleTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
      }
      saveState(true);
      console.log("Successfully refreshed Google access token.");
      return googleAccessToken;
    } catch (err) {
      console.error("Failed to automatically refresh Google access token:", err);
      return null;
    }
  }

  // Core Sync to Google Sheets Function
  async function syncAllToGoogleSheets(): Promise<{ success: boolean; message: string }> {
    if (!spreadsheetUrl) {
      return { success: false, message: "Geen Google Spreadsheet URL geconfigureerd." };
    }

    const spreadsheetId = getSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      return { success: false, message: "Ongeldige Google Spreadsheet URL. Kon de ID niet extraheren." };
    }

    const token = await refreshGoogleAccessToken();
    if (!token) {
      return { success: false, message: "Server is niet verbonden met Google. Sla eerst uw Client-gegevens op en klik op 'Koppel Google Account'." };
    }

    try {
      // 1. Fetch current sheets to see if tabs exist
      const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
      const metaRes = await fetch(metadataUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!metaRes.ok) {
        if (metaRes.status === 401 || metaRes.status === 403) {
          return { success: false, message: "Geen toegang tot spreadsheet. Uw tokens zijn mogelijk verlopen. Koppel uw Google Account opnieuw." };
        }
        const errorDetail = await metaRes.text();
        throw new Error(`Google API fout: ${errorDetail}`);
      }

      const metadata = await metaRes.json();
      const sheetTitles: string[] = metadata.sheets?.map((s: any) => s.properties.title) || [];

      // Required tabs
      const requiredTabs = ["Catalogus", "Klanten", "Verkopen"];
      const missingTabs = requiredTabs.filter(tab => !sheetTitles.includes(tab));

      if (missingTabs.length > 0) {
        // Add required tabs
        const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
        const requestsList = missingTabs.map(tab => ({
          addSheet: { properties: { title: tab } }
        }));

        const addRes = await fetch(batchUpdateUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ requests: requestsList })
        });

        if (!addRes.ok) {
          throw new Error("Kon de vereiste tabbladen (Catalogus, Klanten, enz.) niet automatisch aanmaken.");
        }
      }

      // 2. Prepare datasets for each sheet
      // Tab: Catalogus
      const catalogData = [
        ["ID", "Merk/Naam", "Categorie", "Inkoopprijs", "Verkoopprijs", "Voorraad", "Snelheid (Stock)", "Snelheid (Tuned)", "Plekken", "Status (Uitverkocht?)", "Omschrijving"],
        ...vehicles.map(v => [
          v.id,
          `${v.brand} ${v.name}`,
          v.category,
          v.purchasePrice,
          v.price,
          v.stock,
          v.topSpeedStock,
          v.topSpeedTuned,
          v.inzittenden,
          v.isSoldOut ? "JA" : "NEE",
          v.description || ""
        ])
      ];

      // Tab: Klanten
      const customersData = [
        ["Discord ID", "Discord Naam", "In-Game Naam (IC)", "BSN", "Geboortedatum", "Registratiedatum"],
        ...registeredCustomers.map(c => {
          const edit = editedCustomers[c.id] || {};
          return [
            c.id,
            c.globalName || c.username,
            edit.fullName || "-",
            edit.bsn || "-",
            edit.birthDate || "-",
            c.registrationDate || "-"
          ];
        })
      ];

      // Tab: Verkopen
      const salesData = [
        ["Referentie ID", "Klant Discord ID", "Klant Naam", "Voertuig ID", "Voertuig Naam", "Betaalde Prijs", "Datum", "Verkoper", "Status"],
        ...sales.map(s => [
          s.id,
          s.buyerDiscordId,
          s.buyerName,
          s.vehicleId,
          s.vehicleName,
          s.pricePaid,
          s.date,
          s.salesperson,
          s.status
        ])
      ];

      // 3. Sync each tab by clearing and writing
      const dataToSync = [
        { title: "Catalogus", rows: catalogData },
        { title: "Klanten", rows: customersData },
        { title: "Verkopen", rows: salesData }
      ];

      for (const item of dataToSync) {
        // Clear old range
        const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${item.title}'!A1:Z5000:clear`;
        await fetch(clearUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });

        // Write new range
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${item.title}'!A1?valueInputOption=USER_ENTERED`;
        const writeRes = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            range: `'${item.title}'!A1`,
            majorDimension: "ROWS",
            values: item.rows
          })
        });

        if (!writeRes.ok) {
          const errText = await writeRes.text();
          throw new Error(`Fout bij schrijven naar tabbladen: ${errText}`);
        }
      }

      return { success: true, message: "Gegevens succesvol live gesynchroniseerd met Google Spreadsheet!" };
    } catch (error: any) {
      console.error("Google sheets sync error:", error);
      return { success: false, message: `Sync mislukt: ${error.message}` };
    }
  }

  // Core Import from Google Sheets Function
  async function importAllFromGoogleSheetsInternal(): Promise<{
    success: boolean;
    message: string;
    importedCatalogCount: number;
    importedCustomersCount: number;
    importedSalesCount: number;
  }> {
    if (!spreadsheetUrl) {
      return { success: false, message: "Geen Google Spreadsheet URL geconfigureerd.", importedCatalogCount: 0, importedCustomersCount: 0, importedSalesCount: 0 };
    }

    const spreadsheetId = getSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      return { success: false, message: "Ongeldige Google Spreadsheet URL. Kon de ID niet extraheren.", importedCatalogCount: 0, importedCustomersCount: 0, importedSalesCount: 0 };
    }

    const token = await refreshGoogleAccessToken();
    if (!token) {
      return { success: false, message: "Server is niet verbonden met Google of autorisatie is verlopen.", importedCatalogCount: 0, importedCustomersCount: 0, importedSalesCount: 0 };
    }

    try {
      // Fetch sheet details to see which tabs exist
      const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
      const metaRes = await fetch(metadataUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!metaRes.ok) {
        const errorDetail = await metaRes.text();
        return { success: false, message: `Toegang tot spreadsheet geweigerd door Google: ${errorDetail}`, importedCatalogCount: 0, importedCustomersCount: 0, importedSalesCount: 0 };
      }

      const metadata = await metaRes.json();
      const sheetTitles: string[] = metadata.sheets?.map((s: any) => s.properties.title) || [];

      let importedCatalogCount = 0;
      let importedCustomersCount = 0;
      let importedSalesCount = 0;

      // 1. IMPORT CATALOGUS (VEHICLES)
      if (sheetTitles.includes("Catalogus")) {
        const catUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Catalogus'!A1:Z5000`;
        const catRes = await fetch(catUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (catRes.ok) {
          const catData = await catRes.json();
          const rows = catData.values || [];
          if (rows.length > 1) {
            // Find columns dynamically by matching headers mapping
            const headerRow = rows[0] || [];
            const colMap: Record<string, number> = {
              id: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("id")),
              brandName: headerRow.findIndex((h: string) => h && (h.toLowerCase().includes("merk") || h.toLowerCase().includes("naam") || h.toLowerCase().includes("model"))),
              category: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("cat")),
              purchasePrice: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("inkoop")),
              price: headerRow.findIndex((h: string) => h && (h.toLowerCase().includes("verkoop") || h.toLowerCase().includes("prijs"))),
              stock: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("voorraad")),
              speedStock: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("stock")), // speed stock
              speedTuned: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("tuned")), // speed tuned
              plekken: headerRow.findIndex((h: string) => h && (h.toLowerCase().includes("plek") || h.toLowerCase().includes("inzittenden"))),
              status: headerRow.findIndex((h: string) => h && (h.toLowerCase().includes("status") || h.toLowerCase().includes("uitverkocht"))),
              description: headerRow.findIndex((h: string) => h && (h.toLowerCase().includes("omschrijving") || h.toLowerCase().includes("beschrijving")))
            };

            const newVehicles: Vehicle[] = [];

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length === 0) continue;

              const getVal = (colKey: string, defIdx: number) => {
                const idx = colMap[colKey] !== -1 ? colMap[colKey] : defIdx;
                return row[idx] !== undefined ? String(row[idx]).trim() : "";
              };

              // Make sure we have an ID or generate a unique random one if it's draft row
              let idVal = getVal("id", 0);
              if (!idVal) {
                // If it's a completely empty row, ignore it
                const lineContent = row.join("").trim();
                if (!lineContent) continue;
                idVal = "v_" + Math.random().toString(36).substr(2, 9);
              }

              const brandName = getVal("brandName", 1);
              if (!brandName) continue; // Skip if vehicle has no name

              let brand = "Overige";
              let name = brandName;
              if (brandName.includes(" ")) {
                const spaceIdx = brandName.indexOf(" ");
                brand = brandName.substring(0, spaceIdx).trim();
                name = brandName.substring(spaceIdx + 1).trim();
              }

              // category filter
              const rawCat = getVal("category", 2);
              let category: "Super" | "Sports" | "SUV/Off-Road" | "Classic" | "Overige" = "Overige";
              const lCat = rawCat.toLowerCase();
              if (lCat.includes("super")) category = "Super";
              else if (lCat.includes("sport")) category = "Sports";
              else if (lCat.includes("suv") || lCat.includes("off-road") || lCat.includes("terrein") || lCat.includes("road")) category = "SUV/Off-Road";
              else if (lCat.includes("classic") || lCat.includes("klassiek")) category = "Classic";

              // Clean prices helper to remove euros, currency symbols, and commas
              const cleanNumberStr = (str: string) => {
                let clean = str.replace(/[€$£\s]/g, "");
                if (clean.includes(",") && clean.includes(".")) {
                  clean = clean.replace(/,/g, "");
                } else if (clean.includes(",")) {
                  if (clean.split(",")[1]?.length === 3) {
                    clean = clean.replace(/,/g, "");
                  } else {
                    clean = clean.replace(/,/g, ".");
                  }
                }
                return clean;
              };

              const rawPurchasePrice = cleanNumberStr(getVal("purchasePrice", 3));
              const purchasePrice = parseFloat(rawPurchasePrice) || 0;

              const rawPrice = cleanNumberStr(getVal("price", 4));
              const price = parseFloat(rawPrice) || 0;

              const stock = parseInt(getVal("stock", 5).replace(/[^0-9-]/g, "")) || 0;
              const topSpeedStock = parseInt(getVal("speedStock", 6).replace(/[^0-9]/g, "")) || 0;
              const topSpeedTuned = parseInt(getVal("speedTuned", 7).replace(/[^0-9]/g, "")) || 0;
              const inzittenden = parseInt(getVal("plekken", 8).replace(/[^0-9]/g, "")) || 2;

              const statusStr = getVal("status", 9).toUpperCase();
              const isSoldOut = statusStr === "JA" || statusStr === "TRUE" || statusStr === "YES" || statusStr === "UITVERKOCHT";

              const description = getVal("description", 10);
              
              // Find existing vehicle to preserve image or properties
              const existingVehicle = vehicles.find(v => v.id === idVal);
              const image = existingVehicle?.image || `https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800`;
              const featured = existingVehicle?.featured || false;

              newVehicles.push({
                id: idVal,
                brand,
                name,
                category,
                purchasePrice,
                price,
                stock,
                topSpeedStock,
                topSpeedTuned,
                inzittenden,
                isSoldOut,
                description,
                image,
                featured
              });
            }

            if (newVehicles.length > 0) {
              // Merge: replace existing or append new
              for (const nv of newVehicles) {
                const idx = vehicles.findIndex(v => v.id === nv.id);
                if (idx !== -1) {
                  vehicles[idx] = nv;
                } else {
                  vehicles.push(nv);
                }
              }
              importedCatalogCount = newVehicles.length;
            }
          }
        }
      }

      // 2. IMPORT KLANTEN (CUSTOMERS)
      if (sheetTitles.includes("Klanten")) {
        const kUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Klanten'!A1:Z5000`;
        const kRes = await fetch(kUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (kRes.ok) {
          const kData = await kRes.json();
          const rows = kData.values || [];
          if (rows.length > 1) {
            const headerRow = rows[0] || [];
            const colMap: Record<string, number> = {
              id: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("id")),
              discordName: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("naam")),
              fullName: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("in-game")),
              bsn: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("bsn")),
              birthDate: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("geboorte")),
              regDate: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("registratie"))
            };

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length === 0) continue;

              const getVal = (colKey: string, defIdx: number) => {
                const idx = colMap[colKey] !== -1 ? colMap[colKey] : defIdx;
                return row[idx] !== undefined ? String(row[idx]).trim() : "";
              };

              const idVal = getVal("id", 0);
              if (!idVal || idVal === "-") continue;

              const discordName = getVal("discordName", 1);
              const fullName = getVal("fullName", 2);
              const bsn = getVal("bsn", 3);
              const birthDate = getVal("birthDate", 4);
              const regDate = getVal("regDate", 5);

              // Update edited customers metadata
              editedCustomers[idVal] = {
                id: idVal,
                fullName: fullName !== "-" ? fullName : "",
                bsn: bsn !== "-" ? bsn : "",
                birthDate: birthDate !== "-" ? birthDate : ""
              };

              // Ensure registered customers array contains this user
              const extCust = registeredCustomers.find(c => c.id === idVal);
              if (!extCust) {
                registeredCustomers.push({
                  id: idVal,
                  username: discordName.toLowerCase().replace(/\s+/g, ""),
                  globalName: discordName !== "-" ? discordName : `DiscordKlant_${idVal.substring(0,4)}`,
                  avatar: null,
                  role: "Klant",
                  hasLoggedIn: true,
                  registrationDate: regDate !== "-" ? regDate : new Date().toLocaleDateString("nl-NL")
                });
              } else {
                if (discordName && discordName !== "-") {
                  extCust.globalName = discordName;
                }
              }
              importedCustomersCount++;
            }
          }
        }
      }

      // 3. IMPORT VERKOPEN (SALES)
      if (sheetTitles.includes("Verkopen")) {
        const sUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Verkopen'!A1:Z5000`;
        const sRes = await fetch(sUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (sRes.ok) {
          const sData = await sRes.json();
          const rows = sData.values || [];
          if (rows.length > 1) {
            const headerRow = rows[0] || [];
            const colMap: Record<string, number> = {
              id: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("referentie")),
              buyerDiscordId: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("klant discord id")),
              buyerName: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("klant naam")),
              vehicleId: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("voertuig id")),
              vehicleName: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("voertuig naam")),
              pricePaid: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("prijs")),
              date: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("datum")),
              salesperson: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("verkoper")),
              status: headerRow.findIndex((h: string) => h && h.toLowerCase().includes("status"))
            };

            const newSales: SaleRecord[] = [];

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length === 0) continue;

              const getVal = (colKey: string, defIdx: number) => {
                const idx = colMap[colKey] !== -1 ? colMap[colKey] : defIdx;
                return row[idx] !== undefined ? String(row[idx]).trim() : "";
              };

              let idVal = getVal("id", 0);
              if (!idVal) {
                // Ignore empty row
                if (!row.join("").trim()) continue;
                idVal = "mh-s_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
              }

              const buyerDiscordId = getVal("buyerDiscordId", 1); // Left empty if missing since getVal defaults to ""
              const buyerName = getVal("buyerName", 2);
              
              let vehicleId = getVal("vehicleId", 3);
              if (!vehicleId) {
                vehicleId = "mh-v_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
              }

              const vehicleName = getVal("vehicleName", 4);
              
              let cleanPrice = getVal("pricePaid", 5).replace(/[€$£\s]/g, "");
              if (cleanPrice.includes(",") && cleanPrice.includes(".")) {
                cleanPrice = cleanPrice.replace(/,/g, "");
              } else if (cleanPrice.includes(",")) {
                if (cleanPrice.split(",")[1]?.length === 3) {
                  cleanPrice = cleanPrice.replace(/,/g, "");
                } else {
                  cleanPrice = cleanPrice.replace(/,/g, ".");
                }
              }
              const pricePaid = parseFloat(cleanPrice) || 0;

              const date = getVal("date", 6) || new Date().toLocaleDateString("nl-NL");
              const salesperson = getVal("salesperson", 7) || "Onbekend";
              
              const rawPricePaidStatus = getVal("status", 8);
              let status: "Gereserveerd" | "Besteld" | "Betaald" | "Opgehaald" = "Betaald";
              if (rawPricePaidStatus) {
                const lStatus = rawPricePaidStatus.toLowerCase();
                if (lStatus.includes("opgehaald") || lStatus.includes("picked")) status = "Opgehaald";
                else if (lStatus.includes("betaald") || lStatus.includes("paid")) status = "Betaald";
                else if (lStatus.includes("besteld") || lStatus.includes("order")) status = "Besteld";
                else if (lStatus.includes("gereserveerd") || lStatus.includes("reserve")) status = "Gereserveerd";
              }

              newSales.push({
                id: idVal,
                buyerDiscordId,
                buyerName,
                vehicleId,
                vehicleName,
                pricePaid,
                date,
                salesperson,
                status
              });
            }

            if (newSales.length > 0) {
              for (const ns of newSales) {
                const idx = sales.findIndex(s => s.id === ns.id);
                if (idx !== -1) {
                  sales[idx] = ns;
                } else {
                  sales.push(ns);
                }
              }
              importedSalesCount = newSales.length;
            }
          }
        }
      }

      saveState(true);

      let summary = "Gegevens succesvol geïmporteerd!";
      const details = [];
      if (importedCatalogCount > 0) details.push(`${importedCatalogCount} catalogus voertuigen`);
      if (importedCustomersCount > 0) details.push(`${importedCustomersCount} klanten`);
      if (importedSalesCount > 0) details.push(`${importedSalesCount} verkopen`);
      
      if (details.length > 0) {
        summary += ` Er zijn: ${details.join(", ")} succesvol verwerkt en gesynchroniseerd met de lokale database.`;
      } else {
        summary = "Koppeling succesvol tot stand gebracht, maar er werden geen bruikbare rijen gevonden in de tabbladen 'Catalogus', 'Klanten' of 'Verkopen'.";
      }

      return {
        success: true,
        message: summary,
        importedCatalogCount,
        importedCustomersCount,
        importedSalesCount
      };
    } catch (e: any) {
      console.error("Internal import exception:", e);
      return {
        success: false,
        message: `Fout tijdens inlezen: ${e.message}`,
        importedCatalogCount: 0,
        importedCustomersCount: 0,
        importedSalesCount: 0
      };
    }
  }

  // Assign global auto-sync on state change
  let syncTimeout: NodeJS.Timeout | null = null;
  onStateChangeCallback = () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      if (spreadsheetUrl && googleRefreshToken) {
        console.log("Automatic auto-sync to Google Sheets triggered.");
        syncAllToGoogleSheets()
          .then(res => {
            if (res.success) {
              console.log("Auto-sync success:", res.message);
            } else {
              console.warn("Auto-sync did not complete:", res.message);
            }
          })
          .catch(e => console.error("Auto-sync background error:", e));
      }
    }, 1500) as any;
  };

  // Google Sheets configuration and secure values retrieval
  app.get("/api/dealership/google-config", (req, res) => {
    res.json({
      spreadsheetUrl,
      googleClientId,
      googleClientSecret: googleClientSecret ? "•••••••••••••" : "",
      isConnected: !!googleRefreshToken,
      googleTokenExpiry
    });
  });

  // Google Sheets configurations submission
  app.post("/api/dealership/google-config", (req, res) => {
    const { url, clientId, clientSecret } = req.body;
    
    spreadsheetUrl = url || "";
    if (clientId !== undefined) googleClientId = clientId;
    
    if (clientSecret !== undefined && clientSecret !== "•••••••••••••" && clientSecret !== "") {
      googleClientSecret = clientSecret;
    }
    
    saveState(true);
    res.json({ 
      success: true, 
      spreadsheetUrl,
      googleClientId,
      isConnected: !!googleRefreshToken
    });
  });

  // Redirect client to Google Consent Dialog
  app.get("/api/dealership/google-auth-start", (req, res) => {
    if (!googleClientId) {
      return res.status(400).send("Fout: Google Client ID is niet geconfigureerd in Website Administratie.");
    }
    const host = getRequestHost(req);
    const redirectUri = `${host}/api/dealership/google-auth-callback`;
    
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/spreadsheets",
      access_type: "offline",
      prompt: "consent"
    });
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.redirect(googleAuthUrl);
  });

  // Google OAuth Authorization Exchange Code Callback
  app.get("/api/dealership/google-auth-callback", async (req, res) => {
    const { code, error } = req.query;
    if (error) {
      return res.status(400).send(`Google Login is geannuleerd of mislukt: ${error}`);
    }
    if (!code) {
      return res.status(400).send("Geen geldige code ontvangen van Google.");
    }

    try {
      const host = getRequestHost(req);
      const redirectUri = `${host}/api/dealership/google-auth-callback`;

      const tokenUrl = "https://oauth2.googleapis.com/token";
      const bodyParams = new URLSearchParams({
        code: code as string,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      });

      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: bodyParams.toString()
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Google Token API returned ${tokenRes.status}: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      googleAccessToken = tokenData.access_token;
      if (tokenData.refresh_token) {
        googleRefreshToken = tokenData.refresh_token; 
      }
      if (tokenData.expires_in) {
        googleTokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000;
      }
      saveState(true);

      if (spreadsheetUrl) {
        console.log("Google Sheets connection successful. Automatically reading current datasets to avoid overrides...");
        importAllFromGoogleSheetsInternal()
          .then(result => {
            if (result.success) {
              console.log("Auto-import on connection success:", result.message);
            } else {
              console.warn("Auto-import on connection warning:", result.message);
            }
          })
          .catch(e => {
            console.error("Auto-import on connection failed:", e);
          });
      }

      res.send(`
        <!doctype html>
        <html lang="nl">
          <head>
            <meta charset="utf-8">
            <title>Google Sheets Gekoppeld</title>
            <style>
              body {
                background: #1e1f22;
                color: #dcddde;
                font-family: sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
              }
              .card {
                background: #2b2d31;
                border: 1px solid #A87E43;
                border-radius: 8px;
                padding: 30px;
                max-width: 400px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
              }
              h1 { color: #A87E43; margin-top: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
              p { font-size: 13px; color: #949ba4; line-height: 1.5; }
              .spinner {
                border: 3px solid rgba(255,255,255,0.05);
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border-left-color: #A87E43;
                animation: spin 0.8s linear infinite;
                margin: 20px auto 0 auto;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Google Sheets Gekoppeld!</h1>
              <p>Machtiging is succesvol verleend. Deze pop-up sluit na enkele seconden...</p>
              <div class="spinner"></div>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_SHEETS_AUTH_SUCCESS' }, '*');
                setTimeout(() => {
                  window.close();
                }, 1500);
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Google OAuth Callback exchange error:", err);
      res.status(500).send(`Google OAuth validatie mislukt: ${err.message}`);
    }
  });

  // Google Sheets sign out config reset
  app.post("/api/dealership/google-disconnect", (req, res) => {
    googleAccessToken = "";
    googleRefreshToken = "";
    googleTokenExpiry = 0;
    saveState(true);
    res.json({ success: true });
  });

  // Google Sheets forced manual synchronization API
  app.post("/api/dealership/google-sync", async (req, res) => {
    const result = await syncAllToGoogleSheets();
    res.json(result);
  });

  // Google Sheets manual import from Spreadsheet logic
  app.post("/api/dealership/google-import", async (req, res) => {
    const result = await importAllFromGoogleSheetsInternal();
    res.json(result);
  });

  // API Route: Add or update a vehicle in the catalog
  app.post("/api/dealership/vehicles", (req, res) => {
    const vehicle = req.body as Vehicle;
    if (!vehicle || !vehicle.id) {
      return res.status(400).json({ error: "Ongeldige voertuiggegevens" });
    }
    const idx = vehicles.findIndex(v => v.id === vehicle.id);
    if (idx !== -1) {
      vehicles[idx] = vehicle;
    } else {
      vehicles.push(vehicle);
    }
    saveState();
    res.json({ success: true, vehicle });
  });

  // API Route: Delete a vehicle from the catalog
  app.delete("/api/dealership/vehicles/:id", (req, res) => {
    const { id } = req.params;
    vehicles = vehicles.filter(v => v.id !== id);
    saveState();
    res.json({ success: true });
  });

  // API Route: Add or update a purchase request
  app.post("/api/dealership/requests", (req, res) => {
    const request = req.body as PurchaseRequest;
    if (!request || !request.id) {
      return res.status(400).json({ error: "Ongeldige aanvraaggegevens" });
    }
    const idx = requests.findIndex(r => r.id === request.id);
    if (idx !== -1) {
      requests[idx] = request;
    } else {
      requests.push(request);
    }
    saveState();
    res.json({ success: true, request });
  });

  // API Route: Add or update a sale record
  app.post("/api/dealership/sales", (req, res) => {
    const sale = req.body as SaleRecord;
    if (!sale || !sale.id) {
      return res.status(400).json({ error: "Ongeldige verkoopgegevens" });
    }
    const idx = sales.findIndex(s => s.id === sale.id);
    if (idx !== -1) {
      sales[idx] = sale;
    } else {
      sales.push(sale);
    }
    saveState();
    res.json({ success: true, sale });
  });

  // API Route: Delete a sale record (annul/delete)
  app.delete("/api/dealership/sales/:id", (req, res) => {
    const { id } = req.params;
    sales = sales.filter(s => s.id !== id);
    saveState();
    res.json({ success: true });
  });

  // API Route: Delete a customer (mark as deleted)
  app.delete("/api/dealership/customers/:id", (req, res) => {
    const { id } = req.params;
    if (!deletedCustomerIds.includes(id)) {
      deletedCustomerIds.push(id);
    }
    saveState();
    res.json({ success: true, deletedCustomerIds });
  });

  // API Route: Register customer on login
  app.post("/api/dealership/customers/login", (req, res) => {
    const visitor = req.body;
    if (!visitor || !visitor.id) {
      return res.status(400).json({ error: "Ongeldige gegevens" });
    }
    // Check if duplicate (already registered)
    const existingCustomer = registeredCustomers.find(c => c.id === visitor.id);
    if (!existingCustomer) {
      registeredCustomers.push({
        id: visitor.id,
        username: visitor.username,
        globalName: visitor.globalName || visitor.username,
        avatar: visitor.avatar,
        hasLoggedIn: true,
        registrationDate: new Date().toISOString().split("T")[0]
      });
    } else {
      // Update their Discord details (including profile picture avatar) upon login
      existingCustomer.avatar = visitor.avatar;
      existingCustomer.username = visitor.username;
      existingCustomer.globalName = visitor.globalName || visitor.username;
      existingCustomer.hasLoggedIn = true;
    }
    // Always remove from deleted list if they are logging in again (meaning they are restored)
    if (deletedCustomerIds.includes(visitor.id)) {
      deletedCustomerIds = deletedCustomerIds.filter(id => id !== visitor.id);
    }
    saveState();
    res.json({ success: true, registeredCustomers, deletedCustomerIds });
  });

  // API Route: Edit customer details
  app.post("/api/dealership/customers/edit", (req, res) => {
    const { id, fullName, bsn, birthDate } = req.body;
    if (!id) {
      return res.status(400).json({ error: "ID is verplicht" });
    }
    editedCustomers[id] = {
      fullName,
      bsn,
      birthDate
    };
    saveState();
    res.json({ success: true, editedCustomers });
  });

  // API Route: Fetch live Discord member & online counts from public invite link
  app.get("/api/discord/presence", async (req, res) => {
    try {
      const response = await fetch("https://discord.com/api/v10/invites/perseus-oranjestad?with_counts=true");
      if (!response.ok) {
        throw new Error(`Discord API returned status ${response.status}`);
      }
      const data: any = await response.json();
      res.json({
        online: data.approximate_presence_count || 1420,
        total: data.approximate_member_count || 4850,
      });
    } catch (error) {
      console.warn("Mislukt om live Discord status op te halen, fallback gebruikt:", error);
      res.json({
        online: 1420,
        total: 4850,
      });
    }
  });

  // API Route: Check if Discord configuration is live
  app.get("/api/auth/config", (req, res) => {
    const hasConfig = !!(
      process.env.DISCORD_CLIENT_ID &&
      process.env.DISCORD_CLIENT_SECRET &&
      process.env.DISCORD_BOT_TOKEN &&
      process.env.DISCORD_GUILD_ID
    );

    res.json({
      configured: hasConfig,
      clientId: process.env.DISCORD_CLIENT_ID || null,
      guildId: process.env.DISCORD_GUILD_ID || null,
      customerRoleId: process.env.DISCORD_CUSTOMER_ROLE_ID || null,
      staffRoleId: process.env.DISCORD_STAFF_ROLE_ID || null,
    });
  });

  // API Route: Build Discord OAuth URL or request simulation
  app.get("/api/auth/url", (req, res) => {
    const pane = (req.query.pane as string) || "klantenpaneel";
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID;

    // Check if configuration is missing
    if (!clientId || !process.env.DISCORD_CLIENT_SECRET || !process.env.DISCORD_BOT_TOKEN || !guildId) {
      return res.json({ simulate: true, pane });
    }

    // Standard redirect callback URL
    // Use the secure getRequestHost helper
    const host = getRequestHost(req);
    const redirectUri = `${host}/auth/callback`;

    // Construct authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "identify",
      state: pane,
    });

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    res.json({ simulate: false, url: discordAuthUrl });
  });

  // OAuth Callback endpoint with postMessage
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code, state: pane } = req.query;

    if (!code) {
      return res.status(400).send("Geen autorisatiecode ontvangen van Discord.");
    }

    const rawClientId = (process.env.DISCORD_CLIENT_ID || "").trim();
    const rawClientSecret = (process.env.DISCORD_CLIENT_SECRET || "").trim();
    const rawBotToken = (process.env.DISCORD_BOT_TOKEN || "").trim();
    const rawGuildId = (process.env.DISCORD_GUILD_ID || "").trim();

    if (!rawClientId || !rawClientSecret || !rawBotToken || !rawGuildId) {
      return res.status(500).send("Discord app-credentials zijn incompleet geconfigureerd op de server.");
    }

    const clientId = rawClientId;
    const clientSecret = rawClientSecret;
    const botToken = rawBotToken.startsWith("Bot ") ? rawBotToken.substring(4).trim() : rawBotToken;
    const guildId = rawGuildId;

    try {
      const host = getRequestHost(req);
      const redirectUri = `${host}/auth/callback`;

      // 1. Exchange the temporary code for an Access Token
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", errorText);
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // 2. Fetch the user info from Discord
      const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Mislukt om Discord gebruikersgegevens op te halen.");
      }

      const userData = await userResponse.json();
      const userId = userData.id;

      // Fetch roles list early from the Discord bot API to support matching clean role IDs OR role NAMES
      let discordRoles: any[] = [];
      try {
        const rolesResponse = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        });
        if (rolesResponse.ok) {
          const fetchedRoles = await rolesResponse.json();
          if (Array.isArray(fetchedRoles)) {
            discordRoles = fetchedRoles;
          }
        }
      } catch (err) {
        console.warn("Could not fetch guild roles details early:", err);
      }

      // Query the Discord API to check if they are in the Server and have the appropriate Role
      const memberResponse = await fetch(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });

      const staffRoleId = (process.env.DISCORD_STAFF_ROLE_ID || "").trim();
      const customerRoleId = (process.env.DISCORD_CUSTOMER_ROLE_ID || "").trim();
      const managerRoleId = (process.env.DISCORD_MANAGER_ROLE_ID || "").trim();
      const ownerRoleId = (process.env.DISCORD_OWNER_ROLE_ID || "").trim();
      const coordinatorRoleId = (process.env.DISCORD_COORDINATOR_ROLE_ID || "").trim();

      let hasStaffRole = false;
      let hasCustomerRole = false;
      let hasManagerRole = false;
      let hasOwnerRole = false;
      let hasCoordinatorRole = false;
      let memberRoles: string[] = [];
      let discordMemberData: any = null;
      let errorBody = "";

      if (memberResponse.ok) {
        discordMemberData = await memberResponse.json();
        memberRoles = discordMemberData.roles || [];

        // Dynamic helper to match roles by ID, clean string ID, or role NAME (case-insensitive, trims @ prefix)
        const checkRoleValue = (configValue: string) => {
          if (!configValue) return false;
          
          const cleanConfig = configValue.replace(/^@/, "").trim().toLowerCase();
          if (!cleanConfig) return false;

          // 1. Direct ID match
          if (memberRoles.includes(configValue)) return true;

          // 2. Clean ID match
          if (memberRoles.includes(cleanConfig)) return true;

          // 3. Name match through fetched server roles
          const matchingRole = discordRoles.find((r: any) => {
            const cleanName = r.name.replace(/^@/, "").trim().toLowerCase();
            return cleanName === cleanConfig;
          });

          if (matchingRole && memberRoles.includes(matchingRole.id)) {
            return true;
          }

          return false;
        };

        hasStaffRole = checkRoleValue(staffRoleId);
        hasManagerRole = checkRoleValue(managerRoleId);
        hasOwnerRole = checkRoleValue(ownerRoleId);
        hasCoordinatorRole = checkRoleValue(coordinatorRoleId);
        hasCustomerRole = customerRoleId ? checkRoleValue(customerRoleId) : true;
      } else {
        errorBody = await memberResponse.text();
        console.warn("Could not fetch guild member details:", errorBody);
      }

      const isEmployee = hasStaffRole || hasManagerRole || hasOwnerRole;

      // Determine authorization based on requested pane and roles
      let hasRole = false;
      if (pane === "medewerkerpaneel") {
        hasRole = isEmployee || hasCoordinatorRole;
      } else {
        // Can be customer OR staff/manager/owner to view customers page (since employee is also customer)
        hasRole = hasCustomerRole || isEmployee || hasCoordinatorRole;
      }

      // If they are allowed in, but roles are empty because of lack of configuration, allow it
      if (memberResponse.ok && !staffRoleId && !customerRoleId && !managerRoleId && !ownerRoleId && !coordinatorRoleId) {
        hasRole = true;
      }

      // Resolve actual Discord role name for the app UI
      let discordRoleName = "";
      if (hasRole && memberResponse.ok) {
        if (hasOwnerRole) {
          const matchedRole = discordRoles.find((r: any) => {
            if (ownerRoleId && r.id === ownerRoleId) return true;
            const cleanConfig = ownerRoleId ? ownerRoleId.replace(/^@/, "").trim().toLowerCase() : "";
            return cleanConfig && r.name.replace(/^@/, "").trim().toLowerCase() === cleanConfig;
          });
          discordRoleName = matchedRole ? matchedRole.name : "Eigenaar";
        } else if (hasManagerRole) {
          const matchedRole = discordRoles.find((r: any) => {
            if (managerRoleId && r.id === managerRoleId) return true;
            const cleanConfig = managerRoleId ? managerRoleId.replace(/^@/, "").trim().toLowerCase() : "";
            return cleanConfig && r.name.replace(/^@/, "").trim().toLowerCase() === cleanConfig;
          });
          discordRoleName = matchedRole ? matchedRole.name : "Manager";
        } else if (hasStaffRole) {
          const matchedRole = discordRoles.find((r: any) => {
            if (staffRoleId && r.id === staffRoleId) return true;
            const cleanConfig = staffRoleId ? staffRoleId.replace(/^@/, "").trim().toLowerCase() : "";
            return cleanConfig && r.name.replace(/^@/, "").trim().toLowerCase() === cleanConfig;
          });
          discordRoleName = matchedRole ? matchedRole.name : "Medewerker";
        } else if (hasCoordinatorRole) {
          const matchedRole = discordRoles.find((r: any) => {
            if (coordinatorRoleId && r.id === coordinatorRoleId) return true;
            const cleanConfig = coordinatorRoleId ? coordinatorRoleId.replace(/^@/, "").trim().toLowerCase() : "";
            return cleanConfig && r.name.replace(/^@/, "").trim().toLowerCase() === cleanConfig;
          });
          discordRoleName = matchedRole ? matchedRole.name : "Coördinator";
        } else if (hasCustomerRole && customerRoleId) {
          const matchedRole = discordRoles.find((r: any) => {
            if (customerRoleId && r.id === customerRoleId) return true;
            const cleanConfig = customerRoleId ? customerRoleId.replace(/^@/, "").trim().toLowerCase() : "";
            return cleanConfig && r.name.replace(/^@/, "").trim().toLowerCase() === cleanConfig;
          });
          discordRoleName = matchedRole ? matchedRole.name : "Klant";
        }
      }

      if (!discordRoleName) {
        discordRoleName = hasOwnerRole ? "Eigenaar" : hasManagerRole ? "Manager" : hasStaffRole ? "Medewerker" : hasCoordinatorRole ? "Coördinator" : "Klant";
      }

      // Check access permission
      if (!hasRole) {
        // Output failure page containing postMessage to notify application that role was not found
        // Remove technical analysis completely as requested
        return res.send(`
          <!doctype html>
          <html lang="nl">
            <head>
              <meta charset="utf-8">
              <title>Geen Toegang - Perseus Dealership</title>
              <style>
                body {
                  background: #36393f;
                  color: #dcddde;
                  font-family: sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  padding: 20px;
                  text-align: center;
                }
                .card {
                  background: #2f3136;
                  border: 1px solid #ed4245;
                  border-radius: 8px;
                  padding: 30px;
                  max-width: 500px;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }
                h1 { color: #ed4245; margin-top: 0; font-size: 22px; }
                p { font-size: 14px; line-height: 1.6; color: #b9bbbe; }
                .accent { color: #A87E43; font-weight: bold; }
                
                button {
                  background: #5865f2;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 4px;
                  font-weight: bold;
                  cursor: pointer;
                  margin-top: 15px;
                  transition: background 0.2s;
                }
                button:hover { background: #4752c4; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Geen Toegang</h1>
                <p>Hallo <strong>@${userData.username}</strong>,</p>
                <p>Je bent succesvol ingelogd via Discord, maar je bezit niet de benodigde rol om het <span class="accent">${pane === "medewerkerpaneel" ? "Medewerkerpaneel" : "Klantenpaneel"}</span> te betreden.</p>
                
                <button onclick="window.close()">Sluit Venster</button>
              </div>
              
              <script>
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_FAILURE', 
                    error: 'Niet geautoriseerd: ontbrekende serverrol.',
                    user: {
                      id: "${userId}",
                      username: "${userData.username}",
                      globalName: "${userData.global_name || userData.username}",
                      avatar: "${userData.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.png` : null}",
                      role: "Geen"
                    }
                  }, '*');
                }
              </script>
            </body>
          </html>
        `);
      }

      // Successful auth! Define returned user profile object
      const avatarUrl = userData.avatar 
        ? `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.png` 
        : null;

      const authenticatedUser = {
        id: userId,
        username: userData.username,
        globalName: userData.global_name || userData.username,
        avatar: avatarUrl,
        // If they possess the Staff, Manager or Owner role on the server, grant them "Medewerker" role automatically for smooth double access
        role: isEmployee ? "Medewerker" : "Klant",
        discordRoleName: discordRoleName,
        guildMember: true,
        isManager: hasManagerRole,
        isOwner: hasOwnerRole,
        isCoordinator: hasCoordinatorRole,
      };

      // Output authorization success page
      res.send(`
        <!doctype html>
        <html lang="nl">
          <head>
            <meta charset="utf-8">
            <title>Succesvol geautoriseerd - Perseus Dealership</title>
            <style>
              body {
                background: #36393f;
                color: #dcddde;
                font-family: sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
              }
              .card {
                background: #2f3136;
                border: 1px solid #43b581;
                border-radius: 8px;
                padding: 30px;
                max-width: 400px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
              }
              h1 { color: #43b581; margin-top: 0; font-size: 22px; }
              p { font-size: 14px; color: #b9bbbe; }
              .spinner {
                border: 4px solid rgba(255,255,255,0.1);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border-left-color: #5865f2;
                animation: spin 1s linear infinite;
                margin: 20px auto 0 auto;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Inloggen geslaagd!</h1>
              <p>Welkom, <strong>${authenticatedUser.globalName}</strong>.</p>
              <p>Je account is geverifieerd. Dit venster sluit automatisch...</p>
              <div class="spinner"></div>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify(authenticatedUser)}
                }, '*');
                setTimeout(() => {
                  window.close();
                }, 1200);
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);

    } catch (error: any) {
      console.error("OAuth process error:", error);
      res.status(500).send(`Autorisatie is mislukt vanwege een interne fout: ${error.message}`);
    }
  });

  // Serve static UI assets based on runtime environment (Express + Vite)
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev server handles client side source code
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static asset serving from compiled dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Perseus Dealership Server listening on port ${PORT}`);
    console.log(`Local url: http://localhost:${PORT}`);
  });
}

startServer();
