// --- SECCIÓN DE AUTENTICACIÓN ---

// 1. Observador: Controla qué ver en pantalla (Login o Panel)
firebase.auth().onAuthStateChanged((user) => {
    const loginSec = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');

    if (user) {
        // Si hay usuario, mostramos el panel y ocultamos el login
        loginSec.style.display = 'none';
        adminPanel.style.display = 'block';
        console.log("Sesión activa:", user.email);
    } else {
        // Si no hay usuario, mostramos login y ocultamos el panel
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
        console.log("Acceso concedido");
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


// --- SECCIÓN DE GESTIÓN DEL GLOSARIO (Tu código original) ---

const formulario = document.getElementById('formulario-glosario');
const contenedor = document.getElementById('contenedor-terminos');

let editandoId = null;

formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevoTermino = {
        concepto: document.getElementById('concepto').value,
        definicion: document.getElementById('definicion').value
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
        alert("No tienes permisos para realizar esta acción o hubo un error.");
    }
});

// Escuchar cambios en la base de datos
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