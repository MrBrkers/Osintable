import React, { useState, useEffect } from 'react';
import { NodeType, NodeEntity } from '../types/osint';
import {
  NODE_TYPE_CONFIGS,
  PRESET_RELATIONS,
  INVESTIGATOR_PALETTE,
  PRESET_AVATARS,
} from '../utils/constants';
import { X, Sparkles, Check, Image as ImageIcon, Upload } from 'lucide-react';

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentNode: NodeEntity | null;
  initialMultiMode?: boolean;
  onAddSingle: (
    type: NodeType,
    label: string,
    relation: string,
    color?: string,
    tags?: string[],
    notes?: string,
    imageUrl?: string
  ) => void;
  onAddBatch: (
    type: NodeType,
    labels: string[],
    relation: string,
    color?: string,
    tags?: string[]
  ) => void;
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({
  isOpen,
  onClose,
  parentNode,
  initialMultiMode = false,
  onAddSingle,
  onAddBatch,
}) => {
  const [selectedType, setSelectedType] = useState<NodeType>('person');
  const [isMultiMode, setIsMultiMode] = useState(initialMultiMode);
  const [singleName, setSingleName] = useState('');
  const [multiNamesText, setMultiNamesText] = useState('');
  const [relation, setRelation] = useState(PRESET_RELATIONS[0]);
  const [customRelation, setCustomRelation] = useState('');
  const [customColor, setCustomColor] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsMultiMode(initialMultiMode);
      setSingleName('');
      setMultiNamesText('');
      setTagsInput('');
      setNotes('');
      setImageUrl('');
      setCustomColor(NODE_TYPE_CONFIGS[selectedType]?.defaultColor || '#1d5fa6');
      if (parentNode) {
        if (parentNode.type === 'company' && selectedType === 'person') {
          setRelation('Çalışıyor');
        } else if (parentNode.type === 'ngo' && selectedType === 'person') {
          setRelation('Üyesi');
        } else if (selectedType === 'website') {
          setRelation('Link veriyor');
        } else {
          setRelation('İlişkili');
        }
      }
    }
  }, [isOpen, initialMultiMode, parentNode, selectedType]);

  if (!isOpen) return null;

  const currentTypeConfig = NODE_TYPE_CONFIGS[selectedType];
  const activeRelation = relation === 'Diğer' && customRelation.trim() ? customRelation.trim() : relation;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    if (isMultiMode) {
      const rawTokens = multiNamesText.split(/[\n,]+/);
      const names = rawTokens.map(n => n.trim()).filter(n => n.length > 0);
      if (names.length === 0) return;
      onAddBatch(selectedType, names, activeRelation, customColor, tags);
    } else {
      if (!singleName.trim()) return;
      onAddSingle(
        selectedType,
        singleName.trim(),
        activeRelation,
        customColor,
        tags,
        notes.trim(),
        imageUrl.trim() || undefined
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="w-full max-w-lg bg-[#eceff4] border-2 border-[#7a8494] shadow-[0_12px_36px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[94vh] text-xs">
        {/* Classic Windows Title Bar */}
        <div className="h-8 bg-gradient-to-r from-[#20406b] to-[#2c5b96] text-white px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-[12px] truncate">
            <span>
              {parentNode ? `Bağlı Varlık Ekle: [${parentNode.label}]` : 'Yeni Varlık Ekle'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#c2410c] text-white rounded cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-3.5 overflow-y-auto space-y-3 text-[#1e293b]">
          {/* Mode Switcher Buttons */}
          <div className="flex bg-[#dce1e8] p-1 rounded border border-[#b2b8c2]">
            <button
              type="button"
              onClick={() => setIsMultiMode(false)}
              className={`flex-1 py-1.5 px-3 rounded font-bold cursor-pointer text-center text-xs transition-colors ${
                !isMultiMode
                  ? 'win-btn-primary shadow-xs'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              Tek Varlık Ekle
            </button>
            <button
              type="button"
              onClick={() => setIsMultiMode(true)}
              className={`flex-1 py-1.5 px-3 rounded font-bold cursor-pointer text-center text-xs flex items-center justify-center gap-1.5 transition-colors ${
                isMultiMode
                  ? 'win-btn-amber shadow-xs'
                  : 'text-[#b45309] hover:text-[#78350f]'
              }`}
            >
              <Sparkles size={13} />
              <span>Birden Fazla Ekle (Çoklu Ağ)</span>
            </button>
          </div>

          {/* Entity Type Grid */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] shadow-xs">
            <label className="block text-[#334155] font-bold mb-1.5 text-[11px]">
              Varlık Türü Seçin:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {(Object.keys(NODE_TYPE_CONFIGS) as NodeType[]).map(typeKey => {
                const cfg = NODE_TYPE_CONFIGS[typeKey];
                const isCurrent = selectedType === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => {
                      setSelectedType(typeKey);
                      setCustomColor(cfg.defaultColor);
                    }}
                    className={`p-1.5 rounded border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-[#dbeafe] border-[#2563eb] text-[#1e3a8a] shadow-xs font-bold'
                        : 'bg-[#f8fafc] border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className="w-2.5 h-2.5 rounded-xs"
                        style={{ backgroundColor: cfg.defaultColor }}
                      />
                      <span className="text-[9px] text-[#64748b] font-mono">{cfg.badgeCode}</span>
                    </div>
                    <span className="truncate text-[11px]">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name or Batch Input */}
          {isMultiMode ? (
            <div className="bg-[#fffbeb] p-3 rounded border border-[#fde047] space-y-1 shadow-xs">
              <label className="text-[#854d0e] font-bold text-[11px] flex items-center gap-1">
                <Sparkles size={13} />
                <span>İsimleri Girin (Virgül veya Yeni Satır ile ayırın):</span>
              </label>
              <textarea
                value={multiNamesText}
                onChange={e => setMultiNamesText(e.target.value)}
                rows={3}
                placeholder="Örnek: Ahmet Yılmaz, Mehmet Kaya, Ayşe Demir, Ali Can"
                className="w-full bg-[#ffffff] border border-[#ca8a04] rounded p-2 text-[#0f172a] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#ca8a04]"
                autoFocus
              />
              <p className="text-[10px] text-[#713f12]">
                * Belirtilen her isim ayrı bir {currentTypeConfig.label} düğümü olarak üretilip ana düğüme bağlanır.
              </p>
            </div>
          ) : (
            <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] shadow-xs">
              <label className="block text-[#334155] font-bold mb-1 text-[11px]">
                Varlık Adı / Başlık:
              </label>
              <input
                type="text"
                value={singleName}
                onChange={e => setSingleName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz veya Şirket A"
                className="w-full bg-[#ffffff] border border-[#94a3b8] rounded p-2 text-[#0f172a] font-semibold text-sm focus:outline-none focus:border-[#2563eb]"
                autoFocus
              />
            </div>
          )}

          {/* Relationship Settings if connected to a parent */}
          {parentNode && (
            <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] space-y-1.5 shadow-xs">
              <label className="block text-[#334155] font-bold text-[11px]">
                İlişki Türü (Bağlantı Açıklaması):
              </label>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                {PRESET_RELATIONS.map(rel => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setRelation(rel)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                      relation === rel
                        ? 'bg-[#2563eb] text-white border-[#1d4ed8] font-bold'
                        : 'bg-[#f1f5f9] text-[#334155] border-[#cbd5e1] hover:bg-[#e2e8f0]'
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>

              {relation === 'Diğer' && (
                <input
                  type="text"
                  value={customRelation}
                  onChange={e => setCustomRelation(e.target.value)}
                  placeholder="Özel ilişki adı yazın"
                  className="w-full bg-[#ffffff] border border-[#94a3b8] rounded p-1.5 text-xs text-[#0f172a]"
                />
              )}

              <div className="text-[11px] text-[#1d4ed8] font-medium bg-[#f0f9ff] p-1.5 rounded border border-[#bae6fd]">
                Önizleme: <strong>[{parentNode.label}]</strong> —[{activeRelation}]→{' '}
                <strong>[{isMultiMode ? 'Yeni Düğümler...' : singleName || 'Yeni Düğüm'}]</strong>
              </div>
            </div>
          )}

          {/* Color Selector */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#334155] font-bold text-[11px]">Renk Paleti (24 Renk):</label>
              <span className="w-3.5 h-3.5 rounded-xs" style={{ backgroundColor: customColor }} />
            </div>
            <div className="grid grid-cols-12 gap-1 p-1 bg-[#f8fafc] rounded border border-[#e2e8f0]">
              {INVESTIGATOR_PALETTE.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setCustomColor(c.hex)}
                  className={`w-5 h-5 rounded-xs cursor-pointer flex items-center justify-center ${
                    customColor === c.hex ? 'ring-2 ring-black scale-110 shadow-xs' : 'opacity-85'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {customColor === c.hex && <Check size={10} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] shadow-xs">
            <label className="block text-[#334155] font-bold mb-1 text-[11px]">
              Etiketler (Virgülle ayırın):
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="Örn: yönetici, şirket, finans"
              className="w-full bg-[#ffffff] border border-[#94a3b8] rounded p-1.5 text-xs text-[#0f172a]"
            />
          </div>

          {/* Photo / Avatar for Single Node */}
          {!isMultiMode && (
            <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[#334155] font-bold text-[11px] flex items-center gap-1">
                  <ImageIcon size={13} className="text-[#2563eb]" />
                  <span>Varlık Fotoğrafı / Avatarı:</span>
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-[10px] text-[#dc2626] hover:underline cursor-pointer font-semibold"
                  >
                    Fotoğrafı Kaldır
                  </button>
                )}
              </div>

              {/* Quick Preset Avatars */}
              <div>
                <span className="text-[10px] text-[#64748b] block mb-1 font-semibold">
                  Hızlı Hazır Portreler & Varlık Simgeleri:
                </span>
                <div className="grid grid-cols-6 gap-1.5 p-1.5 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                  {PRESET_AVATARS.map(av => (
                    <button
                      key={av.id}
                      type="button"
                      title={av.name}
                      onClick={() => setImageUrl(av.dataUrl)}
                      className={`group flex flex-col items-center p-1 rounded border transition-all cursor-pointer ${
                        imageUrl === av.dataUrl
                          ? 'border-[#2563eb] bg-[#dbeafe] ring-2 ring-[#2563eb]'
                          : 'border-[#cbd5e1] bg-white hover:border-[#94a3b8]'
                      }`}
                    >
                      <img
                        src={av.dataUrl}
                        alt={av.name}
                        className="w-7 h-7 rounded-xs object-cover"
                      />
                      <span className="text-[8px] text-[#475569] truncate w-full text-center mt-0.5 group-hover:text-[#1e293b]">
                        {av.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* File upload or custom URL */}
              <div className="flex items-center gap-2">
                <label className="win-btn py-1 px-2.5 rounded cursor-pointer font-semibold text-[11px] shrink-0 flex items-center gap-1">
                  <Upload size={12} className="text-[#2563eb]" />
                  <span>Cihazdan Fotoğraf Yükle</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const res = ev.target?.result as string;
                        if (res) setImageUrl(res);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="veya https://... görsel URL'si girin"
                  className="flex-1 bg-[#ffffff] border border-[#94a3b8] rounded p-1 text-xs text-[#0f172a]"
                />
              </div>

              {imageUrl && (
                <div className="flex items-center gap-2.5 p-1.5 bg-[#f0f9ff] rounded border border-[#bae6fd]">
                  <img
                    src={imageUrl}
                    alt="Seçili Fotoğraf"
                    className="w-10 h-10 rounded object-cover border border-[#3b82f6] shadow-2xs bg-white"
                  />
                  <div>
                    <span className="text-[11px] text-[#0369a1] font-bold block">
                      Fotoğraf Eklendi
                    </span>
                    <span className="text-[10px] text-[#64748b]">
                      Bu görsel haritada düğümün üzerinde görüntülenecektir.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes for Single Add */}
          {!isMultiMode && (
            <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] shadow-xs">
              <label className="block text-[#334155] font-bold mb-1 text-[11px]">
                Not / Kayıt (İsteğe bağlı):
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Araştırma notları..."
                className="w-full bg-[#ffffff] border border-[#94a3b8] rounded p-1.5 text-xs text-[#0f172a]"
              />
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="pt-2 border-t border-[#cbd5e1] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="win-btn px-4 py-1.5 rounded font-semibold text-xs cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="win-btn-primary px-5 py-1.5 rounded font-bold text-xs cursor-pointer shadow-xs"
            >
              {isMultiMode ? 'Düğümleri Oluştur' : 'Tamam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
