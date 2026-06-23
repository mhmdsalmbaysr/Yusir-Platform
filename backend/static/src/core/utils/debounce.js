export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function throttle(fn, ms = 300) {
  let waiting = false;
  return (...args) => {
    if (waiting) return;
    waiting = true;
    fn(...args);
    setTimeout(() => { waiting = false; }, ms);
  };
}
