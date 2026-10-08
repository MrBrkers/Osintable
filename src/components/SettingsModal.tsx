import React from 'react';
import { X, Settings, Globe, Check, Sliders, Monitor } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  canvasTheme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  canvasTheme,
  onToggleTheme,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-2xs">
      <div className="w-full max-w-md bg-[#eceff4] border-2 border-[#7a8494] shadow-[0_12px_36px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col text-xs">
        {/* Title Bar */}
        <div className="h-8 bg-gradient-to-r from-[#20406b] to-[#2c5b96] text-white px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-[12px]">
            <Settings size={14} />
            <span>{t.settingsTitle}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#c2410c] text-white rounded cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="p-4 space-y-4 text-[#1e293b]">
          {/* 1. Language Option */}
          <div className="bg-white p-3 border border-[#cbd5e1] rounded shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#0f172a]">
              <Globe size={14} className="text-[#2563eb]" />
              <span>{t.language}</span>
            </div>
            <p className="text-[11px] text-[#64748b]">
              Uygulama arayüz dilini değiştirin / Select application interface language:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onLanguageChange('tr')}
                className={`p-2.5 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                  language === 'tr'
                    ? 'bg-[#eff6ff] border-[#2563eb] text-[#1e40af] font-bold'
                    : 'bg-[#f8fafc] border-[#cbd5e1] text-[#334155] hover:bg-[#f1f5f9]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🇹🇷</span>
                  <span>Türkçe</span>
                </div>
                {language === 'tr' && <Check size={14} className="text-[#2563eb]" />}
              </button>

              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`p-2.5 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                  language === 'en'
                    ? 'bg-[#eff6ff] border-[#2563eb] text-[#1e40af] font-bold'
                    : 'bg-[#f8fafc] border-[#cbd5e1] text-[#334155] hover:bg-[#f1f5f9]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🇬🇧</span>
                  <span>English</span>
                </div>
                {language === 'en' && <Check size={14} className="text-[#2563eb]" />}
              </button>
            </div>
          </div>

          {/* 2. Canvas & Appearance Preferences */}
          <div className="bg-white p-3 border border-[#cbd5e1] rounded shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#0f172a]">
              <Monitor size={14} className="text-[#059669]" />
              <span>{t.canvasSettings}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-semibold block text-[11px]">Tuval Teması / Theme:</span>
                <span className="text-[10px] text-[#64748b]">
                  {canvasTheme === 'light' ? t.lightTheme : t.darkTheme}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="win-btn px-3 py-1 rounded font-semibold cursor-pointer"
              >
                {canvasTheme === 'light' ? '🌙 Koyu Mod' : '☀️ Açık Mod'}
              </button>
            </div>
          </div>

          {/* Quick connect tips */}
          <div className="bg-[#eff6ff] p-3 border border-[#bfdbfe] rounded text-[#1e40af] text-[11px] leading-relaxed">
            <strong>💡 Hızlı Bağlantı Tutamaçları (Port Handles):</strong>
            <p className="mt-0.5 text-[#3b82f6]">
              Varlıkların 4 tarafındaki (üst, alt, sol, sağ) tutamaç noktalarından farenizle basılı tutup diğer varlığa çekerek saniyeler içinde otomatik bağlantı kurabilir ve ilişkiyi yazabilirsiniz.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#e4e8ee] px-4 py-2 border-t border-[#b2b8c2] flex justify-end">
          <button onClick={onClose} className="win-btn px-4 py-1.5 rounded font-bold cursor-pointer">
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
