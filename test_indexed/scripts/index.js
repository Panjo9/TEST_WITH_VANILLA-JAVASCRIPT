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

const idb = window.indexedDB.open('Tareas', 1);

idb.onerror = (event) => {
  // console.error(`Error: ${event.target.error?.message}`);
  notas.appendChild(li('Error al iniciar la base de datos'));
};

idb.onsuccess = (event) => {
  notas.appendChild(li('Base de datos creada'));

  db = event.target.result;
};

idb.onupgradeneeded = (event) => {
  db = event.target.result;

  db.onerror = (event) => {
    notas.appendChild(li('Error al cargar la base de datos'));
  };

  const tareas = db.createObjectStore('tareas', { keyPath: 'tarea' });
  tareas.createIndex('name', 'name', { unique: false });

  notas.appendChild(li('Objeto almacenado creado'));
};

function handleAddTask(e) {
  e.preventDefault();

  if (input.value === '') {
    notas.appendChild(li('Ingrese el nombre de la tarea'));
    return;
  }

  const transaction = db.transaction(['tareas'], 'readwrite');

  const newTask = [{ tarea: input.value, name: input.value }];

  transaction.onerror = (event) => {
    notas.appendChild(li(`Error al añadir la tarea: ${transaction.error}`));
  };

  const objectStore = transaction.objectStore('tareas');
  const objectStoreRequest = objectStore.add(newTask[0]);

  objectStoreRequest.onsuccess = (event) => {
    notas.appendChild(li('Consulta exitosa'));
    input.value = '';
  };

  transaction.oncomplete = (event) => {
    notas.appendChild(li('Todo hecho'));
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
