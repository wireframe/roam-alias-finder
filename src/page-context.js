export function getCurrentPageTitle() {
  const titleEl = document.querySelector(".rm-title-display");
  if (!titleEl) return null;
  return titleEl.textContent.trim();
}

export function getPageBody() {
  return (
    document.querySelector(".rm-article-wrapper") ||
    document.querySelector(".roam-article")
  );
}

export function observePageChanges(onChange) {
  const target = document.getElementById("app");
  if (!target) return () => {};

  let lastTitle = null;

  const handleMutation = debounce(() => {
    const title = getCurrentPageTitle();
    if (title && title !== lastTitle) {
      lastTitle = title;
      onChange(title);
    }
  }, 200);

  const observer = new MutationObserver(handleMutation);
  observer.observe(target, { childList: true, subtree: true });

  return () => observer.disconnect();
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
