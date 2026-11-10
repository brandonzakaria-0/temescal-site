/* Temescal site scripts: header menus, the wildfire review flow, and the referral form.
   Settings come from window.SITE, which the build writes from config.json. */
(function () {
  'use strict';
  var SITE = window.SITE || {};

  /* ---------- Header menus: close on outside click or Escape ---------- */
  var menus = document.querySelectorAll('[data-menu]');
  document.addEventListener('click', function (e) {
    menus.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    menus.forEach(function (d) {
      if (d.open) { d.open = false; var s = d.querySelector('summary'); if (s) s.focus(); }
    });
  });

  /* ---------- Lead source tracking (page, referrer, UTM tags) ---------- */
  try {
    var params = new URLSearchParams(window.location.search);
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'].forEach(function (k) {
      if (params.get(k)) utm[k] = params.get(k);
    });
    if (Object.keys(utm).length) sessionStorage.setItem('tm_utm', JSON.stringify(utm));
    if (!sessionStorage.getItem('tm_landing')) {
      sessionStorage.setItem('tm_landing', window.location.pathname);
      sessionStorage.setItem('tm_referrer', document.referrer || '');
    }
  } catch (err) { /* storage can be unavailable; tracking is optional */ }

  function addSourceFields(fd, formType) {
    fd.append('form_type', formType);
    fd.append('submitted_at', new Date().toISOString());
    fd.append('page', window.location.pathname);
    try {
      fd.append('landing_page', sessionStorage.getItem('tm_landing') || '');
      fd.append('referrer', sessionStorage.getItem('tm_referrer') || '');
      var u = JSON.parse(sessionStorage.getItem('tm_utm') || '{}');
      Object.keys(u).forEach(function (k) { fd.append(k, u[k]); });
    } catch (err) { /* ignore */ }
  }

  /* Sends a form to the endpoint in config.json. Returns a promise of true/false. */
  function send(fd) {
    if (!SITE.formEndpoint) return Promise.resolve('not-configured');
    return fetch(SITE.formEndpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? 'ok' : 'error'; })
      .catch(function () { return 'error'; });
  }

  function failureMessage(result) {
    var call = '<a href="tel:' + SITE.phoneTel + '">' + SITE.phone + '</a>';
    var book = '<a href="' + SITE.calendlyUrl + '" target="_blank" rel="noopener">book a time</a>';
    if (result === 'not-configured') {
      return 'Online requests are not switched on yet. Please call ' + call + ' or ' + book + ', and Brandon will take it from there.';
    }
    return 'Something went wrong sending your request. Please try again, call ' + call + ', or ' + book + '.';
  }

  /* ---------- Wildfire review flow ---------- */
  var review = document.querySelector('[data-form="review"]');
  if (review) {
    var steps = review.querySelectorAll('[data-step]');
    var TOTAL = steps.length;
    var step = 0;
    var label = review.querySelector('[data-step-label]');
    var bar = document.querySelector('[data-progress-bar]');
    var progress = document.querySelector('[data-progress]');
    var errorBox = review.querySelector('[data-step-error]');
    var back = review.querySelector('[data-back]');
    var spacer = review.querySelector('[data-back-spacer]');
    var next = review.querySelector('[data-next]');
    var done = document.querySelector('[data-done]');
    var fileInput = review.querySelector('[data-file-input]');
    var fileName = review.querySelector('[data-file-name]');

    var DATES = {
      'Buying a home': ['When is your closing date?', 'Closing date', "We'll plan backward from it."],
      'Got a non-renewal': ['When does your current policy end?', 'Policy end date', "It's on your non-renewal notice."],
      'On the FAIR Plan': ['When does your FAIR Plan policy renew?', 'Renewal date', "It's on your declarations page."],
      'Rebuilding': ['When do you expect to move in?', 'Expected move-in date', "An estimate is fine. Leave it blank if you're not sure."],
      'Reviewing my coverage': ['When does your current policy renew?', 'Renewal date', "It's on your declarations page."]
    };

    function value(name) {
      var el = review.querySelector('[name="' + name + '"]:checked') || review.querySelector('[name="' + name + '"]');
      return el && el.type !== 'radio' ? el.value.trim() : (el && el.checked ? el.value : '');
    }

    function showError(msg, html) {
      if (!msg) { errorBox.hidden = true; errorBox.textContent = ''; return; }
      if (html) errorBox.innerHTML = msg; else errorBox.textContent = msg;
      errorBox.hidden = false;
    }

    function render(focus) {
      steps.forEach(function (s, i) { s.hidden = i !== step; });
      label.textContent = 'Step ' + (step + 1) + ' of ' + TOTAL;
      var pct = Math.round(((step + 1) / TOTAL) * 100) + '%';
      if (bar) bar.style.width = pct;
      if (progress) progress.setAttribute('aria-valuenow', String(step + 1));
      back.hidden = step === 0;
      spacer.hidden = step !== 0;
      var hasFile = fileInput && fileInput.files && fileInput.files.length;
      next.textContent = step === TOTAL - 1 ? 'Request my wildfire review' : (step === 4 && !hasFile ? 'Skip for now' : 'Continue');
      if (step === 2) {
        var d = DATES[value('situation')] || DATES['Reviewing my coverage'];
        review.querySelector('[data-date-question]').textContent = d[0];
        review.querySelector('[data-date-label]').textContent = d[1];
        review.querySelector('[data-date-help]').textContent = d[2];
        review.querySelector('[data-date-type]').value = d[1];
      }
      if (focus) {
        var h = steps[step].querySelector('.flow-title');
        if (h && h.focus) h.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    function validate() {
      var address = review.querySelector('#address');
      if (step === 0) {
        if (!address.value.trim()) {
          address.setAttribute('aria-invalid', 'true');
          showError("Enter the home's address to continue.");
          address.focus();
          return false;
        }
        address.removeAttribute('aria-invalid');
      }
      if (step === 1 && !value('situation')) { showError('Choose the option that fits best to continue.'); return false; }
      if (step === 4 && fileInput.files.length && fileInput.files[0].size > 10 * 1024 * 1024) {
        showError('That file is over 10 MB. Try a smaller PDF or a phone photo.');
        return false;
      }
      if (step === 5) {
        var email = value('email'), phone = value('mobile');
        if (!value('full_name')) { showError('Enter your name so your broker knows who to ask for.'); return false; }
        if (!email && !phone) { showError('Add an email or a mobile number so your broker can reach you.'); return false; }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Check the email address.'); return false; }
      }
      showError('');
      return true;
    }

    function finish() {
      var fd = new FormData(review);
      addSourceFields(fd, 'private_review');
      review.querySelectorAll('[data-consent-text]').forEach(function (box) {
        fd.append(box.name + '_text', box.getAttribute('data-consent-text'));
        fd.append(box.name + '_given', box.checked ? 'yes' : 'no');
      });
      next.disabled = true;
      next.textContent = 'Sending...';
      send(fd).then(function (result) {
        next.disabled = false;
        if (result !== 'ok') {
          next.textContent = 'Request my wildfire review';
          showError(failureMessage(result), true);
          return;
        }
        var first = (value('full_name').split(' ')[0] || '');
        done.querySelector('[data-done-title]').textContent = 'Got it' + (first ? ', ' + first : '') + '. Brandon is reviewing your home now.';
        done.querySelector('[data-done-address]').textContent = value('address') || 'your home';
        var method = { 'Phone call': 'phone', 'Text': 'text', 'Email': 'email' }[value('contact_method')];
        done.querySelector('[data-done-contact]').textContent = method || 'your preferred method';
        review.hidden = true;
        if (progress) progress.hidden = true;
        done.hidden = false;
        var t = done.querySelector('.flow-title');
        if (t) t.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    review.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      if (step < TOTAL - 1) { step += 1; render(true); } else { finish(); }
    });
    back.addEventListener('click', function () {
      if (step > 0) { step -= 1; showError(''); render(true); }
    });
    review.addEventListener('change', function (e) {
      if (e.target.name === 'situation') showError('');
    });
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        var f = fileInput.files[0];
        fileName.hidden = !f;
        fileName.textContent = f ? 'Added: ' + f.name : '';
        render(false);
      });
    }
    render(false);
  }

  /* ---------- Referral form ---------- */
  var referral = document.querySelector('[data-form="referral"]');
  if (referral) {
    var sent = document.querySelector('[data-form-sent]');
    var consentErr = referral.querySelector('[data-consent-error]');
    var status = referral.querySelector('[data-form-status]');
    var check = referral.querySelector('[data-required-check]');
    var submit = referral.querySelector('button[type="submit"]');
    referral.addEventListener('submit', function (e) {
      e.preventDefault();
      status.hidden = true;
      if (!check.checked) { consentErr.hidden = false; check.focus(); return; }
      consentErr.hidden = true;
      var fd = new FormData(referral);
      addSourceFields(fd, 'partner_referral');
      submit.disabled = true;
      send(fd).then(function (result) {
        submit.disabled = false;
        if (result !== 'ok') { status.innerHTML = failureMessage(result); status.hidden = false; return; }
        referral.hidden = true;
        sent.hidden = false;
      });
    });
    check.addEventListener('change', function () { if (check.checked) consentErr.hidden = true; });
    var reset = document.querySelector('[data-form-reset]');
    if (reset) reset.addEventListener('click', function () {
      referral.reset(); referral.hidden = false; sent.hidden = true;
    });
  }
})();
