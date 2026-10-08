import React, { useState, useEffect } from 'react';
import { EdgeEntity, NodeEntity, EdgeStyle, EdgeDirection } from '../types/osint';
import { PRESET_RELATIONS, INVESTIGATOR_PALETTE } from '../utils/constants';
import { X, Trash2, ArrowRight, ArrowLeftRight, Check } from 'lucide-react';

interface EdgeDetailModalProps {
  edge: EdgeEntity | null;
  nodes: NodeEntity[];
  onClose: () => void;
  onUpdateEdge: (updated: EdgeEntity) => void;
  onDeleteEdge: (id: string) => void;
}

export const EdgeDetailModal: React.FC<EdgeDetailModalProps> = ({
  edge,
  nodes,
  onClose,
  onUpdateEdge,
  onDeleteEdge,
}) => {
  const [relation, setRelation] = useState('');
  const [customRelation, setCustomRelation] = useState('');
  const [color, setColor] = useState('#1d5fa6');
  const [width, setWidth] = useState(2);
  const [style, setStyle] = useState<EdgeStyle>('solid');
  const [direction, setDirection] = useState<EdgeDirection>('directed');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (edge) {
      if (PRESET_RELATIONS.includes(edge.relation)) {
        setRelation(edge.relation);
        setCustomRelation('');
      } else {
        setRelation('Diğer');
        setCustomRelation(edge.relation);
      }
      setColor(edge.color || '#1d5fa6');
      setWidth(edge.width || 2);
      setStyle(edge.style || 'solid');
      setDirection(edge.direction || 'directed');
      setNotes(edge.notes || '');
    }
  }, [edge]);

  if (!edge) return null;

  const nodeMap = new Map<string, NodeEntity>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  const sourceNode = nodeMap.get(edge.source);
  const targetNode = nodeMap.get(edge.target);

  const activeRelation = relation === 'Diğer' && customRelation.trim() ? customRelation.trim() : relation;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEdge({
      ...edge,
      relation: activeRelation,
      color,
      width,
      style,
      direction,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="w-full max-w-md bg-[#eceff4] border-2 border-[#7a8494] shadow-[0_12px_36px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[94vh] text-xs">
        {/* Title Bar */}
        <div className="h-8 bg-gradient-to-r from-[#20406b] to-[#2c5b96] text-white px-3 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-[12px]">Bağlantı Özellikleri</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#c2410c] text-white rounded cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-3.5 overflow-y-auto space-y-3 text-[#1e293b]">
          {/* Relation Preview Header */}
          <div className="p-2.5 bg-[#ffffff] rounded border border-[#b2b8c2] text-center font-semibold text-xs">
            <span className="text-[#0f172a]">[{sourceNode?.label || 'A'}]</span>
            <span className="text-[#2563eb] mx-1">
              {direction === 'bidirectional'
                ? `←[${activeRelation}]→`
                : direction === 'reverse'
                ? `←[${activeRelation}]—`
                : direction === 'undirected'
                ? `—[${activeRelation}]—`
                : `—[${activeRelation}]→`}
            </span>
            <span className="text-[#0f172a]">[{targetNode?.label || 'B'}]</span>
          </div>

          {/* Relation Presets */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] space-y-1">
            <label className="block text-[#334155] font-bold text-[11px]">İlişki Türü:</label>
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
                placeholder="Özel ilişki adı"
                className="w-full bg-[#ffffff] border border-[#94a3b8] rounded p-1 text-xs"
              />
            )}
          </div>

          {/* Direction & Line style */}
          <div className="grid grid-cols-2 gap-2 bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2]">
            <div>
              <label className="block text-[#334155] font-bold mb-1 text-[11px]">Ok Yönü:</label>
              <div className="grid grid-cols-2 gap-1 bg-[#f1f5f9] p-1 rounded border border-[#cbd5e1]">
                <button
                  type="button"
                  onClick={() => setDirection('directed')}
                  className={`p-1 rounded flex items-center justify-center gap-1 cursor-pointer ${
                    direction === 'directed' ? 'bg-[#2563eb] text-white font-bold' : 'text-[#475569]'
                  }`}
                >
                  <ArrowRight size={12} />
                  <span>İleri</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('bidirectional')}
                  className={`p-1 rounded flex items-center justify-center gap-1 cursor-pointer ${
                    direction === 'bidirectional' ? 'bg-[#2563eb] text-white font-bold' : 'text-[#475569]'
                  }`}
                >
                  <ArrowLeftRight size={12} />
                  <span>Çift</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('reverse')}
                  className={`p-1 rounded text-center cursor-pointer ${
                    direction === 'reverse' ? 'bg-[#2563eb] text-white font-bold' : 'text-[#475569]'
                  }`}
                >
                  <span>Geri</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('undirected')}
                  className={`p-1 rounded text-center cursor-pointer ${
                    direction === 'undirected' ? 'bg-[#2563eb] text-white font-bold' : 'text-[#475569]'
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
                      style === st ? 'bg-[#2563eb] text-white font-bold' : 'text-[#475569]'
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

          {/* Color */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2]">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#334155] font-bold text-[11px]">Renk Seçimi:</label>
              <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: color }} />
            </div>
            <div className="grid grid-cols-12 gap-1 p-1 bg-[#f8fafc] rounded border border-[#e2e8f0]">
              {INVESTIGATOR_PALETTE.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setColor(c.hex)}
                  className={`w-4.5 h-4.5 rounded-xs cursor-pointer flex items-center justify-center ${
                    color === c.hex ? 'ring-2 ring-black scale-110' : 'opacity-85'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {color === c.hex && <Check size={10} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2]">
            <label className="block text-[#334155] font-bold mb-1 text-[11px]">
              İlişki Notu / İspat Belgesi:
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Dekont veya sözleşme no..."
              className="w-full bg-[#ffffff] border border-[#94a3b8] rounded p-1.5 text-xs text-[#0f172a]"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t border-[#cbd5e1] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bu ilişkiyi silmek istediğinize emin misiniz?')) {
                  onDeleteEdge(edge.id);
                  onClose();
                }
              }}
              className="win-btn px-3 py-1.5 rounded text-[#b91c1c] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Sil</span>
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="win-btn px-4 py-1.5 rounded">
                İptal
              </button>
              <button type="submit" className="win-btn-primary px-5 py-1.5 rounded font-bold">
                Kaydet
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
