const firebaseConfig = {
    apiKey: "AIzaSyCBEcgyGMC_NkSms-NeKq1H0FMpOWYbkQI",
    authDomain: "diccionario-consar.firebaseapp.com",
    databaseURL: "https://diccionario-consar-default-rtdb.firebaseio.com",
    projectId: "diccionario-consar",
    storageBucket: "diccionario-consar.firebasestorage.app",
    messagingSenderId: "440062937021",
    appId: "1:440062937021:web:c78f6309f79c228d12f4d4"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const db_guardarTermino = async (objetoData) => {
    return db.ref('glosario').push(objetoData);
};

// Escuchar cambios (Read)
const db_obtenerTerminos = (useCallback) => {
    db.ref('glosario').on('value', (snapshot) => {
        const data = snapshot.val();
        useCallback(data);
    });
};

// Eliminar (Delete)
const db_eliminarTermino = async (id) => {
    return db.ref(`glosario/${id}`).remove();
};

// Actualizar (Update)
const db_actualizarTermino = async (id, nuevosDatos) => {
    return db.ref(`glosario/${id}`).update(nuevosDatos);
};

async function esDuplicado(concepto, idActual) {
    const snapshot = await db.ref('glosario').once('value');
    const data = snapshot.val();
    if (!data) return false;
    
    const conceptoNormalizado = concepto.toLowerCase().trim();
    for (let id in data) {
        if (data[id].concepto.toLowerCase().trim() === conceptoNormalizado && id !== idActual) {
            return true;
        }
    }
    return false;
}

const auth_login = async (email, pass) => {
    return await firebase.auth().signInWithEmailAndPassword(email, pass);
};

const auth_logout = () => {
    return firebase.auth().signOut();
};