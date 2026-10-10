import names from './tacoNomes.json';

const originals = Object.keys(names).filter(name => name !== names[name]).sort((a, b) => b.length - a.length);
const pattern = new RegExp(originals.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');

export function formatFoodText(text) {
  return String(text || '').replace(pattern, name => names[name]);
}
