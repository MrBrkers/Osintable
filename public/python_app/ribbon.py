"""
OsintDesk - Klasik Şerit Menü ve Araç Çubuğu (Ribbon Toolbar)
Windows ve Linux Tkinter uyumlu zengin araç çubuğu
"""

import tkinter as tk
from tkinter import ttk
from typing import Callable, Optional


class RibbonToolbar(ttk.Frame):
    def __init__(
        self,
        master,
        on_new: Callable[[], None],
        on_open: Callable[[], None],
        on_save: Callable[[], None],
        on_add_node: Callable[[], None],
        on_batch_add: Callable[[], None],
        on_connect: Callable[[], None],
        on_layout_force: Callable[[], None],
        on_layout_hierarchical: Callable[[], None],
        on_layout_radial: Callable[[], None],
        on_layout_circular: Callable[[], None],
        on_layout_grid: Callable[[], None],
        on_zoom_in: Callable[[], None],
        on_zoom_out: Callable[[], None],
        on_zoom_fit: Callable[[], None],
        on_search_changed: Callable[[str], None],
        on_toggle_theme: Callable[[], None],
        **kwargs
    ):
        super().__init__(master, **kwargs)
        self.on_new = on_new
        self.on_open = on_open
        self.on_save = on_save
        self.on_add_node = on_add_node
        self.on_batch_add = on_batch_add
        self.on_connect = on_connect
        self.on_layout_force = on_layout_force
        self.on_layout_hierarchical = on_layout_hierarchical
        self.on_layout_radial = on_layout_radial
        self.on_layout_circular = on_layout_circular
        self.on_layout_grid = on_layout_grid
        self.on_zoom_in = on_zoom_in
        self.on_zoom_out = on_zoom_out
        self.on_zoom_fit = on_zoom_fit
        self.on_search_changed = on_search_changed
        self.on_toggle_theme = on_toggle_theme

        self._build_toolbar()

    def _build_toolbar(self):
        container = ttk.Frame(self, padding="4 3 4 3")
        container.pack(fill=tk.X)

        # 1. Dosya Grubu
        file_grp = ttk.LabelFrame(container, text="Proje", padding="2 2 2 2")
        file_grp.pack(side=tk.LEFT, padx=2)

        ttk.Button(file_grp, text="📄 Yeni", width=6, command=self.on_new).pack(side=tk.LEFT, padx=1)
        ttk.Button(file_grp, text="📂 Aç", width=5, command=self.on_open).pack(side=tk.LEFT, padx=1)
        ttk.Button(file_grp, text="💾 Kaydet", width=7, command=self.on_save).pack(side=tk.LEFT, padx=1)

        # 2. Varlık ve Bağlantı Grubu
        entity_grp = ttk.LabelFrame(container, text="Varlık Ekle", padding="2 2 2 2")
        entity_grp.pack(side=tk.LEFT, padx=2)

        ttk.Button(entity_grp, text="➕ Düğüm", command=self.on_add_node).pack(side=tk.LEFT, padx=1)
        ttk.Button(entity_grp, text="📋 Toplu Ekle", command=self.on_batch_add).pack(side=tk.LEFT, padx=1)
        ttk.Button(entity_grp, text="🔗 Bağla", command=self.on_connect).pack(side=tk.LEFT, padx=1)

        # 3. Otomatik Düzen (Layouts) Grubu
        layout_grp = ttk.LabelFrame(container, text="Otomatik Düzen", padding="2 2 2 2")
        layout_grp.pack(side=tk.LEFT, padx=2)

        ttk.Button(layout_grp, text="⚛️ Kuvvet", command=self.on_layout_force).pack(side=tk.LEFT, padx=1)
        ttk.Button(layout_grp, text="🌲 Hiyerarşik", command=self.on_layout_hierarchical).pack(side=tk.LEFT, padx=1)
        ttk.Button(layout_grp, text="🎯 Radyal", command=self.on_layout_radial).pack(side=tk.LEFT, padx=1)
        ttk.Button(layout_grp, text="⭕ Daire", command=self.on_layout_circular).pack(side=tk.LEFT, padx=1)
        ttk.Button(layout_grp, text="▦ Izgara", command=self.on_layout_grid).pack(side=tk.LEFT, padx=1)

        # 4. Görünüm & Zoom Grubu
        view_grp = ttk.LabelFrame(container, text="Görünüm", padding="2 2 2 2")
        view_grp.pack(side=tk.LEFT, padx=2)

        ttk.Button(view_grp, text="⛶ Sığdır", width=7, command=self.on_zoom_fit).pack(side=tk.LEFT, padx=1)
        ttk.Button(view_grp, text="➕ Yaklaş", width=7, command=self.on_zoom_in).pack(side=tk.LEFT, padx=1)
        ttk.Button(view_grp, text="➖ Uzaklaş", width=8, command=self.on_zoom_out).pack(side=tk.LEFT, padx=1)
        ttk.Button(view_grp, text="🌓 Tema", width=6, command=self.on_toggle_theme).pack(side=tk.LEFT, padx=1)

        # 5. Arama Kutusu (Sağ tarafta)
        search_grp = ttk.LabelFrame(container, text="Hızlı Arama", padding="2 2 2 2")
        search_grp.pack(side=tk.RIGHT, padx=2)

        self.search_entry = ttk.Entry(search_grp, width=18)
        self.search_entry.pack(side=tk.LEFT, padx=2)

        def on_key_release(event):
            self.on_search_changed(self.search_entry.get())

        self.search_entry.bind("<KeyRelease>", on_key_release)

        clear_btn = ttk.Button(search_grp, text="✕", width=3, command=self._clear_search)
        clear_btn.pack(side=tk.LEFT, padx=1)

    def _clear_search(self):
        self.search_entry.delete(0, tk.END)
        self.on_search_changed("")
