/**
 * Discord Role-Based Authentication Configuration
 * 
 * Configure your Discord Guild ID and required Role IDs below.
 * In production, the system verifies if the Discord user possesses one of the required roles
 * inside the specified Discord Guild/Server.
 */
export const DISCORD_CONFIG = {
  // ID of the Discord Server/Guild
  guildId: '1509514294956523590',
  guildName: 'ORP Luxury Discord',

  // List of Discord Role IDs that are authorized to log in
  requiredRoles: [
    {
      roleId: '1509514357950910595',
      roleName: 'Medewerker',
      description: 'Deeltijd & Voltijd dealermedewerkers'
    }
  ]
};
