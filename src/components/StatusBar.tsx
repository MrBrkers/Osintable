import React from 'react';
import { ViewTransform, NodeEntity } from '../types/osint';

interface StatusBarProps {
  transform: ViewTransform;
  nodeCount: number;
  edgeCount: number;
  projectName: string;
  selectedNode: NodeEntity | null;
  onFitView: () => void;
  onResetZoom: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  transform,
  nodeCount,
  edgeCount,
  projectName,
  selectedNode,
  onFitView,
  onResetZoom,
}) => {
  const zoomPct = Math.round(transform.scale * 100);

  return (
    <footer className="h-6 sm:h-6.5 bg-[#e4e8ee] border-t border-[#8e98a7] text-[10px] sm:text-[11px] font-sans text-[#1e293b] flex items-center justify-between px-2 select-none shrink-0 shadow-inner overflow-hidden mb-14 sm:mb-0">
      {/* Left Sunken Segment: Project Name and Counts */}
      <div className="flex items-center gap-2 overflow-hidden truncate">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#f5f7fa] border border-[#a2abb7] rounded-xs text-[#0f172a] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <span className="font-bold truncate max-w-[120px] sm:max-w-xs">{projectName}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[#475569] font-medium">
          <span>{nodeCount} Varlık</span>
          <span>|</span>
          <span>{edgeCount} İlişki</span>
        </div>
      </div>

      {/* Middle Sunken Segment: Selected Item */}
      <div className="hidden md:flex items-center gap-1 text-[#334155] truncate max-w-sm">
        {selectedNode ? (
          <span className="font-semibold text-[#1d4ed8] truncate">
            Seçili Varlık: [{selectedNode.label}]
          </span>
        ) : (
          <span className="text-[#64748b]">Düğüm seçilmedi (Dokunun veya uzun basın)</span>
        )}
      </div>

      {/* Right Sunken Segment: Coordinates & Zoom */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="hidden sm:inline text-[#64748b]">
          X: {Math.round(-transform.x / transform.scale)} Y: {Math.round(-transform.y / transform.scale)}
        </span>

        <button
          onClick={onResetZoom}
          className="px-1.5 py-0.2 bg-[#f5f7fa] hover:bg-[#ffffff] border border-[#94a3b8] rounded-xs font-semibold text-[#1e293b] cursor-pointer"
          title="Zoom %100 Yap"
        >
          {zoomPct}%
        </button>

        <button
          onClick={onFitView}
          className="px-1.5 py-0.2 bg-[#f5f7fa] hover:bg-[#ffffff] border border-[#94a3b8] rounded-xs text-[#334155] hover:text-[#0f172a] cursor-pointer"
          title="Ekrana Sığdır"
        >
          Sığdır
        </button>
      </div>
    </footer>
  );
};
