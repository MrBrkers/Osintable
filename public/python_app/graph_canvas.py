"""
OsintDesk - Etkileşimli Ağ Tuvali (Interactive Graph Canvas)
Tkinter Canvas tabanlı, donanım bağımsız, Windows ve Linux uyumlu grafik görselleştirici
"""

import tkinter as tk
from tkinter import font
import math
from typing import List, Dict, Set, Optional, Callable, Tuple
from .models import Project, Node, Edge, NodeType, NODE_TYPE_META, EdgeDirection, EdgeStyle


class GraphCanvas(tk.Frame):
    def __init__(
        self,
        master,
        project: Project,
        on_node_selected: Optional[Callable[[Optional[Node]], None]] = None,
        on_edge_selected: Optional[Callable[[Optional[Edge]], None]] = None,
        on_node_double_click: Optional[Callable[[Node], None]] = None,
        on_graph_modified: Optional[Callable[[], None]] = None,
        on_delete_edge_requested: Optional[Callable[[str], None]] = None,
        on_edit_edge_requested: Optional[Callable[[Edge], None]] = None,
        on_copy_requested: Optional[Callable[[], None]] = None,
        on_paste_requested: Optional[Callable[[], None]] = None,
        on_duplicate_requested: Optional[Callable[[], None]] = None,
        on_add_node_requested: Optional[Callable[[], None]] = None,
        on_connect_node_requested: Optional[Callable[[str], None]] = None,
        on_delete_node_requested: Optional[Callable[[str], None]] = None,
        **kwargs
    ):
        super().__init__(master, **kwargs)
        self.project = project
        self.on_node_selected = on_node_selected
        self.on_edge_selected = on_edge_selected
        self.on_node_double_click = on_node_double_click
        self.on_graph_modified = on_graph_modified
        self.on_delete_edge_requested = on_delete_edge_requested
        self.on_edit_edge_requested = on_edit_edge_requested
        self.on_copy_requested = on_copy_requested
        self.on_paste_requested = on_paste_requested
        self.on_duplicate_requested = on_duplicate_requested
        self.on_add_node_requested = on_add_node_requested
        self.on_connect_node_requested = on_connect_node_requested
        self.on_delete_node_requested = on_delete_node_requested

        # Sağ tık / Sürükleme durumu
        self.right_press_start_x = 0
        self.right_press_start_y = 0
        self.is_right_dragging = False

        # Görünüm dönüşümleri (Pan & Zoom)
        self.scale: float = 1.0
        self.offset_x: float = 400.0
        self.offset_y: float = 300.0

        # Seçim durumları
        self.selected_node_ids: Set[str] = set()
        self.selected_edge_id: Optional[str] = None
        self.hovered_node_id: Optional[str] = None

        # Sürükleme ve etkileşim durumları
        self.is_dragging_nodes = False
        self.is_panning = False
        self.is_box_selecting = False
        self.drag_start_x = 0
        self.drag_start_y = 0
        self.box_select_start = (0, 0)
        self.pan_mode = False  # El aracı modu

        # Arama ve filtre vurgulama
        self.search_query: str = ""
        self.highlighted_node_ids: Set[str] = set()
        self.visible_types: Set[NodeType] = set(NodeType)

        # Tema modu
        self.dark_mode: bool = False

        # Tkinter Canvas
        self.canvas = tk.Canvas(
            self,
            bg="#f1f5f9" if not self.dark_mode else "#0f172a",
            highlightthickness=0,
            cursor="arrow"
        )
        self.canvas.pack(fill=tk.BOTH, expand=True)

        # Olay Dinleyicileri (Event Bindings - Windows & Linux uyumlu)
        self._bind_events()

        # İlk çizim
        self.after(50, self.fit_to_screen)

    def _bind_events(self):
        # Sol tık (Tıklama, Düğüm seçme & Sürükleme)
        self.canvas.bind("<ButtonPress-1>", self._on_left_press)
        self.canvas.bind("<B1-Motion>", self._on_left_motion)
        self.canvas.bind("<ButtonRelease-1>", self._on_left_release)
        self.canvas.bind("<Double-Button-1>", self._on_double_click)

        # Orta tık (Tuval Kaydırma - Pan)
        self.canvas.bind("<ButtonPress-2>", self._on_pan_press)
        self.canvas.bind("<B2-Motion>", self._on_pan_motion)
        self.canvas.bind("<ButtonRelease-2>", self._on_pan_release)

        # Sağ tık (Bağlantı & Düğüm Bağlam Menüsü veya Sürükleyerek Kaydırma)
        self.canvas.bind("<ButtonPress-3>", self._on_right_press)
        self.canvas.bind("<B3-Motion>", self._on_right_motion)
        self.canvas.bind("<ButtonRelease-3>", self._on_right_release)

        # Fare Hareketi (Hover & Tooltip)
        self.canvas.bind("<Motion>", self._on_mouse_move)

        # Fare Tekerleği (Zoom) - Windows
        self.canvas.bind("<MouseWheel>", self._on_mouse_wheel_windows)
        # Fare Tekerleği (Zoom) - Linux
        self.canvas.bind("<Button-4>", self._on_mouse_wheel_linux_up)
        self.canvas.bind("<Button-5>", self._on_mouse_wheel_linux_down)

        # Boyut değişimi
        self.canvas.bind("<Configure>", lambda e: self.redraw())

    # -------------------------------------------------------------
    # KOORDİNAT DÖNÜŞÜMLERİ (World <-> Screen)
    # -------------------------------------------------------------
    def world_to_screen(self, wx: float, wy: float) -> Tuple[float, float]:
        sx = wx * self.scale + self.offset_x
        sy = wy * self.scale + self.offset_y
        return sx, sy

    def screen_to_world(self, sx: float, sy: float) -> Tuple[float, float]:
        wx = (sx - self.offset_x) / self.scale
        wy = (sy - self.offset_y) / self.scale
        return wx, wy

    # -------------------------------------------------------------
    # ÇİZİM MOTORU (REDRAW)
    # -------------------------------------------------------------
    def set_theme(self, dark: bool):
        self.dark_mode = dark
        bg_col = "#0f172a" if self.dark_mode else "#f8fafc"
        self.canvas.configure(bg=bg_col)
        self.redraw()

    def set_search_query(self, query: str):
        self.search_query = query.strip().lower()
        if not self.search_query:
            self.highlighted_node_ids.clear()
        else:
            self.highlighted_node_ids = {
                n.id for n in self.project.nodes
                if self.search_query in n.label.lower() or
                   self.search_query in n.value.lower() or
                   self.search_query in n.notes.lower() or
                   any(self.search_query in t.lower() for t in n.tags)
            }
        self.redraw()

    def redraw(self):
        self.canvas.delete("all")

        # 1. Izgara Çizimi (Grid Dots)
        self._draw_grid()

        # 2. Kenarları (İlişkileri) Çiz
        self._draw_edges()

        # 3. Düğümleri Çiz
        self._draw_nodes()

        # 4. Seçim Kutusu (Marquee)
        if self.is_box_selecting:
            self._draw_selection_box()

    def _draw_grid(self):
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        if w <= 1 or h <= 1:
            return

        grid_spacing = 40.0 * self.scale
        if grid_spacing < 15.0:
            return

        grid_color = "#1e293b" if self.dark_mode else "#e2e8f0"
        dot_color = "#334155" if self.dark_mode else "#cbd5e1"

        start_x = self.offset_x % grid_spacing
        start_y = self.offset_y % grid_spacing

        # Izgara noktaları
        x = start_x
        while x < w:
            y = start_y
            while y < h:
                self.canvas.create_rectangle(x, y, x + 1.5, y + 1.5, fill=dot_color, outline="", tags="grid")
                y += grid_spacing
            x += grid_spacing

    def _draw_edges(self):
        for edge in self.project.edges:
            src_node = self.project.get_node(edge.source)
            tgt_node = self.project.get_node(edge.target)
            if not src_node or not tgt_node:
                continue

            # Filtre kontrolü
            if src_node.type not in self.visible_types or tgt_node.type not in self.visible_types:
                continue

            sx1, sy1 = self.world_to_screen(src_node.x, src_node.y)
            sx2, sy2 = self.world_to_screen(tgt_node.x, tgt_node.y)

            is_selected = (edge.id == self.selected_edge_id)
            is_connected_to_selection = (src_node.id in self.selected_node_ids or tgt_node.id in self.selected_node_ids)

            # Çizgi rengi ve kalınlığı
            if is_selected:
                line_color = "#ef4444"
                line_width = max(2.5, 3.5 * self.scale)
            elif is_connected_to_selection:
                line_color = "#3b82f6"
                line_width = max(2.0, 2.5 * self.scale)
            else:
                line_color = "#64748b" if not self.dark_mode else "#94a3b8"
                line_width = max(1.2, 1.8 * self.scale)

            # Çizgi stili (Dashed / Dotted)
            dash = None
            if edge.style == EdgeStyle.DASHED:
                dash = (6, 4)
            elif edge.style == EdgeStyle.DOTTED:
                dash = (2, 4)

            # Ok yönü
            arrow_type = None
            if edge.direction == EdgeDirection.DIRECTED:
                arrow_type = tk.LAST
            elif edge.direction == EdgeDirection.BIDIRECTIONAL:
                arrow_type = tk.BOTH

            # Kenar çizgisi
            edge_tag = f"edge_{edge.id}"
            line_id = self.canvas.create_line(
                sx1, sy1, sx2, sy2,
                fill=line_color,
                width=line_width,
                dash=dash,
                arrow=arrow_type,
                arrowshape=(10 * self.scale, 12 * self.scale, 5 * self.scale),
                tags=("edge", edge_tag)
            )

            # İlişki Etiketi (Orta nokta kartı)
            if self.scale > 0.4 and (edge.relation or edge.label):
                mid_x = (sx1 + sx2) / 2.0
                mid_y = (sy1 + sy2) / 2.0
                lbl_text = edge.relation or edge.label

                # Pill arkaplan
                text_len = len(lbl_text)
                pw = max(40, text_len * 6.5) * min(1.2, max(0.8, self.scale))
                ph = 16 * min(1.2, max(0.8, self.scale))

                bg_fill = "#ffffff" if not self.dark_mode else "#1e293b"
                border_col = line_color if (is_selected or is_connected_to_selection) else "#94a3b8"

                self.canvas.create_rectangle(
                    mid_x - pw / 2, mid_y - ph / 2,
                    mid_x + pw / 2, mid_y + ph / 2,
                    fill=bg_fill,
                    outline=border_col,
                    width=1.0,
                    tags=("edge_label", edge_tag)
                )

                font_size = max(7, int(8 * min(1.2, max(0.7, self.scale))))
                self.canvas.create_text(
                    mid_x, mid_y,
                    text=lbl_text,
                    fill="#0f172a" if not self.dark_mode else "#f1f5f9",
                    font=("Segoe UI", font_size, "bold"),
                    tags=("edge_label", edge_tag)
                )

    def _draw_nodes(self):
        for node in self.project.nodes:
            if node.type not in self.visible_types:
                continue

            sx, sy = self.world_to_screen(node.x, node.y)

            # Düğüm boyutları (Dünya ölçeğine göre)
            nw = node.width * self.scale
            nh = node.height * self.scale

            x1 = sx - nw / 2
            y1 = sy - nh / 2
            x2 = sx + nw / 2
            y2 = sy + nh / 2

            is_selected = node.id in self.selected_node_ids
            is_hovered = (node.id == self.hovered_node_id)
            is_matched = bool(self.search_query and node.id in self.highlighted_node_ids)
            is_dimmed = bool(self.search_query and node.id not in self.highlighted_node_ids)

            node_tag = f"node_{node.id}"
            card_color = "#ffffff" if not self.dark_mode else "#1e293b"
            if is_dimmed:
                card_color = "#f1f5f9" if not self.dark_mode else "#0f172a"

            # 1. Seçim Parıltısı / Vurgu Halkası
            if is_selected:
                glow_pad = 6 * self.scale
                self.canvas.create_rectangle(
                    x1 - glow_pad, y1 - glow_pad,
                    x2 + glow_pad, y2 + glow_pad,
                    outline="#3b82f6",
                    width=max(2.0, 3.0 * self.scale),
                    dash=(4, 2),
                    tags=("selection_halo", node_tag)
                )
            elif is_matched:
                glow_pad = 5 * self.scale
                self.canvas.create_rectangle(
                    x1 - glow_pad, y1 - glow_pad,
                    x2 + glow_pad, y2 + glow_pad,
                    outline="#eab308",
                    width=max(2.0, 3.0 * self.scale),
                    tags=("search_glow", node_tag)
                )

            # 2. Kart Gövdesi
            border_color = node.display_color if not is_dimmed else "#cbd5e1"
            border_width = 2.0 if is_selected else (1.5 if not is_dimmed else 1.0)

            self.canvas.create_rectangle(
                x1, y1, x2, y2,
                fill=card_color,
                outline=border_color,
                width=border_width,
                tags=("node_card", node_tag)
            )

            # 3. Üst Renkli Başlık Şeridi
            header_h = 18 * self.scale
            self.canvas.create_rectangle(
                x1, y1, x2, y1 + header_h,
                fill=node.display_color if not is_dimmed else "#94a3b8",
                outline="",
                tags=("node_header", node_tag)
            )

            # 4. Başlık Şeridi İkonu ve Tür Adı
            if self.scale > 0.35:
                header_font_size = max(7, int(8 * self.scale))
                header_text = f"{node.display_icon} {node.type_label}"
                self.canvas.create_text(
                    x1 + 6 * self.scale, y1 + header_h / 2,
                    text=header_text,
                    anchor="w",
                    fill="#ffffff",
                    font=("Segoe UI", header_font_size, "bold"),
                    tags=("node_text", node_tag)
                )

                # Güven Derecesi (%)
                conf_text = f"%{node.confidence}"
                self.canvas.create_text(
                    x2 - 6 * self.scale, y1 + header_h / 2,
                    text=conf_text,
                    anchor="e",
                    fill="#ffffff",
                    font=("Segoe UI", max(6, int(7 * self.scale)), "bold"),
                    tags=("node_text", node_tag)
                )

            # 5. Ana Etiket (Label) Metni
            if self.scale > 0.3:
                label_y = y1 + header_h + (nh - header_h) * 0.35
                lbl_font_size = max(8, int(10 * self.scale))
                lbl_color = "#0f172a" if not self.dark_mode else "#f8fafc"
                if is_dimmed:
                    lbl_color = "#94a3b8"

                display_lbl = node.label
                if len(display_lbl) > 22:
                    display_lbl = display_lbl[:20] + "..."

                self.canvas.create_text(
                    sx, label_y,
                    text=display_lbl,
                    fill=lbl_color,
                    font=("Segoe UI", lbl_font_size, "bold"),
                    tags=("node_text", node_tag)
                )

            # 6. Alt Değer / Not Metni
            if self.scale > 0.45:
                val_y = y1 + header_h + (nh - header_h) * 0.72
                val_font_size = max(7, int(8 * self.scale))
                val_color = "#64748b" if not self.dark_mode else "#94a3b8"

                display_val = node.value or (f"{len(node.tags)} etiket" if node.tags else "")
                if len(display_val) > 24:
                    display_val = display_val[:22] + "..."

                if display_val:
                    self.canvas.create_text(
                        sx, val_y,
                        text=display_val,
                        fill=val_color,
                        font=("Segoe UI", val_font_size),
                        tags=("node_text", node_tag)
                    )

    def _draw_selection_box(self):
        bx1, by1 = self.box_select_start
        bx2, by2 = self.drag_start_x, self.drag_start_y
        self.canvas.create_rectangle(
            min(bx1, bx2), min(by1, by2),
            max(bx1, bx2), max(by1, by2),
            outline="#2563eb",
            fill="",
            dash=(4, 2),
            width=1.5,
            tags="marquee"
        )

    # -------------------------------------------------------------
    # TIKLAMA VE ETKİLEŞİM İŞLEYİCİLERİ
    # -------------------------------------------------------------
    def _find_node_at(self, sx: float, sy: float) -> Optional[Node]:
        """Ekran koordinatında bulunan en üstteki düğümü döndürür."""
        wx, wy = self.screen_to_world(sx, sy)
        for node in reversed(self.project.nodes):
            if node.type not in self.visible_types:
                continue
            half_w = node.width / 2
            half_h = node.height / 2
            if (node.x - half_w <= wx <= node.x + half_w) and (node.y - half_h <= wy <= node.y + half_h):
                return node
        return None

    def _find_edge_at(self, sx: float, sy: float, tolerance: float = 8.0) -> Optional[Edge]:
        """Ekran koordinatında bulunan kenarı tespit eder."""
        for edge in self.project.edges:
            src = self.project.get_node(edge.source)
            tgt = self.project.get_node(edge.target)
            if not src or not tgt:
                continue
            sx1, sy1 = self.world_to_screen(src.x, src.y)
            sx2, sy2 = self.world_to_screen(tgt.x, tgt.y)

            # Nokta - doğru parçası mesafesi
            dist = self._point_to_line_dist(sx, sy, sx1, sy1, sx2, sy2)
            if dist <= tolerance:
                return edge
        return None

    def _point_to_line_dist(self, px, py, x1, y1, x2, y2) -> float:
        dx = x2 - x1
        dy = y2 - y1
        if dx == 0 and dy == 0:
            return math.hypot(px - x1, py - y1)
        t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
        t = max(0.0, min(1.0, t))
        nearest_x = x1 + t * dx
        nearest_y = y1 + t * dy
        return math.hypot(px - nearest_x, py - nearest_y)

    def _on_left_press(self, event):
        self.drag_start_x = event.x
        self.drag_start_y = event.y

        if self.pan_mode:
            self.is_panning = True
            return

        hit_node = self._find_node_at(event.x, event.y)
        shift_down = (event.state & 0x0001) != 0

        if hit_node:
            self.is_dragging_nodes = True
            if shift_down:
                if hit_node.id in self.selected_node_ids:
                    self.selected_node_ids.remove(hit_node.id)
                else:
                    self.selected_node_ids.add(hit_node.id)
            else:
                if hit_node.id not in self.selected_node_ids:
                    self.selected_node_ids = {hit_node.id}

            self.selected_edge_id = None
            if self.on_node_selected:
                self.on_node_selected(hit_node if hit_node.id in self.selected_node_ids else None)
            if self.on_edge_selected:
                self.on_edge_selected(None)
            self.redraw()
            return

        # Kenar tıklandı mı?
        hit_edge = self._find_edge_at(event.x, event.y)
        if hit_edge:
            self.selected_edge_id = hit_edge.id
            self.selected_node_ids.clear()
            if self.on_edge_selected:
                self.on_edge_selected(hit_edge)
            if self.on_node_selected:
                self.on_node_selected(None)
            self.redraw()
            return

        # Boş alana tıklandı -> Seçim kutusu başlat veya seçimi temizle
        if not shift_down:
            self.selected_node_ids.clear()
            self.selected_edge_id = None
            if self.on_node_selected:
                self.on_node_selected(None)
            if self.on_edge_selected:
                self.on_edge_selected(None)

        self.is_box_selecting = True
        self.box_select_start = (event.x, event.y)
        self.redraw()

    def _on_left_motion(self, event):
        dx = event.x - self.drag_start_x
        dy = event.y - self.drag_start_y

        if self.is_panning:
            self.offset_x += dx
            self.offset_y += dy
            self.drag_start_x = event.x
            self.drag_start_y = event.y
            self.redraw()
            return

        if self.is_dragging_nodes and self.selected_node_ids:
            world_dx = dx / self.scale
            world_dy = dy / self.scale

            for node_id in self.selected_node_ids:
                node = self.project.get_node(node_id)
                if node:
                    node.x += world_dx
                    node.y += world_dy

            self.drag_start_x = event.x
            self.drag_start_y = event.y
            self.redraw()
            return

        if self.is_box_selecting:
            self.drag_start_x = event.x
            self.drag_start_y = event.y
            self.redraw()

    def _on_left_release(self, event):
        if self.is_dragging_nodes:
            self.is_dragging_nodes = False
            if self.on_graph_modified:
                self.on_graph_modified()

        if self.is_panning:
            self.is_panning = False

        if self.is_box_selecting:
            self.is_box_selecting = False
            bx1, by1 = self.box_select_start
            bx2, by2 = event.x, event.y
            min_x, max_x = min(bx1, bx2), max(bx1, bx2)
            min_y, max_y = min(by1, by2), max(by1, by2)

            if (max_x - min_x) > 6 and (max_y - min_y) > 6:
                w_min_x, w_min_y = self.screen_to_world(min_x, min_y)
                w_max_x, w_max_y = self.screen_to_world(max_x, max_y)

                for node in self.project.nodes:
                    if node.type in self.visible_types:
                        if w_min_x <= node.x <= w_max_x and w_min_y <= node.y <= w_max_y:
                            self.selected_node_ids.add(node.id)

                if self.selected_node_ids and self.on_node_selected:
                    first_sel = self.project.get_node(next(iter(self.selected_node_ids)))
                    self.on_node_selected(first_sel)

            self.redraw()

    def _on_double_click(self, event):
        hit_node = self._find_node_at(event.x, event.y)
        if hit_node and self.on_node_double_click:
            self.on_node_double_click(hit_node)

    def _on_pan_press(self, event):
        self.is_panning = True
        self.drag_start_x = event.x
        self.drag_start_y = event.y
        self.canvas.configure(cursor="fleur")

    def _on_pan_motion(self, event):
        if self.is_panning:
            dx = event.x - self.drag_start_x
            dy = event.y - self.drag_start_y
            self.offset_x += dx
            self.offset_y += dy
            self.drag_start_x = event.x
            self.drag_start_y = event.y
            self.redraw()

    def _on_pan_release(self, event):
        self.is_panning = False
        self.canvas.configure(cursor="arrow")

    def _on_right_press(self, event):
        self.right_press_start_x = event.x
        self.right_press_start_y = event.y
        self.drag_start_x = event.x
        self.drag_start_y = event.y
        self.is_right_dragging = False

    def _on_right_motion(self, event):
        dx = event.x - self.right_press_start_x
        dy = event.y - self.right_press_start_y
        if math.hypot(dx, dy) > 5:
            self.is_right_dragging = True
            # Sağ tuşla sürükleme yapılınca tuval kaydırma (Pan)
            self.offset_x += (event.x - self.drag_start_x)
            self.offset_y += (event.y - self.drag_start_y)
            self.drag_start_x = event.x
            self.drag_start_y = event.y
            self.redraw()

    def _on_right_release(self, event):
        if self.is_right_dragging:
            self.is_right_dragging = False
            return

        # Sürüklenmedi, doğrudan sağ tık yapıldı: İlgili nesneye göre menü aç
        hit_edge = self._find_edge_at(event.x, event.y)
        if hit_edge:
            self.selected_edge_id = hit_edge.id
            self.selected_node_ids.clear()
            if self.on_edge_selected:
                self.on_edge_selected(hit_edge)
            if self.on_node_selected:
                self.on_node_selected(None)
            self.redraw()
            self._show_edge_context_menu(event, hit_edge)
            return

        hit_node = self._find_node_at(event.x, event.y)
        if hit_node:
            if hit_node.id not in self.selected_node_ids:
                self.selected_node_ids = {hit_node.id}
            self.selected_edge_id = None
            if self.on_node_selected:
                self.on_node_selected(hit_node)
            if self.on_edge_selected:
                self.on_edge_selected(None)
            self.redraw()
            self._show_node_context_menu(event, hit_node)
            return

        # Boş tuvale sağ tık
        self._show_canvas_context_menu(event)

    def _show_edge_context_menu(self, event, edge: Edge):
        """Bağlantı kablosuna / çizgisine sağ tıklandığında açılan menü."""
        menu = tk.Menu(self, tearoff=0)
        menu.add_command(
            label=f"🗑️ Bağlantıyı Kaldır / Sil ({edge.relation})",
            command=lambda: self._delete_edge_action(edge.id)
        )
        menu.add_separator()
        menu.add_command(
            label="✏️ İlişkiyi Düzenle...",
            command=lambda: self._edit_edge_action(edge)
        )
        menu.add_command(
            label="↔ Yönü Değiştir (Tek / Çift Yönlü)",
            command=lambda: self._toggle_edge_direction_action(edge)
        )

        style_sub = tk.Menu(menu, tearoff=0)
        style_sub.add_command(
            label="Düz Çizgi",
            command=lambda: self._set_edge_style_action(edge, EdgeStyle.SOLID)
        )
        style_sub.add_command(
            label="Kesikli Çizgi",
            command=lambda: self._set_edge_style_action(edge, EdgeStyle.DASHED)
        )
        style_sub.add_command(
            label="Noktalı Çizgi",
            command=lambda: self._set_edge_style_action(edge, EdgeStyle.DOTTED)
        )
        menu.add_cascade(label="Çizgi Stili", menu=style_sub)

        try:
            menu.tk_popup(event.x_root, event.y_root)
        finally:
            menu.grab_release()

    def _delete_edge_action(self, edge_id: str):
        if self.on_delete_edge_requested:
            self.on_delete_edge_requested(edge_id)
        else:
            self.project.remove_edge(edge_id)
            self.selected_edge_id = None
            self.redraw()
            if self.on_graph_modified:
                self.on_graph_modified()

    def _edit_edge_action(self, edge: Edge):
        if self.on_edit_edge_requested:
            self.on_edit_edge_requested(edge)

    def _toggle_edge_direction_action(self, edge: Edge):
        if edge.direction == EdgeDirection.DIRECTED:
            edge.direction = EdgeDirection.BIDIRECTIONAL
        elif edge.direction == EdgeDirection.BIDIRECTIONAL:
            edge.direction = EdgeDirection.UNDIRECTED
        else:
            edge.direction = EdgeDirection.DIRECTED
        self.redraw()
        if self.on_graph_modified:
            self.on_graph_modified()

    def _set_edge_style_action(self, edge: Edge, style: EdgeStyle):
        edge.style = style
        self.redraw()
        if self.on_graph_modified:
            self.on_graph_modified()

    def _show_node_context_menu(self, event, node: Node):
        """Düğüme sağ tıklandığında açılan menü."""
        menu = tk.Menu(self, tearoff=0)
        menu.add_command(
            label=f"📋 Kopyala (Ctrl+C)",
            command=lambda: self.on_copy_requested() if self.on_copy_requested else None
        )
        menu.add_command(
            label=f"📑 Çoğalt / Klonla (Ctrl+D)",
            command=lambda: self.on_duplicate_requested() if self.on_duplicate_requested else None
        )
        menu.add_command(
            label=f"🔗 Başka Düğüme Bağla...",
            command=lambda: self.on_connect_node_requested(node.id) if self.on_connect_node_requested else None
        )
        menu.add_separator()
        menu.add_command(
            label=f"🗑️ Düğümü Sil (Delete)",
            command=lambda: self.on_delete_node_requested(node.id) if self.on_delete_node_requested else self._delete_node_internal(node.id)
        )
        try:
            menu.tk_popup(event.x_root, event.y_root)
        finally:
            menu.grab_release()

    def _delete_node_internal(self, node_id: str):
        self.project.remove_node(node_id)
        self.selected_node_ids.discard(node_id)
        self.redraw()
        if self.on_graph_modified:
            self.on_graph_modified()

    def _show_canvas_context_menu(self, event):
        """Boş tuvale sağ tıklandığında açılan menü."""
        menu = tk.Menu(self, tearoff=0)
        menu.add_command(
            label="📋 Yapıştır (Ctrl+V)",
            command=lambda: self.on_paste_requested() if self.on_paste_requested else None
        )
        menu.add_command(
            label="➕ Yeni Düğüm Ekle...",
            command=lambda: self.on_add_node_requested() if self.on_add_node_requested else None
        )
        menu.add_separator()
        menu.add_command(
            label="⛶ Ekrana Sığdır (Ctrl+0)",
            command=self.fit_to_screen
        )
        menu.add_command(
            label="Tümünü Seç (Ctrl+A)",
            command=self.select_all_nodes
        )
        try:
            menu.tk_popup(event.x_root, event.y_root)
        finally:
            menu.grab_release()

    def select_all_nodes(self):
        self.selected_node_ids = {n.id for n in self.project.nodes if n.type in self.visible_types}
        self.selected_edge_id = None
        self.redraw()
        if self.selected_node_ids and self.on_node_selected:
            first_sel = self.project.get_node(next(iter(self.selected_node_ids)))
            self.on_node_selected(first_sel)

    def _on_mouse_move(self, event):
        hit_node = self._find_node_at(event.x, event.y)
        new_hover = hit_node.id if hit_node else None
        if new_hover != self.hovered_node_id:
            self.hovered_node_id = new_hover
            if not self.is_dragging_nodes and not self.is_panning:
                self.canvas.configure(cursor="hand2" if hit_node else "arrow")

    # -------------------------------------------------------------
    # ZOOM İŞLEMLERİ (İmleç Odaklı Yakınlaştırma)
    # -------------------------------------------------------------
    def _zoom_at(self, factor: float, cx: float, cy: float):
        old_scale = self.scale
        new_scale = max(0.15, min(4.0, old_scale * factor))
        if new_scale == old_scale:
            return

        # İmleç dünya pozisyonunu koruyarak ölçekle
        wx, wy = self.screen_to_world(cx, cy)
        self.scale = new_scale
        self.offset_x = cx - wx * self.scale
        self.offset_y = cy - wy * self.scale
        self.redraw()

    def _on_mouse_wheel_windows(self, event):
        factor = 1.15 if event.delta > 0 else 0.85
        self._zoom_at(factor, event.x, event.y)

    def _on_mouse_wheel_linux_up(self, event):
        self._zoom_at(1.15, event.x, event.y)

    def _on_mouse_wheel_linux_down(self, event):
        self._zoom_at(0.85, event.x, event.y)

    def zoom_in(self):
        cx = self.canvas.winfo_width() / 2.0
        cy = self.canvas.winfo_height() / 2.0
        self._zoom_at(1.2, cx, cy)

    def zoom_out(self):
        cx = self.canvas.winfo_width() / 2.0
        cy = self.canvas.winfo_height() / 2.0
        self._zoom_at(0.8, cx, cy)

    def reset_zoom(self):
        self.scale = 1.0
        self.redraw()

    def fit_to_screen(self):
        """Tüm düğümleri kapsayacak şekilde görünümü otomatik ortalar."""
        if not self.project.nodes:
            self.scale = 1.0
            self.offset_x = self.canvas.winfo_width() / 2.0
            self.offset_y = self.canvas.winfo_height() / 2.0
            self.redraw()
            return

        xs = [n.x for n in self.project.nodes]
        ys = [n.y for n in self.project.nodes]
        min_x, max_x = min(xs) - 80, max(xs) + 80
        min_y, max_y = min(ys) - 60, max(ys) + 60

        graph_w = max(100.0, max_x - min_x)
        graph_h = max(100.0, max_y - min_y)

        vw = max(100, self.canvas.winfo_width() - 80)
        vh = max(100, self.canvas.winfo_height() - 80)

        scale_x = vw / graph_w
        scale_y = vh / graph_h
        self.scale = max(0.2, min(1.4, min(scale_x, scale_y)))

        center_wx = (min_x + max_x) / 2.0
        center_wy = (min_y + max_y) / 2.0

        self.offset_x = (self.canvas.winfo_width() / 2.0) - center_wx * self.scale
        self.offset_y = (self.canvas.winfo_height() / 2.0) - center_wy * self.scale
        self.redraw()

    def center_on_node(self, node_id: str):
        node = self.project.get_node(node_id)
        if not node:
            return
        cw = self.canvas.winfo_width() / 2.0
        ch = self.canvas.winfo_height() / 2.0
        self.offset_x = cw - node.x * self.scale
        self.offset_y = ch - node.y * self.scale
        self.selected_node_ids = {node.id}
        self.selected_edge_id = None
        self.redraw()
