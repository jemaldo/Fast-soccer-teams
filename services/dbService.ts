
const DB_NAME = 'AcademiaProDB';
const DB_VERSION = 1;
const STORES = ['schoolSettings', 'students', 'teachers', 'payments', 'cashFlow', 'squads', 'users'];

export class LocalDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        STORES.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  async save(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Si el dato es un array, guardamos uno por uno, si es objeto individual usamos el id
      if (Array.isArray(data)) {
        store.clear(); // Limpiamos para mantener sincronía con el estado de React
        data.forEach(item => store.put(item));
      } else {
        if (!data.id) data.id = 'singleton'; // Para settings
        store.put(data);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = (event: any) => reject(event.target.error);
    });
  }

  async getAll(storeName: string): Promise<any> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result;
        // Si es el store de settings, devolvemos el primer objeto
        if (storeName === 'schoolSettings') resolve(result[0] || null);
        resolve(result);
      };
      request.onerror = (event: any) => reject(event.target.error);
    });
  }
}

export const db = new LocalDatabase();
