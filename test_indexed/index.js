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
  users: {
    v: { [DB_VERSION]: 'users-V1' },
    keyPath: 'id',
  },
  files: {
    v: { [DB_VERSION]: 'files-V1' },
    keyPath: 'id',
  },
};
const { mensajes, users, files } = TABLES;
const currentUser = { id: 3, name: 'Jose', emp_ruc: '123456789' };

const usersData = [
  { id: 1, name: 'Pepe', emp_ruc: '123456789' },
  { id: 2, name: 'Maria', emp_ruc: '123456789' },
  { id: 3, name: 'Jose', emp_ruc: '123456789' },
  { id: 4, name: 'Juan', emp_ruc: '123456789' },
  { id: 5, name: 'Luis', emp_ruc: '123456789' },
];

const idb = window.indexedDB.open(DB_NAME, DB_VERSION);

idb.onerror = (event) => {
  console.error(event.target);
  notas.appendChild(li('Error al iniciar la base de datos'));
};

idb.onsuccess = (event) => {
  notas.appendChild(li('Base de datos creada'));

  db = event.target.result;

  insertUsers();
  inserMessages();
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
    const msjStore = db.createObjectStore(mensajes.v[DB_VERSION], { keyPath: mensajes.keyPath });
    msjStore.createIndex('createdAt', 'createdAt', { unique: false });
    msjStore.createIndex('text', 'text', { unique: false });
    msjStore.createIndex('userId', 'userId', { unique: false });
    msjStore.createIndex('fileId', 'fileId', { unique: false });

    const userStore = db.createObjectStore(users.v[DB_VERSION], { keyPath: users.keyPath });
    userStore.createIndex('name', 'name', { unique: false });
    userStore.createIndex('emp_ruc', 'emp_ruc', { unique: false });

    const fileStore = db.createObjectStore(files.v[DB_VERSION], { keyPath: files.keyPath });
    fileStore.createIndex('name', 'name', { unique: false });
    fileStore.createIndex('type', 'type', { unique: false });
    fileStore.createIndex('size', 'size', { unique: false });
    fileStore.createIndex('url', 'url', { unique: false });
  }

  notas.appendChild(li('Objeto almacenado creado'));
};

async function inserMessages() {
  const mensajes_sql = await fetch('./mensajes.json');
  const mensajes_json = await mensajes_sql.json();
  console.log('mensajes_json', mensajes_json);

  const MENSAJES_TT = db.transaction([mensajes.v[DB_VERSION], files.v[DB_VERSION]], 'readwrite');
  const MSJ_OBS = MENSAJES_TT.objectStore(mensajes.v[DB_VERSION]);

  // mensajes_json.forEach((mensaje) => MSJ_OBS.add(mensaje));

  // MENSAJES_TT.oncomplete = (event) => {
  //   notas.appendChild(li('Mensajes creados'));
  //   displayData();
  // };
}

async function displayData() {
  const MENSAJES_TT = db.transaction([users.v[DB_VERSION], mensajes.v[DB_VERSION], files.v[DB_VERSION]], 'readonly');
  const MSJ_OBS = MENSAJES_TT.objectStore(mensajes.v[DB_VERSION]);

  // IDBCursor ---------------------------------
  const NAME_OBS_REQUEST = MSJ_OBS.openCursor();
  NAME_OBS_REQUEST.onsuccess = (event) => {
    const mensaje = event.target.result;
    if (mensaje) {
      const { text } = mensaje.value;
      lista.appendChild(li(p(text))).appendChild(button('Eliminar'));
      mensaje.continue();
    }
  };

  // IDBIndex / IDBObjectStore ---------------------------------
  try {
    const message = await getMessageForId(1);
    console.log('message', message);
  } catch (error) {
    console.log('error', error);
  }
}

async function getMessageForId(Id) {
  return new Promise((resolve, reject) => {
    const MENSAJES_TT = db.transaction([mensajes.v[DB_VERSION], users.v[DB_VERSION], files.v[DB_VERSION]], 'readonly');
    const MSJ_OBS = MENSAJES_TT.objectStore(mensajes.v[DB_VERSION]);
    const USERS_OBS = MENSAJES_TT.objectStore(users.v[DB_VERSION]);
    const FILES_OBS = MENSAJES_TT.objectStore(files.v[DB_VERSION]);
    const MSJ_OBS_REQUEST = MSJ_OBS.get(Id);

    MSJ_OBS_REQUEST.onsuccess = (event) => {
      const mensaje = event.target.result;
      if (mensaje == null) return reject('No hay mensaje');
      const userIdParse = Number(mensaje.userId.split('-')[1]);
      const USER_OBJ_REQUEST = USERS_OBS.get(userIdParse);

      USER_OBJ_REQUEST.onsuccess = (event) => {
        const user = event.target.result;
        if (user == null) return reject('No hay usuario');
        const { userId, ...msjwu } = mensaje;
        if (mensaje.fileId) {
          const FILE_OBJ_REQUEST = FILES_OBS.get(mensaje.fileId);
          FILE_OBJ_REQUEST.onsuccess = (event) => {
            const file = event.target.result;
            if (file == null) return;
            const { fileId, ...msjwf } = msjwu;
            resolve({
              ...msjwf,
              user,
              file,
            });
          };
        } else {
          resolve(msjwu);
        }
      };
    };
  });
}

function insertUsers() {
  const USERS_TT = db.transaction([users.v[DB_VERSION]], 'readwrite');

  const USERS_OBS = USERS_TT.objectStore(users.v[DB_VERSION]);

  console.log('USERS_OBS.autoIncrement', USERS_OBS.autoIncrement);

  usersData.forEach((user) => USERS_OBS.add(user));

  USERS_TT.oncomplete = (event) => {
    notas.appendChild(li('Usuarios creados'));
  };
}

function handleAddTask(e) {
  e.preventDefault();

  if (input.value === '') {
    notas.appendChild(li('Ingrese el nombre de la tarea'));
    return;
  }

  const MENSAJES_TT = db.transaction([mensajes.v[DB_VERSION], files.v[DB_VERSION]], 'readwrite');

  // const newFile = { id: 2, name: 'file2.txt', type: 'txt', size: 1024, url: 'https://www.google.com' };
  const newFile = null;
  const newMsj = {
    id: 1,
    text: input.value,
    createdAt: Date.now(),
    userId: `${currentUser.emp_ruc}-${currentUser.id}`,
    fileId: newFile ? newFile.id : null,
  };

  MENSAJES_TT.onerror = (event) => {
    notas.appendChild(li(`Error al añadir la tarea: ${event.target.error}`));
  };

  const MSJ_OBS = MENSAJES_TT.objectStore(mensajes.v[DB_VERSION]);
  const FILES_OBS = MENSAJES_TT.objectStore(files.v[DB_VERSION]);

  if (newFile) {
    FILES_OBS.add(newFile).onsuccess = (event) => {
      console.log('Archivo exitoso');

      MSJ_OBS.add(newMsj).onsuccess = (event) => {
        notas.appendChild(li('Consulta exitosa'));
        input.value = '';
      };
    };
  } else {
    MSJ_OBS.add(newMsj).onsuccess = (event) => {
      notas.appendChild(li('Consulta exitosa'));
      input.value = '';
    };
  }

  MENSAJES_TT.oncomplete = (event) => {
    notas.appendChild(li('Todo hecho'));
    displayData();
  };
}

function handleDeleteTask(e) {
  e.preventDefault();

  console.log('Eliminar tarea');
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

function button(text) {
  const button = el('button');
  button.innerHTML = text;
  button.type = 'button';
  button.addEventListener('click', handleDeleteTask, false);
  return button;
}

formulario.addEventListener('submit', handleAddTask, false);

// if (Notification.permission === 'denied' || Notification.permission === 'default') {
//   notificacion.style.display = 'block';
// } else {
//   notificacion.style.display = 'none';
// }
