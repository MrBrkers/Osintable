"""
OsintDesk - Dosya Depolama ve Dışa Aktarma Modülü (Storage & Export)
Windows ve Linux üzerinde JSON, CSV ve Metin dışa/içe aktarımı
"""

import json
import csv
from typing import Optional
from .models import Project, Node, Edge, NodeType


def save_project_to_json(project: Project, filepath: str) -> bool:
    """Projeyi UTF-8 kodlamalı JSON dosyası olarak kaydeder."""
    try:
        data = project.to_dict()
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"JSON kaydetme hatası: {e}")
        return False


def load_project_from_json(filepath: str) -> Optional[Project]:
    """JSON dosyasından OSINT projesini yükler."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return Project.from_dict(data)
    except Exception as e:
        print(f"JSON yükleme hatası: {e}")
        return None


def export_nodes_to_csv(project: Project, filepath: str) -> bool:
    """Düğümleri Excel/Gephi uyumlu CSV tablosu olarak dışa aktarır."""
    try:
        fieldnames = ["id", "type", "label", "value", "confidence", "tags", "notes", "x", "y"]
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for n in project.nodes:
                writer.writerow({
                    "id": n.id,
                    "type": n.type.value if hasattr(n.type, "value") else str(n.type),
                    "label": n.label,
                    "value": n.value,
                    "confidence": n.confidence,
                    "tags": ";".join(n.tags),
                    "notes": n.notes,
                    "x": n.x,
                    "y": n.y,
                })
        return True
    except Exception as e:
        print(f"Düğüm CSV dışa aktarma hatası: {e}")
        return False


def export_edges_to_csv(project: Project, filepath: str) -> bool:
    """İlişkileri (Kenarları) CSV tablosu olarak dışa aktarır."""
    try:
        fieldnames = ["id", "source", "target", "relation", "direction", "strength", "notes"]
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for e in project.edges:
                writer.writerow({
                    "id": e.id,
                    "source": e.source,
                    "target": e.target,
                    "relation": e.relation,
                    "direction": e.direction.value if hasattr(e.direction, "value") else str(e.direction),
                    "strength": e.strength,
                    "notes": e.notes,
                })
        return True
    except Exception as e:
        print(f"Kenar CSV dışa aktarma hatası: {e}")
        return False
