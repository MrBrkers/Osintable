"""
OsintDesk - OSINT Ağ & Varlık Haritalama
Veri Modelleri ve Varlık Yapısı (Windows & Linux Uyumlu)
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Optional, Any
import json
import uuid
import time


class NodeType(str, Enum):
    PERSON = "person"
    ORGANIZATION = "organization"
    DOMAIN = "domain"
    IP = "ip"
    EMAIL = "email"
    PHONE = "phone"
    SOCIAL = "social"
    LOCATION = "location"
    CRYPTO = "crypto"
    DOCUMENT = "document"
    HASH = "hash"
    VEHICLE = "vehicle"
    EVENT = "event"


NODE_TYPE_META = {
    NodeType.PERSON: {"label": "Kişi / Hedef", "color": "#2563eb", "icon": "👤", "shape": "card"},
    NodeType.ORGANIZATION: {"label": "Kurum / Şirket", "color": "#475569", "icon": "🏢", "shape": "card"},
    NodeType.DOMAIN: {"label": "Alan Adı (Domain)", "color": "#0d9488", "icon": "🌐", "shape": "card"},
    NodeType.IP: {"label": "IP Adresi", "color": "#0891b2", "icon": "🖥️", "shape": "card"},
    NodeType.EMAIL: {"label": "E-posta", "color": "#d97706", "icon": "✉️", "shape": "card"},
    NodeType.PHONE: {"label": "Telefon", "color": "#16a34a", "icon": "📞", "shape": "card"},
    NodeType.SOCIAL: {"label": "Sosyal Medya", "color": "#ea580c", "icon": "📱", "shape": "card"},
    NodeType.LOCATION: {"label": "Konum / Adres", "color": "#dc2626", "icon": "📍", "shape": "card"},
    NodeType.CRYPTO: {"label": "Kripto Cüzdan", "color": "#eab308", "icon": "💰", "shape": "card"},
    NodeType.DOCUMENT: {"label": "Doküman / Dosya", "color": "#64748b", "icon": "📄", "shape": "card"},
    NodeType.HASH: {"label": "Hash / MD5 / SHA", "color": "#7c3aed", "icon": "🔑", "shape": "card"},
    NodeType.VEHICLE: {"label": "Araç / Plaka", "color": "#0284c7", "icon": "🚗", "shape": "card"},
    NodeType.EVENT: {"label": "Olay / Hadise", "color": "#db2777", "icon": "📅", "shape": "card"},
}


class EdgeDirection(str, Enum):
    DIRECTED = "directed"
    BIDIRECTIONAL = "bidirectional"
    UNDIRECTED = "undirected"


class EdgeStyle(str, Enum):
    SOLID = "solid"
    DASHED = "dashed"
    DOTTED = "dotted"


@dataclass
class SourceReference:
    url: str = ""
    description: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {"url": self.url, "description": self.description}

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SourceReference":
        return cls(
            url=data.get("url", ""),
            description=data.get("description", "")
        )


@dataclass
class Node:
    id: str
    type: NodeType
    label: str
    value: str = ""
    x: float = 0.0
    y: float = 0.0
    notes: str = ""
    sources: List[SourceReference] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    confidence: int = 80  # 0 - 100
    metadata: Dict[str, Any] = field(default_factory=dict)
    color: Optional[str] = None
    width: float = 140.0
    height: float = 64.0

    @property
    def display_color(self) -> str:
        if self.color:
            return self.color
        meta = NODE_TYPE_META.get(self.type)
        return meta["color"] if meta else "#3b82f6"

    @property
    def display_icon(self) -> str:
        meta = NODE_TYPE_META.get(self.type)
        return meta["icon"] if meta else "●"

    @property
    def type_label(self) -> str:
        meta = NODE_TYPE_META.get(self.type)
        return meta["label"] if meta else str(self.type)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value if isinstance(self.type, NodeType) else str(self.type),
            "label": self.label,
            "value": self.value,
            "x": round(self.x, 2),
            "y": round(self.y, 2),
            "notes": self.notes,
            "sources": [s.to_dict() for s in self.sources],
            "tags": list(self.tags),
            "confidence": self.confidence,
            "metadata": self.metadata,
            "color": self.color,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Node":
        node_type_val = data.get("type", "person")
        try:
            node_type = NodeType(node_type_val)
        except ValueError:
            node_type = NodeType.PERSON

        sources_data = data.get("sources", [])
        sources = [SourceReference.from_dict(s) for s in sources_data if isinstance(s, dict)]

        return cls(
            id=str(data.get("id", str(uuid.uuid4()))),
            type=node_type,
            label=str(data.get("label", "Düğüm")),
            value=str(data.get("value", "")),
            x=float(data.get("x", 0.0)),
            y=float(data.get("y", 0.0)),
            notes=str(data.get("notes", "")),
            sources=sources,
            tags=list(data.get("tags", [])),
            confidence=int(data.get("confidence", 80)),
            metadata=dict(data.get("metadata", {})),
            color=data.get("color"),
        )


@dataclass
class Edge:
    id: str
    source: str
    target: str
    label: str = ""
    relation: str = "Bağlantılı"
    direction: EdgeDirection = EdgeDirection.DIRECTED
    style: EdgeStyle = EdgeStyle.SOLID
    strength: int = 5  # 1 - 10
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "source": self.source,
            "target": self.target,
            "label": self.label or self.relation,
            "relation": self.relation,
            "direction": self.direction.value if isinstance(self.direction, EdgeDirection) else str(self.direction),
            "style": self.style.value if isinstance(self.style, EdgeStyle) else str(self.style),
            "strength": self.strength,
            "notes": self.notes,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Edge":
        dir_val = data.get("direction", "directed")
        try:
            direction = EdgeDirection(dir_val)
        except ValueError:
            direction = EdgeDirection.DIRECTED

        style_val = data.get("style", "solid")
        try:
            style = EdgeStyle(style_val)
        except ValueError:
            style = EdgeStyle.SOLID

        relation = data.get("relation") or data.get("label") or "Bağlantılı"
        label = data.get("label") or relation

        return cls(
            id=str(data.get("id", str(uuid.uuid4()))),
            source=str(data.get("source", "")),
            target=str(data.get("target", "")),
            label=label,
            relation=relation,
            direction=direction,
            style=style,
            strength=int(data.get("strength", 5)),
            notes=str(data.get("notes", "")),
        )


class Project:
    def __init__(
        self,
        id: Optional[str] = None,
        name: str = "Yeni OSINT Soruşturması",
        description: str = "",
        nodes: Optional[List[Node]] = None,
        edges: Optional[List[Edge]] = None,
        created_at: Optional[float] = None,
        updated_at: Optional[float] = None,
    ):
        self.id = id or str(uuid.uuid4())
        self.name = name
        self.description = description
        self.nodes: List[Node] = nodes or []
        self.edges: List[Edge] = edges or []
        self.created_at = created_at or time.time()
        self.updated_at = updated_at or time.time()

    def get_node(self, node_id: str) -> Optional[Node]:
        for n in self.nodes:
            if n.id == node_id:
                return n
        return None

    def get_edge(self, edge_id: str) -> Optional[Edge]:
        for e in self.edges:
            if e.id == edge_id:
                return e
        return None

    def add_node(self, node: Node) -> None:
        if not self.get_node(node.id):
            self.nodes.append(node)
            self.updated_at = time.time()

    def remove_node(self, node_id: str) -> None:
        self.nodes = [n for n in self.nodes if n.id != node_id]
        # Remove connected edges
        self.edges = [e for e in self.edges if e.source != node_id and e.target != node_id]
        self.updated_at = time.time()

    def add_edge(self, edge: Edge) -> None:
        # Check source and target exist
        if self.get_node(edge.source) and self.get_node(edge.target):
            # Check duplicate edge
            existing = [e for e in self.edges if e.source == edge.source and e.target == edge.target]
            if not existing:
                self.edges.append(edge)
                self.updated_at = time.time()

    def remove_edge(self, edge_id: str) -> None:
        self.edges = [e for e in self.edges if e.id != edge_id]
        self.updated_at = time.time()

    def get_connected_nodes(self, node_id: str) -> List[Node]:
        neighbor_ids = set()
        for e in self.edges:
            if e.source == node_id:
                neighbor_ids.add(e.target)
            elif e.target == node_id:
                neighbor_ids.add(e.source)
        return [n for n in self.nodes if n.id in neighbor_ids]

    def get_node_degree(self, node_id: str) -> int:
        count = 0
        for e in self.edges:
            if e.source == node_id or e.target == node_id:
                count += 1
        return count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "createdAt": int(self.created_at * 1000),
            "updatedAt": int(self.updated_at * 1000),
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges],
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Project":
        nodes = [Node.from_dict(n) for n in data.get("nodes", [])]
        edges = [Edge.from_dict(e) for e in data.get("edges", [])]
        created_at = (data.get("createdAt") or (time.time() * 1000)) / 1000.0
        updated_at = (data.get("updatedAt") or (time.time() * 1000)) / 1000.0
        return cls(
            id=data.get("id"),
            name=data.get("name", "OSINT Projesi"),
            description=data.get("description", ""),
            nodes=nodes,
            edges=edges,
            created_at=created_at,
            updated_at=updated_at,
        )


def get_sample_project() -> Project:
    """Klasik örnek OSINT soruşturma verisi oluşturur."""
    proj = Project(
        name="Hedef Kuruluş & Altyapı Soruşturması #01",
        description="Şirket, alan adı, IP altyapısı, yetkili personeller ve ilişkili sosyal hesaplar incelemesi."
    )

    n1 = Node(id="n-target-org", type=NodeType.ORGANIZATION, label="Aether Global Danışmanlık", value="Vergi No: 1092839182", x=0, y=0, notes="Ana hedef şirket. İstanbul ve Londra ofisleri var.", tags=["hedef", "kurum"], confidence=95)
    n2 = Node(id="n-target-domain", type=NodeType.DOMAIN, label="aetherglobal.com", value="Kayıt: NameCheap Inc.", x=-200, y=-120, notes="Birincil şirket web sitesi. Cloudflare arkasında.", tags=["domain", "web"], confidence=100)
    n3 = Node(id="n-target-ip1", type=NodeType.IP, label="198.51.100.42", value="Frankfurt, DE - AS13335", x=-380, y=-160, notes="Web sunucusu IP adresi.", tags=["ip", "hosting"], confidence=90)
    n4 = Node(id="n-target-ip2", type=NodeType.IP, label="203.0.113.88", value="İstanbul, TR - AS9121", x=-240, y=-260, notes="Şirket içi VPN / Mail gateway.", tags=["ip", "gateway"], confidence=85)
    n5 = Node(id="n-ceo", type=NodeType.PERSON, label="Ahmet Karadağ", value="CEO & Kurucu Ortak", x=220, y=-80, notes="Ticaret sicil gazetesinde şirket imza yetkilisi.", tags=["yönetici", "hedef-kisi"], confidence=95)
    n6 = Node(id="n-cto", type=NodeType.PERSON, label="Selin Varol", value="Teknoloji Direktörü (CTO)", x=240, y=100, notes="Altyapı ve yazılımlardan sorumlu.", tags=["teknik", "personel"], confidence=85)
    n7 = Node(id="n-email-ceo", type=NodeType.EMAIL, label="ahmet.karadag@aetherglobal.com", value="Breached: ComboList 2023", x=420, y=-120, notes="Sızıntı veri tabanında şifre hash'i bulundu.", tags=["email", "leaked"], confidence=90)
    n8 = Node(id="n-phone-ceo", type=NodeType.PHONE, label="+90 532 998 1234", value="Operatör: Turkcell", x=440, y=-40, notes="WhatsApp ve Telegram hesapları aktif.", tags=["telefon", "iletisim"], confidence=80)
    n9 = Node(id="n-social-ceo", type=NodeType.SOCIAL, label="@akaradag_intel", value="X / Twitter & LinkedIn", x=380, y=40, notes="Sosyal mühendislik ve açık kaynak paylaşımları.", tags=["sosyal", "osint"], confidence=85)
    n10 = Node(id="n-crypto", type=NodeType.CRYPTO, label="0x71C...a49B", value="ETH: 42.5 ETH ($140K)", x=140, y=240, notes="Şirket danışmanlık ödemelerinde tespit edilen cüzdan.", tags=["finans", "kripto"], confidence=75)
    n11 = Node(id="n-location", type=NodeType.LOCATION, label="Levent, Büyükdere Cad. No:190", value="İstanbul, Türkiye", x=-60, y=180, notes="Fiziki genel merkez binası.", tags=["fiziki", "ofis"], confidence=100)

    for node in [n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11]:
        proj.add_node(node)

    edges = [
        Edge(id="e1", source="n-target-org", target="n-target-domain", label="Web Sitesi", relation="Sahibi", direction=EdgeDirection.DIRECTED, strength=9),
        Edge(id="e2", source="n-target-domain", target="n-target-ip1", label="DNS A Kaydı", relation="Barındırma", direction=EdgeDirection.DIRECTED, strength=8),
        Edge(id="e3", source="n-target-domain", target="n-target-ip2", label="MX Kaydı", relation="Mail Sunucu", direction=EdgeDirection.DIRECTED, strength=7),
        Edge(id="e4", source="n-target-org", target="n-ceo", label="Kurucu & CEO", relation="Yönetici", direction=EdgeDirection.BIDIRECTIONAL, strength=10),
        Edge(id="e5", source="n-target-org", target="n-cto", label="CTO", relation="Çalışan", direction=EdgeDirection.DIRECTED, strength=8),
        Edge(id="e6", source="n-ceo", target="n-email-ceo", label="İş E-postası", relation="E-posta", direction=EdgeDirection.DIRECTED, strength=9),
        Edge(id="e7", source="n-ceo", target="n-phone-ceo", label="Kişisel Telefon", relation="Telefon", direction=EdgeDirection.DIRECTED, strength=8),
        Edge(id="e8", source="n-ceo", target="n-social-ceo", label="Kişisel Profil", relation="Sosyal Hesap", direction=EdgeDirection.DIRECTED, strength=8),
        Edge(id="e9", source="n-cto", target="n-crypto", label="İmza Yetkilisi", relation="Cüzdan Sahibi", direction=EdgeDirection.DIRECTED, strength=6),
        Edge(id="e10", source="n-target-org", target="n-location", label="Genel Merkez", relation="Fiziki Adres", direction=EdgeDirection.DIRECTED, strength=10),
    ]

    for edge in edges:
        proj.add_edge(edge)

    return proj
