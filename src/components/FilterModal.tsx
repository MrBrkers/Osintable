import React from 'react';
import { FilterState, NodeType } from '../types/osint';
import { NODE_TYPE_CONFIGS } from '../utils/constants';
import { X, Filter, CheckSquare, Square, RotateCcw } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  allTags: string[];
  allRelationTypes: string[];
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filter,
  onFilterChange,
  allTags,
  allRelationTypes,
}) => {
  if (!isOpen) return null;

  const toggleNodeType = (type: NodeType) => {
    onFilterChange({
      ...filter,
      types: {
        ...filter.types,
        [type]: !filter.types[type],
      },
    });
  };

  const selectAllNodeTypes = (val: boolean) => {
    const updated = { ...filter.types };
    (Object.keys(NODE_TYPE_CONFIGS) as NodeType[]).forEach(k => {
      updated[k] = val;
    });
    onFilterChange({
      ...filter,
      types: updated,
    });
  };

  const toggleTag = (tag: string) => {
    const exists = filter.tags.includes(tag);
    onFilterChange({
      ...filter,
      tags: exists ? filter.tags.filter(t => t !== tag) : [...filter.tags, tag],
    });
  };

  const toggleRelation = (rel: string) => {
    const exists = filter.relationTypes.includes(rel);
    onFilterChange({
      ...filter,
      relationTypes: exists
        ? filter.relationTypes.filter(r => r !== rel)
        : [...filter.relationTypes, rel],
    });
  };

  const resetFilters = () => {
    const allTrue: Record<NodeType, boolean> = {} as any;
    (Object.keys(NODE_TYPE_CONFIGS) as NodeType[]).forEach(k => {
      allTrue[k] = true;
    });
    onFilterChange({
      types: allTrue,
      tags: [],
      relationTypes: [],
      searchQuery: '',
      degreeFilter: 'all',
      dimNonMatches: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="w-full max-w-lg bg-[#eceff4] border-2 border-[#7a8494] shadow-[0_12px_36px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[94vh] text-xs">
        {/* Title Bar */}
        <div className="h-8 bg-gradient-to-r from-[#20406b] to-[#2c5b96] text-white px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-[12px]">
            <Filter size={14} />
            <span>Ağ Filtreleme ve Görünüm Seçenekleri</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#c2410c] text-white rounded cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="p-3.5 overflow-y-auto space-y-3 text-[#1e293b]">
          {/* Display Mode: Dim vs Hide */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] flex items-center justify-between shadow-xs">
            <span className="font-bold text-[#334155]">Filtre Dışı Kalan Varlıklar:</span>
            <div className="flex bg-[#e2e7ee] p-0.5 rounded border border-[#94a3b8]">
              <button
                type="button"
                onClick={() => onFilterChange({ ...filter, dimNonMatches: true })}
                className={`px-3 py-1 rounded cursor-pointer font-semibold ${
                  filter.dimNonMatches ? 'win-btn-primary shadow-xs' : 'text-[#475569]'
                }`}
              >
                Soluklaştır
              </button>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filter, dimNonMatches: false })}
                className={`px-3 py-1 rounded cursor-pointer font-semibold ${
                  !filter.dimNonMatches ? 'win-btn-primary shadow-xs' : 'text-[#475569]'
                }`}
              >
                Tamamen Gizle
              </button>
            </div>
          </div>

          {/* Connection Degree Focus */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] space-y-1.5 shadow-xs">
            <span className="font-bold text-[#334155] block">
              Seçili Varlığın Bağlantı Kapsamı:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['all', '1st', '2nd'] as const).map(deg => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => onFilterChange({ ...filter, degreeFilter: deg })}
                  className={`py-1 px-2 rounded border text-center font-semibold cursor-pointer ${
                    filter.degreeFilter === deg
                      ? 'win-btn-primary shadow-xs'
                      : 'win-btn text-[#475569]'
                  }`}
                >
                  {deg === 'all'
                    ? 'Tüm Ağ'
                    : deg === '1st'
                    ? '1. Derece (Doğrudan)'
                    : '2. Derece (Yakın Ağ)'}
                </button>
              ))}
            </div>
          </div>

          {/* Entity Types Filter */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[#334155]">Görüntülenecek Varlık Tipleri:</span>
              <div className="flex gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => selectAllNodeTypes(true)}
                  className="text-[#2563eb] hover:underline font-bold"
                >
                  Tümü
                </button>
                <span className="text-[#94a3b8]">|</span>
                <button
                  type="button"
                  onClick={() => selectAllNodeTypes(false)}
                  className="text-[#64748b] hover:underline font-bold"
                >
                  Temizle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-[#f8fafc] p-2 rounded border border-[#e2e8f0]">
              {(Object.keys(NODE_TYPE_CONFIGS) as NodeType[]).map(typeKey => {
                const cfg = NODE_TYPE_CONFIGS[typeKey];
                const checked = filter.types[typeKey] !== false;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => toggleNodeType(typeKey)}
                    className={`flex items-center gap-1.5 p-1 rounded text-left transition-colors cursor-pointer border ${
                      checked
                        ? 'bg-[#dbeafe] border-[#93c5fd] text-[#1e3a8a] font-semibold'
                        : 'bg-[#ffffff] border-[#e2e8f0] text-[#94a3b8] opacity-60'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare size={13} className="text-[#2563eb] shrink-0" />
                    ) : (
                      <Square size={13} className="text-[#94a3b8] shrink-0" />
                    )}
                    <span
                      className="w-2 h-2 rounded-xs shrink-0"
                      style={{ backgroundColor: cfg.defaultColor }}
                    />
                    <span className="truncate text-[11px]">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#334155]">Etiket Süzgeci:</span>
                {filter.tags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onFilterChange({ ...filter, tags: [] })}
                    className="text-[10px] text-[#b45309] hover:underline font-bold"
                  >
                    Temizle
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto bg-[#f8fafc] p-1.5 rounded border border-[#e2e8f0]">
                {allTags.map(t => {
                  const active = filter.tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer border ${
                        active
                          ? 'bg-[#2563eb] text-white border-[#1d4ed8]'
                          : 'bg-[#ffffff] text-[#475569] border-[#cbd5e1] hover:bg-[#e2e8f0]'
                      }`}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Relationship Filter */}
          {allRelationTypes.length > 0 && (
            <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#334155]">İlişki Türü Süzgeci:</span>
                {filter.relationTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onFilterChange({ ...filter, relationTypes: [] })}
                    className="text-[10px] text-[#b45309] hover:underline font-bold"
                  >
                    Temizle
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto bg-[#f8fafc] p-1.5 rounded border border-[#e2e8f0]">
                {allRelationTypes.map(rel => {
                  const active = filter.relationTypes.includes(rel);
                  return (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => toggleRelation(rel)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer border ${
                        active
                          ? 'bg-[#d97706] text-white border-[#b45309]'
                          : 'bg-[#ffffff] text-[#475569] border-[#cbd5e1] hover:bg-[#e2e8f0]'
                      }`}
                    >
                      {rel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Action buttons */}
          <div className="pt-2 border-t border-[#cbd5e1] flex items-center justify-between">
            <button
              type="button"
              onClick={resetFilters}
              className="win-btn px-3 py-1.5 rounded font-semibold text-[#b45309] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Sıfırla</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="win-btn-primary px-5 py-1.5 rounded font-bold cursor-pointer"
            >
              Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
