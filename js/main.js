// js/main.js (defensive, robust version)
// Features:
// - Mobile menu toggle (with aria updates)
// - Smooth scroll for internal anchors
// - Scroll reveal (IntersectionObserver fallback)
// - Simple contact form handling (client simulation)
// - Counters animation (safe guards)
// - Button ripple (safe guards)
// - Sponsor modal (created once, guarded)
// - Graceful failure if selectors are missing

(function () {
  'use strict';

  // Helper selectors (run after DOM loaded)
  function $(sel, ctx = document) { return ctx.querySelector(sel); }
  function $all(sel, ctx = document) { return Array.from((ctx || document).querySelectorAll(sel)); }

  document.addEventListener('DOMContentLoaded', () => {

    /* ------------------
       MOBILE NAV MENU
       - Works only if .navbar exists and nav ul exists
    ------------------ */
    const navbar = $('.navbar');
    const navList = navbar ? $('.navbar nav ul') : null;
    const menuToggle = $('.menu-toggle');
    const donateBtn = $('.donate-btn');

    if (menuToggle && navList && navbar) {
      // ensure initial attributes
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', String(!expanded));
        navList.classList.toggle('open');
      });

      // close on outside click
      document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
          navList.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      });

      // close when a nav link clicked (mobile)
      navList.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (a) {
          navList.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    /* ------------------
       SMOOTH SCROLL FOR INTERNAL LINKS
    ------------------ */
    $all('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // update history without jumping
        history.replaceState(null, '', href);
      });
    });

    /* ------------------
       SCROLL REVEAL (IntersectionObserver with fallback)
    ------------------ */
    const revealSelectors = '.fade-in, .card, .stat-box, .step';
    const revealEls = $all(revealSelectors);

    if ('IntersectionObserver' in window && revealEls.length) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(el => io.observe(el));
    } else {
      // fallback: reveal immediately
      revealEls.forEach(el => el.classList.add('show'));
    }

    /* ------------------
       HERO ANIMATION (on load)
    ------------------ */
    const heroText = $('.hero .hero-text');
    const heroImg = $('.hero img');
    if (heroText) heroText.classList.add('animate');
    if (heroImg) heroImg.classList.add('animate');

    /* ------------------
       COUNTERS (safe)
    ------------------ */
    const statsSection = $('.stats') || $('.section.stats') || null;
    const counters = $all('.stat-box h3');
    let countersStarted = false;

    function isInViewport(el, offset = 200) {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top <= (window.innerHeight - offset);
    }

    function startCounters() {
      if (countersStarted) return;
      if (!statsSection || !isInViewport(statsSection, 200)) return;
      countersStarted = true;
      counters.forEach(counter => {
        const raw = counter.textContent.trim();
        // parse number from text (e.g. "10,000+")
        const match = raw.replace(/[,+]/g, '').match(/\d+/);
        const target = match ? parseInt(match, 10) : 0;
        if (!target) return;
        counter.textContent = '0';
        const steps = 80;
        const increment = Math.max(1, Math.round(target / steps));
        let value = 0;
        const tick = () => {
          value += increment;
          if (value < target) {
            counter.textContent = value.toLocaleString();
            setTimeout(tick, 30);
          } else {
            counter.textContent = target.toLocaleString() + '+';
          }
        };
        tick();
      });
    }
    window.addEventListener('scroll', startCounters);
    // also try once after load
    startCounters();

    /* ------------------
       CONTACT FORM HANDLING (client-side simulation)
    ------------------ */
    const contactForm = $('.contact-form');
    if (contactForm) {
      const msgArea = contactForm.querySelector('.form-message') || (() => {
        const d = document.createElement('div'); d.className = 'form-message'; contactForm.appendChild(d); return d;
      })();

      contactForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        msgArea.textContent = '';
        if (!contactForm.checkValidity()) {
          contactForm.reportValidity();
          msgArea.textContent = 'Please fill all required fields.';
          msgArea.style.color = '#c0392b';
          return;
        }

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

        // simulate async submission
        setTimeout(() => {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message'; }
          contactForm.reset();
          msgArea.textContent = 'Thank you — we received your message.';
          msgArea.style.color = '#2E7D32';
        }, 900);
      });
    }

    /* ------------------
       BUTTON RIPPLE (safe)
    ------------------ */
    function createRipple(evt, container) {
      const rect = container.getBoundingClientRect();
      const circle = document.createElement('span');
      circle.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      circle.style.width = circle.style.height = size + 'px';
      circle.style.left = (evt.clientX - rect.left - size / 2) + 'px';
      circle.style.top = (evt.clientY - rect.top - size / 2) + 'px';
      container.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    }

    $all('button, a.btn, a.hero-btn, a.cta-btn').forEach(el => {
      el.style.position = el.style.position || 'relative';
      el.addEventListener('click', (e) => {
        createRipple(e, el);
      });
    });

    /* ------------------
       SPONSOR MODAL (create once, only if triggers present)
    ------------------ */
    const modalId = 'ameal-sponsor-modal';
    if (!document.getElementById(modalId)) {
      const modalHtml = `
        <div id="${modalId}" class="meal-modal hidden" role="dialog" aria-modal="true" aria-hidden="true">
          <div class="modal-content" role="document">
            <button class="modal-close" aria-label="Close">&times;</button>
            <h2>Sponsor a Meal</h2>
            <p>How many meals would you like to sponsor?</p>
            <input id="mealCount" type="number" min="1" placeholder="e.g. 5">
            <div style="display:flex;gap:.5rem;justify-content:center;margin-top:12px;">
              <button id="confirmMeal" class="hero-btn">Donate Now</button>
              <button id="modalCancel" class="btn">Cancel</button>
            </div>
          </div>
        </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      const modal = document.getElementById(modalId);
      const closeBtn = modal.querySelector('.modal-close');
      const cancelBtn = modal.querySelector('#modalCancel');

      function openModal() {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
      }
      function closeModal() {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
      }

      // bind openers (only attach if buttons exist)
      $all('.hero-btn, .cta-btn, .donate-btn').forEach(b => {
        b.addEventListener('click', (ev) => {
          ev.preventDefault();
          openModal();
        });
      });

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      // confirm action
      const confirmBtn = modal.querySelector('#confirmMeal');
      const mealCountInput = modal.querySelector('#mealCount');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          const val = parseInt(mealCountInput.value, 10);
          if (!val || val < 1) {
            alert('Enter a valid number of meals.');
            return;
          }
          // simulate success
          alert(`Thank you! You sponsored ${val} meal(s).`);
          closeModal();
          mealCountInput.value = '';
        });
      }
    }

    /* ------------------
       Lazy images: center them and use lazy loading where possible
    ------------------ */
    $all('img').forEach(img => {
      try { img.loading = 'lazy'; } catch (e) {}
      img.style.display = img.style.display || 'block';
      img.style.marginLeft = img.style.marginRight = 'auto';
      img.style.maxWidth = img.style.maxWidth || '100%';
    });

    /* ------------------
       Accessibility: close menus/modals on ESC
    ------------------ */
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        // close nav
        if (navList) navList.classList.remove('open');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
        // close modal(s)
        const openModalEl = document.querySelector('.meal-modal:not(.hidden), #ameal-sponsor-modal:not(.hidden)');
        if (openModalEl) openModalEl.classList.add('hidden');
      }
    });

  }); // DOMContentLoaded

})();
