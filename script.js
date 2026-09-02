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

async function addDefaultPdfFiles() {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    for (const pdf of defaultPdfFiles) {
        try {
            const response = await fetch(pdf.path);

            if (!response.ok) {
                console.error(`Unable to load ${pdf.name}`);
                continue;
            }

            const blob = await response.blob();

            store.put({
                id: pdf.id,
                name: pdf.name,
                type: "application/pdf",
                data: blob,
                category: pdf.category,
                size: blob.size
            });

        } catch (error) {
            console.error(`Error adding ${pdf.name}:`, error);
        }
    }

    transaction.oncomplete = function () {
        loadAllFiles();
        alert("Lab-Act2.pdf and Sarcaoga_lab1.pdf were added.");
    };

    transaction.onerror = function () {
        alert("Unable to add the PDF files.");
    };
    <section id="laboratory" class="file-section">
    <div class="section-header">
        <h1>LABORATORY</h1>

        <p>
            Upload and manage your laboratory files.
        </p>
    </div>

    <div class="default-laboratory-files">
        <h2>Laboratory Files</h2>

        <div class="default-file-list">
            <div class="default-file-card">
                <div class="default-file-icon">PDF</div>

                <div class="default-file-information">
                    <h3>Lab-Act2.pdf</h3>
                    <p>Laboratory activity file</p>
                </div>

                <button
                    class="view-button"
                    type="button"
                    onclick="openDefaultPDF('Lab-Act2.pdf')"
                >
                    VIEW
                </button>
            </div>

            <div class="default-file-card">
                <div class="default-file-icon">PDF</div>

                <div class="default-file-information">
                    <h3>Sarcaoga_lab1.pdf</h3>
                    <p>Laboratory activity file</p>
                </div>

                <button
                    class="view-button"
                    type="button"
                    onclick="openDefaultPDF('Sarcaoga_lab1.pdf')"
                >
                    VIEW
                </button>
            </div>
        </div>
    </div>

    <div class="upload-box">
        <label for="laboratoryInput" class="upload-button">
            + UPLOAD LABORATORY
        </label>

        <input
            type="file"
            id="laboratoryInput"
            class="file-input"
            multiple
            accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.zip"
        >

        <p>
            PDF, pictures, screenshots, documents,
            ZIP files, and other file types are supported.
        </p>
    </div>

    <div class="file-list" id="laboratoryList"></div>
</section>
}
