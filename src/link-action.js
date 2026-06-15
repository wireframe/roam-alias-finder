export async function linkMatch({ blockUid, string, range, pageTitle }) {
  const next = wrapAsAlias(string, range, pageTitle);
  await window.roamAlphaAPI.updateBlock({
    block: { uid: blockUid, string: next },
  });
}

function wrapAsAlias(string, range, pageTitle) {
  const text = string.slice(range.start, range.end);
  const alias = `[${text}]([[${pageTitle}]])`;
  return string.slice(0, range.start) + alias + string.slice(range.end);
}
