function resolveSitePath(urlPath) {
  const script = document.querySelector('script[src*="script.js"]');
  let prefix = "";

  if (script) {
    const src = script.getAttribute("src") || "";
    if (!src.startsWith("/")) {
      const ups = (src.match(/\.\.\//g) || []).length;
      prefix = ups ? "../".repeat(ups) : "";
    } else {
      return urlPath;
    }
  }

  const qIdx = urlPath.indexOf("?");
  const query = qIdx >= 0 ? urlPath.slice(qIdx) : "";
  const pathAndHash = qIdx >= 0 ? urlPath.slice(0, qIdx) : urlPath;
  const hashIdx = pathAndHash.indexOf("#");
  const hash = hashIdx >= 0 ? pathAndHash.slice(hashIdx) : "";
  const pathname = hashIdx >= 0 ? pathAndHash.slice(0, hashIdx) : pathAndHash;

  let target;
  if (!pathname || pathname === "/") {
    target = "index.html";
  } else if (/^\/(assets\/|styles\.css|script\.js)/.test(pathname)) {
    target = pathname.slice(1);
  } else {
    const clean = pathname.replace(/^\/+|\/+$/g, "");
    target = `${clean}/index.html`;
  }

  return `${prefix}${target}${hash}${query}`;
}

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

function initOfferForm() {
  const form = document.querySelector(".quote-form--offer");
  if (!form) return;

  const servicesFieldset = form.querySelector("[data-offer-services]");
  const serviceCheckboxes = form.querySelectorAll('input[name="offer-type[]"]');
  const servicesError = form.querySelector("[data-offer-services-error]");

  const hasServiceSelection = () => Array.from(serviceCheckboxes).some((box) => box.checked);

  const syncServicesValidation = () => {
    if (!servicesFieldset) return;
    const isValid = hasServiceSelection();
    servicesFieldset.classList.toggle("is-invalid", !isValid);
    if (servicesError) {
      servicesError.hidden = isValid;
    }
  };

  serviceCheckboxes.forEach((box) => {
    box.addEventListener("change", syncServicesValidation);
  });

  form.addEventListener("submit", (event) => {
    if (hasServiceSelection()) return;
    event.preventDefault();
    syncServicesValidation();
    servicesFieldset?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function toYoutubeEmbedUrl(url) {
  const value = (url || "").trim();
  const idMatch = value.match(/(?:youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/);
  if (idMatch) {
    return `https://www.youtube.com/embed/${idMatch[1]}?rel=0`;
  }
  return value;
}

function initVideos() {
  videoLoadButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      const src = toYoutubeEmbedUrl(button.dataset.video || "");
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

    const getGlossaryScrollOffset = () => {
      const toolbar = glossary.querySelector(".glossary-toolbar");
      if (!toolbar) {
        return 240;
      }

      const toolbarTop = Number.parseFloat(getComputedStyle(toolbar).top) || 84;
      return Math.ceil(toolbarTop + toolbar.offsetHeight + 24);
    };

    const updateGlossaryScrollOffset = () => {
      const offset = getGlossaryScrollOffset();
      glossary.style.setProperty("--glossary-scroll-offset", `${offset}px`);
      return offset;
    };

    const scrollToGlossaryLetter = (target, behavior = "smooth") => {
      if (!target) {
        return;
      }

      const offset = updateGlossaryScrollOffset();
      const top = window.scrollY + target.getBoundingClientRect().top - offset;
      window.scrollTo({ top: Math.max(0, top), behavior });
    };

    updateGlossaryScrollOffset();
    window.addEventListener("resize", updateGlossaryScrollOffset, { passive: true });

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
      const scrollOffset = updateGlossaryScrollOffset();

      visibleGroups.forEach((group) => {
        const letterTarget = group.querySelector(".glossary-group__letter") || group;
        if (letterTarget.getBoundingClientRect().top <= scrollOffset + 8) {
          activeGroup = group;
        }
      });

      setActiveLetter(activeGroup.dataset.letter || "");
    };

    const applyFilter = () => {
      const term = normalizeGlossaryText(searchInput.value);
      let firstVisibleLetter = "";
      let visibleGroupCount = 0;

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
        if (visibleCount > 0) {
          visibleGroupCount += 1;
        }
        if (!firstVisibleLetter && visibleCount > 0) {
          firstVisibleLetter = group.dataset.letter || "";
        }
      });

      const emptyState = glossary.querySelector("[data-glossary-empty]");
      if (emptyState) {
        emptyState.hidden = visibleGroupCount > 0;
      }

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
        return;
      }

      event.preventDefault();
      const targetId = link.getAttribute("href")?.slice(1);
      const target = targetId ? document.getElementById(targetId) : null;

      if (target) {
        scrollToGlossaryLetter(target);
        if (navItem?.dataset.letter) {
          setActiveLetter(navItem.dataset.letter);
        }
      }
    });

    if (window.location.hash) {
      const hashTarget = document.getElementById(window.location.hash.slice(1));
      if (hashTarget && glossary.contains(hashTarget)) {
        requestAnimationFrame(() => {
          scrollToGlossaryLetter(hashTarget, "auto");
        });
      }
    }

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

    items.forEach((item) => {
      const panel = item.querySelector("[data-accordion-panel]");
      if (!panel || panel.querySelector(".accordion-item__panel-inner")) {
        return;
      }

      const inner = document.createElement("div");
      inner.className = "accordion-item__panel-inner";
      while (panel.firstChild) {
        inner.appendChild(panel.firstChild);
      }
      panel.appendChild(inner);
      panel.hidden = false;
    });

    const setOpenItem = (activeItem) => {
      items.forEach((item) => {
        const trigger = item.querySelector("[data-accordion-trigger]");
        const panel = item.querySelector("[data-accordion-panel]");
        const isOpen = item === activeItem;

        item.classList.toggle("is-open", isOpen);
        trigger?.setAttribute("aria-expanded", String(isOpen));

        if (panel) {
          panel.hidden = false;
          panel.setAttribute("aria-hidden", String(!isOpen));
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

function initScrollToTop() {
  if (document.querySelector(".scroll-to-top")) {
    return;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "scroll-to-top";
  button.setAttribute("aria-label", "Nach oben scrollen");
  button.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.2 5.7 11.5l1.4 1.4L12 8l5 5 1.4-1.4L12 5.2Z"/></svg>';

  document.body.appendChild(button);

  const threshold = 120;
  const scrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

  const syncVisibility = () => {
    const show = window.scrollY > threshold;
    button.classList.toggle("is-visible", show);
  };

  button.addEventListener("click", () => {
    const topTarget = document.getElementById("top");
    if (topTarget) {
      topTarget.scrollIntoView({ behavior: scrollBehavior, block: "start" });
      return;
    }

    window.scrollTo({ top: 0, behavior: scrollBehavior });
  });

  window.addEventListener("scroll", syncVisibility, { passive: true });
  syncVisibility();
}

const presenceMapStateLabels = {
  "Baden__x26__Württemberg": "Baden-Württemberg",
  "Bayern": "Bayern",
  "Berlin": "Berlin",
  "Brandenburg": "Brandenburg",
  "Bremen": "Bremen",
  "Hamburg": "Hamburg",
  "Hessen": "Hessen",
  "Mecklenburg-Vorpommern": "Mecklenburg-Vorpommern",
  "Niedersachsen": "Niedersachsen",
  "Nordrhein-Westfalen": "Nordrhein-Westfalen",
  "Rheinland-Pfalz": "Rheinland-Pfalz",
  "Saarland": "Saarland",
  "Sachsen": "Sachsen",
  "Sachsen-Anhalt": "Sachsen-Anhalt",
  "Schleswig-Holstein": "Schleswig-Holstein",
  "Thüringen": "Thüringen",
};

const presenceMapLocationStates = {
  "Baden__x26__Württemberg": {
    href: "/kontakt/#standort-baden-wuerttemberg",
    cardIds: ["standort-baden-wuerttemberg", "standort-bodensee-tuttlingen"],
    locations: [
      {
        name: "Firmensitz/ Niederlassung Baden-Württemberg",
        street: "Robert-Bosch-Str. 10",
        city: "76275 Ettlingen",
        phone: "07243 3699101",
        email: "anfrage@igienair.com",
        cardId: "standort-baden-wuerttemberg",
      },
      {
        name: "Niederlassung Bodensee",
        street: "Frank-Ziwey-Ring 18 Unit 102",
        city: "78333 Stockach",
        phone: "07771 63640009",
        email: "anfrage@igienair.com",
        cardId: "standort-bodensee-tuttlingen",
      },
    ],
  },
  "Bayern": {
    href: "/kontakt/#standort-nordbayern-oberasbach",
    cardIds: ["standort-nordbayern-oberasbach", "standort-suedbayern-eching"],
    locations: [
      {
        name: "Niederlassung Nordbayern",
        street: "Schloßgasse 5c",
        city: "90522 Oberasbach",
        phone: "0911 96649121",
        email: "anfrage@igienair.com",
        cardId: "standort-nordbayern-oberasbach",
      },
      {
        name: "Niederlassung Südbayern",
        street: "Erfurter Str. 4",
        city: "85386 Eching",
        phone: "089 95459149",
        email: "anfrage@igienair.com",
        cardId: "standort-suedbayern-eching",
      },
    ],
  },
  "Hessen": {
    href: "/kontakt/#standort-rhein-main-niedernhausen",
    cardIds: ["standort-rhein-main-niedernhausen"],
    locations: [
      {
        name: "Niederlassung Rhein-Main",
        street: "Feldbergstr. 14",
        city: "65527 Niedernhausen",
        phone: "06127 7084101",
        email: "anfrage@igienair.com",
        cardId: "standort-rhein-main-niedernhausen",
      },
    ],
  },
  "Berlin": {
    href: "/kontakt/#standort-berlin",
    cardIds: ["standort-berlin"],
    locations: [
      {
        name: "Niederlassung Berlin",
        street: "Paradiesstraße 210–218",
        city: "12526 Berlin",
        phone: "030 340 410120",
        email: "anfrage@igienair.com",
        cardId: "standort-berlin",
      },
    ],
  },
  "Nordrhein-Westfalen": {
    href: "/kontakt/#standort-nordrhein-westfalen",
    cardIds: ["standort-nordrhein-westfalen"],
    locations: [
      {
        name: "Niederlassung Nordrhein-Westfalen",
        street: "Am Beckers Busch 1",
        city: "42799 Leichlingen",
        phone: "02173 2653810",
        email: "anfrage@igienair.com",
        cardId: "standort-nordrhein-westfalen",
      },
    ],
  },
  "Niedersachsen": {
    href: "/kontakt/#standort-nord-winsen",
    cardIds: ["standort-nord-winsen"],
    locations: [
      {
        name: "Niederlassung Nord",
        street: "Opelstr. 10",
        city: "21423 Winsen (Luhe)",
        phone: "04171 5468650",
        email: "anfrage@igienair.com",
        cardId: "standort-nord-winsen",
      },
    ],
  },
};

const presenceMapEscape = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));

const presenceMapBuildCard = (stateLabel, location, options = {}) => {
  const tag = options.linkable && location.cardId ? "a" : "article";
  const attrs = options.linkable && location.cardId
    ? ` class="de-map-card__location de-map-card__location--link" href="#${location.cardId}"`
    : ' class="de-map-card__location"';

  return `
  <${tag}${attrs}>
    <header class="de-map-card__headline">
      <span class="de-map-card__state">${presenceMapEscape(stateLabel)}</span>
      <h4 class="de-map-card__title">${presenceMapEscape(location.name)}</h4>
    </header>
    <p class="de-map-card__address">
      ${presenceMapEscape(location.street)}<br>
      ${presenceMapEscape(location.city)}
    </p>
  </${tag}>
`;
};

function presenceMapGetStandorteTitles() {
  const titles = {};

  document.querySelectorAll(".locations-grid-card[id]").forEach((card) => {
    const title = card.querySelector("h3")?.textContent?.trim();
    if (title) {
      titles[card.id] = title;
    }
  });

  return titles;
}

function presenceMapWithStandorteTitle(entry, standorteTitles) {
  if (!standorteTitles || !entry.cardId) {
    return entry;
  }

  return {
    ...entry,
    name: standorteTitles[entry.cardId] || entry.name,
  };
}

function presenceMapClearStandorteHighlights(mapRoot) {
  mapRoot?.querySelectorAll(".de-map__land.is-selected").forEach((land) => {
    land.classList.remove("is-selected");
  });
  document.querySelectorAll(".locations-grid-card.is-map-highlight").forEach((card) => {
    card.classList.remove("is-map-highlight");
  });
}

function presenceMapFocusStandorteState(mapRoot, land, location) {
  const cardIds = location.cardIds || [];
  const cards = cardIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  presenceMapClearStandorteHighlights(mapRoot);
  land.classList.add("is-selected");

  cards.forEach((card) => {
    card.classList.add("is-map-highlight");
  });

  const scrollTarget = cards[0] || document.getElementById("locations");
  scrollTarget?.scrollIntoView({ behavior: "smooth", block: "center" });

  if (cards[0]?.id) {
    history.replaceState(null, "", `#${cards[0].id}`);
  }
}

function presenceMapInitStandorteFromHash(mapRoot) {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return;
  }

  const card = document.getElementById(hash);
  const stateId = card?.dataset.locationState;
  if (!stateId) {
    return;
  }

  const land = mapRoot.querySelector(`.de-map__land#${CSS.escape(stateId)}`);
  const location = presenceMapLocationStates[stateId];
  if (!land || !location) {
    return;
  }

  window.requestAnimationFrame(() => {
    presenceMapFocusStandorteState(mapRoot, land, location);
  });
}

function initPresenceMap() {
  const mapRoot = document.querySelector("[data-presence-map]");
  const stage = mapRoot?.querySelector(".de-map__stage");
  const tooltip = mapRoot?.querySelector("[data-presence-map-tooltip]");

  if (!mapRoot || !stage || !tooltip) {
    return;
  }

  const lands = mapRoot.querySelectorAll(".de-map__land");
  if (!lands.length) {
    return;
  }

  const showTooltip = (content, x, y) => {
    tooltip.innerHTML = content;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.classList.add("is-visible");
  };

  const hideTooltip = () => {
    tooltip.classList.remove("is-visible");
  };

  const stageRect = () => stage.getBoundingClientRect();

  const getLandCenter = (land) => {
    const rect = land.getBoundingClientRect();
    const sr = stageRect();
    return {
      x: rect.left - sr.left + rect.width / 2,
      y: rect.top - sr.top + rect.height / 2,
    };
  };

  const positionFromEvent = (event, fallback) => {
    const sr = stageRect();
    if (event && typeof event.clientX === "number") {
      return {
        x: event.clientX - sr.left,
        y: event.clientY - sr.top,
      };
    }
    return fallback;
  };

  const isStandorteMode = mapRoot.dataset.presenceMapMode === "standorte";
  const standorteTitles = isStandorteMode ? presenceMapGetStandorteTitles() : null;

  lands.forEach((land) => {
    const location = presenceMapLocationStates[land.id];

    if (!location) {
      land.removeAttribute("tabindex");
      land.classList.remove("is-location");
      return;
    }

    const stateLabel = land.dataset.label
      || land.getAttribute("aria-label")
      || (presenceMapStateLabels[land.id] ?? land.id);

    const cards = (location.locations || [])
      .map((entry) => presenceMapBuildCard(
        stateLabel,
        presenceMapWithStandorteTitle(entry, standorteTitles),
        { linkable: isStandorteMode },
      ))
      .join("");

    const tooltipContent = `<div class="de-map-card__list">${cards}</div>`;

    land.classList.add("is-location");
    land.setAttribute("tabindex", "0");
    land.setAttribute("role", "link");
    land.setAttribute(
      "aria-label",
      isStandorteMode
        ? `${stateLabel}: Standorte anzeigen`
        : `${stateLabel}: Standort öffnen`,
    );

    const navigate = () => {
      if (isStandorteMode) {
        presenceMapFocusStandorteState(mapRoot, land, location);
        return;
      }

      window.location.href = resolveSitePath(location.href);
    };

    land.addEventListener("mouseenter", (event) => {
      land.classList.add("is-highlighted");
      const pos = positionFromEvent(event, getLandCenter(land));
      showTooltip(tooltipContent, pos.x, pos.y);
    });

    land.addEventListener("mousemove", (event) => {
      const pos = positionFromEvent(event, getLandCenter(land));
      tooltip.style.left = `${pos.x}px`;
      tooltip.style.top = `${pos.y}px`;
    });

    land.addEventListener("mouseleave", () => {
      land.classList.remove("is-highlighted");
      hideTooltip();
    });

    land.addEventListener("focus", () => {
      land.classList.add("is-highlighted");
      const center = getLandCenter(land);
      showTooltip(tooltipContent, center.x, center.y);
    });

    land.addEventListener("blur", () => {
      land.classList.remove("is-highlighted");
      hideTooltip();
    });

    land.addEventListener("click", () => {
      navigate();
    });

    land.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigate();
      }
    });
  });

  if (isStandorteMode) {
    tooltip.addEventListener("click", (event) => {
      const link = event.target.closest("a.de-map-card__location--link");
      if (!link) {
        return;
      }

      event.preventDefault();
      const cardId = link.getAttribute("href")?.replace(/^#/, "");
      const card = cardId ? document.getElementById(cardId) : null;
      const stateId = card?.dataset.locationState;
      const land = stateId
        ? mapRoot.querySelector(`.de-map__land#${CSS.escape(stateId)}`)
        : null;
      const location = stateId ? presenceMapLocationStates[stateId] : null;

      if (card && land && location) {
        presenceMapFocusStandorteState(mapRoot, land, location);
        card.classList.add("is-map-highlight");
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        history.replaceState(null, "", `#${cardId}`);
      }
    });

    presenceMapInitStandorteFromHash(mapRoot);
  }

  mapRoot.classList.add("is-loaded");
}

function initSectorsColumnBalance() {
  const desktopQuery = window.matchMedia("(min-width: 981px)");

  document.querySelectorAll(".sectors__columns").forEach((columns) => {
    const copyText = columns.querySelector(".sectors__copy p");
    const sectorGrid = columns.querySelector(".sector-grid");

    if (!copyText || !sectorGrid) {
      return;
    }

    const balance = () => {
      if (!desktopQuery.matches) {
        copyText.style.removeProperty("line-height");
        return;
      }

      const targetHeight = sectorGrid.getBoundingClientRect().height;
      if (!targetHeight) {
        return;
      }

      let low = 1.6;
      let high = 5.5;

      for (let step = 0; step < 24; step += 1) {
        const mid = (low + high) / 2;
        copyText.style.lineHeight = String(mid);

        if (copyText.getBoundingClientRect().height < targetHeight - 0.5) {
          low = mid;
        } else {
          high = mid;
        }
      }

      copyText.style.lineHeight = String((low + high) / 2);
    };

    balance();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => balance());
      observer.observe(sectorGrid);
      observer.observe(columns);
    }

    window.addEventListener("resize", balance, { passive: true });
    desktopQuery.addEventListener("change", balance);

    if (document.fonts?.ready) {
      document.fonts.ready.then(balance);
    }

    sectorGrid.querySelectorAll("img").forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", balance, { once: true });
      }
    });
  });
}

function initSectorAnimations() {
  document.querySelectorAll(".sectors").forEach((sectorsSection) => {
    const cards = sectorsSection.querySelectorAll(".sector-card");

    if (!cards.length) {
      return;
    }

    cards.forEach((card, index) => {
      card.style.setProperty("--sector-delay", `${index * 75}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-inview");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });

    observer.observe(sectorsSection);
  });
}

function initServicesSlider() {
  document.querySelectorAll(".services-slider").forEach((slider) => {

  const viewport = slider.querySelector("[data-slider-viewport]");
  const track = slider.querySelector("[data-slider-track]");
  const slides = Array.from(slider.querySelectorAll("[data-service-slide]"));
  const prevBtn = slider.querySelector("[data-slider-prev]");
  const nextBtn = slider.querySelector("[data-slider-next]");
  const dots = Array.from(slider.querySelectorAll("[data-slide-to]"));
  const currentEl = slider.querySelector("[data-slide-current]");
  const totalEl = slider.querySelector("[data-slide-total]");

  if (!viewport || !track || !slides.length) {
    return;
  }

  const total = slides.length;
  let index = 0;
  let autoplayTimer = null;
  const autoplayDelay = 7000;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (totalEl) {
    totalEl.textContent = String(total).padStart(2, "0");
  }

  function render() {
    const slideWidth = slides[0]?.getBoundingClientRect().width || viewport.clientWidth;
    track.style.transform = `translate3d(${-slideWidth * index}px, 0, 0)`;
    slides.forEach((slide, i) => {
      const isActive = i === index;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    if (currentEl) {
      currentEl.textContent = String(index + 1).padStart(2, "0");
    }
  }

  function goTo(next) {
    index = (next + total) % total;
    render();
  }

  function nextSlide() {
    goTo(index + 1);
  }

  function prevSlide() {
    goTo(index - 1);
  }

  function startAutoplay() {
    if (reduceMotion) {
      return;
    }
    stopAutoplay();
    autoplayTimer = window.setInterval(nextSlide, autoplayDelay);
  }

  function stopAutoplay() {
    if (autoplayTimer !== null) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  prevBtn?.addEventListener("click", () => {
    prevSlide();
    startAutoplay();
  });

  nextBtn?.addEventListener("click", () => {
    nextSlide();
    startAutoplay();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const target = Number(dot.dataset.slideTo || "0");
      goTo(target);
      startAutoplay();
    });
  });

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prevSlide();
      startAutoplay();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      nextSlide();
      startAutoplay();
    }
  });

  slider.addEventListener("mouseenter", stopAutoplay);
  slider.addEventListener("mouseleave", startAutoplay);
  slider.addEventListener("focusin", stopAutoplay);
  slider.addEventListener("focusout", (event) => {
    if (!slider.contains(event.relatedTarget)) {
      startAutoplay();
    }
  });

  let touchStartX = 0;
  let touchEndX = 0;
  const swipeThreshold = 40;

  viewport.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });

  viewport.addEventListener("touchend", (event) => {
    touchEndX = event.changedTouches[0].screenX;
    const delta = touchEndX - touchStartX;
    if (Math.abs(delta) < swipeThreshold) {
      return;
    }
    if (delta < 0) {
      nextSlide();
    } else {
      prevSlide();
    }
    startAutoplay();
  }, { passive: true });

  const visibilityObserver = ("IntersectionObserver" in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      }, { threshold: 0.25 })
    : null;

  if (visibilityObserver) {
    visibilityObserver.observe(slider);
  } else {
    startAutoplay();
  }

  window.addEventListener("resize", render, { passive: true });

  render();
  });
}

function initImageCompare() {
  document.querySelectorAll("[data-img-compare]").forEach((root) => {
    const range = root.querySelector(".img-compare__range");
    if (!range) {
      return;
    }

    const setPosition = (value) => {
      root.style.setProperty("--compare", `${value}%`);
      range.setAttribute("aria-valuenow", String(value));
    };

    const update = () => setPosition(Number(range.value));
    range.addEventListener("input", update);
    update();
  });
}

function initCleaningMediaHeights() {
  const rows = document.querySelectorAll(".cleaning-intro__columns, .cleaning-detail__row");
  if (!rows.length) {
    return;
  }

  const desktopQuery = window.matchMedia("(min-width: 1181px)");

  const sync = () => {
    rows.forEach((row) => {
      const text = row.querySelector(".cleaning-intro__body, .cleaning-detail__copy");
      const media = row.querySelector(".cleaning-intro__media, .cleaning-detail__media");
      if (!text || !media) {
        return;
      }

      if (!desktopQuery.matches) {
        media.style.removeProperty("height");
        return;
      }

      media.style.height = `${text.offsetHeight}px`;
    });
  };

  const resizeObserver = new ResizeObserver(sync);
  rows.forEach((row) => {
    const text = row.querySelector(".cleaning-intro__body, .cleaning-detail__copy");
    if (text) {
      resizeObserver.observe(text);
    }
  });

  window.addEventListener("resize", sync);
  desktopQuery.addEventListener("change", sync);

  if (document.fonts?.ready) {
    document.fonts.ready.then(sync);
  }

  sync();
}

function initHygieneAirNavHeight() {
  const row = document.querySelector(".hygiene-air .filtertest-standard__row--nav");
  if (!row) {
    return;
  }

  const copy = row.querySelector(".filtertest-standard__copy");
  const anchors = row.querySelector(".hygiene-air__anchors");
  if (!copy || !anchors) {
    return;
  }

  const desktopQuery = window.matchMedia("(min-width: 981px)");

  const sync = () => {
    if (!desktopQuery.matches) {
      anchors.style.removeProperty("height");
      return;
    }

    anchors.style.height = `${copy.offsetHeight}px`;
  };

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(sync);
    observer.observe(copy);
  }

  window.addEventListener("resize", sync, { passive: true });
  desktopQuery.addEventListener("change", sync);

  if (document.fonts?.ready) {
    document.fonts.ready.then(sync);
  }

  sync();
}

function initJobGallerySlider() {
  document.querySelectorAll("[data-job-gallery]").forEach((slider) => {
    const viewport = slider.querySelector("[data-gallery-viewport]");
    const track = slider.querySelector("[data-gallery-track]");
    const slides = Array.from(slider.querySelectorAll("[data-gallery-slide]"));
    const prevBtn = slider.querySelector("[data-gallery-prev]");
    const nextBtn = slider.querySelector("[data-gallery-next]");
    const dots = Array.from(slider.querySelectorAll("[data-gallery-to]"));
    const currentEl = slider.querySelector("[data-gallery-current]");
    const totalEl = slider.querySelector("[data-gallery-total]");

    if (!viewport || !track || slides.length === 0) {
      return;
    }

    const total = slides.length;
    let index = 0;
    let autoplayTimer = null;
    const autoplayDelay = 6000;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (totalEl) {
      totalEl.textContent = String(total).padStart(2, "0");
    }

    function render() {
      const slideWidth = slides[0]?.getBoundingClientRect().width || viewport.clientWidth;
      track.style.transform = `translate3d(${-slideWidth * index}px, 0, 0)`;
      slides.forEach((slide, i) => {
        const isActive = i === index;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
      if (currentEl) {
        currentEl.textContent = String(index + 1).padStart(2, "0");
      }
    }

    function goTo(next) {
      index = (next + total) % total;
      render();
    }

    function nextSlide() {
      goTo(index + 1);
    }

    function prevSlide() {
      goTo(index - 1);
    }

    function startAutoplay() {
      if (reduceMotion) {
        return;
      }
      stopAutoplay();
      autoplayTimer = window.setInterval(nextSlide, autoplayDelay);
    }

    function stopAutoplay() {
      if (autoplayTimer !== null) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    prevBtn?.addEventListener("click", () => {
      prevSlide();
      startAutoplay();
    });

    nextBtn?.addEventListener("click", () => {
      nextSlide();
      startAutoplay();
    });

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        goTo(Number(dot.dataset.galleryTo || "0"));
        startAutoplay();
      });
    });

    viewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prevSlide();
        startAutoplay();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nextSlide();
        startAutoplay();
      }
    });

    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);
    slider.addEventListener("focusin", stopAutoplay);
    slider.addEventListener("focusout", (event) => {
      if (!slider.contains(event.relatedTarget)) {
        startAutoplay();
      }
    });

    let touchStartX = 0;
    const swipeThreshold = 40;

    viewport.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener("touchend", (event) => {
      const delta = event.changedTouches[0].screenX - touchStartX;
      if (Math.abs(delta) < swipeThreshold) {
        return;
      }
      if (delta < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      startAutoplay();
    }, { passive: true });

    window.addEventListener("resize", render, { passive: true });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      }, { threshold: 0.25 });
      observer.observe(slider);
    } else {
      startAutoplay();
    }

    render();
  });
}

function initServicesAccordion() {
  const accordion = document.querySelector("[data-services-accordion]");
  if (!accordion) {
    return;
  }

  const items = Array.from(accordion.querySelectorAll("[data-services-accordion-item]"));
  if (items.length === 0) {
    return;
  }

  const prefersHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const mobileQuery = window.matchMedia("(max-width: 767px)");

  const setActiveItem = (activeItem) => {
    items.forEach((item) => {
      item.classList.toggle("is-active", item === activeItem);
    });
  };

  setActiveItem(items.find((item) => item.classList.contains("is-active")) || items[0]);

  if (mobileQuery.matches || !prefersHover) {
    items.forEach((item) => {
      item.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
          return;
        }
        setActiveItem(item);
      });
    });
    return;
  }

  items.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      setActiveItem(item);
    });
  });

  accordion.addEventListener("mouseleave", () => {
    setActiveItem(items[0]);
  });
}

window.addEventListener("scroll", syncHeaderState, { passive: true });
addressSelect?.addEventListener("change", syncAddressFields);
initOfferForm();

initMenu();
initAnchors();
initInertControls();
initKeyboard();
initScrollToTop();
initVideos();
initCertificateGalleries();
initLocationBrowsers();
initGlossaries();
initAccordions();
observeMeters();
initSectorAnimations();
initSectorsColumnBalance();
initServicesSlider();
initJobGallerySlider();
initImageCompare();
initCleaningMediaHeights();
initHygieneAirNavHeight();
initServicesAccordion();
initPresenceMap();
syncAddressFields();
syncHeaderState();
