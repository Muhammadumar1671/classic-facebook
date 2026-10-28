// Shared by content.js and popup.js. Each feature key maps to a token that
// content.js writes into <html data-cfb="...">, which classic.css keys off.
const CFB_FEATURES = ['colors', 'header', 'layout', 'feed', 'square', 'compact'];

const CFB_DEFAULTS = {
  enabled: true,
  colors: true,
  header: true,
  layout: true,
  feed: true,
  square: true,
  compact: true,
};
