export function clearElement(el: HTMLElement) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function showMessage(
  target: HTMLElement,
  message: string,
  variant: 'muted' | 'error' = 'muted'
) {
  const msg = createElement('p', variant === 'error' ? 'error' : 'muted', message);
  target.appendChild(msg);
  return msg;
}
