import React from 'react';
import { Plus, Sparkles, Link2, Network, Filter, BoxSelect, Hand } from 'lucide-react';

interface MobileBottomBarProps {
  onOpenAddModal: () => void;
  onOpenBatchAdd: () => void;
  onOpenConnectModal: () => void;
  onQuickLayout: () => void;
  onOpenFilterModal: () => void;
  activeFilterCount: number;
  interactionMode: 'pan' | 'select';
  onToggleInteractionMode: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onOpenAddModal,
  onOpenBatchAdd,
  onOpenConnectModal,
  onQuickLayout,
  onOpenFilterModal,
  activeFilterCount,
  interactionMode,
  onToggleInteractionMode,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#dbe1e8] border-t-2 border-[#828c9b] shadow-[0_-2px_10px_rgba(0,0,0,0.2)] pb-safe select-none">
      <div className="grid grid-cols-6 items-center h-14 px-1 gap-1 text-[10px] font-semibold text-[#1e293b]">
        {/* 1. Add Single Node */}
        <button
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center h-full active:bg-[#c2cdd8] rounded cursor-pointer"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-b from-[#2b619d] to-[#1c4779] text-white flex items-center justify-center border border-[#14355c] shadow-xs">
            <Plus size={16} className="stroke-[3]" />
          </div>
          <span className="mt-0.5 truncate text-[9px]">Düğüm</span>
        </button>

        {/* 2. Batch Multi Add */}
        <button
          onClick={onOpenBatchAdd}
          className="flex flex-col items-center justify-center h-full active:bg-[#c2cdd8] rounded cursor-pointer"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-b from-[#b45309] to-[#78350f] text-white flex items-center justify-center border border-[#6b3500] shadow-xs">
            <Sparkles size={15} />
          </div>
          <span className="mt-0.5 truncate text-[9px] text-[#78350f]">Çoklu</span>
        </button>

        {/* 3. Connect Nodes */}
        <button
          onClick={onOpenConnectModal}
          className="flex flex-col items-center justify-center h-full active:bg-[#c2cdd8] rounded cursor-pointer"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-b from-[#fdfdfd] to-[#d5d9e0] text-[#1e293b] flex items-center justify-center border border-[#7a8494] shadow-xs">
            <Link2 size={16} className="text-[#2563eb]" />
          </div>
          <span className="mt-0.5 truncate text-[9px]">Bağla</span>
        </button>

        {/* 4. Marquee / Pan Selection Toggle */}
        <button
          onClick={onToggleInteractionMode}
          className="flex flex-col items-center justify-center h-full active:bg-[#c2cdd8] rounded cursor-pointer"
        >
          <div
            className={`w-8 h-8 rounded flex items-center justify-center border shadow-xs transition-colors ${
              interactionMode === 'select'
                ? 'bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a] text-white border-[#1e3a8a]'
                : 'bg-gradient-to-b from-[#fdfdfd] to-[#d5d9e0] text-[#1e293b] border-[#7a8494]'
            }`}
          >
            {interactionMode === 'select' ? <BoxSelect size={16} /> : <Hand size={16} />}
          </div>
          <span className="mt-0.5 truncate text-[9px]">
            {interactionMode === 'select' ? 'Seçimde' : 'Kutu Seç'}
          </span>
        </button>

        {/* 5. Quick Auto Layout */}
        <button
          onClick={onQuickLayout}
          className="flex flex-col items-center justify-center h-full active:bg-[#c2cdd8] rounded cursor-pointer"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-b from-[#fdfdfd] to-[#d5d9e0] text-[#1e293b] flex items-center justify-center border border-[#7a8494] shadow-xs">
            <Network size={16} className="text-[#059669]" />
          </div>
          <span className="mt-0.5 truncate text-[9px]">Düzen</span>
        </button>

        {/* 6. Filter */}
        <button
          onClick={onOpenFilterModal}
          className="relative flex flex-col items-center justify-center h-full active:bg-[#c2cdd8] rounded cursor-pointer"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-b from-[#fdfdfd] to-[#d5d9e0] text-[#1e293b] flex items-center justify-center border border-[#7a8494] shadow-xs">
            <Filter size={15} className="text-[#475569]" />
          </div>
          <span className="mt-0.5 truncate text-[9px]">Filtre</span>
          {activeFilterCount > 0 && (
            <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-[#dc2626] text-white text-[8px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
