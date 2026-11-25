/* Packliste: Haken gespeichert über Shop.get/set('packliste'), Fortschritt, Zurücksetzen. Inhalt aus content/facts.md. */
(function () {
  function T(de, en, fr) { return window.Shop && Shop.t ? Shop.t({ de: de, en: en, fr: fr }) : de; }
  function groups() { return [
    { t: T('Papiere und Geld', 'Documents and money', 'Papiers et argent'), i: [
      ['pass', T('Reisepass: mindestens sechs Monate gültig ab Einreise (kein Personalausweis)', 'Passport valid for at least six months from entry (an ID card is not accepted)', 'Passeport valable au moins six mois à compter de l’entrée (la carte d’identité n’est pas acceptée)')],
      ['visum', T('Visum, vorab über das offizielle Portal oder die Botschaft von Ghana in Berlin beantragt', 'Visa, applied for in advance through the official portal or the Ghana embassy in Berlin', 'Visa, demandé à l’avance via le portail officiel ou l’ambassade du Ghana à Berlin')],
      ['impfpass', T('Impfnachweis zur Gelbfieber-Impfung', 'Proof of yellow fever vaccination', 'Preuve de vaccination contre la fièvre jaune')],
      ['qr', T('QR-Code der Gesundheitserklärung (online vor Reisebeginn ausgefüllt)', 'QR code of the health declaration (filled in online before you travel)', 'Code QR de la déclaration de santé (remplie en ligne avant le départ)')],
      ['kopie', T('Kopie des Passes', 'Copy of your passport', 'Copie du passeport')],
      ['bargeld', T('Etwas Bargeld in Cedi und eine Visa-Karte', 'Some cash in cedi and a Visa card', 'Un peu d’argent liquide en cedis et une carte Visa')],
      ['police', T('Unterlagen der Auslandskranken- und Rücktransportversicherung', 'Documents for your health and repatriation insurance abroad', 'Documents de votre assurance maladie et de rapatriement à l’étranger')]
    ] },
    { t: T('Gesundheit', 'Health', 'Santé'), i: [
      ['medis', T('Eigene Medikamente: rechtlichen Status in Ghana vorher prüfen', 'Your own medicines: check their legal status in Ghana beforehand', 'Vos médicaments : vérifiez à l’avance leur statut légal au Ghana')],
      ['malaria', T('Malaria-Vorsorge mit Reise- oder Tropenmedizin besprochen', 'Malaria prevention discussed with a travel or tropical medicine clinic', 'Prévention du paludisme discutée avec un centre de médecine des voyages ou tropicale')],
      ['impf', T('Weitere Impfungen mit der Ärztin oder dem Arzt besprochen', 'Other vaccinations discussed with your doctor', 'Autres vaccins discutés avec votre médecin')]
    ] },
    { t: T('Technik und Kleidung', 'Electronics and clothing', 'Électronique et vêtements'), i: [
      ['adapter', T('Steckdosenadapter für Typ G und D (230 V, 50 Hz)', 'Plug adapter for types G and D (230 V, 50 Hz)', 'Adaptateur de prise pour les types G et D (230 V, 50 Hz)')],
      ['power', T('Powerbank, falls der Strom ausfällt', 'Power bank in case of a power cut', 'Batterie externe en cas de coupure de courant')],
      ['kleidung', T('Eher zurückhaltende Kleidung; keine Tarn- oder Militärkleidung', 'Fairly modest clothing; no camouflage or military clothing', 'Vêtements plutôt discrets ; pas de tenue de camouflage ni militaire')],
      ['notruf', T('Notrufnummern gespeichert: 112, Polizei 191, Rettung 193', 'Emergency numbers saved: 112, police 191, ambulance 193', 'Numéros d’urgence enregistrés : 112, police 191, secours 193')]
    ] }
  ]; }
  var KEY = 'packliste';
  function load() { try { return (window.Shop && Shop.get(KEY, {})) || {}; } catch (e) { return {}; } }
  function persist(o) { try { if (window.Shop) Shop.set(KEY, o); } catch (e) {} }
  function init() {
    var host = document.getElementById('packliste');
    if (!host) return;
    var saved = load(), total = 0, html = '';
    groups().forEach(function (g) {
      html += '<div class="pk-group"><h3>' + g.t + '</h3><ul class="pk-list">';
      g.i.forEach(function (it) {
        total++;
        html += '<li><label><input type="checkbox" data-pk="' + it[0] + '"' + (saved[it[0]] ? ' checked' : '') + '><span>' + it[1] + '</span></label></li>';
      });
      html += '</ul></div>';
    });
    host.innerHTML = '<p class="gd-progress" id="pk-text" role="status" aria-live="polite"></p><div class="pk-bar" aria-hidden="true"><span id="pk-fill"></span></div>' + html +
      '<p class="gd-actions"><button type="button" class="gd-reset" id="pk-reset">' + T('Zurücksetzen', 'Reset', 'Réinitialiser') + '</button></p>';
    var boxes = [].slice.call(host.querySelectorAll('input[data-pk]'));
    function upd() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      document.getElementById('pk-text').textContent = n + T(' von ', ' of ', ' sur ') + total + T(' eingepackt', ' packed', ' dans la valise');
      document.getElementById('pk-fill').style.width = (100 * n / total) + '%';
    }
    function save() { var o = {}; boxes.forEach(function (b) { if (b.checked) o[b.getAttribute('data-pk')] = 1; }); persist(o); upd(); }
    boxes.forEach(function (b) { b.addEventListener('change', save); });
    document.getElementById('pk-reset').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); save(); });
    upd();
  }
  function buy() {
    [].forEach.call(document.querySelectorAll('[data-buy]'), function (b) {
      b.addEventListener('click', function () {
        if (!window.Shop) { location.href = '../services.html#guides'; return; }
        Shop.addToCart({ item: b.getAttribute('data-buy') });
        Shop.toast(T('Im Warenkorb. Demo-Shop: nur Testzahlungen.', 'Added to your cart. Demo shop: test payments only.', 'Ajouté au panier. Boutique de démonstration : paiements de test uniquement.'));
      });
    });
  }
  function start() { init(); buy(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
