export type NodeType =
  | 'person'        // Kişi
  | 'organization'  // Kurum
  | 'company'       // Şirket
  | 'ngo'           // Dernek / STK
  | 'website'       // Web sitesi
  | 'social'        // Sosyal medya hesabı
  | 'email'         // E-posta
  | 'phone'         // Telefon numarası
  | 'location'      // Konum
  | 'document'      // Belge
  | 'event'         // Olay
  | 'custom';       // Diğer / Özel düğüm

export interface NodeSource {
  id: string;
  url: string;
  title: string;
  addedAt: string;
}

export interface NodeEntity {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  notes?: string;
  tags: string[];
  color?: string;
  imageUrl?: string;
  sources: NodeSource[];
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, string>;
}

export type EdgeDirection = 'directed' | 'reverse' | 'bidirectional' | 'undirected';
export type EdgeStyle = 'solid' | 'dashed' | 'dotted';

export interface EdgeEntity {
  id: string;
  source: string;
  target: string;
  relation: string;
  color: string;
  width: number;
  style: EdgeStyle;
  direction: EdgeDirection;
  notes?: string;
  createdAt: string;
}

export interface InvestigationProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  nodes: NodeEntity[];
  edges: EdgeEntity[];
}

export interface FilterState {
  types: Record<NodeType, boolean>;
  tags: string[];
  relationTypes: string[];
  searchQuery: string;
  degreeFilter: 'all' | '1st' | '2nd';
  dimNonMatches: boolean;
}

export interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}
