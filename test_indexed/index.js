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

const DB_NAME = 'Mensajes';
const DB_OLD_VERSION = 0;
const DB_VERSION = 1;
const TABLES = {
  mensajes: {
    v: { [DB_VERSION]: 'mensajes-V1' },
    keyPath: 'id',
  },
};
const { mensajes } = TABLES;
const currentUser = { id: 3, name: 'Jose', emp_ruc: '123456789' };

const idb = window.indexedDB.open(DB_NAME, DB_VERSION);

idb.onerror = (event) => {
  console.error(event.target);
  notas.appendChild(li('Error al iniciar la base de datos'));
};

idb.onsuccess = (event) => {
  notas.appendChild(li('Base de datos creada'));

  db = event.target.result;

  insertMessages();
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
    const msjStore = db.createObjectStore(mensajes.v[DB_VERSION], { keyPath: mensajes.keyPath, autoIncrement: true });
    msjStore.createIndex('createdAt', 'createdAt', { unique: false });
    msjStore.createIndex('text', 'text', { unique: false });
    msjStore.createIndex('user', 'user._id', { unique: false });
    msjStore.createIndex('file', 'file.name', { unique: false });
  }

  notas.appendChild(li('Objeto almacenado creado'));
};

async function obtenerMensajesConCreatedAt(createdAt) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([mensajes.v[DB_VERSION]], 'readonly');
    const store = tx.objectStore(mensajes.v[DB_VERSION]);
    const index = store.index('createdAt');
    const request = index.getAll(createdAt);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function filtrarMensajesNuevos(mensajes_json, lastCreatedAt) {
  const nuevosMensajes = mensajes_json.filter((m) => m.createdAt > lastCreatedAt);
  const mensajesExistentes = await obtenerMensajesConCreatedAt(lastCreatedAt);

  if (mensajesExistentes.length === 0) return nuevosMensajes;

  const valueSet = (m) => `${m.user._id}-${m.text}`;
  const mensajesSet = new Set(mensajesExistentes.map((m) => valueSet(m)));
  const mensajesMismoCreatedAt = mensajes_json.filter(
    (m) => m.createdAt === lastCreatedAt && !mensajesSet.has(valueSet(m)),
  );

  return [...nuevosMensajes, ...mensajesMismoCreatedAt];
}

async function insertMessages() {
  const mensajes_sql = await fetch('./mensajes.json');
  const mensajes_json = await mensajes_sql.json();
  // const mensajes_json = [];

  let MENSAJES_TT = db.transaction([mensajes.v[DB_VERSION]], 'readwrite');
  const MSJ_OBS = MENSAJES_TT.objectStore(mensajes.v[DB_VERSION]);

  const MSJ_OBS_INDEX = MSJ_OBS.index('createdAt');
  const MSJ_OBS_REQUEST = MSJ_OBS_INDEX.openCursor(null, 'prev');

  MSJ_OBS_REQUEST.onerror = (event) => {
    notas.appendChild(li(`insertMessages error: ${event.target.error.message}`));
  };

  MSJ_OBS_REQUEST.onsuccess = async (event) => {
    const cursor = event.target.result;
    const lastCreatedAt = cursor ? cursor.value.createdAt : 0;

    const newMensajes = await filtrarMensajesNuevos(mensajes_json, lastCreatedAt);

    if (newMensajes.length === 0) {
      const MENSAJES_TT2 = db.transaction([mensajes.v[DB_VERSION]], 'readwrite');
      const MSJ_OBS2 = MENSAJES_TT2.objectStore(mensajes.v[DB_VERSION]);
      const currentMensajes = MSJ_OBS2.openCursor();
      displayData(currentMensajes);
    } else {
      const MENSAJES_TT3 = db.transaction([mensajes.v[DB_VERSION]], 'readwrite');
      const MSJ_OBS3 = MENSAJES_TT3.objectStore(mensajes.v[DB_VERSION]);
      await Promise.all(newMensajes.map((newMensaje) => MSJ_OBS3.add(newMensaje)));

      MENSAJES_TT3.onabort = (event) => {
        notas.appendChild(li(`insertMessages abort: ${event.target.error.message}`));
      };

      MENSAJES_TT3.oncomplete = (event) => {
        notas.appendChild(li('Mensajes creados'));

        const MENSAJES_TT4 = db.transaction([mensajes.v[DB_VERSION]], 'readonly');
        const MSJ_OBS4 = MENSAJES_TT4.objectStore(mensajes.v[DB_VERSION]);
        // IDBCursor ---------------------------------
        const NAME_OBS_REQUEST2 = MSJ_OBS4.openCursor();
        displayData(NAME_OBS_REQUEST2);
      };
    }
  };
}

function displayData(request) {
  request.onsuccess = (event) => {
    const mensaje = event.target.result;
    if (mensaje == null) return;
    const { text, key } = mensaje.value;
    const list = lista.appendChild(li(p(text)));
    list.appendChild(button('Eliminar', handleDeleteTask, key));
    list.appendChild(button('Actualizar', handleUpdateTask, key));
    mensaje.continue();
  };
}

function handleAddTask(e) {
  e.preventDefault();
  let inputValue = input.value.trim();
  if (inputValue === '') {
    notas.appendChild(li('Ingrese el nombre de la tarea'));
    return;
  }

  const MENSAJES_TT = db.transaction([mensajes.v[DB_VERSION]], 'readwrite');

  const newFile = { id: 1, name: 'file2.txt', type: 'txt', size: 1024, url: 'https://www.google.com' };
  // const newFile = null;
  const newMsj = {
    text: inputValue,
    createdAt: Date.now(),
    user: { _id: `${currentUser.emp_ruc}-${currentUser.id}`, name: 'Jose' },
    file: newFile,
  };

  MENSAJES_TT.onerror = (event) => {
    notas.appendChild(li(`Error al añadir la tarea: ${event.target.error}`));
  };

  const MSJ_OBS = MENSAJES_TT.objectStore(mensajes.v[DB_VERSION]);

  MSJ_OBS.add(newMsj).onsuccess = (event) => {
    notas.appendChild(li('Consulta exitosa'));
    inputValue = '';
  };

  MENSAJES_TT.oncomplete = (event) => {
    notas.appendChild(li('Todo hecho, se ha añadido'));

    // IDBCursor ---------------------------------
    // const NAME_OBS_REQUEST = MSJ_OBS.openCursor();
    // NAME_OBS_REQUEST.onsuccess = (event) => {
    //   const mensaje = event.target.result;
    //   if (mensaje) {
    //     const { text, key } = mensaje.value;
    //     const list = lista.appendChild(li(p(text)));
    //     list.appendChild(button('Eliminar', handleDeleteTask, key));
    //     list.appendChild(button('Actualizar', handleUpdateTask, key));
    //     mensaje.continue();
    //   }
    // };
  };
}

function handleDeleteTask(e) {
  e.preventDefault();

  console.log('Eliminar tarea');
}

function handleUpdateTask(e) {
  e.preventDefault();

  const { key } = e.target.dataset;
  let inputValue = input.value.trim();
  if (inputValue === '') {
    notas.appendChild(li('Ingrese el nombre de la tarea'));
    return;
  }

  const MENSAJES_TT = db.transaction([mensajes.v[DB_VERSION]], 'readwrite');

  const newFile = { id: inputValue.length, name: 'file2.txt', type: 'txt', size: 1024, url: 'https://www.google.com' };
  // const newFile = null;
  const newMsj = {
    text: inputValue,
    createdAt: Date.now(),
    user: { _id: `${currentUser.emp_ruc}-${currentUser.id}`, name: 'Jose' },
    file: newFile,
  };

  MENSAJES_TT.onerror = (event) => {
    notas.appendChild(li(`Error al añadir la tarea: ${event.target.error}`));
  };

  const MSJ_OBS = MENSAJES_TT.objectStore(mensajes.v[DB_VERSION]);

  MSJ_OBS.put(newMsj).onsuccess = (event) => {
    notas.appendChild(li('Consulta exitosa, Actualizado'));
    inputValue = '';
  };

  MENSAJES_TT.oncomplete = () => {
    notas.appendChild(li('Todo hecho se ha actualizado'));

    // IDBCursor ---------------------------------
    // const MENSAJES_TT2 = db.transaction([mensajes.v[DB_VERSION]], 'readonly');
    // const MSJ_OBS2 = MENSAJES_TT2.objectStore(mensajes.v[DB_VERSION]);
    // const MSJ_OBS_REQUEST = MSJ_OBS2.openCursor();
    // MSJ_OBS_REQUEST.onsuccess = (event) => {
    //   const mensaje = event.target.result;
    //   console.log('mensaje', mensaje);
    //   if (mensaje) {
    //     const { text } = mensaje.value;
    //     const list = lista.appendChild(li(p(text)));
    //     list.appendChild(button('Eliminar', handleDeleteTask, key));
    //     list.appendChild(button('Actualizar', handleUpdateTask, key));
    //     mensaje.continue();
    //   }
    // };
  };
}

function li(note) {
  const li = el('li');
  if (note instanceof HTMLElement) li.appendChild(note);
  else li.innerHTML = note;
  return li;
}

function p(parr) {
  const parrafo = el('p');
  parrafo.innerHTML = parr;
  return parrafo;
}

function button(text, event, createdAt) {
  const button = el('button');
  button.innerHTML = text;
  button.type = 'button';
  button.addEventListener('click', event, false);
  button.dataset.createdAt = createdAt;
  return button;
}

formulario.addEventListener('submit', handleAddTask, false);

// if (Notification.permission === 'denied' || Notification.permission === 'default') {
//   notificacion.style.display = 'block';
// } else {
//   notificacion.style.display = 'none';
// }
