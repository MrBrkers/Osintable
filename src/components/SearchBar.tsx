import React, { useState, useRef, useEffect } from 'react';
import { NodeEntity } from '../types/osint';
import { NODE_TYPE_CONFIGS } from '../utils/constants';
import { Search, X, ChevronRight } from 'lucide-react';

interface SearchBarProps {
  nodes: NodeEntity[];
  onSelectNode: (nodeId: string) => void;
  onFocusNode: (nodeId: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ nodes, onSelectNode, onFocusNode }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = query.trim()
    ? nodes.filter(node => {
        const q = query.toLowerCase();
        const matchesLabel = node.label.toLowerCase().includes(q);
        const matchesDesc = (node.description || '').toLowerCase().includes(q);
        const matchesNotes = (node.notes || '').toLowerCase().includes(q);
        const matchesTags = node.tags.some(t => t.toLowerCase().includes(q));
        const matchesSources = node.sources?.some(
          s => s.url.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
        );
        return matchesLabel || matchesDesc || matchesNotes || matchesTags || matchesSources;
      })
    : [];

  const handleSelect = (nodeId: string) => {
    onSelectNode(nodeId);
    onFocusNode(nodeId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs sm:max-w-sm">
      <div className="relative flex items-center">
        <Search
          size={13}
          className="absolute left-2 text-[#64748b] pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Düğüm, kişi, kurum ara..."
          className="w-full bg-[#ffffff] border border-[#94a3b8] focus:border-[#2563eb] rounded pl-7 pr-6 py-1 text-[#0f172a] placeholder-[#94a3b8] text-xs focus:outline-none shadow-xs"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-1.5 text-[#94a3b8] hover:text-[#0f172a] cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-[#ffffff] border border-[#7a8494] shadow-[0_4px_16px_rgba(0,0,0,0.2)] rounded-xs z-50 max-h-72 overflow-y-auto text-xs">
          <div className="px-2.5 py-1 bg-[#eef2f6] border-b border-[#cbd5e1] flex justify-between items-center text-[10px] text-[#475569] font-semibold">
            <span>Arama: {results.length} Eşleşme</span>
            <span>Tıkla ve Odaklan</span>
          </div>

          {results.length > 0 ? (
            <div className="py-0.5">
              {results.map(node => {
                const cfg = NODE_TYPE_CONFIGS[node.type] || NODE_TYPE_CONFIGS.custom;
                return (
                  <button
                    key={node.id}
                    onClick={() => handleSelect(node.id)}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-[#3399ff] hover:text-white flex items-center justify-between gap-2 border-b border-[#f1f5f9] last:border-b-0 cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: node.color || cfg.defaultColor }}
                      />
                      <div className="truncate">
                        <span className="font-bold text-[#0f172a] group-hover:text-white block truncate">
                          {node.label}
                        </span>
                        <span className="text-[10px] text-[#64748b] group-hover:text-white/80">
                          [{cfg.badgeCode}] {cfg.label}
                          {node.tags.length > 0 && ` · #${node.tags.slice(0, 2).join(' #')}`}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={13} className="text-[#94a3b8] group-hover:text-white shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-[#64748b] italic text-[11px]">
              "{query}" ile eşleşen bir varlık bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
