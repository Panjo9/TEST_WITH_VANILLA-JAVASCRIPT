class IDB {
  dbName;
  dbVersion;
  constructor(dbName, dbVersion) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    window.indexedDB.open(dbName, dbVersion);
  }
}

const $ = (el) => document.querySelector(el);
const $$ = (el) => document.querySelectorAll(el);
const _ = (el) => document.getElementById(el);
const el = (el) => document.createElement(el);

const lista = _('lista-tareas');
const formulario = _('formulario');
const notas = _('life-db');
const notificacion = _('btn-notificacion');
const input = _('nombre');

let db;

notas.appendChild(li('App iniciada'));

const DB_NAME = 'Tareas';
const DB_VERSION = 4;
const TABLES = {
  tareas: {
    v: { 3: 'tareas-V3', 4: 'tareas-V4' },
  },
};

const idb = window.indexedDB.open(DB_NAME, DB_VERSION);

idb.onerror = (event) => {
  console.error(event.target);
  notas.appendChild(li('Error al iniciar la base de datos'));
};

idb.onsuccess = (event) => {
  notas.appendChild(li('Base de datos creada'));

  db = event.target.result;

  console.log(db);

  displayData();
};

idb.onupgradeneeded = (event) => {
  console.log('event', event);

  db = event.target.result;

  // console.log('Version actual:', event.oldVersion);
  // console.log('Version actual:', event.newVersion);
  console.log('Version actual:', db);

  db.onerror = (event) => {
    notas.appendChild(li('Error al cargar la base de datos'));
  };

  if (event.oldVersion < 4) {
    db.deleteObjectStore(TABLES.tareas.v[3]);
    const tareas = db.createObjectStore(TABLES.tareas.v[4], { keyPath: 'tarea' });
    tareas.createIndex('name', 'name', { unique: false });
  }

  notas.appendChild(li('Objeto almacenado creado'));
};

function displayData() {
  const transaction = db.transaction([TABLES.tareas.v[4]], 'readonly');
  const objectStore = transaction.objectStore(TABLES.tareas.v[4]);

  // IDBCursor ---------------------------------
  const request = objectStore.openCursor();

  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const { name } = cursor.value;
      if (typeof name === 'object') lista.appendChild(p(name.value));
      else lista.appendChild(p(name));
      cursor.continue();
    }
  };

  // IDBIndex ---------------------------------
  // const request = objectStore.getAll();

  // request.onsuccess = (event) => {
  //   const tareas = event.target.result;
  //   if (tareas.length > 0)
  //     tareas.forEach(({ tarea }) => {
  //       lista.appendChild(p(tarea));
  //     });
  // };
}

function handleAddTask(e) {
  e.preventDefault();

  if (input.value === '') {
    notas.appendChild(li('Ingrese el nombre de la tarea'));
    return;
  }

  const transaction = db.transaction([TABLES.tareas.v[4]], 'readwrite');

  const newTask = [{ tarea: 3, name: { id: 1, value: input.value } }];

  transaction.onerror = (event) => {
    console.log(event)
    notas.appendChild(li(`Error al añadir la tarea: ${transaction.error}`));
  };

  const objectStore = transaction.objectStore(TABLES.tareas.v[4]);
  const objectStoreRequest = objectStore.add(newTask[0]);

  objectStoreRequest.onsuccess = (event) => {
    notas.appendChild(li('Consulta exitosa'));
    input.value = '';
  };

  transaction.oncomplete = (event) => {
    notas.appendChild(li('Todo hecho'));
    displayData();
  };
}

function li(note) {
  const li = el('li');
  li.innerHTML = note;
  return li;
}

function p(parr) {
  const parrafo = el('p');
  parrafo.innerHTML = parr;
  return parrafo;
}

formulario.addEventListener('submit', handleAddTask, false);

// if (Notification.permission === 'denied' || Notification.permission === 'default') {
//   notificacion.style.display = 'block';
// } else {
//   notificacion.style.display = 'none';
// }
