import fs from "fs";
import path from "path";
import { getTableName } from "drizzle-orm";

const PERSISTENCE_FILE = path.join("/tmp", "verifyabroad_mockdb_store.json");

function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, g) => g.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function getVal(row: any, colName: string): any {
  if (!row || typeof row !== "object") return undefined;
  if (colName in row) return row[colName];
  const camel = toCamelCase(colName);
  if (camel in row) return row[camel];
  const snake = toSnakeCase(colName);
  if (snake in row) return row[snake];
  return undefined;
}

function extractPairs(sql: any): { col: string; val: any }[] {
  const pairs: { col: string; val: any }[] = [];
  function walk(chunks: any[]) {
    let lastCol: string | null = null;
    for (const chunk of chunks) {
      if (!chunk) continue;
      if (chunk.queryChunks) {
        walk(chunk.queryChunks);
      } else if (chunk.name && typeof chunk.dataType === "string") {
        lastCol = chunk.name;
      } else if (
        typeof chunk.value !== "undefined" &&
        !Array.isArray(chunk.value) &&
        !chunk.name &&
        !chunk.dataType
      ) {
        if (lastCol) {
          pairs.push({ col: lastCol, val: chunk.value });
          lastCol = null;
        }
      }
    }
  }
  if (sql && sql.queryChunks) {
    walk(sql.queryChunks);
  }
  return pairs;
}

function rowMatchesCondition(row: any, cond: any): boolean {
  if (!cond) return true;
  const pairs = extractPairs(cond);
  if (pairs.length === 0) return true;
  for (const { col, val } of pairs) {
    const rowVal = getVal(row, col);
    if (rowVal !== val) {
      // Loose comparison for string vs number if needed
      if (String(rowVal) !== String(val)) {
        return false;
      }
    }
  }
  return true;
}

// Global store to persist across hot reloads in dev
const globalForStore = globalThis as unknown as {
  __mockDbStore?: Record<string, any[]>;
  __mockDbCounters?: Record<string, number>;
};

if (!globalForStore.__mockDbStore) {
  globalForStore.__mockDbStore = {
    universities: [],
    programs: [],
    agents: [],
    scholarships: [],
    community_reports: [],
    official_channels: [],
    students: [],
    investigations: [],
    investigation_messages: [],
    evidence_items: [],
  };
}

if (!globalForStore.__mockDbCounters) {
  globalForStore.__mockDbCounters = {};
}

const store = globalForStore.__mockDbStore;
const counters = globalForStore.__mockDbCounters;

let diskInitialized = false;

function ensureLoadedFromDisk() {
  if (diskInitialized) return;
  diskInitialized = true;
  try {
    if (fs.existsSync(PERSISTENCE_FILE)) {
      const content = fs.readFileSync(PERSISTENCE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.store && typeof parsed.store === "object") {
        for (const [tbl, rows] of Object.entries(parsed.store)) {
          if (Array.isArray(rows)) {
            store[tbl] = rows.map((r: any) => ({
              ...r,
              createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
              updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
            }));
          }
        }
      }
      if (parsed.counters && typeof parsed.counters === "object") {
        Object.assign(counters, parsed.counters);
      }
    }
  } catch (_e) {
    // Ignore file read/parse errors
  }
}

function syncToDisk() {
  try {
    fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify({ store, counters }, null, 2), "utf-8");
  } catch (_e) {
    // Ignore file write errors
  }
}

// Initial load
ensureLoadedFromDisk();

function getTableRows(tableName: string): any[] {
  ensureLoadedFromDisk();
  if (!store[tableName]) {
    store[tableName] = [];
  }
  return store[tableName];
}

function nextId(tableName: string): number {
  ensureLoadedFromDisk();
  counters[tableName] = (counters[tableName] ?? 0) + 1;
  return counters[tableName];
}

export function createMockDb() {
  return {
    select(selection?: any) {
      let targetTable: any = null;
      let targetTableName = "";
      let whereCond: any = null;
      let orderSpecs: any[] = [];
      let limitCount: number | null = null;

      const queryBuilder = {
        from(table: any) {
          targetTable = table;
          targetTableName = getTableName(table);
          return queryBuilder;
        },
        where(cond: any) {
          whereCond = cond;
          return queryBuilder;
        },
        orderBy(...cols: any[]) {
          orderSpecs = cols;
          return queryBuilder;
        },
        limit(n: number) {
          limitCount = n;
          return queryBuilder;
        },
        then(resolve: (res: any) => any, reject?: (err: any) => any) {
          try {
            const rawRows = getTableRows(targetTableName);
            let filtered = rawRows.filter((r) => rowMatchesCondition(r, whereCond));

            // Handle sorting
            if (orderSpecs.length > 0) {
              for (const spec of orderSpecs) {
                let colName = "";
                let isDesc = false;
                if (spec && spec.queryChunks) {
                  // desc(col)
                  isDesc = true;
                  for (const ch of spec.queryChunks) {
                    if (ch && ch.name) {
                      colName = ch.name;
                      break;
                    }
                  }
                } else if (spec && spec.name) {
                  colName = spec.name;
                }
                if (colName) {
                  filtered.sort((a, b) => {
                    const valA = getVal(a, colName);
                    const valB = getVal(b, colName);
                    if (valA == null) return isDesc ? 1 : -1;
                    if (valB == null) return isDesc ? -1 : 1;
                    if (valA instanceof Date && valB instanceof Date) {
                      return isDesc ? valB.getTime() - valA.getTime() : valA.getTime() - valB.getTime();
                    }
                    if (valA < valB) return isDesc ? 1 : -1;
                    if (valA > valB) return isDesc ? -1 : 1;
                    return 0;
                  });
                }
              }
            }

            if (limitCount != null) {
              filtered = filtered.slice(0, limitCount);
            }

            // Handle selection projection if provided
            if (selection && typeof selection === "object") {
              if ("count" in selection) {
                return resolve([{ count: filtered.length }]);
              }
              const keys = Object.keys(selection);
              const projected = filtered.map((row) => {
                const out: any = {};
                for (const k of keys) {
                  out[k] = getVal(row, k);
                }
                return out;
              });
              return resolve(projected);
            }

            return resolve(filtered);
          } catch (err) {
            if (reject) return reject(err);
            throw err;
          }
        },
      };

      return queryBuilder;
    },

    insert(table: any) {
      const targetTableName = getTableName(table);
      let valuesToInsert: any[] = [];

      const insertBuilder = {
        values(data: any | any[]) {
          valuesToInsert = Array.isArray(data) ? data : [data];
          return insertBuilder;
        },
        returning() {
          return insertBuilder;
        },
        then(resolve: (res: any) => any, reject?: (err: any) => any) {
          try {
            const tableRows = getTableRows(targetTableName);
            const now = new Date();
            const insertedRows = valuesToInsert.map((item) => {
              const row: any = {
                id: item.id ?? nextId(targetTableName),
                createdAt: item.createdAt ?? now,
                updatedAt: item.updatedAt ?? now,
                ...item,
              };
              tableRows.push(row);
              return row;
            });
            syncToDisk();
            return resolve(insertedRows);
          } catch (err) {
            if (reject) return reject(err);
            throw err;
          }
        },
      };

      return insertBuilder;
    },

    update(table: any) {
      const targetTableName = getTableName(table);
      let setValues: any = {};
      let whereCond: any = null;

      const updateBuilder = {
        set(values: any) {
          setValues = values;
          return updateBuilder;
        },
        where(cond: any) {
          whereCond = cond;
          return updateBuilder;
        },
        returning() {
          return updateBuilder;
        },
        then(resolve: (res: any) => any, reject?: (err: any) => any) {
          try {
            const tableRows = getTableRows(targetTableName);
            const updatedRows: any[] = [];
            for (let i = 0; i < tableRows.length; i++) {
              if (rowMatchesCondition(tableRows[i], whereCond)) {
                tableRows[i] = {
                  ...tableRows[i],
                  ...setValues,
                  updatedAt: setValues.updatedAt ?? new Date(),
                };
                updatedRows.push(tableRows[i]);
              }
            }
            syncToDisk();
            return resolve(updatedRows);
          } catch (err) {
            if (reject) return reject(err);
            throw err;
          }
        },
      };

      return updateBuilder;
    },

    delete(table: any) {
      const targetTableName = getTableName(table);
      let whereCond: any = null;

      const deleteBuilder = {
        where(cond: any) {
          whereCond = cond;
          return deleteBuilder;
        },
        then(resolve: (res: any) => any, reject?: (err: any) => any) {
          try {
            const tableRows = getTableRows(targetTableName);
            const remaining = tableRows.filter((r) => !rowMatchesCondition(r, whereCond));
            store[targetTableName] = remaining;
            syncToDisk();
            return resolve([]);
          } catch (err) {
            if (reject) return reject(err);
            throw err;
          }
        },
      };

      return deleteBuilder;
    },

    async execute(_sql: any) {
      return { rows: [{ "?column?": 1 }] };
    },
  };
}
