// Writes the enabled feature tokens onto <html data-cfb="...">. classic.css
// does all the styling; this script only decides which parts are switched on.
const root = document.documentElement;
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
let settings = { ...CFB_DEFAULTS };

// The classic palette only makes sense in light mode. Facebook marks the mode
// with a class on <html>; with neither class it follows the OS setting.
function isLightMode() {
  if (root.classList.contains('__fb-dark-mode')) return false;
  if (root.classList.contains('__fb-light-mode')) return true;
  return !darkQuery.matches;
}

function apply() {
  const tokens = settings.enabled ? CFB_FEATURES.filter((f) => settings[f]) : [];
  if (tokens.length && isLightMode()) tokens.push('light');
  const value = tokens.join(' ');
  if (root.getAttribute('data-cfb') !== value) root.setAttribute('data-cfb', value);
}

// Apply defaults right away so the old UI doesn't flash while storage loads.
apply();

chrome.storage.sync.get(CFB_DEFAULTS, (stored) => {
  settings = stored;
  apply();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  for (const [key, { newValue }] of Object.entries(changes)) settings[key] = newValue;
  apply();
});

// Re-apply when Facebook switches light/dark mode or rewrites <html> attributes.
new MutationObserver(apply).observe(root, {
  attributes: true,
  attributeFilter: ['class', 'data-cfb'],
});
darkQuery.addEventListener('change', apply);
