// --- SECCIÓN DE AUTENTICACIÓN ---

// 1. Observador: Controla qué ver en pantalla (Login o Panel)
firebase.auth().onAuthStateChanged((user) => {
    const loginSec = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');

    if (user) {
        loginSec.style.display = 'none';
        adminPanel.style.display = 'block';
        console.log("Sesión activa:", user.email);
    } else {
        loginSec.style.display = 'block';
        adminPanel.style.display = 'none';
    }
});

// 2. Función para Iniciar Sesión
window.handleLogin = async () => {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;

    try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);
    } catch (error) {
        alert("Credenciales incorrectas. Intente de nuevo.");
        console.error("Error de login:", error.message);
    }
};

// 3. Función para Cerrar Sesión
window.handleLogout = () => {
    if (confirm("¿Cerrar sesión administrativa?")) {
        firebase.auth().signOut();
    }
};


// --- SECCIÓN DE GESTIÓN DEL GLOSARIO ---

const formulario = document.getElementById('formulario-glosario');
const contenedor = document.getElementById('contenedor-terminos');

let editandoId = null;

// Función para verificar si el término ya existe
async function esDuplicado(concepto, idActual) {
    const snapshot = await firebase.database().ref('glosario').once('value');
    const data = snapshot.val();
    
    if (!data) return false;

    const conceptoNormalizado = concepto.toLowerCase().trim();

    for (let id in data) {
        // Comparamos el nombre. Si el id es distinto al que estamos editando, es un duplicado real
        if (data[id].concepto.toLowerCase().trim() === conceptoNormalizado && id !== idActual) {
            return true;
        }
    }
    return false;
}

// Acciones al enviar el formulario
formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const conceptoInput = document.getElementById('concepto').value;
    const definicionInput = document.getElementById('definicion').value;

    // --- VALIDACIÓN DE DUPLICADOS ---
    const duplicado = await esDuplicado(conceptoInput, editandoId);
    if (duplicado) {
        alert("¡Error! Ya existe un término con ese nombre en el glosario.");
        return; // Detenemos el guardado
    }

    const nuevoTermino = {
        concepto: conceptoInput,
        definicion: definicionInput
    };

    try {
        if (editandoId) {
            await db_actualizarTermino(editandoId, nuevoTermino);
            alert("Término actualizado con éxito");
            
            editandoId = null;
            document.getElementById('btn-guardar').innerText = "Guardar Término";
            document.getElementById('btn-cancelar').style.display = "none";
        } else {
            await db_guardarTermino(nuevoTermino);
            alert("Guardado con éxito");
        }
        formulario.reset();
    } catch (error) {
        console.error("Error en la operación:", error);
        alert("No tienes permisos o hubo un error al guardar.");
    }
});

// Al cargar se imprimen los datos en pantalla
db_obtenerTerminos((datos) => {
    contenedor.innerHTML = '';
    if (datos) {
        for (let id in datos) {
            contenedor.innerHTML += `
                <div class="tarjeta">
                    <h3>${datos[id].concepto}</h3>
                    <p>${datos[id].definicion}</p>
                    <button onclick="prepararEdicion('${id}','${datos[id].concepto}','${datos[id].definicion}')">Editar</button>
                    <button onclick="eliminar('${id}')">Eliminar</button>
                </div>
            `;
        }
    }
});

window.prepararEdicion = (id, concepto, definicion) => {
    document.getElementById('concepto').value = concepto;
    document.getElementById('definicion').value = definicion;
    document.getElementById('btn-guardar').innerText = "Actualizar Cambios";
    document.getElementById('btn-cancelar').style.display = "inline-block";
    editandoId = id;
    window.scrollTo(0, 0);
}

window.cancelarEdicion = () => {
    formulario.reset();
    document.getElementById('btn-guardar').innerText = "Guardar Término";
    document.getElementById('btn-cancelar').style.display = "none";
    editandoId = null;
};

window.eliminar = async (id) => {
    if (confirm("¿Estás seguro de eliminar este término?")) {
        try {
            await db_eliminarTermino(id);
        } catch (error) {
            alert("Error al eliminar. Asegúrate de tener sesión iniciada.");
        }
    }
};