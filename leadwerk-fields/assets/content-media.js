(function () {
	"use strict";

	function clearNode(node) {
		while (node.firstChild) node.removeChild(node.firstChild);
	}

	function mediaType(attachment) {
		var mime = attachment.mime || "";
		var subtype = attachment.subtype || "";
		if (attachment.type === "image" || mime.indexOf("image/") === 0) return "image";
		if (attachment.type === "video" || mime.indexOf("video/") === 0) return "video";
		if (subtype === "pdf" || mime === "application/pdf") return "pdf";
		return "file";
	}

	function updatePreview(wrapper, attachment) {
		var preview = wrapper.querySelector("[data-leadwerk-content-media-preview]");
		var meta = wrapper.querySelector("[data-leadwerk-content-media-meta]");
		var remove = wrapper.querySelector("[data-leadwerk-content-media-remove]");
		var type = mediaType(attachment);
		var filename = attachment.filename || attachment.title || "Medium";
		var url = attachment.url || "";
		var element;

		clearNode(preview);
		clearNode(meta);

		if (type === "image") {
			element = document.createElement("img");
			element.src = attachment.sizes && attachment.sizes.medium ? attachment.sizes.medium.url :
				(attachment.sizes && attachment.sizes.thumbnail ? attachment.sizes.thumbnail.url : url);
			element.alt = "";
			preview.appendChild(element);
		} else if (type === "video") {
			element = document.createElement("video");
			element.src = url;
			element.controls = true;
			element.preload = "metadata";
			preview.appendChild(element);
		} else {
			element = document.createElement("a");
			element.className = "leadwerk-content-media__file";
			element.href = url;
			element.target = "_blank";
			element.rel = "noopener noreferrer";
			var icon = document.createElement("span");
			icon.className = "dashicons " + (type === "pdf" ? "dashicons-pdf" : "dashicons-media-document");
			icon.setAttribute("aria-hidden", "true");
			var fileLabel = document.createElement("span");
			fileLabel.textContent = filename;
			element.appendChild(icon);
			element.appendChild(fileLabel);
			preview.appendChild(element);
		}

		var strong = document.createElement("strong");
		strong.textContent = filename;
		var id = document.createElement("span");
		id.textContent = "Attachment-ID: " + (attachment.id || "");
		meta.appendChild(strong);
		meta.appendChild(id);
		remove.hidden = false;
	}

	function clearPreview(wrapper) {
		var preview = wrapper.querySelector("[data-leadwerk-content-media-preview]");
		var meta = wrapper.querySelector("[data-leadwerk-content-media-meta]");
		var input = wrapper.querySelector("[data-leadwerk-content-media-id]");
		var remove = wrapper.querySelector("[data-leadwerk-content-media-remove]");
		clearNode(preview);
		clearNode(meta);
		var icon = document.createElement("span");
		icon.className = "leadwerk-content-media__empty dashicons dashicons-format-image";
		icon.setAttribute("aria-hidden", "true");
		preview.appendChild(icon);
		var empty = document.createElement("strong");
		empty.textContent = "Kein Medium ausgewählt";
		meta.appendChild(empty);
		input.value = "";
		remove.hidden = true;
	}

	document.addEventListener("click", function (event) {
		var openAll = event.target.closest("[data-leadwerk-sections-open]");
		var closeAll = event.target.closest("[data-leadwerk-sections-close]");
		if (openAll || closeAll) {
			document.querySelectorAll("[data-leadwerk-section-card]").forEach(function (section) {
				section.open = Boolean(openAll);
			});
			return;
		}

		var button = event.target.closest("[data-leadwerk-content-media-select]");
		var remove = event.target.closest("[data-leadwerk-content-media-remove]");
		if (remove) {
			clearPreview(remove.closest("[data-leadwerk-content-media]"));
			return;
		}
		if (!button || !window.wp || !wp.media) return;
		var wrapper = button.closest("[data-leadwerk-content-media]");
		var input = wrapper.querySelector("[data-leadwerk-content-media-id]");
		var frame = wp.media({ title: "Medium auswählen", multiple: false });
		frame.on("select", function () {
			var attachment = frame.state().get("selection").first().toJSON();
			input.value = attachment.id || "";
			updatePreview(wrapper, attachment);
		});
		frame.open();
	});

	document.addEventListener("input", function (event) {
		if (!event.target.matches("[data-leadwerk-section-search]")) return;
		var query = event.target.value.trim().toLocaleLowerCase();
		var visible = 0;
		document.querySelectorAll("[data-leadwerk-section-card]").forEach(function (section) {
			var match = !query || section.textContent.toLocaleLowerCase().indexOf(query) !== -1;
			section.hidden = !match;
			if (match) {
				visible++;
				if (query) section.open = true;
			}
		});
		var empty = document.querySelector("[data-leadwerk-sections-empty]");
		if (empty) empty.hidden = visible !== 0;
	});
}());
