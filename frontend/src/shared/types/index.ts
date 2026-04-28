// Tipos globales compartidos por toda la app.
// Los tipos específicos de cada dominio viven en su propia entity/feature.

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  code?: string;
  field?: string;
}
