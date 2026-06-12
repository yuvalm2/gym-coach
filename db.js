// db.js — tiny Promise-based IndexedDB wrapper. No dependencies.
// Stores:
//   meta      key-value (profile, schema version, etc.)
//   gyms      { id, name, machineIds[] }
//   sessions  { id, date, gymId, ... , entries[] }
//   exercises custom user-added exercises (the built-in library lives in library.js)
const DB = (() => {
  const DB_NAME = 'gym-coach';
  const DB_VERSION = 1;
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
        if (!db.objectStoreNames.contains('gyms')) db.createObjectStore('gyms', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('exercises')) db.createObjectStore('exercises', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function store(name, mode) {
    return open().then((db) => db.transaction(name, mode).objectStore(name));
  }

  function p(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return {
    async get(name, key) { return p((await store(name, 'readonly')).get(key)); },
    async getAll(name) { return p((await store(name, 'readonly')).getAll()); },
    async put(name, value, key) {
      const os = await store(name, 'readwrite');
      return p(key === undefined ? os.put(value) : os.put(value, key));
    },
    async delete(name, key) { return p((await store(name, 'readwrite')).delete(key)); },
    async clear(name) { return p((await store(name, 'readwrite')).clear()); },
    async getMeta(key, fallback) {
      const v = await this.get('meta', key);
      return v === undefined ? fallback : v;
    },
    async setMeta(key, value) { return this.put('meta', value, key); }
  };
})();
