import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Message } from "discord.js";
import { Vehicle, SaleRecord } from "./src/types";

export interface BotContext {
  getVehicles: () => Vehicle[];
  getSales: () => SaleRecord[];
  getRegisteredCustomers: () => any[];
  getEditedCustomers: () => Record<string, any>;
  getDeletedCustomerIds: () => string[];
  getSpreadsheetUrl: () => string;
}

const EMBED_COLOR = 0x7f6f4d; // #7f6f4d in hex

export function startDiscordBot(context: BotContext) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn("[Discord Bot] DISCORD_BOT_TOKEN is niet geconfigureerd in .env. Bot start niet.");
    return null;
  }

  // Create Discord Client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  client.once("ready", () => {
    console.log(`[Discord Bot] Succesvol ingelogd als ${client.user?.tag}!`);
    
    // Set status
    client.user?.setActivity({
      name: "Perseus Showroom",
      type: 3, // Playing/Watching
    });
  });

  // Helper to check if a user is a Medewerker/Staff
  function isStaff(message: Message): boolean {
    // 1. Check if user is Administrator in the guild
    if (message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return true;
    }

    // 2. Check if they have any of the configured staff/owner/manager roles
    const staffRoleIds = [
      process.env.DISCORD_STAFF_ROLE_ID,
      process.env.DISCORD_COORDINATOR_ROLE_ID,
      process.env.DISCORD_MANAGER_ROLE_ID,
      process.env.DISCORD_OWNER_ROLE_ID,
    ].filter(Boolean) as string[];

    if (message.member && staffRoleIds.length > 0) {
      return message.member.roles.cache.some((role) => staffRoleIds.includes(role.id));
    }

    return false;
  }

  // Listen for messages
  client.on("messageCreate", async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    const content = message.content.trim();
    
    // Check for "!" or "/" prefix
    if (!content.startsWith("!") && !content.startsWith("/")) return;

    const prefix = content[0];
    const args = content.slice(1).split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (!command) return;

    try {
      // COMMAND: help
      if (command === "help") {
        const helpEmbed = new EmbedBuilder()
          .setTitle("🏎️ Perseus Dealership Bot Help")
          .setDescription("Hier is een overzicht van alle beschikbare commando's voor de Perseus Dealership Discord Bot:")
          .setColor(EMBED_COLOR)
          .addFields(
            { name: `${prefix}help`, value: "Toont dit helpmenu.", inline: true },
            { name: `${prefix}info`, value: "Toont algemene informatie over het dealership en de website.", inline: true },
            { name: `${prefix}catalogus`, value: "Toont de complete actieve voertuigcatalogus.", inline: true },
            { name: `${prefix}zoeken <naam>`, value: "Zoekt naar een specifiek voertuig in de catalogus.", inline: true },
            { name: "🔒 **Personeel Commando's**", value: "Alleen toegankelijk voor medewerkers en beheerders:" },
            { name: `${prefix}klanten`, value: "Toont een overzicht van geregistreerde klanten.", inline: true },
            { name: `${prefix}sales`, value: "Toont verkoopstatistieken en prestaties.", inline: true }
          )
          .setFooter({ text: "Perseus Dealership • Altijd de beste service" })
          .setTimestamp();

        await message.reply({ embeds: [helpEmbed] });
      }

      // COMMAND: info
      else if (command === "info") {
        const vehiclesCount = context.getVehicles().length;
        const customersCount = context.getRegisteredCustomers().length;
        const salesCount = context.getSales().length;
        const spreadsheetUrlSet = context.getSpreadsheetUrl() ? "Gekoppeld ✅" : "Niet Gekoppeld ❌";

        const infoEmbed = new EmbedBuilder()
          .setTitle("ℹ️ Perseus Dealership Informatie")
          .setDescription("Welkom bij Perseus Dealership! Wij leveren superieure voertuigen met een ongeëvenaarde ervaring.")
          .setColor(EMBED_COLOR)
          .addFields(
            { name: "📍 Website Status", value: "Live & Actief", inline: true },
            { name: "📊 Catalogus Grootte", value: `${vehiclesCount} voertuigen`, inline: true },
            { name: "👥 Geregistreerde Klanten", value: `${customersCount} klanten`, inline: true },
            { name: "💰 Totaal Verrekeningen", value: `${salesCount} verkopen`, inline: true },
            { name: "📋 Google Sheets Connectie", value: spreadsheetUrlSet, inline: true }
          )
          .setFooter({ text: "Perseus Dealership" })
          .setTimestamp();

        await message.reply({ embeds: [infoEmbed] });
      }

      // COMMAND: catalogus / voertuigen
      else if (command === "catalogus" || command === "voertuigen") {
        const list = context.getVehicles();
        if (list.length === 0) {
          await message.reply("Er zijn momenteel geen voertuigen beschikbaar in de catalogus.");
          return;
        }

        // Group by category
        const categorized: Record<string, Vehicle[]> = {};
        list.forEach((v) => {
          if (!categorized[v.category]) {
            categorized[v.category] = [];
          }
          categorized[v.category].push(v);
        });

        const catalogEmbed = new EmbedBuilder()
          .setTitle("🏎️ Active Showroom Catalogus")
          .setDescription("Hieronder vindt u de actieve voertuigen in onze showroom, gecategoriseerd op klasse:")
          .setColor(EMBED_COLOR)
          .setTimestamp();

        Object.entries(categorized).forEach(([category, items]) => {
          const textList = items
            .slice(0, 15) // Limit to avoid hitting discord character limits per field
            .map((v) => {
              const stockStatus = v.stock > 0 ? `Voorraad: **${v.stock}**` : "🔴 *Uitverkocht*";
              return `- **${v.brand} ${v.name}** (ID: \`${v.id}\`) — €${v.price.toLocaleString("nl-NL")} (${stockStatus})`;
            })
            .join("\n");
          
          catalogEmbed.addFields({
            name: `📁 ${category} (${items.length})`,
            value: textList || "Geen voertuigen in deze klasse.",
            inline: false,
          });
        });

        if (list.length > 50) {
          catalogEmbed.setFooter({ text: `En nog ${list.length - 50} andere voertuigen... Bezoek de website voor de volledige lijst!` });
        } else {
          catalogEmbed.setFooter({ text: "Bezoek onze website om uw droomauto te bestellen!" });
        }

        await message.reply({ embeds: [catalogEmbed] });
      }

      // COMMAND: zoeken
      else if (command === "zoeken" || command === "zoek") {
        const searchTerm = args.join(" ").toLowerCase();
        if (!searchTerm) {
          await message.reply(`Gebruik: \`${prefix}${command} <merk of modelnaam>\` om te zoeken.`);
          return;
        }

        const matches = context.getVehicles().filter(
          (v) =>
            v.brand.toLowerCase().includes(searchTerm) ||
            v.name.toLowerCase().includes(searchTerm) ||
            v.category.toLowerCase().includes(searchTerm) ||
            v.id.toLowerCase() === searchTerm
        );

        if (matches.length === 0) {
          await message.reply(`Geen voertuigen gevonden die overeenkomen met \`${args.join(" ")}\`.`);
          return;
        }

        // Show top 5 matches
        const searchEmbed = new EmbedBuilder()
          .setTitle(`🔍 Zoekresultaten voor "${args.join(" ")}"`)
          .setDescription(`We hebben ${matches.length} passende voertuig(en) gevonden:`)
          .setColor(EMBED_COLOR);

        matches.slice(0, 5).forEach((v) => {
          const stockStatus = v.stock > 0 ? `Voorraad: **${v.stock}**` : "🔴 *Uitverkocht*";
          const detailsText = 
            `- **Snelheid**: ${v.topSpeedStock} km/h (Tuned: ${v.topSpeedTuned} km/h)\n` +
            `- **Inzittenden**: ${v.inzittenden} plekken\n` +
            `- **Inkoopprijs**: €${v.purchasePrice.toLocaleString("nl-NL")} | **Verkoopprijs**: €${v.price.toLocaleString("nl-NL")}\n` +
            `- **Categorie**: ${v.category}\n` +
            `- **Status**: ${stockStatus}`;

          searchEmbed.addFields({
            name: `🚘 ${v.brand} ${v.name} (ID: ${v.id})`,
            value: detailsText,
          });
        });

        if (matches.length > 5) {
          searchEmbed.setFooter({ text: `Er zijn nog ${matches.length - 5} andere resultaten beschikbaar op de website.` });
        }

        await message.reply({ embeds: [searchEmbed] });
      }

      // STAFF-ONLY COMMANDS

      // COMMAND: klanten
      else if (command === "klanten" || command === "customers") {
        if (!isStaff(message)) {
          await message.reply("❌ **Fout**: Je hebt geen medewerkersrechten om geregistreerde klanten in te zien.");
          return;
        }

        const registered = context.getRegisteredCustomers();
        const deletedIds = context.getDeletedCustomerIds();
        const edited = context.getEditedCustomers();

        const activeCustomers = registered.filter((c) => !deletedIds.includes(c.id));

        if (activeCustomers.length === 0) {
          await message.reply("Er zijn nog geen actieve klanten geregistreerd in het systeem.");
          return;
        }

        const listText = activeCustomers
          .slice(0, 15)
          .map((c, index) => {
            const extData = edited[c.id];
            const icName = extData?.fullName ? ` - IC: *${extData.fullName}*` : "";
            return `${index + 1}. **${c.globalName || c.username}** (@${c.username})${icName} (ID: \`${c.id}\`)`;
          })
          .join("\n");

        const customersEmbed = new EmbedBuilder()
          .setTitle("👥 Perseus Geregistreerde Klantendatabase")
          .setDescription(`Totaal geregistreerde actieve klanten: **${activeCustomers.length}**`)
          .setColor(EMBED_COLOR)
          .addFields({
            name: "Recent Geregistreerde Klanten (Max 15)",
            value: listText || "Geen klanten gevonden.",
          })
          .setTimestamp();

        if (activeCustomers.length > 15) {
          customersEmbed.setFooter({ text: `En nog ${activeCustomers.length - 15} andere klanten...` });
        }

        await message.reply({ embeds: [customersEmbed] });
      }

      // COMMAND: sales
      else if (command === "sales" || command === "sales" || command === "verkoop") {
        if (!isStaff(message)) {
          await message.reply("❌ **Fout**: Je hebt geen medewerkersrechten om verkoopstatistieken in te zien.");
          return;
        }

        const allSales = context.getSales();
        if (allSales.length === 0) {
          await message.reply("Er zijn nog geen verkopen geregistreerd in het systeem.");
          return;
        }

        // Calculations
        const totalRevenue = allSales
          .filter((s) => s.status === "Betaald" || s.status === "Opgehaald")
          .reduce((sum, s) => sum + Number(s.pricePaid || 0), 0);

        const statusCounts = allSales.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Seller leaderboard
        const sellerCounts = allSales.reduce((acc, s) => {
          acc[s.salesperson] = (acc[s.salesperson] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topSeller = Object.entries(sellerCounts).sort((a, b) => b[1] - a[1])[0];

        const salesEmbed = new EmbedBuilder()
          .setTitle("📊 Perseus Verkooppaneel & Statistieken")
          .setDescription("Hieronder vindt u een up-to-date samenvatting van alle verkooptransacties:")
          .setColor(EMBED_COLOR)
          .addFields(
            { name: "💰 Gerealiseerde Omzet", value: `€${totalRevenue.toLocaleString("nl-NL")}`, inline: true },
            { name: "📈 Totaal Registraties", value: `${allSales.length} transacties`, inline: true },
            { 
              name: "📋 Verkoop Status Overzicht", 
              value: [
                `- Opgehaald: **${statusCounts["Opgehaald"] || 0}**`,
                `- Betaald: **${statusCounts["Betaald"] || 0}**`,
                `- Besteld: **${statusCounts["Besteld"] || 0}**`,
                `- Gereserveerd: **${statusCounts["Gereserveerd"] || 0}**`
              ].join("\n"),
              inline: false 
            },
            {
              name: "🏆 Top Verkoper",
              value: topSeller 
                ? `**${topSeller[0]}** met **${topSeller[1]}** succesvolle verkoopregistratie(s).` 
                : "Geen data",
              inline: false
            }
          )
          .setTimestamp();

        await message.reply({ embeds: [salesEmbed] });
      }

    } catch (err: any) {
      console.error("[Discord Bot] Fout bij verwerken commando:", err);
      try {
        await message.reply(`Er is een fout opgetreden bij het uitvoeren van dit commando: ${err.message}`);
      } catch (e) {
        console.error("[Discord Bot] Kon foutbericht niet versturen:", e);
      }
    }
  });

  // Log in
  client.login(token).catch((err) => {
    console.error("[Discord Bot] Inloggen mislukt! Controleer of DISCORD_BOT_TOKEN correct is.", err);
  });

  return client;
}
