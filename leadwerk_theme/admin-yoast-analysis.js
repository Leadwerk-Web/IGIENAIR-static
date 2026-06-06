(function () {
  "use strict";
  var data = window.leadwerkYoastAnalysis || {};
  var registered = false;

  function register() {
    var app = window.YoastSEO && window.YoastSEO.app;
    if (registered || !data.renderedContent || !app || typeof app.registerPlugin !== "function") {
      return false;
    }
    app.registerPlugin("leadwerkRenderedContent", { status: "ready" });
    app.registerModification("content", function (content) {
      return (content ? content + " " : "") + data.renderedContent;
    }, "leadwerkRenderedContent", 5);
    registered = true;
    return true;
  }

  window.addEventListener("YoastSEO:ready", register);
  var attempts = 0;
  var timer = window.setInterval(function () {
    attempts += 1;
    if (register() || attempts >= 80) {
      window.clearInterval(timer);
    }
  }, 250);
}());
