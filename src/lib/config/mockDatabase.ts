// ─── In-Memory Mock Database ────────────────────────────────────────────────
// Provides a Cosmos DB-compatible API backed by in-memory arrays.
// Used when Azure credentials are not configured (local dev / demo mode).
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Minimal interface matching the Cosmos Container methods our services use.
 */
export interface MockContainer {
  items: {
    create: (item: any) => Promise<{ resource: any }>;
    query: (querySpec: any) => { fetchAll: () => Promise<{ resources: any[] }> };
  };
  item: (id: string, partitionKey?: string) => {
    replace: (item: any) => Promise<{ resource: any }>;
    patch: (operations: any[]) => Promise<{ resource: any }>;
    read: () => Promise<{ resource: any }>;
  };
}

class InMemoryContainer implements MockContainer {
  private store: any[] = [];
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  items = {
    create: async (item: any) => {
      this.store.push({ ...item });
      return { resource: item };
    },

    query: (querySpec: any) => ({
      fetchAll: async () => {
        const resources = this.executeQuery(querySpec);
        return { resources };
      },
    }),
  };

  item(id: string, _partitionKey?: string) {
    const self = this;
    return {
      replace: async (item: any) => {
        const index = self.store.findIndex((doc) => doc.id === id);
        if (index === -1) throw new Error(`Item ${id} not found in ${self.name}`);
        self.store[index] = { ...item };
        return { resource: item };
      },

      patch: async (operations: any[]) => {
        const index = self.store.findIndex((doc) => doc.id === id);
        if (index === -1) throw new Error(`Item ${id} not found in ${self.name}`);
        const doc = self.store[index];

        for (const op of operations) {
          const key = op.path.replace(/^\//, '');
          if (op.op === 'set') {
            doc[key] = op.value;
          } else if (op.op === 'incr') {
            doc[key] = (doc[key] || 0) + op.value;
          }
        }

        self.store[index] = doc;
        return { resource: doc };
      },

      read: async () => {
        const doc = self.store.find((d) => d.id === id);
        return { resource: doc || null };
      },
    };
  }

  /**
   * Simple SQL-like query executor for the mock store.
   * Supports: WHERE with =, AND, OR, CONTAINS, LOWER, ARRAY_CONTAINS
   * Supports: ORDER BY, OFFSET, LIMIT
   * Supports: COUNT(1), AVG(c.field)
   */
  private executeQuery(querySpec: any): any[] {
    const query: string = typeof querySpec === 'string' ? querySpec : querySpec.query;
    const params: Array<{ name: string; value: any }> = querySpec.parameters || [];

    // Build a lookup map for parameters
    const paramMap: Record<string, any> = {};
    for (const p of params) {
      paramMap[p.name] = p.value;
    }

    // Determine if this is a COUNT query
    const isCount = /SELECT\s+VALUE\s+COUNT\s*\(\s*1\s*\)/i.test(query);
    
    // Determine if this is an AVG query
    const avgMatch = query.match(/SELECT\s+VALUE\s*\{\s*"count"\s*:\s*COUNT\s*\(\s*1\s*\)\s*,\s*"avg"\s*:\s*AVG\s*\(\s*c\.(\w+)\s*\)\s*\}/i);
    const avgAvgMatch = query.match(/SELECT\s+VALUE\s*\{\s*"average"\s*:\s*AVG\s*\(\s*c\.(\w+)\s*\)\s*,\s*"count"\s*:\s*COUNT\s*\(\s*1\s*\)\s*\}/i);

    // Filter documents based on WHERE clause
    let filtered = this.applyWhereClause(query, paramMap);

    // Handle COUNT
    if (isCount) {
      return [filtered.length];
    }

    // Handle aggregate (AVG + COUNT)
    if (avgMatch) {
      const field = avgMatch[1];
      const count = filtered.length;
      const avg = count > 0 ? filtered.reduce((sum, d) => sum + (d[field] || 0), 0) / count : 0;
      return [{ count, avg }];
    }

    if (avgAvgMatch) {
      const field = avgAvgMatch[1];
      const count = filtered.length;
      const average = count > 0 ? filtered.reduce((sum, d) => sum + (d[field] || 0), 0) / count : 0;
      return [{ average, count }];
    }

    // ORDER BY
    const orderMatch = query.match(/ORDER\s+BY\s+c\.(\w+)\s+(ASC|DESC)?/i);
    if (orderMatch) {
      const field = orderMatch[1];
      const dir = (orderMatch[2] || 'ASC').toUpperCase();
      filtered.sort((a, b) => {
        if (a[field] < b[field]) return dir === 'ASC' ? -1 : 1;
        if (a[field] > b[field]) return dir === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    // OFFSET and LIMIT
    const offsetMatch = query.match(/OFFSET\s+@?(\w+)/i);
    const limitMatch = query.match(/LIMIT\s+@?(\w+)/i);

    let offset = 0;
    let limit = filtered.length;

    if (offsetMatch) {
      const offsetKey = offsetMatch[1];
      offset = offsetKey.startsWith('offset') ? (paramMap[`@${offsetKey}`] ?? (parseInt(offsetKey, 10) || 0)) : (parseInt(offsetKey, 10) || 0);
    }
    if (limitMatch) {
      const limitKey = limitMatch[1];
      limit = limitKey.startsWith('limit') ? (paramMap[`@${limitKey}`] ?? (parseInt(limitKey, 10) || filtered.length)) : (parseInt(limitKey, 10) || filtered.length);
    }

    filtered = filtered.slice(offset, offset + limit);

    // SELECT specific fields (SELECT c.id, c.userId, ...)
    const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
    if (selectMatch) {
      const selectClause = selectMatch[1].trim();
      if (selectClause === '*' || selectClause === 'c' || selectClause.includes('*')) {
        return filtered;
      }
    }

    return filtered;
  }

  private applyWhereClause(query: string, paramMap: Record<string, any>): any[] {
    const whereMatch = query.match(/WHERE\s+([\s\S]+?)(?:\s+ORDER|\s+OFFSET|\s+LIMIT|\s+GROUP|\s*$)/i);
    if (!whereMatch) return [...this.store];

    const whereClause = whereMatch[1].trim();
    
    return this.store.filter((doc) => this.evaluateCondition(doc, whereClause, paramMap));
  }

  private evaluateCondition(doc: any, condition: string, params: Record<string, any>): boolean {
    // Clean up parentheses for simpler parsing
    let cleaned = condition.trim();

    // Handle OR-connected groups
    // Split on top-level OR (not inside parentheses)
    const orParts = this.splitTopLevel(cleaned, ' OR ');
    if (orParts.length > 1) {
      return orParts.some((part) => this.evaluateCondition(doc, part.trim(), params));
    }

    // Handle AND-connected groups
    const andParts = this.splitTopLevel(cleaned, ' AND ');
    if (andParts.length > 1) {
      return andParts.every((part) => this.evaluateCondition(doc, part.trim(), params));
    }

    // Strip outer parentheses
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      cleaned = cleaned.slice(1, -1).trim();
      return this.evaluateCondition(doc, cleaned, params);
    }

    // Handle specific condition types:

    // c.field = @param OR c.field = "value"
    const eqMatch = cleaned.match(/^c\.(\w+)\s*=\s*(@\w+|"[^"]*")$/i);
    if (eqMatch) {
      const field = eqMatch[1];
      const value = eqMatch[2].startsWith('@') ? params[eqMatch[2]] : eqMatch[2].replace(/"/g, '');
      return doc[field] === value;
    }

    // CONTAINS(LOWER(c.field), @param)
    const containsLowerMatch = cleaned.match(/CONTAINS\s*\(\s*LOWER\s*\(\s*c\.(\w+)\s*\)\s*,\s*(@\w+)\s*\)/i);
    if (containsLowerMatch) {
      const field = containsLowerMatch[1];
      const value = params[containsLowerMatch[2]];
      return ((doc[field] || '') as string).toLowerCase().includes(value);
    }

    // ARRAY_CONTAINS(c.field, @param)
    const arrayContainsMatch = cleaned.match(/ARRAY_CONTAINS\s*\(\s*c\.(\w+)\s*,\s*(@\w+)\s*\)/i);
    if (arrayContainsMatch) {
      const field = arrayContainsMatch[1];
      const value = params[arrayContainsMatch[2]];
      return Array.isArray(doc[field]) && doc[field].includes(value);
    }

    // c.moderationStatus = "safe" (inline string)
    const inlineEqMatch = cleaned.match(/^c\.(\w+)\s*=\s*"([^"]*)"$/i);
    if (inlineEqMatch) {
      return doc[inlineEqMatch[1]] === inlineEqMatch[2];
    }

    // Fallback: pass everything
    return true;
  }

  private splitTopLevel(str: string, delimiter: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let current = '';

    for (let i = 0; i < str.length; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') depth--;

      if (depth === 0 && str.substring(i, i + delimiter.length).toUpperCase() === delimiter.toUpperCase()) {
        parts.push(current);
        current = '';
        i += delimiter.length - 1;
      } else {
        current += str[i];
      }
    }
    parts.push(current);
    return parts;
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

const mockContainers: Record<string, MockContainer> = {};

export function createMockContainers(): void {
  for (const name of ['users', 'posts', 'comments', 'ratings']) {
    mockContainers[name] = new InMemoryContainer(name);
  }
  console.log('✅ In-memory mock database initialized (data will not persist across restarts)');
}

export function getMockContainer(name: string): MockContainer {
  if (!mockContainers[name]) {
    throw new Error(`Mock container "${name}" not found`);
  }
  return mockContainers[name];
}
