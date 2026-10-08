#!/usr/bin/env python3
"""
OsintDesk - OSINT Masaüstü GUI Başlatıcı
"""
import sys
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from main import main

if __name__ == "__main__":
    main()
