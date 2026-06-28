// ── Shared utilities for 上元春鬧官網 ─────────────────────────────────────

function smoothToSection(id) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
  }, 100);
}

// ── Dropdown ───────────────────────────────────────────────────────────────
const dd = document.getElementById('dd-menu');
function toggleDD() { if (dd) dd.classList.toggle('open'); closeDD2(); }
function closeDD() { if (dd) dd.classList.remove('open'); }

const dd2 = document.getElementById('dd2-menu');
function toggleDD2() { if (dd2) dd2.classList.toggle('open'); closeDD(); }
function closeDD2() { if (dd2) dd2.classList.remove('open'); }

document.addEventListener('click', e => {
  const w = document.getElementById('dd-wrapper');
  if (w && !w.contains(e.target)) closeDD();
  const w2 = document.getElementById('dd2-wrapper');
  if (w2 && !w2.contains(e.target)) closeDD2();
});

// ── Mobile Menu ────────────────────────────────────────────────────────────
const mobileNav = document.getElementById('mobile-nav');
function toggleMobileMenu() { mobileNav.classList.toggle('open'); }
function closeMobileMenu() { mobileNav.classList.remove('open'); }


// ── initSchedLine (shared by multiple pages) ───────────────────────────────
function initSchedLine(listId) {
  const wrap = document.getElementById(listId);
  if (!wrap) return;
  const bg = document.createElement('div');
  bg.className = 'jc-sched-line-bg';
  const fg = document.createElement('div');
  fg.className = 'jc-sched-line-fg';
  wrap.appendChild(bg);
  wrap.appendChild(fg);
  requestAnimationFrame(() => updateSchedLine(listId));
  window.addEventListener('scroll', () => updateSchedLine(listId), {passive: true});
}

function updateSchedLine(listId) {
  const wrap = document.getElementById(listId);
  if (!wrap) return;
  const dots = wrap.querySelectorAll('.jc-sched-dot');
  if (dots.length < 2) return;
  const bg = wrap.querySelector('.jc-sched-line-bg');
  const fg = wrap.querySelector('.jc-sched-line-fg');
  if (!bg || !fg) return;
  const first = dots[0].getBoundingClientRect();
  const last = dots[dots.length - 1].getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  const x = first.left + first.width / 2 - wrapRect.left;
  const top = first.top + first.height / 2 - wrapRect.top;
  const totalH = (last.top + last.height / 2) - (first.top + first.height / 2);
  if (totalH <= 0) return;
  bg.style.left = fg.style.left = x + 'px';
  bg.style.top = fg.style.top = top + 'px';
  bg.style.height = totalH + 'px';
  const progress = Math.min(1, Math.max(0,
    (window.innerHeight * 0.65 - first.top - first.height / 2) / totalH
  ));
  fg.style.height = totalH * progress + 'px';
}


// ── Init ───────────────────────────────────────────────────────────────────
document.getElementById('footer-year').textContent = new Date().getFullYear();

// Setup marked options
if (typeof marked !== 'undefined') {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
}

// Init mermaid
if (typeof mermaid !== 'undefined') {
  mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
}

function renderMermaidIn(container) {
  if (typeof mermaid === 'undefined') return;
  container.querySelectorAll('.language-mermaid, .mermaid-block').forEach(el => {
    const src = el.textContent;
    const id = 'mermaid-' + Math.random().toString(36).slice(2);
    mermaid.render(id, src).then(({ svg }) => { el.innerHTML = svg; }).catch(() => {});
  });
}


// ── Page TOC ───────────────────────────────────────────────────────────────
function initTOC() {
  if (document.getElementById('page-home')) return;

  const eyebrows = document.querySelectorAll('.section-eyebrow');
  if (!eyebrows.length) return;

  const sections = [];
  eyebrows.forEach((eb, i) => {
    const parent = eb.closest('section') || eb.closest('[id^="s-"]');
    if (!parent) return;

    // Require a section-title sibling — skips decorative eyebrows (e.g. INSTALLATION / COSTUME)
    const titleEl = eb.closest('.sec-hd')?.querySelector('.section-title')
      || eb.parentElement?.querySelector('.section-title');
    if (!titleEl) return;

    // Skip if this section is already registered (prevents duplicates)
    if (sections.some(s => s.el === parent)) return;

    if (!parent.id) parent.id = 'toc-s-' + i;
    parent.classList.add('scroll-mt-20');

    const label = titleEl.textContent.trim();
    sections.push({ el: parent, label });
  });
  if (!sections.length) return;

  const nav = document.createElement('nav');
  nav.id = 'page-toc';
  nav.setAttribute('aria-label', '頁面目錄');

  const items = sections.map(({ el, label }) => {
    const btn = document.createElement('button');
    btn.className = 'toc-item';
    btn.setAttribute('aria-label', label);
    btn.innerHTML = `<span class="toc-label">${label}</span><span class="toc-tick"></span>`;
    btn.addEventListener('click', () =>
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
    nav.appendChild(btn);
    return btn;
  });
  document.body.appendChild(nav);

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const idx = sections.findIndex(s => s.el === entry.target);
      if (idx !== -1) items[idx].classList.toggle('active', entry.isIntersecting);
    });
  }, { rootMargin: '-10% 0px -60% 0px' });
  sections.forEach(s => obs.observe(s.el));
}

// ── Horizontal Schedule Timeline ───────────────────────────────────────────
function initHSched(outerId, trackId) {
  const outer = document.getElementById(outerId);
  const track = document.getElementById(trackId);
  if (!outer || !track) return;

  const lineBg = document.createElement('div');
  lineBg.className = 'jc-hsched-line';
  const lineFg = document.createElement('div');
  lineFg.className = 'jc-hsched-line-fg';
  track.insertBefore(lineFg, track.firstChild);
  track.insertBefore(lineBg, track.firstChild);

  const STICKY_H = 260;

  function getStickyTop() {
    return window.innerHeight * 0.5 - STICKY_H / 2;
  }

  function setHeight() {
    const extraW = Math.max(0, track.scrollWidth - outer.offsetWidth);
    outer.style.height = (extraW + STICKY_H) + 'px';
  }

  function update() {
    const rect = outer.getBoundingClientRect();
    const stickyTop = getStickyTop();
    const scrolledIn = stickyTop - rect.top;
    const totalScrollable = outer.offsetHeight - STICKY_H;
    if (scrolledIn <= 0 || totalScrollable <= 0) {
      track.style.transform = 'translateX(0)';
      lineFg.style.width = '0';
      return;
    }
    const progress = Math.min(1, scrolledIn / totalScrollable);
    const maxShift = Math.max(0, track.scrollWidth - outer.offsetWidth);
    track.style.transform = `translateX(${-progress * maxShift}px)`;
    lineFg.style.width = (progress * track.scrollWidth) + 'px';
  }

  requestAnimationFrame(() => { setHeight(); update(); });
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => { setHeight(); update(); }, { passive: true });
}

// ── Scroll Reveal ──────────────────────────────────────────────────────────
function initScrollReveal() {
  // Section-level reveal — skip scrollytelling, para-reveal, and horizontal timeline containers
  document.querySelectorAll('.space-y-20, .space-y-24').forEach(container => {
    Array.from(container.children).forEach(el => {
      if (!el.querySelector('[id*="scrolly"]') &&
          !el.querySelector('.reveal-children') &&
          !el.classList.contains('jc-hsched-outer') &&
          !el.classList.contains('jc-hsched-section')) {
        el.classList.add('reveal');
      }
    });
  });

  // Para-level staggered reveal for .reveal-children containers
  document.querySelectorAll('.reveal-children').forEach(container => {
    const children = Array.from(container.children);
    children.forEach(el => el.classList.add('reveal'));
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          children.forEach((el, i) => {
            setTimeout(() => el.classList.add('visible'), i * 130);
          });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    obs.observe(container);
  });

  // Global observer for section-level .reveal elements
  const els = document.querySelectorAll('.space-y-20 > .reveal, .space-y-24 > .reveal');
  if (!els.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  els.forEach(el => obs.observe(el));
}

// ── Hero Nav (hide over full-screen hero, show on interaction) ─────────────
function initHeroNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const hero = document.querySelector('.cs-wrap, .xz-cs-wrap, .hero');
  if (!hero) return;

  nav.classList.add('nav-hero-hide');
  let inHero = true;
  let peekTimer = null;

  function setPeek(on) {
    if (!inHero) return;
    nav.classList.toggle('nav-peek', on);
  }

  function clearPeekSoon() {
    clearTimeout(peekTimer);
    peekTimer = setTimeout(() => { if (inHero) nav.classList.remove('nav-peek'); }, 1800);
  }

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY >= window.innerHeight - 64) {
      // Scrolled past hero — keep nav visible permanently
      inHero = false;
      nav.classList.remove('nav-hero-hide', 'nav-peek');
    } else {
      inHero = true;
      nav.classList.add('nav-hero-hide');
      // Show briefly while scrolling, then hide
      setPeek(true);
      clearPeekSoon();
    }
  }, { passive: true });

  document.addEventListener('mousemove', e => {
    if (!inHero) return;
    if (e.clientY < 72) {
      setPeek(true);
      clearTimeout(peekTimer);
    } else {
      clearPeekSoon();
    }
  });
}

// ── Hide fixed hero after scroll past — prevents footer-reveal on overscroll ─
function initHeroHide() {
  const heroWrap = document.querySelector('.cs-wrap, .xz-cs-wrap, .hero');
  if (!heroWrap) return;
  function update() {
    heroWrap.style.visibility = window.scrollY >= window.innerHeight ? 'hidden' : '';
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ── Auto-init ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHeroNav();
  initHeroHide();
  initTOC();
  initScrollReveal();
});

