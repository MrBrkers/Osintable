import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, CornerDownLeft, X, Link2 } from 'lucide-react';
import { NodeEntity } from '../types/osint';
import { Language, translations } from '../utils/i18n';

interface QuickConnectPopupProps {
  sourceNode: NodeEntity;
  targetNode: NodeEntity;
  position: { x: number; y: number };
  language: Language;
  onConfirm: (relation: string) => void;
  onCancel: () => void;
}

export const QuickConnectPopup: React.FC<QuickConnectPopupProps> = ({
  sourceNode,
  targetNode,
  position,
  language,
  onConfirm,
  onCancel,
}) => {
  const [relationText, setRelationText] = useState('Bağlantılı');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const t = translations[language];

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm(relationText.trim() || 'Bağlantılı');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const commonRelations = [
    'Fiziksel Adres',
    'Sahibi',
    'Yönetici',
    'DNS Kaydı',
    'İletişim',
    'Çalışanı',
    'Aynı Ağda',
    'Para Transferi',
  ];

  return (
    <div
      className="fixed z-50 animate-in fade-in zoom-in-95 duration-100"
      style={{
        left: Math.max(16, Math.min(window.innerWidth - 320, position.x - 150)),
        top: Math.max(16, Math.min(window.innerHeight - 200, position.y - 70)),
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="w-[300px] bg-[#f8fafc] border-2 border-[#2563eb] shadow-[0_12px_32px_rgba(0,0,0,0.35)] rounded-lg overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-[#1e40af] text-white px-2.5 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1 font-bold text-[11px] truncate">
            <Link2 size={13} />
            <span className="truncate max-w-[100px]">{sourceNode.label}</span>
            <ArrowRight size={11} className="shrink-0" />
            <span className="truncate max-w-[100px]">{targetNode.label}</span>
          </div>
          <button
            onClick={onCancel}
            className="p-0.5 hover:bg-blue-800 rounded text-blue-200 hover:text-white cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          <label className="block text-[11px] font-bold text-[#334155]">
            {t.quickConnectPrompt}
          </label>

          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={relationText}
              onChange={e => setRelationText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.quickConnectPlaceholder}
              className="w-full px-2.5 py-1.5 bg-white border border-[#94a3b8] rounded text-xs font-semibold text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] shadow-inner"
            />
            <button
              type="button"
              onClick={() => onConfirm(relationText.trim() || 'Bağlantılı')}
              className="absolute right-1 top-1 bottom-1 px-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded font-bold flex items-center gap-1 cursor-pointer"
              title="Enter ile kaydet"
            >
              <CornerDownLeft size={12} />
            </button>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1 pt-1">
            {commonRelations.slice(0, 6).map(rel => (
              <button
                key={rel}
                type="button"
                onClick={() => setRelationText(rel)}
                className="px-1.5 py-0.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#334155] rounded text-[10px] font-medium cursor-pointer transition-colors"
              >
                {rel}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-[#64748b] pt-0.5">
            {t.quickConnectHelp}
          </p>
        </div>
      </div>
    </div>
  );
};
