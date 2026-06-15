export function createFinderButton(label, onClick) {
  const button = document.createElement("button");
  button.className = "alias-finder-btn";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}
