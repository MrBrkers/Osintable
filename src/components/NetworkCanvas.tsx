import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { NodeEntity, EdgeEntity, ViewTransform, FilterState } from '../types/osint';
import { NODE_TYPE_CONFIGS } from '../utils/constants';
import { QuickConnectPopup } from './QuickConnectPopup';
import { openGoogleSearch } from '../utils/browserSearch';
import { Language, translations } from '../utils/i18n';

interface NetworkCanvasProps {
  nodes: NodeEntity[];
  edges: EdgeEntity[];
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  transform: ViewTransform;
  onTransformChange: (t: ViewTransform) => void;
  onSelectNode: (id: string | null, isShift?: boolean) => void;
  onSelectMultipleNodes: (ids: string[]) => void;
  onSelectEdge: (id: string | null) => void;
  onNodeDragEnd: (id: string, x: number, y: number) => void;
  onNodeClick?: (id: string) => void;
  onOpenAddModalForParent: (parentId: string, multiMode?: boolean) => void;
  onOpenConnectModal: (sourceId: string) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge?: (id: string) => void;
  onEditEdge?: (id: string) => void;
  onToggleEdgeDirection?: (id: string) => void;
  onConnectDirect?: (sourceId: string, targetId: string, relation: string) => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  onToggleInteractionMode?: () => void;
  filter: FilterState;
  focusTargetNodeId?: string | null;
  onFocusHandled?: () => void;
  canvasTheme?: 'light' | 'dark';
  interactionMode?: 'pan' | 'select';
  language?: Language;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  nodes,
  edges,
  selectedNodeIds,
  selectedEdgeId,
  transform,
  onTransformChange,
  onSelectNode,
  onSelectMultipleNodes,
  onSelectEdge,
  onNodeDragEnd,
  onNodeClick,
  onOpenAddModalForParent,
  onOpenConnectModal,
  onDeleteNode,
  onDeleteEdge,
  onEditEdge,
  onToggleEdgeDirection,
  onConnectDirect,
  onDuplicateSelected,
  onDeleteSelected,
  onToggleInteractionMode,
  filter,
  focusTargetNodeId,
  onFocusHandled,
  canvasTheme = 'light',
  interactionMode = 'pan',
  language = 'tr',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dragging & Marquee state
  const isDraggingCanvasRef = useRef(false);
  const isDraggingNodeRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const nodeDragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDownTimeRef = useRef<number>(0);
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedNodeRef = useRef(false);

  // Marquee selection state (screen coordinates)
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const isMarqueeSelectingRef = useRef(false);

  // Hold timer for empty area touch selection ("basılı tutup çekince")
  const emptyTouchHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [confirmingDeleteFloating, setConfirmingDeleteFloating] = useState(false);

  // 1-Second Hold Menu State ("Sadece 1 sn basılı tutunca gelen menü")
  const [showHoldMenu, setShowHoldMenu] = useState(false);
  const [holdTargetNodeId, setHoldTargetNodeId] = useState<string | null>(null);
  const [holdMenuCoord, setHoldMenuCoord] = useState<{ x: number; y: number } | null>(null);

  // Image cache
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [, setRerenderTick] = useState(0);

  // Long press for Android
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Multi-touch pinch tracking (prevents nodes from moving during zoom)
  const isMultiTouchRef = useRef(false);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const pinchStartMidRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartWorldMidRef = useRef<{ x: number; y: number } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);

  // Edge Context Menu State (Right-click on connection cable)
  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    edgeId: string;
  } | null>(null);

  // Drag-to-Connect port state (Node port handle dragging)
  const isConnectingRef = useRef<{
    sourceNode: NodeEntity;
    startPort: { x: number; y: number; key: string };
    currentWorld: { x: number; y: number };
  } | null>(null);

  const [connectingState, setConnectingState] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    targetNodeId: string | null;
  } | null>(null);

  const [hoveredPort, setHoveredPort] = useState<{ nodeId: string; key: string } | null>(null);

  // Quick connect popup data after drag-drop connection
  const [quickConnectPopupData, setQuickConnectPopupData] = useState<{
    sourceNode: NodeEntity;
    targetNode: NodeEntity;
    position: { x: number; y: number };
  } | null>(null);

  // Focus pulse
  const [focusPulseTime, setFocusPulseTime] = useState<number | null>(null);
  const pulseNodeIdRef = useRef<string | null>(null);

  // Node Degree Map
  const degreeMap = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    const map = new Map<string, number>();
    nodes.forEach(n => map.set(n.id, 0));
    edges.forEach(e => {
      map.set(e.source, (map.get(e.source) || 0) + 1);
      map.set(e.target, (map.get(e.target) || 0) + 1);
    });
    degreeMap.current = map;
  }, [nodes, edges]);

  // Primary selected node (first in selection)
  const primarySelectedId = selectedNodeIds[0] || null;

  // Connected nodes set for dimming/highlighting
  const getConnectedNodeIds = useCallback(
    (targetId: string | null, degree: 'all' | '1st' | '2nd') => {
      if (!targetId) return null;
      const firstDegree = new Set<string>();
      firstDegree.add(targetId);

      edges.forEach(e => {
        if (e.source === targetId) firstDegree.add(e.target);
        if (e.target === targetId) firstDegree.add(e.source);
      });

      if (degree === '1st') return firstDegree;

      if (degree === '2nd') {
        const secondDegree = new Set<string>(firstDegree);
        edges.forEach(e => {
          if (firstDegree.has(e.source)) secondDegree.add(e.target);
          if (firstDegree.has(e.target)) secondDegree.add(e.source);
        });
        return secondDegree;
      }

      return null;
    },
    [edges]
  );

  const highlightedNodeIds = getConnectedNodeIds(primarySelectedId, filter.degreeFilter);

  // Auto-focus animation
  useEffect(() => {
    if (!focusTargetNodeId || !containerRef.current) return;
    const targetNode = nodes.find(n => n.id === focusTargetNodeId);
    if (!targetNode) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newScale = Math.max(1.0, transform.scale);
    const newX = centerX - targetNode.x * newScale;
    const newY = centerY - targetNode.y * newScale;

    onTransformChange({
      x: newX,
      y: newY,
      scale: newScale,
    });

    pulseNodeIdRef.current = targetNode.id;
    setFocusPulseTime(Date.now());

    if (onFocusHandled) {
      onFocusHandled();
    }
  }, [focusTargetNodeId, nodes]);

  // Screen to World coords
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      return {
        x: (screenX - transform.x) / transform.scale,
        y: (screenY - transform.y) / transform.scale,
      };
    },
    [transform]
  );

  // Hit test for nodes (Visio rectangle shape: width 100, height 50 centered at x,y)
  const nodeWidth = 104;
  const nodeHeight = 52;

  const hitTestNode = useCallback(
    (worldX: number, worldY: number): NodeEntity | null => {
      const halfW = nodeWidth / 2;
      const halfH = nodeHeight / 2;

      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (filter.types[n.type] === false && !filter.dimNonMatches) continue;

        if (
          worldX >= n.x - halfW &&
          worldX <= n.x + halfW &&
          worldY >= n.y - halfH &&
          worldY <= n.y + halfH
        ) {
          return n;
        }
      }
      return null;
    },
    [nodes, filter]
  );

  // Hit test for node port handles (4 cardinal points + 4 corners)
  const hitTestPort = useCallback(
    (worldX: number, worldY: number, tolerance = 12): { node: NodeEntity; port: { x: number; y: number; key: string } } | null => {
      const halfW = nodeWidth / 2;
      const halfH = nodeHeight / 2;

      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (filter.types[n.type] === false && !filter.dimNonMatches) continue;

        const left = n.x - halfW;
        const right = n.x + halfW;
        const top = n.y - halfH;
        const bottom = n.y + halfH;

        const ports = [
          { x: n.x, y: top, key: 'top' },
          { x: n.x, y: bottom, key: 'bottom' },
          { x: left, y: n.y, key: 'left' },
          { x: right, y: n.y, key: 'right' },
          { x: left, y: top, key: 'tl' },
          { x: right, y: top, key: 'tr' },
          { x: left, y: bottom, key: 'bl' },
          { x: right, y: bottom, key: 'br' },
        ];

        for (const p of ports) {
          const dist = Math.hypot(worldX - p.x, worldY - p.y);
          if (dist <= tolerance) {
            return { node: n, port: p };
          }
        }
      }
      return null;
    },
    [nodes, filter]
  );

  // Hit test for edges
  const hitTestEdge = useCallback(
    (worldX: number, worldY: number): EdgeEntity | null => {
      const nodeMap = new Map<string, NodeEntity>();
      nodes.forEach(n => nodeMap.set(n.id, n));

      for (const edge of edges) {
        const s = nodeMap.get(edge.source);
        const t = nodeMap.get(edge.target);
        if (!s || !t) continue;

        const l2 = (t.x - s.x) * (t.x - s.x) + (t.y - s.y) * (t.y - s.y);
        if (l2 === 0) continue;
        let p = ((worldX - s.x) * (t.x - s.x) + (worldY - s.y) * (t.y - s.y)) / l2;
        p = Math.max(0, Math.min(1, p));
        const projX = s.x + p * (t.x - s.x);
        const projY = s.y + p * (t.y - s.y);
        const distSq = (worldX - projX) * (worldX - projX) + (worldY - projY) * (worldY - projY);

        if (distSq <= 12 * 12) {
          return edge;
        }
      }
      return null;
    },
    [nodes, edges]
  );

  // Calculate bounds of selected nodes for floating action popover
  const selectedNodesBounds = useMemo(() => {
    if (selectedNodeIds.length === 0) return null;
    const selNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    if (selNodes.length === 0) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    selNodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const screenTopLeft = {
      x: (minX - nodeWidth / 2) * transform.scale + transform.x,
      y: (minY - nodeHeight / 2) * transform.scale + transform.y,
    };
    const screenBottomRight = {
      x: (maxX + nodeWidth / 2) * transform.scale + transform.x,
      y: (maxY + nodeHeight / 2) * transform.scale + transform.y,
    };

    return {
      centerX: (screenTopLeft.x + screenBottomRight.x) / 2,
      topY: screenTopLeft.y - 44,
      bottomY: screenBottomRight.y + 10,
      count: selNodes.length,
    };
  }, [selectedNodeIds, nodes, transform]);

  // Load and cache node images with fallback
  useEffect(() => {
    nodes.forEach(node => {
      if (node.imageUrl && !imageCacheRef.current.has(node.imageUrl)) {
        const img = new Image();
        if (!node.imageUrl.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          imageCacheRef.current.set(node.imageUrl!, img);
          setRerenderTick(t => t + 1);
        };
        img.onerror = () => {
          // If crossOrigin failed, try simple image load
          if (img.crossOrigin) {
            const fallback = new Image();
            fallback.onload = () => {
              imageCacheRef.current.set(node.imageUrl!, fallback);
              setRerenderTick(t => t + 1);
            };
            fallback.src = node.imageUrl!;
          } else {
            imageCacheRef.current.delete(node.imageUrl!);
          }
        };
        img.src = node.imageUrl;
        imageCacheRef.current.set(node.imageUrl, img);
      }
    });
  }, [nodes]);

  // -------------------------------------------------------------
  // MAIN RENDER LOOP (MS Office 2010 / Visio Classic Diagram Look)
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 1. Draw MS Visio / Office Grid Paper Background
    const isDark = canvasTheme === 'dark';
    ctx.fillStyle = isDark ? '#1a222e' : '#f3f5f8';
    ctx.fillRect(0, 0, width, height);

    // Grid spacing
    const gridSize = 30 * transform.scale;
    const offsetX = transform.x % gridSize;
    const offsetY = transform.y % gridSize;

    // Subtle drafting grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(160, 174, 192, 0.28)';
    ctx.beginPath();
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Major grid lines
    const majorGrid = gridSize * 5;
    const majorOffsetX = transform.x % majorGrid;
    const majorOffsetY = transform.y % majorGrid;
    ctx.strokeStyle = isDark ? 'rgba(74, 108, 150, 0.15)' : 'rgba(100, 116, 139, 0.35)';
    ctx.beginPath();
    for (let x = majorOffsetX; x < width; x += majorGrid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = majorOffsetY; y < height; y += majorGrid) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Center Origin Mark (0, 0)
    const centerScreenX = transform.x;
    const centerScreenY = transform.y;
    if (centerScreenX >= -40 && centerScreenX <= width + 40 && centerScreenY >= -40 && centerScreenY <= height + 40) {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerScreenX - 8, centerScreenY);
      ctx.lineTo(centerScreenX + 8, centerScreenY);
      ctx.moveTo(centerScreenX, centerScreenY - 8);
      ctx.lineTo(centerScreenX, centerScreenY + 8);
      ctx.stroke();
    }

    // 2. Setup World Transform
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    const nodeMap = new Map<string, NodeEntity>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    const selectedSet = new Set<string>(selectedNodeIds);

    const isNodeFilteredOut = (node: NodeEntity) => {
      if (filter.types[node.type] === false) return true;
      if (filter.tags.length > 0 && !node.tags.some(t => filter.tags.includes(t))) return true;
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const inLabel = node.label.toLowerCase().includes(q);
        const inDesc = (node.description || '').toLowerCase().includes(q);
        const inNotes = (node.notes || '').toLowerCase().includes(q);
        const inTags = node.tags.some(t => t.toLowerCase().includes(q));
        if (!inLabel && !inDesc && !inNotes && !inTags) return true;
      }
      return false;
    };

    // 3. Draw Relationship Edges
    for (const edge of edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;

      const sourceFiltered = isNodeFilteredOut(source);
      const targetFiltered = isNodeFilteredOut(target);

      if ((sourceFiltered || targetFiltered) && !filter.dimNonMatches) {
        continue;
      }

      if (filter.relationTypes.length > 0 && !filter.relationTypes.includes(edge.relation)) {
        if (!filter.dimNonMatches) continue;
      }

      let edgeAlpha = 0.9;
      if (sourceFiltered || targetFiltered) {
        edgeAlpha = 0.15;
      } else if (highlightedNodeIds) {
        const isConnected = highlightedNodeIds.has(edge.source) && highlightedNodeIds.has(edge.target);
        edgeAlpha = isConnected ? 1.0 : 0.18;
      }

      const isSelected = selectedEdgeId === edge.id;
      const edgeWidth = (edge.width || 2) * (isSelected ? 1.5 : 1);

      ctx.save();
      ctx.globalAlpha = edgeAlpha;
      ctx.lineWidth = edgeWidth;
      ctx.strokeStyle = isSelected ? '#2563eb' : edge.color || '#334155';

      if (edge.style === 'dashed') {
        ctx.setLineDash([7, 4]);
      } else if (edge.style === 'dotted') {
        ctx.setLineDash([2.5, 2.5]);
      } else {
        ctx.setLineDash([]);
      }

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 30) {
        const uX = dx / dist;
        const uY = dy / dist;

        const boundPad = 28;
        const startX = source.x + uX * boundPad;
        const startY = source.y + uY * boundPad;
        const endX = target.x - uX * boundPad;
        const endY = target.y - uY * boundPad;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        const drawArrow = (toX: number, toY: number, angle: number) => {
          const arrowLen = 9;
          ctx.setLineDash([]);
          ctx.fillStyle = isSelected ? '#2563eb' : edge.color || '#334155';
          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(
            toX - arrowLen * Math.cos(angle - Math.PI / 6),
            toY - arrowLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            toX - arrowLen * Math.cos(angle + Math.PI / 6),
            toY - arrowLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        };

        const edgeAngle = Math.atan2(endY - startY, endX - startX);
        if (edge.direction === 'directed' || edge.direction === 'bidirectional') {
          drawArrow(endX, endY, edgeAngle);
        }
        if (edge.direction === 'reverse' || edge.direction === 'bidirectional') {
          drawArrow(startX, startY, edgeAngle + Math.PI);
        }

        if (edge.relation && transform.scale > 0.35) {
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          ctx.font = '10px "Segoe UI", Tahoma, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';
          const textWidth = ctx.measureText(edge.relation).width;
          const boxW = textWidth + 10;
          const boxH = 16;

          ctx.fillStyle = isDark ? '#1e2838' : '#ffffff';
          ctx.strokeStyle = isSelected ? '#2563eb' : '#94a3b8';
          ctx.lineWidth = 1;
          ctx.setLineDash([]);

          ctx.fillRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH);
          ctx.strokeRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH);

          ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
          ctx.fillText(edge.relation, midX, midY);
        }
      }

      ctx.restore();
    }

    // 4. Draw Nodes with Photos/Avatars
    const nW = nodeWidth;
    const nH = nodeHeight;
    const headerH = 15;

    for (const node of nodes) {
      const isFiltered = isNodeFilteredOut(node);
      if (isFiltered && !filter.dimNonMatches) continue;

      let nodeAlpha = 1.0;
      if (isFiltered) {
        nodeAlpha = 0.2;
      } else if (highlightedNodeIds) {
        nodeAlpha = highlightedNodeIds.has(node.id) ? 1.0 : 0.2;
      }

      const isSelected = selectedSet.has(node.id);
      const typeConfig = NODE_TYPE_CONFIGS[node.type] || NODE_TYPE_CONFIGS.custom;
      const headerColor = node.color || typeConfig.defaultColor;

      ctx.save();
      ctx.globalAlpha = nodeAlpha;

      const left = node.x - nW / 2;
      const top = node.y - nH / 2;

      // Selection bounding box (8-handle handles)
      if (isSelected) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(left - 3, top - 3, nW + 6, nH + 6);

        const handleSize = 5;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1;

        const handles = [
          { x: left - 3, y: top - 3 },
          { x: left + nW / 2, y: top - 3 },
          { x: left + nW + 3, y: top - 3 },
          { x: left + nW + 3, y: top + nH / 2 },
          { x: left + nW + 3, y: top + nH + 3 },
          { x: left + nW / 2, y: top + nH + 3 },
          { x: left - 3, y: top + nH + 3 },
          { x: left - 3, y: top + nH / 2 },
        ];

        for (const h of handles) {
          ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
          ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
        }
      }

      // Classic Node Card Body
      ctx.fillStyle = isDark ? '#222c3d' : '#ffffff';
      ctx.fillRect(left, top, nW, nH);

      ctx.strokeStyle = isSelected ? '#1d4ed8' : isDark ? '#4b5563' : '#64748b';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(left, top, nW, nH);

      // Top Header Strip
      ctx.fillStyle = headerColor;
      ctx.fillRect(left, top, nW, headerH);

      // Header Badge Code
      ctx.font = 'bold 9px "Segoe UI", Tahoma, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(typeConfig.badgeCode, left + 5, top + headerH / 2);

      // Connection counter on right
      const degree = degreeMap.current.get(node.id) || 0;
      if (degree > 0) {
        ctx.textAlign = 'right';
        ctx.fillText(`(${degree})`, left + nW - 5, top + headerH / 2);
      }

      // Card Content: Photo / Avatar + Label
      const cachedImg = node.imageUrl ? imageCacheRef.current.get(node.imageUrl) : null;
      const hasPhoto = !!(cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0);

      const bodyTop = top + headerH;
      const bodyH = nH - headerH;

      if (hasPhoto && cachedImg) {
        const photoSize = 28;
        const photoX = left + 4;
        const photoY = bodyTop + (bodyH - photoSize) / 2;

        // Draw photo with small border
        ctx.save();
        ctx.beginPath();
        ctx.rect(photoX, photoY, photoSize, photoSize);
        ctx.clip();
        ctx.drawImage(cachedImg, photoX, photoY, photoSize, photoSize);
        ctx.restore();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(photoX, photoY, photoSize, photoSize);

        // Label text next to photo
        ctx.font = 'bold 10px "Segoe UI", Tahoma, sans-serif';
        ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const textX = photoX + photoSize + 4;
        const maxChars = 10;
        let displayLabel = node.label;
        if (displayLabel.length > maxChars) {
          displayLabel = displayLabel.substring(0, maxChars - 1) + '…';
        }
        ctx.fillText(displayLabel, textX, bodyTop + bodyH / 2);
      } else {
        // Text-only centered label
        ctx.font = 'bold 11px "Segoe UI", Tahoma, sans-serif';
        ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxChars = 14;
        let displayLabel = node.label;
        if (displayLabel.length > maxChars) {
          displayLabel = displayLabel.substring(0, maxChars - 1) + '…';
        }
        ctx.fillText(displayLabel, node.x, bodyTop + bodyH / 2);
      }

      // Draw 8 Connection Ports (Top, Bottom, Left, Right and 4 Corners)
      // "Her varlığın dört köşesinde, sağ sol alt ve üst kısımlarında node'lar olacak. Bu noktalardan tutup çekerek diğer varlığa götürerek otomatik bağlama özelliği olacak."
      const portCoords = [
        { x: node.x, y: top, key: 'top' },
        { x: node.x, y: top + nH, key: 'bottom' },
        { x: left, y: node.y, key: 'left' },
        { x: left + nW, y: node.y, key: 'right' },
        { x: left, y: top, key: 'tl' },
        { x: left + nW, y: top, key: 'tr' },
        { x: left, y: top + nH, key: 'bl' },
        { x: left + nW, y: top + nH, key: 'br' },
      ];

      for (const p of portCoords) {
        const isThisPortHovered = hoveredPort?.nodeId === node.id && hoveredPort?.key === p.key;
        const portRadius = isThisPortHovered ? 5.5 : 3.8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, portRadius, 0, Math.PI * 2);

        if (isThisPortHovered) {
          ctx.fillStyle = '#2563eb';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          // Outer pulse ring for hovered port
          ctx.beginPath();
          ctx.arc(p.x, p.y, portRadius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(37, 99, 235, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = isSelected ? '#2563eb' : (isDark ? '#60a5fa' : '#3b82f6');
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();

          // Inner tiny dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#2563eb' : '#3b82f6';
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // Dynamic Drag-to-Connect Preview Cable
    if (connectingState && connectingState.active) {
      ctx.save();
      const sx = connectingState.startX;
      const sy = connectingState.startY;
      const cx = connectingState.currentX;
      const cy = connectingState.currentY;

      // Glow backdrop
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(cx, cy);
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.25)';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Main dashed connection line
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(cx, cy);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Start circle
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#2563eb';
      ctx.fill();

      // Arrow head at current pointer
      const angle = Math.atan2(cy - sy, cx - sx);
      const headLen = 12;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx - headLen * Math.cos(angle - Math.PI / 6),
        cy - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        cx - headLen * Math.cos(angle + Math.PI / 6),
        cy - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = '#2563eb';
      ctx.fill();

      // Target node highlight ring if hovering over candidate node
      if (connectingState.targetNodeId) {
        const targetNode = nodes.find(n => n.id === connectingState.targetNodeId);
        if (targetNode) {
          const tLeft = targetNode.x - nW / 2;
          const tTop = targetNode.y - nH / 2;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.strokeRect(tLeft - 4, tTop - 4, nW + 8, nH + 8);

          // "Bağla" tag badge
          ctx.font = 'bold 10px "Segoe UI", sans-serif';
          ctx.fillStyle = '#10b981';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('🔗 Otomatik Bağla...', targetNode.x, tTop - 6);
        }
      }

      ctx.restore();
    }

    // 5. Draw Focus Reticle Pulse if active
    if (focusPulseTime && pulseNodeIdRef.current) {
      const elapsed = Date.now() - focusPulseTime;
      if (elapsed < 1000) {
        const targetNode = nodes.find(n => n.id === pulseNodeIdRef.current);
        if (targetNode) {
          const t = elapsed / 1000;
          const radius = 35 + t * 35;
          const alpha = 1 - t;

          ctx.save();
          ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(targetNode.x - radius, targetNode.y - radius, radius * 2, radius * 2);
          ctx.restore();
        }
      } else {
        setFocusPulseTime(null);
      }
    }

    ctx.restore(); // Restore world transform

    // 6. Draw Marquee Selection Box (Screen space)
    if (marqueeBox) {
      ctx.save();
      const minX = Math.min(marqueeBox.startX, marqueeBox.currentX);
      const minY = Math.min(marqueeBox.startY, marqueeBox.currentY);
      const boxW = Math.abs(marqueeBox.currentX - marqueeBox.startX);
      const boxH = Math.abs(marqueeBox.currentY - marqueeBox.startY);

      ctx.fillStyle = 'rgba(37, 99, 235, 0.14)';
      ctx.fillRect(minX, minY, boxW, boxH);

      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(minX, minY, boxW, boxH);

      // Corner accent markers for classic tactical look
      ctx.setLineDash([]);
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 2;
      const cLen = Math.min(8, boxW / 2, boxH / 2);
      ctx.beginPath();
      // top-left
      ctx.moveTo(minX, minY + cLen);
      ctx.lineTo(minX, minY);
      ctx.lineTo(minX + cLen, minY);
      // top-right
      ctx.moveTo(minX + boxW - cLen, minY);
      ctx.lineTo(minX + boxW, minY);
      ctx.lineTo(minX + boxW, minY + cLen);
      // bottom-left
      ctx.moveTo(minX, minY + boxH - cLen);
      ctx.lineTo(minX, minY + boxH);
      ctx.lineTo(minX + cLen, minY + boxH);
      // bottom-right
      ctx.moveTo(minX + boxW - cLen, minY + boxH);
      ctx.lineTo(minX + boxW, minY + boxH);
      ctx.lineTo(minX + boxW, minY + boxH - cLen);
      ctx.stroke();

      // Count badge when dragging box
      if (boxW > 24 && boxH > 24) {
        const wTopLeft = screenToWorld(minX, minY);
        const wBottomRight = screenToWorld(minX + boxW, minY + boxH);
        const minWX = Math.min(wTopLeft.x, wBottomRight.x);
        const maxWX = Math.max(wTopLeft.x, wBottomRight.x);
        const minWY = Math.min(wTopLeft.y, wBottomRight.y);
        const maxWY = Math.max(wTopLeft.y, wBottomRight.y);
        const halfW = nodeWidth / 2;
        const halfH = nodeHeight / 2;

        const countInBox = nodes.filter(n => {
          if (filter.types[n.type] === false && !filter.dimNonMatches) return false;
          return !(
            n.x + halfW < minWX ||
            n.x - halfW > maxWX ||
            n.y + halfH < minWY ||
            n.y - halfH > maxWY
          );
        }).length;

        if (countInBox > 0) {
          const badgeText = `${countInBox} Varlık`;
          ctx.font = 'bold 10px "Segoe UI", Tahoma, sans-serif';
          const textW = ctx.measureText(badgeText).width;
          const badgeW = textW + 12;
          const badgeH = 17;
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(minX + boxW - badgeW, minY + boxH + 4, badgeW, badgeH);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, minX + boxW - badgeW / 2, minY + boxH + 4 + badgeH / 2);
        }
      }

      ctx.restore();
    }

    // 7. Draw Classic Minimap (Bottom Right)
    const mmW = 120;
    const mmH = 90;
    const mmPad = 12;
    const mmX = width - mmW - mmPad;
    const mmY = height - mmH - mmPad;

    if (nodes.length > 0 && width > 460) {
      ctx.save();
      ctx.fillStyle = isDark ? '#1a222e' : '#f8fafc';
      ctx.fillRect(mmX, mmY, mmW, mmH);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(mmX, mmY, mmW, mmH);

      ctx.fillStyle = isDark ? '#263445' : '#e2e8f0';
      ctx.fillRect(mmX, mmY, mmW, 14);
      ctx.font = '8px "Segoe UI", sans-serif';
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Önizleme', mmX + 4, mmY + 7);

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      nodes.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      });

      const pad = 120;
      minX -= pad;
      maxX += pad;
      minY -= pad;
      maxY += pad;
      const graphW = Math.max(10, maxX - minX);
      const graphH = Math.max(10, maxY - minY);
      const scale = Math.min((mmW - 12) / graphW, (mmH - 22) / graphH);

      const toMmX = (wx: number) => mmX + 6 + (wx - minX) * scale;
      const toMmY = (wy: number) => mmY + 16 + (wy - minY) * scale;

      ctx.strokeStyle = isDark ? '#4b5563' : '#cbd5e1';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      edges.forEach(e => {
        const s = nodeMap.get(e.source);
        const t = nodeMap.get(e.target);
        if (s && t) {
          ctx.moveTo(toMmX(s.x), toMmY(s.y));
          ctx.lineTo(toMmX(t.x), toMmY(t.y));
        }
      });
      ctx.stroke();

      nodes.forEach(n => {
        const nx = toMmX(n.x);
        const ny = toMmY(n.y);
        ctx.fillStyle = selectedSet.has(n.id) ? '#2563eb' : n.color || '#64748b';
        ctx.fillRect(nx - 2, ny - 1.5, 4, 3);
      });

      const vpLeft = -transform.x / transform.scale;
      const vpTop = -transform.y / transform.scale;
      const vpRight = (width - transform.x) / transform.scale;
      const vpBottom = (height - transform.y) / transform.scale;

      const vpMmX = toMmX(vpLeft);
      const vpMmY = toMmY(vpTop);
      const vpMmW = (vpRight - vpLeft) * scale;
      const vpMmH = (vpBottom - vpTop) * scale;

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1;
      ctx.strokeRect(vpMmX, vpMmY, vpMmW, vpMmH);

      ctx.restore();
    }

    ctx.restore();
  }, [
    nodes,
    edges,
    selectedNodeIds,
    selectedEdgeId,
    transform,
    filter,
    highlightedNodeIds,
    focusPulseTime,
    canvasTheme,
    marqueeBox,
    hoveredPort,
    connectingState,
  ]);

  useEffect(() => {
    if (!focusPulseTime) return;
    let animId: number;
    const loop = () => {
      if (focusPulseTime && Date.now() - focusPulseTime < 1000) {
        animId = requestAnimationFrame(loop);
      }
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [focusPulseTime]);

  // -------------------------------------------------------------
  // MOUSE & POINTER EVENTS (TOUCH & MARQUEE OPTIMIZED)
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (contextMenu) setContextMenu(null);
    if (edgeContextMenu) setEdgeContextMenu(null);
    if (isMultiTouchRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    touchStartPointRef.current = { x: clientX, y: clientY };
    dragStartPosRef.current = { x: clientX, y: clientY };
    pointerDownPosRef.current = { x: clientX, y: clientY };
    pointerDownTimeRef.current = Date.now();
    hasDraggedNodeRef.current = false;

    const world = screenToWorld(clientX, clientY);

    // 0. Check if clicked directly on one of the 8 connection ports!
    // "Bu noktalardan tutup çekerek diğer varlığa götürerek otomatik bağlama özelliği olacak."
    const hitPortData = hitTestPort(world.x, world.y, 14);
    if (hitPortData && e.button === 0) {
      const { node, port } = hitPortData;
      isConnectingRef.current = {
        sourceNode: node,
        startPort: port,
        currentWorld: world,
      };
      setConnectingState({
        active: true,
        startX: port.x,
        startY: port.y,
        currentX: world.x,
        currentY: world.y,
        targetNodeId: null,
      });
      return;
    }

    const hitNode = hitTestNode(world.x, world.y);

    if (hitNode) {
      isDraggingNodeRef.current = hitNode.id;
      nodeDragStartPosRef.current = { x: hitNode.x, y: hitNode.y };

      const isShift = e.shiftKey;
      if (!selectedNodeIds.includes(hitNode.id) && !isShift) {
        onSelectNode(hitNode.id, false);
      } else if (isShift) {
        onSelectNode(hitNode.id, true);
      }

      // Hide previous hold menu while clicking/pressing
      setShowHoldMenu(false);
      setConfirmingDeleteFloating(false);

      // Start 1-second (1000ms) timer for "Çoğalt ve Toplu Sil" menu
      // "Sadece 1 sn basılı tutunca gelen bir menü olsun"
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        if (!hasDraggedNodeRef.current && isDraggingNodeRef.current === hitNode.id) {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(50);
          }
          setHoldTargetNodeId(hitNode.id);
          setHoldMenuCoord({ x: clientX, y: clientY });
          setShowHoldMenu(true);
        }
      }, 1000);
    } else {
      setShowHoldMenu(false);
      setConfirmingDeleteFloating(false);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const hitEdge = hitTestEdge(world.x, world.y);
      if (hitEdge) {
        onSelectEdge(hitEdge.id);
      } else {
        // Empty space clicked
        onSelectEdge(null);

        // Right-click or middle-click always pans
        if (e.button === 1 || e.button === 2) {
          isDraggingCanvasRef.current = true;
          return;
        }

        if (e.pointerType === 'touch') {
          if (interactionMode === 'select') {
            isMarqueeSelectingRef.current = true;
            setMarqueeBox({
              startX: clientX,
              startY: clientY,
              currentX: clientX,
              currentY: clientY,
            });
          } else {
            // Touch in default mode:
            // "Basılı tutup çekince" - if user holds for 180ms, switch to marquee selection!
            if (emptyTouchHoldTimerRef.current) clearTimeout(emptyTouchHoldTimerRef.current);
            emptyTouchHoldTimerRef.current = setTimeout(() => {
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(35);
              }
              isMarqueeSelectingRef.current = true;
              isDraggingCanvasRef.current = false;
              setMarqueeBox({
                startX: clientX,
                startY: clientY,
                currentX: clientX,
                currentY: clientY,
              });
            }, 180);
            isDraggingCanvasRef.current = true;
          }
        } else {
          // Desktop mouse on empty space
          if (interactionMode === 'pan' && !e.shiftKey) {
            isDraggingCanvasRef.current = true;
          } else {
            // Default: Left click and drag on empty space draws selection box
            isMarqueeSelectingRef.current = true;
            setMarqueeBox({
              startX: clientX,
              startY: clientY,
              currentX: clientX,
              currentY: clientY,
            });
          }
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If a 2-finger zoom/pan gesture is active, DO NOT process single finger drag events!
    if (isMultiTouchRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const dx = clientX - dragStartPosRef.current.x;
    const dy = clientY - dragStartPosRef.current.y;

    const distFromStart = Math.hypot(
      clientX - pointerDownPosRef.current.x,
      clientY - pointerDownPosRef.current.y
    );

    if (distFromStart > 5) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    // If empty touch hold timer was active and moved quickly, cancel timer and pan
    if (emptyTouchHoldTimerRef.current) {
      if (distFromStart > 10 && !isMarqueeSelectingRef.current) {
        clearTimeout(emptyTouchHoldTimerRef.current);
        emptyTouchHoldTimerRef.current = null;
      }
    }

    // 0. Drag-to-Connect port cable active
    if (isConnectingRef.current) {
      const world = screenToWorld(clientX, clientY);
      isConnectingRef.current.currentWorld = world;
      const target = hitTestNode(world.x, world.y);
      const validTargetId =
        target && target.id !== isConnectingRef.current.sourceNode.id ? target.id : null;

      setConnectingState({
        active: true,
        startX: isConnectingRef.current.startPort.x,
        startY: isConnectingRef.current.startPort.y,
        currentX: world.x,
        currentY: world.y,
        targetNodeId: validTargetId,
      });
      return;
    }

    // 1. Marquee selection active
    if (isMarqueeSelectingRef.current) {
      setMarqueeBox(prev => (prev ? { ...prev, currentX: clientX, currentY: clientY } : null));
      return;
    }

    // 2. Dragging a Node
    if (isDraggingNodeRef.current) {
      if (distFromStart > 4) {
        hasDraggedNodeRef.current = true;
        const draggedId = isDraggingNodeRef.current;
        const targetNode = nodes.find(n => n.id === draggedId);
        if (targetNode) {
          const worldDx = (clientX - pointerDownPosRef.current.x) / transform.scale;
          const worldDy = (clientY - pointerDownPosRef.current.y) / transform.scale;
          targetNode.x = nodeDragStartPosRef.current.x + worldDx;
          targetNode.y = nodeDragStartPosRef.current.y + worldDy;
        }
      }
      return;
    }

    // 3. Panning Canvas
    if (isDraggingCanvasRef.current) {
      onTransformChange({
        ...transform,
        x: transform.x + dx,
        y: transform.y + dy,
      });
      dragStartPosRef.current = { x: clientX, y: clientY };
      return;
    }

    // Check port hover when hovering canvas freely
    if (!isDraggingNodeRef.current && !isDraggingCanvasRef.current && !isMarqueeSelectingRef.current) {
      const world = screenToWorld(clientX, clientY);
      const portHit = hitTestPort(world.x, world.y, 14);
      if (portHit) {
        if (hoveredPort?.nodeId !== portHit.node.id || hoveredPort?.key !== portHit.port.key) {
          setHoveredPort({ nodeId: portHit.node.id, key: portHit.port.key });
        }
      } else if (hoveredPort) {
        setHoveredPort(null);
      }
    }
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (emptyTouchHoldTimerRef.current) {
      clearTimeout(emptyTouchHoldTimerRef.current);
      emptyTouchHoldTimerRef.current = null;
    }

    // 0. Finalize Drag-to-Connect
    if (isConnectingRef.current) {
      const sourceNode = isConnectingRef.current.sourceNode;
      const targetNode = connectingState?.targetNodeId
        ? nodes.find(n => n.id === connectingState.targetNodeId)
        : hitTestNode(isConnectingRef.current.currentWorld.x, isConnectingRef.current.currentWorld.y);

      if (targetNode && targetNode.id !== sourceNode.id) {
        const screenPos = {
          x: targetNode.x * transform.scale + transform.x,
          y: targetNode.y * transform.scale + transform.y,
        };
        setQuickConnectPopupData({
          sourceNode,
          targetNode,
          position: screenPos,
        });
      }

      isConnectingRef.current = null;
      setConnectingState(null);
      return;
    }

    if (isMultiTouchRef.current) {
      isDraggingNodeRef.current = null;
      hasDraggedNodeRef.current = false;
      isDraggingCanvasRef.current = false;
      return;
    }

    // Finalize Marquee Selection
    if (isMarqueeSelectingRef.current && marqueeBox) {
      isMarqueeSelectingRef.current = false;

      const minScreenX = Math.min(marqueeBox.startX, marqueeBox.currentX);
      const maxScreenX = Math.max(marqueeBox.startX, marqueeBox.currentX);
      const minScreenY = Math.min(marqueeBox.startY, marqueeBox.currentY);
      const maxScreenY = Math.max(marqueeBox.startY, marqueeBox.currentY);

      const dragDist = Math.hypot(maxScreenX - minScreenX, maxScreenY - minScreenY);

      // Only perform box selection if user dragged more than 6 pixels
      if (dragDist > 6) {
        const worldTopLeft = screenToWorld(minScreenX, minScreenY);
        const worldBottomRight = screenToWorld(maxScreenX, maxScreenY);

        const minWldX = Math.min(worldTopLeft.x, worldBottomRight.x);
        const maxWldX = Math.max(worldTopLeft.x, worldBottomRight.x);
        const minWldY = Math.min(worldTopLeft.y, worldBottomRight.y);
        const maxWldY = Math.max(worldTopLeft.y, worldBottomRight.y);

        const halfW = nodeWidth / 2;
        const halfH = nodeHeight / 2;

        // Find intersecting nodes (bounding box intersection)
        const enclosedIds = nodes
          .filter(n => {
            if (filter.types[n.type] === false && !filter.dimNonMatches) return false;
            return !(
              n.x + halfW < minWldX ||
              n.x - halfW > maxWldX ||
              n.y + halfH < minWldY ||
              n.y - halfH > maxWldY
            );
          })
          .map(n => n.id);

        onSelectMultipleNodes(enclosedIds);
      } else {
        // Just clicked on empty space without dragging: clear selection
        onSelectMultipleNodes([]);
      }
      setMarqueeBox(null);
    }

    // Finalize Node Drag or Momentary Tap
    if (isDraggingNodeRef.current) {
      const draggedNode = nodes.find(n => n.id === isDraggingNodeRef.current);
      if (draggedNode) {
        if (hasDraggedNodeRef.current) {
          // Node was moved to a new position! Save position, DO NOT open settings window.
          onNodeDragEnd(draggedNode.id, draggedNode.x, draggedNode.y);
        } else {
          // Momentary tap without dragging!
          // "Anlık dokunup çekersem o zaman ayar ekranı gelsin düğümler için"
          const elapsed = Date.now() - pointerDownTimeRef.current;
          if (elapsed < 450 && onNodeClick) {
            onNodeClick(draggedNode.id);
          }
        }
      }
      isDraggingNodeRef.current = null;
      hasDraggedNodeRef.current = false;
    }

    isDraggingCanvasRef.current = false;
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.min(3.5, Math.max(0.15, transform.scale * zoomFactor));

    const worldX = (mouseX - transform.x) / transform.scale;
    const worldY = (mouseY - transform.y) / transform.scale;

    onTransformChange({
      scale: newScale,
      x: mouseX - worldX * newScale,
      y: mouseY - worldY * newScale,
    });
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const world = screenToWorld(clientX, clientY);
    const hitNode = hitTestNode(world.x, world.y);

    if (hitNode) {
      onSelectNode(hitNode.id, false);
      setEdgeContextMenu(null);
      setContextMenu({
        visible: true,
        x: clientX,
        y: clientY,
        nodeId: hitNode.id,
      });
      return;
    }

    const hitEdge = hitTestEdge(world.x, world.y);
    if (hitEdge) {
      onSelectEdge(hitEdge.id);
      onSelectNode(null, false);
      setContextMenu(null);
      setEdgeContextMenu({
        visible: true,
        x: clientX,
        y: clientY,
        edgeId: hitEdge.id,
      });
      return;
    }

    setContextMenu(null);
    setEdgeContextMenu(null);
  };

  // Pinch-to-zoom on Android (Multi-touch with stationary world points)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length >= 2) {
      isMultiTouchRef.current = true;
      // Immediately cancel any node drag, marquee selection, canvas dragging, and timers
      isDraggingNodeRef.current = null;
      hasDraggedNodeRef.current = false;
      isDraggingCanvasRef.current = false;
      isMarqueeSelectingRef.current = false;
      setMarqueeBox(null);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (emptyTouchHoldTimerRef.current) {
        clearTimeout(emptyTouchHoldTimerRef.current);
        emptyTouchHoldTimerRef.current = null;
      }

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = transform.scale;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
        pinchStartMidRef.current = { x: midX, y: midY };
        pinchStartWorldMidRef.current = {
          x: (midX - transform.x) / transform.scale,
          y: (midY - transform.y) / transform.scale,
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (
      e.touches.length >= 2 &&
      pinchStartDistRef.current &&
      pinchStartScaleRef.current &&
      pinchStartWorldMidRef.current
    ) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / pinchStartDistRef.current;
      const newScale = Math.min(3.5, Math.max(0.15, pinchStartScaleRef.current * ratio));

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const currentMidX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const currentMidY = (t1.clientY + t2.clientY) / 2 - rect.top;

      // Keep the world point stationary relative to currentMid
      const newX = currentMidX - pinchStartWorldMidRef.current.x * newScale;
      const newY = currentMidY - pinchStartWorldMidRef.current.y * newScale;

      onTransformChange({
        scale: newScale,
        x: newX,
        y: newY,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) {
      pinchStartDistRef.current = null;
      pinchStartMidRef.current = null;
      pinchStartWorldMidRef.current = null;
      // Cool-down period before single-finger drag is re-enabled
      setTimeout(() => {
        isMultiTouchRef.current = false;
      }, 120);
    }
  };

  const activeContextMenuNode = contextMenu ? nodes.find(n => n.id === contextMenu.nodeId) : null;
  const activeContextMenuEdge = edgeContextMenu ? edges.find(e => e.id === edgeContextMenu.edgeId) : null;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none bg-[#f3f5f8]">
      <canvas
        ref={canvasRef}
        className={`w-full h-full block touch-none ${
          hoveredPort || connectingState?.active
            ? 'cursor-crosshair'
            : interactionMode === 'select'
            ? 'cursor-crosshair'
            : 'cursor-default'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* On-Canvas Quick Mode Switcher */}
      <div className="absolute top-2.5 left-2.5 z-30 flex items-center bg-[#f0f4f9] border border-[#7a8494] shadow-[0_2px_8px_rgba(0,0,0,0.2)] rounded text-[11px] overflow-hidden">
        <button
          type="button"
          onClick={() => {
            if (onToggleInteractionMode) onToggleInteractionMode();
          }}
          className={`px-2.5 py-1 font-bold flex items-center gap-1 cursor-pointer transition-colors ${
            interactionMode === 'select'
              ? 'bg-[#2563eb] text-white shadow-inner'
              : 'text-[#334155] hover:bg-[#e2e8f0]'
          }`}
          title="Kutu ile Toplu Seçim Modu (Boş alandan çekerek seçin)"
        >
          <span>⬚</span>
          <span>Toplu Seç</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (onToggleInteractionMode) onToggleInteractionMode();
          }}
          className={`px-2.5 py-1 font-bold flex items-center gap-1 cursor-pointer transition-colors border-l border-[#cbd5e1] ${
            interactionMode === 'pan'
              ? 'bg-[#2563eb] text-white shadow-inner'
              : 'text-[#334155] hover:bg-[#e2e8f0]'
          }`}
          title="Gezinme / Haritayı Kaydırma Modu"
        >
          <span>🖐️</span>
          <span>Kaydır</span>
        </button>
      </div>

      {/* Floating Quick Action Popover (ONLY appears after 1 second hold: "Sadece 1 sn basılı tutunca gelen bir menü olsun") */}
      {showHoldMenu && (selectedNodeIds.length > 0 || holdTargetNodeId) && (
        <div
          className="absolute z-40 bg-[#1e293b] text-white border-2 border-[#3b82f6] shadow-[0_6px_22px_rgba(0,0,0,0.5)] rounded px-2.5 py-1.5 flex items-center gap-2 text-xs animate-in fade-in duration-100 select-none"
          style={{
            left: Math.max(
              12,
              Math.min(
                (containerRef.current?.clientWidth || 300) - 290,
                holdMenuCoord
                  ? holdMenuCoord.x - 120
                  : selectedNodesBounds
                  ? selectedNodesBounds.centerX - 100
                  : 50
              )
            ),
            top: Math.max(
              45,
              Math.min(
                (containerRef.current?.clientHeight || 300) - 60,
                holdMenuCoord
                  ? holdMenuCoord.y - 50
                  : selectedNodesBounds
                  ? selectedNodesBounds.topY < 50
                    ? selectedNodesBounds.bottomY
                    : selectedNodesBounds.topY
                  : 50
              )
            ),
          }}
          onClick={e => e.stopPropagation()}
        >
          <span className="px-1.5 py-0.5 bg-[#2563eb] text-white font-bold rounded text-[11px] shrink-0">
            {selectedNodeIds.length > 1 ? `${selectedNodeIds.length} Seçili` : '1 Seçili'}
          </span>

          {confirmingDeleteFloating ? (
            <div className="flex items-center gap-1 bg-[#7f1d1d] px-1.5 py-0.5 rounded text-[11px]">
              <span className="text-white font-bold">Silinsin mi?</span>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSelected) onDeleteSelected();
                  setShowHoldMenu(false);
                  setConfirmingDeleteFloating(false);
                }}
                className="px-2 py-0.5 bg-[#dc2626] text-white font-bold rounded hover:bg-[#b91c1c] cursor-pointer"
              >
                Evet, Sil
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDeleteFloating(false)}
                className="px-1.5 py-0.5 bg-[#334155] text-white font-semibold rounded hover:bg-[#475569] cursor-pointer"
              >
                İptal
              </button>
            </div>
          ) : (
            <>
              {onDuplicateSelected && (
                <button
                  type="button"
                  onClick={() => {
                    onDuplicateSelected();
                    setShowHoldMenu(false);
                  }}
                  className="px-2 py-1 bg-[#334155] hover:bg-[#475569] text-white rounded font-semibold flex items-center gap-1 cursor-pointer text-[11px]"
                  title="Seçili düğümleri çoğalt (Duplicate)"
                >
                  <span>📋</span>
                  <span>Çoğalt</span>
                </button>
              )}

              {onDeleteSelected && (
                <button
                  type="button"
                  onClick={() => setConfirmingDeleteFloating(true)}
                  className="px-2 py-1 bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                  title={selectedNodeIds.length > 1 ? 'Seçili tüm düğümleri sil' : 'Düğümü sil'}
                >
                  <span>🗑️</span>
                  <span>{selectedNodeIds.length > 1 ? 'Toplu Sil' : 'Sil'}</span>
                </button>
              )}

              {onOpenConnectModal && (
                <button
                  type="button"
                  onClick={() => {
                    const src = holdTargetNodeId || selectedNodeIds[0];
                    if (src) onOpenConnectModal(src);
                    setShowHoldMenu(false);
                  }}
                  className="px-2 py-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded font-semibold flex items-center gap-1 cursor-pointer text-[11px]"
                  title="Bağlantı oluştur"
                >
                  <span>🔗</span>
                  <span>Bağla</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowHoldMenu(false);
                }}
                className="p-1 hover:bg-[#334155] text-[#94a3b8] hover:text-white rounded cursor-pointer ml-0.5"
                title="Menüyü Kapat"
              >
                ✕
              </button>
            </>
          )}
        </div>
      )}

      {/* Classic Windows Context Menu */}
      {contextMenu && activeContextMenuNode && (
        <div
          className="absolute z-50 bg-[#f0f0f0] border border-[#7a8494] shadow-[2px_2px_8px_rgba(0,0,0,0.35)] text-xs py-1 w-52 overflow-hidden"
          style={{
            left: Math.min(contextMenu.x, (containerRef.current?.clientWidth || 300) - 220),
            top: Math.min(contextMenu.y, (containerRef.current?.clientHeight || 300) - 200),
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1 bg-[#2b579a] text-white font-bold text-[11px] truncate">
            {activeContextMenuNode.label}
          </div>

          <div className="py-0.5">
            <button
              onClick={() => {
                onOpenAddModalForParent(activeContextMenuNode.id, false);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-[#1e293b] hover:bg-[#3399ff] hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <span className="font-bold text-emerald-700 hover:text-white">+</span>
              <span>Bağlı Düğüm Ekle</span>
            </button>

            <button
              onClick={() => {
                onOpenAddModalForParent(activeContextMenuNode.id, true);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-[#1e293b] hover:bg-[#3399ff] hover:text-white flex items-center gap-2 cursor-pointer font-semibold"
            >
              <span className="text-amber-600">⚡</span>
              <span>Birden Fazla Ekle...</span>
            </button>

            <button
              onClick={() => {
                onOpenConnectModal(activeContextMenuNode.id);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-[#1e293b] hover:bg-[#3399ff] hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <span>🔗</span>
              <span>Başka Düğüme Bağla</span>
            </button>

            <div className="h-px bg-[#d1d5db] my-1" />

            <button
              onClick={() => {
                onSelectNode(activeContextMenuNode.id, false);
                if (onNodeClick) onNodeClick(activeContextMenuNode.id);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-[#1e293b] hover:bg-[#3399ff] hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <span>🔍</span>
              <span>Özellikler / Detay</span>
            </button>

            <button
              onClick={() => {
                openGoogleSearch(activeContextMenuNode.label);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-[#1d4ed8] hover:bg-[#3399ff] hover:text-white flex items-center gap-2 cursor-pointer font-semibold"
            >
              <span>🌐</span>
              <span>Google'da Ara (Tarayıcıda Aç)</span>
            </button>

            <button
              onClick={() => {
                onDeleteNode(activeContextMenuNode.id);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-rose-700 hover:bg-[#3399ff] hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <span>🗑️</span>
              <span>Düğümü Sil</span>
            </button>
          </div>
        </div>
      )}

      {/* Classic Windows Edge Context Menu (Right-Click on Connection Cable) */}
      {edgeContextMenu && activeContextMenuEdge && (
        <div
          className="absolute z-50 bg-[#f0f0f0] border border-[#7a8494] shadow-[2px_2px_8px_rgba(0,0,0,0.35)] text-xs py-1 w-56 overflow-hidden"
          style={{
            left: Math.min(edgeContextMenu.x, (containerRef.current?.clientWidth || 300) - 230),
            top: Math.min(edgeContextMenu.y, (containerRef.current?.clientHeight || 300) - 180),
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1 bg-[#1e3a5f] text-white font-bold text-[11px] truncate flex items-center justify-between">
            <span>🔗 {activeContextMenuEdge.relation || 'Bağlantı'}</span>
            <span className="text-[10px] opacity-75">{activeContextMenuEdge.direction === 'bidirectional' ? '↔' : '➔'}</span>
          </div>

          <div className="py-0.5">
            <button
              onClick={() => {
                if (onDeleteEdge) onDeleteEdge(activeContextMenuEdge.id);
                setEdgeContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-rose-700 hover:bg-[#dc2626] hover:text-white flex items-center gap-2 cursor-pointer font-bold transition-colors"
            >
              <span>🗑️</span>
              <span>Bağlantıyı Kaldır / Sil</span>
            </button>

            <button
              onClick={() => {
                if (onEditEdge) {
                  onEditEdge(activeContextMenuEdge.id);
                } else {
                  onSelectEdge(activeContextMenuEdge.id);
                }
                setEdgeContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-[#1e293b] hover:bg-[#2563eb] hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>✏️</span>
              <span>İlişkiyi Düzenle...</span>
            </button>

            {onToggleEdgeDirection && (
              <button
                onClick={() => {
                  onToggleEdgeDirection(activeContextMenuEdge.id);
                  setEdgeContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 text-[#1e293b] hover:bg-[#2563eb] hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span>↔</span>
                <span>Yönü Değiştir (Tek / Çift)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Connect Popup Dialog (Auto-pops up after dragging from any port) */}
      {quickConnectPopupData && (
        <QuickConnectPopup
          sourceNode={quickConnectPopupData.sourceNode}
          targetNode={quickConnectPopupData.targetNode}
          position={quickConnectPopupData.position}
          language={language}
          onConfirm={relation => {
            if (onConnectDirect) {
              onConnectDirect(
                quickConnectPopupData.sourceNode.id,
                quickConnectPopupData.targetNode.id,
                relation
              );
            }
            setQuickConnectPopupData(null);
          }}
          onCancel={() => setQuickConnectPopupData(null)}
        />
      )}
    </div>
  );
};
