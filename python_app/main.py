"""
OsintDesk - Profesyonel OSINT Ağ & Varlık Haritalama Masaüstü GUI Yazılımı
Windows ve Linux (Ubuntu, Debian, Fedora, Arch vb.) Tam Uyumlu

Çalıştırma:
    Windows: python main.py  veya  run_windows.bat
    Linux:   python3 main.py veya  ./run_linux.sh
"""

import os
import sys
import copy
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from typing import List, Optional

# Yerel modül içe aktarımı
from .models import Project, Node, Edge, NodeType, get_sample_project
from .graph_canvas import GraphCanvas
from .sidebar import SidebarInspector
from .ribbon import RibbonToolbar
from .dialogs import AddNodeDialog, BatchAddNodesDialog, ConnectNodesDialog
from .layouts import (
    apply_force_directed_layout,
    apply_hierarchical_layout,
    apply_radial_layout,
    apply_circular_layout,
    apply_grid_layout,
)
from .storage import (
    save_project_to_json,
    load_project_from_json,
    export_nodes_to_csv,
    export_edges_to_csv,
)


class OsintDeskApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("OsintDesk - OSINT Ağ & Varlık Haritalama (Desktop GUI)")
        self.root.geometry("1280x820")
        self.root.minsize(960, 600)

        # Temel Durum
        self.project: Project = get_sample_project()
        self.current_filepath: Optional[str] = None
        self.history: List[dict] = []
        self.redo_stack: List[dict] = []
        self.dark_mode: bool = False

        # Pano (Clipboard for Ctrl+C / Ctrl+V / Ctrl+D)
        self.clipboard_nodes: List[dict] = []
        self.clipboard_edges: List[dict] = []

        # Stil ve Tema
        self._setup_styles()

        # Ana Menü Çubuğu
        self._build_menu()

        # Ana Yerleşim Konteyneri
        self._build_layout()

        # Klavye Kısayolları (Windows & Linux)
        self._bind_shortcuts()

        # İlk Durum Güncellemesi
        self._update_status_bar()

    def _setup_styles(self):
        style = ttk.Style()
        try:
            if "clam" in style.theme_names():
                style.theme_use("clam")
        except Exception:
            pass

        # Genel renk ve yazı tipi ayarları
        style.configure(".", font=("Segoe UI", 9))
        style.configure("TLabel", font=("Segoe UI", 9))
        style.configure("TButton", padding=(6, 3))
        style.configure("TLabelframe.Label", font=("Segoe UI", 8, "bold"), foreground="#334155")

    def _build_menu(self):
        menubar = tk.Menu(self.root)

        # 1. Dosya Menüsü
        file_menu = tk.Menu(menubar, tearoff=0)
        file_menu.add_command(label="Yeni Soruşturma (Ctrl+N)", command=self.on_new_project)
        file_menu.add_command(label="Projeyi Aç... (Ctrl+O)", command=self.on_open_project)
        file_menu.add_separator()
        file_menu.add_command(label="Kaydet (Ctrl+S)", command=self.on_save_project)
        file_menu.add_command(label="Farklı Kaydet...", command=self.on_save_project_as)
        file_menu.add_separator()
        file_menu.add_command(label="Düğümleri CSV Olarak Dışa Aktar...", command=self.on_export_nodes_csv)
        file_menu.add_command(label="Kenarları CSV Olarak Dışa Aktar...", command=self.on_export_edges_csv)
        file_menu.add_command(label="Tuvali Görsel Olarak Kaydet (PostScript)...", command=self.on_export_canvas_image)
        file_menu.add_separator()
        file_menu.add_command(label="Çıkış", command=self.root.quit)
        menubar.add_cascade(label="Dosya", menu=file_menu)

        # 2. Düzenle Menüsü
        edit_menu = tk.Menu(menubar, tearoff=0)
        edit_menu.add_command(label="Geri Al (Ctrl+Z)", command=self.undo)
        edit_menu.add_command(label="Yinele (Ctrl+Y)", command=self.redo)
        edit_menu.add_separator()
        edit_menu.add_command(label="Yeni Düğüm Ekle...", command=self.open_add_node_dialog)
        edit_menu.add_command(label="Toplu Varlık Ekle (Batch)...", command=self.open_batch_add_dialog)
        edit_menu.add_command(label="İki Düğümü Bağla...", command=self.open_connect_dialog)
        edit_menu.add_separator()
        edit_menu.add_command(label="Seçileni Sil (Delete)", command=self.delete_selected)
        menubar.add_cascade(label="Düzen", menu=edit_menu)

        # 3. Otomatik Düzen (Layouts)
        layout_menu = tk.Menu(menubar, tearoff=0)
        layout_menu.add_command(label="Kuvvet Tabanlı (Force-Directed)", command=self.apply_layout_force)
        layout_menu.add_command(label="Hiyerarşik / Ağaç (Hierarchical)", command=self.apply_layout_hierarchical)
        layout_menu.add_command(label="Radyal / Halka (Radial)", command=self.apply_layout_radial)
        layout_menu.add_command(label="Dairesel (Circular)", command=self.apply_layout_circular)
        layout_menu.add_command(label="Izgara (Grid Matrix)", command=self.apply_layout_grid)
        menubar.add_cascade(label="Otomatik Yerleşim", menu=layout_menu)

        # 4. Görünüm Menüsü
        view_menu = tk.Menu(menubar, tearoff=0)
        view_menu.add_command(label="Tüm Ağı Ekrana Sığdır (Ctrl+0)", command=lambda: self.canvas.fit_to_screen())
        view_menu.add_command(label="Yakınlaş (+)", command=lambda: self.canvas.zoom_in())
        view_menu.add_command(label="Uzaklaş (-)", command=lambda: self.canvas.zoom_out())
        view_menu.add_command(label="Ölçeği Sıfırla (%100)", command=lambda: self.canvas.reset_zoom())
        view_menu.add_separator()
        view_menu.add_command(label="Açık / Koyu Tema Geçişi", command=self.toggle_theme)
        menubar.add_cascade(label="Görünüm", menu=view_menu)

        # 5. Yardım Menüsü
        help_menu = tk.Menu(menubar, tearoff=0)
        help_menu.add_command(label="Örnek Soruşturmayı Yükle", command=self.load_sample_data)
        help_menu.add_separator()
        help_menu.add_command(label="Hakkında", command=self.show_about)
        menubar.add_cascade(label="Yardım", menu=help_menu)

        self.root.config(menu=menubar)

    def _build_layout(self):
        # 1. Üst Şerit Menü / Araç Çubuğu (Ribbon)
        self.ribbon = RibbonToolbar(
            self.root,
            on_new=self.on_new_project,
            on_open=self.on_open_project,
            on_save=self.on_save_project,
            on_add_node=self.open_add_node_dialog,
            on_batch_add=self.open_batch_add_dialog,
            on_connect=self.open_connect_dialog,
            on_layout_force=self.apply_layout_force,
            on_layout_hierarchical=self.apply_layout_hierarchical,
            on_layout_radial=self.apply_layout_radial,
            on_layout_circular=self.apply_layout_circular,
            on_layout_grid=self.apply_layout_grid,
            on_zoom_in=lambda: self.canvas.zoom_in(),
            on_zoom_out=lambda: self.canvas.zoom_out(),
            on_zoom_fit=lambda: self.canvas.fit_to_screen(),
            on_search_changed=self.on_search,
            on_toggle_theme=self.toggle_theme,
        )
        self.ribbon.pack(fill=tk.X, side=tk.TOP)

        # 2. Bölünmüş Ana Çalışma Alanı (Tuval + Sağ Panel)
        self.paned = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        self.paned.pack(fill=tk.BOTH, expand=True)

        # Sol Tuval
        self.canvas_frame = ttk.Frame(self.paned)
        self.canvas = GraphCanvas(
            self.canvas_frame,
            project=self.project,
            on_node_selected=self.on_node_selected,
            on_edge_selected=self.on_edge_selected,
            on_node_double_click=self.on_node_double_click,
            on_graph_modified=self.on_graph_modified,
            on_delete_edge_requested=self.on_edge_deleted,
            on_edit_edge_requested=self.open_edit_edge_dialog,
            on_copy_requested=self.copy_selected,
            on_paste_requested=self.paste_selected,
            on_duplicate_requested=self.duplicate_selected,
            on_add_node_requested=self.open_add_node_dialog,
            on_connect_node_requested=self.on_connect_from_node,
            on_delete_node_requested=self.on_node_deleted,
        )
        self.canvas.pack(fill=tk.BOTH, expand=True)
        self.paned.add(self.canvas_frame, weight=4)

        # Sağ Özellikler & Denetçi Paneli
        self.sidebar_frame = ttk.Frame(self.paned, width=310)
        self.sidebar = SidebarInspector(
            self.sidebar_frame,
            project=self.project,
            on_node_updated=self.on_node_updated,
            on_node_deleted=self.on_node_deleted,
            on_edge_updated=self.on_edge_updated,
            on_edge_deleted=self.on_edge_deleted,
            on_focus_node=self.on_focus_node,
            on_connect_node_requested=self.on_connect_from_node,
            on_clone_node_requested=self.on_clone_node,
        )
        self.sidebar.pack(fill=tk.BOTH, expand=True)
        self.paned.add(self.sidebar_frame, weight=1)

        # 3. Alt Klasik Durum Çubuğu (Status Bar)
        self.status_bar = ttk.Frame(self.root, relief="sunken", padding="4 2 6 2")
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)

        self.status_lbl = ttk.Label(self.status_bar, text="Hazır", font=("Segoe UI", 8))
        self.status_lbl.pack(side=tk.LEFT)

        self.zoom_lbl = ttk.Label(self.status_bar, text="Ölçek: %100", font=("Segoe UI", 8), foreground="#475569")
        self.zoom_lbl.pack(side=tk.RIGHT, padx=(10, 0))

        self.stats_lbl = ttk.Label(self.status_bar, text="", font=("Segoe UI", 8, "bold"), foreground="#2563eb")
        self.stats_lbl.pack(side=tk.RIGHT)

    def _bind_shortcuts(self):
        self.root.bind("<Control-n>", lambda e: self.on_new_project())
        self.root.bind("<Control-N>", lambda e: self.on_new_project())
        self.root.bind("<Control-o>", lambda e: self.on_open_project())
        self.root.bind("<Control-O>", lambda e: self.on_open_project())
        self.root.bind("<Control-s>", lambda e: self.on_save_project())
        self.root.bind("<Control-S>", lambda e: self.on_save_project())
        self.root.bind("<Control-z>", lambda e: self.undo())
        self.root.bind("<Control-Z>", lambda e: self.undo())
        self.root.bind("<Control-y>", lambda e: self.redo())
        self.root.bind("<Control-Y>", lambda e: self.redo())
        self.root.bind("<Control-c>", lambda e: self.copy_selected())
        self.root.bind("<Control-C>", lambda e: self.copy_selected())
        self.root.bind("<Control-v>", lambda e: self.paste_selected())
        self.root.bind("<Control-V>", lambda e: self.paste_selected())
        self.root.bind("<Control-d>", lambda e: self.duplicate_selected())
        self.root.bind("<Control-D>", lambda e: self.duplicate_selected())
        self.root.bind("<Control-a>", lambda e: self.select_all())
        self.root.bind("<Control-A>", lambda e: self.select_all())
        self.root.bind("<Control-0>", lambda e: self.canvas.fit_to_screen())
        self.root.bind("<Delete>", lambda e: self.delete_selected())
        self.root.bind("<BackSpace>", lambda e: self.delete_selected())

    # -------------------------------------------------------------
    # GEÇMİŞ (UNDO / REDO)
    # -------------------------------------------------------------
    def _snapshot(self):
        self.history.append(copy.deepcopy(self.project.to_dict()))
        if len(self.history) > 30:
            self.history.pop(0)
        self.redo_stack.clear()

    def undo(self):
        if not self.history:
            return
        self.redo_stack.append(copy.deepcopy(self.project.to_dict()))
        state = self.history.pop()
        self.project = Project.from_dict(state)
        self._sync_project_change()
        self.set_status("Geri alındı.")

    def redo(self):
        if not self.redo_stack:
            return
        self.history.append(copy.deepcopy(self.project.to_dict()))
        state = self.redo_stack.pop()
        self.project = Project.from_dict(state)
        self._sync_project_change()
        self.set_status("Yinelendi.")

    def _sync_project_change(self):
        self.canvas.project = self.project
        self.sidebar.project = self.project
        self.canvas.selected_node_ids.clear()
        self.canvas.selected_edge_id = None
        self.sidebar.show_project_summary()
        self.canvas.redraw()
        self._update_status_bar()

    # -------------------------------------------------------------
    # PROJE DOSYA EYLEMLERİ
    # -------------------------------------------------------------
    def on_new_project(self):
        if messagebox.askyesno("Yeni Soruşturma", "Mevcut çalışma temizlenecek. Devam etmek istiyor musunuz?", parent=self.root):
            self._snapshot()
            self.project = Project(name="Yeni OSINT Soruşturması")
            self.current_filepath = None
            self._sync_project_change()
            self.canvas.fit_to_screen()
            self.set_status("Yeni boş soruşturma projesi oluşturuldu.")

    def on_open_project(self):
        filepath = filedialog.askopenfilename(
            parent=self.root,
            title="OSINT Proje Dosyası Aç",
            filetypes=[("OSINT / JSON Dosyaları", "*.json *.osint"), ("Tüm Dosyalar", "*.*")]
        )
        if not filepath:
            return

        proj = load_project_from_json(filepath)
        if proj:
            self._snapshot()
            self.project = proj
            self.current_filepath = filepath
            self._sync_project_change()
            self.canvas.fit_to_screen()
            self.set_status(f"Proje yüklendi: {os.path.basename(filepath)}")
        else:
            messagebox.showerror("Hata", "Dosya yüklenemedi veya geçersiz format.", parent=self.root)

    def on_save_project(self):
        if self.current_filepath:
            if save_project_to_json(self.project, self.current_filepath):
                self.set_status(f"Kaydedildi: {os.path.basename(self.current_filepath)}")
            else:
                messagebox.showerror("Hata", "Kaydetme sırasında bir sorun oluştu.", parent=self.root)
        else:
            self.on_save_project_as()

    def on_save_project_as(self):
        filepath = filedialog.asksaveasfilename(
            parent=self.root,
            title="Projeyi Farklı Kaydet",
            defaultextension=".json",
            filetypes=[("OSINT JSON Dosyası", "*.json"), ("Tüm Dosyalar", "*.*")]
        )
        if not filepath:
            return

        if save_project_to_json(self.project, filepath):
            self.current_filepath = filepath
            self.set_status(f"Kaydedildi: {os.path.basename(filepath)}")
        else:
            messagebox.showerror("Hata", "Dosya kaydedilemedi.", parent=self.root)

    def on_export_nodes_csv(self):
        filepath = filedialog.asksaveasfilename(
            parent=self.root,
            title="Düğümleri CSV Olarak Kaydet",
            defaultextension=".csv",
            filetypes=[("CSV Dosyası", "*.csv")]
        )
        if filepath and export_nodes_to_csv(self.project, filepath):
            messagebox.showinfo("Başarılı", f"Düğümler kaydedildi: {os.path.basename(filepath)}", parent=self.root)

    def on_export_edges_csv(self):
        filepath = filedialog.asksaveasfilename(
            parent=self.root,
            title="Kenarları CSV Olarak Kaydet",
            defaultextension=".csv",
            filetypes=[("CSV Dosyası", "*.csv")]
        )
        if filepath and export_edges_to_csv(self.project, filepath):
            messagebox.showinfo("Başarılı", f"Kenarlar kaydedildi: {os.path.basename(filepath)}", parent=self.root)

    def on_export_canvas_image(self):
        filepath = filedialog.asksaveasfilename(
            parent=self.root,
            title="Tuvali PostScript Görseli Olarak Kaydet",
            defaultextension=".ps",
            filetypes=[("PostScript Dosyası", "*.ps")]
        )
        if filepath:
            try:
                self.canvas.canvas.postscript(file=filepath, colormode="color")
                messagebox.showinfo("Başarılı", f"Görsel dışa aktarıldı: {os.path.basename(filepath)}", parent=self.root)
            except Exception as e:
                messagebox.showerror("Hata", f"Görsel dışa aktarılamadı: {e}", parent=self.root)

    def load_sample_data(self):
        self._snapshot()
        self.project = get_sample_project()
        self._sync_project_change()
        self.canvas.fit_to_screen()
        self.set_status("Örnek OSINT soruşturma verisi yüklendi.")

    # -------------------------------------------------------------
    # DÜĞÜM & BAĞLANTI EYLEMLERİ
    # -------------------------------------------------------------
    def open_add_node_dialog(self, default_type: NodeType = NodeType.PERSON):
        def on_created(node: Node):
            self._snapshot()
            # Ekranın ortasına yerleştir
            cx = self.canvas.canvas.winfo_width() / 2.0
            cy = self.canvas.canvas.winfo_height() / 2.0
            wx, wy = self.canvas.screen_to_world(cx, cy)
            node.x = wx
            node.y = wy

            self.project.add_node(node)
            self.canvas.selected_node_ids = {node.id}
            self.canvas.selected_edge_id = None
            self.sidebar.show_node(node)
            self.canvas.redraw()
            self._update_status_bar()
            self.set_status(f"Düğüm eklendi: {node.label}")

        AddNodeDialog(self.root, self.project, on_created, default_type=default_type)

    def open_batch_add_dialog(self):
        def on_batch(nodes: List[Node]):
            self._snapshot()
            cx = self.canvas.canvas.winfo_width() / 2.0
            cy = self.canvas.canvas.winfo_height() / 2.0
            wx, wy = self.canvas.screen_to_world(cx, cy)

            import random
            for idx, n in enumerate(nodes):
                n.x = wx + (random.random() - 0.5) * 300
                n.y = wy + (random.random() - 0.5) * 300
                self.project.add_node(n)

            # Otomatik hafif kuvvet düzeni uygula
            apply_force_directed_layout(self.project.nodes, self.project.edges, iterations=40)
            self.canvas.fit_to_screen()
            self.sidebar.show_project_summary()
            self._update_status_bar()
            self.set_status(f"{len(nodes)} varlık toplu olarak eklendi.")

        BatchAddNodesDialog(self.root, self.project, on_batch)

    def open_connect_dialog(self, default_src: Optional[str] = None):
        if len(self.project.nodes) < 2:
            messagebox.showwarning("Yetersiz Düğüm", "Bağlantı kurmak için en az iki düğüm olmalıdır.", parent=self.root)
            return

        def on_connected(edge: Edge):
            self._snapshot()
            self.project.add_edge(edge)
            self.canvas.selected_edge_id = edge.id
            self.canvas.selected_node_ids.clear()
            self.sidebar.show_edge(edge)
            self.canvas.redraw()
            self._update_status_bar()
            self.set_status(f"Bağlantı kuruldu: {edge.relation}")

        ConnectNodesDialog(self.root, self.project, on_connected, default_src=default_src)

    def on_connect_from_node(self, node_id: str):
        self.open_connect_dialog(default_src=node_id)

    def on_clone_node(self, node_id: str):
        src = self.project.get_node(node_id)
        if not src:
            return
        self._snapshot()
        import uuid
        cloned = copy.deepcopy(src)
        cloned.id = f"node_{uuid.uuid4().hex[:8]}"
        cloned.label = f"{src.label} (Kopya)"
        cloned.x += 60
        cloned.y += 40
        self.project.add_node(cloned)
        self.canvas.selected_node_ids = {cloned.id}
        self.sidebar.show_node(cloned)
        self.canvas.redraw()
        self._update_status_bar()
        self.set_status(f"Düğüm klonlandı: {cloned.label}")

    def copy_selected(self):
        """Seçili düğümleri ve aralarındaki bağlantıları panoya kopyalar (Ctrl+C)."""
        if not self.canvas.selected_node_ids:
            return
        self.clipboard_nodes = []
        self.clipboard_edges = []
        sel_ids = set(self.canvas.selected_node_ids)

        for nid in sel_ids:
            node = self.project.get_node(nid)
            if node:
                self.clipboard_nodes.append(copy.deepcopy(node.to_dict()))

        # Düğümler arasındaki kenarları da panoya al
        for edge in self.project.edges:
            if edge.source in sel_ids and edge.target in sel_ids:
                self.clipboard_edges.append(copy.deepcopy(edge.to_dict()))

        self.set_status(f"{len(self.clipboard_nodes)} varlık panoya kopyalandı (Ctrl+C).")

    def paste_selected(self):
        """Panodaki düğümleri ve iç bağlantılarını yeni kimliklerle yapıştırır (Ctrl+V)."""
        if not self.clipboard_nodes:
            return
        self._snapshot()
        import uuid
        id_map = {}
        new_node_ids = set()

        for data in self.clipboard_nodes:
            old_id = data["id"]
            new_id = f"node_{uuid.uuid4().hex[:8]}"
            id_map[old_id] = new_id

            node = Node.from_dict(data)
            node.id = new_id
            node.label = f"{node.label}"
            node.x += 45.0
            node.y += 45.0
            self.project.add_node(node)
            new_node_ids.add(new_id)

        # Panodaki iç bağlantıları yeni ID'lerle yeniden kur
        for e_data in self.clipboard_edges:
            if e_data["source"] in id_map and e_data["target"] in id_map:
                new_edge = Edge.from_dict(e_data)
                new_edge.id = f"edge_{uuid.uuid4().hex[:8]}"
                new_edge.source = id_map[e_data["source"]]
                new_edge.target = id_map[e_data["target"]]
                self.project.add_edge(new_edge)

        self.canvas.selected_node_ids = new_node_ids
        self.canvas.selected_edge_id = None
        if len(new_node_ids) == 1:
            first_n = self.project.get_node(next(iter(new_node_ids)))
            self.sidebar.show_node(first_n)
        else:
            self.sidebar.show_project_summary()

        self.canvas.redraw()
        self._update_status_bar()
        self.set_status(f"{len(new_node_ids)} varlık yapıştırıldı (Ctrl+V).")

    def duplicate_selected(self):
        """Seçili düğümleri ve bağlantılarını anında çoğaltır (Ctrl+D)."""
        if not self.canvas.selected_node_ids:
            return
        self.copy_selected()
        self.paste_selected()
        self.set_status(f"Seçili varlıklar çoğaltıldı (Ctrl+D).")

    def select_all(self):
        """Tüm düğümleri seçer (Ctrl+A)."""
        self.canvas.select_all_nodes()
        self.set_status(f"Tüm {len(self.canvas.selected_node_ids)} düğüm seçildi (Ctrl+A).")

    def open_edit_edge_dialog(self, edge: Edge):
        """Kenar (bağlantı) düzenleme panelini açar."""
        self.canvas.selected_edge_id = edge.id
        self.canvas.selected_node_ids.clear()
        self.sidebar.show_edge(edge)
        self.canvas.redraw()

    def delete_selected(self):
        if self.canvas.selected_node_ids:
            count = len(self.canvas.selected_node_ids)
            self._snapshot()
            for nid in list(self.canvas.selected_node_ids):
                self.project.remove_node(nid)
            self.canvas.selected_node_ids.clear()
            self.sidebar.show_project_summary()
            self.canvas.redraw()
            self._update_status_bar()
            self.set_status(f"{count} düğüm silindi.")
        elif self.canvas.selected_edge_id:
            self._snapshot()
            self.project.remove_edge(self.canvas.selected_edge_id)
            self.canvas.selected_edge_id = None
            self.sidebar.show_project_summary()
            self.canvas.redraw()
            self._update_status_bar()
            self.set_status("Bağlantı silindi.")

    # -------------------------------------------------------------
    # YERLEŞİM ALGORİTMALARI (LAYOUTS)
    # -------------------------------------------------------------
    def apply_layout_force(self):
        self._snapshot()
        apply_force_directed_layout(self.project.nodes, self.project.edges)
        self.canvas.fit_to_screen()
        self.set_status("Kuvvet Tabanlı (Force-Directed) yerleşim uygulandı.")

    def apply_layout_hierarchical(self):
        self._snapshot()
        apply_hierarchical_layout(self.project.nodes, self.project.edges)
        self.canvas.fit_to_screen()
        self.set_status("Hiyerarşik / Ağaç yerleşimi uygulandı.")

    def apply_layout_radial(self):
        self._snapshot()
        center_id = next(iter(self.canvas.selected_node_ids)) if self.canvas.selected_node_ids else None
        apply_radial_layout(self.project.nodes, self.project.edges, center_node_id=center_id)
        self.canvas.fit_to_screen()
        self.set_status("Radyal / Halka yerleşimi uygulandı.")

    def apply_layout_circular(self):
        self._snapshot()
        apply_circular_layout(self.project.nodes)
        self.canvas.fit_to_screen()
        self.set_status("Dairesel yerleşim uygulandı.")

    def apply_layout_grid(self):
        self._snapshot()
        apply_grid_layout(self.project.nodes)
        self.canvas.fit_to_screen()
        self.set_status("Izgara (Grid) matrisi yerleşimi uygulandı.")

    # -------------------------------------------------------------
    # ARAMA VE TEMA
    # -------------------------------------------------------------
    def on_search(self, query: str):
        self.canvas.set_search_query(query)
        match_count = len(self.canvas.highlighted_node_ids) if query else 0
        if query:
            self.set_status(f"Arama: '{query}' ({match_count} düğüm eşleşti)")
        else:
            self.set_status("Hazır")

    def toggle_theme(self):
        self.dark_mode = not self.dark_mode
        self.canvas.set_theme(self.dark_mode)
        self.set_status(f"Tema değiştirildi: {'Koyu Mod' if self.dark_mode else 'Açık Mod'}")

    # -------------------------------------------------------------
    # ETKİLEŞİM GERİ ÇAĞIRIMLARI (CALLBACKS)
    # -------------------------------------------------------------
    def on_node_selected(self, node: Optional[Node]):
        if node:
            self.sidebar.show_node(node)
            self.set_status(f"Seçili Düğüm: {node.label} ({node.type_label})")
        else:
            self.sidebar.show_project_summary()
            self.set_status("Hazır")

    def on_edge_selected(self, edge: Optional[Edge]):
        if edge:
            self.sidebar.show_edge(edge)
            self.set_status(f"Seçili Bağlantı: {edge.relation}")
        else:
            self.sidebar.show_project_summary()
            self.set_status("Hazır")

    def on_node_double_click(self, node: Node):
        self.sidebar.show_node(node)

    def on_graph_modified(self):
        self._update_status_bar()

    def on_node_updated(self, node: Node):
        self._snapshot()
        self.canvas.redraw()
        self._update_status_bar()

    def on_node_deleted(self, node_id: str):
        self._snapshot()
        self.project.remove_node(node_id)
        self.canvas.selected_node_ids.discard(node_id)
        self.canvas.redraw()
        self._update_status_bar()

    def on_edge_updated(self, edge: Edge):
        self._snapshot()
        self.canvas.redraw()
        self._update_status_bar()

    def on_edge_deleted(self, edge_id: str):
        self._snapshot()
        self.project.remove_edge(edge_id)
        self.canvas.selected_edge_id = None
        self.canvas.redraw()
        self._update_status_bar()

    def on_focus_node(self, node_id: str):
        self.canvas.center_on_node(node_id)
        node = self.project.get_node(node_id)
        if node:
            self.sidebar.show_node(node)

    def set_status(self, text: str):
        self.status_lbl.config(text=text)

    def _update_status_bar(self):
        node_cnt = len(self.project.nodes)
        edge_cnt = len(self.project.edges)
        scale_pct = int(self.canvas.scale * 100)
        self.stats_lbl.config(text=f"Varlık: {node_cnt} | Bağlantı: {edge_cnt}")
        self.zoom_lbl.config(text=f"Ölçek: %{scale_pct}")

    def show_about(self):
        msg = (
            "OsintDesk - OSINT Ağ & Varlık Haritalama\n"
            "Masaüstü GUI Sürümü (Windows & Linux Uyumlu)\n\n"
            "Özellikler:\n"
            "• Maltego / Visio tarzı profesyonel OSINT grafikleri\n"
            "• 13 farklı varlık türü (Kişi, Domain, IP, Hash, Kripto vb.)\n"
            "• 5 akıllı otomatik yerleşim algoritması\n"
            "• JSON ve CSV ile tam uyumlu içe/dışa aktarım\n"
            "• Saf Python mimarisi - harici ağır derleyicilere ihtiyaç duymaz."
        )
        messagebox.showinfo("OsintDesk Hakkında", msg, parent=self.root)


def main():
    root = tk.Tk()
    app = OsintDeskApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
