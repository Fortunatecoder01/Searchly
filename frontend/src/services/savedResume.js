// Temporary single-browser storage until Searchly has user accounts.
// No file is sent to the Searchly backend simply by saving it here.
// The current browser origin controls access to this data.

const DATABASE = "searchly_development_resume_v1";
const STORE = "resume";
const KEY = "current";
const MAX_SIZE = 5 * 1024 * 1024;

function database() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error("This browser doesn't support saved resumes."));
      return;
    }
    const request = window.indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Resume storage is busy. Close other tabs and retry."));
  });
}

async function perform(mode, action) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    let result;
    const request = action(tx.objectStore(STORE));
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("Resume storage failed.")); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("Resume storage cancelled.")); };
  });
}

export async function loadSavedResume() {
  return (await perform("readonly", store => store.get(KEY))) || null;
}

export async function saveSavedResume(file, analysis = null) {
  if (!file || file.size > MAX_SIZE || !/\.(pdf|docx)$/i.test(file.name)) {
    throw new Error("Choose a PDF or DOCX resume under 5 MB.");
  }
  const entry = {
    file,
    filename: file.name,
    savedAt: new Date().toISOString(),
    analysis: analysis && analysis.skills ? analysis : null,
  };
  await perform("readwrite", store => store.put(entry, KEY));
  window.dispatchEvent(new Event("searchly:resume-changed"));
  return entry;
}

export async function removeSavedResume() {
  await perform("readwrite", store => store.delete(KEY));
  window.dispatchEvent(new Event("searchly:resume-changed"));
}
