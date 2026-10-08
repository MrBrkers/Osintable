# OsintDesk - Python Masaüstü (Windows & Linux) GUI Yazılımı

Maltego ve Visio tarzı, açık kaynak istihbaratı (OSINT), siber güvenlik araştırmaları, ilişki analizi ve varlık haritalama için geliştirilmiş profesyonel masaüstü GUI uygulaması.

---

## 🚀 Hızlı Başlangıç

### Windows Kullanıcıları İçin:
1. Python'un yüklü olduğundan emin olun (Python 3.8+).
2. Proje klasöründeki **`run_windows.bat`** dosyasına çift tıklayın veya komut satırında:
```bash
python main.py
```
çalıştırın.

---

### Linux Kullanıcıları İçin (Ubuntu, Debian, Fedora, Arch, Mint vb.):
1. Terminalde Tkinter paketinin kurulu olduğundan emin olun:
   - **Ubuntu / Debian / Kali / Mint:**
     ```bash
     sudo apt-get update && sudo apt-get install -y python3-tk
     ```
   - **Fedora / RHEL:**
     ```bash
     sudo dnf install -y python3-tkinter
     ```
   - **Arch Linux / Manjaro:**
     ```bash
     sudo pacman -S tk
     ```

2. Uygulamayı başlatın:
```bash
chmod +x run_linux.sh
./run_linux.sh
```
veya doğrudan:
```bash
python3 main.py
```

---

## 🎯 Özellikler

- **13 Farklı OSINT Varlık Türü:** Kişi, Kurum/Şirket, Alan Adı (Domain), IP Adresi, E-posta, Telefon Numarası, Sosyal Medya Hesabı, Konum, Kripto Cüzdan, Doküman, Hash (MD5/SHA), Araç/Plaka, Olay/Hadise.
- **Gelişmiş Etkileşimli Tuval:**
  - Fare tekerleği ile imleç merkezli yakınlaştırma/uzaklaştırma (Zoom: %15 - %400).
  - Pürüzsüz kaydırma ve gezinme (Pan).
  - Düğüm sürükleme ve çoklu seçim (Box select & Shift+tık).
  - Yönlü (->), Çift yönlü (<->) ve yönsüz bağlar, kesikli/noktalı çizgi stilleri.
  - İlişki etiketi rozetleri.
  - **Bağlantıya Sağ Tıklama Menüsü:** Bağlantı kablosuna/çizgisine sağ tıklayarak tek tıkla bağlantıyı kaldırma/silme, ilişkiyi düzenleme ve yönü tersine çevirme.
  - **Zengin Kısayollar (Shortcuts):** Ctrl+C (Kopyala), Ctrl+V (Yapıştır), Ctrl+D (Çoğalt/Duplicate), Ctrl+A (Tümünü Seç), Delete/Backspace (Sil).
- **5 Otomatik Grafik Düzen Algoritması (Layout Engine):**
  1. **Kuvvet Tabanlı (Force-Directed / Fruchterman-Reingold):** Doğal kümeleme ve estetik yayılım.
  2. **Hiyerarşik (Hierarchical / Tree):** Seviyeli ağaç akışı.
  3. **Radyal (Radial Concentric):** Merkez hedef etrafında halkalar.
  4. **Dairesel (Circular):** Daire etrafında düzen.
  5. **Izgara (Grid):** Matris yerleşimi.
- **Özellikler & Denetçi Paneli (Sidebar):**
  - Seçili düğümün tür, etiket, değer, güven derecesi (%10-%100), etiketler ve notlarını anlık düzenleme.
  - Bağlantılı komşuları listeleme ve tek tıkla o varlığa odaklanma.
  - İlişki (Kenar) düzenleyici.
- **Toplu İçe Aktarma (Batch Import):**
  - Çok satırlı metin yapıştırarak IP, Domain, E-posta, Hash, Telefon ve Kişileri otomatik algılayıp haritaya ekleme.
- **İçe / Dışa Aktarma (Export & Import):**
  - `.json` ve `.osint` tam uyumlu proje dosyaları. (Web versiyonu ile karşılıklı uyumlu!)
  - `nodes.csv` ve `edges.csv` tabloları (Excel, Gephi, Maltego uyumlu).
  - Tuval PostScript / Görsel dışa aktarımı.
- **Arama & Vurgulama:** İsim, IP, not ve etiketler içinde anlık filtreleme ve parıltı vurgulaması.
- **Geri Al / Yinele (Undo / Redo):** Yapılan işlemleri Ctrl+Z ve Ctrl+Y ile geri/ileri alma.

---

## 📁 Dosya Yapısı

```
├── main.py              # Kök başlatıcı
├── osintdesk.py         # Alternatif kök başlatıcı
├── run_windows.bat      # Windows tek tıkla çalıştırma
├── run_linux.sh         # Linux çalıştırma betiği
├── requirements.txt     # Python gereksinimleri (temelde sıfır bağımlılık)
└── python_app/
    ├── main.py          # Ana uygulama penceresi & kontrolcü
    ├── models.py        # Veri modelleri ve örnek OSINT vakası
    ├── graph_canvas.py  # Etkileşimli tuval çizim motoru
    ├── layouts.py       # 5 farklı matematiksel yerleşim algoritması
    ├── sidebar.py       # Sağ denetçi ve özellikler paneli
    ├── ribbon.py        # Klasik şerit araç çubuğu
    ├── dialogs.py       # Düğüm, bağlantı ve toplu ekleme formları
    └── storage.py       # JSON ve CSV dışa/içe aktarımı
```
