import React from 'react';
import { X, Smartphone, Sparkles, Network, ExternalLink, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="w-full max-w-lg bg-[#eceff4] border-2 border-[#7a8494] shadow-[0_12px_36px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[94vh] text-xs">
        {/* Title Bar */}
        <div className="h-8 bg-gradient-to-r from-[#20406b] to-[#2c5b96] text-white px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-[12px]">
            <HelpCircle size={14} />
            <span>OsintDesk Kullanım Rehberi</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#c2410c] text-white rounded cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 overflow-y-auto space-y-3 leading-relaxed text-[#1e293b]">
          {/* Mobile Portrait Mode */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] space-y-1.5 shadow-xs">
            <h3 className="font-bold text-[#1d4ed8] flex items-center gap-1 text-[11px]">
              <Smartphone size={13} />
              <span>Telefonlarda Dikey Mod ve Dokunmatik Kullanım</span>
            </h3>
            <ul className="space-y-1 list-disc list-inside text-[#334155] text-[11px]">
              <li>
                <strong>Boş Alandan Basılı Tutup Çekerek Toplu Seçme:</strong> Boş alanda parmağınızı kısa süre basılı tutup sürükleyerek seçim kutusu açabilir, içine giren tüm düğümleri tek seferde seçebilirsiniz.
              </li>
              <li>
                <strong>Çoğalt (Duplicate) & Toplu Sil:</strong> Seçim bittiğinde çıkan floating menüden tüm seçili düğümleri kopyalayabilir veya tek tıkla toplu silebilirsiniz.
              </li>
              <li>
                <strong>Fotoğraf & Avatar Ekleme:</strong> Kişi, şirket veya kurumlara cihazınızdan fotoğraf yükleyebilir, web görsel URL'si verebilir veya hazır OSINT avatarlarından birini seçebilirsiniz.
              </li>
              <li>
                <strong>Düğüme Uzun Basma:</strong> Düğüme parmağınızı basılı tuttuğunuzda titreşim ile birlikte doğrudan hızlı ekleme menüsü açılır.
              </li>
              <li>
                <strong>İki Parmakla Gezinme:</strong> Harita üzerinde iki parmağınızla kıstırarak (pinch-to-zoom) ve kaydırarak gezinebilirsiniz.
              </li>
            </ul>
          </div>

          {/* Batch Multi Add */}
          <div className="bg-[#fffbeb] p-2.5 rounded border border-[#fde047] space-y-1 shadow-xs">
            <h3 className="font-bold text-[#854d0e] flex items-center gap-1 text-[11px]">
              <Sparkles size={13} />
              <span>Hızlı Ağ Oluşturma: "Birden Fazla Ekle"</span>
            </h3>
            <p className="text-[#713f12] text-[11px]">
              Çoklu ekleme alanına virgülle veya yeni satırla isimleri girin:
            </p>
            <div className="p-1.5 bg-[#ffffff] rounded font-mono text-[11px] text-[#0f172a] border border-[#ca8a04]">
              Ahmet Yılmaz, Mehmet Kaya, Ayşe Demir, Ali Can
            </div>
            <p className="text-[#713f12] text-[11px]">
              Uygulama otomatik olarak 4 ayrı varlık düğümü oluşturur ve seçili ana düğüme bağlar.
            </p>
          </div>

          {/* Sources and Relations */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] space-y-1 shadow-xs">
            <h3 className="font-bold text-[#059669] flex items-center gap-1 text-[11px]">
              <ExternalLink size={13} />
              <span>Doğrulama Kaynakları ve İlişki Çeşitleri</span>
            </h3>
            <p className="text-[#334155] text-[11px]">
              Her varlığa istediğiniz kadar web URL'si (haber, sicil gazetesi, sosyal medya vb.) ekleyebilirsiniz. Tıklandığında telefonun tarayıcısında anında açılır.
            </p>
            <p className="text-[#334155] text-[11px]">
              Bağlantılara <strong>24 renk</strong>, yön okları ve <em>Çalışıyor, Yönetiyor, Kurucusu, Ortak, Sahibi</em> gibi ilişkiler atanabilir.
            </p>
          </div>

          {/* Keyboard Shortcuts and Right Click */}
          <div className="bg-[#f0f9ff] p-2.5 rounded border border-[#bae6fd] space-y-1 shadow-xs">
            <h3 className="font-bold text-[#0369a1] flex items-center gap-1 text-[11px]">
              <span>⌨️</span>
              <span>Klavye Kısayolları & Bağlantıya Sağ Tıklama</span>
            </h3>
            <ul className="space-y-1 list-disc list-inside text-[#334155] text-[11px]">
              <li>
                <strong>Bağlantı Kablosuna / Çizgisine Sağ Tık:</strong> Bağlantıyı tek tıkla iptal etmek / kaldırmak için çizgiye sağ tıklayıp <em>"Bağlantıyı Kaldır / Sil"</em> diyebilirsiniz.
              </li>
              <li>
                <strong>Ctrl+C ve Ctrl+V:</strong> Seçili düğümleri kopyalayıp ağ üzerinde yeni kimliklerle yapıştırır (iç bağlantıları da korur).
              </li>
              <li>
                <strong>Ctrl+D:</strong> Seçili varlıkları ve aralarındaki bağları anında çoğaltır (Duplicate).
              </li>
              <li>
                <strong>Ctrl+A:</strong> Haritadaki tüm varlıkları seçer.
              </li>
              <li>
                <strong>Delete / Backspace:</strong> Seçili düğümü veya bağlantıyı anında siler.
              </li>
            </ul>
          </div>

          {/* Layouts and Save */}
          <div className="bg-[#ffffff] p-2.5 rounded border border-[#b2b8c2] space-y-1 shadow-xs">
            <h3 className="font-bold text-[#334155] flex items-center gap-1 text-[11px]">
              <Network size={13} className="text-[#2563eb]" />
              <span>Düzenleme ve Kalıcı Kayıt</span>
            </h3>
            <p className="text-[#334155] text-[11px]">
              Ağ büyüdüğünde <em>Fiziksel Düzen (Force)</em> butonuna basarak düğümlerin birbirinin üstüne binmesini engelleyebilirsiniz. Tüm verileriniz tarayıcınızda otomatik kaydedilir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#e4e8ee] px-3.5 py-2 border-t border-[#b2b8c2] flex justify-end">
          <button onClick={onClose} className="win-btn-primary px-4 py-1.5 rounded font-bold cursor-pointer">
            Anladım, Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
