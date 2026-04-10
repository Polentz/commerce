(() => {
  // Each entry: { src, url } — set url per image or use a shared default
  const IMAGE_LINK = 'https://www.instagram.com/commerce__commerce/'; // default link for all images

  const images = [
    { src: 'assets/aqin-26245882.jpg' },
    { src: 'assets/barnabas-davoti-31615494-9800961.jpg' },
    { src: 'assets/beat-bieri-2159265755-36568662.jpg' },
    { src: 'assets/dmitry-kharitonov-911287485-20868515.jpg' },
    { src: 'assets/enrique-hidalgo-1230661389-34330428.jpg' },
    { src: 'assets/filiberto-giglio-993682392-28962104.jpg' },
    { src: 'assets/googledeepmind-18069860.jpg' },
    { src: 'assets/googledeepmind-25626506.jpg' },
    { src: 'assets/googledeepmind-25626511.jpg' },
    { src: 'assets/lawlesscapture-6395524.jpg' },
    { src: 'assets/lonnyphotography-34483851.jpg' },
    { src: 'assets/macro-photography-12412301-12514380.jpg' },
    { src: 'assets/macro-photography-12412301-12514383.jpg' },
    { src: 'assets/macro-photography-12412301-12561245.jpg' },
    { src: 'assets/mike-van-schoonderwalt-1884800-5504365.jpg' },
    { src: 'assets/nguyen-92374660-9144702.jpg' },
    { src: 'assets/nikola-tomasic-58494762-33332014.jpg' },
    { src: 'assets/nils-rotura-2157795908-35101219.jpg' },
  ];
  const IMAGE_COUNT = images.length;
  const COOLDOWN_MS = 200;          // min time between transitions
  const SCROLL_THRESHOLD = 20;       // deltaY needed to trigger a change

  // ── DOM references ──
  const track = document.querySelector('.gallery__track');
  const counterCurrent = document.querySelector('.gallery__current');
  const counterTotal = document.querySelector('.gallery__total');
  const counter = document.querySelector('.gallery__counter');
  const scrollHint = document.querySelector('.scroll-hint');
  const cursorLabel = document.querySelector('.cursor-label');

  counterTotal.textContent = String(IMAGE_COUNT).padStart(2, '0');

  // ── Create image elements wrapped in links ──
  const imageEls = images.map((entry, i) => {
    const link = document.createElement('a');
    link.className = 'gallery__link';
    link.href = entry.url || IMAGE_LINK;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const img = document.createElement('img');
    img.className = 'gallery__image';
    img.src = entry.src;
    img.alt = `Image ${i + 1}`;
    img.draggable = false;

    link.appendChild(img);
    if (i === 0) link.classList.add('is-active');
    track.appendChild(link);
    return link;
  });

  // ── State ──
  let currentIndex = 0;
  let prevIndex = -1;
  let counterShown = false;
  let lastScrollTime = 0;
  let accumulatedDelta = 0;
  let hintVisible = true;
  let settleTimer = null;
  let activeTweenOut = null;
  let activeTweenIn = null;

  // ── Set initial visibility: all hidden except the first ──
  imageEls.forEach((img, i) => {
    gsap.set(img, { opacity: i === 0 ? 1 : 0 });
  });

  // ── Snap everything to a clean final state ──
  function settle() {
    imageEls.forEach((img, i) => {
      gsap.killTweensOf(img);
      if (i === currentIndex) {
        img.classList.add('is-active');
        gsap.set(img, { opacity: 1, scale: 1, clipPath: 'inset(0 0 0 0)', zIndex: 2 });
      } else if (i === prevIndex) {
        img.classList.remove('is-active');
        gsap.set(img, { opacity: 1, scale: 2, clipPath: 'inset(0 0 0 0)', zIndex: 0 });
      } else {
        img.classList.remove('is-active');
        gsap.set(img, { opacity: 0, scale: 1, clipPath: 'inset(0 0 0 0)', zIndex: 0 });
      }
    });
  }

  // ── Force-complete any running animation before starting a new one ──
  function completeActiveTweens() {
    if (activeTweenOut) {
      activeTweenOut.progress(1);
      activeTweenOut = null;
    }
    if (activeTweenIn) {
      activeTweenIn.progress(1);
      activeTweenIn = null;
    }
  }

  // ── Transition to a given index ──
  function goTo(nextIndex) {
    if (nextIndex === currentIndex) return;

    // Show counter on first transition
    if (!counterShown) {
      counterShown = true;
      counter.classList.add('is-visible');
    }

    // Cancel pending settle, schedule a new one
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 200);

    // Force-complete the previous animation so it reaches its final state
    completeActiveTweens();

    // Clean up all non-participating images
    imageEls.forEach((img, i) => {
      if (i !== currentIndex && i !== nextIndex) {
        gsap.killTweensOf(img);
        img.classList.remove('is-active');
        if (i === prevIndex) {
          gsap.set(img, { opacity: 1, scale: 2, clipPath: 'inset(0 0 0 0)', zIndex: 0 });
        } else {
          gsap.set(img, { opacity: 0, scale: 1, clipPath: 'inset(0 0 0 0)', zIndex: 0 });
        }
      }
    });

    const outgoing = imageEls[currentIndex];
    const incoming = imageEls[nextIndex];

    // Outgoing: ensure fully visible, layer above backdrop, then enlarge
    gsap.set(outgoing, { opacity: 1, zIndex: 1 });
    activeTweenOut = gsap.to(outgoing, {
      scale: 2,
      duration: 0.15,
      ease: 'power1.out',
    });

    // Incoming: highest layer, starts as tiny point in center and expands
    gsap.set(incoming, {
      opacity: 1,
      scale: 0,
      clipPath: 'inset(50% 50% 50% 50%)',
      zIndex: 2,
    });
    incoming.classList.add('is-active');

    activeTweenIn = gsap.to(incoming, {
      clipPath: 'inset(0% 0% 0% 0%)',
      scale: 1,
      duration: 0.3,
      ease: 'power1.out',
      onComplete() {
        outgoing.classList.remove('is-active');
        gsap.set(outgoing, { opacity: 1, scale: 2, clipPath: 'inset(0 0 0 0)', zIndex: 0 });
        activeTweenOut = null;
        activeTweenIn = null;
      }
    });

    prevIndex = currentIndex;
    currentIndex = nextIndex;
    counterCurrent.textContent = String(currentIndex + 1).padStart(2, '0');
  }

  // ── Wheel handler ──
  function onWheel(e) {
    e.preventDefault();

    // Hide hint on first scroll
    // if (hintVisible) {
    //   hintVisible = false;
    //   scrollHint.classList.add('is-hidden');
    // }

    const now = Date.now();
    if (now - lastScrollTime < COOLDOWN_MS) return;

    accumulatedDelta += e.deltaY;

    if (Math.abs(accumulatedDelta) < SCROLL_THRESHOLD) return;

    const direction = accumulatedDelta > 0 ? 1 : -1;
    accumulatedDelta = 0;
    lastScrollTime = now;

    const nextIndex = (currentIndex + direction + IMAGE_COUNT) % IMAGE_COUNT;
    goTo(nextIndex);
  }

  // ── Touch support (fires continuously while swiping) ──
  let touchLastY = 0;
  let touchAccDelta = 0;
  const TOUCH_THRESHOLD = 15;

  let cursorLabelShown = false;

  function onTouchStart(e) {
    if (!cursorLabelShown) {
      cursorLabelShown = true;
      cursorLabel.classList.add('is-visible');
    }
    touchLastY = e.touches[0].clientY;
    touchAccDelta = 0;
  }

  function onTouchMove(e) {
    e.preventDefault();
    const y = e.touches[0].clientY;
    touchAccDelta += touchLastY - y;
    touchLastY = y;

    if (Math.abs(touchAccDelta) < TOUCH_THRESHOLD) return;

    const now = Date.now();
    if (now - lastScrollTime < COOLDOWN_MS) return;
    lastScrollTime = now;

    const direction = touchAccDelta > 0 ? 1 : -1;
    touchAccDelta = 0;

    const nextIndex = (currentIndex + direction + IMAGE_COUNT) % IMAGE_COUNT;
    goTo(nextIndex);
  }

  // ── Keyboard support (arrow keys) ──
  function onKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const now = Date.now();
      if (now - lastScrollTime < COOLDOWN_MS) return;
      lastScrollTime = now;
      goTo((currentIndex + 1) % IMAGE_COUNT);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const now = Date.now();
      if (now - lastScrollTime < COOLDOWN_MS) return;
      lastScrollTime = now;
      goTo((currentIndex - 1 + IMAGE_COUNT) % IMAGE_COUNT);
    }
  }

  // ── Cursor label follows mouse with elastic effect ──
  let mouseX = 0, mouseY = 0;
  let labelX = 0, labelY = 0;
  let labelVisible = false;
  let rafId = null;

  function updateLabelPosition() {
    // Elastic lerp — label trails behind the mouse
    labelX += (mouseX - labelX) * 0.12;
    labelY += (mouseY - labelY) * 0.12;
    gsap.set(cursorLabel, { left: labelX, top: labelY });

    if (labelVisible) {
      rafId = requestAnimationFrame(updateLabelPosition);
    }
  }

  track.addEventListener('mouseenter', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    labelX = mouseX;
    labelY = mouseY;
    gsap.to(cursorLabel, { opacity: 1, duration: 0.25 });
    labelVisible = true;
    rafId = requestAnimationFrame(updateLabelPosition);
  });

  track.addEventListener('mouseleave', () => {
    gsap.to(cursorLabel, { opacity: 0, duration: 0.25 });
    labelVisible = false;
    if (rafId) cancelAnimationFrame(rafId);
  });

  track.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // ── Bind events ──
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('keydown', onKeyDown);
})();
