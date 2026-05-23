document.addEventListener("DOMContentLoaded", () => {
  const landing          = document.getElementById("landing-layer");
  const bgSlides         = document.querySelectorAll(".bg-slide");
  const yearDisplay      = document.getElementById("year-display");
  const navDotsContainer = document.getElementById("nav-dots");
  const progressBar      = document.getElementById("progress-bar");
  const infoScenes       = document.querySelectorAll(".scene[data-type='info']");
  const allScenes        = document.querySelectorAll(".scene");
  const allScenesArray   = Array.from(allScenes);
  const ennuSection      = document.getElementById("ennu-section");
  const ennuSlides       = document.querySelectorAll(".ennu-slide");

  let progress        = 0;
  let locked          = true;
  let currentSceneTop = null;
  let lastEnnuIndex   = -1;
  let textboxsInited  = false;

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
      if (!textboxsInited) {
        textboxsInited = true;
        initTextboxAnimations();
      }
    }
    if (progress < 1 && !locked) {
      locked = true;
      document.body.style.overflow = "hidden";
      yearDisplay.classList.remove("visible");
      navDotsContainer.classList.remove("visible");
    }
  }

  // === TEXTBOX ANIMATIES ===
  function initTextboxAnimations() {
    const textboxes = document.querySelectorAll(".textbox");
    textboxes.forEach((box) => {
      const naturalHeight = box.offsetHeight;
      box.dataset.fullText = box.textContent.trim();
      box.style.minHeight = naturalHeight + "px";
      box.textContent = "";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.dataset.animated) {
            entry.target.dataset.animated = "true";
            entry.target.classList.add("is-visible");
            setTimeout(() => {
              typewriterEffect(entry.target, entry.target.dataset.fullText);
            }, 500);
          }
        });
      },
      { threshold: 0.3 }
    );
    textboxes.forEach((box) => observer.observe(box));
  }

  function typewriterEffect(element, text, speed = 14) {
    let i = 0;
    const textNode = document.createTextNode("");
    const cursor   = document.createElement("span");
    cursor.className = "tw-cursor";
    cursor.textContent = "|";
    element.appendChild(textNode);
    element.appendChild(cursor);

    function type() {
      if (i < text.length) {
        textNode.textContent = text.slice(0, i + 1);
        i++;
        setTimeout(type, speed);
      } else {
        cursor.style.transition = "opacity 0.4s";
        cursor.style.opacity    = "0";
        setTimeout(() => cursor.remove(), 450);
      }
    }
    type();
  }

  // === YOUTUBE PAUZE ===
  function pauseAllIframesExcept(activeScene) {
    allScenes.forEach((scene) => {
      if (scene === activeScene) return;
      const iframe = scene.querySelector("iframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      }
    });
  }

  // === EN NU ===
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

  // === VERBERG UI BIJ DATA-SECTIE ===
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

  // === SCROLLAMA ===
  const scroller = scrollama();
  scroller
    .setup({ step: ".scene", offset: 0.5, progress: true })
    .onStepEnter(({ element }) => {
      const bgIndex = allScenesArray.indexOf(element);
      setBackground(bgIndex);
      currentSceneTop = element.offsetTop;

      if (element.dataset.type === "info") {
        const infoIndex = parseInt(element.dataset.index);
        updateNavDots(infoIndex);
        if (!locked) navDotsContainer.classList.add("visible");
      }
      if (!locked) yearDisplay.classList.add("visible");
      pauseAllIframesExcept(element);
    })
    .onStepProgress(({ element, progress: stepProgress }) => {
      const scrollTop     = window.scrollY;
      const sectionTop    = ennuSection.offsetTop;
      const sectionBottom = sectionTop + ennuSection.offsetHeight - window.innerHeight;
      if (scrollTop >= sectionTop && scrollTop <= sectionBottom) return;

      const yearStart = parseInt(element.dataset.year) || 0;
      let nextEl = element.nextElementSibling;
      while (nextEl && (!nextEl.classList.contains("scene") || !nextEl.dataset.year)) {
        nextEl = nextEl.nextElementSibling;
      }
      const yearEnd    = nextEl ? (parseInt(nextEl.dataset.year) || yearStart) : yearStart;
      const interpolated = Math.round(yearStart + (yearEnd - yearStart) * stepProgress);
      yearDisplay.textContent = interpolated;
    });

  window.addEventListener("resize", scroller.resize);
});
