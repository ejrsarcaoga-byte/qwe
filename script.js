const DB_NAME = "EllainePortfolioDB";
const DB_VERSION = 1;
const STORE_NAME = "files";
let db = null;

const permanentFiles = {
    quiz: {
        name: "Quiz 1.png",
        type: "image/png",
        path: "Quiz 1.png",
        storageKey: "quiz1_deleted"
    },
    laboratory: {
        name: "Sarcaoga_lab1.pdf",
        type: "application/pdf",
        path: "Sarcaoga_lab1.pdf",
        storageKey: "lab1_deleted"
    },
    laboratory: {
        name: "Lab-Act2.pdf",
        type: "application/pdf",
        path: "Lab-Act2.pdf",
        storageKey: "lab2_deleted"

};

const databaseRequest = indexedDB.open(DB_NAME, DB_VERSION);

databaseRequest.onupgradeneeded = function (event) {
    db = event.target.result;

    if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true
        });

        store.createIndex("category", "category", {
            unique: false
        });
    }
};

databaseRequest.onsuccess = function (event) {
    db = event.target.result;
    loadAllFiles();
};

databaseRequest.onerror = function () {
    alert("Unable to open file storage.");
};

const quizInput = document.getElementById("quizInput");
const laboratoryInput = document.getElementById("laboratoryInput");
const examInput = document.getElementById("examInput");

quizInput.addEventListener("change", function () {
    uploadFiles(quizInput.files, "quiz");
    quizInput.value = "";
});

laboratoryInput.addEventListener("change", function () {
    uploadFiles(laboratoryInput.files, "laboratory");
    laboratoryInput.value = "";
});

examInput.addEventListener("change", function () {
    uploadFiles(examInput.files, "exam");
    examInput.value = "";
});

function uploadFiles(files, category) {
    if (!files || files.length === 0) {
        return;
    }

    Array.from(files).forEach(function (file) {
        const fileData = {
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            category: category,
            date: new Date().toISOString(),
            data: file
        };

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        store.add(fileData);

        transaction.oncomplete = function () {
            loadCategoryFiles(category);
        };

        transaction.onerror = function () {
            alert("Unable to save:\n" + file.name);
        };
    });
}

function loadAllFiles() {
    loadCategoryFiles("quiz");
    loadCategoryFiles("laboratory");
    loadCategoryFiles("exam");
}

function loadCategoryFiles(category) {
    if (!db) {
        return;
    }

    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("category");
    const request = index.getAll(category);

    request.onsuccess = function () {
        let files = request.result || [];

        if (
            category === "quiz" &&
            !localStorage.getItem(permanentFiles.quiz.storageKey)
        ) {
            files.unshift({
                id: "default-quiz-1",
                name: permanentFiles.quiz.name, Quiz 1.png
                type: permanentFiles.quiz.type,
                size: 0,
                category: "quiz",
                date: "2026-01-01T00:00:00.000Z",
                permanent: true,
                path: permanentFiles.quiz.path
            });
        }

        if (
            category === "laboratory" &&
            !localStorage.getItem(permanentFiles.laboratory.storageKey)
        ) {
            files.unshift({
                id: "default-lab-1",
                name: permanentFiles.laboratory.name, Sarcaoga_lab1.pdf, Lab-Act2.pdf
                type: permanentFiles.laboratory.type,
                size: 0,
                category: "laboratory",
                date: "2026-01-01T00:00:00.000Z",
                permanent: true,
                path: permanentFiles.laboratory.path
            });
        }

        displayFiles(files, category);
    };
}

function displayFiles(files, category) {
    let listElement;

    if (category === "quiz") {
        listElement = document.getElementById("quizList");
    } else if (category === "laboratory") {
        listElement = document.getElementById("laboratoryList");
    } else {
        listElement = document.getElementById("examList");
    }

    listElement.innerHTML = "";

    if (!files || files.length === 0) {
        listElement.innerHTML = `
            <div class="empty-message">
                No files uploaded yet.
            </div>
        `;
        return;
    }

    files.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    files.forEach(function (file) {
        const card = document.createElement("div");
        card.className = "file-card";

        const icon = getFileIcon(file.type, file.name);
        let actions;

        if (file.permanent) {
            actions = `
                <button
                    class="view-button"
                    onclick="viewPermanentFile(
                        '${escapeJS(file.path)}',
                        '${escapeJS(file.name)}',
                        '${escapeJS(file.type)}'
                    )"
                >
                    VIEW
                </button>

                <button
                    class="delete-button"
                    onclick="deletePermanentFile(
                        '${escapeJS(category)}',
                        '${escapeJS(file.name)}'
                    )"
                >
                    DELETE
                </button>
            `;
        } else {
            actions = `
                <button
                    class="view-button"
                    onclick="viewFile(${file.id})"
                >
                    VIEW
                </button>

                <button
                    class="delete-button"
                    onclick="deleteFile(
                        ${file.id},
                        '${escapeJS(file.name)}',
                        '${escapeJS(category)}'
                    )"
                >
                    DELETE
                </button>
            `;
        }

        card.innerHTML = `
            <div class="file-information">
                <div class="file-icon">
                    ${icon}
                </div>

                <div class="file-details">
                    <div class="file-name">
                        ${escapeHTML(file.name)}
                    </div>

                    <div class="file-size">
                        ${
                            file.permanent
                                ? "Portfolio file"
                                : formatFileSize(file.size)
                        }
                    </div>
                </div>
            </div>

            <div class="file-actions">
                ${actions}
            </div>
        `;

        listElement.appendChild(card);
    });
}

function deletePermanentFile(category, fileName) {
    const confirmed = confirm(
        "Are you sure you want to delete:\n\n" + fileName + "?"
    );

    if (!confirmed) {
        return;
    }

    if (category === "quiz") {
        localStorage.setItem(
            permanentFiles.quiz.storageKey,
            "true"
        );
    }

    if (category === "laboratory") {
        localStorage.setItem(
            permanentFiles.laboratory.storageKey,
            "true"
        );
    }

    loadCategoryFiles(category);
}

function viewPermanentFile(path, fileName, fileType) {
    const modal = document.getElementById("viewModal");
    const container = document.getElementById("previewContainer");
    const title = document.getElementById("modalTitle");

    title.textContent = fileName;
    container.innerHTML = "";

    if (fileType.startsWith("image/")) {
        const image = document.createElement("img");
        image.src = path;
        image.alt = fileName;
        container.appendChild(image);
    } else if (fileType === "application/pdf") {
        const iframe = document.createElement("iframe");
        iframe.src = path;
        iframe.title = fileName;
        container.appendChild(iframe);
    } else {
        container.innerHTML = `
            <div class="unsupported-preview">
                <h3>Preview is not available</h3>
                <p>
                    This file type cannot be previewed directly.
                </p>
                <a
                    href="${path}"
                    target="_blank"
                    class="open-file-button"
                >
                    OPEN FILE
                </a>
            </div>
        `;
    }

    modal.dataset.currentUrl = "";
    modal.style.display = "block";
}

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

        title.textContent = file.name;
        container.innerHTML = "";

        if (file.type && file.type.startsWith("image/")) {
            const image = document.createElement("img");
            image.src = url;
            image.alt = file.name;
            container.appendChild(image);
        } else if (file.type === "application/pdf") {
            const iframe = document.createElement("iframe");
            iframe.src = url;
            iframe.title = file.name;
            container.appendChild(iframe);
        } else if (file.type && file.type.startsWith("text/")) {
            const reader = new FileReader();

            reader.onload = function (event) {
                const pre = document.createElement("pre");
                pre.className = "text-preview";
                pre.textContent = event.target.result;
                container.appendChild(pre);
            };

            reader.readAsText(file.data);
        } else {
            container.innerHTML = `
                <div class="unsupported-preview">
                    <h3>Preview is not available</h3>
                    <p>
                        This file type cannot be previewed directly in the browser.
                    </p>
                    <p>
                        File:
                        <strong>${escapeHTML(file.name)}</strong>
                    </p>
                    <a
                        href="${url}"
                        target="_blank"
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
        "Are you sure you want to delete:\n\n" + fileName + "?"
    );

    if (!confirmed) {
        return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

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
    const extension = name.split(".").pop().toLowerCase();

    if (type && type.startsWith("image/")) {
        return "IMG";
    }

    if (type === "application/pdf") {
        return "PDF";
    }

    if (extension === "doc" || extension === "docx") {
        return "DOC";
    }

    if (extension === "xls" || extension === "xlsx") {
        return "XLS";
    }

    if (extension === "ppt" || extension === "pptx") {
        return "PPT";
    }

    if (
        extension === "zip" ||
        extension === "rar" ||
        extension === "7z"
    ) {
        return "ZIP";
    }

    if (extension === "txt" || extension === "csv") {
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
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function escapeJS(text) {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\\n")
        .replace(/\r/g, "\\\r");
}
