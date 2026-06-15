export function getCurrentPageTitle() {
  const titleEl = document.querySelector(".rm-title-display");
  if (!titleEl) return null;
  return titleEl.textContent.trim();
}

export function isDailyNotePage(title) {
  return Boolean(window.roamAlphaAPI?.util?.pageTitleToDate?.(title));
}

export function getReferencesAnchor() {
  const article = document.querySelector(".roam-article");
  if (!article) return null;
  // Use the page's own references section, not one rendered inside an embed or
  // query in the page body (those appear earlier in the DOM).
  const refs = [...article.querySelectorAll(".rm-reference-main")].find(
    (el) => !el.closest(".rm-embed-container, .rm-query"),
  );
  return refs ? refs.parentElement : null;
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
      onChange();
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
