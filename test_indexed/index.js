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
const DB_OLD_VERSION = 0;
const DB_VERSION = 1;
const TABLES = {
  tareas: {
    v: { [DB_VERSION]: 'tareas-V5' },
    keyPath: 'tarea',
  },
  name: {
    v: { [DB_VERSION]: 'name-V1' },
    keyPath: 'id'
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

  displayData();
};

idb.onupgradeneeded = (event) => {
  db = event.target.result;

  // console.log('Version actual:', event.oldVersion);
  // console.log('Version actual:', event.newVersion);
  console.log('Version actual:', db);

  db.onerror = (event) => {
    notas.appendChild(li('Error al cargar la base de datos'));
  };

  if (event.oldVersion < DB_VERSION) {
    const tareas = db.createObjectStore(TABLES.tareas.v[DB_VERSION], { keyPath: TABLES.tareas.keyPath });
    tareas.createIndex('nameId', 'nameId', { unique: false });

    const name = db.createObjectStore(TABLES.name.v[1], { keyPath: TABLES.name.keyPath });
    name.createIndex('name', 'name', { unique: true });
  }

  notas.appendChild(li('Objeto almacenado creado'));
};

function displayData() {
  const NAME_TAREAS_TT = db.transaction([TABLES.name.v[DB_VERSION], TABLES.tareas.v[DB_VERSION]], 'readonly');
  const NAME_OBS = NAME_TAREAS_TT.objectStore(TABLES.name.v[DB_VERSION]);
  const TAREAS_OBS = NAME_TAREAS_TT.objectStore(TABLES.tareas.v[DB_VERSION]);

  // IDBCursor ---------------------------------
  const NAME_OBS_REQUEST = NAME_OBS.openCursor();
  NAME_OBS_REQUEST.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const { name } = cursor.value;
      lista.appendChild(p(name));
      cursor.continue();
    }
  };

  // IDBIndex ---------------------------------
  const TAREAS_OBS_REQUEST = TAREAS_OBS.get(TABLES.tareas.keyPath);

  TAREAS_OBS_REQUEST.onsuccess = (event) => {
    const tareas = event.target.result;
    console.log(event.target);
    if (tareas) {
      console.log(event.target);
    } else console.log('No hay tareas');
  };
}

function handleAddTask(e) {
  e.preventDefault();

  if (input.value === '') {
    notas.appendChild(li('Ingrese el nombre de la tarea'));
    return;
  }

  const TAREAS_TT = db.transaction([TABLES.tareas.v[DB_VERSION]], 'readwrite');
  const NAME_TT = db.transaction([TABLES.name.v[DB_VERSION]], 'readwrite');

  const newName = [{ id: 1, name: input.value }];
  const newTask = [{ tarea: 1, nameId: newName[0].id }];
  // const newTask = [{ tarea: 2, name: input.value }];

  TAREAS_TT.onerror = (event) => {
    console.log(event);
    notas.appendChild(li(`Error al añadir la tarea: ${TAREAS_TT.error}`));
  };

  const TAREA_OBS = TAREAS_TT.objectStore(TABLES.tareas.v[DB_VERSION]);
  const NAME_OBS = NAME_TT.objectStore(TABLES.name.v[1]);
  const TAREA_OBS_REQUEST = TAREA_OBS.add(newTask[0]);
  const NAME_OBS_REQUEST = NAME_OBS.add(newName[0]);

  TAREA_OBS_REQUEST.onsuccess = (event) => {
    notas.appendChild(li('Consulta exitosa'));
    input.value = '';
  };

  NAME_OBS_REQUEST.onsuccess = (event) => console.log('Consulta exitosa');

  TAREAS_TT.oncomplete = (event) => {
    notas.appendChild(li('Todo hecho'));
    displayData();
  };

  NAME_OBS_REQUEST.oncomplete = (event) => console.log('Todo hecho');
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
