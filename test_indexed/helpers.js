
// async function getMessageForId(Id) {
//   return new Promise((resolve, reject) => {
//     const MENSAJES_TT = db.transaction([mensajes.v[DB_VERSION], users.v[DB_VERSION], files.v[DB_VERSION]], 'readonly');
//     const MSJ_OBS = MENSAJES_TT.objectStore(mensajes.v[DB_VERSION]);
//     const USERS_OBS = MENSAJES_TT.objectStore(users.v[DB_VERSION]);
//     const FILES_OBS = MENSAJES_TT.objectStore(files.v[DB_VERSION]);
//     const MSJ_OBS_REQUEST = MSJ_OBS.get(Id);

//     MSJ_OBS_REQUEST.onsuccess = (event) => {
//       const mensaje = event.target.result;
//       if (mensaje == null) return reject('No hay mensaje');
//       const userIdParse = Number(mensaje.userId.split('-')[1]);
//       const USER_OBJ_REQUEST = USERS_OBS.get(userIdParse);

//       USER_OBJ_REQUEST.onsuccess = (event) => {
//         const user = event.target.result;
//         if (user == null) return reject('No hay usuario');
//         const { userId, ...msjwu } = mensaje;
//         if (mensaje.fileId) {
//           const FILE_OBJ_REQUEST = FILES_OBS.get(mensaje.fileId);
//           FILE_OBJ_REQUEST.onsuccess = (event) => {
//             const file = event.target.result;
//             if (file == null) return;
//             const { fileId, ...msjwf } = msjwu;
//             resolve({
//               ...msjwf,
//               user,
//               file,
//             });
//           };
//         } else {
//           resolve(msjwu);
//         }
//       };
//     };
//   });
// }
