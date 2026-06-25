export function $(id) {
  return document.getElementById(id);
}

export function qs(sel, ctx) {
  return (ctx || document).querySelector(sel);
}

export function qsa(sel, ctx) {
  return (ctx || document).querySelectorAll(sel);
}

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "className") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("data-")) el.dataset[k.slice(5).toLowerCase()] = v;
    else if (k.startsWith("on") && k.length > 2 && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  });
  children.forEach(c => {
    if (typeof c === "string") el.appendChild(document.createTextNode(c));
    else if (c instanceof Node) el.appendChild(c);
  });
  return el;
}

export function clearElement(el) {
  el.innerHTML = "";
}
