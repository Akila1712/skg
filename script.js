const burger = document.getElementById('burger');
  const links = document.getElementById('links');
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });

  /* ===== Scroll-driven frame animation ===== */
(() => {
  const canvas = document.getElementById('frames');
  const ctx    = canvas.getContext('2d');
  const track  = document.getElementById('track');
  const hero   = document.querySelector('.hero');

  const TOTAL = 192;          // frame-0001 … frame-0192
  const STEP  = 1;            // 2 = every 2nd frame (lighter download)
  const PATH  = 'frames/frame-';
  const EXT   = 'png';        // 'webp' if you convert
  const CROP_Y = 56, CROP_H = 606;   // removes black bars + "Veo" mark
  const SCROLL_SCREENS = 3;   // scroll length (in screen heights) to play the whole animation
  const SMOOTH = 0.18;        // 1 = instant, lower = softer

  const pad = n => String(n).padStart(4, '0');
  const idx = [];
  for (let i = 1; i <= TOTAL; i += STEP) idx.push(i);
  if (idx[idx.length - 1] !== TOTAL) idx.push(TOTAL);

  const imgs = new Array(idx.length);
  let startY = 0, scrollPx = 1, cur = 0, target = 0, running = false;

  const clamp = v => Math.max(0, Math.min(1, v));

  // nearest loaded frame at or before index i
  const frameAt = i => {
    for (let k = i; k >= 0; k--) if (imgs[k] && imgs[k].naturalWidth) return imgs[k];
    return null;
  };

  const draw = () => {
    const img = frameAt(Math.round(cur * (idx.length - 1)));
    if (img) ctx.drawImage(img, 0, CROP_Y, 1280, CROP_H, 0, 0, canvas.width, canvas.height);
  };

  const loop = () => {
    cur += (target - cur) * SMOOTH;
    if (Math.abs(target - cur) < 0.0005) cur = target;
    draw();
    if (cur !== target) requestAnimationFrame(loop); else running = false;
  };
  const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };

  const readScroll = () => { target = clamp((scrollY - startY) / scrollPx); kick(); };

  const layout = () => {
    const t = Math.min(0, innerHeight - hero.offsetHeight); // keeps tall heroes fully reachable
    hero.style.top = t + 'px';
    scrollPx = innerHeight * SCROLL_SCREENS;
    track.style.height = hero.offsetHeight + scrollPx + 'px';
    startY = track.getBoundingClientRect().top + scrollY - t;
    readScroll();
  };

  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', layout);

  // load frame 1 first, then the rest
  const load = (n, i) => new Promise(res => {
    const im = new Image();
    im.onload = im.onerror = () => { imgs[i] = im; res(); };
    im.src = `${PATH}${pad(n)}.${EXT}`;
  });

  layout();
  load(idx[0], 0).then(() => { draw(); });
  idx.forEach((n, i) => { if (i) load(n, i).then(() => { if (!running) draw(); }); });
})();

/* ===== Product range reveal ===== */
(() => {
  const items = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.25 });
  items.forEach(el => io.observe(el));
})();

/* ===== Gallery filter + lightbox, footer ===== */
(() => {
  const items = [...document.querySelectorAll('.gi')];
  const btns  = document.querySelectorAll('.flt');
  const lb    = document.getElementById('lb');
  const lbImg = lb.querySelector('img');
  const lbCap = lb.querySelector('.lb-cap');
  let list = [], cur = 0;

  // hide any photo that hasn't been added yet
  items.forEach(it => it.querySelector('img').addEventListener('error', e => { e.target.style.opacity = 0; }));

  // filter
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.classList.toggle('on', x === b));
    const f = b.dataset.f;
    items.forEach(it => {
      const show = f === 'all' || it.dataset.cat === f;
      it.hidden = !show;
      if (show) { it.classList.remove('pop'); void it.offsetWidth; it.classList.add('pop'); }
    });
  }));

  // lightbox
  const show = i => {
    cur = (i + list.length) % list.length;
    const it = list[cur], im = it.querySelector('img');
    lbImg.src = im.src; lbImg.alt = im.alt;
    lbCap.innerHTML = '<b></b><em></em>';
    lbCap.firstChild.textContent = it.dataset.title;
    lbCap.lastChild.textContent = `${cur + 1} / ${list.length}`;
  };
  const open = it => {
    list = items.filter(x => !x.hidden);
    show(list.indexOf(it));
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  items.forEach(it => it.addEventListener('click', () => open(it)));
  lb.querySelector('.lb-x').addEventListener('click', close);
  lb.querySelector('.prev').addEventListener('click', () => show(cur - 1));
  lb.querySelector('.next').addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });

  // footer
  document.getElementById('yr').textContent = new Date().getFullYear();
  document.getElementById('totop').addEventListener('click', () =>
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
})();