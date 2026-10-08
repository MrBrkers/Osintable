"""
OsintDesk - Özellikler ve Denetçi Yan Paneli (Inspector Sidebar)
Windows ve Linux Tkinter uyumlu dinamik özellik paneli
"""

import tkinter as tk
from tkinter import ttk, messagebox
from typing import Optional, Callable
from .models import Project, Node, Edge, NodeType, NODE_TYPE_META, EdgeDirection, EdgeStyle


class SidebarInspector(ttk.Frame):
    def __init__(
        self,
        master,
        project: Project,
        on_node_updated: Callable[[Node], None],
        on_node_deleted: Callable[[str], None],
        on_edge_updated: Callable[[Edge], None],
        on_edge_deleted: Callable[[str], None],
        on_focus_node: Callable[[str], None],
        on_connect_node_requested: Callable[[str], None],
        on_clone_node_requested: Callable[[str], None],
        **kwargs
    ):
        super().__init__(master, **kwargs)
        self.project = project
        self.on_node_updated = on_node_updated
        self.on_node_deleted = on_node_deleted
        self.on_edge_updated = on_edge_updated
        self.on_edge_deleted = on_edge_deleted
        self.on_focus_node = on_focus_node
        self.on_connect_node_requested = on_connect_node_requested
        self.on_clone_node_requested = on_clone_node_requested

        self.current_node: Optional[Node] = None
        self.current_edge: Optional[Edge] = None

        # Ana konteyner
        self.container = ttk.Frame(self, padding="10 8 10 8")
        self.container.pack(fill=tk.BOTH, expand=True)

        self.show_project_summary()

    def clear(self):
        for widget in self.container.winfo_children():
            widget.destroy()

    # -------------------------------------------------------------
    # 1. BOŞ SEÇİM: PROJE ÖZETİ VE İSTATİSTİKLER
    # -------------------------------------------------------------
    def show_project_summary(self):
        self.clear()
        self.current_node = None
        self.current_edge = None

        # Başlık
        hdr = ttk.Label(self.container, text="📊 Soruşturma Özeti", font=("Segoe UI", 11, "bold"))
        hdr.pack(anchor="w", pady=(0, 8))

        # Proje Adı
        name_lbl = ttk.Label(self.container, text=self.project.name, font=("Segoe UI", 9, "bold"), foreground="#1e40af", wraplength=240)
        name_lbl.pack(anchor="w", pady=(0, 2))

        if self.project.description:
            desc_lbl = ttk.Label(self.container, text=self.project.description, font=("Segoe UI", 8), foreground="#64748b", wraplength=240)
            desc_lbl.pack(anchor="w", pady=(0, 8))

        sep = ttk.Separator(self.container, orient="horizontal")
        sep.pack(fill=tk.X, pady=8)

        # Metrikler Tablosu
        stats_frame = ttk.LabelFrame(self.container, text="Ağ Metrikleri", padding=8)
        stats_frame.pack(fill=tk.X, pady=(0, 10))

        ttk.Label(stats_frame, text=f"Toplam Varlık / Düğüm: {len(self.project.nodes)}", font=("Segoe UI", 9)).pack(anchor="w", pady=1)
        ttk.Label(stats_frame, text=f"Toplam İlişki / Bağlantı: {len(self.project.edges)}", font=("Segoe UI", 9)).pack(anchor="w", pady=1)

        # Tür Dağılımı
        types_frame = ttk.LabelFrame(self.container, text="Varlık Türleri Dağılımı", padding=8)
        types_frame.pack(fill=tk.X, pady=(0, 10))

        type_counts = {}
        for n in self.project.nodes:
            type_counts[n.type] = type_counts.get(n.type, 0) + 1

        for ntype, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
            meta = NODE_TYPE_META.get(ntype, {})
            icon = meta.get("icon", "●")
            label = meta.get("label", str(ntype))
            row = ttk.Frame(types_frame)
            row.pack(fill=tk.X, pady=1)
            ttk.Label(row, text=f"{icon} {label}", font=("Segoe UI", 8)).pack(side=tk.LEFT)
            ttk.Label(row, text=str(count), font=("Segoe UI", 8, "bold"), foreground="#2563eb").pack(side=tk.RIGHT)

        # İpuçları
        tip_frame = ttk.LabelFrame(self.container, text="Hızlı Kısayollar", padding=8)
        tip_frame.pack(fill=tk.X)
        tips = [
            "• Sürükleme: Sol tık veya Boşluk+Sol",
            "• Yakınlaşma: Fare Tekerleği",
            "• Çoklu Seçim: Shift + Tık veya Kutu",
            "• Silme: Delete tuşu",
            "• Düğüm Düzenleme: Çift Tıklama",
        ]
        for tip in tips:
            ttk.Label(tip_frame, text=tip, font=("Segoe UI", 8), foreground="#475569").pack(anchor="w", pady=1)

    # -------------------------------------------------------------
    # 2. DÜĞÜM SEÇİMİ: DÜĞÜM ÖZELLİKLERİ
    # -------------------------------------------------------------
    def show_node(self, node: Node):
        self.clear()
        self.current_node = node
        self.current_edge = None

        # Başlık ve Renk Şeridi
        hdr_frame = ttk.Frame(self.container)
        hdr_frame.pack(fill=tk.X, pady=(0, 8))

        icon_lbl = ttk.Label(hdr_frame, text=node.display_icon, font=("Segoe UI", 16))
        icon_lbl.pack(side=tk.LEFT, padx=(0, 6))

        title_sub = ttk.Frame(hdr_frame)
        title_sub.pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Label(title_sub, text=node.label, font=("Segoe UI", 10, "bold"), wraplength=180).pack(anchor="w")
        ttk.Label(title_sub, text=node.type_label, font=("Segoe UI", 8), foreground="#64748b").pack(anchor="w")

        sep = ttk.Separator(self.container, orient="horizontal")
        sep.pack(fill=tk.X, pady=6)

        # Form Alanları
        # Tür Değiştirici
        ttk.Label(self.container, text="Tür:", font=("Segoe UI", 8, "bold")).pack(anchor="w")
        type_var = tk.StringVar(value=node.type.value)
        type_combo = ttk.Combobox(self.container, textvariable=type_var, state="readonly")
        type_list = list(NODE_TYPE_META.keys())
        type_combo['values'] = [f"{NODE_TYPE_META[k]['icon']} {NODE_TYPE_META[k]['label']}" for k in type_list]
        type_combo.current(type_list.index(node.type) if node.type in type_list else 0)
        type_combo.pack(fill=tk.X, pady=(0, 6))

        # Ad / Başlık
        ttk.Label(self.container, text="Ad / Başlık:", font=("Segoe UI", 8, "bold")).pack(anchor="w")
        lbl_entry = ttk.Entry(self.container)
        lbl_entry.insert(0, node.label)
        lbl_entry.pack(fill=tk.X, pady=(0, 6))

        # Değer
        ttk.Label(self.container, text="Değer / Veri:", font=("Segoe UI", 8, "bold")).pack(anchor="w")
        val_entry = ttk.Entry(self.container)
        val_entry.insert(0, node.value)
        val_entry.pack(fill=tk.X, pady=(0, 6))

        # Güven Derecesi
        conf_hdr = ttk.Frame(self.container)
        conf_hdr.pack(fill=tk.X)
        ttk.Label(conf_hdr, text="Güven Seviyesi:", font=("Segoe UI", 8, "bold")).pack(side=tk.LEFT)
        conf_val_lbl = ttk.Label(conf_hdr, text=f"%{node.confidence}", font=("Segoe UI", 8, "bold"), foreground="#2563eb")
        conf_val_lbl.pack(side=tk.RIGHT)

        conf_var = tk.IntVar(value=node.confidence)
        conf_slider = ttk.Scale(self.container, from_=10, to=100, variable=conf_var, command=lambda v: conf_val_lbl.config(text=f"%{int(float(v))}"))
        conf_slider.pack(fill=tk.X, pady=(0, 6))

        # Etiketler
        ttk.Label(self.container, text="Etiketler (Virgülle ayırın):", font=("Segoe UI", 8, "bold")).pack(anchor="w")
        tags_entry = ttk.Entry(self.container)
        tags_entry.insert(0, ", ".join(node.tags))
        tags_entry.pack(fill=tk.X, pady=(0, 6))

        # Notlar
        ttk.Label(self.container, text="Notlar:", font=("Segoe UI", 8, "bold")).pack(anchor="w")
        notes_box = tk.Text(self.container, height=4, font=("Segoe UI", 8))
        notes_box.insert("1.0", node.notes)
        notes_box.pack(fill=tk.X, pady=(0, 8))

        # Kaydet Butonu
        def save_changes():
            try:
                sel_idx = type_combo.current()
                node.type = type_list[sel_idx]
            except Exception:
                pass
            node.label = lbl_entry.get().strip() or node.label
            node.value = val_entry.get().strip()
            node.confidence = int(conf_var.get())
            raw_tags = tags_entry.get().strip()
            node.tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
            node.notes = notes_box.get("1.0", tk.END).strip()
            self.on_node_updated(node)
            messagebox.showinfo("Güncellendi", "Düğüm özellikleri kaydedildi.", parent=self)

        ttk.Button(self.container, text="💾 Değişiklikleri Kaydet", command=save_changes).pack(fill=tk.X, pady=(0, 8))

        # Bağlantılı Komşular Listesi
        neighbors = self.project.get_connected_nodes(node.id)
        if neighbors:
            nbr_frame = ttk.LabelFrame(self.container, text=f"Bağlantılı Varlıklar ({len(neighbors)})", padding=6)
            nbr_frame.pack(fill=tk.X, pady=(0, 8))
            for nbr in neighbors[:5]:
                nbr_row = ttk.Frame(nbr_frame)
                nbr_row.pack(fill=tk.X, pady=1)
                ttk.Label(nbr_row, text=f"{nbr.display_icon} {nbr.label[:16]}", font=("Segoe UI", 8)).pack(side=tk.LEFT)
                btn = ttk.Button(nbr_row, text="Odaklan", width=8, command=lambda nid=nbr.id: self.on_focus_node(nid))
                btn.pack(side=tk.RIGHT)

        # Hızlı Eylem Butonları
        actions_frame = ttk.Frame(self.container)
        actions_frame.pack(fill=tk.X, pady=(4, 0))

        ttk.Button(actions_frame, text="🔗 Bağlantı Kur", command=lambda: self.on_connect_node_requested(node.id)).pack(fill=tk.X, pady=2)
        ttk.Button(actions_frame, text="📋 Düğümü Klonla", command=lambda: self.on_clone_node_requested(node.id)).pack(fill=tk.X, pady=2)
        ttk.Button(actions_frame, text="🗑️ Düğümü Sil", command=lambda: self._confirm_delete_node(node.id)).pack(fill=tk.X, pady=2)

    def _confirm_delete_node(self, node_id: str):
        if messagebox.askyesno("Düğüm Sil", "Bu düğümü ve tüm bağlantılarını silmek istediğinize emin misiniz?", parent=self):
            self.on_node_deleted(node_id)
            self.show_project_summary()

    # -------------------------------------------------------------
    # 3. KENAR SEÇİMİ: KENAR ÖZELLİKLERİ
    # -------------------------------------------------------------
    def show_edge(self, edge: Edge):
        self.clear()
        self.current_edge = edge
        self.current_node = None

        src_node = self.project.get_node(edge.source)
        tgt_node = self.project.get_node(edge.target)

        ttk.Label(self.container, text="🔗 İlişki Detayları", font=("Segoe UI", 11, "bold")).pack(anchor="w", pady=(0, 6))

        info_box = ttk.LabelFrame(self.container, text="Bağlantı Akışı", padding=8)
        info_box.pack(fill=tk.X, pady=(0, 8))

        src_lbl = f"{src_node.display_icon} {src_node.label}" if src_node else edge.source
        tgt_lbl = f"{tgt_node.display_icon} {tgt_node.label}" if tgt_node else edge.target

        ttk.Label(info_box, text=f"Kaynak: {src_lbl}", font=("Segoe UI", 8, "bold")).pack(anchor="w")
        ttk.Label(info_box, text=f"Hedef:  {tgt_lbl}", font=("Segoe UI", 8, "bold")).pack(anchor="w")

        # İlişki Adı
        ttk.Label(self.container, text="İlişki Tanımı / Etiketi:", font=("Segoe UI", 8, "bold")).pack(anchor="w")
        rel_entry = ttk.Entry(self.container)
        rel_entry.insert(0, edge.relation)
        rel_entry.pack(fill=tk.X, pady=(0, 6))

        # Yön
        ttk.Label(self.container, text="Yön:", font=("Segoe UI", 8, "bold")).pack(anchor="w")
        dir_var = tk.StringVar(value=edge.direction.value if hasattr(edge.direction, "value") else str(edge.direction))
        dir_frame = ttk.Frame(self.container)
        dir_frame.pack(fill=tk.X, pady=(0, 6))
        ttk.Radiobutton(dir_frame, text="➔", variable=dir_var, value="directed").pack(side=tk.LEFT, padx=(0, 8))
        ttk.Radiobutton(dir_frame, text="↔", variable=dir_var, value="bidirectional").pack(side=tk.LEFT, padx=(0, 8))
        ttk.Radiobutton(dir_frame, text="—", variable=dir_var, value="undirected").pack(side=tk.LEFT)

        # Çizgi Stili
        ttk.Label(self.container, text="Çizgi Stili:", font=("Segoe UI", 8, "bold")).pack(anchor="w")
        style_var = tk.StringVar(value=edge.style.value if hasattr(edge.style, "value") else str(edge.style))
        st_frame = ttk.Frame(self.container)
        st_frame.pack(fill=tk.X, pady=(0, 8))
        ttk.Radiobutton(st_frame, text="Düz", variable=style_var, value="solid").pack(side=tk.LEFT, padx=(0, 8))
        ttk.Radiobutton(st_frame, text="Kesikli", variable=style_var, value="dashed").pack(side=tk.LEFT, padx=(0, 8))
        ttk.Radiobutton(st_frame, text="Noktalı", variable=style_var, value="dotted").pack(side=tk.LEFT)

        def save_edge():
            edge.relation = rel_entry.get().strip() or "Bağlantılı"
            edge.label = edge.relation
            try:
                edge.direction = EdgeDirection(dir_var.get())
            except ValueError:
                pass
            try:
                edge.style = EdgeStyle(style_var.get())
            except ValueError:
                pass
            self.on_edge_updated(edge)
            messagebox.showinfo("Güncellendi", "İlişki özellikleri güncellendi.", parent=self)

        ttk.Button(self.container, text="💾 İlişkiyi Kaydet", command=save_edge).pack(fill=tk.X, pady=(0, 8))

        def delete_edge():
            if messagebox.askyesno("Bağlantı Sil", "Bu bağlantıyı silmek istediğinize emin misiniz?", parent=self):
                self.on_edge_deleted(edge.id)
                self.show_project_summary()

        ttk.Button(self.container, text="🗑️ Bağlantıyı Sil", command=delete_edge).pack(fill=tk.X)
