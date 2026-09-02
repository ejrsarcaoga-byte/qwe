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

        const blob = new Blob([file.data], {
            type: file.type || "application/octet-stream"
        });

        const url = URL.createObjectURL(blob);

        const modal = document.getElementById("viewModal");
        const container = document.getElementById("previewContainer");
        const title = document.getElementById("modalTitle");

        // FIXED
        title.textContent = file.name;
        container.innerHTML = "";

        // IMAGE PREVIEW
        if (file.type && file.type.startsWith("image/")) {

            const image = document.createElement("img");

            image.src = url;
            image.alt = file.name;

            image.style.maxWidth = "100%";
            image.style.maxHeight = "70vh";
            image.style.display = "block";
            image.style.margin = "auto";

            container.appendChild(image);

        }

        // PDF PREVIEW
        else if (
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf")
        ) {

            const iframe = document.createElement("iframe");

            iframe.src = url;
            iframe.title = file.name;

            laboratory"Lab-Act2.pdf"

            iframe.style.width = "100%";
            iframe.style.height = "75vh";
            iframe.style.border = "none";
            iframe.style.display = "block";

            container.appendChild(iframe);

        }

        // TEXT PREVIEW
        else if (file.type && file.type.startsWith("text/")) {

            const reader = new FileReader();

            reader.onload = function (event) {

                const pre = document.createElement("pre");

                pre.className = "text-preview";
                pre.textContent = event.target.result;

                container.appendChild(pre);
            };

            reader.readAsText(file.data);

        }

        // OTHER FILE TYPES
        else {

            container.innerHTML = `
                <div class="unsupported-preview">

                    <h3>Preview is not available</h3>

                    <p>
                        This file type cannot be previewed directly
                        in the browser.
                    </p>

                    <p>
                        File:
                        <strong>${escapeHTML(file.name)}</strong>
                    </p>

                    <a
                        href="${url}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="open-file-button"
                    >
                        OPEN FILE
                    </a>

                </div>
            `;
        }

        modal.dataset.currentUrl = url;
        modal.style.display = "block";
    };

    request.onerror = function () {
        alert("Unable to open the file.");
    };
}


function closeModal() {

    const modal = document.getElementById("viewModal");

    const url = modal.dataset.currentUrl;

    if (url) {
        URL.revokeObjectURL(url);
        modal.dataset.currentUrl = "";
    }

    document.getElementById("previewContainer").innerHTML = "";

    modal.style.display = "none";
}


window.addEventListener("click", function (event) {

    const modal = document.getElementById("viewModal");

    if (event.target === modal) {
        closeModal();
    }

});


document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        closeModal();
    }

});


function deleteFile(id, fileName, category) {

    const confirmed = confirm(
        "Are you sure you want to delete:\n\n" +
        fileName +
        "?"
    );

    if (!confirmed) {
        return;
    }

    const transaction =
        db.transaction([STORE_NAME], "readwrite");

    const store =
        transaction.objectStore(STORE_NAME);

    store.delete(id);

    transaction.oncomplete = function () {

        loadCategoryFiles(category);

    };

    transaction.onerror = function () {

        alert("Unable to delete the file.");

    };
}


function restoreDefaultFiles() {

    const confirmed = confirm(
        "Restore Quiz 1.png and Sarcaoga_lab1.pdf?"
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(
        permanentFiles.quiz.storageKey
    );

    localStorage.removeItem(
        permanentFiles.laboratory.storageKey
    );

    loadAllFiles();
}


function getFileIcon(type, name) {

    const extension =
        name.split(".").pop().toLowerCase();

    if (type && type.startsWith("image/")) {
        return "IMG";
    }

    if (
        type === "application/pdf" ||
        extension === "pdf"
    ) {
        return "PDF";
    }

    if (
        extension === "doc" ||
        extension === "docx"
    ) {
        return "DOC";
    }

    if (
        extension === "xls" ||
        extension === "xlsx"
    ) {
        return "XLS";
    }

    if (
        extension === "ppt" ||
        extension === "pptx"
    ) {
        return "PPT";
    }

    if (
        extension === "zip" ||
        extension === "rar" ||
        extension === "7z"
    ) {
        return "ZIP";
    }

    if (
        extension === "txt" ||
        extension === "csv"
    ) {
        return "TXT";
    }

    return "FILE";
}


function formatFileSize(bytes) {

    if (bytes === 0) {
        return "0 Bytes";
    }

    const sizes = [
        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"
    ];

    const i = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    return parseFloat(
        (
            bytes / Math.pow(1024, i)
        ).toFixed(2)
    ) + " " + sizes[i];
}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


function escapeJS(text) {

    return String(text)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
}
