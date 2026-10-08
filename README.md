# OsintDesk (Osintablo) 🌐🕵️‍♂️

**Açık Kaynak İstihbaratı (OSINT), Varlık Analizi ve İlişki Haritalama Yazılımı**  
*Open Source Intelligence, Entity Graph & Relationship Mapping Desktop GUI & Web Application*

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20Web-success.svg)](https://github.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)](LICENSE)

---

## 📌 Proje Hakkında (About)

**OsintDesk** (veya yerli ismiyle **Osintablo**); Maltego ve MS Visio tarzı, siber güvenlik araştırmacıları, istihbarat analistleri, gazeteciler ve adli bilişim uzmanları için geliştirilmiş modern, hafif ve bağımsız bir **OSINT ağ ve ilişki analizi** yazılımıdır.

Varlıklar (kişiler, kurumlar, IP adresleri, domainler, e-postalar, kripto cüzdanlar vb.) arasındaki ilişkileri görselleştirmek, kanıt toplamak ve karmaşık ağları saniyeler içinde çözmek için tasarlanmıştır.

> **İki Dünyanın En İyisi:**  
> Hem hiçbir ağır kütüphane bağımlılığı gerektirmeyen **saf Python Masaüstü GUI** (`Tkinter`) olarak hem de tarayıcı üzerinden çalışan **modern React/TypeScript Web SPA** olarak eksiksiz çalışır.

---

## ✨ Temel Özellikler (Key Features)

### 🎯 1. 8 Tutamaçlı Otomatik Bağlantı (Port Drag-to-Connect)
- Her varlığın **üst, alt, sol, sağ ve 4 köşesinde** bağlantı noktaları (portlar) bulunur.
- Bir noktadan tutup farenizle basılı tutarak diğer varlığa doğru çektiğinizde dinamik önizleme çizgisi uzanır.
- Hedef varlığın üzerine bıraktığınız anda **hızlı ilişki penceresi** açılır; ilişki adını (örn. *Fiziksel Adres, CEO, DNS Kaydı, Sahibi*) yazıp **Enter**'a bastığınızda bağlantı anında oluşturulur ve pencere kapanır.

### 🌐 2. Tek Tıkla "Google'da Ara / Tarayıcıda Aç" Kısayolu
- Araştırma yaparken düğümün ismini veya değerini (şirket adı, kişi adı, IP, ev adresi vb.) yazdıktan sonra tek tıkla varsayılan tarayıcınızda Google araması başlatabilirsiniz.
- İnternetten bilgi toplayıp bilgileri grafiğe aktarmayı maksimum düzeyde hızlandırır.
- Detay panelinden, sağ tık bağlam menüsünden ve araç çubuğundan erişilebilir.

### ✂️ 3. Bağlantı Kablosu Sağ Tık Menüsü & Hızlı İptal
- Bağlantı çizgisine/kablosuna sağ tıklayarak:
  - **🗑️ Bağlantıyı Kaldır / Sil** (yanlış bağlantıyı tek tıkla yok etme)
  - **✏️ İlişkiyi Düzenle** (etiket metnini güncelleme)
  - **↔ Yönü Değiştir** (Tek yön `➔`, Çift yön `↔`, Yönsüz)
  - **Çizgi Stili** (Düz, Kesikli, Noktalı)

### ⌨️ 4. Standart Klavye Kısayolları
- **`Ctrl + C`**: Seçili düğümleri kopyalar.
- **`Ctrl + V`**: Kopyalanan düğümleri yeni kimliklerle tuvale yapıştırır.
- **`Ctrl + D`**: Seçili düğümleri anında çoğaltır (Duplicate/Clone).
- **`Delete` / `Backspace`**: Seçili düğümleri veya bağlantıları siler.
- **`Ctrl + A`**: Tüm varlıkları seçer.
- **`Ctrl + Z` / `Ctrl + Y`**: Geri al (Undo) ve Yinele (Redo).
- **`Ctrl + 0`**: Tuvali ve grafiği ekrana sığdırır (Fit to Screen).
- **`Enter`**: Bağlantı ve düğüm formlarını anında onaylar.
- **`Esc`**: Açılan pencereleri ve modalları kapatır.

### 🌍 5. Çift Dil Desteği (Türkçe & English)
- Ayarlar menüsünden dilediğiniz zaman tek tıkla **Türkçe 🇹🇷** ve **English 🇬🇧** arayüz dilleri arasında geçiş yapabilirsiniz.
- Tüm butonlar, düğüm tipleri, menüler ve bildirimler dinamik olarak seçilen dile uyarlanır.

### 📐 6. 5 Farklı Otomatik Grafik Düzen Algoritması (Layout Engine)
1. **Kuvvet Tabanlı (Force-Directed / Fruchterman-Reingold):** Doğal fiziksel çekim ve itim simülasyonu.
2. **Hiyerarşik (Hierarchical / Tree):** Üst-alt ilişkileri için basamaklı ağaç düzeni.
3. **Radyal (Radial Concentric):** Merkez hedef varlık etrafında eşmerkezli halkalar.
4. **Dairesel (Circular):** Tüm düğümleri dengeli bir çember etrafına dizer.
5. **Izgara (Grid):** Düzenli matris yerleşimi.

### 🏷️ 7. 13 Yerleşik OSINT Varlık Türü
| Tür | Simge | Açıklama |
|---|---|---|
| **Kişi (Person)** | 👤 | Hedef şahıslar, şüpheliler, çalışanlar |
| **Kurum (Organization)** | 🏢 | Şirketler, vakıflar, devlet kurumları |
| **Alan Adı (Domain)** | 🌐 | Web siteleri, alt alan adları (subdomain) |
| **IP Adresi (IP)** | 🖥️ | IPv4 / IPv6 sunucular, proxy, VPN |
| **E-posta (Email)** | ✉️ | Kurumsal ve kişisel mail adresleri |
| **Telefon (Phone)** | 📱 | GSM, sabit hat, WhatsApp/Telegram |
| **Sosyal Medya (Social)** | 💬 | X/Twitter, Instagram, LinkedIn, GitHub |
| **Konum / Adres (Location)** | 📍 | Fiziksel ev/iş adresi, şehir, koordinat |
| **Kripto Cüzdan (Crypto)** | 🪙 | Bitcoin, Ethereum, USDT cüzdan adresleri |
| **Doküman (Document)** | 📄 | PDF, sızıntı belgeleri, sözleşmeler |
| **Hash (Hash)** | 🔑 | MD5, SHA256 zararlı yazılım / dosya imzaları |
| **Araç (Vehicle)** | 🚗 | Taşıt plakası, şasi numarası |
| **Olay (Event)** | ⚡ | Siber saldırı, vaka, görüşme, toplantı |

### 💾 8. Çoklu Dışa & İçe Aktarım (Export & Import)
- **JSON (.json):** Tam vaka analizi yedeği (Web ve Masaüstü arasında %100 uyumlu senkronizasyon).
- **CSV (.csv):** `nodes.csv` ve `edges.csv` tabloları (Excel, Maltego, Gephi uyumlu).
- **Görsel / Rapor:** PNG, JPG, PDF ve yüksek çözünürlüklü vektörel tuval çıktısı.

---

## 🚀 Kurulum ve Çalıştırma (Getting Started)

### Seçenek 1: Python Masaüstü GUI (Windows & Linux)

Harici büyük kütüphane kurulumu gerektirmez; Python standart kütüphanesi (`tkinter`) ile çalışır.

#### 🪟 Windows:
1. Bilgisayarınızda [Python 3.8+](https://www.python.org/) kurulu olduğundan emin olun.
2. Proje klasöründeki **`run_windows.bat`** dosyasına çift tıklayın veya CMD/PowerShell üzerinden:
```bash
python main.py
```

#### 🐧 Linux (Ubuntu, Debian, Kali, Mint, Fedora, Arch):
1. Sisteminizde `python3-tk` kurulu değilse terminalde yükleyin:
```bash
# Ubuntu / Debian / Kali / Linux Mint:
sudo apt-get update && sudo apt-get install -y python3-tk

# Fedora / RedHat:
sudo dnf install -y python3-tkinter

# Arch Linux / Manjaro:
sudo pacman -S tk
```

2. Betiği çalıştırılabilir yapın ve başlatın:
```bash
chmod +x run_linux.sh
./run_linux.sh
# veya doğrudan:
python3 main.py
```

---

### Seçenek 2: Web SPA (Tarayıcı Üzerinde Geliştirme)

Web arayüzü React 19, TypeScript ve Vite üzerinde çalışır:

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Geliştirici sunucusunu başlatın
npm run dev

# 3. Tarayıcınızda açın
http://localhost:3000
```

---

## 📂 Proje Dizin Yapısı (Project Structure)

```text
├── main.py                     # Python Masaüstü ana başlatıcı
├── osintdesk.py                # Alternatif Python başlatıcı
├── run_windows.bat             # Windows tek tıkla çalıştırma betiği
├── run_linux.sh                # Linux tek tıkla çalıştırma betiği
├── requirements.txt            # Python gereksinimleri (hafif/opsiyonel)
├── package.json                # Web sürümü bağımlılıkları
├── vite.config.ts              # Vite yapılandırması
├── index.html                  # Web HTML giriş noktası
│
├── python_app/                 # Python Masaüstü GUI Modülleri
│   ├── main.py                 # Tkinter ana penceresi ve olay yöneticisi
│   ├── graph_canvas.py         # Etkileşimli tuval, 8-port çizimi, drag-connect
│   ├── dialogs.py              # Düğüm ekleme, QuickConnectDialog formları
│   ├── sidebar.py              # Sağ özellikler ve denetçi paneli
│   ├── ribbon.py               # Üst şerit (Ribbon) araç çubuğu
│   ├── layouts.py              # 5 adet matematiksel grafik yerleşim algoritması
│   ├── models.py               # Varlık, bağlantı ve proje veri modelleri
│   └── storage.py              # JSON / CSV dışa ve içe aktarma motoru
│
└── src/                        # React / Web Uygulama Kaynak Kodları
    ├── components/             # React bileşenleri
    │   ├── NetworkCanvas.tsx   # Canvas çizim, port sürükleme & kablo motoru
    │   ├── QuickConnectPopup.tsx # Hızlı bağlantı kurma modalı
    │   ├── SettingsModal.tsx   # Dil (TR/EN) ve tema ayarları
    │   ├── NodeDetailPanel.tsx # Detay özellikleri ve Google'da Ara butonu
    │   ├── Toolbar.tsx         # Klasik Office/Visio şerit araç çubuğu
    │   ├── StatusBar.tsx       # Alt durum çubuğu
    │   └── ...                 # Export, Filter, Help, Project modalları
    ├── types/osint.ts          # TypeScript tip tanımları
    ├── utils/                  # Algoritmalar, i18n, dışa aktarıcılar
    └── App.tsx                 # Ana React uygulama bileşeni
```

---

## 🔮 Gelecek Özellikler & Yol Haritası (Roadmap)

- [x] 8 tutamaçlı otomatik sürükle-bırak bağlantı ve Enter ile onaylanan modal
- [x] Bağlantı kablosuna sağ tık ile kaldırma ve yön değiştirme
- [x] Düğümler için tek tıkla Google'da Ara / Tarayıcıda Aç kısayolu
- [x] Türkçe & İngilizce arayüz dil desteği
- [ ] **Otomatik Kurum ve Hedef Keşfi (Maltego Transforms Engine):** Bir kurum adı yazıldığında Google / Gemini API üzerinden adres, web sitesi, çalışanlar ve sunucuları tek tıkla haritaya düğüm olarak ekleme motoru.
- [ ] WHOIS & DNS otomatik sorgulama eklentisi
- [ ] Çoklu tuval sekmeleri (Multi-tab investigation)

---

## 🛡️ Lisans (License)

Bu proje **Apache 2.0** lisansı altında dağıtılmaktadır. Detaylar için `LICENSE` dosyasına bakabilirsiniz.
Açık kaynak istihbaratı ve siber güvenlik eğitim ve araştırma amaçlarıyla özgürce kullanılabilir, geliştirilebilir ve çatallanabilir (fork).
