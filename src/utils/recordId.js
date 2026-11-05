// Numeración de la columna id: sigue después del último número de la base de
// la biblioteca, sin reutilizar los ya asignados en la tabla, el historial ni
// en sesiones anteriores de este navegador.
import { CATALOG_LAST_ID } from '../constants/catalogMeta';
import { loadHistory } from './history';

const LAST_ID_KEY = 'ebo-bmsd:lastId';

const readStored = () => {
  try { return parseInt(localStorage.getItem(LAST_ID_KEY), 10) || 0; } catch { return 0; }
};

const maxOf = (rows) => rows.reduce((m, r) => Math.max(m, parseInt(r.registroId, 10) || 0), 0);

export function nextRecordId(tableRecords = []) {
  const history = loadHistory().reduce((m, p) => Math.max(m, maxOf(p.rows)), 0);
  return Math.max(CATALOG_LAST_ID, readStored(), maxOf(tableRecords), history) + 1;
}

export function rememberRecordId(id) {
  try { localStorage.setItem(LAST_ID_KEY, String(id)); } catch { /* sin espacio */ }
}
