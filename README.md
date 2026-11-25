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

## Languages: German (default), English, French
Structure: **full static copies per language**. German stays at the root (`index.html`, `pages/...`), English is `en/index.html`, `en/pages/...`, French `fr/index.html`, `fr/pages/...`: same file names, same anchors and ids, `<html lang="de|en|fr">`. Each page owner makes the `en/` and `fr/` copies of their own pages (the files stay in their lane). Shared CSS and JS live once at the root; a copy in `en/pages/x.html` links `../../../css/...` and `../../../js/...`.
- **`js/lang.js`** (mine): first in `<head>`, not deferred. Remembers the choice (`shop:papa-travel:lang`) and sends the visitor to the same page in their language. The payment service returns to the German `pages/order.html` and `pages/gift-cards.html`; lang.js moves the visitor to their language, query string kept. `window.SiteLang` = `{current, langs, names, urlFor(lang), set(lang)}` for the switcher.
- **Switcher** (`js/nav.js`, UI/UX): in the header, keyboard usable (a group of three links `DE EN FR` with `lang` and `hreflang` attributes, current one `aria-current="true"`), calls `SiteLang.set(l)` on click, links to `SiteLang.urlFor(l)`. nav.js and the footer texts per language.
- **hreflang**: in every page's head, absolute URLs on the live address, for de, en, fr and `x-default` (= German): `<link rel="alternate" hreflang="en" href="https://papa-travel.demo.orchestrate.ca/en/pages/services.html">`.
- **JS strings**: `Shop.LANG` (`de|en|fr`), `Shop.t({de:'…', en:'…', fr:'…'})` for any text a script writes (German is the fallback). `Shop.url('pages/x.html')` returns the page in the visitor's language; files (css, js, json) always come from the root. `Shop.TEST_LABEL` is per language. `Shop.money` formats by `<html lang>`.
- **Catalog** (`shop/catalog.json`): the German fields stay; every text gets `"i18n": {"en": {...}, "fr": {...}}` with the same field names (`name`, `desc`, `includes`, `badge`, `blurb`, `line`) on items, option groups, option choices, categories, coupons and gift-card designs. Prices, ids and rules are shared and identical. The shop service answers in German (line names, option summaries, coupon names): pages show the catalog text instead (`Shop.tx(obj,'name')`, `Shop.itemName(id, fallback)`, `Shop.choiceName(group, choice, fallback)`, `Shop.couponName(code, fallback)`, `Shop.lineSummary(line, fallback)`). The service's own test payment page is outside the site and stays as it is.
- **Facts**: guides are translated from `content/facts.md` only: same figures, same "Stand" dates, same sources, nothing added. "bitte bei Botschaft/Quelle prüfen" becomes "please check with the embassy/source" / « à vérifier auprès de l’ambassade ou de la source ». The footer sentence: EN "General information, not legal or immigration advice. Please check the rules with the official authorities before you travel." FR « Informations générales, pas de conseil juridique ni en matière d’immigration. Vérifiez les règles auprès des autorités officielles avant le voyage. » Test-money label in all pages: `Shop.TEST_LABEL` text. No safety promises in any language.
- **Tone**: German "du", English plain "you", French "vous". Natural, not word for word.
- **Names** (identical everywhere): Ghana Vorab, Accra International Airport, Kokrobite, Cedi, ELEFAND, PAPA15.

| de | en | fr |
|---|---|---|
| Pakete | Packages | Forfaits |
| Services | Services | Services |
| Ratgeber | Guides | Guides |
| Reiseguthaben | Travel credit | Crédit voyage |
| Meine Käufe | My purchases | Mes achats |
| Warenkorb | Cart | Panier |
| Zur Kasse | Check out | Passer à la caisse |
| Bestellung | Order | Commande |
| Gutschein / Code | Coupon / code | Code promo / code |
| Demo-Agentur (fiktiv) | demo agency (fictional) | agence de démonstration (fictive) |
| Stand | As of | État au |
| Einreise und Visum | Entry and visa | Entrée et visa |
| Anreise und Ankunft | Getting there and arriving | Voyage et arrivée |
| Reisezeit, Gesundheit und Packen | When to go, health and packing | Quand partir, santé et bagages |

Parity rule: the three copies of a page have the same sections, ids, anchors, links and numbers; QA compares them.
