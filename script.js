function viewFile(id) {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = function () {
        const file = request.result;

        if (!file) {
            alert("File not found.");
            return;
        }

        const fileName = String(file.name || "Unnamed file");
        const fileType = String(file.type || "").toLowerCase();

        const blob = new Blob([file.data], {
            type: fileType || "application/octet-stream"
        });

        const url = URL.createObjectURL(blob);

        const modal = document.getElementById("viewModal");
        const container = document.getElementById("previewContainer");
        const title = document.getElementById("modalTitle");

        title.textContent = fileName;
        container.innerHTML = "";

        const lowerFileName = fileName.toLowerCase();
        const isPdf =
            fileType === "application/pdf" ||
            lowerFileName.endsWith(".pdf");

        // IMAGE PREVIEW
        if (fileType.startsWith("image/")) {
            const image = document.createElement("img");

            image.src = url;
            image.alt = fileName;
            image.style.maxWidth = "100%";
            image.style.maxHeight = "70vh";
            image.style.display = "block";
            image.style.margin = "auto";

            container.appendChild(image);
        }

        // PDF PREVIEW
        else if (isPdf) {
            const iframe = document.createElement("iframe");

            iframe.src = url;
            iframe.title = fileName;
            iframe.style.width = "100%";
            iframe.style.height = "75vh";
            iframe.style.border = "none";
            iframe.style.display = "block";

            container.appendChild(iframe);
        }

        // TEXT PREVIEW
        else if (
            fileType.startsWith("text/") ||
            lowerFileName.endsWith(".txt") ||
            lowerFileName.endsWith(".csv")
        ) {
            const reader = new FileReader();

            reader.onload = function (event) {
                const pre = document.createElement("pre");

                pre.className = "text-preview";
                pre.textContent = event.target.result;

                container.appendChild(pre);
            };

            reader.onerror = function () {
                container.textContent = "Unable to read this text file.";
            };

            reader.readAsText(file.data);
        }

        // OTHER FILE TYPES
        else {
            const previewMessage = document.createElement("div");
            previewMessage.className = "unsupported-preview";

            previewMessage.innerHTML = `
                <h3>Preview is not available</h3>
                <p>
                    This file type cannot be previewed directly
                    in the browser.
                </p>
                <p>File: <strong></strong></p>
            `;

            previewMessage.querySelector("strong").textContent = fileName;

            const openLink = document.createElement("a");
            openLink.href = url;
            openLink.target = "_blank";
            openLink.rel = "noopener noreferrer";
            openLink.className = "open-file-button";
            openLink.textContent = "OPEN FILE";

            previewMessage.appendChild(openLink);
            container.appendChild(previewMessage);
        }

        modal.dataset.currentUrl = url;
        modal.style.display = "block";
    };

    request.onerror = function () {
        alert("Unable to open the file.");
    };
}
