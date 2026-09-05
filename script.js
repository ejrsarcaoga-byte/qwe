const DB_NAME = "EllainePortfolioDB";
const DB_VERSION = 1;
const STORE_NAME = "portfolioFiles";

let db;

const defaultPdfFiles = [
    {
        id: "lab-act2-pdf",
        name: "Lab-Act2.pdf",
        path: "Lab-Act2.pdf",
        type: "application/pdf",
        category: "laboratory"
    },
    {
        id: "sarcaoga-lab1-pdf",
        name: "Sarcaoga_lab1.pdf",
        path: "Sarcaoga_lab1.pdf",
        type: "application/pdf",
        category: "laboratory"
    }
];

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function(event) {
            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, {
                    keyPath: "id"
                });

                store.createIndex("category", "category", {
                    unique: false
                });
            }
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            console.log("Database connected.");
            resolve(db);
        };

        request.onerror = function(event) {
            console.error("Database error:", event.target.error);
            reject(event.target.error);
        };
    });
}

function saveFile(fileObject) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(fileObject);

        request.onsuccess = function() {
            resolve();
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

function getFile(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

function getAllFiles() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

function deleteFile(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = function() {
            resolve();
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

async function addDefaultPdfFiles(showAlert = false) {
    for (const pdf of defaultPdfFiles) {
        try {
            const existing = await getFile(pdf.id);

            if (existing) {
                continue;
            }

            const response = await fetch(pdf.path);

            if (!response.ok) {
                console.error("Cannot load:", pdf.path);
                continue;
            }

            const blob = await response.blob();

            await saveFile({
                id: pdf.id,
                name: pdf.name,
                type: "application/pdf",
                data: blob,
                category: "laboratory",
                size: blob.size,
                isDefault: true
            });
        } catch (error) {
            console.error("Default file error:", error);
        }
    }

    await loadAllFiles();

    if (showAlert) {
        alert("Default laboratory files restored!");
    }
}

async function loadAllFiles() {
    if (!db) {
        return;
    }

    try {
        const files = await getAllFiles();

        const laboratoryFiles = files.filter(
            file => file.category === "laboratory"
        );

        const examFiles = files.filter(
            file => file.category === "exam"
        );

        renderLaboratoryFiles(laboratoryFiles);
        renderExamFiles(examFiles);
    } catch (error) {
        console.error("Unable to load files:", error);
    }
}

function renderLaboratoryFiles(files) {
    const list = document.getElementById("laboratoryList");

    if (!list) {
        return;
    }

    const uploadedFiles = files.filter(
        file => !file.isDefault
    );

    if (uploadedFiles.length === 0) {
        list.innerHTML = "";
        return;
    }

    list.innerHTML = uploadedFiles
        .map(file => createFileCard(file))
        .join("");
}

function renderExamFiles(files) {
    const list = document.getElementById("examList");

    if (!list) {
        return;
    }

    if (files.length === 0) {
        list.innerHTML = "";
        return;
    }

    list.innerHTML = files
        .map(file => createFileCard(file))
        .join("");
}

function createFileCard(file) {
    const size = formatFileSize(file.size);
    const icon = getFileIcon(file.type, file.name);

    return `
        <div class="file-card">
            <div class="file-information">
                <div class="file-icon">
                    ${icon}
                </div>

                <div class="file-details">
                    <div class="file-name">
                        ${escapeHTML(file.name)}
                    </div>

                    <div class="file-size">
                        ${size}
                    </div>
                </div>
            </div>

            <div class="file-actions">
                <button
                    type="button"
                    class="view-button"
                    onclick="openStoredFile('${file.id}')">
                    VIEW
                </button>

                <button
                    type="button"
                    class="delete-button"
                    onclick="removeStoredFile('${file.id}')">
                    DELETE
                </button>
            </div>
        </div>
    `;
}

async function handleFileUpload(event, category) {
    const files = Array.from(event.target.files);

    if (files.length === 0) {
        return;
    }

    for (const file of files) {
        try {
            const id =
                category +
                "-" +
                Date.now() +
                "-" +
                Math.random().toString(36).substring(2, 9);

            await saveFile({
                id: id,
                name: file.name,
                type: file.type || "application/octet-stream",
                data: file,
                category: category,
                size: file.size,
                isDefault: false
            });
        } catch (error) {
            console.error(
                "Unable to save:",
                file.name,
                error
            );
        }
    }

    await loadAllFiles();
    event.target.value = "";
}

async function openStoredFile(id) {
    try {
        const file = await getFile(id);

        if (!file) {
            alert("File not found.");
            return;
        }

        const url = URL.createObjectURL(file.data);

        openPreview(
            file.name,
            file.type,
            url
        );
    } catch (error) {
        console.error(error);
        alert("Unable to open the file.");
    }
}

async function removeStoredFile(id) {
    try {
        const file = await getFile(id);

        if (!file) {
            return;
        }

        const confirmed = confirm(
            `Delete "${file.name}"?`
        );

        if (!confirmed) {
            return;
        }

        await deleteFile(id);
        await loadAllFiles();
    } catch (error) {
        console.error(error);
        alert("Unable to delete file.");
    }
}

function openDefaultPDF(fileName) {
    const pdf = defaultPdfFiles.find(
        file => file.name === fileName
    );

    if (!pdf) {
        alert("PDF file not found.");
        return;
    }

    openPreview(
        pdf.name,
        "application/pdf",
        pdf.path
    );
}

function openDefaultImage(imagePath, title) {
    openPreview(
        title,
        "image",
        imagePath
    );
}

function openPreview(title, type, source) {
    const modal = document.getElementById("viewModal");
    const modalTitle = document.getElementById("modalTitle");
    const container = document.getElementById("previewContainer");

    if (!modal || !modalTitle || !container) {
        return;
    }

    modalTitle.textContent = title;
    container.innerHTML = "";

    if (
        type === "application/pdf" ||
        /\.pdf$/i.test(source)
    ) {
        const iframe = document.createElement("iframe");

        iframe.src = source;
        iframe.title = title;

        container.appendChild(iframe);
    } else if (
        type.startsWith("image/") ||
        type === "image" ||
        isImageFile(title)
    ) {
        const img = document.createElement("img");

        img.src = source;
        img.alt = title;

        container.appendChild(img);
    } else {
        container.innerHTML = `
            <div class="unsupported-preview">
                <h3>Preview not available</h3>

                <p>
                    This file type cannot be
                    previewed directly in the browser.
                </p>

                <a
                    href="${source}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="open-file-button">
                    OPEN FILE
                </a>
            </div>
        `;
    }

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeModal() {
    const modal = document.getElementById("viewModal");
    const container = document.getElementById("previewContainer");

    if (modal) {
        modal.style.display = "none";
    }

    if (container) {
        container.innerHTML = "";
    }

    document.body.style.overflow = "";
}

window.addEventListener("click", function(event) {
    const modal = document.getElementById("viewModal");

    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeModal();
    }
});

async function restoreDefaultFiles() {
    const confirmed = confirm(
        "Restore the default laboratory PDF files?"
    );

    if (!confirmed) {
        return;
    }

    await addDefaultPdfFiles(true);
}

function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) {
        return "0 KB";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    const index = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    const size = bytes / Math.pow(1024, index);

    return (
        Math.round(size * 100) / 100
    ) + " " + units[index];
}

function getFileIcon(type, name) {
    const extension = name
        .split(".")
        .pop()
        .toUpperCase();

    if (extension === "PDF") {
        return "PDF";
    }

    if (type && type.startsWith("image/")) {
        return "IMG";
    }

    if (
        extension === "DOC" ||
        extension === "DOCX"
    ) {
        return "DOC";
    }

    if (
        extension === "XLS" ||
        extension === "XLSX"
    ) {
        return "XLS";
    }

    if (extension === "ZIP") {
        return "ZIP";
    }

    return "FILE";
}

function isImageFile(fileName) {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
        fileName
    );
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", async function() {
    try {
        await openDatabase();
        await addDefaultPdfFiles(false);

        const laboratoryInput = document.getElementById(
            "laboratoryInput"
        );

        if (laboratoryInput) {
            laboratoryInput.addEventListener(
                "change",
                function(event) {
                    handleFileUpload(event, "laboratory");
                }
            );
        }

        const examInput = document.getElementById(
            "examInput"
        );

        if (examInput) {
            examInput.addEventListener(
                "change",
                function(event) {
                    handleFileUpload(event, "exam");
                }
            );
        }

        await loadAllFiles();
    } catch (error) {
        console.error(
            "Website initialization failed:",
            error
        );
    }
});
