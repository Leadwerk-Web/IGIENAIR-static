(function () {
	"use strict";

	document.querySelectorAll(".leadwerk-option-image").forEach(function (field) {
		var input = field.querySelector("[data-leadwerk-image-id]");
		var preview = field.querySelector("[data-leadwerk-image-preview]");
		var select = field.querySelector("[data-leadwerk-image-select]");
		var remove = field.querySelector("[data-leadwerk-image-remove]");

		select.addEventListener("click", function () {
			if (!window.wp || !wp.media) return;
			var frame = wp.media({ title: "Bild auswählen", library: { type: "image" }, multiple: false });
			frame.on("select", function () {
				var attachment = frame.state().get("selection").first().toJSON();
				if (input.id === "site_icon") {
					var raster = ["image/png", "image/jpeg", "image/webp"].indexOf(attachment.mime) !== -1;
					if (!raster || Number(attachment.width) < 512 || Number(attachment.height) < 512) {
						window.alert("Das Website Icon muss ein PNG, JPG oder WebP mit mindestens 512 × 512 Pixeln sein.");
						return;
					}
				}
				input.value = attachment.id || "";
				preview.src = attachment.url || "";
				preview.style.display = attachment.url ? "block" : "none";
			});
			frame.open();
		});

		remove.addEventListener("click", function () {
			input.value = "";
			preview.removeAttribute("src");
			preview.style.display = "none";
		});
	});
}());
