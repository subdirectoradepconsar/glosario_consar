// configuracion para base de datos en firebase

const firebaseConfig = {
    apiKey: "AIzaSyCBEcgyGMC_NkSms-NeKq1H0FMpOWYbkQI",
    authDomain: "diccionario-consar.firebaseapp.com",
    databaseURL: "https://diccionario-consar-default-rtdb.firebaseio.com",
    projectId: "diccionario-consar",
    storageBucket: "diccionario-consar.firebasestorage.app",
    messagingSenderId: "440062937021",
    appId: "1:440062937021:web:c78f6309f79c228d12f4d4"
};

// INICIALIZACIÓN CORRECTA
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Capa de abstraccion 

// Guardar (Create)
const db_guardarTermino = async (objetoData) => {
    return db.ref('glosario').push(objetoData);
};

// Escuchar cambios (Read)
const db_obtenerTerminos = (useCallback) => {
    db.ref('glosario').on('value', (snapshot) => {
        const data = snapshot.val();
        useCallback(data);
    })
};

// Eliminar (Delete)
const db_eliminarTermino = async (id) => {
    return db.ref(`glosario/${id}`).remove();
};

// Actualizar (Update)
const db_actualizarTermino = async (id, nuevosDatos) => {
    return db.ref(`glosario/${id}`).update(nuevosDatos);
};