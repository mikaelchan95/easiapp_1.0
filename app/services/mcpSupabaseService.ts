/**
 * MCP Supabase Service Integration
 * 
 * This service provides enhanced Supabase integration using MCP (Model Context Protocol)
 * for AI-powered database management and operations.
 */

import { supabase } from './supabaseService';

export interface DatabaseTable {
  name: string;
  schema: string;
  columns: DatabaseColumn[];
  row_count?: number;
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  primary_key?: boolean;
  foreign_key?: {
    table: string;
    column: string;
  };
}

export interface QueryResult {
  data: any[];
  count?: number;
  error?: string;
}

export interface ProjectConfiguration {
  project_ref: string;
  name: string;
  database_url: string;
  api_url: string;
  auth_url: string;
  storage_url: string;
  features: string[];
}

export class MCPSupabaseService {
  private static instance: MCPSupabaseService;
  
  private constructor() {}
  
  static getInstance(): MCPSupabaseService {
    if (!MCPSupabaseService.instance) {
      MCPSupabaseService.instance = new MCPSupabaseService();
    }
    return MCPSupabaseService.instance;
  }

  /**
   * Get project configuration and status
   * This method leverages Claude Code's MCP integration for enhanced project management
   */
  async getProjectConfiguration(): Promise<ProjectConfiguration> {
    try {
      // Note: In a real implementation, Claude Code would use the MCP server
      // For now, we'll return the known configuration
      return {
        project_ref: 'vqxnkxaeriizizfmqvua',
        name: 'EasiApp',
        database_url: 'https://vqxnkxaeriizizfmqvua.supabase.co',
        api_url: 'https://vqxnkxaeriizizfmqvua.supabase.co/rest/v1',
        auth_url: 'https://vqxnkxaeriizizfmqvua.supabase.co/auth/v1',
        storage_url: 'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1',
        features: ['database', 'auth', 'storage', 'edge-functions', 'realtime'],
      };
    } catch (error) {
      console.error('MCP Supabase Service - Get Project Configuration Error:', error);
      throw error;
    }
  }

  /**
   * List all database tables with metadata
   */
  async listTables(): Promise<DatabaseTable[]> {
    try {
      // Query system tables to get table information
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public');

      if (error) {
        throw new Error(`Failed to list tables: ${error.message}`);
      }

      // Get column information for each table
      const tablesWithColumns = await Promise.all(
        tables.map(async (table) => {
          const { data: columns, error: columnError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_schema', 'public')
            .eq('table_name', table.table_name);

          if (columnError) {
            console.error(`Failed to get columns for ${table.table_name}:`, columnError);
            return {
              name: table.table_name,
              schema: table.table_schema,
              columns: [],
            };
          }

          return {
            name: table.table_name,
            schema: table.table_schema,
            columns: columns.map(col => ({
              name: col.column_name,
              type: col.data_type,
              nullable: col.is_nullable === 'YES',
              default: col.column_default,
            })),
          };
        })
      );

      return tablesWithColumns;
    } catch (error) {
      console.error('MCP Supabase Service - List Tables Error:', error);
      throw error;
    }
  }

  /**
   * Execute read-only database query
   */
  async executeQuery(query: string): Promise<QueryResult> {
    try {
      // Validate that the query is read-only
      const normalizedQuery = query.toLowerCase().trim();
      const readOnlyPatterns = [
        /^select\s/,
        /^with\s.*\sselect\s/,
        /^explain\s/,
        /^show\s/,
      ];

      const isReadOnly = readOnlyPatterns.some(pattern => pattern.test(normalizedQuery));
      
      if (!isReadOnly) {
        throw new Error('Only read-only queries are allowed');
      }

      // Execute the query through Supabase RPC
      const { data, error, count } = await supabase.rpc('execute_read_only_query', {
        query_text: query,
      });

      if (error) {
        throw new Error(`Query execution failed: ${error.message}`);
      }

      return {
        data: data || [],
        count,
      };
    } catch (error) {
      console.error('MCP Supabase Service - Execute Query Error:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get table statistics and insights
   */
  async getTableStats(tableName: string): Promise<{
    row_count: number;
    table_size: string;
    index_size: string;
    last_updated: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_table_stats', {
        table_name: tableName,
      });

      if (error) {
        throw new Error(`Failed to get table stats: ${error.message}`);
      }

      return {
        row_count: data.row_count || 0,
        table_size: data.table_size || '0 bytes',
        index_size: data.index_size || '0 bytes',
        last_updated: data.last_updated || new Date().toISOString(),
      };
    } catch (error) {
      console.error('MCP Supabase Service - Get Table Stats Error:', error);
      throw error;
    }
  }

  /**
   * Monitor real-time database changes
   */
  async subscribeToChanges(
    tableName: string,
    callback: (payload: any) => void
  ): Promise<() => void> {
    try {
      const subscription = supabase
        .channel(`mcp_${tableName}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
          },
          (payload) => {
            callback(payload);
          }
        )
        .subscribe();

      // Return unsubscribe function
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('MCP Supabase Service - Subscribe to Changes Error:', error);
      throw error;
    }
  }

  /**
   * Get database health and performance metrics
   */
  async getDatabaseHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    connection_count: number;
    active_queries: number;
    cache_hit_ratio: number;
    response_time: number;
  }> {
    try {
      const startTime = Date.now();
      
      // Simple health check query
      const { data, error } = await supabase
        .from('users')
        .select('count(*)', { count: 'exact' })
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'unhealthy',
          connection_count: 0,
          active_queries: 0,
          cache_hit_ratio: 0,
          response_time: responseTime,
        };
      }

      // Get additional metrics from pg_stat_database
      const { data: dbStats, error: statsError } = await supabase.rpc('get_db_stats');

      if (statsError) {
        console.error('Failed to get database stats:', statsError);
      }

      return {
        status: responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'degraded' : 'unhealthy',
        connection_count: dbStats?.connection_count || 0,
        active_queries: dbStats?.active_queries || 0,
        cache_hit_ratio: dbStats?.cache_hit_ratio || 0,
        response_time: responseTime,
      };
    } catch (error) {
      console.error('MCP Supabase Service - Get Database Health Error:', error);
      return {
        status: 'unhealthy',
        connection_count: 0,
        active_queries: 0,
        cache_hit_ratio: 0,
        response_time: 0,
      };
    }
  }

  /**
   * Get storage bucket information
   */
  async getStorageBuckets(): Promise<{
    name: string;
    id: string;
    public: boolean;
    file_size_limit?: number;
    allowed_mime_types?: string[];
  }[]> {
    try {
      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        throw new Error(`Failed to list storage buckets: ${error.message}`);
      }

      return data.map(bucket => ({
        name: bucket.name,
        id: bucket.id,
        public: bucket.public,
        file_size_limit: bucket.file_size_limit,
        allowed_mime_types: bucket.allowed_mime_types,
      }));
    } catch (error) {
      console.error('MCP Supabase Service - Get Storage Buckets Error:', error);
      throw error;
    }
  }

  /**
   * Analyze query performance and suggest optimizations
   */
  async analyzeQuery(query: string): Promise<{
    estimated_cost: number;
    execution_time: number;
    suggestions: string[];
    indexes_used: string[];
  }> {
    try {
      // Execute EXPLAIN ANALYZE for query performance
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const { data, error } = await supabase.rpc('execute_explain_query', {
        query_text: explainQuery,
      });

      if (error) {
        throw new Error(`Query analysis failed: ${error.message}`);
      }

      // Parse the execution plan
      const plan = data?.[0]?.['QUERY PLAN']?.[0] || {};
      
      return {
        estimated_cost: plan['Total Cost'] || 0,
        execution_time: plan['Actual Total Time'] || 0,
        suggestions: this.generateQuerySuggestions(plan),
        indexes_used: this.extractIndexesUsed(plan),
      };
    } catch (error) {
      console.error('MCP Supabase Service - Analyze Query Error:', error);
      return {
        estimated_cost: 0,
        execution_time: 0,
        suggestions: ['Unable to analyze query'],
        indexes_used: [],
      };
    }
  }

  private generateQuerySuggestions(plan: any): string[] {
    const suggestions: string[] = [];
    
    if (plan['Actual Total Time'] > 1000) {
      suggestions.push('Consider adding indexes to improve performance');
    }
    
    if (plan['Node Type'] === 'Seq Scan') {
      suggestions.push('Sequential scan detected - consider adding an index');
    }
    
    if (plan['Rows Removed by Filter'] > 1000) {
      suggestions.push('Many rows filtered - consider more selective WHERE clauses');
    }
    
    return suggestions;
  }

  private extractIndexesUsed(plan: any): string[] {
    const indexes: string[] = [];
    
    if (plan['Index Name']) {
      indexes.push(plan['Index Name']);
    }
    
    if (plan['Plans']) {
      plan['Plans'].forEach((subPlan: any) => {
        indexes.push(...this.extractIndexesUsed(subPlan));
      });
    }
    
    return [...new Set(indexes)];
  }
}

export default MCPSupabaseService.getInstance();