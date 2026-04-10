(() => {
  const IMAGE_COUNT = 20;
  const COOLDOWN_MS = 10;          // min time between transitions
  const SCROLL_THRESHOLD = 1;       // deltaY needed to trigger a change

  // ── Generate placeholder images (replace with your own paths) ──
  const images = Array.from({ length: IMAGE_COUNT }, (_, i) => {
    const hue = (i * 360) / IMAGE_COUNT;
    // Using picsum for demo; swap these URLs for your real images
    return `https://picsum.photos/seed/commerce${i + 1}/800/800`;
  });

  // ── DOM references ──
  const track = document.querySelector('.gallery__track');
  const counterCurrent = document.querySelector('.gallery__current');
  const counterTotal = document.querySelector('.gallery__total');
  const scrollHint = document.querySelector('.scroll-hint');

  counterTotal.textContent = String(IMAGE_COUNT).padStart(2, '0');

  // ── Create image elements ──
  const imageEls = images.map((src, i) => {
    const img = document.createElement('img');
    img.className = 'gallery__image';
    img.src = src;
    img.alt = `Image ${i + 1}`;
    img.draggable = false;
    if (i === 0) img.classList.add('is-active');
    track.appendChild(img);
    return img;
  });

  // ── State ──
  let currentIndex = 0;
  let isAnimating = false;
  let lastScrollTime = 0;
  let accumulatedDelta = 0;
  let hintVisible = true;

  // ── Set initial image visible ──
  gsap.set(imageEls[0], { opacity: 1 });

  // ── Transition to a given index ──
  function goTo(nextIndex) {
    if (nextIndex === currentIndex || isAnimating) return;
    isAnimating = true;

    const outgoing = imageEls[currentIndex];
    const incoming = imageEls[nextIndex];
    const tl = gsap.timeline({
      onComplete() {
        outgoing.classList.remove('is-active');
        isAnimating = false;
        currentIndex = nextIndex;
        counterCurrent.textContent = String(currentIndex + 1).padStart(2, '0');
      }
    });

    // Incoming: starts as a tiny point in the center and expands
    gsap.set(incoming, {
      opacity: 1,
      scale: 0,
      clipPath: 'inset(50% 50% 50% 50%)',
    });
    incoming.classList.add('is-active');

    tl.to(incoming, {
      clipPath: 'inset(0% 0% 0% 0%)',
      scale: 1,
      duration: 0.15,
      ease: 'power1.out',
    }, 0);

    // Outgoing: instant fade as new image covers it
    tl.to(outgoing, {
      opacity: 0,
      duration: 0.1,
      ease: 'none',
    }, 0.05);
  }

  // ── Wheel handler ──
  function onWheel(e) {
    e.preventDefault();

    // Hide hint on first scroll
    if (hintVisible) {
      hintVisible = false;
      scrollHint.classList.add('is-hidden');
    }

    if (isAnimating) return;

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

  // ── Touch support ──
  let touchStartY = 0;

  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) < 30 || isAnimating) return;

    if (hintVisible) {
      hintVisible = false;
      scrollHint.classList.add('is-hidden');
    }

    const now = Date.now();
    if (now - lastScrollTime < COOLDOWN_MS) return;
    lastScrollTime = now;

    const direction = deltaY > 0 ? 1 : -1;
    const nextIndex = (currentIndex + direction + IMAGE_COUNT) % IMAGE_COUNT;
    goTo(nextIndex);
  }

  // ── Keyboard support (arrow keys) ──
  function onKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (isAnimating) return;
      const now = Date.now();
      if (now - lastScrollTime < COOLDOWN_MS) return;
      lastScrollTime = now;
      goTo((currentIndex + 1) % IMAGE_COUNT);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (isAnimating) return;
      const now = Date.now();
      if (now - lastScrollTime < COOLDOWN_MS) return;
      lastScrollTime = now;
      goTo((currentIndex - 1 + IMAGE_COUNT) % IMAGE_COUNT);
    }
  }

  // ── Bind events ──
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKeyDown);
})();
