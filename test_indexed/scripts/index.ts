// import BaByDB from './bbydb';

interface StoreConfig {
  name: string;
  alias: string;
  keyPath: string;
  autoIncrement?: boolean;
  indexes?: { name: string; keyPath: string; unique?: boolean }[];
}

class BaByDB<Tables> {
  private static instance: BaByDB<any>;
  private db: IDBDatabase | null = null;
  private dbName: string;
  private storeConfigs: StoreConfig[];

  [key: string]: any;

  private constructor(dbName: string, storeConfigs: StoreConfig[]) {
    this.dbName = dbName;
    this.storeConfigs = storeConfigs;
    // this.initDB();
  }

  public static async getInstance<Tables>(
    dbName: string,
    storeConfigs: StoreConfig[],
  ): Promise<BaByDB<Tables> & { [K in keyof Tables]: Bottle<any> }> {
    if (!BaByDB.instance) {
      BaByDB.instance = new BaByDB<Tables>(dbName, storeConfigs);
      await BaByDB.instance.initDB();
    }
    return Object.assign(BaByDB.instance, BaByDB.instance.createStoreInstances());
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
        (this as BaByDB<Tables>)[alias] = new Bottle(this, name);
      });
    };

    request.onerror = (event) => {
      console.error('Error al abrir IndexedDB', (event.target as IDBOpenDBRequest).error);
    };
  }

  public getDB(): IDBDatabase | null {
    return this.db;
  }

  createStoreInstances<T>(): { [K in keyof Tables]: Bottle<T> } {
    const stores = {} as { [K in keyof Tables]: Bottle<T> };
    this.storeConfigs.forEach((store) => {
      stores[store.alias] = new Bottle<T>(this, store.name);
    });
    return stores;
  }
}

class Bottle<T> {
  private dbManager: BaByDB<any>;
  private storeName: string;

  constructor(dbManager: BaByDB<any>, storeName: string) {
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

const $ = (el: string): Element | null => document.querySelector(el);
const $$ = (el: string): NodeListOf<Element> => document.querySelectorAll(el);
const _ = (el: string): HTMLElement | null => document.getElementById(el);
const el = (el: string): HTMLElement => document.createElement(el);

// const lista = ide('lista-tareas');
const formulario = _('formulario') as HTMLFormElement | null;
const notas = _('life-db') as HTMLUListElement | null;
const notificacion = _('btn-notificacion') as HTMLButtonElement | null;
const input = _('nombre') as HTMLInputElement | null;

type Tarea = {
  tarea: string;
  name: string;
  keyPath: string;
  indexes?: { name: string; keyPath: string; unique?: boolean }[];
};

type DB_Tareas = {
  tareas: Bottle<Tarea>;
};

const tb_tareas = {
  name: 'tareas',
  alias: 'tareas',
  keyPath: 'tarea',
  indexes: [
    {
      name: 'name',
      keyPath: 'name',
      unique: false,
    },
  ],
};

let instanceDB: BaByDB<DB_Tareas> | null = null;

const dbe = async () => {
  if (!instanceDB) instanceDB = await BaByDB.getInstance<DB_Tareas>('Tareas', [tb_tareas]);

  return instanceDB;
};

async function ddd() {
  try {
    const db = await dbe();
    console.log('db', db);
    const items = db.tareas.getAllItems().then((result: any) => console.log(result));
    console.log(items);
  } catch (error) {
    console.log(error);
  }
}

ddd();

// allItems.then((items) => {
//   items.forEach(({ tarea }) => {
//     lista.appendChild(p(tarea));
//   });
// });

async function handleAddTask(e: SubmitEvent) {
  e.preventDefault();

  if (!input || !notas) return;

  if (input.value.trim() === '') {
    notas.appendChild(list('Ingrese el nombre de la tarea'));
    return;
  }

  const newTask = [{ tarea: input.value, name: input.value }];

  try {
    const result = await dbe();
    result.tareas.addItem(newTask[0]);
    notas.appendChild(list('Consulta exitosa'));
    input.value = '';
  } catch (err) {
    notas.appendChild(list('Error al añadir la tarea'));
  }
}

if (formulario) formulario.addEventListener('submit', handleAddTask, false);

function list(note: string) {
  const li = el('li');
  li.innerHTML = note;
  return li;
}

function parr(parr: string) {
  const parrafo = el('p');
  parrafo.innerHTML = parr;
  return parrafo;
}
