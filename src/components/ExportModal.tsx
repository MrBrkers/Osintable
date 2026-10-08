import React, { useState } from 'react';
import { InvestigationProject } from '../types/osint';
import { X, Image, FileText, Download, Check, Smartphone } from 'lucide-react';
import { downloadAndroidZip } from '../utils/exportAndroidZip';
import { downloadPythonZip } from '../utils/exportPythonZip';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: InvestigationProject;
  onExportImage: (format: 'png' | 'jpeg') => void;
  onExportPDF: () => void;
  onExportJSON: (project: InvestigationProject) => void;
  onExportCSV: (project: InvestigationProject) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  onExportImage,
  onExportPDF,
  onExportJSON,
  onExportCSV,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerSuccess = (label: string) => {
    setDownloadSuccess(label);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="w-full max-w-md bg-[#eceff4] border-2 border-[#7a8494] shadow-[0_12px_36px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col text-xs">
        {/* Title Bar */}
        <div className="h-8 bg-gradient-to-r from-[#20406b] to-[#2c5b96] text-white px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-[12px]">
            <Download size={14} />
            <span>Ağ Haritasını Dışa Aktar</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#c2410c] text-white rounded cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {downloadSuccess && (
          <div className="bg-[#dcfce7] border-b border-[#86efac] px-3 py-1.5 text-[#166534] flex items-center gap-1.5 font-semibold">
            <Check size={13} className="text-[#16a34a]" />
            <span>{downloadSuccess} başarıyla indirildi.</span>
          </div>
        )}

        <div className="p-3.5 space-y-3 text-[#1e293b]">
          {/* Visual Exports */}
          <div className="space-y-1.5">
            <span className="font-bold text-[#334155] block">1. Görsel & Rapor Formatları:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onExportImage('png');
                  triggerSuccess('PNG Resmi');
                }}
                className="p-2.5 bg-[#ffffff] hover:bg-[#f8fafc] border border-[#b2b8c2] rounded flex flex-col items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Image size={18} className="text-[#2563eb]" />
                <span className="font-bold text-[#0f172a]">PNG Resim</span>
                <span className="text-[10px] text-[#64748b]">Şeffaf / Net</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportImage('jpeg');
                  triggerSuccess('JPG Resmi');
                }}
                className="p-2.5 bg-[#ffffff] hover:bg-[#f8fafc] border border-[#b2b8c2] rounded flex flex-col items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Image size={18} className="text-[#d97706]" />
                <span className="font-bold text-[#0f172a]">JPG Resim</span>
                <span className="text-[10px] text-[#64748b]">Beyaz Zemin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportPDF();
                  triggerSuccess('PDF Raporu');
                }}
                className="p-2.5 bg-[#ffffff] hover:bg-[#f8fafc] border border-[#b2b8c2] rounded flex flex-col items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <FileText size={18} className="text-[#dc2626]" />
                <span className="font-bold text-[#0f172a]">PDF Çıktısı</span>
                <span className="text-[10px] text-[#64748b]">Rapor Yazdır</span>
              </button>
            </div>
          </div>

          {/* Data Exports */}
          <div className="space-y-1.5 pt-2 border-t border-[#cbd5e1]">
            <span className="font-bold text-[#334155] block">2. Veri & Yedekleme Dosyaları:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onExportJSON(project);
                  triggerSuccess('JSON Veri Dosyası');
                }}
                className="p-2.5 bg-[#ffffff] hover:bg-[#f8fafc] border border-[#b2b8c2] rounded flex flex-col items-start gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <div className="flex items-center gap-1 text-[#059669] font-bold">
                  <Download size={13} />
                  <span>JSON Dosyası</span>
                </div>
                <p className="text-[10px] text-[#64748b] leading-tight">
                  Tüm koordinatlar, ilişkiler ve kaynak URL'leri ile eksiksiz yedek.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportCSV(project);
                  triggerSuccess('CSV Tabloları');
                }}
                className="p-2.5 bg-[#ffffff] hover:bg-[#f8fafc] border border-[#b2b8c2] rounded flex flex-col items-start gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <div className="flex items-center gap-1 text-[#d97706] font-bold">
                  <Download size={13} />
                  <span>CSV Tabloları</span>
                </div>
                <p className="text-[10px] text-[#64748b] leading-tight">
                  Excel, Gephi ve analiz araçları için düğüm ve kenar listesi.
                </p>
              </button>
            </div>
          </div>

          {/* Python Desktop Native GUI Project Export */}
          <div className="space-y-1.5 pt-2 border-t border-[#cbd5e1]">
            <span className="font-bold text-[#334155] block">3. Python Masaüstü GUI Paketi (Windows & Linux):</span>
            <button
              type="button"
              onClick={async () => {
                await downloadPythonZip(project);
                triggerSuccess('Python Masaüstü GUI Paketi (ZIP)');
              }}
              className="w-full p-2.5 bg-[#eff6ff] hover:bg-[#dbeafe] border-2 border-[#2563eb] rounded flex items-center justify-between cursor-pointer transition-colors shadow-xs text-left"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded bg-[#1e40af] text-white flex items-center justify-center shrink-0 mt-0.5 text-base font-bold">
                  🐍
                </div>
                <div>
                  <div className="font-bold text-[#1e40af] text-xs flex items-center gap-1.5">
                    <span>Python Masaüstü Uygulamasını İndir (.ZIP)</span>
                    <span className="bg-[#2563eb] text-white text-[9px] px-1.5 py-0.2 rounded font-mono">GUI</span>
                  </div>
                  <p className="text-[10px] text-[#475569] mt-0.5 leading-snug">
                    Windows (.bat) ve Linux (.sh) için hazır, harici bağımlılıksız Tkinter masaüstü OSINT yazılımı ve mevcut soruşturma veriniz.
                  </p>
                </div>
              </div>
              <Download size={16} className="text-[#2563eb] shrink-0 ml-2" />
            </button>
          </div>

          {/* Android A-IDE Native Java Project Export */}
          <div className="space-y-1.5 pt-2 border-t border-[#cbd5e1]">
            <span className="font-bold text-[#334155] block">4. Android (A-IDE & Java) Uygulama Paketi:</span>
            <button
              type="button"
              onClick={async () => {
                await downloadAndroidZip();
                triggerSuccess('A-IDE Java Projesi (ZIP)');
              }}
              className="w-full p-2.5 bg-[#eff6ff] hover:bg-[#dbeafe] border-2 border-[#3b82f6] rounded flex items-center justify-between cursor-pointer transition-colors shadow-xs text-left"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded bg-[#2563eb] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone size={18} />
                </div>
                <div>
                  <div className="font-bold text-[#1e40af] text-xs flex items-center gap-1.5">
                    <span>A-IDE Java Android Projesini İndir (.ZIP)</span>
                    <span className="bg-[#2563eb] text-white text-[9px] px-1.5 py-0.2 rounded font-mono">A-IDE</span>
                  </div>
                  <p className="text-[10px] text-[#475569] mt-0.5 leading-snug">
                    Doğrudan telefonda A-IDE ile derlemeye hazır tam Java kaynak kodu (MainActivity, Özel Canvas, Modeller, XML arayüzleri).
                  </p>
                </div>
              </div>
              <Download size={16} className="text-[#2563eb] shrink-0 ml-2" />
            </button>
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
