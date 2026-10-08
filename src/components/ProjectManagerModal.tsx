import React, { useState } from 'react';
import { InvestigationProject } from '../types/osint';
import {
  X,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Calendar,
  Layers,
  Edit2,
  Check,
} from 'lucide-react';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: InvestigationProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, description: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onExportJSON: (project: InvestigationProject) => void;
  onExportCSV: (project: InvestigationProject) => void;
  onImportJSON: (jsonString: string) => void;
  onLoadSample: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDuplicateProject,
  onDeleteProject,
  onExportJSON,
  onExportCSV,
  onImportJSON,
  onLoadSample,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateProject(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setIsCreating(false);
  };

  const handleStartRename = (proj: InvestigationProject) => {
    setEditingId(proj.id);
    setRenameText(proj.name);
  };

  const handleSaveRename = (id: string) => {
    if (renameText.trim()) {
      onRenameProject(id, renameText.trim());
    }
    setEditingId(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        onImportJSON(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="w-full max-w-xl bg-[#eceff4] border-2 border-[#7a8494] shadow-[0_12px_36px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[94vh] text-xs">
        {/* Title Bar */}
        <div className="h-8 bg-gradient-to-r from-[#20406b] to-[#2c5b96] text-white px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-[12px]">
            <FolderOpen size={14} className="text-amber-300" />
            <span>OsintDesk - Dosya & Araştırma Projeleri</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#c2410c] text-white rounded cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 overflow-y-auto space-y-3 text-[#1e293b]">
          {/* Top Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#cbd5e1]">
            <button
              onClick={() => setIsCreating(true)}
              className="win-btn-primary px-3 py-1.5 rounded font-bold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Yeni Araştırma Başlat</span>
            </button>

            <div className="flex items-center gap-1.5">
              <label className="win-btn px-2.5 py-1.5 rounded font-semibold flex items-center gap-1.5 cursor-pointer">
                <Upload size={13} className="text-[#2563eb]" />
                <span>JSON İçe Aktar</span>
                <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
              </label>

              <button
                onClick={onLoadSample}
                className="win-btn px-2.5 py-1.5 rounded font-semibold text-[#b45309] cursor-pointer"
                title="Atlas Holding örnek ağını yükle"
              >
                <span>Örnek Ağı Yükle</span>
              </button>
            </div>
          </div>

          {/* New Project Inline Form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="bg-[#ffffff] p-3 rounded border border-[#2563eb] space-y-2 shadow-xs">
              <h4 className="font-bold text-[#1d4ed8] text-[11px]">Yeni Araştırma Dosyası Oluştur</h4>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Dosya Başlığı (Örn: Soruşturma 2 – Finans Ağı)"
                className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded p-1.5 text-[#0f172a] font-bold text-xs"
                autoFocus
              />
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Açıklama / Dosya No..."
                className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded p-1.5 text-[#0f172a] text-xs"
              />
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="win-btn px-3 py-1 rounded cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="win-btn-primary px-4 py-1 rounded font-bold cursor-pointer"
                >
                  Oluştur
                </button>
              </div>
            </form>
          )}

          {/* Project List */}
          <div className="space-y-1.5">
            <span className="font-bold text-[#334155] text-[11px] block">
              Kayıtlı Araştırmalar ({projects.length}):
            </span>

            {projects.map(proj => {
              const isActive = proj.id === activeProjectId;
              const isEditingThis = editingId === proj.id;

              return (
                <div
                  key={proj.id}
                  className={`p-2.5 rounded border transition-colors ${
                    isActive
                      ? 'bg-[#ffffff] border-[#2563eb] shadow-xs ring-1 ring-[#2563eb]'
                      : 'bg-[#ffffff] border-[#cbd5e1] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 overflow-hidden">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1 mb-1">
                          <input
                            type="text"
                            value={renameText}
                            onChange={e => setRenameText(e.target.value)}
                            className="bg-[#ffffff] border border-[#2563eb] rounded px-1.5 py-0.5 text-[#0f172a] font-bold text-xs"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(proj.id)}
                            className="win-btn-emerald p-1 rounded cursor-pointer"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h4
                            onClick={() => {
                              onSelectProject(proj.id);
                              onClose();
                            }}
                            className="font-bold text-[12px] text-[#0f172a] hover:text-[#2563eb] cursor-pointer truncate"
                          >
                            {proj.name}
                          </h4>
                          {isActive && (
                            <span className="px-1 py-0.2 bg-[#dbeafe] text-[#1e40af] text-[9px] font-bold rounded border border-[#bfdbfe]">
                              Aktif
                            </span>
                          )}
                          <button
                            onClick={() => handleStartRename(proj)}
                            className="text-[#94a3b8] hover:text-[#334155] p-0.5 cursor-pointer"
                            title="İsmi Düzenle"
                          >
                            <Edit2 size={11} />
                          </button>
                        </div>
                      )}

                      {proj.description && (
                        <p className="text-[#64748b] text-[11px] truncate mt-0.5">
                          {proj.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#64748b]">
                        <span className="flex items-center gap-1">
                          <Layers size={10} />
                          <span>{proj.nodes.length} Varlık</span>
                          <span>·</span>
                          <span>{proj.edges.length} İlişki</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>{new Date(proj.updatedAt).toLocaleDateString('tr-TR')}</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!isActive && (
                        <button
                          onClick={() => {
                            onSelectProject(proj.id);
                            onClose();
                          }}
                          className="win-btn-primary px-2.5 py-1 rounded font-bold cursor-pointer text-[11px]"
                        >
                          Aç
                        </button>
                      )}

                      <button
                        onClick={() => onDuplicateProject(proj.id)}
                        className="win-btn p-1.5 rounded cursor-pointer"
                        title="Çoğalt"
                      >
                        <Copy size={12} className="text-[#475569]" />
                      </button>

                      <button
                        onClick={() => onExportJSON(proj)}
                        className="win-btn p-1.5 rounded cursor-pointer"
                        title="JSON İndir"
                      >
                        <Download size={12} className="text-[#2563eb]" />
                      </button>

                      <button
                        onClick={() => onExportCSV(proj)}
                        className="win-btn px-1.5 py-1 rounded text-[10px] font-mono font-bold cursor-pointer"
                        title="CSV İndir"
                      >
                        CSV
                      </button>

                      {projects.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`"${proj.name}" dosyasını silmek istediğinize emin misiniz?`)) {
                              onDeleteProject(proj.id);
                            }
                          }}
                          className="win-btn p-1.5 rounded text-[#dc2626] hover:bg-[#fee2e2] cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#e4e8ee] px-3.5 py-2 border-t border-[#b2b8c2] flex justify-end">
          <button onClick={onClose} className="win-btn px-4 py-1.5 rounded font-semibold cursor-pointer">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
