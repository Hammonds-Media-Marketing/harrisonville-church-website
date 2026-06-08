/*
 * Static (vanilla JS) attribution + form wiring — the GitHub Pages counterpart
 * to AttributionTracker.tsx.template + the populate/submit logic in
 * ContactForm.tsx.template. No framework, no build step. Include once per page:
 *   <script src="assets/js/attribution.js" defer></script>
 *
 * It does three things:
 *   1. Captures last-touch UTM / gclid / msclkid / external-referrer to
 *      localStorage on every load (during idle time, never blocking paint).
 *   2. Populates the hidden tracking inputs of every [data-attribution-form]
 *      from the current URL (fresh) with the stored payload as fallback.
 *   3. Upgrades submit to an AJAX fetch with `Accept: application/json` so the
 *      inline success/error regions swap in without a page navigation. With JS
 *      off, the form's own `action`/`method` still POSTs normally.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'hm_attribution';
  var TRACKED_PARAMS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gclid',
    'msclkid'
  ];

  function whenIdle(fn, timeout) {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(fn, { timeout: timeout || 2000 });
    } else {
      window.setTimeout(fn, 0);
    }
  }

  function externalReferrer() {
    try {
      return document.referrer && document.referrer.indexOf(window.location.origin) !== 0
        ? document.referrer
        : '';
    } catch (e) {
      return '';
    }
  }

  function readStored() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  // 1. Last-touch capture. Fresh URL params overwrite the stored payload; a bare
  //    external referrer is captured only when nothing is stored yet.
  function captureAttribution() {
    try {
      var params = new URLSearchParams(window.location.search);
      var fromUrl = {};
      for (var i = 0; i < TRACKED_PARAMS.length; i++) {
        var v = params.get(TRACKED_PARAMS[i]);
        if (v) fromUrl[TRACKED_PARAMS[i]] = v;
      }

      var hasFresh = Object.keys(fromUrl).length > 0;
      var existing = window.localStorage.getItem(STORAGE_KEY);
      var ref = externalReferrer();

      if (hasFresh) {
        fromUrl.original_referrer = ref;
        fromUrl.landing_url = window.location.href;
        fromUrl.captured_at = new Date().toISOString();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
      } else if (!existing && ref) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          original_referrer: ref,
          landing_url: window.location.href,
          captured_at: new Date().toISOString()
        }));
      }
    } catch (e) {
      /* localStorage unavailable (private mode, quota, disabled) — silent no-op. */
    }
  }

  // 2. Populate one form's hidden inputs: URL first, stored payload as fallback.
  function populateForm(form) {
    var params = new URLSearchParams(window.location.search);
    var stored = readStored();
    var values = {
      original_referrer: externalReferrer() || stored.original_referrer || ''
    };
    for (var i = 0; i < TRACKED_PARAMS.length; i++) {
      var field = TRACKED_PARAMS[i];
      values[field] = params.get(field) || stored[field] || '';
    }
    Object.keys(values).forEach(function (name) {
      var input = form.querySelector('input[name="' + name + '"]');
      if (input) input.value = values[name];
    });
  }

  // 3. AJAX submit with graceful success/error swap.
  function wireSubmit(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var button = form.querySelector('button[type="submit"], input[type="submit"]');
      var errorEl = form.querySelector('[data-form-error]');
      var successEl = form.parentNode && form.parentNode.querySelector('[data-form-success]');

      if (errorEl) errorEl.hidden = true;
      if (button) {
        button.disabled = true;
        button.dataset.label = button.textContent;
        button.textContent = 'Sending…';
      }

      fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            form.hidden = true;
            if (successEl) {
              successEl.hidden = false;
              successEl.focus && successEl.focus();
            }
          } else {
            throw new Error('Bad response');
          }
        })
        .catch(function () {
          if (errorEl) errorEl.hidden = false;
        })
        .finally(function () {
          if (button) {
            button.disabled = false;
            if (button.dataset.label) button.textContent = button.dataset.label;
          }
        });
    });
  }

  function init() {
    whenIdle(captureAttribution, 2000);
    var forms = document.querySelectorAll('[data-attribution-form]');
    for (var i = 0; i < forms.length; i++) {
      (function (form) {
        whenIdle(function () { populateForm(form); }, 1000);
        wireSubmit(form);
      })(forms[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
