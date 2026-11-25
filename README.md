# papa-travel.demo.orchestrate.ca

Built live by the Orchestrate Solutions agent team in an Orchestrate demonstration. Static site: HTML, CSS and JavaScript, no build step, no external libraries or fonts.

## What it is
A **fictional** travel agency called Ghana Vorab (site folder and address papa-travel), for German customers planning a trip to Ghana. It sells standard packages, services, guides and walkthroughs. All visible copy is German (`<html lang="de">`). The agency, its packages and prices are invented and labelled as a demo; there is no phone number, email or street address. Facts about Ghana (entry rules for Germans, getting there, seasons, safety) come only from `content/facts.md` (the Ghana expert), each with a "Stand" date. Unconfirmed points are worded "bitte bei Botschaft/Quelle prüfen". Every guide page carries: "Allgemeine Informationen, keine Rechts- oder Einreiseberatung. Regeln bitte vor der Reise bei den offiziellen Stellen prüfen."

## Shop
- Packages, services and prices live in `shop/catalog.json` (currency EUR, `"brand": {"kind": "services"}`, no stores). The shop service at `api/shop/` prices every quote and order. Prices are never computed in the browser.
- **Payments are test payments only. No real money moves** (Stripe test mode, or the sandbox with card 4242 4242 4242 4242). The label "Demo-Shop: nur Testzahlungen, es bewegt sich kein echtes Geld." (`Shop.TEST_LABEL`) shows at checkout and in the footer. No key or secret is in the site.
- Shared code: `js/shop/core.js` (`window.Shop`: API client, catalog, cart, money in de-DE, toasts, `owns`, `get`/`set` under `shop:papa-travel:`) and `css/shop/core.css`. Cart lines are exactly what the service takes. After a cart change, `window.dispatchEvent(new Event('shop:cart'))`. A guide is a single download: `addToCart` keeps it at quantity 1.
- Paid orders are ready at once. The service returns the customer to `pages/order.html?o=<token>`; a cancelled payment comes back to `pages/checkout.html?cancelled=<token>`.

## Guides are a demo gate
Each guide item in the catalog has a `guide` field with the page path. A guide page puts `data-guide="<item id>"` on `<body>`; elements marked `data-teaser` show until it is bought, elements marked `data-locked` once it is (decided in the browser from the order tokens via `Shop.owns`). My purchases lists bought guides with their link. This is a demo gate, **not real protection**: anyone with a guide's link or the browser's storage can open it. The nav never links straight to a guide: "Ratgeber" goes to `pages/services.html#guides`.

## Pages
`index.html`, `pages/services.html` (packages, services, guides; cards have the catalog item id as anchor, sections `#packages`, `#services`, `#guides`), `pages/checkout.html`, `pages/order.html`, `pages/account.html` (Meine Käufe), `pages/gift-cards.html` (Reiseguthaben: pay now, travel later; the service returns here with `?p=<token>`), `pages/guides/einreise-visum.html`, `pages/guides/anreise-ankunft.html`, `pages/guides/reisezeit-gesundheit.html` (with the packing checklist, `js/tools.js`).

## Look
`css/tokens.css` (Designer), `css/layout.css`, `js/nav.js`, `js/motion.js` (UI/UX), `css/site.css` (base, `.band`, `.band--dark`, `.prose`, `.sample-label`, `.guide-note`).

## Prepaid (pay now, travel later)
Ghana Vorab sells **Reiseguthaben**: a prepaid credit bought now (the shop service's gift cards: `giftCards` in `shop/catalog.json`, `POST giftcards`, a code with a balance). The code is entered at checkout (`giftCard` in quote and order) and covers any package or service later; any remainder stays on the code. Prepaid amounts and any bonus are fictional and labelled demo. Look: fresh and vivid, not the look of papa-reisen (which stays unchanged).
