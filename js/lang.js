/* Language choice (Lead Developer). Load first in every page's <head>, NOT deferred:
   <script src="…/js/lang.js"></script>
   German lives at the site root, English in /en/, French in /fr/ (same file names). This script
   - remembers the visitor's language (localStorage key shop:<site>:lang),
   - sends them to the same page in that language when the page they opened is in another one
     (this is how the payment service's return pages, which are German, land in the right language),
   - offers window.SiteLang for the language switcher in js/nav.js. */
(function () {
  'use strict';
  var script = document.currentScript;
  var base = new URL('../', script ? script.src : location.href).href;
  var site = (base.match(/\/s\/([^\/]+)\/$/) || [])[1] || location.hostname.split('.')[0] || 'site';
  var KEY = 'shop:' + site + ':lang';
  var cur = (document.documentElement.lang || 'de').slice(0, 2).toLowerCase();
  var LANGS = ['de', 'en', 'fr'];
  if (LANGS.indexOf(cur) < 0) cur = 'de';
  var rootPath = new URL(base).pathname;
  var rel = location.pathname.indexOf(rootPath) === 0 ? location.pathname.slice(rootPath.length) : location.pathname.replace(/^\//, '');
  rel = rel.replace(/^(en|fr)\//, '');
  function urlFor(l) { return base + (l === 'de' ? '' : l + '/') + rel + location.search + location.hash; }
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(l) { try { localStorage.setItem(KEY, l); } catch (e) {} }
  var st = get();
  if (st && st !== cur && LANGS.indexOf(st) >= 0) { location.replace(urlFor(st)); return; }
  if (!st && cur !== 'de') set(cur);
  window.SiteLang = {
    current: cur, langs: LANGS, names: { de: 'Deutsch', en: 'English', fr: 'Français' },
    urlFor: urlFor, set: set
  };
})();
