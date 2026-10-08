import React, { useState } from 'react';
import { LayoutType } from '../utils/layouts';
import { SearchBar } from './SearchBar';
import { NodeEntity } from '../types/osint';
import { downloadAndroidZip } from '../utils/exportAndroidZip';
import {
  Undo2,
  Redo2,
  Plus,
  Network,
  Filter,
  Download,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  HelpCircle,
  Link2,
  Sparkles,
  Save,
  Sun,
  Moon,
  Search,
  Hand,
  BoxSelect,
  Smartphone,
  Settings,
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface ToolbarProps {
  nodes: NodeEntity[];
  projectName: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onApplyLayout: (type: LayoutType) => void;
  onOpenAddModal: () => void;
  onOpenBatchAdd: () => void;
  onOpenConnectModal: () => void;
  onOpenFilterModal: () => void;
  onOpenProjectModal: () => void;
  onOpenExportModal: () => void;
  onOpenHelpModal: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onSelectNode: (id: string) => void;
  onFocusNode: (id: string) => void;
  activeFilterCount: number;
  canvasTheme: 'light' | 'dark';
  onToggleCanvasTheme: () => void;
  interactionMode: 'pan' | 'select';
  onToggleInteractionMode: () => void;
  onOpenPythonModal?: () => void;
  onOpenSettings?: () => void;
  language?: Language;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  nodes,
  projectName,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onApplyLayout,
  onOpenAddModal,
  onOpenBatchAdd,
  onOpenConnectModal,
  onOpenFilterModal,
  onOpenProjectModal,
  onOpenExportModal,
  onOpenHelpModal,
  onZoomIn,
  onZoomOut,
  onFitView,
  onSelectNode,
  onFocusNode,
  activeFilterCount,
  canvasTheme,
  onToggleCanvasTheme,
  interactionMode,
  onToggleInteractionMode,
  onOpenPythonModal,
  onOpenSettings,
  language = 'tr',
}) => {
  const [activeTab, setActiveTab] = useState<'giris' | 'duzen' | 'gorunum'>('giris');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const t = translations[language];

  return (
    <header className="bg-[#d2d7de] border-b border-[#828c9b] select-none shrink-0 z-30 shadow-xs">
      {/* 1. Classic MS Office Blue Title Bar */}
      <div className="h-7 bg-gradient-to-r from-[#20406b] via-[#2b579a] to-[#20406b] text-white px-2 flex items-center justify-between text-xs font-semibold">
        {/* Quick Access Toolbar */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="flex items-center gap-1 mr-2 pr-2 border-r border-[#3d6ea8]">
            <button
              onClick={onOpenProjectModal}
              title="Araştırma Dosyaları (Kaydet / Aç)"
              className="p-1 hover:bg-[#3d6ea8] rounded cursor-pointer"
            >
              <Save size={13} className="text-white" />
            </button>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Geri Al (Ctrl+Z)"
              className="p-1 hover:bg-[#3d6ea8] rounded disabled:opacity-40 cursor-pointer"
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Yinele (Ctrl+Y)"
              className="p-1 hover:bg-[#3d6ea8] rounded disabled:opacity-40 cursor-pointer"
            >
              <Redo2 size={13} />
            </button>
          </div>

          {/* Software Title */}
          <span className="font-bold tracking-wide truncate text-[11px] sm:text-xs">
            OsintDesk <span className="font-normal opacity-90">- [{projectName}]</span>
          </span>
        </div>

        {/* Right Settings & Help */}
        <div className="flex items-center gap-1">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1 hover:bg-[#3d6ea8] rounded text-white cursor-pointer"
              title={t.settingsTitle}
            >
              <Settings size={14} />
            </button>
          )}
          <button
            onClick={onOpenHelpModal}
            className="p-1 hover:bg-[#3d6ea8] rounded text-white cursor-pointer"
            title={t.help}
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {/* 2. Desktop Ribbon Tabs Strip (Hidden on narrow mobile) */}
      <div className="hidden sm:flex bg-[#e4e8ee] border-b border-[#b2b8c2] px-1 text-xs">
        <button
          onClick={onOpenProjectModal}
          className="px-3.5 py-1 bg-[#2b579a] hover:bg-[#204780] text-white font-bold cursor-pointer"
        >
          {t.file}
        </button>
        <button
          onClick={() => setActiveTab('giris')}
          className={`px-3 py-1 font-semibold border-t-2 cursor-pointer transition-colors ${
            activeTab === 'giris'
              ? 'bg-[#d2d7de] border-[#2b579a] text-[#1e293b]'
              : 'border-transparent text-[#475569] hover:bg-[#dbe0e7]'
          }`}
        >
          {t.entities}
        </button>
        <button
          onClick={() => setActiveTab('duzen')}
          className={`px-3 py-1 font-semibold border-t-2 cursor-pointer transition-colors ${
            activeTab === 'duzen'
              ? 'bg-[#d2d7de] border-[#2b579a] text-[#1e293b]'
              : 'border-transparent text-[#475569] hover:bg-[#dbe0e7]'
          }`}
        >
          {t.layout}
        </button>
        <button
          onClick={() => setActiveTab('gorunum')}
          className={`px-3 py-1 font-semibold border-t-2 cursor-pointer transition-colors ${
            activeTab === 'gorunum'
              ? 'bg-[#d2d7de] border-[#2b579a] text-[#1e293b]'
              : 'border-transparent text-[#475569] hover:bg-[#dbe0e7]'
          }`}
        >
          {t.view}
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-3 py-1 font-semibold border-t-2 border-transparent text-[#475569] hover:bg-[#dbe0e7] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Settings size={12} className="text-[#2563eb]" />
            <span>{t.settings}</span>
          </button>
        )}

        {onOpenPythonModal && (
          <div className="ml-auto flex items-center pr-1 py-0.5">
            <button
              onClick={onOpenPythonModal}
              className="px-2.5 py-0.5 bg-gradient-to-r from-[#1e40af] to-[#2563eb] hover:from-[#1d4ed8] hover:to-[#3b82f6] text-white font-bold rounded flex items-center gap-1 cursor-pointer text-[11px] shadow-xs transition-transform active:scale-95"
              title="Windows ve Linux için Python Masaüstü GUI Uygulaması"
            >
              <span>{t.pythonDesktop}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Desktop Ribbon Command Bar */}
      <div className="hidden sm:flex items-center px-2 py-1.5 gap-2 overflow-x-auto text-xs text-[#1e293b]">
        {/* GROUP 1: Düğümler (Nodes) */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-[#9aa2ae]">
          <button
            onClick={onOpenAddModal}
            className="win-btn-primary h-8 px-2.5 rounded font-bold flex items-center gap-1.5 cursor-pointer text-xs"
            title="Yeni tekli düğüm ekle"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Düğüm Ekle</span>
          </button>

          <button
            onClick={onOpenBatchAdd}
            className="win-btn-amber h-8 px-2.5 rounded font-bold flex items-center gap-1.5 cursor-pointer text-xs"
            title="Virgülle ayrılmış birden fazla düğüm ekle (Ahmet, Mehmet, Ayşe)"
          >
            <Sparkles size={14} />
            <span>Çoklu Ekle...</span>
          </button>

          <button
            onClick={onOpenConnectModal}
            className="win-btn h-8 px-2.5 rounded font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
            title="İki düğüm arasında bağlantı kur"
          >
            <Link2 size={14} className="text-[#2563eb]" />
            <span>Bağlantı Kur</span>
          </button>
        </div>

        {/* GROUP 2: Otomatik Düzen (Layouts) */}
        <div className="flex items-center gap-1 pr-2 border-r border-[#9aa2ae]">
          <button
            onClick={() => onApplyLayout('force')}
            className="win-btn h-8 px-2 rounded font-medium flex items-center gap-1 cursor-pointer text-xs"
            title="Fiziksel Yaylı Düğüm Dağılımı"
          >
            <Network size={13} className="text-[#059669]" />
            <span>Fizik Düzen</span>
          </button>

          <button
            onClick={() => onApplyLayout('hierarchical')}
            className="win-btn h-8 px-2 rounded font-medium cursor-pointer text-xs"
            title="Hiyerarşik / Ağaç Yerleşimi"
          >
            <span>Hiyerarşi</span>
          </button>

          <button
            onClick={() => onApplyLayout('radial')}
            className="win-btn h-8 px-2 rounded font-medium cursor-pointer text-xs"
            title="Merkezden Dışa Halka Yerleşimi"
          >
            <span>Işınsal</span>
          </button>

          <button
            onClick={() => onApplyLayout('circular')}
            className="win-btn h-8 px-2 rounded font-medium cursor-pointer text-xs"
            title="Dairesel Çevre Düzeni"
          >
            <span>Dairesel</span>
          </button>
        </div>

        {/* GROUP 3: Arama & Filtre */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-[#9aa2ae] flex-1 max-w-xs">
          <SearchBar nodes={nodes} onSelectNode={onSelectNode} onFocusNode={onFocusNode} />

          <button
            onClick={onOpenFilterModal}
            className={`h-8 px-2 rounded font-semibold flex items-center gap-1 cursor-pointer text-xs transition-colors ${
              activeFilterCount > 0
                ? 'bg-[#be123c] text-white border border-[#881337]'
                : 'win-btn'
            }`}
            title="Düğüm ve İlişki Filtreleri"
          >
            <Filter size={13} />
            <span>Filtre</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#be123c] text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* GROUP 4: Dışa Aktar & Yakınlaştırma */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Pan vs Box Select Tool Mode */}
          <div className="flex items-center bg-[#e4e8ee] border border-[#7a8494] rounded mr-1">
            <button
              onClick={() => {
                if (interactionMode !== 'pan') onToggleInteractionMode();
              }}
              className={`p-1.5 cursor-pointer flex items-center gap-1 ${
                interactionMode === 'pan'
                  ? 'bg-[#2b579a] text-white font-bold'
                  : 'text-[#1e293b] hover:bg-[#c8ced7]'
              }`}
              title="Kaydırma Modu (Haritada gezin)"
            >
              <Hand size={14} />
              <span className="text-[11px] hidden lg:inline">Kaydır</span>
            </button>
            <button
              onClick={() => {
                if (interactionMode !== 'select') onToggleInteractionMode();
              }}
              className={`p-1.5 cursor-pointer flex items-center gap-1 ${
                interactionMode === 'select'
                  ? 'bg-[#2b579a] text-white font-bold'
                  : 'text-[#1e293b] hover:bg-[#c8ced7]'
              }`}
              title="Kutu ile Toplu Seçim Modu (Boş alandan basılı tutup çekin)"
            >
              <BoxSelect size={14} />
              <span className="text-[11px] hidden lg:inline">Toplu Seç</span>
            </button>
          </div>

          <button
            onClick={onOpenExportModal}
            className="win-btn h-8 px-2.5 rounded font-semibold flex items-center gap-1 cursor-pointer text-xs"
            title="PNG, JPG, PDF, JSON, CSV Olarak Dışa Aktar"
          >
            <Download size={13} className="text-[#0284c7]" />
            <span>Dışa Aktar</span>
          </button>

          <button
            onClick={onToggleCanvasTheme}
            className="win-btn h-8 px-2 rounded font-medium flex items-center gap-1 cursor-pointer text-xs"
            title="Visio Açık / Koyu Zemin Değiştir"
          >
            {canvasTheme === 'light' ? (
              <Moon size={13} className="text-[#475569]" />
            ) : (
              <Sun size={13} className="text-amber-500" />
            )}
          </button>

          <div className="flex items-center bg-[#e4e8ee] border border-[#7a8494] rounded">
            <button
              onClick={onZoomIn}
              className="p-1.5 hover:bg-[#c8ced7] text-[#1e293b] cursor-pointer"
              title="Yakınlaştır (+)"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={onZoomOut}
              className="p-1.5 hover:bg-[#c8ced7] text-[#1e293b] cursor-pointer"
              title="Uzaklaştır (-)"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={onFitView}
              className="p-1.5 hover:bg-[#c8ced7] text-[#1e293b] cursor-pointer"
              title="Ekrana Sığdır"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Compact Mobile Portrait Header (Optimized for Android) */}
      <div className="sm:hidden px-2 py-1.5 flex items-center justify-between gap-1 text-xs">
        <button
          onClick={onOpenProjectModal}
          className="win-btn h-8 px-2 rounded font-semibold flex items-center gap-1 cursor-pointer"
        >
          <FolderOpen size={13} className="text-amber-600" />
          <span className="truncate max-w-[100px] font-bold">Dosyalar</span>
        </button>

        <div className="flex-1 flex justify-center">
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="win-btn h-8 w-full max-w-[160px] px-2 rounded text-left text-slate-600 flex items-center gap-1.5 text-[11px]"
          >
            <Search size={12} className="text-slate-400 shrink-0" />
            <span className="truncate">Varlık Ara...</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleInteractionMode}
            className={`win-btn h-8 px-2 rounded text-[11px] font-bold flex items-center gap-1 ${
              interactionMode === 'select' ? 'bg-[#2b579a] text-white' : ''
            }`}
            title="Kutu ile Toplu Seçim Modu"
          >
            <BoxSelect size={13} />
            <span className="hidden xs:inline">Seçim</span>
          </button>
          <button
            onClick={onFitView}
            className="win-btn h-8 px-2 rounded text-[11px] font-semibold"
            title="Ekrana Sığdır"
          >
            Sığdır
          </button>
          <button
            onClick={onToggleCanvasTheme}
            className="win-btn h-8 px-2 rounded"
            title="Koyu / Açık Tema"
          >
            {canvasTheme === 'light' ? <Moon size={13} /> : <Sun size={13} className="text-amber-500" />}
          </button>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="win-btn h-8 px-2 rounded"
              title={t.settingsTitle}
            >
              <Settings size={13} className="text-[#2563eb]" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Dropdown if triggered */}
      {mobileSearchOpen && (
        <div className="sm:hidden p-2 bg-[#e2e6eb] border-t border-[#828c9b]">
          <SearchBar
            nodes={nodes}
            onSelectNode={id => {
              onSelectNode(id);
              setMobileSearchOpen(false);
            }}
            onFocusNode={id => {
              onFocusNode(id);
              setMobileSearchOpen(false);
            }}
          />
        </div>
      )}
    </header>
  );
};
