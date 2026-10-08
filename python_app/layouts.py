"""
OsintDesk - Otomatik Grafik Düzenleme Motoru (Layout Engine)
Windows ve Linux uyumlu, saf Python matematiksel hesaplamaları
"""

import math
import random
from typing import List, Dict, Optional
from .models import Node, Edge


def apply_force_directed_layout(
    nodes: List[Node],
    edges: List[Edge],
    width: float = 1200.0,
    height: float = 800.0,
    iterations: int = 80,
    k_factor: Optional[float] = None
) -> None:
    """
    Fruchterman-Reingold Kuvvet Tabanlı Yerleşim Algoritması.
    Düğümleri doğal bir denge halinde yayarak grupları kümeleştirir.
    """
    if not nodes:
        return

    node_count = len(nodes)
    area = width * height
    # İdeal yay mesafesi
    k = k_factor or math.sqrt(area / (node_count + 1)) * 0.75
    temp = width / 10.0  # Başlangıç sıcaklığı
    cooling_factor = 0.95

    # Düğüm haritası
    pos: Dict[str, Dict[str, float]] = {}
    disp: Dict[str, Dict[str, float]] = {}

    for node in nodes:
        # Eğer koordinat yoksa rastgele yerleştir
        if node.x == 0 and node.y == 0:
            node.x = (random.random() - 0.5) * (width * 0.5)
            node.y = (random.random() - 0.5) * (height * 0.5)
        pos[node.id] = {"x": node.x, "y": node.y}
        disp[node.id] = {"x": 0.0, "y": 0.0}

    for it in range(iterations):
        # 1. Düğümler arası itme kuvveti (Coulomb Repulsion)
        for i in range(node_count):
            u_id = nodes[i].id
            disp[u_id]["x"] = 0.0
            disp[u_id]["y"] = 0.0

            for j in range(node_count):
                if i == j:
                    continue
                v_id = nodes[j].id
                dx = pos[u_id]["x"] - pos[v_id]["x"]
                dy = pos[u_id]["y"] - pos[v_id]["y"]
                dist = math.sqrt(dx * dx + dy * dy)
                if dist < 0.01:
                    dx = random.uniform(-1, 1)
                    dy = random.uniform(-1, 1)
                    dist = 1.0

                # İtme kuvveti f_r(d) = k^2 / d
                rep_force = (k * k) / dist
                disp[u_id]["x"] += (dx / dist) * rep_force
                disp[u_id]["y"] += (dy / dist) * rep_force

        # 2. Kenarlar boyunca çekme kuvveti (Hooke Attraction)
        for edge in edges:
            u_id = edge.source
            v_id = edge.target
            if u_id not in pos or v_id not in pos:
                continue

            dx = pos[u_id]["x"] - pos[v_id]["x"]
            dy = pos[u_id]["y"] - pos[v_id]["y"]
            dist = math.sqrt(dx * dx + dy * dy)
            if dist < 0.01:
                dist = 0.01

            # Çekme kuvveti f_a(d) = d^2 / k
            weight = max(1, edge.strength) / 5.0
            att_force = ((dist * dist) / k) * weight

            disp[u_id]["x"] -= (dx / dist) * att_force
            disp[u_id]["y"] -= (dy / dist) * att_force
            disp[v_id]["x"] += (dx / dist) * att_force
            disp[v_id]["y"] += (dy / dist) * att_force

        # 3. Merkeze hafif çekim kuvveti (Gravity)
        for node in nodes:
            u_id = node.id
            dist_to_center = math.sqrt(pos[u_id]["x"] ** 2 + pos[u_id]["y"] ** 2)
            if dist_to_center > 0:
                gravity = 0.03 * dist_to_center
                disp[u_id]["x"] -= (pos[u_id]["x"] / dist_to_center) * gravity
                disp[u_id]["y"] -= (pos[u_id]["y"] / dist_to_center) * gravity

        # 4. Pozisyonları güncelle ve sıcaklığı soğut
        for node in nodes:
            u_id = node.id
            dx = disp[u_id]["x"]
            dy = disp[u_id]["y"]
            disp_dist = math.sqrt(dx * dx + dy * dy)
            if disp_dist > 0:
                step = min(disp_dist, temp)
                pos[u_id]["x"] += (dx / disp_dist) * step
                pos[u_id]["y"] += (dy / disp_dist) * step

        temp *= cooling_factor
        if temp < 1.0:
            break

    # Hesaplanan pozisyonları düğümlere yaz
    for node in nodes:
        node.x = round(pos[node.id]["x"], 1)
        node.y = round(pos[node.id]["y"], 1)


def apply_hierarchical_layout(
    nodes: List[Node],
    edges: List[Edge],
    horizontal_spacing: float = 240.0,
    vertical_spacing: float = 140.0,
) -> None:
    """
    Hiyerarşik / Ağaç Yerleşim Algoritması.
    Kaynakları kök olarak belirler ve akışı katman katman düzenler.
    """
    if not nodes:
        return

    # Giriş derecelerini (in-degree) ve komşulukları hesapla
    in_degree: Dict[str, int] = {n.id: 0 for n in nodes}
    children: Dict[str, List[str]] = {n.id: [] for n in nodes}

    for edge in edges:
        if edge.target in in_degree and edge.source in children:
            in_degree[edge.target] += 1
            children[edge.source].append(edge.target)

    # Kök düğümleri (in-degree == 0) bul
    roots = [n.id for n in nodes if in_degree[n.id] == 0]
    if not roots:
        roots = [nodes[0].id]

    # BFS ile katmanları (seviyeleri) belirle
    levels: Dict[str, int] = {}
    queue = [(r, 0) for r in roots]
    visited = set()

    while queue:
        curr, lvl = queue.pop(0)
        if curr in visited:
            continue
        visited.add(curr)
        levels[curr] = max(levels.get(curr, 0), lvl)

        for child in children.get(curr, []):
            if child not in visited:
                queue.append((child, lvl + 1))

    # Ziyaret edilmeyen izole düğümleri son katmana koy
    for node in nodes:
        if node.id not in levels:
            levels[node.id] = 0

    # Katmanlara göre düğümleri grupla
    layer_groups: Dict[int, List[Node]] = {}
    for node in nodes:
        lvl = levels[node.id]
        if lvl not in layer_groups:
            layer_groups[lvl] = []
        layer_groups[lvl].append(node)

    # Katmanları yerleştir
    max_level = max(layer_groups.keys()) if layer_groups else 0
    total_height = max_level * vertical_spacing
    start_y = -total_height / 2.0

    for lvl in sorted(layer_groups.keys()):
        group = layer_groups[lvl]
        total_width = (len(group) - 1) * horizontal_spacing
        start_x = -total_width / 2.0
        y = start_y + (lvl * vertical_spacing)

        for idx, node in enumerate(group):
            node.x = round(start_x + (idx * horizontal_spacing), 1)
            node.y = round(y, 1)


def apply_radial_layout(
    nodes: List[Node],
    edges: List[Edge],
    radius_step: float = 180.0,
    center_node_id: Optional[str] = None
) -> None:
    """
    Radyal (Halkasal) Yerleşim Algoritması.
    En yüksek bağlantıya sahip veya seçili merkez düğüm etrafında halkalar oluşturur.
    """
    if not nodes:
        return

    # Merkez düğümü bul (en yüksek dereceye sahip düğüm)
    if not center_node_id or not any(n.id == center_node_id for n in nodes):
        degrees: Dict[str, int] = {n.id: 0 for n in nodes}
        for e in edges:
            if e.source in degrees:
                degrees[e.source] += 1
            if e.target in degrees:
                degrees[e.target] += 1
        center_node_id = max(degrees.items(), key=lambda x: x[1])[0] if degrees else nodes[0].id

    # Komşuluk haritası
    adj: Dict[str, List[str]] = {n.id: [] for n in nodes}
    for e in edges:
        if e.source in adj and e.target in adj:
            adj[e.source].append(e.target)
            adj[e.target].append(e.source)

    # BFS ile merkezden uzaklıkları hesapla
    dist: Dict[str, int] = {center_node_id: 0}
    queue = [center_node_id]
    while queue:
        curr = queue.pop(0)
        curr_d = dist[curr]
        for neighbor in adj.get(curr, []):
            if neighbor not in dist:
                dist[neighbor] = curr_d + 1
                queue.append(neighbor)

    for node in nodes:
        if node.id not in dist:
            dist[node.id] = 2  # Bağlantısız olanlar 2. halkaya

    # Halkalara göre grupla
    rings: Dict[int, List[Node]] = {}
    for node in nodes:
        d = dist[node.id]
        if d not in rings:
            rings[d] = []
        rings[d].append(node)

    # Merkez düğüm (0. halka)
    for node in rings.get(0, []):
        node.x = 0.0
        node.y = 0.0

    # Diğer halkalar
    for d in sorted(rings.keys()):
        if d == 0:
            continue
        group = rings[d]
        count = len(group)
        r = d * radius_step
        angle_step = (2 * math.pi) / count

        for idx, node in enumerate(group):
            angle = idx * angle_step
            node.x = round(r * math.cos(angle), 1)
            node.y = round(r * math.sin(angle), 1)


def apply_circular_layout(nodes: List[Node], radius: Optional[float] = None) -> None:
    """Düğümleri dairesel bir hat boyunca eşit aralıklarla yerleştirir."""
    if not nodes:
        return
    count = len(nodes)
    r = radius or max(220.0, count * 35.0)
    angle_step = (2 * math.pi) / count

    for idx, node in enumerate(nodes):
        angle = idx * angle_step
        node.x = round(r * math.cos(angle), 1)
        node.y = round(r * math.sin(angle), 1)


def apply_grid_layout(nodes: List[Node], cell_width: float = 220.0, cell_height: float = 120.0) -> None:
    """Düğümleri düzenli ızgara matrisi şeklinde dizer."""
    if not nodes:
        return
    count = len(nodes)
    cols = math.ceil(math.sqrt(count))
    rows = math.ceil(count / cols)

    total_w = (cols - 1) * cell_width
    total_h = (rows - 1) * cell_height
    start_x = -total_w / 2.0
    start_y = -total_h / 2.0

    for idx, node in enumerate(nodes):
        r = idx // cols
        c = idx % cols
        node.x = round(start_x + (c * cell_width), 1)
        node.y = round(start_y + (r * cell_height), 1)
