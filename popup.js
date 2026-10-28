const enabledBox = document.getElementById('enabled');
const features = document.getElementById('features');
const featureBoxes = features.querySelectorAll('input[data-key]');

chrome.storage.sync.get(CFB_DEFAULTS, (settings) => {
  enabledBox.checked = settings.enabled;
  features.disabled = !settings.enabled;
  for (const box of featureBoxes) box.checked = settings[box.dataset.key];
});

enabledBox.addEventListener('change', () => {
  features.disabled = !enabledBox.checked;
  chrome.storage.sync.set({ enabled: enabledBox.checked });
});

for (const box of featureBoxes) {
  box.addEventListener('change', () => chrome.storage.sync.set({ [box.dataset.key]: box.checked }));
}
