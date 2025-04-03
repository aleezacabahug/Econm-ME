// Select elements
const noteInput = document.getElementById('note-input');
const saveNoteButton = document.getElementById('save-note');
const notesContainer = document.getElementById('notes-container');

// Load notes from local storage
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    notesContainer.innerHTML = '';
    notes.forEach((note, index) => {
        const noteItem = document.createElement('li');
        noteItem.classList.add('note-item');
        noteItem.innerHTML = `
            <input type="checkbox" class="mark-done" data-index="${index}" ${note.done ? 'checked' : ''}>
            <span class="note-text ${note.done ? 'done' : ''}">${note.text}</span>
            <div class="note-actions">
                <button class="edit-note" data-index="${index}">Edit</button>
                <button class="delete-note" data-index="${index}">Delete</button>
            </div>
        `;
        notesContainer.appendChild(noteItem);
    });
}

// Save a new note
function saveNote() {
    const noteText = noteInput.value.trim();
    if (noteText === '') {
        alert('Please enter a note before saving.');
        return;
    }

    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const editingIndex = saveNoteButton.dataset.editingIndex;

    if (editingIndex !== undefined) {
        // Update the existing note
        notes[editingIndex].text = noteText;
        delete saveNoteButton.dataset.editingIndex; // Clear editing state
        saveNoteButton.textContent = 'Save Note'; // Reset button text
    } else {
        // Add a new note
        notes.push({ text: noteText, done: false });
    }

    localStorage.setItem('notes', JSON.stringify(notes));
    noteInput.value = '';
    loadNotes();
}

// Edit an existing note
function editNote(index) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    noteInput.value = notes[index].text;
    saveNoteButton.dataset.editingIndex = index; // Store the index being edited
    saveNoteButton.textContent = 'Update Note'; // Change button text to indicate editing
}

// Delete a note
function deleteNote(index) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.splice(index, 1); // Remove the note at the specified index
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

// Mark a note as done
function toggleDone(index) {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes[index].done = !notes[index].done; // Toggle the done status
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
}

// Event listeners
saveNoteButton.addEventListener('click', saveNote);
notesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-note')) {
        editNote(e.target.dataset.index);
    } else if (e.target.classList.contains('delete-note')) {
        deleteNote(e.target.dataset.index);
    } else if (e.target.classList.contains('mark-done')) {
        toggleDone(e.target.dataset.index);
    }
});

// Initial load
loadNotes();