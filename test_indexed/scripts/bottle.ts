import BaByDB from './bbydb';

class Bottle<T> {
  private dbManager: BaByDB;
  private storeName: string;

  constructor(dbManager: BaByDB, storeName: string) {
    this.dbManager = dbManager;
    this.storeName = storeName;
  }

  async addItem(item: T): Promise<number> {
    return new Promise((resolve, reject) => {
      const db = this.dbManager.getDB();
      if (!db) return reject('IndexedDB no está lista');

      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      (item as any).timestamp = Date.now();
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllItems(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const db = this.dbManager.getDB();
      if (!db) return reject('IndexedDB no está lista');

      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteItem(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const db = this.dbManager.getDB();
      if (!db) return reject('IndexedDB no está lista');

      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldItems(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const db = this.dbManager.getDB();
      if (!db) return reject('IndexedDB no está lista');

      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const now = Date.now();
        request.result.forEach((item: any) => {
          if (now - item.timestamp > maxAge) {
            store.delete(item.id);
          }
        });
        resolve(true);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export default Bottle;
