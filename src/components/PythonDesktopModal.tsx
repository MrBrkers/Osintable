import React, { useState } from 'react';
import { X, Download, Terminal, Check, Copy, Monitor, HardDrive, Code } from 'lucide-react';
import { downloadPythonZip } from '../utils/exportPythonZip';
import { InvestigationProject } from '../types/osint';

interface PythonDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: InvestigationProject;
}

export const PythonDesktopModal: React.FC<PythonDesktopModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'windows' | 'linux' | 'files'>('info');
  const [copied, setCopied] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPythonZip(project);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="w-full max-w-2xl bg-[#eceff4] border-2 border-[#7a8494] shadow-[0_16px_40px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col max-h-[90vh] text-xs">
        {/* Title Bar */}
        <div className="h-8 bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] text-white px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-[12px]">
            <Monitor size={15} />
            <span>OsintDesk Python Masaüstü GUI (Windows & Linux)</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#c2410c] text-white rounded cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex bg-[#dce1e8] border-b border-[#b2b8c2] px-2 pt-1 gap-1">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1.5 font-bold cursor-pointer rounded-t border-t border-x ${
              activeTab === 'info'
                ? 'bg-[#eceff4] border-[#7a8494] text-[#1e40af]'
                : 'bg-[#cbd5e1] border-transparent text-[#475569] hover:bg-[#dfe5ee]'
            }`}
          >
            Genel Bilgi & İndirme
          </button>
          <button
            onClick={() => setActiveTab('windows')}
            className={`px-3 py-1.5 font-bold cursor-pointer rounded-t border-t border-x ${
              activeTab === 'windows'
                ? 'bg-[#eceff4] border-[#7a8494] text-[#1e40af]'
                : 'bg-[#cbd5e1] border-transparent text-[#475569] hover:bg-[#dfe5ee]'
            }`}
          >
            Windows Kurulum
          </button>
          <button
            onClick={() => setActiveTab('linux')}
            className={`px-3 py-1.5 font-bold cursor-pointer rounded-t border-t border-x ${
              activeTab === 'linux'
                ? 'bg-[#eceff4] border-[#7a8494] text-[#1e40af]'
                : 'bg-[#cbd5e1] border-transparent text-[#475569] hover:bg-[#dfe5ee]'
            }`}
          >
            Linux Kurulum
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1.5 font-bold cursor-pointer rounded-t border-t border-x ${
              activeTab === 'files'
                ? 'bg-[#eceff4] border-[#7a8494] text-[#1e40af]'
                : 'bg-[#cbd5e1] border-transparent text-[#475569] hover:bg-[#dfe5ee]'
            }`}
          >
            Dosya Mimarisi
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 bg-[#eceff4] text-[#1e293b]">
          {activeTab === 'info' && (
            <div className="space-y-3">
              <div className="bg-[#eff6ff] border border-[#bfdbfe] p-3 rounded text-[#1e40af]">
                <h3 className="font-bold text-sm mb-1">🐍 Tam Donanımlı Python Masaüstü Yazılımı</h3>
                <p className="text-[11px] leading-relaxed">
                  Bu uygulama tamamen saf Python ve Tkinter GUI motoru ile bilgisayarlar için bağımsız
                  masaüstü yazılımı haline getirildi. Harici C++ derleyicilerine veya ağır framework'lere
                  gerek kalmadan Windows ve tüm Linux dağıtımlarında çalışır.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white p-2.5 border border-[#cbd5e1] rounded">
                  <span className="font-bold block text-[#0f172a] mb-1">Masaüstü GUI Özellikleri:</span>
                  <ul className="list-disc list-inside space-y-1 text-[#475569] text-[11px]">
                    <li>13 OSINT varlık türü (Kişi, IP, Domain, Kripto, vb.)</li>
                    <li>Fare tekerleği ile sınırsız yakınlaştırma (Zoom)</li>
                    <li>Sürükle-bırak düğüm ve tuval gezinmesi (Pan)</li>
                    <li>5 akıllı yerleşim (Kuvvet, Hiyerarşik, Radyal, Daire, Izgara)</li>
                  </ul>
                </div>

                <div className="bg-white p-2.5 border border-[#cbd5e1] rounded">
                  <span className="font-bold block text-[#0f172a] mb-1">Veri & Depolama:</span>
                  <ul className="list-disc list-inside space-y-1 text-[#475569] text-[11px]">
                    <li>Web ve masaüstü arası karşılıklı %100 JSON uyumu</li>
                    <li>Nodes.csv ve Edges.csv dışa aktarımı</li>
                    <li>Çoklu seçim ve anlık arama vurgulaması</li>
                    <li>Geri al / Yinele (Ctrl+Z / Ctrl+Y) geçmişi</li>
                  </ul>
                </div>
              </div>

              {/* Download CTA */}
              <div className="p-3 bg-gradient-to-r from-[#1e40af] to-[#2563eb] text-white rounded-lg flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="font-bold text-xs">Masaüstü Python Projesini İndir (.ZIP)</h4>
                  <p className="text-[10px] text-blue-100">
                    Çalıştırma scriptleri (run_windows.bat, run_linux.sh), tüm modüller ve mevcut soruşturmanız dahil.
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-4 py-2 bg-white text-[#1e40af] hover:bg-blue-50 font-bold rounded cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm transition-transform active:scale-95"
                >
                  <Download size={15} />
                  <span>{downloading ? 'Paketleniyor...' : 'ZIP Olarak İndir'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-[#0f172a]">Windows'ta Çalıştırma Adımları</h4>
              <ol className="list-decimal list-inside space-y-2 text-[#334155]">
                <li>
                  İndirdiğiniz <strong>OsintDesk-Python-Desktop-GUI.zip</strong> arşivini bir klasöre çıkartın.
                </li>
                <li>
                  Python 3'ün yüklü olduğundan emin olun (python.org).
                </li>
                <li>
                  Klasör içindeki <strong>run_windows.bat</strong> dosyasına çift tıklayın!
                </li>
              </ol>

              <div className="bg-[#0f172a] text-[#38bdf8] p-3 rounded font-mono text-[11px] relative">
                <button
                  onClick={() => copyToClipboard('python main.py', 'win-cmd')}
                  className="absolute right-2 top-2 p-1 bg-[#1e293b] hover:bg-[#334155] text-white rounded cursor-pointer"
                >
                  {copied === 'win-cmd' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                </button>
                <span className="text-[#94a3b8] block mb-1"># veya Komut Satırında (CMD / PowerShell):</span>
                <span>python main.py</span>
              </div>
            </div>
          )}

          {activeTab === 'linux' && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-[#0f172a]">Linux'ta Çalıştırma (Ubuntu, Debian, Fedora, Arch)</h4>
              <p className="text-[#475569]">
                Linux sistemlerinde standart Tkinter kütüphanesini tek bir komutla kurarak doğrudan çalıştırabilirsiniz:
              </p>

              <div className="space-y-2">
                <div className="bg-[#0f172a] text-[#a7f3d0] p-3 rounded font-mono text-[11px] relative">
                  <button
                    onClick={() => copyToClipboard('sudo apt install -y python3-tk', 'apt-cmd')}
                    className="absolute right-2 top-2 p-1 bg-[#1e293b] hover:bg-[#334155] text-white rounded cursor-pointer"
                  >
                    {copied === 'apt-cmd' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  </button>
                  <span className="text-[#94a3b8] block mb-1"># Ubuntu / Debian / Kali / Linux Mint:</span>
                  <span>sudo apt-get update && sudo apt-get install -y python3-tk</span>
                </div>

                <div className="bg-[#0f172a] text-[#38bdf8] p-3 rounded font-mono text-[11px] relative">
                  <button
                    onClick={() => copyToClipboard('chmod +x run_linux.sh && ./run_linux.sh', 'sh-cmd')}
                    className="absolute right-2 top-2 p-1 bg-[#1e293b] hover:bg-[#334155] text-white rounded cursor-pointer"
                  >
                    {copied === 'sh-cmd' ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  </button>
                  <span className="text-[#94a3b8] block mb-1"># Başlatma:</span>
                  <span>chmod +x run_linux.sh && ./run_linux.sh</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[#0f172a]">Modüler Python Proje Yapısı</h4>
              <div className="bg-white p-3 border border-[#cbd5e1] rounded font-mono text-[11px] space-y-1">
                <div>📁 <strong>python_app/</strong></div>
                <div className="pl-4">├── <strong>main.py</strong> (Ana pencere, kısayollar, menü ve durum çubuğu)</div>
                <div className="pl-4">├── <strong>graph_canvas.py</strong> (Donanım hızlandırmalı çizim, pan & zoom)</div>
                <div className="pl-4">├── <strong>models.py</strong> (13 OSINT varlık türü, kenarlar ve projeler)</div>
                <div className="pl-4">├── <strong>layouts.py</strong> (Kuvvet, hiyerarşik, radyal, dairesel algoritmalar)</div>
                <div className="pl-4">├── <strong>sidebar.py</strong> (Özellikler, komşuluk listesi ve denetçi)</div>
                <div className="pl-4">├── <strong>ribbon.py</strong> (Maltego / Visio tarzı şerit menü)</div>
                <div className="pl-4">├── <strong>dialogs.py</strong> (Düğüm, toplu aktarım ve bağlantı formları)</div>
                <div className="pl-4">└── <strong>storage.py</strong> (JSON ve CSV veri depolama)</div>
                <div>📄 <strong>main.py / osintdesk.py</strong> (Kök başlatıcılar)</div>
                <div>📄 <strong>run_windows.bat</strong> (Windows tek tık başlatıcı)</div>
                <div>📄 <strong>run_linux.sh</strong> (Linux bash başlatıcı)</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#e4e8ee] px-4 py-2 border-t border-[#b2b8c2] flex justify-between items-center">
          <span className="text-[11px] text-[#64748b]">
            Daha sonra yapılacak güncellemeler için temiz ve modüler mimari hazırlandı.
          </span>
          <button onClick={onClose} className="win-btn px-4 py-1.5 rounded font-semibold cursor-pointer">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
