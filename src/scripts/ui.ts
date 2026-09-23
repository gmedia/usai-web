/** Progressive enhancement for copy buttons and tab lists. */

function initCopy() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy ?? '';
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return; // clipboard unavailable (insecure context or denied): leave the text selectable
      }
      const label = btn.querySelector<HTMLElement>('[data-copy-label]');
      const original = label?.textContent;
      btn.setAttribute('data-copied', '');
      if (label && btn.dataset.copiedLabel) label.textContent = btn.dataset.copiedLabel;
      setTimeout(() => {
        btn.removeAttribute('data-copied');
        if (label && original) label.textContent = original;
      }, 1600);
    });
  });
}

function initTabs() {
  document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((root) => {
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const select = (tab: HTMLButtonElement, focus = false) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls') ?? '');
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const key = e.key;
        let next = -1;
        if (key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        else if (key === 'Home') next = 0;
        else if (key === 'End') next = tabs.length - 1;
        if (next >= 0) {
          e.preventDefault();
          select(tabs[next], true);
        }
      });
    });
  });
}

initCopy();
initTabs();
