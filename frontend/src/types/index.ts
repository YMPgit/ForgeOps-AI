export interface QueryRequest {
  question: string;
  temperature?: number;
  max_tokens?: number;
  session_id?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  name: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}


export interface ChartRecommendation {
  type: string;
  x_axis: string;
  y_axis: string;
}

export interface Insights {
  summary: string;
  key_findings: string[];
  recommendations: string[];
  follow_up_questions: string[];
}

export interface QueryResponse {
  question: string;
  sql: string;
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  execution_time: number;
  chart_recommendation: ChartRecommendation | null;
  insights: Insights;
  follow_up_questions: string[];
}

export interface ErrorResponse {
  detail: string;
}

export interface HistoryItem {
  id: number;
  question: string;
  sql: string;
  timestamp: string;
  status: 'success' | 'error';
  execution_time: number;
  session_id?: string | null;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  row_count: number;
}

export interface SchemaInfo {
  tables: TableInfo[];
}

export interface DataSourceInfo {
  name: string;
  tables: number;
  total_rows: number;
}

export type MessageType = 'user' | 'ai';

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  sql?: string;
  results?: Record<string, unknown>[];
  columns?: string[];
  chart?: ChartRecommendation;
  insights?: Insights;
  followUpQuestions?: string[];
  processingSteps?: ProcessingStep[];
  rowCount?: number;
  error?: string;
}

export interface SettingsInfo {
  model: string;
  available_models: string[];
}

export interface UpdateSettingsPayload {
  model?: string;
}

