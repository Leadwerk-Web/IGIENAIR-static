const body = document.body;
const menuToggle = document.querySelector(".mobile-menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const addressSelect = document.getElementById("address-match");
const altAddress = document.querySelector("[data-alt-address]");
const meters = document.querySelectorAll(".meter");
const anchorLinks = document.querySelectorAll('a[href^="#"]');
const inertControls = document.querySelectorAll("[data-inert]");
const videoLoadButtons = document.querySelectorAll("[data-video]");
const certificateGalleries = document.querySelectorAll("[data-cert-gallery]");
const accordionGroups = document.querySelectorAll("[data-accordion]");
const locationBrowsers = document.querySelectorAll("[data-location-browser]");
const glossaries = document.querySelectorAll("[data-glossary]");

function syncHeaderState() {
  body.classList.toggle("is-scrolled", window.scrollY > 24);
}

function setMenuState(isOpen) {
  body.classList.toggle("menu-open", isOpen);
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
  mobileMenu?.setAttribute("aria-hidden", String(!isOpen));
}

function syncAddressFields() {
  const isDifferent = addressSelect?.value === "nein";
  if (!altAddress) return;
  altAddress.hidden = !isDifferent;
  altAddress.querySelectorAll("input").forEach((input) => {
    input.required = Boolean(isDifferent);
  });
}

function initVideos() {
  videoLoadButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      const src = button.dataset.video || "";
      iframe.src = `${src}${src.includes("?") ? "&" : "?"}autoplay=1`;
      iframe.title = button.dataset.title || "Video";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      button.replaceWith(iframe);
    });
  });
}

function observeMeters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const progress = entry.target.dataset.progress || "0";
      entry.target.style.setProperty("--progress", progress);
      entry.target.classList.add("is-animated");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.45 });

  meters.forEach((meter) => observer.observe(meter));
}

function initCertificateGalleries() {
  certificateGalleries.forEach((gallery) => {
    const preview = gallery.querySelector("[data-cert-preview]");
    const link = gallery.querySelector("[data-cert-link]");
    const items = Array.from(gallery.querySelectorAll("[data-cert-item]"));

    if (!preview || !link || items.length === 0) {
      return;
    }

    items.forEach((item) => {
      const preloadSrc = item.dataset.certImg;
      if (preloadSrc) {
        const image = new Image();
        image.src = preloadSrc;
      }
    });

    const activate = (item) => {
      items.forEach((candidate) => {
        const isActive = candidate === item;
        candidate.classList.toggle("is-active", isActive);
        candidate.setAttribute("aria-pressed", String(isActive));
      });

      const nextSrc = item.dataset.certImg || preview.getAttribute("src") || "";
      const nextHref = item.dataset.certPdf || link.getAttribute("href") || "";
      const nextAlt = item.dataset.certAlt || item.textContent?.trim() || "";

      preview.style.opacity = "0";
      preview.alt = nextAlt;
      link.href = nextHref;
      preview.src = nextSrc;
      if (preview.complete) {
        preview.style.opacity = "1";
      }
    };

    preview.addEventListener("load", () => {
      preview.style.opacity = "1";
    });

    const initial = items.find((item) => item.classList.contains("is-active")) || items[0];
    activate(initial);

    gallery.addEventListener("click", (event) => {
      const item = event.target.closest("[data-cert-item]");
      if (!item) {
        return;
      }

      activate(item);
    });
  });
}

function initLocationBrowsers() {
  locationBrowsers.forEach((browser) => {
    const select = browser.querySelector("[data-location-select]");
    const cardsWrap = browser.querySelector("[data-location-cards]");
    const cards = Array.from(browser.querySelectorAll("[data-location-card]"));
    const mapObjects = Array.from(browser.querySelectorAll("[data-location-map-object]"));
    const boundMarkers = new WeakSet();
    let markers = [];
    let pendingState = select?.value || "";
    let syncTimer = 0;

    if (!select || cards.length === 0) {
      return;
    }

    const getObjectMarkers = () => mapObjects.flatMap((mapObject) => {
      try {
        return mapObject.contentDocument
          ? Array.from(mapObject.contentDocument.querySelectorAll("[data-location-marker]"))
          : [];
      } catch {
        return [];
      }
    });

    const collectMarkers = () => [
      ...Array.from(browser.querySelectorAll("[data-location-marker]")),
      ...getObjectMarkers(),
    ];

    const getMarkerState = (marker) => marker.dataset?.locationMarker
      || marker.getAttribute("data-location-marker")
      || "";

    const setState = (state) => {
      const activeState = state || "";
      pendingState = activeState;

      cards.forEach((card) => {
        card.hidden = Boolean(activeState) && card.dataset.locationCard !== activeState;
      });

      markers = collectMarkers();
      markers.forEach((marker) => {
        const isActive = getMarkerState(marker) === activeState;
        marker.classList.toggle("is-active", isActive);
        marker.setAttribute("aria-pressed", String(isActive));
      });

      select.value = activeState;
      if (cardsWrap) {
        cardsWrap.scrollTop = 0;
      }
    };

    const bindMarker = (marker) => {
      if (boundMarkers.has(marker)) {
        return;
      }

      boundMarkers.add(marker);
      marker.addEventListener("click", () => {
        setState(getMarkerState(marker));
      });
      marker.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        setState(getMarkerState(marker));
      });
    };

    const syncMarkers = () => {
      markers = collectMarkers();
      markers.forEach(bindMarker);
      setState(pendingState || select.value);
      return markers.length;
    };

    const scheduleMarkerSync = (attempt = 0) => {
      window.clearTimeout(syncTimer);
      const markerCount = syncMarkers();
      if (markerCount > 0 || attempt >= 20) {
        return;
      }

      syncTimer = window.setTimeout(() => {
        scheduleMarkerSync(attempt + 1);
      }, 100);
    };

    select.addEventListener("change", () => {
      setState(select.value);
      scheduleMarkerSync();
    });

    mapObjects.forEach((mapObject) => {
      mapObject.addEventListener("load", () => {
        scheduleMarkerSync();
      });
    });

    scheduleMarkerSync();
  });
}

function initGlossaries() {
  const normalizeGlossaryText = (value) => value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  glossaries.forEach((glossary) => {
    const form = glossary.querySelector("[data-glossary-form]");
    const searchInput = glossary.querySelector("[data-glossary-search]");
    const groups = Array.from(glossary.querySelectorAll("[data-glossary-group]"));
    const navItems = Array.from(glossary.querySelectorAll("[data-glossary-nav-item]"));

    if (!searchInput || groups.length === 0 || navItems.length === 0) {
      return;
    }

    const cards = Array.from(glossary.querySelectorAll("[data-glossary-card]"));

    cards.forEach((card) => {
      card.dataset.searchNormalized = normalizeGlossaryText(card.dataset.search || card.textContent || "");
    });

    const setActiveLetter = (letter) => {
      navItems.forEach((item) => {
        const isActive = Boolean(letter) && item.dataset.letter === letter && item.classList.contains("has-posts");
        item.classList.toggle("is-active", isActive);
      });
    };

    const syncActiveLetter = () => {
      if (searchInput.value.trim()) {
        return;
      }

      const visibleGroups = groups.filter((group) => !group.hidden);
      if (visibleGroups.length === 0) {
        setActiveLetter("");
        return;
      }

      let activeGroup = visibleGroups[0];

      visibleGroups.forEach((group) => {
        if (group.getBoundingClientRect().top <= 180) {
          activeGroup = group;
        }
      });

      setActiveLetter(activeGroup.dataset.letter || "");
    };

    const applyFilter = () => {
      const term = normalizeGlossaryText(searchInput.value);
      let firstVisibleLetter = "";

      groups.forEach((group) => {
        const groupCards = Array.from(group.querySelectorAll("[data-glossary-card]"));
        let visibleCount = 0;

        groupCards.forEach((card) => {
          const matches = !term || (card.dataset.searchNormalized || "").includes(term);
          card.hidden = !matches;
          if (matches) {
            visibleCount += 1;
          }
        });

        group.hidden = visibleCount === 0;
        if (!firstVisibleLetter && visibleCount > 0) {
          firstVisibleLetter = group.dataset.letter || "";
        }
      });

      navItems.forEach((item) => {
        const letter = item.dataset.letter || "";
        const hasVisibleGroup = groups.some((group) => !group.hidden && group.dataset.letter === letter);
        const link = item.querySelector("a");

        item.classList.toggle("is-disabled", item.classList.contains("has-posts") && !hasVisibleGroup);
        if (link) {
          link.tabIndex = hasVisibleGroup ? 0 : -1;
          link.setAttribute("aria-disabled", String(!hasVisibleGroup));
        }
      });

      if (term) {
        setActiveLetter(firstVisibleLetter);
      } else {
        syncActiveLetter();
      }
    };

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
    });

    searchInput.addEventListener("input", applyFilter);

    glossary.addEventListener("click", (event) => {
      const link = event.target.closest("[data-letter-link]");
      if (!link) {
        return;
      }

      const navItem = link.closest("[data-glossary-nav-item]");
      if (navItem?.classList.contains("is-disabled")) {
        event.preventDefault();
      }
    });

    window.addEventListener("scroll", syncActiveLetter, { passive: true });

    applyFilter();
  });
}

function initAccordions() {
  accordionGroups.forEach((group) => {
    const items = Array.from(group.querySelectorAll("[data-accordion-item]"));

    if (items.length === 0) {
      return;
    }

    const setOpenItem = (activeItem) => {
      items.forEach((item) => {
        const trigger = item.querySelector("[data-accordion-trigger]");
        const panel = item.querySelector("[data-accordion-panel]");
        const isOpen = item === activeItem;

        item.classList.toggle("is-open", isOpen);
        trigger?.setAttribute("aria-expanded", String(isOpen));

        if (panel) {
          panel.hidden = !isOpen;
        }
      });
    };

    const initial = items.find((item) => item.classList.contains("is-open")) || items[0];
    setOpenItem(initial);

    group.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-accordion-trigger]");
      if (!trigger) {
        return;
      }

      const item = trigger.closest("[data-accordion-item]");
      if (!item || item.classList.contains("is-open")) {
        return;
      }

      setOpenItem(item);
    });
  });
}

function initMenu() {
  menuToggle?.addEventListener("click", () => {
    setMenuState(!body.classList.contains("menu-open"));
  });

  mobileMenu?.addEventListener("click", (event) => {
    if (event.target === mobileMenu) {
      setMenuState(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) {
      setMenuState(false);
    }
  });
}

function initAnchors() {
  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") {
        event.preventDefault();
        return;
      }

      const target = document.querySelector(href);
      if (!target) {
        return;
      }

      event.preventDefault();
      setMenuState(false);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function initInertControls() {
  inertControls.forEach((control) => {
    control.addEventListener("click", (event) => {
      event.preventDefault();
    });
  });
}

function initKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("menu-open")) {
      setMenuState(false);
    }
  });
}

window.addEventListener("scroll", syncHeaderState, { passive: true });
addressSelect?.addEventListener("change", syncAddressFields);

initMenu();
initAnchors();
initInertControls();
initKeyboard();
initVideos();
initCertificateGalleries();
initLocationBrowsers();
initGlossaries();
initAccordions();
observeMeters();
syncAddressFields();
syncHeaderState();
