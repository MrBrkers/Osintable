import React, { useState } from 'react';
import { Copy, Trash2, Palette, Tag, X, Check } from 'lucide-react';
import { INVESTIGATOR_PALETTE } from '../utils/constants';

interface BatchActionToolbarProps {
  selectedCount: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onChangeColor: (color: string) => void;
  onAddTag: (tag: string) => void;
  onClearSelection: () => void;
}

export const BatchActionToolbar: React.FC<BatchActionToolbarProps> = ({
  selectedCount,
  onDuplicate,
  onDelete,
  onChangeColor,
  onAddTag,
  onClearSelection,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagText, setTagText] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (selectedCount === 0) return null;

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagText.trim()) {
      onAddTag(tagText.trim().replace(/^#/, ''));
      setTagText('');
      setShowTagInput(false);
    }
  };

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-[#eceff4] border-2 border-[#2b579a] shadow-[0_6px_20px_rgba(0,0,0,0.3)] rounded p-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#1e293b] animate-in fade-in slide-in-from-top-2 duration-150 max-w-[95vw]">
      {/* Count Badge */}
      <div className="px-2 py-1 bg-[#2b579a] text-white font-bold rounded-xs flex items-center gap-1 shrink-0 text-[11px]">
        <span>{selectedCount} Varlık Seçili</span>
      </div>

      {confirmingDelete ? (
        /* Inline Safe Delete Confirmation */
        <div className="flex items-center gap-1.5 bg-[#fee2e2] border border-[#f87171] px-2 py-0.5 rounded text-[11px]">
          <span className="font-bold text-[#991b1b]">
            {selectedCount} varlık ve ilişkileri silinsin mi?
          </span>
          <button
            type="button"
            onClick={() => {
              onDelete();
              setConfirmingDelete(false);
            }}
            className="px-2 py-0.5 bg-[#dc2626] text-white font-bold rounded cursor-pointer hover:bg-[#b91c1c]"
          >
            Evet, Sil
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="px-2 py-0.5 bg-white text-[#334155] border border-[#cbd5e1] font-semibold rounded cursor-pointer hover:bg-[#f1f5f9]"
          >
            Vazgeç
          </button>
        </div>
      ) : (
        <>
          {/* Duplicate Button */}
          <button
            type="button"
            onClick={onDuplicate}
            className="win-btn h-7 px-2 rounded font-semibold flex items-center gap-1 cursor-pointer text-[11px]"
            title="Seçili varlıkları ve aralarındaki ilişkileri kopyala"
          >
            <Copy size={13} className="text-[#2563eb]" />
            <span>Çoğalt (Duplicate)</span>
          </button>

          {/* Bulk Delete Button */}
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="win-btn h-7 px-2 rounded font-bold text-[#b91c1c] hover:bg-[#fee2e2] flex items-center gap-1 cursor-pointer text-[11px]"
            title="Seçili tüm varlıkları ve bağlantılarını sil"
          >
            <Trash2 size={13} />
            <span>Toplu Sil</span>
          </button>
        </>
      )}

      {/* Bulk Color */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowTagInput(false);
          }}
          className="win-btn h-7 px-2 rounded font-semibold flex items-center gap-1 cursor-pointer text-[11px]"
          title="Seçili tüm varlıkların rengini değiştir"
        >
          <Palette size={13} className="text-[#d97706]" />
          <span>Renk</span>
        </button>

        {showColorPicker && (
          <div className="absolute left-0 top-full mt-1 bg-[#ffffff] border border-[#7a8494] shadow-[0_4px_16px_rgba(0,0,0,0.25)] rounded p-2 z-50 w-52">
            <span className="font-bold text-[10px] text-[#475569] block mb-1">
              Toplu Renk Ata:
            </span>
            <div className="grid grid-cols-6 gap-1">
              {INVESTIGATOR_PALETTE.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => {
                    onChangeColor(c.hex);
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded-xs cursor-pointer hover:scale-110 border border-black/20"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Tag */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowTagInput(!showTagInput);
            setShowColorPicker(false);
          }}
          className="win-btn h-7 px-2 rounded font-semibold flex items-center gap-1 cursor-pointer text-[11px]"
          title="Seçili tüm varlıklara ortak etiket ekle"
        >
          <Tag size={13} className="text-[#059669]" />
          <span>Etiketle</span>
        </button>

        {showTagInput && (
          <form
            onSubmit={handleTagSubmit}
            className="absolute left-0 top-full mt-1 bg-[#ffffff] border border-[#7a8494] shadow-[0_4px_16px_rgba(0,0,0,0.25)] rounded p-2 z-50 w-48 space-y-1.5"
          >
            <input
              type="text"
              value={tagText}
              onChange={e => setTagText(e.target.value)}
              placeholder="Yeni etiket (Örn: şüpheli)"
              className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded p-1 text-xs"
              autoFocus
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setShowTagInput(false)}
                className="win-btn px-2 py-0.5 text-[10px]"
              >
                İptal
              </button>
              <button
                type="submit"
                className="win-btn-primary px-2.5 py-0.5 text-[10px] font-bold"
              >
                Ekle
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Clear Selection */}
      <button
        type="button"
        onClick={onClearSelection}
        className="p-1 hover:bg-[#cbd5e1] rounded cursor-pointer text-[#64748b] hover:text-[#0f172a] ml-1"
        title="Seçimi Kaldır (Esc)"
      >
        <X size={15} />
      </button>
    </div>
  );
};
