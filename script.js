document.addEventListener("DOMContentLoaded", () => {
  const landing          = document.getElementById("landing-layer");
  const bgSlides         = document.querySelectorAll(".bg-slide");
  const yearDisplay      = document.getElementById("year-display");
  const navDotsContainer = document.getElementById("nav-dots");
  const progressBar      = document.getElementById("progress-bar");
  const infoScenes       = document.querySelectorAll(".scene[data-type='info']");
  const allScenes        = document.querySelectorAll(".scene");
  const ennuBlocks       = document.querySelectorAll(".ennu-block");

  let progress        = 0;
  let locked          = true;
  let currentSceneTop = null;

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

  // === ENNU BLOCKS: fade in bij scrollen via IntersectionObserver ===
  const ennuObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.2 });

  ennuBlocks.forEach(block => ennuObserver.observe(block));

  // === Verberg jaar & navdots zodra we de ennu-sectie in scrollen ===
  const ennuSection = document.getElementById("ennu-section");
  if (ennuSection) {
    const hideUiObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          yearDisplay.classList.remove("visible");
          navDotsContainer.classList.remove("visible");
        } else {
          if (!locked) {
            yearDisplay.classList.add("visible");
            navDotsContainer.classList.add("visible");
          }
        }
      });
    }, { threshold: 0.05 });
    hideUiObserver.observe(ennuSection);
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

  // === SCROLLAMA (alleen info + quote scenes) ===
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
      }
    })
    .onStepExit(({ element }) => {
      if (element.dataset.type === "info") {
        element.querySelector(".textbox").classList.remove("visible");
      } else if (element.dataset.type === "quote") {
        element.querySelector(".quote-box").classList.remove("visible");
      }
    })
    .onStepProgress(({ element, progress }) => {
      const yearStart = parseInt(element.dataset.year);
      const next      = element.nextElementSibling;
      const yearEnd   = next && next.dataset.year ? parseInt(next.dataset.year) : yearStart;
      yearDisplay.textContent = Math.round(yearStart + (yearEnd - yearStart) * progress);
    });

  window.addEventListener("resize", scroller.resize);
});
