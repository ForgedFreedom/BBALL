import { RULES_VERSION } from '../data/rules.js';

// Kept apart from the main app state so Clear All can't lose rule edits.
const RULES_STORAGE_KEY = 'bballRules';

export const loadSavedRules = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(RULES_STORAGE_KEY));
    if (saved?.version === RULES_VERSION && typeof saved.text === 'string') return saved.text;
  } catch {
    // Unreadable storage: fall back to the built-in rules.
  }
  return null;
};

export const saveRules = (text) => {
  try {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify({ version: RULES_VERSION, text }));
    return true;
  } catch {
    return false;
  }
};

// Typed rule numbers are ignored (display renumbers), so inserting a rule
// doesn't make every rule after it count as changed.
const parseLine = (raw) => {
  const line = raw.trim();
  if (line.startsWith('#')) return { type: 'heading', text: line.replace(/^#+\s*/, '') };
  const rule = line.match(/^\d+[.)]\s*(.+)$/);
  if (rule) return { type: 'rule', text: rule[1] };
  return { type: 'paragraph', text: line };
};

export const parseRules = (text) => {
  let section = '';
  let number = 0;
  return text.split('\n').filter((l) => l.trim()).map((raw) => {
    const line = parseLine(raw);
    if (line.type === 'heading') {
      section = line.text;
      number = 0;
    } else if (line.type === 'rule') {
      number += 1;
    }
    return { ...line, section, number };
  });
};

// Text listing only the lines that differ, or '' when nothing does.
export const describeRuleChanges = (oldText, newText) => {
  const a = parseRules(oldText);
  const b = parseRules(newText);
  const same = (x, y) => x.type === y.type && x.text === y.text;

  // Longest common subsequence of lines.
  const lcs = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = same(a[i], b[j]) ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const changes = [];
  const add = (label, line) => {
    const where = line.type === 'heading' ? 'Section heading' : line.section;
    const number = line.type === 'rule' ? ` #${line.number}` : '';
    changes.push(`${label} - ${where}${number}:\n${line.text}`);
  };
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && same(a[i], b[j])) {
      i += 1;
      j += 1;
    } else if (j >= b.length || (i < a.length && lcs[i + 1][j] >= lcs[i][j + 1])) {
      add('REMOVED', a[i]);
      i += 1;
    } else {
      add('ADDED', b[j]);
      j += 1;
    }
  }
  return changes.join('\n\n');
};
