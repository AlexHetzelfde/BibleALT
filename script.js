document.addEventListener("DOMContentLoaded", () => {
  const landing           = document.getElementById("landing-layer");
  const bgSlides          = document.querySelectorAll(".bg-slide");
  const yearDisplay       = document.getElementById("year-display");
  const navDotsContainer  = document.getElementById("nav-dots");
  const progressBar       = document.getElementById("progress-bar");
  const infoScenes        = document.querySelectorAll(".scene[data-type='info']");
  const allScenes         = document.querySelectorAll(".scene");

  const ennuLayer         = document.getElementById("ennu-layer");
  const ennuSpacer        = document.getElementById("ennu-spacer");
  const ennuSlides        = document.querySelectorAll(".ennu-slide");
  const ennuYearLabel     = document.getElementById("ennu-year-label");
  const ENNU_YEARS        = [1961, 1998, 2010, 2017, 2021, 2025];
  const CURTAIN_PHASE     = 0.12;

  let progress        = 0;
  let locked          = true;
  let currentSceneTop = null;
  let currentEnnuIdx  = 0;   // ← bijhouden welke ennu-slide actief is

  document.body.style.overflow = "hidden";

  // === NAV DOTS ===
  infoScenes.forEach((scene) => {
    const dot = document.createElement("div");
    dot.classList.add("nav-dot");
    dot.addEventListener("click", () => {
      scene.scrollIntoView({ behavior: "smooth" });
    });
    navDotsContainer.appendChild(dot);
  });

  function updateNavDots(index) {
    document.querySelectorAll(".nav-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }

  // === ACHTERGROND ===
  function setBackground(index) {
    bgSlides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
  }

  // === INTRO GORDIJN ===
  function setProgress(p) {
    progress = Math.max(0, Math.min(1, p));
    landing.style.transform = `translateY(-${progress * 100}vh)`;
    if (progress >= 1 && locked) {
      locked = false;
      document.body.style.overflow = "auto";
      yearDisplay.classList.add("visible");
      navDotsContainer.classList.add("visible");
    }
    if (progress < 1 && !locked) {
      locked = true;
      document.body.style.overflow = "hidden";
      yearDisplay.classList.remove("visible");
      navDotsContainer.classList.remove("visible");
    }
  }

  // === EN NU: SLIDE WISSELEN ===
  // Wisselt naar een nieuwe slide. Als de tekst gelijk is aan de vorige
  // slide, wordt de tekst-animatie overgeslagen zodat de tekst blijft staan.
  function setEnnuSlide(newIdx) {
    if (newIdx === currentEnnuIdx) return;

    const prevSlide = ennuSlides[currentEnnuIdx];
    const newSlide  = ennuSlides[newIdx];

    const sameText =
      prevSlide.querySelector("p").textContent.trim() ===
      newSlide.querySelector("p").textContent.trim();

    // Wissel de actieve slide (alleen de foto verandert zichtbaar)
    ennuSlides.forEach((slide, i) => slide.classList.toggle("active", i === newIdx));
    ennuYearLabel.textContent = ENNU_YEARS[newIdx];

    // Als de tekst identiek is: tekst direct op eindpositie zetten, geen animatie
    if (sameText) {
      const textInner = newSlide.querySelector(".ennu-text-inner");
      const textLine  = newSlide.querySelector(".ennu-text-line");

      // Zet inline stijlen om transitie te omzeilen
      textInner.style.cssText = "transition:none;opacity:1;transform:translateX(0)";
      textLine.style.cssText  = "transition:none;transform:scaleX(1)";

      // Na twee frames de inline stijlen verwijderen; CSS-klasse houdt de staat vast
      requestAnimationFrame(() => requestAnimationFrame(() => {
        textInner.style.cssText = "";
        textLine.style.cssText  = "";
      }));
    }

    currentEnnuIdx = newIdx;
  }

  // === EN NU SECTIE ===
  function updateEnnuSection() {
    const spacerTop    = ennuSpacer.offsetTop;
    const spacerHeight = ennuSpacer.offsetHeight;
    const scrollTop    = window.scrollY;
    const relScroll    = scrollTop - spacerTop;
    const sectionProg  = relScroll / spacerHeight;

    // Vóór de spacer: ennu-laag staat beneden buiten beeld
    if (sectionProg < 0) {
      ennuLayer.style.transform    = "translateY(100vh)";
      ennuLayer.style.pointerEvents = "none";
      return;
    }

    // Voorbij de spacer: ennu-laag schuift omhoog → bronvermelding wordt zichtbaar
    if (sectionProg >= 1) {
      const beyondScroll = scrollTop - (spacerTop + spacerHeight);
      const exitProgress = Math.min(1, beyondScroll / window.innerHeight);
      ennuLayer.style.transform     = `translateY(${-exitProgress * 100}vh)`;
      // Zodra de laag volledig weg is, events doorsturen naar de bronnen-sectie
      ennuLayer.style.pointerEvents = exitProgress >= 1 ? "none" : "auto";
      return;
    }

    ennuLayer.style.pointerEvents = "auto";

    // Fase 1: gordijn schuift van onderaf omhoog
    const curtainProg = Math.min(1, sectionProg / CURTAIN_PHASE);
    ennuLayer.style.transform = `translateY(${(1 - curtainProg) * 100}vh)`;

    if (curtainProg > 0.5) {
      yearDisplay.classList.remove("visible");
      navDotsContainer.classList.remove("visible");
    }

    // Fase 2: slides wisselen op basis van scroll-voortgang
    if (sectionProg > CURTAIN_PHASE) {
      const photoProgress = (sectionProg - CURTAIN_PHASE) / (1 - CURTAIN_PHASE);
      const idx = Math.min(5, Math.floor(photoProgress * 6));
      setEnnuSlide(idx);
    } else {
      // Zorg dat slide 0 actief is tijdens het inrijden van het gordijn
      if (currentEnnuIdx !== 0) {
        ennuSlides.forEach((slide, i) => slide.classList.toggle("active", i === 0));
        ennuYearLabel.textContent = ENNU_YEARS[0];
        currentEnnuIdx = 0;
      }
    }
  }

  // === SCROLL ===
  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = ((scrollTop / docHeight) * 100) + "%";

    if (currentSceneTop !== null) {
      const activeSlide = document.querySelector(".bg-slide.active");
      if (activeSlide && activeSlide.style.backgroundImage) {
        const relativeScroll = scrollTop - currentSceneTop;
        activeSlide.style.backgroundPositionY =
          `calc(50% + ${relativeScroll * 0.03}px)`;
      }
    }

    updateEnnuSection();
  });

  // === KEYBOARD ===
  window.addEventListener("keydown", (e) => {
    if (locked) {
      if (e.key === "ArrowDown" || e.key === "PageDown") setProgress(progress + 0.15);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      const currentScroll = window.scrollY;
      for (let i = 0; i < allScenes.length; i++) {
        if (allScenes[i].offsetTop > currentScroll + 10) {
          allScenes[i].scrollIntoView({ behavior: "smooth" });
          break;
        }
      }
    }
    if (e.key === "ArrowUp" || e.key === "PageUp") {
      if (window.scrollY === 0) { setProgress(progress - 0.15); return; }
      const currentScroll = window.scrollY;
      for (let i = allScenes.length - 1; i >= 0; i--) {
        if (allScenes[i].offsetTop < currentScroll - 10) {
          allScenes[i].scrollIntoView({ behavior: "smooth" });
          break;
        }
      }
    }
  });

  // === WHEEL ===
  window.addEventListener("wheel", (e) => {
    if (locked) {
      e.preventDefault();
      setProgress(progress + e.deltaY / window.innerHeight);
      return;
    }
    if (window.scrollY === 0 && e.deltaY < 0) {
      e.preventDefault();
      setProgress(progress + e.deltaY / window.innerHeight);
    }
  }, { passive: false });

  // === TOUCH ===
  let touchStartY = 0;
  window.addEventListener("touchstart", e => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", e => {
    if (locked) {
      e.preventDefault();
      const delta = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      setProgress(progress + delta / window.innerHeight);
    }
  }, { passive: false });

  // === SCROLLAMA ===
  const scroller = scrollama();
  scroller
    .setup({ step: ".scene", offset: 0.5, progress: true })
    .onStepEnter(({ element }) => {
      if (element.dataset.type === "info") {
        const index = parseInt(element.dataset.index);
        setBackground(index);
        updateNavDots(index);
        element.querySelector(".textbox").classList.add("visible");
        currentSceneTop = element.offsetTop;
      } else if (element.dataset.type === "quote") {
        element.querySelector(".quote-box").classList.add("visible");
      } else if (element.dataset.type === "bronnen") {
        element.querySelector(".bronnen-box").classList.add("visible");
      }
    })
    .onStepExit(({ element }) => {
      if (element.dataset.type === "info") {
        element.querySelector(".textbox").classList.remove("visible");
      } else if (element.dataset.type === "quote") {
        element.querySelector(".quote-box").classList.remove("visible");
      } else if (element.dataset.type === "bronnen") {
        element.querySelector(".bronnen-box").classList.remove("visible");
      }
    })
    .onStepProgress(({ element, progress }) => {
      if (element.dataset.type === "bronnen") return;
      const yearStart = parseInt(element.dataset.year);
      const next      = element.nextElementSibling;
      const yearEnd   = next && next.dataset.year ? parseInt(next.dataset.year) : yearStart;
      yearDisplay.textContent = Math.round(yearStart + (yearEnd - yearStart) * progress);
    });

  window.addEventListener("resize", scroller.resize);
  updateEnnuSection();
});
