document.addEventListener("DOMContentLoaded", () => {
  const landing          = document.getElementById("landing-layer");
  const bgSlides         = document.querySelectorAll(".bg-slide");
  const yearDisplay      = document.getElementById("year-display");
  const navDotsContainer = document.getElementById("nav-dots");
  const progressBar      = document.getElementById("progress-bar");
  const infoScenes       = document.querySelectorAll(".scene[data-type='info']");
  const allScenes        = document.querySelectorAll(".scene");
  const ennuSection      = document.getElementById("ennu-section");
  const ennuSlides       = document.querySelectorAll(".ennu-slide");

  let progress      = 0;
  let locked        = true;
  let currentSceneTop = null;
  let lastEnnuIndex = -1;

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

  // === EN NU: sticky scroll logica ===
  function updateEnnuSection(scrollTop) {
    const sectionTop    = ennuSection.offsetTop;
    const sectionHeight = ennuSection.offsetHeight;
    const scrollRange   = sectionHeight - window.innerHeight;
    const scrollInside  = scrollTop - sectionTop;

    if (scrollInside < 0 || scrollInside > scrollRange) return;

    const rawProgress = scrollInside / scrollRange;
    const slideIndex  = Math.min(
      Math.floor(rawProgress * ennuSlides.length),
      ennuSlides.length - 1
    );

    if (slideIndex !== lastEnnuIndex) {
      ennuSlides.forEach((slide, i) => {
        slide.classList.toggle("active", i === slideIndex);
      });
      lastEnnuIndex = slideIndex;
    }

    yearDisplay.classList.remove("visible");
    navDotsContainer.classList.remove("visible");
  }

  // === Verberg UI bij data-verantwoording ===
  const dataSection = document.getElementById("data-verantwoording");
  if (dataSection) {
    const hideUiObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          yearDisplay.classList.remove("visible");
          navDotsContainer.classList.remove("visible");
        }
      });
    }, { threshold: 0.05 });
    hideUiObserver.observe(dataSection);
  }

  // === SCROLL ===
  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = ((scrollTop / docHeight) * 100) + "%";

    if (currentSceneTop !== null) {
      const activeSlide = document.querySelector(".bg-slide.active");
      if (activeSlide) {
        const relativeScroll = scrollTop - currentSceneTop;
        activeSlide.style.backgroundPositionY =
          `calc(50% + ${relativeScroll * 0.03}px)`;
      }
    }

    updateEnnuSection(scrollTop);
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

  // === SCROLLAMA (alleen story info-scenes) ===
  const scroller = scrollama();
  scroller
    .setup({ step: ".scene[data-type='info']", offset: 0.5, progress: true })
    .onStepEnter(({ element }) => {
      const index = parseInt(element.dataset.index);
      setBackground(index);
      updateNavDots(index);
      currentSceneTop = element.offsetTop;
      if (!locked) navDotsContainer.classList.add("visible");
    })
    .onStepProgress(({ element, progress }) => {
      const scrollTop     = window.scrollY;
      const sectionTop    = ennuSection.offsetTop;
      const sectionBottom = sectionTop + ennuSection.offsetHeight - window.innerHeight;
      if (scrollTop >= sectionTop && scrollTop <= sectionBottom) return;

      const yearStart = parseInt(element.dataset.year);
      const next      = element.nextElementSibling;
      const yearEnd   = next && next.dataset.year ? parseInt(next.dataset.year) : yearStart;
      yearDisplay.textContent = Math.round(yearStart + (yearEnd - yearStart) * progress);
    });

  window.addEventListener("resize", scroller.resize);
});
