#!/usr/bin/env bash
# OsintDesk - Linux Başlatıcı Scripti

set -e

echo "========================================================"
echo "   OsintDesk - OSINT Ağ & Varlık Haritalama (Linux GUI) "
echo "========================================================"

# Python3 kontrolü
if ! command -v python3 &> /dev/null; then
    echo "[HATA] python3 bulunamadı. Lütfen Python 3 yükleyin."
    exit 1
fi

# Tkinter kontrolü
if ! python3 -c "import tkinter" &> /dev/null; then
    echo "[UYARI] python3-tk paketi eksik görünüyor."
    echo "Ubuntu / Debian için: sudo apt install -y python3-tk"
    echo "Fedora için:          sudo dnf install -y python3-tkinter"
    echo "Arch Linux için:      sudo pacman -S --noconfirm tk"
    echo ""
    read -p "Yine de başlatmayı denemek istiyor musunuz? (e/h): " choice
    if [[ "$choice" != "e" && "$choice" != "E" ]]; then
        exit 1
    fi
fi

echo "OsintDesk GUI başlatılıyor..."
python3 main.py
