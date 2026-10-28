// Tags the parts of the page that classic.css restyles but can't find on its
// own: each post's card, its author and timestamp rows, its Like / Comment /
// Share bar and counts, the cards above the feed and the sections of the
// right column. They get data-cfb-part="...".
//
// Facebook's class names are generated, so parts are found by the markers
// Facebook puts on posts (data-focus="feed_story",
// data-ad-rendering-role="..."), ARIA roles and layout. Only the bar labels
// written below ("Like", "3 Comments") are English.

const STORY = '[role="main"] [data-focus="feed_story"]';
const ACTIONS = [
  { role: 'like_button', label: 'Like' },
  { role: 'comment_button', label: 'Comment', one: 'Comment', many: 'Comments' },
  { role: 'share_button', label: 'Share', one: 'Share', many: 'Shares' },
];

// Tags are written at the end of each pass. Writing them while still reading
// layout would make the browser recompute styles after every single tag.
const writes = [];

function mark(el, part) {
  writes.push(() => {
    if (el.dataset.cfbPart !== part) el.dataset.cfbPart = part;
  });
}

function setData(el, key, value) {
  writes.push(() => {
    if (el.dataset[key] !== value) el.dataset[key] = value;
  });
}

function isOpaque(el) {
  const bg = getComputedStyle(el).backgroundColor;
  return bg !== 'transparent' && !bg.endsWith(', 0)');
}

// Breadth-first, so it returns the shallowest match at most `depth` levels down.
function findDown(root, depth, test) {
  let level = [root];
  for (let d = 0; d < depth && level.length; d++) {
    const next = [];
    for (const el of level) {
      for (const child of el.children) {
        if (test(child)) return child;
        next.push(child);
      }
    }
    level = next;
  }
  return null;
}

function commonAncestor(els) {
  let node = els[0].parentElement;
  while (node && !els.every((el) => node.contains(el))) node = node.parentElement;
  return node;
}

// The child of `ancestor` that holds `el`.
function childHolding(ancestor, el) {
  while (el && el.parentElement !== ancestor) el = el.parentElement;
  return el;
}

// The name row and the timestamp row are the two rows of one column.
function tagHeader(card) {
  const name = card.querySelector('[data-ad-rendering-role="profile_name"]');
  if (!name) return;
  mark(name, 'author');
  let row = name;
  while (row.parentElement !== card && row.parentElement.childElementCount < 2) row = row.parentElement;
  if (row.nextElementSibling) mark(row.nextElementSibling, 'meta');
}

// Facebook's bar is small icon + count buttons on the left and the reaction
// icons on the right. The old one was a summary row ("[reactions] 12 ...
// 3 Comments 1 Share") over three equal Like / Comment / Share buttons, so
// each button gets a label, its count is hidden and the counts are copied
// onto the bar for classic.css to show.
function tagActions(card) {
  const found = ACTIONS
    .map((action) => ({ ...action, marker: card.querySelector(`[data-ad-rendering-role="${action.role}"]`) }))
    .filter((action) => action.marker && action.marker.closest('[role="button"]'));
  if (found.length < 2) return;
  const bar = commonAncestor(found.map((action) => action.marker.closest('[role="button"]')));
  mark(bar, 'actions');
  for (const { role, label, marker } of found) {
    // The marker sits in the icon's box; the count's box follows it.
    const icon = marker.parentElement;
    mark(childHolding(bar, marker), `action-${role.split('_')[0]}`);
    setData(icon.parentElement, 'cfbLabel', label);
    if (icon.nextElementSibling) mark(icon.nextElementSibling, 'count');
  }
  const toolbar = bar.querySelector('[role="toolbar"]');
  if (toolbar) mark(childHolding(bar, toolbar), 'reactions');
}

// Re-read on every pass: the counts change when someone reacts.
function updateCounts(bar) {
  const count = (role) => {
    const marker = bar.querySelector(`[data-ad-rendering-role="${role}"]`);
    const box = marker && marker.parentElement.nextElementSibling;
    return box ? box.textContent.trim() : '';
  };
  const tally = ACTIONS.slice(1)
    .map(({ role, one, many }) => {
      const n = count(role);
      return n && n !== '0' ? `${n} ${n === '1' ? one : many}` : '';
    })
    .filter(Boolean)
    .join('\u2003');
  setData(bar, 'cfbTally', tally);
  const reactions = bar.querySelector('[data-cfb-part="reactions"]');
  if (reactions) setData(reactions, 'cfbCount', count('like_button'));
}

// Runs on every post every pass: Facebook fills a post's wrapper in after
// creating it, and rebuilds its insides when it scrolls back into view. Parts
// already tagged are found again in one lookup each.
function tagPost(story) {
  const card = story.querySelector('[data-cfb-part="card"]') ||
    findDown(story, 12, (el) => el.offsetWidth >= story.offsetWidth * 0.9 && isOpaque(el));
  if (!card) return;
  mark(card, 'card');
  if (!card.querySelector('[data-cfb-part="author"]')) tagHeader(card);
  if (!card.querySelector('[data-cfb-part="actions"]')) tagActions(card);
}

function isCard(el) {
  return el.offsetWidth >= 300 && getComputedStyle(el).boxShadow !== 'none' && isOpaque(el);
}

// Cards above the feed: "What's on your mind?", notices and so on.
function tagBoxes(el, depth = 0) {
  for (const child of el.children) {
    if (child.matches('[data-focus="feed_story"], [data-cfb-part]')) continue;
    if (isCard(child)) mark(child, 'box');
    else if (depth < 10) tagBoxes(child, depth + 1);
  }
}

// Each right-column section: its heading's row and everything under it. The
// heading's row is its tallest ancestor that is still about one row high.
function tagRail() {
  const rail = document.getElementById('right_rail_container');
  if (!rail) return;
  for (const heading of rail.querySelectorAll('h2, h3')) {
    if (!heading.offsetWidth || heading.closest('[data-cfb-part="rail-head"]')) continue;
    let head = heading;
    while (head.parentElement !== rail && head.parentElement.offsetHeight < heading.offsetHeight + 40) head = head.parentElement;
    if (head.parentElement === rail) continue;
    mark(head, 'rail-head');
    mark(head.parentElement, 'rail-box');
  }
}

function tick(tokens) {
  if (tokens.includes('feed')) {
    for (const story of document.querySelectorAll(STORY)) tagPost(story);
    for (const bar of document.querySelectorAll('[role="main"] [data-cfb-part="actions"]')) updateCounts(bar);
    const column = document.querySelector('[role="main"]');
    if (column) tagBoxes(column);
  }
  if (tokens.includes('layout')) tagRail();
  for (const write of writes) write();
  writes.length = 0;
}

// Facebook mutates the page constantly, so batch the work.
let timer = 0;
function schedule() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = 0;
    const tokens = (document.documentElement.getAttribute('data-cfb') || '').split(' ');
    tick(tokens);
  }, 250);
}

new MutationObserver(schedule).observe(document, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['data-cfb'],
});
