import { NodeEntity, EdgeEntity } from '../types/osint';

export type LayoutType = 'force' | 'hierarchical' | 'radial' | 'circular' | 'grid';

/**
 * Runs a multi-step Force-Directed layout simulation
 */
export function applyForceDirectedLayout(
  nodes: NodeEntity[],
  edges: EdgeEntity[],
  iterations = 60
): NodeEntity[] {
  if (nodes.length === 0) return [];
  const updatedNodes = nodes.map(n => ({
    ...n,
    vx: n.vx || 0,
    vy: n.vy || 0,
  }));

  const nodeMap = new Map<string, typeof updatedNodes[0]>();
  updatedNodes.forEach(n => nodeMap.set(n.id, n));

  const k = Math.sqrt((800 * 800) / Math.max(1, nodes.length));
  const repulsionConst = k * k * 0.8;
  const springConst = 0.05;
  const idealLength = 140;

  for (let iter = 0; iter < iterations; iter++) {
    const temperature = (1 - iter / iterations) * 12;

    // 1. Repulsion between all pairs
    for (let i = 0; i < updatedNodes.length; i++) {
      for (let j = i + 1; j < updatedNodes.length; j++) {
        const u = updatedNodes[i];
        const v = updatedNodes[j];
        const dx = u.x - v.x;
        const dy = u.y - v.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 1) {
          distSq = 1;
        }
        const dist = Math.sqrt(distSq);
        const force = repulsionConst / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        u.vx! += fx;
        u.vy! += fy;
        v.vx! -= fx;
        v.vy! -= fy;
      }
    }

    // 2. Attraction along edges
    for (const edge of edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const displacement = dist - idealLength;
      const force = displacement * springConst;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      source.vx! += fx;
      source.vy! += fy;
      target.vx! -= fx;
      target.vy! -= fy;
    }

    // 3. Weak gravity towards center (0, 0)
    for (const node of updatedNodes) {
      const dist = Math.sqrt(node.x * node.x + node.y * node.y);
      if (dist > 50) {
        node.vx! -= (node.x / dist) * 0.5;
        node.vy! -= (node.y / dist) * 0.5;
      }

      // Cap displacement by temperature
      const vDist = Math.sqrt(node.vx! * node.vx! + node.vy! * node.vy!);
      if (vDist > 0) {
        const limitedDist = Math.min(vDist, temperature);
        node.x += (node.vx! / vDist) * limitedDist;
        node.y += (node.vy! / vDist) * limitedDist;
      }

      // Dampening
      node.vx! *= 0.6;
      node.vy! *= 0.6;
    }
  }

  return updatedNodes.map(({ vx, vy, ...n }) => n);
}

/**
 * Hierarchical (Top-down Tree / DAG) layout
 */
export function applyHierarchicalLayout(
  nodes: NodeEntity[],
  edges: EdgeEntity[],
  rootNodeId?: string
): NodeEntity[] {
  if (nodes.length === 0) return [];

  // Build adjacency
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    outEdges.set(n.id, []);
  });

  edges.forEach(e => {
    if (inDegree.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
    if (outEdges.has(e.source)) {
      outEdges.get(e.source)!.push(e.target);
    }
  });

  // Determine root nodes
  let roots: string[] = [];
  if (rootNodeId && inDegree.has(rootNodeId)) {
    roots = [rootNodeId];
  } else {
    roots = nodes.filter(n => (inDegree.get(n.id) || 0) === 0).map(n => n.id);
    if (roots.length === 0) {
      // Find node with highest out degree if cyclic
      let maxOut = -1;
      let maxNode = nodes[0].id;
      nodes.forEach(n => {
        const out = outEdges.get(n.id)?.length || 0;
        if (out > maxOut) {
          maxOut = out;
          maxNode = n.id;
        }
      });
      roots = [maxNode];
    }
  }

  // Assign levels via BFS
  const levels = new Map<string, number>();
  const queue: Array<{ id: string; level: number }> = roots.map(r => ({ id: r, level: 0 }));
  roots.forEach(r => levels.set(r, 0));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    const neighbors = outEdges.get(id) || [];
    for (const neighbor of neighbors) {
      if (!levels.has(neighbor)) {
        levels.set(neighbor, level + 1);
        queue.push({ id: neighbor, level: level + 1 });
      }
    }
  }

  // For any unvisited nodes
  nodes.forEach(n => {
    if (!levels.has(n.id)) {
      levels.set(n.id, 1);
    }
  });

  // Group by level
  const levelGroups = new Map<number, string[]>();
  levels.forEach((lvl, id) => {
    if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
    levelGroups.get(lvl)!.push(id);
  });

  const levelGapY = 160;
  const nodeGapX = 180;
  const maxLevel = Math.max(...Array.from(levelGroups.keys()), 0);
  const startY = -(maxLevel * levelGapY) / 2;

  const nodePos = new Map<string, { x: number; y: number }>();

  levelGroups.forEach((nodeIds, lvl) => {
    const y = startY + lvl * levelGapY;
    const totalWidth = (nodeIds.length - 1) * nodeGapX;
    const startX = -totalWidth / 2;

    nodeIds.forEach((id, idx) => {
      nodePos.set(id, {
        x: startX + idx * nodeGapX,
        y,
      });
    });
  });

  return nodes.map(n => {
    const pos = nodePos.get(n.id);
    return pos ? { ...n, x: pos.x, y: pos.y } : n;
  });
}

/**
 * Radial (Concentric Circles) layout from root node
 */
export function applyRadialLayout(
  nodes: NodeEntity[],
  edges: EdgeEntity[],
  rootNodeId?: string
): NodeEntity[] {
  if (nodes.length === 0) return [];

  const rootId = rootNodeId || nodes[0].id;
  // Distance from root
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    adj.get(e.source)?.push(e.target);
    adj.get(e.target)?.push(e.source);
  });

  const distMap = new Map<string, number>();
  const queue: string[] = [rootId];
  distMap.set(rootId, 0);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const d = distMap.get(curr)!;
    const neighbors = adj.get(curr) || [];
    for (const nb of neighbors) {
      if (!distMap.has(nb)) {
        distMap.set(nb, d + 1);
        queue.push(nb);
      }
    }
  }

  // Nodes not reachable get max distance + 1
  const maxD = Math.max(...Array.from(distMap.values()), 0);
  nodes.forEach(n => {
    if (!distMap.has(n.id)) {
      distMap.set(n.id, maxD + 1);
    }
  });

  // Group by distance ring
  const rings = new Map<number, string[]>();
  distMap.forEach((dist, id) => {
    if (!rings.has(dist)) rings.set(dist, []);
    rings.get(dist)!.push(id);
  });

  const ringGap = 160;
  const nodePos = new Map<string, { x: number; y: number }>();
  nodePos.set(rootId, { x: 0, y: 0 });

  rings.forEach((nodeIds, ring) => {
    if (ring === 0) return;
    const radius = ring * ringGap;
    const count = nodeIds.length;
    const angleStep = (2 * Math.PI) / count;

    nodeIds.forEach((id, idx) => {
      const angle = idx * angleStep;
      nodePos.set(id, {
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius),
      });
    });
  });

  return nodes.map(n => {
    const pos = nodePos.get(n.id);
    return pos ? { ...n, x: pos.x, y: pos.y } : n;
  });
}

/**
 * Circular Layout
 */
export function applyCircularLayout(nodes: NodeEntity[]): NodeEntity[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) return [{ ...nodes[0], x: 0, y: 0 }];

  const radius = Math.max(180, (nodes.length * 60) / Math.PI);
  const angleStep = (2 * Math.PI) / nodes.length;

  return nodes.map((node, i) => {
    const angle = i * angleStep;
    return {
      ...node,
      x: Math.round(Math.cos(angle) * radius),
      y: Math.round(Math.sin(angle) * radius),
    };
  });
}

/**
 * Grid Layout
 */
export function applyGridLayout(nodes: NodeEntity[]): NodeEntity[] {
  if (nodes.length === 0) return [];
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const spacingX = 180;
  const spacingY = 140;

  const totalWidth = (cols - 1) * spacingX;
  const rows = Math.ceil(nodes.length / cols);
  const totalHeight = (rows - 1) * spacingY;

  return nodes.map((node, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    return {
      ...node,
      x: -totalWidth / 2 + c * spacingX,
      y: -totalHeight / 2 + r * spacingY,
    };
  });
}
