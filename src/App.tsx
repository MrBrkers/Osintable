/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  NodeEntity,
  EdgeEntity,
  NodeType,
  ViewTransform,
  FilterState,
  InvestigationProject,
  EdgeDirection,
  EdgeStyle,
} from './types/osint';
import {
  NODE_TYPE_CONFIGS,
  INITIAL_SAMPLE_PROJECT,
} from './utils/constants';
import {
  applyForceDirectedLayout,
  applyHierarchicalLayout,
  applyRadialLayout,
  applyCircularLayout,
  applyGridLayout,
  LayoutType,
} from './utils/layouts';
import {
  loadStoredProjects,
  saveStoredProjects,
  getActiveProjectId,
  setActiveProjectId,
  createNewProject,
  exportProjectToJSON,
  exportProjectToCSV,
  parseProjectFromJSON,
} from './utils/storage';

import { NetworkCanvas } from './components/NetworkCanvas';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { MobileBottomBar } from './components/MobileBottomBar';
import { BatchActionToolbar } from './components/BatchActionToolbar';
import { NodeDetailPanel } from './components/NodeDetailPanel';
import { AddNodeModal } from './components/AddNodeModal';
import { ConnectNodesModal } from './components/ConnectNodesModal';
import { EdgeDetailModal } from './components/EdgeDetailModal';
import { FilterModal } from './components/FilterModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import { PythonDesktopModal } from './components/PythonDesktopModal';
import { SettingsModal } from './components/SettingsModal';
import { Language } from './utils/i18n';

export default function App() {
  // -------------------------------------------------------------
  // LANGUAGE PREFERENCE (TR / EN)
  // -------------------------------------------------------------
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return (localStorage.getItem('osintdesk_lang') as Language) || 'tr';
    } catch {
      return 'tr';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('osintdesk_lang', language);
    } catch {}
  }, [language]);

  // -------------------------------------------------------------
  // PROJECTS & PERSISTENCE
  // -------------------------------------------------------------
  const [projects, setProjects] = useState<InvestigationProject[]>(() => loadStoredProjects());
  const [activeProjectId, setActiveProjId] = useState<string>(() =>
    getActiveProjectId(loadStoredProjects())
  );

  const currentProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || projects[0] || INITIAL_SAMPLE_PROJECT;
  }, [projects, activeProjectId]);

  useEffect(() => {
    saveStoredProjects(projects);
  }, [projects]);

  useEffect(() => {
    setActiveProjectId(activeProjectId);
  }, [activeProjectId]);

  // -------------------------------------------------------------
  // THEME & INTERACTION MODE
  // -------------------------------------------------------------
  const [canvasTheme, setCanvasTheme] = useState<'light' | 'dark'>('light');
  const [interactionMode, setInteractionMode] = useState<'pan' | 'select'>('select');

  // -------------------------------------------------------------
  // GRAPH SELECTION & VIEW TRANSFORM
  // -------------------------------------------------------------
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [focusTargetNodeId, setFocusTargetNodeId] = useState<string | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  const primarySelectedNodeId = selectedNodeIds[0] || null;

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNodeIds([id]);
    setSelectedEdgeId(null);
    setIsDetailPanelOpen(true);
  }, []);

  const [transform, setTransform] = useState<ViewTransform>({
    x: window.innerWidth > 768 ? window.innerWidth / 2 : window.innerWidth / 2,
    y: window.innerHeight / 2 - 30,
    scale: 0.95,
  });

  // -------------------------------------------------------------
  // UNDO / REDO HISTORY
  // -------------------------------------------------------------
  const [history, setHistory] = useState<InvestigationProject[]>([]);
  const [redoStack, setRedoStack] = useState<InvestigationProject[]>([]);

  const pushToHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-25), JSON.parse(JSON.stringify(currentProject))]);
    setRedoStack([]);
  }, [currentProject]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(currentProject))]);
    setHistory(prev => prev.slice(0, prev.length - 1));

    setProjects(prev =>
      prev.map(p => (p.id === activeProjectId ? { ...previous, id: activeProjectId } : p))
    );
  }, [history, currentProject, activeProjectId]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(currentProject))]);
    setRedoStack(prev => prev.slice(0, prev.length - 1));

    setProjects(prev =>
      prev.map(p => (p.id === activeProjectId ? { ...next, id: activeProjectId } : p))
    );
  }, [redoStack, currentProject, activeProjectId]);

  // -------------------------------------------------------------
  // FILTER STATE
  // -------------------------------------------------------------
  const [filter, setFilter] = useState<FilterState>(() => {
    const allTrue: Record<NodeType, boolean> = {} as any;
    (Object.keys(NODE_TYPE_CONFIGS) as NodeType[]).forEach(k => {
      allTrue[k] = true;
    });
    return {
      types: allTrue,
      tags: [],
      relationTypes: [],
      searchQuery: '',
      degreeFilter: 'all',
      dimNonMatches: true,
    };
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    const disabledTypes = Object.values(filter.types).filter(v => v === false).length;
    if (disabledTypes > 0) count++;
    if (filter.tags.length > 0) count += filter.tags.length;
    if (filter.relationTypes.length > 0) count += filter.relationTypes.length;
    if (filter.degreeFilter !== 'all') count++;
    return count;
  }, [filter]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    currentProject.nodes.forEach(n => {
      n.tags?.forEach(t => set.add(t));
    });
    return Array.from(set).sort();
  }, [currentProject.nodes]);

  const allRelationTypes = useMemo(() => {
    const set = new Set<string>();
    currentProject.edges.forEach(e => {
      if (e.relation) set.add(e.relation);
    });
    return Array.from(set).sort();
  }, [currentProject.edges]);

  // -------------------------------------------------------------
  // MODAL STATES
  // -------------------------------------------------------------
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalParentId, setAddModalParentId] = useState<string | null>(null);
  const [addModalMultiMode, setAddModalMultiMode] = useState(false);

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [connectModalSourceId, setConnectModalSourceId] = useState<string | null>(null);
  const [connectModalTargetId, setConnectModalTargetId] = useState<string | null>(null);

  const [edgeModalOpen, setEdgeModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [pythonModalOpen, setPythonModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Clipboard State (for Ctrl+C and Ctrl+V)
  const [clipboardNodes, setClipboardNodes] = useState<NodeEntity[]>([]);
  const [clipboardEdges, setClipboardEdges] = useState<EdgeEntity[]>([]);

  const primarySelectedNode = useMemo(() => {
    return currentProject.nodes.find(n => n.id === primarySelectedNodeId) || null;
  }, [currentProject.nodes, primarySelectedNodeId]);

  const selectedEdge = useMemo(() => {
    return currentProject.edges.find(e => e.id === selectedEdgeId) || null;
  }, [currentProject.edges, selectedEdgeId]);

  useEffect(() => {
    if (selectedEdgeId) {
      setEdgeModalOpen(true);
    }
  }, [selectedEdgeId]);

  // -------------------------------------------------------------
  // MUTATION HANDLERS
  // -------------------------------------------------------------
  const updateProjectData = useCallback(
    (nodes: NodeEntity[], edges: EdgeEntity[]) => {
      pushToHistory();
      setProjects(prev =>
        prev.map(p =>
          p.id === activeProjectId
            ? {
                ...p,
                nodes,
                edges,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
    },
    [activeProjectId, pushToHistory]
  );

  // Add Single Node
  const handleAddSingle = useCallback(
    (
      type: NodeType,
      label: string,
      relation: string,
      color?: string,
      tags?: string[],
      notes?: string,
      imageUrl?: string
    ) => {
      const parentNode = currentProject.nodes.find(n => n.id === addModalParentId);
      const newId = 'node_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      let posX = 0;
      let posY = 0;

      if (parentNode) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 140 + Math.random() * 40;
        posX = Math.round(parentNode.x + Math.cos(angle) * dist);
        posY = Math.round(parentNode.y + Math.sin(angle) * dist);
      } else {
        posX = Math.round((window.innerWidth / 2 - transform.x) / transform.scale);
        posY = Math.round((window.innerHeight / 2 - transform.y) / transform.scale);
      }

      const newNode: NodeEntity = {
        id: newId,
        type,
        label,
        notes: notes || '',
        tags: tags || [],
        color: color || NODE_TYPE_CONFIGS[type]?.defaultColor,
        imageUrl: imageUrl || undefined,
        sources: [],
        x: posX,
        y: posY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedNodes = [...currentProject.nodes, newNode];
      let updatedEdges = [...currentProject.edges];

      if (parentNode) {
        const newEdge: EdgeEntity = {
          id: 'edge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          source: parentNode.id,
          target: newId,
          relation: relation || 'İlişkili',
          color: color || newNode.color || '#1d5fa6',
          width: 2,
          style: 'solid',
          direction: 'directed',
          createdAt: new Date().toISOString(),
        };
        updatedEdges.push(newEdge);
      }

      updateProjectData(updatedNodes, updatedEdges);
      setSelectedNodeIds([newId]);
    },
    [currentProject, addModalParentId, transform, updateProjectData]
  );

  // Add Batch Nodes
  const handleAddBatch = useCallback(
    (
      type: NodeType,
      labels: string[],
      relation: string,
      color?: string,
      tags?: string[]
    ) => {
      if (labels.length === 0) return;
      const parentNode = currentProject.nodes.find(n => n.id === addModalParentId);
      const baseAngle = Math.random() * Math.PI * 2;
      const angleStep = (2 * Math.PI) / Math.max(1, labels.length);
      const radius = 150 + Math.min(labels.length * 15, 120);

      const newNodes: NodeEntity[] = [];
      const newEdges: EdgeEntity[] = [];

      labels.forEach((label, idx) => {
        const newId = 'node_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5);
        let posX = 0;
        let posY = 0;

        if (parentNode) {
          const angle = baseAngle + idx * angleStep;
          posX = Math.round(parentNode.x + Math.cos(angle) * radius);
          posY = Math.round(parentNode.y + Math.sin(angle) * radius);
        } else {
          const angle = idx * angleStep;
          const centerX = (window.innerWidth / 2 - transform.x) / transform.scale;
          const centerY = (window.innerHeight / 2 - transform.y) / transform.scale;
          posX = Math.round(centerX + Math.cos(angle) * radius);
          posY = Math.round(centerY + Math.sin(angle) * radius);
        }

        const nodeItem: NodeEntity = {
          id: newId,
          type,
          label,
          tags: tags || [],
          color: color || NODE_TYPE_CONFIGS[type]?.defaultColor,
          sources: [],
          x: posX,
          y: posY,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        newNodes.push(nodeItem);

        if (parentNode) {
          newEdges.push({
            id: 'edge_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5),
            source: parentNode.id,
            target: newId,
            relation: relation || 'İlişkili',
            color: color || nodeItem.color || '#1d5fa6',
            width: 2,
            style: 'solid',
            direction: 'directed',
            createdAt: new Date().toISOString(),
          });
        }
      });

      const updatedNodes = [...currentProject.nodes, ...newNodes];
      const updatedEdges = [...currentProject.edges, ...newEdges];

      updateProjectData(updatedNodes, updatedEdges);
      setSelectedNodeIds(newNodes.map(n => n.id));
    },
    [currentProject, addModalParentId, transform, updateProjectData]
  );

  // Connect two nodes (Fix: properly establish connection and highlight connected nodes)
  const handleConnect = useCallback(
    (
      sourceId: string,
      targetId: string,
      relation: string,
      color: string,
      width: number,
      style: EdgeStyle,
      direction: EdgeDirection
    ) => {
      if (!sourceId || !targetId || sourceId === targetId) return;

      const newEdge: EdgeEntity = {
        id: 'edge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        source: sourceId,
        target: targetId,
        relation: relation || 'İlişkili',
        color: color || '#1d5fa6',
        width: width || 2,
        style: style || 'solid',
        direction: direction || 'directed',
        createdAt: new Date().toISOString(),
      };

      updateProjectData(currentProject.nodes, [...currentProject.edges, newEdge]);
      setSelectedNodeIds([sourceId, targetId]);
      setIsDetailPanelOpen(false);
    },
    [currentProject, updateProjectData]
  );

  // Direct connection callback (called immediately by QuickConnectPopup / drag-to-connect)
  const handleConnectDirect = useCallback(
    (sourceId: string, targetId: string, relation: string) => {
      if (!sourceId || !targetId || sourceId === targetId) return;

      const newEdge: EdgeEntity = {
        id: 'edge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        source: sourceId,
        target: targetId,
        relation: relation.trim() || 'Bağlantılı',
        color: '#2563eb',
        width: 2,
        style: 'solid',
        direction: 'directed',
        createdAt: new Date().toISOString(),
      };

      updateProjectData(currentProject.nodes, [...currentProject.edges, newEdge]);
      setSelectedNodeIds([sourceId, targetId]);
    },
    [currentProject, updateProjectData]
  );

  // Centralized helper to open connect modal with preselected nodes
  const handleOpenConnectModal = useCallback(
    (sourceId?: string | null, targetId?: string | null) => {
      if (sourceId !== undefined && targetId !== undefined) {
        setConnectModalSourceId(sourceId);
        setConnectModalTargetId(targetId);
      } else if (sourceId !== undefined && sourceId !== null) {
        setConnectModalSourceId(sourceId);
        const otherNode = currentProject.nodes.find(n => n.id !== sourceId);
        setConnectModalTargetId(otherNode ? otherNode.id : null);
      } else if (selectedNodeIds.length >= 2) {
        setConnectModalSourceId(selectedNodeIds[0]);
        setConnectModalTargetId(selectedNodeIds[1]);
      } else if (selectedNodeIds.length === 1) {
        setConnectModalSourceId(selectedNodeIds[0]);
        const otherNode = currentProject.nodes.find(n => n.id !== selectedNodeIds[0]);
        setConnectModalTargetId(otherNode ? otherNode.id : null);
      } else {
        setConnectModalSourceId(currentProject.nodes[0]?.id || null);
        const otherNode = currentProject.nodes.find(n => n.id !== currentProject.nodes[0]?.id);
        setConnectModalTargetId(otherNode ? otherNode.id : null);
      }
      setConnectModalOpen(true);
    },
    [selectedNodeIds, currentProject.nodes]
  );

  const handleNodeDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      setProjects(prev =>
        prev.map(p =>
          p.id === activeProjectId
            ? {
                ...p,
                nodes: p.nodes.map(n => (n.id === id ? { ...n, x, y } : n)),
              }
            : p
        )
      );
    },
    [activeProjectId]
  );

  const handleUpdateNode = useCallback(
    (updated: NodeEntity) => {
      const updatedNodes = currentProject.nodes.map(n => (n.id === updated.id ? updated : n));
      updateProjectData(updatedNodes, currentProject.edges);
    },
    [currentProject, updateProjectData]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const updatedNodes = currentProject.nodes.filter(n => n.id !== nodeId);
      const updatedEdges = currentProject.edges.filter(
        e => e.source !== nodeId && e.target !== nodeId
      );
      setSelectedNodeIds(prev => prev.filter(id => id !== nodeId));
      updateProjectData(updatedNodes, updatedEdges);
    },
    [currentProject, updateProjectData]
  );

  // -------------------------------------------------------------
  // BULK ACTIONS (DUPLICATE & BULK DELETE - REQUESTED BY USER)
  // -------------------------------------------------------------
  const handleDuplicateSelected = useCallback(() => {
    if (selectedNodeIds.length === 0) return;

    const idMap = new Map<string, string>();
    const clonedNodes: NodeEntity[] = [];

    const selectedSet = new Set(selectedNodeIds);
    const nodesToClone = currentProject.nodes.filter(n => selectedSet.has(n.id));

    nodesToClone.forEach(orig => {
      const newId = 'node_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      idMap.set(orig.id, newId);

      clonedNodes.push({
        ...JSON.parse(JSON.stringify(orig)),
        id: newId,
        label: `${orig.label} (Kopya)`,
        x: orig.x + 50,
        y: orig.y + 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Also duplicate edges between cloned nodes
    const clonedEdges: EdgeEntity[] = [];
    currentProject.edges.forEach(edge => {
      if (idMap.has(edge.source) && idMap.has(edge.target)) {
        clonedEdges.push({
          ...JSON.parse(JSON.stringify(edge)),
          id: 'edge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          source: idMap.get(edge.source)!,
          target: idMap.get(edge.target)!,
          createdAt: new Date().toISOString(),
        });
      }
    });

    updateProjectData(
      [...currentProject.nodes, ...clonedNodes],
      [...currentProject.edges, ...clonedEdges]
    );

    setSelectedNodeIds(clonedNodes.map(n => n.id));
  }, [selectedNodeIds, currentProject, updateProjectData]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.length === 0) return;

    const selectedSet = new Set(selectedNodeIds);
    const updatedNodes = currentProject.nodes.filter(n => !selectedSet.has(n.id));
    const updatedEdges = currentProject.edges.filter(
      e => !selectedSet.has(e.source) && !selectedSet.has(e.target)
    );

    setSelectedNodeIds([]);
    updateProjectData(updatedNodes, updatedEdges);
  }, [selectedNodeIds, currentProject, updateProjectData]);

  const handleBulkColorSelected = useCallback(
    (color: string) => {
      if (selectedNodeIds.length === 0) return;
      const selectedSet = new Set(selectedNodeIds);
      const updatedNodes = currentProject.nodes.map(n =>
        selectedSet.has(n.id) ? { ...n, color, updatedAt: new Date().toISOString() } : n
      );
      updateProjectData(updatedNodes, currentProject.edges);
    },
    [selectedNodeIds, currentProject, updateProjectData]
  );

  const handleBulkTagSelected = useCallback(
    (tag: string) => {
      if (selectedNodeIds.length === 0 || !tag) return;
      const selectedSet = new Set(selectedNodeIds);
      const cleanTag = tag.trim().replace(/^#/, '');
      const updatedNodes = currentProject.nodes.map(n => {
        if (!selectedSet.has(n.id)) return n;
        const exists = n.tags?.includes(cleanTag);
        return {
          ...n,
          tags: exists ? n.tags : [...(n.tags || []), cleanTag],
          updatedAt: new Date().toISOString(),
        };
      });
      updateProjectData(updatedNodes, currentProject.edges);
    },
    [selectedNodeIds, currentProject, updateProjectData]
  );

  // Update / Delete Edge
  const handleUpdateEdge = useCallback(
    (updated: EdgeEntity) => {
      const updatedEdges = currentProject.edges.map(e => (e.id === updated.id ? updated : e));
      updateProjectData(currentProject.nodes, updatedEdges);
    },
    [currentProject, updateProjectData]
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      const updatedEdges = currentProject.edges.filter(e => e.id !== edgeId);
      if (selectedEdgeId === edgeId) {
        setSelectedEdgeId(null);
      }
      updateProjectData(currentProject.nodes, updatedEdges);
    },
    [currentProject, selectedEdgeId, updateProjectData]
  );

  const handleToggleEdgeDirection = useCallback(
    (edgeId: string) => {
      const targetEdge = currentProject.edges.find(e => e.id === edgeId);
      if (!targetEdge) return;
      const nextDir: EdgeDirection =
        targetEdge.direction === 'directed'
          ? 'bidirectional'
          : targetEdge.direction === 'bidirectional'
          ? 'undirected'
          : 'directed';
      handleUpdateEdge({
        ...targetEdge,
        direction: nextDir,
      });
    },
    [currentProject.edges, handleUpdateEdge]
  );

  // Copy to clipboard (Ctrl+C)
  const handleCopySelected = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    const selectedSet = new Set(selectedNodeIds);
    const nodesToCopy = currentProject.nodes.filter(n => selectedSet.has(n.id));
    const edgesToCopy = currentProject.edges.filter(
      e => selectedSet.has(e.source) && selectedSet.has(e.target)
    );
    setClipboardNodes(JSON.parse(JSON.stringify(nodesToCopy)));
    setClipboardEdges(JSON.parse(JSON.stringify(edgesToCopy)));
  }, [selectedNodeIds, currentProject]);

  // Paste from clipboard (Ctrl+V)
  const handlePasteSelected = useCallback(() => {
    if (clipboardNodes.length === 0) return;
    const idMap = new Map<string, string>();
    const newNodes: NodeEntity[] = [];

    clipboardNodes.forEach(orig => {
      const newId = 'node_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      idMap.set(orig.id, newId);
      newNodes.push({
        ...JSON.parse(JSON.stringify(orig)),
        id: newId,
        x: orig.x + 45,
        y: orig.y + 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    const newEdges: EdgeEntity[] = [];
    clipboardEdges.forEach(origEdge => {
      if (idMap.has(origEdge.source) && idMap.has(origEdge.target)) {
        newEdges.push({
          ...JSON.parse(JSON.stringify(origEdge)),
          id: 'edge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          source: idMap.get(origEdge.source)!,
          target: idMap.get(origEdge.target)!,
          createdAt: new Date().toISOString(),
        });
      }
    });

    updateProjectData(
      [...currentProject.nodes, ...newNodes],
      [...currentProject.edges, ...newEdges]
    );
    setSelectedNodeIds(newNodes.map(n => n.id));
    setSelectedEdgeId(null);
  }, [clipboardNodes, clipboardEdges, currentProject, updateProjectData]);

  // Select All (Ctrl+A)
  const handleSelectAll = useCallback(() => {
    setSelectedNodeIds(currentProject.nodes.map(n => n.id));
    setSelectedEdgeId(null);
  }, [currentProject.nodes]);

  // Layouts
  const handleApplyLayout = useCallback(
    (type: LayoutType) => {
      let layoutedNodes: NodeEntity[] = [];

      switch (type) {
        case 'force':
          layoutedNodes = applyForceDirectedLayout(
            currentProject.nodes,
            currentProject.edges,
            80
          );
          break;
        case 'hierarchical':
          layoutedNodes = applyHierarchicalLayout(
            currentProject.nodes,
            currentProject.edges,
            primarySelectedNodeId || undefined
          );
          break;
        case 'radial':
          layoutedNodes = applyRadialLayout(
            currentProject.nodes,
            currentProject.edges,
            primarySelectedNodeId || undefined
          );
          break;
        case 'circular':
          layoutedNodes = applyCircularLayout(currentProject.nodes);
          break;
        case 'grid':
          layoutedNodes = applyGridLayout(currentProject.nodes);
          break;
      }

      updateProjectData(layoutedNodes, currentProject.edges);
    },
    [currentProject, primarySelectedNodeId, updateProjectData]
  );

  const handleZoomIn = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(3.5, prev.scale * 1.25),
    }));
  };

  const handleZoomOut = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.15, prev.scale * 0.8),
    }));
  };

  const handleResetZoom = () => {
    setTransform(prev => ({
      ...prev,
      scale: 1.0,
    }));
  };

  const handleFitView = useCallback(() => {
    if (currentProject.nodes.length === 0) {
      setTransform({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        scale: 1,
      });
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    currentProject.nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const pad = 120;
    const w = Math.max(100, maxX - minX + pad * 2);
    const h = Math.max(100, maxY - minY + pad * 2);

    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    const scale = Math.min(1.8, Math.max(0.2, Math.min(vpW / w, vpH / h)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setTransform({
      x: vpW / 2 - centerX * scale,
      y: vpH / 2 - centerY * scale,
      scale,
    });
  }, [currentProject.nodes]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopySelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        // Ctrl+D to duplicate selected nodes
        e.preventDefault();
        handleDuplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        // Ctrl+A to select all nodes
        e.preventDefault();
        handleSelectAll();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        } else if (selectedEdgeId) {
          e.preventDefault();
          handleDeleteEdge(selectedEdgeId);
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeIds([]);
        setSelectedEdgeId(null);
        setAddModalOpen(false);
        setConnectModalOpen(false);
        setFilterModalOpen(false);
        setProjectModalOpen(false);
        setExportModalOpen(false);
        setHelpModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    selectedNodeIds,
    selectedEdgeId,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleDeleteEdge,
  ]);

  // -------------------------------------------------------------
  // EXPORT HANDLERS
  // -------------------------------------------------------------
  const handleExportImage = (format: 'png' | 'jpeg') => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    const safeName = currentProject.name.replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, '_').toLowerCase();
    a.download = `osintdesk_${safeName}_${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportPDF = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${currentProject.name} - OsintDesk Raporu</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, sans-serif; margin: 20px; background: #fff; color: #111; }
            h1 { font-size: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 6px; margin-bottom: 6px; color: #1e3a8a; }
            .meta { font-size: 12px; color: #555; margin-bottom: 16px; }
            img { max-width: 100%; border: 1px solid #ccc; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>OsintDesk Araştırma Raporu: ${currentProject.name}</h1>
          <div class="meta">
            Oluşturulma: ${new Date().toLocaleString('tr-TR')} | 
            Varlık Sayısı: ${currentProject.nodes.length} | 
            İlişki Sayısı: ${currentProject.edges.length}
          </div>
          <img src="${dataUrl}" alt="Network Graph" />
          <div style="margin-top: 20px;">
            <h3>Varlık Envanteri</h3>
            <table>
              <thead>
                <tr>
                  <th>Varlık Adı</th>
                  <th>Türü</th>
                  <th>Etiketler</th>
                  <th>Kaynak Sayısı</th>
                </tr>
              </thead>
              <tbody>
                ${currentProject.nodes
                  .map(
                    n => `
                  <tr>
                    <td><strong>${n.label}</strong></td>
                    <td>${NODE_TYPE_CONFIGS[n.type]?.label || n.type}</td>
                    <td>${(n.tags || []).join(', ') || '-'}</td>
                    <td>${n.sources?.length || 0}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleImportJSON = (jsonString: string) => {
    try {
      const parsed = parseProjectFromJSON(jsonString);
      setProjects(prev => [parsed, ...prev.filter(p => p.id !== parsed.id)]);
      setActiveProjId(parsed.id);
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
    } catch (err) {
      alert('Dosya içe aktarılırken hata oluştu: ' + (err instanceof Error ? err.message : 'Geçersiz JSON'));
    }
  };

  const handleLoadSample = () => {
    if (window.confirm('Örnek Atlas Holding araştırması yüklensin mi?')) {
      setProjects(prev => [INITIAL_SAMPLE_PROJECT, ...prev.filter(p => p.id !== INITIAL_SAMPLE_PROJECT.id)]);
      setActiveProjId(INITIAL_SAMPLE_PROJECT.id);
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#d4d9df] text-[#1e293b] font-sans select-none">
      {/* MS Office 2010 Style Ribbon & Window Header */}
      <Toolbar
        nodes={currentProject.nodes}
        projectName={currentProject.name}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onApplyLayout={handleApplyLayout}
        onOpenAddModal={() => {
          setAddModalParentId(null);
          setAddModalMultiMode(false);
          setAddModalOpen(true);
        }}
        onOpenBatchAdd={() => {
          setAddModalParentId(null);
          setAddModalMultiMode(true);
          setAddModalOpen(true);
        }}
        onOpenConnectModal={() => handleOpenConnectModal()}
        onOpenFilterModal={() => setFilterModalOpen(true)}
        onOpenProjectModal={() => setProjectModalOpen(true)}
        onOpenExportModal={() => setExportModalOpen(true)}
        onOpenHelpModal={() => setHelpModalOpen(true)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onSelectNode={id => {
          setSelectedNodeIds(id ? [id] : []);
          setIsDetailPanelOpen(!!id);
        }}
        onFocusNode={id => {
          setSelectedNodeIds([id]);
          setFocusTargetNodeId(id);
          setIsDetailPanelOpen(true);
        }}
        activeFilterCount={activeFilterCount}
        canvasTheme={canvasTheme}
        onToggleCanvasTheme={() => setCanvasTheme(t => (t === 'light' ? 'dark' : 'light'))}
        interactionMode={interactionMode}
        onToggleInteractionMode={() =>
          setInteractionMode(m => (m === 'pan' ? 'select' : 'pan'))
        }
        onOpenPythonModal={() => setPythonModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        language={language}
      />

      {/* Main Diagram Canvas Area with classic sunken border */}
      <main className="relative flex-1 w-full h-full overflow-hidden border-t border-b border-[#828c9b]">
        <NetworkCanvas
          nodes={currentProject.nodes}
          edges={currentProject.edges}
          selectedNodeIds={selectedNodeIds}
          selectedEdgeId={selectedEdgeId}
          transform={transform}
          onTransformChange={setTransform}
          onSelectNode={(id, isShift) => {
            if (!id) {
              setSelectedNodeIds([]);
              setIsDetailPanelOpen(false);
              return;
            }
            if (isShift) {
              setSelectedNodeIds(prev =>
                prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
              );
            } else {
              setSelectedNodeIds([id]);
            }
            setSelectedEdgeId(null);
          }}
          onSelectMultipleNodes={ids => {
            setSelectedNodeIds(ids);
            setIsDetailPanelOpen(false);
            if (ids.length > 0) setSelectedEdgeId(null);
          }}
          onSelectEdge={id => {
            setSelectedEdgeId(id);
            if (id) {
              setSelectedNodeIds([]);
              setIsDetailPanelOpen(false);
            }
          }}
          onNodeDragEnd={handleNodeDragEnd}
          onNodeClick={handleNodeClick}
          onOpenAddModalForParent={(parentId, multiMode) => {
            setAddModalParentId(parentId);
            setAddModalMultiMode(!!multiMode);
            setAddModalOpen(true);
          }}
          onOpenConnectModal={sourceId => handleOpenConnectModal(sourceId)}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          onEditEdge={edgeId => {
            setSelectedEdgeId(edgeId);
            setEdgeModalOpen(true);
          }}
          onToggleEdgeDirection={handleToggleEdgeDirection}
          onConnectDirect={handleConnectDirect}
          onDuplicateSelected={handleDuplicateSelected}
          onDeleteSelected={handleDeleteSelected}
          onToggleInteractionMode={() =>
            setInteractionMode(m => (m === 'pan' ? 'select' : 'pan'))
          }
          filter={filter}
          focusTargetNodeId={focusTargetNodeId}
          onFocusHandled={() => setFocusTargetNodeId(null)}
          canvasTheme={canvasTheme}
          interactionMode={interactionMode}
          language={language}
        />

        {/* Node Properties Dialog (Single node inspection - only opens on momentary tap/click) */}
        {primarySelectedNode && selectedNodeIds.length === 1 && isDetailPanelOpen && (
          <NodeDetailPanel
            node={primarySelectedNode}
            allNodes={currentProject.nodes}
            edges={currentProject.edges}
            onClose={() => setIsDetailPanelOpen(false)}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onOpenAddModal={(nodeId, multiMode) => {
              setAddModalParentId(nodeId);
              setAddModalMultiMode(multiMode);
              setAddModalOpen(true);
            }}
            onOpenConnectModal={nodeId => handleOpenConnectModal(nodeId)}
            onFocusNode={nodeId => {
              setSelectedNodeIds([nodeId]);
              setFocusTargetNodeId(nodeId);
              setIsDetailPanelOpen(true);
            }}
          />
        )}
      </main>

      {/* Classic Status Bar */}
      <StatusBar
        transform={transform}
        nodeCount={currentProject.nodes.length}
        edgeCount={currentProject.edges.length}
        projectName={currentProject.name}
        selectedNode={primarySelectedNode}
        onFitView={handleFitView}
        onResetZoom={handleResetZoom}
      />

      {/* Dedicated Mobile Vertical Navigation Dock */}
      <MobileBottomBar
        onOpenAddModal={() => {
          setAddModalParentId(null);
          setAddModalMultiMode(false);
          setAddModalOpen(true);
        }}
        onOpenBatchAdd={() => {
          setAddModalParentId(null);
          setAddModalMultiMode(true);
          setAddModalOpen(true);
        }}
        onOpenConnectModal={() => handleOpenConnectModal()}
        onQuickLayout={() => handleApplyLayout('force')}
        onOpenFilterModal={() => setFilterModalOpen(true)}
        activeFilterCount={activeFilterCount}
        interactionMode={interactionMode}
        onToggleInteractionMode={() =>
          setInteractionMode(m => (m === 'pan' ? 'select' : 'pan'))
        }
      />

      {/* --------------------------------------------------------- */}
      {/* CLASSIC WINDOWS DIALOG MODALS */}
      {/* --------------------------------------------------------- */}

      {/* Add / Batch Add Modal */}
      <AddNodeModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        parentNode={currentProject.nodes.find(n => n.id === addModalParentId) || null}
        initialMultiMode={addModalMultiMode}
        onAddSingle={handleAddSingle}
        onAddBatch={handleAddBatch}
      />

      {/* Connect Nodes Modal */}
      <ConnectNodesModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        sourceNodeId={connectModalSourceId}
        targetNodeId={connectModalTargetId}
        allNodes={currentProject.nodes}
        onConnect={handleConnect}
      />

      {/* Edge Details Modal */}
      <EdgeDetailModal
        edge={selectedEdge}
        nodes={currentProject.nodes}
        onClose={() => {
          setEdgeModalOpen(false);
          setSelectedEdgeId(null);
        }}
        onUpdateEdge={handleUpdateEdge}
        onDeleteEdge={handleDeleteEdge}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filter={filter}
        onFilterChange={setFilter}
        allTags={allTags}
        allRelationTypes={allRelationTypes}
      />

      {/* Project Manager Modal */}
      <ProjectManagerModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={id => {
          setActiveProjId(id);
          setSelectedNodeIds([]);
          setSelectedEdgeId(null);
        }}
        onCreateProject={(name, desc) => {
          const newProj = createNewProject(name, desc);
          setProjects(prev => [newProj, ...prev]);
          setActiveProjId(newProj.id);
          setSelectedNodeIds([]);
          setSelectedEdgeId(null);
        }}
        onRenameProject={(id, newName) => {
          setProjects(prev =>
            prev.map(p => (p.id === id ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p))
          );
        }}
        onDuplicateProject={id => {
          const orig = projects.find(p => p.id === id);
          if (!orig) return;
          const dup: InvestigationProject = {
            ...JSON.parse(JSON.stringify(orig)),
            id: 'proj_' + Date.now(),
            name: `${orig.name} (Kopya)`,
            updatedAt: new Date().toISOString(),
          };
          setProjects(prev => [dup, ...prev]);
          setActiveProjId(dup.id);
        }}
        onDeleteProject={id => {
          const remaining = projects.filter(p => p.id !== id);
          if (remaining.length === 0) {
            const fresh = createNewProject('Yeni Araştırma');
            setProjects([fresh]);
            setActiveProjId(fresh.id);
          } else {
            setProjects(remaining);
            if (activeProjectId === id) {
              setActiveProjId(remaining[0].id);
            }
          }
        }}
        onExportJSON={exportProjectToJSON}
        onExportCSV={exportProjectToCSV}
        onImportJSON={handleImportJSON}
        onLoadSample={handleLoadSample}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        project={currentProject}
        onExportImage={handleExportImage}
        onExportPDF={handleExportPDF}
        onExportJSON={exportProjectToJSON}
        onExportCSV={exportProjectToCSV}
      />

      {/* Help Modal */}
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />

      {/* Python Desktop GUI Modal */}
      <PythonDesktopModal
        isOpen={pythonModalOpen}
        onClose={() => setPythonModalOpen(false)}
        project={currentProject}
      />

      {/* Settings & Language Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        language={language}
        onLanguageChange={setLanguage}
        canvasTheme={canvasTheme}
        onToggleTheme={() => setCanvasTheme(t => (t === 'light' ? 'dark' : 'light'))}
      />
    </div>
  );
}
