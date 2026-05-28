const pool = require('../db');

const columnCache = new Map();

async function getColumns(tableName) {
  if (columnCache.has(tableName)) {
    return columnCache.get(tableName);
  }

  const [rows] = await pool.query(
    'SELECT COLUMN_NAME, COLUMN_KEY FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
    [process.env.DB_NAME, tableName]
  );

  const columns = rows.map((row) => row.COLUMN_NAME);
  const primaryKey = rows.find((row) => row.COLUMN_KEY === 'PRI')?.COLUMN_NAME || 'id';

  const result = {
    columns,
    primaryKey,
  };

  columnCache.set(tableName, result);
  return result;
}

function pickFields(source, allowedColumns, excludedColumns = []) {
  const data = {};
  const excluded = new Set(excludedColumns);

  Object.keys(source || {}).forEach((key) => {
    if (allowedColumns.includes(key) && !excluded.has(key) && source[key] !== undefined) {
      data[key] = source[key];
    }
  });

  return data;
}

function pickFirstValue(source, possibleKeys) {
  for (const key of possibleKeys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }

  return null;
}

function findFirstMatchingColumn(availableColumns, candidates) {
  return candidates.find((candidate) => availableColumns.includes(candidate)) || null;
}

function removeSensitiveFields(row) {
  if (!row) {
    return row;
  }

  const safeRow = { ...row };
  delete safeRow.password;
  return safeRow;
}

module.exports = {
  getColumns,
  pickFields,
  pickFirstValue,
  findFirstMatchingColumn,
  removeSensitiveFields,
};
