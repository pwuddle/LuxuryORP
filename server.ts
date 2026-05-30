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

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf-8"));
      if (Array.isArray(data.vehicles)) vehicles = data.vehicles;
      if (Array.isArray(data.requests)) requests = data.requests;
      if (Array.isArray(data.sales)) sales = data.sales;
      if (Array.isArray(data.deletedCustomerIds)) deletedCustomerIds = data.deletedCustomerIds;
      console.log("Successfully loaded dealership state from persistent file.");
    } else {
      console.log("No persistent dealership state file found. Using default initial state.");
      saveState();
    }
  } catch (err) {
    console.error("Failed to load dealership state from file:", err);
  }
}

function saveState() {
  try {
    fs.writeFileSync(
      STATE_FILE_PATH,
      JSON.stringify({ vehicles, requests, sales, deletedCustomerIds }, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("Failed to save dealership state to file:", err);
  }
}

// Load current persistent state info on startup
loadState();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route: Get the current global dealership state
  app.get("/api/dealership/state", (req, res) => {
    res.json({ vehicles, requests, sales, deletedCustomerIds });
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
    // Use the supplied APP_URL or dynamically construct context
    const host = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
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
      const host = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
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

      // 3. Query the Discord API to check if they are in the Server and have the appropriate Role
      const memberResponse = await fetch(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });

      const staffRoleId = (process.env.DISCORD_STAFF_ROLE_ID || "").trim();
      const customerRoleId = (process.env.DISCORD_CUSTOMER_ROLE_ID || "").trim();
      const managerRoleId = (process.env.DISCORD_MANAGER_ROLE_ID || "").trim();
      const ownerRoleId = (process.env.DISCORD_OWNER_ROLE_ID || "").trim();

      let hasStaffRole = false;
      let hasCustomerRole = false;
      let hasManagerRole = false;
      let hasOwnerRole = false;
      let memberRoles: string[] = [];
      let discordMemberData: any = null;
      let discordRoles: any[] = [];
      let errorBody = "";

      if (memberResponse.ok) {
        discordMemberData = await memberResponse.json();
        memberRoles = discordMemberData.roles || [];

        hasStaffRole = staffRoleId ? memberRoles.includes(staffRoleId) : false;
        hasManagerRole = managerRoleId ? memberRoles.includes(managerRoleId) : false;
        hasOwnerRole = ownerRoleId ? memberRoles.includes(ownerRoleId) : false;
        hasCustomerRole = customerRoleId ? memberRoles.includes(customerRoleId) : true;
      } else {
        errorBody = await memberResponse.text();
        console.warn("Could not fetch guild member details:", errorBody);
      }

      const isEmployee = hasStaffRole || hasManagerRole || hasOwnerRole;

      // Determine authorization based on requested pane and roles
      let hasRole = false;
      if (pane === "medewerkerpaneel") {
        hasRole = isEmployee;
      } else {
        // Can be customer OR staff/manager/owner to view customers page (since employee is also customer)
        hasRole = hasCustomerRole || isEmployee;
      }

      // If they are allowed in, but roles are empty because of lack of configuration, allow it
      if (memberResponse.ok && !staffRoleId && !customerRoleId && !managerRoleId && !ownerRoleId) {
        hasRole = true;
      }

      // Fetch actual Discord roles to get role names (non-blocking, fallback gracefully)
      let discordRoleName = "";
      if (hasRole && memberResponse.ok) {
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
              // Map role IDs to names
              if (hasOwnerRole && ownerRoleId) {
                const matchedRole = discordRoles.find((r: any) => r.id === ownerRoleId);
                if (matchedRole) {
                  discordRoleName = matchedRole.name;
                }
              } else if (hasManagerRole && managerRoleId) {
                const matchedRole = discordRoles.find((r: any) => r.id === managerRoleId);
                if (matchedRole) {
                  discordRoleName = matchedRole.name;
                }
              } else if (hasStaffRole && staffRoleId) {
                const matchedRole = discordRoles.find((r: any) => r.id === staffRoleId);
                if (matchedRole) {
                  discordRoleName = matchedRole.name;
                }
              } else if (hasCustomerRole && customerRoleId) {
                const matchedRole = discordRoles.find((r: any) => r.id === customerRoleId);
                if (matchedRole) {
                  discordRoleName = matchedRole.name;
                }
              }
            }
          }
        } catch (err) {
          console.warn("Could not fetch guild roles details:", err);
        }
      }

      if (!discordRoleName) {
        discordRoleName = hasOwnerRole ? "Eigenaar" : hasManagerRole ? "Manager" : hasStaffRole ? "Medewerker" : "Klant";
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
