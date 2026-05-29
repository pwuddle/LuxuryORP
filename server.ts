/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

      let roleToCheck = pane === "medewerkerpaneel" 
        ? (process.env.DISCORD_STAFF_ROLE_ID || "").trim() 
        : (process.env.DISCORD_CUSTOMER_ROLE_ID || "").trim();

      // If specific role configuration is empty, fallback to server membership
      let hasRole = false;
      let roleName = pane === "medewerkerpaneel" ? "Medewerker" : "Klant";
      let discordMemberData: any = null;
      let memberRoles: string[] = [];
      let errorBody = "";

      if (memberResponse.ok) {
        discordMemberData = await memberResponse.json();
        memberRoles = discordMemberData.roles || [];

        if (roleToCheck) {
          hasRole = memberRoles.includes(roleToCheck);
        } else {
          // If no specific role is listed, allow if they are in the Discord guild
          hasRole = true;
        }
      } else {
        errorBody = await memberResponse.text();
        console.warn("Could not fetch guild member details:", errorBody);
      }

      // Check access permission
      if (!hasRole) {
        // Output failure page containing postMessage to notify application that role was not found
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
                
                .debug-panel {
                  background: #1e1f22;
                  border: 1px solid rgba(81, 84, 92, 0.5);
                  border-radius: 6px;
                  margin: 18px 0;
                  padding: 12px;
                  text-align: left;
                }
                .debug-title {
                  cursor: pointer;
                  font-weight: bold;
                  font-size: 11px;
                  color: #949ba4;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  user-select: none;
                }
                .debug-content {
                  display: none;
                  margin-top: 10px;
                  font-size: 11px;
                  border-top: 1px solid #2b2d31;
                  padding-top: 10px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                }
                td {
                  padding: 4px 0;
                  vertical-align: top;
                  color: #dcddde;
                  font-size: 11px;
                }
                td:first-child {
                  width: 140px;
                  font-weight: bold;
                  color: #949ba4;
                }
                code {
                  background: #111214;
                  padding: 2px 4px;
                  border-radius: 3px;
                  font-family: monospace;
                  font-size: 10.5px;
                  color: #e3e5e8;
                }
                pre {
                  margin: 0;
                  background: #111214;
                  padding: 6px;
                  border-radius: 4px;
                  max-width: 300px;
                  overflow-x: auto;
                  font-family: monospace;
                  color: #f23f43;
                  font-size: 10px;
                }
                
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
                
                <div class="debug-panel">
                  <div class="debug-title" onclick="toggleDebug()">
                    <span>⚙️ Toon Technische Analyse (Diagnose)</span>
                    <span id="debug-arrow">▼</span>
                  </div>
                  <div class="debug-content" id="debug-content">
                    <table>
                      <tr>
                        <td>Gebruiker ID:</td>
                        <td><code>${userId}</code></td>
                      </tr>
                      <tr>
                        <td>Server (Guild) ID:</td>
                        <td><code>${guildId || "(Niet geconfigureerd)"}</code></td>
                      </tr>
                      <tr>
                        <td>Gewenste Rol ID:</td>
                        <td><code>${roleToCheck || "(Geen ingesteld, verifieert enkel lidmaatschap)"}</code></td>
                      </tr>
                      <tr>
                        <td>Discord API Status:</td>
                        <td>
                          <span style="color: ${memberResponse.ok ? '#23a55a' : '#f23f43'}; font-weight: bold;">
                            ${memberResponse.ok ? '✅ Link OK (200 OK)' : `❌ Fout (${memberResponse.status})`}
                          </span>
                        </td>
                      </tr>
                      ${!memberResponse.ok ? `
                      <tr>
                        <td>Fout Details:</td>
                        <td><pre>${errorBody || "Geen extra response body."}</pre></td>
                      </tr>
                      ` : `
                      <tr>
                        <td>Jouw Rollen op Server:</td>
                        <td>
                          <div style="max-height: 80px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                            ${memberRoles.length > 0 
                              ? memberRoles.map(r => `<code>${r}</code>`).join(' ') 
                              : '<i>Geen rollen op deze server</i>'}
                          </div>
                        </td>
                      </tr>
                      `}
                    </table>
                    
                    <div style="margin-top: 12px; font-size: 10.5px; border-top: 1px solid #2b2d31; padding-top: 10px; color: #949ba4; line-height: 1.4;">
                      <strong>Diagnose tips:</strong>
                      <ul style="margin: 4px 0 0 14px; padding: 0;">
                        <li><strong>Status 401 (Unauthorized):</strong> De ingestelde <code>DISCORD_BOT_TOKEN</code> is ongeldig. Vul de token opnieuw in.</li>
                        <li><strong>Status 403 (Forbidden):</strong> De Discord bot is niet uitgenodigd op de server óf mist rechten op deze specifieke guild.</li>
                        <li><strong>Status 404 (Not Found):</strong> De <code>DISCORD_GUILD_ID</code> klopt niet óf de bot is niet aanwezig op die server.</li>
                        <li><strong>Status 200 (OK):</strong> De bot koppeling werkt! Jouw Discord account is gevonden op de server, maar jouw <strong>Gewenste Rol ID</strong> (<code>${roleToCheck || "niet ingesteld"}</code>) komt niet voor in de lijst van rollen die je bezit. Controleer in je Discord server of de rol-id's exact matchen.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button onclick="window.close()">Sluit Venster</button>
              </div>
              
              <script>
                function toggleDebug() {
                  const content = document.getElementById('debug-content');
                  const arrow = document.getElementById('debug-arrow');
                  if (content.style.display === 'block') {
                    content.style.display = 'none';
                    arrow.innerText = '▼';
                  } else {
                    content.style.display = 'block';
                    arrow.innerText = '▲';
                  }
                }
                
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_FAILURE', 
                    error: 'Niet geautoriseerd: ontbrekende serverrol.',
                    user: {
                      id: "${userId}",
                      username: "${userData.username}",
                      globalName: "${userData.global_name || userData.username}",
                      avatar: "${userData.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${userData.avatar}.png` : null}",
                      role: "Geen",
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
        role: pane === "medewerkerpaneel" ? "Medewerker" : "Klant",
        guildMember: true,
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
