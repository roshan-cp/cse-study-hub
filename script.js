const params = new URLSearchParams(window.location.search);
const semester = params.get("semester");
const subject = params.get("subject");

const title = document.getElementById("subject-title");
const notesList = document.getElementById("notes-list");

const subjectNames = {
    de: "Digital Electronics",
    delab: "Digital Electronics Lab",
    dsa: "Data Structures and Algorithms",
    dsalab: "DSA Lab",
    economics: "Economics",
    maths: "Mathematics",
    oop: "Object Oriented Programming",
    toc: "Theory of Computation",
    coa: "Computer Organization and Architecture",
    dbms: "Database Management System",
    dbmslab: "DBMS Lab",
    ethics: "Professional Ethics",
    os: "Operating System",
    oslab: "OS Lab",
    se: "Software Engineering"
};

if (title && semester && subject) {
    title.textContent = `${subjectNames[subject]} (Semester ${semester})`;
    loadFiles();
}

async function loadFiles() {
    const folderPath = `semester${semester}/${subject}`;

    const { data, error } = await supabaseClient.storage
        .from("notes")
        .list(folderPath);

    if (error) {
        notesList.innerHTML = `<p class="empty-message">Error loading files.</p>`;
        return;
    }

    if (!data || data.length === 0) {
        notesList.innerHTML = `<p class="empty-message">No notes available yet.</p>`;
        return;
    }

    notesList.innerHTML = "";

    data
        .filter(file => file.name !== '.emptyFolderPlaceholder')
        .forEach(file => {
            const { data: urlData } = supabaseClient.storage
                .from("notes")
                .getPublicUrl(`${folderPath}/${file.name}`);

            const div = document.createElement("div");
            div.className = "note-item";
            div.innerHTML = `<a href="${urlData.publicUrl}" target="_blank">${file.name}</a>`;
            notesList.appendChild(div);
        });
}