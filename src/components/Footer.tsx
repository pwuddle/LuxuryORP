/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExternalLink, CircleAlert, Landmark } from "lucide-react";

interface FooterProps {
  isDarkMode: boolean;
}

export default function Footer({ isDarkMode }: FooterProps) {
  const bgFooter = isDarkMode ? "bg-[#1e1f22] border-[#2b2d31]" : "bg-[#e3e5e8] border-[#f2f3f5]";
  const textMuted = isDarkMode ? "text-[#949ba4]" : "text-[#4f5660]";
  const textSecondary = isDarkMode ? "text-[#dcddde]" : "text-[#2e3338]";

  return (
    <footer className={`${bgFooter} border-t py-10 mt-auto transition-colors`} id="perseus-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" id="footer-content">
        
        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-xs">
          
          {/* Column 1: Brand & Disclaimer */}
          <div className="md:col-span-8 space-y-3">
            <h4 className="text-sm font-serif font-black tracking-widest text-[#A87E43] italic">
              PERSEUS DEALERSHIP
            </h4>
            <p className={`${textMuted} leading-relaxed`}>
              De nummer één import autodealer van Los Santos. Perseus selecteert uitsluitend de meest geavanceerde hypercars, sports en legendarische klassiekers voor de FiveM roleplay community.
            </p>
            <div className="flex items-start gap-1.5 p-3 rounded-md bg-black/10 border-l border-[#A87E43]/40 max-w-md select-none">
              <CircleAlert className="w-4.5 h-4.5 text-[#A87E43] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#8e9297] leading-relaxed">
                <strong>FiveM RP Disclaimer:</strong> Perseus is een fictief autoconcept gebouwd voor roleplay doeleinden. Transacties op deze website worden gerealiseerd met in-game dollars of fictief show-geld. Geen echt geld vereist.
              </p>
            </div>
          </div>

          {/* Column 2: Discord Invitation CTA */}
          <div className="md:col-span-4 space-y-4">
            <h5 className={`font-bold uppercase ${textSecondary} tracking-wider`}>Join Our Discord</h5>
            
            <p className={`${textMuted} leading-relaxed`}>
              Kom in contact met onze community, dien uw bestellingen in en krijg direct hulp van ons team op onze officiële Discord server.
            </p>

            <a
              href="https://discord.gg/perseus-oranjestad"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white hover:text-white font-bold rounded-md shadow-md transition-all cursor-pointer"
              id="footer-discord-link"
            >
              {/* Discord SVG */}
              <svg className="w-4 h-4 fill-current" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.9-.65,1.76-1.34,2.58-2a75.52,75.52,0,0,0,72.9,0c.82.71,1.68,1.4,2.58,2a68.47,68.47,0,0,1-10.5,5,77.76,77.76,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,50.77,123.63,28,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
              </svg>
              Discord Server
            </a>
          </div>

        </div>

        {/* Brand Copyright Bar */}
        <div className={`pt-6 border-t ${
          isDarkMode ? "border-[#2b2d31]" : "border-[#e3e5e8]"
        } flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] ${textMuted} select-none`}>
          <span>
            © {new Date().getFullYear()} Perseus Motors Group. Alle rechten voorbehouden.
          </span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#A87E43]">
            <Landmark className="w-3.5 h-3.5" /> Perseus Auto Dealership s.r.o
          </div>
        </div>

      </div>
    </footer>
  );
}
