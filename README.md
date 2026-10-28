# Classic Facebook

A Chrome extension that puts today's Facebook back into the 2020 desktop look:

- **Top bar:** the slim 42px blue bar, with the square "f" logo, a wide white
  search box, and "[photo] Name · Home · Create" beside white icons.
- **Page:** a centered 1012px page with a 180px left nav (small icons, one
  line per item), a 500px News Feed and a 308px right column of white boxes.
- **News Feed:** a "Create a post" box with a grey title strip and labelled
  Photo/Video and Feeling buttons, a titled Stories box, and thin-bordered
  posts with bold blue names and small grey timestamps. Each post ends in a
  summary row ("👍 117 ··· 2 Comments 3 Shares") over equal Like · Comment ·
  Share buttons.

## Install (Chrome, Edge, Brave, Arc)

1. Download this repository: **Code → Download ZIP** and unzip it, or
   `git clone https://github.com/Muhammadumar1671/classic-facebook.git`.
2. Open `chrome://extensions` (Edge: `edge://extensions`).
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and pick the `classic-facebook` folder.
5. Reload any open Facebook tabs.

Click the extension's toolbar icon to switch it off, or to turn individual
pieces of the look on and off. Changes apply instantly.

## How it works

Facebook's class names are random and change all the time, so the extension
doesn't use them. Instead it uses:

- Facebook's own design variables (`--accent`, `--web-wash`,
  `--card-corner-radius`, `--header-height`, ...)
- ARIA roles and the right column's `#right_rail_container`, to find the bar
  and the three page columns
- the markers Facebook puts on posts (`data-focus="feed_story"`,
  `data-ad-rendering-role="profile_name"`, `"like_button"`, ...), to find the
  parts of each post

That should survive most Facebook updates.

The files:

- `classic.css`: all the styling, one block per toggle
- `content.js`: writes the enabled toggles onto `<html data-cfb="...">`
- `header.js`: adds the "[photo] Name · Home" links to the bar. Your name
  comes from the home page's left nav and is remembered for other pages.
- `feed.js`: tags each post's parts (card, author, timestamp, the Like /
  Comment / Share bar and its counts) and the right column's sections with
  `data-cfb-part="..."` for `classic.css`
- `popup.html` / `popup.js`: the toggle panel
- `settings.js`: toggle names and defaults, shared by the scripts

## Limits

- The page layout is the home feed's. Profiles, groups and Marketplace keep
  today's layout, with the blue bar, colors and post styling.
- The Like / Comment / Share labels and the "Create" label are English. The
  rest follows Facebook's UI language.
- Colors and the blue bar apply in light mode only. In dark mode the layout,
  square corners and density still apply, in Facebook's dark colors.
- Some components have their rounding hardcoded, so not every corner goes
  square.
- The layout needs a recent Chrome (CSS `:has()`, nesting and anchor
  positioning, all 2024 or newer).

## Privacy

Everything runs in your browser. The extension keeps your toggle settings in
Chrome's synced storage and your name and profile-photo link in local
storage, so the bar can show them on pages without the left column. Nothing is
sent anywhere.

## License

MIT, see [LICENSE](LICENSE).

Not affiliated with or endorsed by Meta. Facebook is a trademark of Meta
Platforms, Inc.
