// import BaByDB from './bbydb';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class BaByDB {
    constructor(dbName, storeConfigs) {
        this.db = null;
        this.dbName = dbName;
        this.storeConfigs = storeConfigs;
        // this.initDB();
    }
    static getInstance(dbName, storeConfigs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!BaByDB.instance) {
                BaByDB.instance = new BaByDB(dbName, storeConfigs);
                yield BaByDB.instance.initDB();
            }
            return Object.assign(BaByDB.instance, BaByDB.instance.createStoreInstances());
        });
    }
    initDB() {
        const request = indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            this.storeConfigs.forEach((config) => {
                var _a, _b;
                if (!db.objectStoreNames.contains(config.name)) {
                    const store = db.createObjectStore(config.name, {
                        keyPath: config.keyPath,
                        autoIncrement: (_a = config.autoIncrement) !== null && _a !== void 0 ? _a : true,
                    });
                    // Crear índices
                    (_b = config.indexes) === null || _b === void 0 ? void 0 : _b.forEach(({ name, keyPath, unique }) => {
                        store.createIndex(name, keyPath, { unique: !!unique });
                    });
                }
            });
        };
        request.onsuccess = (event) => {
            this.db = event.target.result;
            console.log('IndexedDB inicializada:', this.dbName);
            // Crear instancias de Bottle para cada alias
            this.storeConfigs.forEach(({ name, alias }) => {
                this[alias] = new Bottle(this, name);
            });
        };
        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB', event.target.error);
        };
    }
    getDB() {
        return this.db;
    }
    createStoreInstances() {
        const stores = {};
        this.storeConfigs.forEach((store) => {
            stores[store.alias] = new Bottle(this, store.name);
        });
        return stores;
    }
}
class Bottle {
    constructor(dbManager, storeName) {
        this.dbManager = dbManager;
        this.storeName = storeName;
    }
    addItem(item) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const db = this.dbManager.getDB();
                if (!db)
                    return reject('IndexedDB no está lista');
                const transaction = db.transaction(this.storeName, 'readwrite');
                const store = transaction.objectStore(this.storeName);
                item.timestamp = Date.now();
                const request = store.add(item);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    }
    getAllItems() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const db = this.dbManager.getDB();
                if (!db)
                    return reject('IndexedDB no está lista');
                const transaction = db.transaction(this.storeName, 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    }
    deleteItem(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const db = this.dbManager.getDB();
                if (!db)
                    return reject('IndexedDB no está lista');
                const transaction = db.transaction(this.storeName, 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(id);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        });
    }
    clearOldItems() {
        return __awaiter(this, arguments, void 0, function* (maxAge = 30 * 24 * 60 * 60 * 1000) {
            return new Promise((resolve, reject) => {
                const db = this.dbManager.getDB();
                if (!db)
                    return reject('IndexedDB no está lista');
                const transaction = db.transaction(this.storeName, 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.getAll();
                request.onsuccess = () => {
                    const now = Date.now();
                    request.result.forEach((item) => {
                        if (now - item.timestamp > maxAge) {
                            store.delete(item.id);
                        }
                    });
                    resolve(true);
                };
                request.onerror = () => reject(request.error);
            });
        });
    }
}
const $ = (el) => document.querySelector(el);
const $$ = (el) => document.querySelectorAll(el);
const _ = (el) => document.getElementById(el);
const el = (el) => document.createElement(el);
// const lista = ide('lista-tareas');
const formulario = _('formulario');
const notas = _('life-db');
const notificacion = _('btn-notificacion');
const input = _('nombre');
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
let instanceDB = null;
const dbe = () => __awaiter(this, void 0, void 0, function* () {
    if (!instanceDB)
        instanceDB = yield BaByDB.getInstance('Tareas', [tb_tareas]);
    return instanceDB;
});
function ddd() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield dbe();
            console.log('db', db);
            const items = db.tareas.getAllItems().then((result) => console.log(result));
            console.log(items);
        }
        catch (error) {
            console.log(error);
        }
    });
}
ddd();
// allItems.then((items) => {
//   items.forEach(({ tarea }) => {
//     lista.appendChild(p(tarea));
//   });
// });
function handleAddTask(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        if (!input || !notas)
            return;
        if (input.value.trim() === '') {
            notas.appendChild(list('Ingrese el nombre de la tarea'));
            return;
        }
        const newTask = [{ tarea: input.value, name: input.value }];
        try {
            const result = yield dbe();
            result.tareas.addItem(newTask[0]);
            notas.appendChild(list('Consulta exitosa'));
            input.value = '';
        }
        catch (err) {
            notas.appendChild(list('Error al añadir la tarea'));
        }
    });
}
if (formulario)
    formulario.addEventListener('submit', handleAddTask, false);
function list(note) {
    const li = el('li');
    li.innerHTML = note;
    return li;
}
function parr(parr) {
    const parrafo = el('p');
    parrafo.innerHTML = parr;
    return parrafo;
}
