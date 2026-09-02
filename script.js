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
}
