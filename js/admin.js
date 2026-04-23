// --- SECCIÓN DE AUTENTICACIÓN ---

// 1. Observador: Controla qué ver en pantalla (Login o Panel)
firebase.auth().onAuthStateChanged((user) => {
    const loginSec = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');

    if (user) {
        loginSec.style.display = 'none';
        adminPanel.style.display = 'block';
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
        alert("Credenciales incorrectas.");
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

async function esDuplicado(concepto, idActual) {
    const snapshot = await firebase.database().ref('glosario').once('value');
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

// NUEVO: Función para agregar campos dinámicos
window.agregarCampoReferencia = (nombre = "", url = "") => {
    const container = document.getElementById('referencias-container');
    const div = document.createElement('div');
    div.className = 'ref-input-group';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';

    div.innerHTML = `
        <input type="text" placeholder="Nombre del enlace" value="${nombre}" class="ref-nombre" style="flex: 1; padding: 5px;">
        <input type="url" placeholder="URL del enlace" value="${url}" class="ref-url" style="flex: 2; padding: 5px;">
        <button type="button" onclick="this.parentElement.remove()" style="background:#ff4d4d; color:white; border:none; cursor:pointer; padding: 5px 10px;">X</button>
    `;
    container.appendChild(div);
}

// Acciones al enviar el formulario (ACTUALIZADO PARA REFERENCIAS)
formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const conceptoInput = document.getElementById('concepto').value;
    const definicionInput = document.getElementById('definicion').value;

    const duplicado = await esDuplicado(conceptoInput, editandoId);
    if (duplicado) {
        alert("¡Error! Ya existe un término con ese nombre.");
        return;
    }

    // Recolectar referencias
    const referencias = [];
    const inputsNombres = document.querySelectorAll('.ref-nombre');
    const inputsUrls = document.querySelectorAll('.ref-url');

    for (let i = 0; i < inputsNombres.length; i++) {
        if (inputsNombres[i].value.trim() !== "") {
            referencias.push({
                nombre: inputsNombres[i].value,
                url: inputsUrls[i].value
            });
        }
    }

    const nuevoTermino = {
        concepto: conceptoInput,
        definicion: definicionInput,
        referencias: referencias // Guardamos el array aquí
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
        document.getElementById('referencias-container').innerHTML = ''; // Limpiar campos al terminar
    } catch (error) {
        alert("Error al guardar.");
    }
});

// Al cargar se imprimen los datos (ACTUALIZADO PARA PASAR REFERENCIAS)
db_obtenerTerminos((datos) => {
    contenedor.innerHTML = '';
    if (datos) {
        for (let id in datos) {
            // Codificamos las referencias para pasarlas al botón de editar de forma segura
            const refsString = encodeURIComponent(JSON.stringify(datos[id].referencias || []));

            contenedor.innerHTML += `
                <div class="tarjeta">
        <h3>${datos[id].concepto}</h3>
        <p>${datos[id].definicion}</p>
                <button type="button" onclick="prepararEdicion('${id}','${datos[id].concepto.replace(/'/g, "\\'")}','${datos[id].definicion.replace(/'/g, "\\'")}', '${refsString}')">
                    Editar
                </button>
                
                <button type="button" onclick="eliminar('${id}')">
                    Eliminar
                </button>
            </div>
            `;
        }
    }
});

// Preparar edición (ACTUALIZADO PARA CARGAR REFERENCIAS)
window.prepararEdicion = (id, concepto, definicion, refsString) => {
    document.getElementById('concepto').value = concepto;
    document.getElementById('definicion').value = definicion;

    // Limpiamos referencias previas en el formulario
    const container = document.getElementById('referencias-container');
    container.innerHTML = '';

    // Decodificamos y cargamos las referencias existentes
    const referencias = JSON.parse(decodeURIComponent(refsString));
    referencias.forEach(ref => {
        agregarCampoReferencia(ref.nombre, ref.url);
    });

    document.getElementById('btn-guardar').innerText = "Actualizar Cambios";
    document.getElementById('btn-cancelar').style.display = "inline-block";
    editandoId = id;
    window.scrollTo(0, 0);
}

window.cancelarEdicion = () => {
    formulario.reset();
    document.getElementById('referencias-container').innerHTML = ''; // Limpiar referencias al cancelar
    document.getElementById('btn-guardar').innerText = "Guardar Término";
    document.getElementById('btn-cancelar').style.display = "none";
    editandoId = null;
};

window.eliminar = async (id) => {
    if (confirm("¿Estás seguro de eliminar este término?")) {
        try {
            await db_eliminarTermino(id);
        } catch (error) {
            alert("Error al eliminar.");
        }
    }
};