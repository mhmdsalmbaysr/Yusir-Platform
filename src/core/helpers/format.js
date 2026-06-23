export function fmt(n) {
  return Number(n).toLocaleString("ar-EG");
}

export function formatPrice(price) {
  return `${fmt(price)} ريال`;
}

export function truncate(text, max = 80) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function generateId(prefix = "ID") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
