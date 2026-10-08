import React, { useState, useEffect } from 'react';
import { NodeEntity, EdgeDirection, EdgeStyle } from '../types/osint';
import { PRESET_RELATIONS, INVESTIGATOR_PALETTE, NODE_TYPE_CONFIGS } from '../utils/constants';
import { X, Link2, ArrowRight, ArrowLeftRight, Check, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

interface ConnectNodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceNodeId: string | null;
  targetNodeId?: string | null;
  allNodes: NodeEntity[];
  onConnect: (
    sourceId: string,
    targetId: string,
    relation: string,
    color: string,
    width: number,
    style: EdgeStyle,
    direction: EdgeDirection
  ) => void;
}

export const ConnectNodesModal: React.FC<ConnectNodesModalProps> = ({
  isOpen,
  onClose,
  sourceNodeId,
  targetNodeId,
  allNodes,
  onConnect,
}) => {
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [relation, setRelation] = useState(PRESET_RELATIONS[0]);
  const [customRelation, setCustomRelation] = useState('');
  const [color, setColor] = useState('#1d5fa6');
  const [width, setWidth] = useState(2);
  const [style, setStyle] = useState<EdgeStyle>('solid');
  const [direction, setDirection] = useState<EdgeDirection>('directed');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync state whenever modal is opened or selected nodes change
  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);

    if (allNodes.length === 0) {
      setSourceId('');
      setTargetId('');
      return;
    }

    // Determine valid source ID
    let initialSrc = '';
    if (sourceNodeId && allNodes.some(n => n.id === sourceNodeId)) {
      initialSrc = sourceNodeId;
    } else {
      initialSrc = allNodes[0]?.id || '';
    }

    // Determine valid target ID
    let initialTgt = '';
    if (targetNodeId && targetNodeId !== initialSrc && allNodes.some(n => n.id === targetNodeId)) {
      initialTgt = targetNodeId;
    } else {
      const otherNode = allNodes.find(n => n.id !== initialSrc);
      initialTgt = otherNode ? otherNode.id : '';
    }

    setSourceId(initialSrc);
    setTargetId(initialTgt);
  }, [isOpen, sourceNodeId, targetNodeId, allNodes]);

  if (!isOpen) return null;

  const activeRelation = relation === 'Diğer' && customRelation.trim() ? customRelation.trim() : relation;

  const handleSourceChange = (newSrc: string) => {
    setSourceId(newSrc);
    setFormError(null);
    if (newSrc === targetId) {
      const alternateTarget = allNodes.find(n => n.id !== newSrc);
      if (alternateTarget) {
        setTargetId(alternateTarget.id);
      }
    }
  };

  const handleTargetChange = (newTgt: string) => {
    setTargetId(newTgt);
    setFormError(null);
    if (newTgt === sourceId) {
      const alternateSource = allNodes.find(n => n.id !== newTgt);
      if (alternateSource) {
        setSourceId(alternateSource.id);
      }
    }
  };

  const handleSwapNodes = () => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const temp = sourceId;
    setSourceId(targetId);
    setTargetId(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allNodes.length < 2) {
      setFormError('Bağlantı kurmak için ağda en az 2 düğüm bulunmalıdır.');
      return;
    }

    let s = sourceId;
    let t = targetId;

    if (!s && allNodes[0]) s = allNodes[0].id;
    if (!t || t === s) {
      const alt = allNodes.find(n => n.id !== s);
      if (alt) t = alt.id;
    }

    if (!s || !t || s === t) {
      setFormError('Lütfen bağlantı için iki farklı düğüm seçin.');
      return;
    }

    onConnect(s, t, activeRelation, color, width, style, direction);
    onClose();
  };

  const sourceNode = allNodes.find(n => n.id === sourceId);
  const targetNode = allNodes.find(n => n.id === targetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="w-full max-w-md bg-[#eceff4] border-2 border-[#7a8494] shadow-[0_12px_36px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[94vh] text-xs">
        {/* Title Bar */}
        <div className="h-8 bg-gradient-to-r from-[#20406b] to-[#2c5b96] text-white px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-[12px]">
            <Link2 size={14} />
            <span>Bağlantı Oluştur (İki Düğümü Bağla)</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#c2410c] text-white rounded cursor-pointer" title="Kapat">
            <X size={15} />
          </button>
        </div>

        {allNodes.length < 2 ? (
          <div className="p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <p className="font-bold text-[#1e293b] text-sm">Ağda Yetersiz Düğüm Var</p>
            <p className="text-xs text-[#64748b]">
              İki düğüm arasında bağlantı kurabilmek için ağınızda en az 2 düğüm bulunmalıdır. Şu an kayıtlı {allNodes.length} düğüm var.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="win-btn-primary px-5 py-1.5 rounded font-bold cursor-pointer"
              >
                Tamam
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-3.5 overflow-y-auto space-y-3 text-[#1e293b]">
            {formError && (
              <div className="p-2 bg-red-100 border border-red-300 text-red-700 rounded text-xs flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Source and Target Selectors with Swap button */}
            <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#334155] text-[11px]">Bağlanacak Düğümleri Seçin:</span>
                <button
                  type="button"
                  onClick={handleSwapNodes}
                  className="px-2 py-0.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1] rounded text-[10px] font-semibold text-[#334155] flex items-center gap-1 cursor-pointer"
                  title="Başlangıç ve Hedef Düğümleri Değiştir"
                >
                  <RefreshCw size={10} />
                  <span>Yönü Değiştir</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1 text-[10px]">1. Başlangıç (Kaynak):</label>
                  <select
                    value={sourceId}
                    onChange={e => handleSourceChange(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded p-1.5 text-[#0f172a] text-xs focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    {allNodes.map(n => (
                      <option key={n.id} value={n.id} disabled={n.id === targetId}>
                        {n.label} ({NODE_TYPE_CONFIGS[n.type]?.label || n.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#475569] font-semibold mb-1 text-[10px]">2. Hedef Varlık:</label>
                  <select
                    value={targetId}
                    onChange={e => handleTargetChange(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded p-1.5 text-[#0f172a] text-xs focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    {allNodes.map(n => (
                      <option key={n.id} value={n.id} disabled={n.id === sourceId}>
                        {n.label} ({NODE_TYPE_CONFIGS[n.type]?.label || n.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Relation Preset Badges */}
            <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[#334155] font-bold text-[11px]">İlişki Türü (Etiket):</label>
                <span className="text-[10px] text-[#2563eb] font-bold">{activeRelation}</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                {PRESET_RELATIONS.map(rel => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setRelation(rel)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                      relation === rel
                        ? 'bg-[#2563eb] text-white border-[#1d4ed8] font-bold shadow-xs'
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
                  placeholder="Özel ilişki açıklaması girin (örn: Hissedar, Avukat, Ortak...)"
                  className="w-full bg-[#ffffff] border border-[#94a3b8] rounded p-1 text-xs focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </div>

            {/* Direction & Line Style */}
            <div className="grid grid-cols-2 gap-2 bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2]">
              <div>
                <label className="block text-[#334155] font-bold mb-1 text-[11px]">Ok Yönü:</label>
                <div className="grid grid-cols-2 gap-1 bg-[#f1f5f9] p-1 rounded border border-[#cbd5e1]">
                  <button
                    type="button"
                    onClick={() => setDirection('directed')}
                    className={`p-1 rounded flex items-center justify-center gap-1 cursor-pointer text-[10px] ${
                      direction === 'directed' ? 'bg-[#2563eb] text-white font-bold' : 'text-[#475569] hover:bg-[#e2e8f0]'
                    }`}
                  >
                    <ArrowRight size={11} />
                    <span>İleri</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('bidirectional')}
                    className={`p-1 rounded flex items-center justify-center gap-1 cursor-pointer text-[10px] ${
                      direction === 'bidirectional' ? 'bg-[#2563eb] text-white font-bold' : 'text-[#475569] hover:bg-[#e2e8f0]'
                    }`}
                  >
                    <ArrowLeftRight size={11} />
                    <span>Çift Yön</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('reverse')}
                    className={`p-1 rounded flex items-center justify-center gap-1 cursor-pointer text-[10px] ${
                      direction === 'reverse' ? 'bg-[#2563eb] text-white font-bold' : 'text-[#475569] hover:bg-[#e2e8f0]'
                    }`}
                  >
                    <ArrowLeft size={11} />
                    <span>Geri</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('undirected')}
                    className={`p-1 rounded text-center cursor-pointer text-[10px] ${
                      direction === 'undirected' ? 'bg-[#2563eb] text-white font-bold' : 'text-[#475569] hover:bg-[#e2e8f0]'
                    }`}
                  >
                    <span>Yönsüz</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#334155] font-bold mb-1 text-[11px]">Çizgi Stili:</label>
                <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded border border-[#cbd5e1] mb-1.5">
                  {(['solid', 'dashed', 'dotted'] as EdgeStyle[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStyle(st)}
                      className={`flex-1 p-0.5 rounded capitalize text-[10px] cursor-pointer ${
                        style === st ? 'bg-[#2563eb] text-white font-bold' : 'text-[#475569] hover:bg-[#e2e8f0]'
                      }`}
                    >
                      {st === 'solid' ? 'Düz' : st === 'dashed' ? 'Kesikli' : 'Noktalı'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={width}
                    onChange={e => setWidth(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-mono text-[#2563eb] font-bold">{width}px</span>
                </div>
              </div>
            </div>

            {/* Color Palette */}
            <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2]">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#334155] font-bold text-[11px]">Bağlantı Rengi:</label>
                <span className="w-3.5 h-3.5 rounded border border-[#94a3b8]" style={{ backgroundColor: color }} />
              </div>
              <div className="grid grid-cols-12 gap-1 p-1 bg-[#f8fafc] rounded border border-[#e2e8f0]">
                {INVESTIGATOR_PALETTE.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => setColor(c.hex)}
                    className={`w-4.5 h-4.5 rounded-xs cursor-pointer flex items-center justify-center transition-transform ${
                      color === c.hex ? 'ring-2 ring-blue-600 scale-110 shadow-xs' : 'opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {color === c.hex && <Check size={10} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Preview */}
            <div className="p-2.5 bg-[#eff6ff] rounded border border-[#bfdbfe] text-center text-xs text-[#1e40af] flex items-center justify-center gap-2">
              <span className="font-bold bg-white px-2 py-0.5 rounded border border-[#93c5fd]">
                {sourceNode?.label || 'Düğüm 1'}
              </span>
              <span className="text-[#3b82f6] font-semibold text-[11px]">
                {direction === 'bidirectional' ? '◄—[' : '—['}
                <strong>{activeRelation}</strong>
                {direction === 'undirected' ? ']—' : direction === 'reverse' ? ']◄—' : ']—►'}
              </span>
              <span className="font-bold bg-white px-2 py-0.5 rounded border border-[#93c5fd]">
                {targetNode?.label || 'Düğüm 2'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-[#cbd5e1] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="win-btn px-4 py-1.5 rounded cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!sourceId || !targetId || sourceId === targetId}
                className="win-btn-primary px-5 py-1.5 rounded font-bold cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
              >
                <Link2 size={13} />
                <span>Bağlantıyı Kur</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
