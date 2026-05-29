/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isDarkMode: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  isDarkMode,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" || e.key === "Backspace") {
      setIsOpen(false);
    }
  };

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded text-left flex justify-between items-center transition-all ${
          isDarkMode
            ? "bg-[#1e1f22] border-white/5 text-[#dcddde] focus:border-[#A87E43]"
            : "bg-white border-[#e3e5e8] text-black focus:border-[#A87E43]"
        } text-xs`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1 w-full rounded-md shadow-lg border max-h-60 overflow-hidden flex flex-col ${
            isDarkMode
              ? "bg-[#2b2d31] border-neutral-800 text-white animate-in fade-in slide-in-from-top-1 duration-100"
              : "bg-white border-neutral-200 text-black animate-in fade-in slide-in-from-top-1 duration-100"
          }`}
        >
          {/* Search bar inside dropdown */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border-b shrink-0 ${
              isDarkMode ? "border-neutral-800 bg-[#1e1f22]" : "border-neutral-100 bg-neutral-50"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zoeken..."
              className={`w-full bg-transparent text-xs outline-hidden ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-48 divide-y divide-[#ffffff03]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center justify-between ${
                    opt.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                  } ${
                    opt.value === value
                      ? isDarkMode
                        ? "bg-[#A87E43]/20 text-[#A87E43] font-bold"
                        : "bg-[#A87E43]/10 text-[#A87E43] font-bold"
                      : isDarkMode
                      ? "hover:bg-white/5 text-[#dcddde]"
                      : "hover:bg-neutral-50 text-neutral-800"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500 text-xs italic">Geen opties gevonden</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
