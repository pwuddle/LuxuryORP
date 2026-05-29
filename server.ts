import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to determine the callback URI dynamically
  const getRedirectUri = (req: express.Request) => {
    // If APP_URL is configured (e.g. on Cloud Run), use it
    if (process.env.APP_URL) {
      const cleanUrl = process.env.APP_URL.replace(/\/$/, '');
      return `${cleanUrl}/auth/callback`;
    }
    // Otherwise fallback to request host
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    return `${protocol}://${host}/auth/callback`;
  };

  // 1. Get Discord Auth URL
  app.get('/api/auth/discord/url', (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      return res.status(200).json({ 
        error: 'DISCORD_CLIENT_ID_MISSING',
        message: 'De Discord Client ID is niet geconfigureerd in de omgevingsvariabelen (.env in AI Studio).' 
      });
    }

    const redirectUri = getRedirectUri(req);
    const scope = 'identify guilds guilds.members.read';
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope
    });

    const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // 2. OAuth2 Callback Endpoint
  app.get('/auth/callback', async (req, res) => {
    const code = req.query.code as string;
    if (!code) {
      return res.send(createResponseHtml({ 
        status: 'error', 
        error: 'Geen authorisatiecode ontvangen van Discord.' 
      }));
    }

    const clientId = process.env.DISCORD_CLIENT_ID!;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
    const redirectUri = getRedirectUri(req);
    const guildId = process.env.DISCORD_GUILD_ID || '109283748293749283';

    try {
      // Step A: Exchange code for Access Token
      const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri
        })
      });

      if (!tokenResponse.ok) {
        const errDetails = await tokenResponse.text();
        console.error('Discord Token Exchange Failed:', errDetails);
        throw new Error(`Discord token exchange returned status ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json() as { access_token: string };
      const accessToken = tokenData.access_token;

      // Step B: Get User Profile Info
      const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user profile: status ${userResponse.status}`);
      }

      const userData = await userResponse.json() as {
        id: string;
        username: string;
        global_name?: string;
        avatar?: string;
      };

      // Step C: Get Guild Member Object (fetch user roles in specific Server)
      const memberResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (memberResponse.status === 404) {
        // Not in the guild
        return res.send(createResponseHtml({
          status: 'error',
          error: 'NOT_IN_GUILD',
          user: userData,
          guildId: guildId
        }));
      }

      if (!memberResponse.ok) {
        throw new Error(`Failed to fetch guild member details: status ${memberResponse.status}`);
      }

      const memberData = await memberResponse.json() as {
        roles: string[];
        nick?: string;
      };

      // Success! Pass details back
      return res.send(createResponseHtml({
        status: 'success',
        user: {
          id: userData.id,
          username: userData.username,
          globalName: userData.global_name || userData.username,
          avatar: userData.avatar,
          nickname: memberData.nick || userData.global_name || userData.username
        },
        roles: memberData.roles
      }));

    } catch (error: any) {
      console.error('OAuth processing error:', error);
      return res.send(createResponseHtml({
        status: 'error',
        error: error.message || 'Onbekende interne fout.'
      }));
    }
  });

  // HTML response utility to send message using postMessage
  function createResponseHtml(data: any) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticeren...</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #1a1a1a;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
              padding: 20px;
            }
            .card {
              background-color: #2b2b2b;
              border-radius: 12px;
              padding: 30px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
              max-width: 400px;
              width: 100%;
            }
            h1 { font-size: 1.5rem; margin-bottom: 10px; color: #5865F2; }
            p { font-size: 0.9rem; color: #cccccc; line-height: 1.4; }
            .spinner {
              border: 4px solid rgba(255, 255, 255, 0.1);
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border-left-color: #5865F2;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h1>Sovereign Verificatie</h1>
            <p>Verbinding maken met de showroom catalogus. Dit venster sluit zo direct automatisch...</p>
          </div>
          <script>
            (function() {
              const payload = ${JSON.stringify(data)};
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_COMPLETED', payload: payload }, '*');
                setTimeout(() => {
                  window.close();
                }, 1000);
              } else {
                document.querySelector('h1').textContent = 'Fout';
                document.querySelector('p').textContent = 'Dit venster kon niet communiceren met de hoofdpagina. Sluit dit tabblad handmatig.';
                document.querySelector('.spinner').style.display = 'none';
              }
            })();
          </script>
        </body>
      </html>
    `;
  }

  // 3. Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
