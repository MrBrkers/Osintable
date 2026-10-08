#!/usr/bin/env python3
"""
OsintDesk - OSINT Ağ & Varlık Haritalama Masaüstü GUI Başlatıcı
Windows ve Linux uyumlu ana giriş noktası.
"""

import sys
import os

# Mevcut dizini sys.path'e ekle
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    import tkinter
except ImportError:
    print("\n" + "="*60)
    print("HATA: Tkinter modülü sisteminizde bulunamadı!")
    print("="*60)
    print("Linux (Ubuntu/Debian) üzerinde çalıştırmak için:")
    print("   sudo apt-get update && sudo apt-get install -y python3-tk")
    print("\nFedora/RHEL üzerinde:")
    print("   sudo dnf install python3-tkinter")
    print("\nArch Linux üzerinde:")
    print("   sudo pacman -S tk")
    print("\nWindows üzerinde:")
    print("   Python resmi yükleyicisini kurarken 'tcl/tk and IDLE' seçeneğini işaretleyin.")
    print("="*60 + "\n")
    sys.exit(1)

from python_app.main import main

if __name__ == "__main__":
    main()
