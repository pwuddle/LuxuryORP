import React, { useState, useEffect } from 'react';
import { DISCORD_CONFIG } from '../discordConfig';
import { Copy, Check, Shield, Users, Circle, Loader2 } from 'lucide-react';

interface DiscordStaffMember {
  displayName: string;
  discordTag: string;
  userId: string;
  roles: string[];
  status: 'Online' | 'Idle' | 'DND' | 'Offline';
  isMobile?: boolean;
}

export default function StaffDirectory({ isDarkMode = true }: { isDarkMode?: boolean }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [members, setMembers] = useState<DiscordStaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch('/api/discord/members')
      .then(res => res.json())
      .then(data => {
        if (active && data && Array.isArray(data.members)) {
          setMembers(data.members);
        }
      })
      .catch(err => {
        console.error('Fout bij het ophalen van Discord leden:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: DiscordStaffMember['status']) => {
    switch (status) {
      case 'Online': return 'text-emerald-500 fill-emerald-500';
      case 'Idle': return 'text-amber-500 fill-amber-500';
      case 'DND': return 'text-rose-500 fill-rose-500';
      case 'Offline': return 'text-neutral-500 fill-neutral-500';
      default: return 'text-neutral-500';
    }
  };

  const resolveRoleName = (roleIdOrName: string) => {
    if (roleIdOrName === '1509514357950910595') return 'Medewerker';
    return roleIdOrName;
  };

  return (
    <div className={`border rounded-xl p-5 shadow-sm text-left transition-colors duration-300 ${
      isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
    }`}>
      <div className={`flex items-center justify-between border-b pb-4 mb-5 transition-colors duration-300 ${
        isDarkMode ? 'border-neutral-800' : 'border-neutral-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${
              isDarkMode ? 'text-slate-100' : 'text-neutral-900'
            }`}>Perseus Dealership Discord</h4>
            <p className={`text-[10px] font-mono mt-0.5 transition-colors duration-300 ${
              isDarkMode ? 'text-neutral-500' : 'text-neutral-600'
            }`}>
              Gekoppeld aan Server ID: {DISCORD_CONFIG.guildId} ({DISCORD_CONFIG.guildName})
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Discord Live Synchronisatie
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-neutral-500 gap-3 font-mono text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span>Discord Guild Medewerkers inladen...</span>
        </div>
      ) : (
        /* Roster Table Layout */
        <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[9px] font-mono uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-500'
              }`}>
                <th className="py-2.5 px-3">Weergavenaam</th>
                <th className="py-2.5 px-3">Discord Tag</th>
                <th className="py-2.5 px-3">Discord User ID</th>
                <th className="py-2.5 px-3">Server Rollen</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs transition-colors duration-300 ${
              isDarkMode ? 'divide-neutral-850/40' : 'divide-neutral-100'
            }`}>
              {members.map((m) => (
                <tr key={m.userId} className={`transition-colors duration-300 ${
                  isDarkMode ? 'hover:bg-neutral-950/20' : 'hover:bg-neutral-50/65'
                }`}>
                  {/* Name */}
                  <td className={`py-3 px-3 font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-slate-200' : 'text-neutral-800'
                  }`}>
                    {m.displayName}
                  </td>

                  {/* Tag */}
                  <td className="py-3 px-3">
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded border text-[11px] transition-colors duration-300 ${
                      isDarkMode 
                        ? 'text-indigo-400 bg-indigo-950/20 border-indigo-900/30' 
                        : 'text-indigo-600 bg-indigo-50 border-indigo-200/55'
                    }`}>
                      @{m.discordTag}
                    </span>
                  </td>

                  {/* Discord User ID */}
                  <td className="py-3 px-3">
                    <div className={`flex items-center gap-1.5 font-mono text-[11px] transition-colors duration-300 ${
                      isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
                    }`}>
                      <span>{m.userId}</span>
                      <button
                        onClick={() => handleCopyId(m.userId)}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isDarkMode 
                            ? 'hover:bg-neutral-850 text-neutral-500 hover:text-slate-100' 
                            : 'hover:bg-neutral-100 text-neutral-450 hover:text-neutral-900'
                        }`}
                        title="Kopieer Discord User ID"
                      >
                        {copiedId === m.userId ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Rollen */}
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {m.roles.map((r, i) => {
                        const resolved = resolveRoleName(r);
                        const isDirectie = resolved.includes('Directie') || resolved.includes('Directeur');
                        return (
                          <span
                            key={i}
                            className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border transition-colors duration-300 ${
                              isDirectie
                                ? isDarkMode
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                                : isDarkMode
                                  ? 'bg-[#5865F2]/10 text-indigo-400 border-indigo-900/30'
                                  : 'bg-[#5865F2]/10 text-indigo-700 border-indigo-200/55'
                            }`}
                          >
                            <Shield className="w-2.5 h-2.5" />
                            {resolved}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider uppercase">
                      <Circle className={`w-2 h-2 ${getStatusColor(m.status)}`} />
                      <span className={m.status === 'Offline' ? 'text-neutral-500' : isDarkMode ? 'text-slate-200' : 'text-neutral-700'}>
                        {m.status} {m.isMobile && '📱'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
