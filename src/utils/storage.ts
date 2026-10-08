import { InvestigationProject, NodeEntity, EdgeEntity } from '../types/osint';
import { INITIAL_SAMPLE_PROJECT } from './constants';

const STORAGE_PROJECTS_KEY = 'maltego_osint_projects_v1';
const STORAGE_ACTIVE_ID_KEY = 'maltego_osint_active_proj_id_v1';

export function loadStoredProjects(): InvestigationProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (!raw) {
      const initial = [INITIAL_SAMPLE_PROJECT];
      saveStoredProjects(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [INITIAL_SAMPLE_PROJECT];
  } catch (err) {
    console.error('Error loading projects from storage:', err);
    return [INITIAL_SAMPLE_PROJECT];
  }
}

export function saveStoredProjects(projects: InvestigationProject[]): void {
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Error saving projects to storage:', err);
  }
}

export function getActiveProjectId(projects: InvestigationProject[]): string {
  try {
    const id = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
    if (id && projects.some(p => p.id === id)) {
      return id;
    }
    return projects[0]?.id || INITIAL_SAMPLE_PROJECT.id;
  } catch {
    return projects[0]?.id || INITIAL_SAMPLE_PROJECT.id;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
  } catch (err) {
    console.error('Error setting active project id:', err);
  }
}

export function createNewProject(name: string, description = ''): InvestigationProject {
  return {
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: name.trim() || 'Yeni Araştırma',
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
  };
}

export function exportProjectToJSON(project: InvestigationProject): void {
  const data = JSON.stringify(project, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = project.name.replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, '_').toLowerCase();
  a.download = `${safeName}_osint_export_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportProjectToCSV(project: InvestigationProject): void {
  // 1. Export Nodes CSV
  let nodesCsv = 'id,type,label,tags,sources_count,created_at\n';
  project.nodes.forEach(n => {
    const safeLabel = `"${(n.label || '').replace(/"/g, '""')}"`;
    const safeTags = `"${(n.tags || []).join(';')}"`;
    nodesCsv += `${n.id},${n.type},${safeLabel},${safeTags},${n.sources?.length || 0},${n.createdAt}\n`;
  });

  // 2. Export Edges CSV
  let edgesCsv = 'id,source_id,source_label,target_id,target_label,relation,color,direction\n';
  const nodeMap = new Map<string, NodeEntity>();
  project.nodes.forEach(n => nodeMap.set(n.id, n));

  project.edges.forEach(e => {
    const sLabel = `"${(nodeMap.get(e.source)?.label || e.source).replace(/"/g, '""')}"`;
    const tLabel = `"${(nodeMap.get(e.target)?.label || e.target).replace(/"/g, '""')}"`;
    const safeRel = `"${(e.relation || '').replace(/"/g, '""')}"`;
    edgesCsv += `${e.id},${e.source},${sLabel},${e.target},${tLabel},${safeRel},${e.color},${e.direction}\n`;
  });

  const fullCsv = `=== NODES ===\n${nodesCsv}\n\n=== EDGES ===\n${edgesCsv}`;
  const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = project.name.replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, '_').toLowerCase();
  a.download = `${safeName}_nodes_edges_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseProjectFromJSON(jsonContent: string): InvestigationProject {
  const parsed = JSON.parse(jsonContent);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Geçersiz dosya formatı.');
  }

  const nodes: NodeEntity[] = Array.isArray(parsed.nodes) ? parsed.nodes : [];
  const edges: EdgeEntity[] = Array.isArray(parsed.edges) ? parsed.edges : [];

  return {
    id: parsed.id || 'proj_' + Date.now(),
    name: parsed.name || 'İçe Aktarılan Araştırma',
    description: parsed.description || '',
    createdAt: parsed.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    edges,
  };
}
