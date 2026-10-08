import React, { useState, useEffect } from 'react';
import { NodeEntity, EdgeEntity, NodeType } from '../types/osint';
import {
  NODE_TYPE_CONFIGS,
  INVESTIGATOR_PALETTE,
  PRESET_AVATARS,
} from '../utils/constants';
import {
  X,
  Plus,
  ExternalLink,
  Trash2,
  Tag,
  Link as LinkIcon,
  Maximize2,
  Calendar,
  Sparkles,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Upload,
  Globe,
} from 'lucide-react';
import { openGoogleSearch } from '../utils/browserSearch';

interface NodeDetailPanelProps {
  node: NodeEntity | null;
  allNodes: NodeEntity[];
  edges: EdgeEntity[];
  onClose: () => void;
  onUpdateNode: (updated: NodeEntity) => void;
  onDeleteNode: (id: string) => void;
  onOpenAddModal: (nodeId: string, multiMode: boolean) => void;
  onOpenConnectModal: (nodeId: string) => void;
  onFocusNode: (nodeId: string) => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  allNodes,
  edges,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onOpenAddModal,
  onOpenConnectModal,
  onFocusNode,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMinimizedMobile, setIsMinimizedMobile] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<NodeType>('person');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Source URL adding state
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [showAddSource, setShowAddSource] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (node) {
      setLabel(node.label);
      setType(node.type);
      setDescription(node.description || '');
      setNotes(node.notes || '');
      setTagsInput(node.tags.join(', '));
      setSelectedColor(node.color || NODE_TYPE_CONFIGS[node.type]?.defaultColor || '#1d5fa6');
      setImageUrl(node.imageUrl || '');
      setShowAddSource(false);
      setShowPhotoUpload(false);
      setNewSourceUrl('');
      setNewSourceTitle('');
      setIsEditing(false);
      setIsMinimizedMobile(false);
    }
  }, [node]);

  if (!node) return null;

  const currentTypeConfig = NODE_TYPE_CONFIGS[node.type] || NODE_TYPE_CONFIGS.custom;
  const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
  const nodeMap = new Map<string, NodeEntity>();
  allNodes.forEach(n => nodeMap.set(n.id, n));

  const handleSaveBasic = () => {
    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onUpdateNode({
      ...node,
      label: label.trim() || node.label,
      type,
      description: description.trim(),
      notes: notes.trim(),
      tags: parsedTags,
      color: selectedColor,
      imageUrl: imageUrl.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setImageUrl(dataUrl);
        onUpdateNode({
          ...node,
          imageUrl: dataUrl,
          updatedAt: new Date().toISOString(),
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setImageUrl('');
    onUpdateNode({
      ...node,
      imageUrl: undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceUrl.trim()) return;

    let formattedUrl = newSourceUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newSource = {
      id: 'src_' + Date.now(),
      url: formattedUrl,
      title: newSourceTitle.trim() || formattedUrl,
      addedAt: new Date().toISOString().split('T')[0],
    };

    onUpdateNode({
      ...node,
      sources: [...(node.sources || []), newSource],
      updatedAt: new Date().toISOString(),
    });

    setNewSourceUrl('');
    setNewSourceTitle('');
    setShowAddSource(false);
  };

  const handleRemoveSource = (srcId: string) => {
    onUpdateNode({
      ...node,
      sources: (node.sources || []).filter(s => s.id !== srcId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNode({
      ...node,
      tags: node.tags.filter(t => t !== tagToRemove),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className={`fixed sm:absolute bottom-14 sm:bottom-0 right-0 left-0 sm:left-auto sm:top-0 w-full sm:w-96 bg-[#eef1f5] border-t-2 sm:border-t-0 sm:border-l-2 border-[#828c9b] shadow-[0_-4px_20px_rgba(0,0,0,0.25)] sm:shadow-[-4px_0_16px_rgba(0,0,0,0.2)] z-30 flex flex-col text-xs transition-all duration-200 ${
        isMinimizedMobile ? 'max-h-24 overflow-hidden' : 'max-h-[75vh] sm:max-h-full overflow-hidden'
      }`}
    >
      {/* Title Bar */}
      <div className="h-8 bg-gradient-to-r from-[#20406b] to-[#2c5b96] text-white px-3 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          {node.imageUrl ? (
            <img
              src={node.imageUrl}
              alt=""
              className="w-5 h-5 rounded-xs object-cover border border-white shrink-0 bg-white"
            />
          ) : (
            <span
              className="w-3 h-3 rounded-xs shrink-0 border border-white/60"
              style={{ backgroundColor: node.color || currentTypeConfig.defaultColor }}
            />
          )}
          <h3 className="font-bold text-[12px] truncate">
            {node.label} <span className="font-normal opacity-85">({currentTypeConfig.label})</span>
          </h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onFocusNode(node.id)}
            title="Ekranda Odaklan"
            className="p-1 hover:bg-[#3d6ea8] rounded cursor-pointer text-white"
          >
            <Maximize2 size={13} />
          </button>

          <button
            onClick={() => setIsMinimizedMobile(!isMinimizedMobile)}
            className="sm:hidden p-1 hover:bg-[#3d6ea8] rounded cursor-pointer text-white"
          >
            {isMinimizedMobile ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          <button
            onClick={onClose}
            title="Kapat"
            className="p-1 hover:bg-[#c2410c] rounded cursor-pointer text-white"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="bg-[#e2e7ee] px-2.5 py-1.5 border-b border-[#b2b8c2] flex items-center gap-1.5 shrink-0 overflow-x-auto">
        <button
          onClick={() => onOpenAddModal(node.id, false)}
          className="win-btn-primary py-1 px-2 rounded font-semibold flex items-center gap-1 cursor-pointer text-[11px] whitespace-nowrap shadow-xs"
        >
          <Plus size={12} className="stroke-[3]" />
          <span>Bağla +</span>
        </button>

        <button
          onClick={() => onOpenAddModal(node.id, true)}
          className="win-btn-amber py-1 px-2 rounded font-semibold flex items-center gap-1 cursor-pointer text-[11px] whitespace-nowrap shadow-xs"
        >
          <Sparkles size={12} />
          <span>Çoklu Ekle...</span>
        </button>

        <button
          onClick={() => onOpenConnectModal(node.id)}
          className="win-btn py-1 px-2 rounded font-semibold flex items-center gap-1 cursor-pointer text-[11px] whitespace-nowrap text-[#1e293b]"
        >
          <LinkIcon size={12} className="text-[#2563eb]" />
          <span>İlişkilendir</span>
        </button>

        <button
          onClick={() => openGoogleSearch(node.label)}
          className="win-btn py-1 px-2 rounded font-semibold flex items-center gap-1 cursor-pointer text-[11px] whitespace-nowrap text-[#1d4ed8] hover:bg-[#dbeafe]"
          title="Google'da Ara (Yeni Sekmede Aç)"
        >
          <Globe size={12} className="text-[#2563eb]" />
          <span>Google'da Ara</span>
        </button>

        {confirmingDelete ? (
          <div className="flex items-center gap-1 ml-auto bg-[#fee2e2] px-1.5 py-0.5 rounded border border-[#fca5a5]">
            <span className="text-[10px] text-[#991b1b] font-bold">Silinsin mi?</span>
            <button
              type="button"
              onClick={() => {
                onDeleteNode(node.id);
                onClose();
              }}
              className="px-1.5 py-0.5 bg-[#dc2626] text-white text-[10px] font-bold rounded cursor-pointer hover:bg-[#b91c1c]"
            >
              Evet
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="px-1.5 py-0.5 bg-[#f1f5f9] text-[#334155] text-[10px] rounded cursor-pointer hover:bg-[#e2e8f0]"
            >
              İptal
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="win-btn py-1 px-2 rounded font-semibold text-[#b91c1c] hover:bg-[#fee2e2] ml-auto cursor-pointer text-[11px]"
            title="Düğümü Sil"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Scrollable Content Body */}
      {!isMinimizedMobile && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#f8fafc] text-[#1e293b]">
          {/* Basic Details / Edit Mode */}
          {isEditing ? (
            <div className="bg-[#ffffff] p-3 rounded border border-[#94a3b8] space-y-2.5 shadow-xs">
              <div>
                <label className="block text-[#334155] font-bold mb-1 text-[11px]">Varlık Adı:</label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded p-1.5 text-[#0f172a] text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[#334155] font-bold mb-1 text-[11px]">Varlık Türü:</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as NodeType)}
                  className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded p-1.5 text-[#0f172a]"
                >
                  {(Object.keys(NODE_TYPE_CONFIGS) as NodeType[]).map(t => (
                    <option key={t} value={t}>
                      {NODE_TYPE_CONFIGS[t].label} ({NODE_TYPE_CONFIGS[t].badgeCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Input in Edit Mode */}
              <div>
                <label className="block text-[#334155] font-bold mb-1 text-[11px]">Fotoğraf / Logo URL:</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://... veya alttaki butondan yükleyin"
                  className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded p-1.5 text-[#0f172a] text-xs"
                />
              </div>

              <div>
                <label className="block text-[#334155] font-bold mb-1 text-[11px]">Açıklama:</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded p-1.5 text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-[#334155] font-bold mb-1 text-[11px]">
                  Araştırmacı Notları:
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded p-1.5 text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-[#334155] font-bold mb-1 text-[11px]">
                  Etiketler (Virgülle):
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded p-1.5 text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-[#334155] font-bold mb-1 text-[11px]">
                  Kart Rengi (24 Renk):
                </label>
                <div className="grid grid-cols-12 gap-1 p-1 bg-[#f1f5f9] rounded border border-[#cbd5e1]">
                  {INVESTIGATOR_PALETTE.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.name}
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-4.5 h-4.5 rounded-xs cursor-pointer flex items-center justify-center ${
                        selectedColor === c.hex ? 'ring-2 ring-black scale-110' : 'opacity-85'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selectedColor === c.hex && <Check size={10} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="win-btn px-3 py-1 rounded cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBasic}
                  className="win-btn-emerald px-4 py-1 rounded font-bold cursor-pointer"
                >
                  Kaydet
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#ffffff] p-3 rounded border border-[#cbd5e1] space-y-2 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  {node.imageUrl ? (
                    <img
                      src={node.imageUrl}
                      alt={node.label}
                      className="w-12 h-12 rounded object-cover border border-[#94a3b8] bg-[#f1f5f9] shrink-0"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: node.color || currentTypeConfig.defaultColor }}
                    >
                      {currentTypeConfig.badgeCode}
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#64748b]">Tanım</span>
                    <p className="text-sm font-bold text-[#0f172a]">{node.label}</p>
                    <span className="text-[10px] text-[#2563eb] font-semibold">{currentTypeConfig.label}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="win-btn px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer text-[#2563eb]"
                >
                  <Edit2 size={11} />
                  <span>Düzenle</span>
                </button>
              </div>

              {node.description && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748b]">Açıklama:</span>
                  <p className="text-[#334155] mt-0.5 leading-relaxed">{node.description}</p>
                </div>
              )}

              {node.notes && (
                <div className="bg-[#fffbeb] p-2 rounded border border-[#fef08a] text-[#78350f]">
                  <span className="text-[10px] uppercase font-bold block mb-0.5">Not:</span>
                  <p className="leading-relaxed">{node.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Photo / Avatar Section (New Requested Feature!) */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#cbd5e1] space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#334155] text-[11px] flex items-center gap-1">
                <ImageIcon size={13} className="text-[#2563eb]" />
                <span>Varlık Görseli / Fotoğrafı</span>
              </span>
              {node.imageUrl ? (
                <button
                  onClick={handleRemovePhoto}
                  className="text-[#dc2626] hover:underline font-semibold text-[10px] cursor-pointer"
                >
                  Fotoğrafı Kaldır
                </button>
              ) : (
                <button
                  onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                  className="text-[#2563eb] hover:underline font-bold text-[11px] flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus size={11} />
                  <span>Fotoğraf Ekle</span>
                </button>
              )}
            </div>

            {/* Photo Uploader / Preset Form */}
            {(showPhotoUpload || !node.imageUrl) && (
              <div className="space-y-2 pt-1 border-t border-[#f1f5f9]">
                {/* Ready Presets */}
                <div>
                  <span className="text-[10px] text-[#64748b] block mb-1 font-semibold">
                    Hızlı Hazır Portreler & Varlık Simgeleri:
                  </span>
                  <div className="grid grid-cols-6 gap-1 p-1 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                    {PRESET_AVATARS.map(av => (
                      <button
                        key={av.id}
                        type="button"
                        title={av.name}
                        onClick={() => {
                          setImageUrl(av.dataUrl);
                          onUpdateNode({
                            ...node,
                            imageUrl: av.dataUrl,
                            updatedAt: new Date().toISOString(),
                          });
                        }}
                        className={`flex flex-col items-center p-1 rounded border transition-all cursor-pointer ${
                          node.imageUrl === av.dataUrl
                            ? 'border-[#2563eb] bg-[#dbeafe] ring-2 ring-[#2563eb]'
                            : 'border-[#cbd5e1] bg-white hover:border-[#94a3b8]'
                        }`}
                      >
                        <img
                          src={av.dataUrl}
                          alt={av.name}
                          className="w-6 h-6 rounded-xs object-cover"
                        />
                        <span className="text-[8px] text-[#475569] truncate w-full text-center mt-0.5">
                          {av.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="win-btn flex-1 py-1 px-2 rounded font-semibold text-center cursor-pointer flex items-center justify-center gap-1 text-[11px]">
                    <Upload size={12} className="text-[#2563eb]" />
                    <span>Cihazdan Fotoğraf Seç</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={photoUrlInput}
                    onChange={e => setPhotoUrlInput(e.target.value)}
                    placeholder="veya görsel URL'si yapıştırın (https://...)"
                    className="flex-1 bg-[#ffffff] border border-[#94a3b8] rounded p-1 text-xs text-[#0f172a]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (photoUrlInput.trim()) {
                        setImageUrl(photoUrlInput.trim());
                        onUpdateNode({
                          ...node,
                          imageUrl: photoUrlInput.trim(),
                          updatedAt: new Date().toISOString(),
                        });
                        setPhotoUrlInput('');
                      }
                    }}
                    className="win-btn-primary px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer"
                  >
                    Ata
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="bg-[#ffffff] p-3 rounded border border-[#cbd5e1] space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#334155] text-[11px] flex items-center gap-1">
                <Tag size={12} className="text-[#2563eb]" />
                <span>Etiketler</span>
              </span>
              <span className="text-[10px] text-[#64748b]">{node.tags?.length || 0} adet</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {node.tags && node.tags.length > 0 ? (
                node.tags.map(t => (
                  <span
                    key={t}
                    className="bg-[#f1f5f9] text-[#1e40af] px-1.5 py-0.5 rounded border border-[#bfdbfe] text-[11px] flex items-center gap-1 font-semibold"
                  >
                    <span>#{t}</span>
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-[#dc2626] cursor-pointer text-[#64748b]"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-[#94a3b8] italic text-[11px]">Etiket yok.</span>
              )}
            </div>
          </div>

          {/* Sources Section */}
          <div className="bg-[#ffffff] p-3 rounded border border-[#cbd5e1] space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#334155] text-[11px] flex items-center gap-1">
                <ExternalLink size={12} className="text-[#059669]" />
                <span>Doğrulama & Web Kaynakları</span>
              </span>
              <button
                onClick={() => setShowAddSource(!showAddSource)}
                className="text-[#059669] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={11} />
                <span>Kaynak Ekle</span>
              </button>
            </div>

            {showAddSource && (
              <form onSubmit={handleAddSource} className="bg-[#f0fdf4] p-2 rounded border border-[#bbf7d0] space-y-1.5">
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={e => setNewSourceUrl(e.target.value)}
                  placeholder="https://example.com/kaynak"
                  className="w-full bg-[#ffffff] border border-[#86efac] rounded p-1 text-[11px]"
                  autoFocus
                />
                <input
                  type="text"
                  value={newSourceTitle}
                  onChange={e => setNewSourceTitle(e.target.value)}
                  placeholder="Kaynak Başlığı (Örn: Sicil Kaydı)"
                  className="w-full bg-[#ffffff] border border-[#86efac] rounded p-1 text-[11px]"
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setShowAddSource(false)}
                    className="win-btn px-2 py-0.5 rounded text-[10px]"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="win-btn-emerald px-3 py-0.5 rounded text-[10px] font-bold"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1">
              {node.sources && node.sources.length > 0 ? (
                node.sources.map(src => (
                  <div
                    key={src.id}
                    className="p-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] rounded border border-[#e2e8f0] flex items-start justify-between gap-1.5"
                  >
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 overflow-hidden"
                    >
                      <span className="text-[#1d4ed8] font-semibold hover:underline block truncate">
                        {src.title || src.url}
                      </span>
                      <span className="text-[10px] text-[#64748b] block truncate">{src.url}</span>
                    </a>
                    <button
                      onClick={() => handleRemoveSource(src.id)}
                      className="text-[#94a3b8] hover:text-[#dc2626] p-1 cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-[#94a3b8] italic text-[11px]">Henüz kaynak eklenmemiş.</span>
              )}
            </div>
          </div>

          {/* Connected Entities */}
          <div className="bg-[#ffffff] p-3 rounded border border-[#cbd5e1] space-y-1.5 shadow-xs">
            <span className="font-bold text-[#334155] text-[11px] block">
              Bağlı Düğümler ({connectedEdges.length}):
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {connectedEdges.length > 0 ? (
                connectedEdges.map(edge => {
                  const isSource = edge.source === node.id;
                  const otherId = isSource ? edge.target : edge.source;
                  const otherNode = nodeMap.get(otherId);
                  if (!otherNode) return null;

                  return (
                    <div
                      key={edge.id}
                      onClick={() => onFocusNode(otherNode.id)}
                      className="p-1.5 bg-[#f8fafc] hover:bg-[#e2e8f0] rounded border border-[#e2e8f0] flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {otherNode.imageUrl ? (
                          <img
                            src={otherNode.imageUrl}
                            alt=""
                            className="w-4 h-4 rounded-xs object-cover border border-[#cbd5e1] shrink-0"
                          />
                        ) : (
                          <span
                            className="w-2.5 h-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: otherNode.color || '#2563eb' }}
                          />
                        )}
                        <span className="font-semibold text-[#0f172a] truncate">
                          {otherNode.label}
                        </span>
                        <span className="text-[10px] text-[#64748b]">({edge.relation})</span>
                      </div>
                      <span className="text-[10px] text-[#2563eb] font-semibold">Git »</span>
                    </div>
                  );
                })
              ) : (
                <span className="text-[#94a3b8] italic text-[11px]">Bağlantı yok.</span>
              )}
            </div>
          </div>

          {/* Dates Metadata */}
          <div className="text-[10px] text-[#64748b] space-y-0.5 pt-1 border-t border-[#cbd5e1]">
            <div className="flex items-center gap-1">
              <Calendar size={10} />
              <span>Oluşturulma: {new Date(node.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>
            <div>Düğüm Kimliği: {node.id}</div>
          </div>
        </div>
      )}
    </div>
  );
};
