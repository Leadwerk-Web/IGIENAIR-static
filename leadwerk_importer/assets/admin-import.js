(function () {
  "use strict";
  const config = window.leadwerkImporter || {};
  const output = document.querySelector("[data-leadwerk-output]");
  const progress = document.querySelector(".leadwerk-progress span");
  const statusText = document.querySelector("[data-leadwerk-status]");
  const controls = document.querySelectorAll("[data-leadwerk-start], [data-leadwerk-resume]");
  let running = false;
  let mode = "dry";
  let retryCount = 0;

  function render(state) {
    if (output) output.textContent = JSON.stringify(state || {}, null, 2);
    const total = Number(state.total || 0);
    const processed = Number(state.processed || 0);
    if (progress) progress.style.width = total ? `${(processed / total) * 100}%` : "0%";
    if (statusText) {
      const current = state.current_file ? ` – ${state.current_file}` : "";
      statusText.textContent = `${state.status || "idle"}: ${processed}/${total}${current}`;
    }
  }

  function setRunning(value) {
    running = value;
    controls.forEach((control) => {
      control.disabled = value;
    });
  }

  function extractJson(text) {
    const cleaned = String(text || "").replace(/^\uFEFF/, "").trim();
    if (!cleaned) throw new Error("Sunucu boş yanıt verdi.");
    try {
      return JSON.parse(cleaned);
    } catch (firstError) {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return JSON.parse(cleaned.slice(start, end + 1));
      }
      throw firstError;
    }
  }

  function errorState(error, response, responseText) {
    return {
      status: "request_failed",
      error: error && error.message ? error.message : String(error || "Bilinmeyen hata"),
      endpoint: config.ajaxUrl || window.ajaxurl || "",
      http_status: response ? response.status : 0,
      http_status_text: response ? response.statusText : "",
      response_preview: String(responseText || "").slice(0, 1500),
      retry_count: retryCount,
      hint: "PHP error log, güvenlik eklentisi, admin-ajax engeli ve sunucu timeout ayarlarını kontrol edin.",
    };
  }

  async function step(start, resume) {
    if (running && start) return;
    setRunning(true);
    const endpoint = String(window.ajaxurl || config.ajaxUrl || "");
    const body = new FormData();
    body.append("action", "leadwerk_igienair_import");
    body.append("nonce", String(config.nonce || ""));
    body.append("mode", mode);
    body.append("start", start ? "1" : "0");
    body.append("resume", resume ? "1" : "0");
    let response = null;
    let responseText = "";
    try {
      if (!endpoint) throw new Error("WordPress AJAX adresi bulunamadı.");
      response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body,
      });
      responseText = await response.text();
      const payload = extractJson(responseText);
      if (!response.ok || !payload.success) {
        const data = payload && payload.data ? payload.data : {};
        throw new Error(data.message || `Import isteği başarısız: HTTP ${response.status}`);
      }
      retryCount = 0;
      render(payload.data);
      if (payload.data.status === "running") {
        setRunning(false);
        window.setTimeout(() => step(false, false), 150);
        return;
      }
    } catch (error) {
      retryCount += 1;
      const state = errorState(error, response, responseText);
      render(state);
      if (!start && retryCount <= 2) {
        setRunning(false);
        window.setTimeout(() => step(false, false), 1200 * retryCount);
        return;
      }
    }
    setRunning(false);
  }

  document.querySelectorAll("[data-leadwerk-start]").forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.leadwerkStart;
      retryCount = 0;
      step(true, false);
    });
  });
  const resumeButton = document.querySelector("[data-leadwerk-resume]");
  if (resumeButton) {
    resumeButton.addEventListener("click", () => {
      mode = config.state && config.state.dry_run === false ? "apply" : "dry";
      retryCount = 0;
      step(false, true);
    });
  }
  render(config.state || {});
})();
