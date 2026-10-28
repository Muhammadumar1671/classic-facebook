// Adds the 2020 bar's "[photo] Name  Home" links beside the account buttons.
// They live in our own element on <body>, outside the tree React manages, and
// classic.css anchors it to the account buttons. Clicks go through
// Facebook's own link for the same page where there is one, so they navigate
// without a full reload.

const LINKS_ID = 'cfb-toplinks';
let profile = null; // { name, href, photo }

chrome.storage.local.get({ cfbProfile: null }, ({ cfbProfile }) => {
  if (!profile) profile = cfbProfile;
});

function imageHref(scope) {
  const image = scope && scope.querySelector('image');
  return image ? image.getAttribute('href') || image.getAttribute('xlink:href') : null;
}

// The left column's first row is you. It is only on the home page, so the
// last one seen is kept for the other pages.
function readProfile() {
  const link = document.querySelector('[role="navigation"]:has(~ [role="main"]) li a[href]');
  const name = link && link.textContent.trim();
  if (!name) return;
  const next = { name, href: link.getAttribute('href'), photo: imageHref(link) };
  if (profile && profile.name === next.name && profile.href === next.href && profile.photo === next.photo) return;
  profile = next;
  chrome.storage.local.set({ cfbProfile: profile });
}

function link(href, label, className) {
  const a = document.createElement('a');
  a.href = href;
  if (className) a.className = className;
  a.append(label);
  a.addEventListener('click', (event) => {
    const own = [...document.querySelectorAll(`a[href="${CSS.escape(href)}"]`)].find((el) => !el.closest(`#${LINKS_ID}`));
    if (!own || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    own.click();
  });
  return a;
}

function render() {
  const banner = document.querySelector('[role="banner"]');
  let bar = document.getElementById(LINKS_ID);
  if (!banner || !document.body) {
    if (bar) bar.remove();
    return;
  }
  readProfile();
  // The tab strip's Home link carries Facebook's own word for "Home".
  const home = banner.querySelector('a[href="/"][aria-label]:not([aria-label="Facebook"])');
  const homeLabel = (home && home.getAttribute('aria-label')) || 'Home';
  const photo = (profile && profile.photo) || imageHref(banner.querySelector('[role="navigation"] svg[role="img"]'));
  const key = JSON.stringify([profile, photo, homeLabel]);
  if (bar && bar.dataset.key === key) return;

  if (!bar) {
    bar = document.createElement('nav');
    bar.id = LINKS_ID;
    document.body.append(bar);
  }
  bar.dataset.key = key;
  bar.replaceChildren();
  if (profile) {
    const img = document.createElement('img');
    img.alt = '';
    if (photo) img.src = photo;
    const me = link(profile.href, profile.name.split(/\s+/)[0], 'cfb-me');
    me.prepend(img);
    bar.append(me);
  }
  bar.append(link('/', homeLabel));
}

let headerTimer = 0;
new MutationObserver(() => {
  if (headerTimer) return;
  headerTimer = setTimeout(() => {
    headerTimer = 0;
    render();
  }, 250);
}).observe(document, { childList: true, subtree: true });
