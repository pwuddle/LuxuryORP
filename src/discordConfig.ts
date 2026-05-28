/**
 * Discord Role-Based Authentication Configuration
 * 
 * Configure your Discord Guild ID and required Role IDs below.
 * In production, the system verifies if the Discord user possesses one of the required roles
 * inside the specified Discord Guild/Server.
 */
export const DISCORD_CONFIG = {
  // ID of the Discord Server/Guild
  guildId: '109283748293749283',
  guildName: 'Sovereign FiveM Discord',

  // List of Discord Role IDs that are authorized to log in
  requiredRoles: [
    {
      roleId: '987654321012345678',
      roleName: 'Sovereign Staff',
      description: 'Deeltijd & Voltijd dealermedewerkers'
    },
    {
      roleId: '876543210987654321',
      roleName: 'Sovereign Directie',
      description: 'Management & Directieleden'
    }
  ],

  // Simulation mapping linking mock employee accounts to their Discord Role IDs.
  // Modify these role lists to simulate authorization failures or success conditions.
  mockMemberRoles: {
    'Luna Sterling': ['987654321012345678', '876543210987654321'],
    'Trevor Vance': ['987654321012345678'],
    'Marco Vercetti': ['987654321012345678', '876543210987654321'],
    'Enzo Ferrari': ['987654321012345678'],
    'Dealership Admin': ['876543210987654321'] // Directie role only
  } as Record<string, string[]>
};
