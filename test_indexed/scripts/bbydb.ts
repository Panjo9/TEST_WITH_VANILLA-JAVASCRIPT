import Bottle from './bottle';

interface StoreConfig {
  name: string;
  alias: string;
  keyPath: string;
  autoIncrement?: boolean;
  indexes?: { name: string; keyPath: string; unique?: boolean }[];
}

class BaByDB {
  private static instance: BaByDB;
  private db: IDBDatabase | null = null;
  private dbName: string;
  private storeConfigs: StoreConfig[];

  private constructor(dbName: string, storeConfigs: StoreConfig[]) {
    this.dbName = dbName;
    this.storeConfigs = storeConfigs;
    this.initDB();
  }

  public static getInstance(dbName: string, storeConfigs: StoreConfig[]): BaByDB {
    if (!BaByDB.instance) {
      BaByDB.instance = new BaByDB(dbName, storeConfigs);
    }
    return BaByDB.instance;
  }

  private initDB(): void {
    const request = indexedDB.open(this.dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      this.storeConfigs.forEach((config) => {
        if (!db.objectStoreNames.contains(config.name)) {
          const store = db.createObjectStore(config.name, {
            keyPath: config.keyPath,
            autoIncrement: config.autoIncrement ?? true,
          });

          // Crear índices
          config.indexes?.forEach(({ name, keyPath, unique }) => {
            store.createIndex(name, keyPath, { unique: !!unique });
          });
        }
      });
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      console.log('IndexedDB inicializada:', this.dbName);

      // Crear instancias de Bottle para cada alias
      this.storeConfigs.forEach(({ name, alias }) => {
        (this as any)[alias] = new Bottle(this, name);
      });
    };

    request.onerror = (event) => {
      console.error('Error al abrir IndexedDB', (event.target as IDBOpenDBRequest).error);
    };
  }

  public getDB(): IDBDatabase | null {
    return this.db;
  }
}

export default BaByDB;
