/* Alpha International — shared behaviour for every page. Each block is guarded
   by the presence of its own markup, so one file serves all pages. */
(function () {
  'use strict';

  /* ---------- Footer year ---------- */
  var yr = document.getElementById('yr');
  if (yr) { yr.textContent = new Date().getFullYear(); }

  /* ---------- Mobile menu ----------
     Links stay in the DOM and the panel is display:none when closed, so its
     links leave the tab order along with it. */
  var tog = document.getElementById('menu-toggle');
  var nav = document.getElementById('primary-nav');
  if (tog && nav) {
    var setOpen = function (open) {
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('open', open);
    };
    var isOpen = function () { return tog.getAttribute('aria-expanded') === 'true'; };

    tog.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!isOpen()); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) { setOpen(false); } });
    document.addEventListener('click', function (e) {
      if (isOpen() && !e.target.closest('.top')) { setOpen(false); }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) { setOpen(false); tog.focus(); }
    });
    // Don't let an open panel leak into the desktop layout on resize/rotate.
    var mq = window.matchMedia('(min-width:1081px)');
    var onChange = function (e) { if (e.matches) { setOpen(false); } };
    if (mq.addEventListener) { mq.addEventListener('change', onChange); }
    else if (mq.addListener) { mq.addListener(onChange); }
  }

  /* ---------- Contact form ----------
     CONTACT_EMAIL is where enquiries should end up. A static page cannot send
     mail by itself, so it is used here only for the fallback link below.

     CONTACT_ENDPOINT is a route on our own origin, handled by src/index.js,
     which forwards to the HighLevel webhook held in the HL_WEBHOOK_URL secret.
     Deliberately not the webhook itself: that URL must not appear in anything
     the browser downloads. Empty it and the form falls back to the mailbox
     notice below rather than dropping what someone typed. */
  var CONTACT_EMAIL = 'administrator@alphainternational.energy';
  var CONTACT_ENDPOINT = '/api/contact';

  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var submit = form.querySelector('button[type="submit"]');

    var say = function (kind, msg) {
      if (!status) { return; }
      status.className = 'fstatus on ' + kind;
      status.textContent = msg;
    };

    if (!CONTACT_ENDPOINT) {
      // Built as nodes, not innerHTML, so the address is never parsed as markup.
      if (status) {
        status.className = 'fstatus on bad';
        status.textContent = 'This form is not connected yet. Please email ';
        var a = document.createElement('a');
        a.href = 'mailto:' + CONTACT_EMAIL;
        a.textContent = CONTACT_EMAIL;
        status.appendChild(a);
        status.appendChild(document.createTextNode(' instead.'));
      }
      if (submit) { submit.disabled = true; }
    } else {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      // Bots fill hidden fields; people do not.
      if (form.elements.company_website && form.elements.company_website.value) { return; }

      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'company_website') { data[k] = v; } });
      // `source` and `submitted_at` are stamped by the Worker, not here, so
      // they cannot be spoofed by anything posting to /api/contact directly.

      if (submit) { submit.disabled = true; }
      say('ok', 'Sending…');

      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        form.reset();
        say('ok', 'Thank you. Your message has been received and someone will be in touch.');
      }).catch(function () {
        // Give people the mailbox rather than a dead end.
        say('bad', 'Sorry, that did not send. Please try again, or email ' + CONTACT_EMAIL + '.');
      }).then(function () {
        if (submit) { submit.disabled = false; }
      });
    });
    }
  }
})();
