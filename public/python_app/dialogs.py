"""
OsintDesk - İletişim Pencereleri (Dialogs & Forms)
Windows ve Linux Tkinter uyumlu form pencereleri
"""

import tkinter as tk
from tkinter import ttk, messagebox
import re
import uuid
from typing import Optional, Callable, List
from .models import Project, Node, Edge, NodeType, NODE_TYPE_META, EdgeDirection, EdgeStyle


class AddNodeDialog(tk.Toplevel):
    def __init__(self, parent, project: Project, on_created: Callable[[Node], None], default_type: NodeType = NodeType.PERSON):
        super().__init__(parent)
        self.project = project
        self.on_created = on_created
        self.title("Yeni OSINT Düğümü Ekle")
        self.geometry("440x520")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()

        self._build_ui(default_type)
        self.center_window(parent)

    def center_window(self, parent):
        self.update_idletasks()
        pw = parent.winfo_width()
        ph = parent.winfo_height()
        px = parent.winfo_rootx()
        py = parent.winfo_rooty()
        w = self.winfo_width()
        h = self.winfo_height()
        self.geometry(f"+{px + (pw - w) // 2}+{py + (ph - h) // 2}")

    def _build_ui(self, default_type: NodeType):
        pad_frame = ttk.Frame(self, padding="16 16 16 16")
        pad_frame.pack(fill=tk.BOTH, expand=True)

        # 1. Düğüm Türü
        ttk.Label(pad_frame, text="Varlık Türü:", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self.type_var = tk.StringVar(value=default_type.value)
        type_combo = ttk.Combobox(pad_frame, textvariable=self.type_var, state="readonly")
        type_options = [(f"{meta['icon']} {meta['label']}", k.value) for k, meta in NODE_TYPE_META.items()]
        type_combo['values'] = [opt[0] for opt in type_options]
        type_combo.current(list(NODE_TYPE_META.keys()).index(default_type))
        type_combo.pack(fill=tk.X, pady=(0, 10))

        def on_type_select(event):
            idx = type_combo.current()
            if idx >= 0:
                self.type_var.set(list(NODE_TYPE_META.keys())[idx].value)
        type_combo.bind("<<ComboboxSelected>>", on_type_select)

        # 2. Etiket / İsim (Label)
        ttk.Label(pad_frame, text="Ad / Başlık (Label):", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self.label_entry = ttk.Entry(pad_frame)
        self.label_entry.pack(fill=tk.X, pady=(0, 10))
        self.label_entry.focus_set()

        # 3. Değer (Value - IP, Email, Domain, Sicil vb.)
        ttk.Label(pad_frame, text="Değer / Detay (Value):", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self.value_entry = ttk.Entry(pad_frame)
        self.value_entry.pack(fill=tk.X, pady=(0, 10))

        # 4. Güven Seviyesi (Confidence 0-100)
        conf_hdr = ttk.Frame(pad_frame)
        conf_hdr.pack(fill=tk.X, pady=(0, 4))
        ttk.Label(conf_hdr, text="Güven Seviyesi:", font=("Segoe UI", 9, "bold")).pack(side=tk.LEFT)
        self.conf_lbl = ttk.Label(conf_hdr, text="%85", font=("Segoe UI", 9, "bold"), foreground="#2563eb")
        self.conf_lbl.pack(side=tk.RIGHT)

        self.conf_var = tk.IntVar(value=85)
        def on_conf_change(val):
            self.conf_lbl.config(text=f"%{int(float(val))}")
        conf_scale = ttk.Scale(pad_frame, from_=10, to=100, variable=self.conf_var, command=on_conf_change)
        conf_scale.pack(fill=tk.X, pady=(0, 10))

        # 5. Etiketler (Tags - virgülle ayrılmış)
        ttk.Label(pad_frame, text="Etiketler (Virgülle ayırın):", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self.tags_entry = ttk.Entry(pad_frame)
        self.tags_entry.pack(fill=tk.X, pady=(0, 10))

        # 6. Notlar (Notes)
        ttk.Label(pad_frame, text="İstihbarat / Araştırma Notu:", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self.notes_text = tk.Text(pad_frame, height=4, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        self.notes_text.pack(fill=tk.X, pady=(0, 14))

        # Butonlar
        btn_frame = ttk.Frame(pad_frame)
        btn_frame.pack(fill=tk.X)

        cancel_btn = ttk.Button(btn_frame, text="İptal", command=self.destroy)
        cancel_btn.pack(side=tk.RIGHT, padx=(8, 0))

        save_btn = ttk.Button(btn_frame, text="✔ Düğümü Ekle", command=self._save)
        save_btn.pack(side=tk.RIGHT)

    def _save(self):
        lbl = self.label_entry.get().strip()
        if not lbl:
            messagebox.showwarning("Eksik Bilgi", "Lütfen düğüm için bir ad veya başlık girin.", parent=self)
            return

        try:
            ntype = NodeType(self.type_var.get())
        except ValueError:
            ntype = NodeType.PERSON

        val = self.value_entry.get().strip()
        tags_raw = self.tags_entry.get().strip()
        tags = [t.strip() for t in tags_raw.split(",") if t.strip()]
        notes = self.notes_text.get("1.0", tk.END).strip()
        conf = self.conf_var.get()

        new_node = Node(
            id=f"node_{uuid.uuid4().hex[:8]}",
            type=ntype,
            label=lbl,
            value=val,
            x=0.0,
            y=0.0,
            notes=notes,
            tags=tags,
            confidence=conf,
        )

        self.on_created(new_node)
        self.destroy()


class BatchAddNodesDialog(tk.Toplevel):
    """Metin yapıştırarak çok sayıda varlığı otomatik tespit edip toplu ekleme penceresi."""
    def __init__(self, parent, project: Project, on_batch_created: Callable[[List[Node]], None]):
        super().__init__(parent)
        self.project = project
        self.on_batch_created = on_batch_created
        self.title("Toplu Düğüm İçe Aktar (Batch Import)")
        self.geometry("520x480")
        self.transient(parent)
        self.grab_set()

        self._build_ui()

    def _detect_type(self, text: str) -> NodeType:
        t = text.strip().lower()
        if re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", t):
            return NodeType.EMAIL
        if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", t):
            return NodeType.IP
        if re.match(r"^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$", t):
            return NodeType.DOMAIN
        if re.match(r"^\+?\d{8,15}$", re.sub(r"[\s\-\(\)]", "", t)):
            return NodeType.PHONE
        if re.match(r"^[0-9a-f]{32}$|^[0-9a-f]{40}$|^[0-9a-f]{64}$", t):
            return NodeType.HASH
        if t.startswith("@"):
            return NodeType.SOCIAL
        if t.startswith("0x") and len(t) in [42, 66]:
            return NodeType.CRYPTO
        return NodeType.PERSON

    def _build_ui(self):
        f = ttk.Frame(self, padding="16")
        f.pack(fill=tk.BOTH, expand=True)

        ttk.Label(f, text="Her satıra bir hedef veri yapıştırın:", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        ttk.Label(
            f,
            text="E-posta, IP, Alan Adı, Telefon, Hash ve Sosyal Hesaplar otomatik tespit edilir.",
            font=("Segoe UI", 8),
            foreground="#64748b"
        ).pack(anchor="w", pady=(0, 8))

        self.text_box = tk.Text(f, height=14, font=("Consolas", 10))
        self.text_box.pack(fill=tk.BOTH, expand=True, pady=(0, 10))

        # Örnek metin
        sample_input = (
            "test-target@company.com\n"
            "185.199.108.153\n"
            "api.target-service.org\n"
            "+905321112233\n"
            "@hacker_profile\n"
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n"
            "Hedef Şirket A.Ş.\n"
        )
        self.text_box.insert("1.0", sample_input)

        btn_bar = ttk.Frame(f)
        btn_bar.pack(fill=tk.X)

        ttk.Button(btn_bar, text="İptal", command=self.destroy).pack(side=tk.RIGHT, padx=(8, 0))
        ttk.Button(btn_bar, text="✔ Toplu Ekle", command=self._process).pack(side=tk.RIGHT)

    def _process(self):
        lines = self.text_box.get("1.0", tk.END).strip().splitlines()
        created_nodes: List[Node] = []

        for line in lines:
            line = line.strip()
            if not line:
                continue
            ntype = self._detect_type(line)
            clean_label = line
            clean_val = ""

            if ntype in [NodeType.EMAIL, NodeType.IP, NodeType.DOMAIN, NodeType.PHONE, NodeType.HASH, NodeType.CRYPTO]:
                clean_val = line

            node = Node(
                id=f"node_{uuid.uuid4().hex[:8]}",
                type=ntype,
                label=clean_label,
                value=clean_val,
                confidence=85,
                tags=["toplu-ekleme"]
            )
            created_nodes.append(node)

        if not created_nodes:
            messagebox.showwarning("Boş Giriş", "Eklenecek geçerli bir veri satırı bulunamadı.", parent=self)
            return

        self.on_batch_created(created_nodes)
        self.destroy()


class ConnectNodesDialog(tk.Toplevel):
    """İki düğüm arasında ilişki (Kenar) kurma penceresi."""
    def __init__(self, parent, project: Project, on_connected: Callable[[Edge], None], default_src: Optional[str] = None):
        super().__init__(parent)
        self.project = project
        self.on_connected = on_connected
        self.title("İki Düğümü Birbirine Bağla")
        self.geometry("440x420")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()

        self._build_ui(default_src)

    def _build_ui(self, default_src: Optional[str]):
        f = ttk.Frame(self, padding="16")
        f.pack(fill=tk.BOTH, expand=True)

        node_names = [(n.id, f"{n.display_icon} {n.label}") for n in self.project.nodes]
        name_list = [item[1] for item in node_names]
        id_list = [item[0] for item in node_names]

        # 1. Kaynak Düğüm
        ttk.Label(f, text="Kaynak Düğüm (Source):", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self.src_combo = ttk.Combobox(f, values=name_list, state="readonly")
        self.src_combo.pack(fill=tk.X, pady=(0, 10))
        if default_src and default_src in id_list:
            self.src_combo.current(id_list.index(default_src))
        elif name_list:
            self.src_combo.current(0)

        # 2. Hedef Düğüm
        ttk.Label(f, text="Hedef Düğüm (Target):", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self.tgt_combo = ttk.Combobox(f, values=name_list, state="readonly")
        self.tgt_combo.pack(fill=tk.X, pady=(0, 10))
        if len(name_list) > 1:
            self.tgt_combo.current(1 if self.src_combo.current() == 0 else 0)

        # 3. İlişki Türü (Relation Label)
        ttk.Label(f, text="İlişki Tanımı / Etiketi:", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self.rel_entry = ttk.Combobox(f, values=[
            "Sahibi / Kurucu",
            "Yönetici",
            "Bağlantılı",
            "DNS Barındırma",
            "Kullanıcı / Üye",
            "İletişim Kurdu",
            "IP Çözümlemesi",
            "E-posta Sahibi",
            "Para Transferi",
            "Aynı Ağda Bulundu",
            "Fiziki Konum"
        ])
        self.rel_entry.set("Bağlantılı")
        self.rel_entry.pack(fill=tk.X, pady=(0, 10))

        # 4. Yön (Direction)
        ttk.Label(f, text="Bağlantı Yönü:", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self.dir_var = tk.StringVar(value="directed")
        dir_frame = ttk.Frame(f)
        dir_frame.pack(fill=tk.X, pady=(0, 10))
        ttk.Radiobutton(dir_frame, text="Tek Yönlü (➔)", variable=self.dir_var, value="directed").pack(side=tk.LEFT, padx=(0, 12))
        ttk.Radiobutton(dir_frame, text="Çift Yönlü (↔)", variable=self.dir_var, value="bidirectional").pack(side=tk.LEFT, padx=(0, 12))
        ttk.Radiobutton(dir_frame, text="Yönsüz (—)", variable=self.dir_var, value="undirected").pack(side=tk.LEFT)

        # 5. Çizgi Stili
        ttk.Label(f, text="Çizgi Stili:", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 4))
        self.style_var = tk.StringVar(value="solid")
        style_frame = ttk.Frame(f)
        style_frame.pack(fill=tk.X, pady=(0, 16))
        ttk.Radiobutton(style_frame, text="Düz Çizgi", variable=self.style_var, value="solid").pack(side=tk.LEFT, padx=(0, 12))
        ttk.Radiobutton(style_frame, text="Kesikli Çizgi", variable=self.style_var, value="dashed").pack(side=tk.LEFT, padx=(0, 12))
        ttk.Radiobutton(style_frame, text="Noktalı Çizgi", variable=self.style_var, value="dotted").pack(side=tk.LEFT)

        # Butonlar
        btn_bar = ttk.Frame(f)
        btn_bar.pack(fill=tk.X)
        ttk.Button(btn_bar, text="İptal", command=self.destroy).pack(side=tk.RIGHT, padx=(8, 0))
        ttk.Button(btn_bar, text="✔ Bağlantıyı Oluştur", command=self._save).pack(side=tk.RIGHT)

    def _save(self):
        s_idx = self.src_combo.current()
        t_idx = self.tgt_combo.current()

        if s_idx < 0 or t_idx < 0:
            messagebox.showwarning("Eksik Seçim", "Lütfen kaynak ve hedef düğümleri seçin.", parent=self)
            return

        if s_idx == t_idx:
            messagebox.showwarning("Geçersiz Bağlantı", "Düğüm kendisine bağlanamaz.", parent=self)
            return

        src_id = self.project.nodes[s_idx].id
        tgt_id = self.project.nodes[t_idx].id

        rel = self.rel_entry.get().strip() or "Bağlantılı"
        d = EdgeDirection(self.dir_var.get())
        st = EdgeStyle(self.style_var.get())

        edge = Edge(
            id=f"edge_{uuid.uuid4().hex[:8]}",
            source=src_id,
            target=tgt_id,
            label=rel,
            relation=rel,
            direction=d,
            style=st,
            strength=5
        )

        self.on_connected(edge)
        self.destroy()
