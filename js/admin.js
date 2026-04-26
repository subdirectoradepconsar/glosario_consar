// --- SECCIÓN DE AUTENTICACIÓN ---

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

window.handleLogin = async () => {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;
    try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);
    } catch (error) {
        mostrarToast("Credenciales incorrectas.");
    }
};

window.handleLogout = () => {
    if (confirm("¿Cerrar sesión administrativa?")) {
        firebase.auth().signOut();
    }
};
// Permitir el login presionando la tecla "Enter"
const camposLogin = [
    document.getElementById('admin-email'), 
    document.getElementById('admin-password')
];

camposLogin.forEach(campo => {
    campo.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            // Prevenir comportamiento por defecto y ejecutar el login
            event.preventDefault();
            window.handleLogin();
        }
    });
});

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
        if (data[id].concepto.toLowerCase().trim() === conceptoNormalizado && id !== idActual) return true;
    }
    return false;
}

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

// LÓGICA DE ENVÍO CON LOADING STATE
formulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnGuardar = document.getElementById('btn-guardar');
    const textoOriginal = btnGuardar.innerText;

    // Activar Loading
    btnGuardar.disabled = true;
    btnGuardar.innerText = "Guardando...";

    try {
        const conceptoInput = document.getElementById('concepto').value;
        const definicionInput = document.getElementById('definicion').value;

        const duplicado = await esDuplicado(conceptoInput, editandoId);
        if (duplicado) {
            mostrarToast("¡Error! Ya existe un término con ese nombre.");
            return;
        }

        const referencias = [];
        const inputsNombres = document.querySelectorAll('.ref-nombre');
        const inputsUrls = document.querySelectorAll('.ref-url');
        for (let i = 0; i < inputsNombres.length; i++) {
            if (inputsNombres[i].value.trim() !== "") {
                referencias.push({ nombre: inputsNombres[i].value, url: inputsUrls[i].value });
            }
        }

        const nuevoTermino = { concepto: conceptoInput, definicion: definicionInput, referencias: referencias };

        if (editandoId) {
            await db_actualizarTermino(editandoId, nuevoTermino);
            mostrarToast("Término actualizado con éxito");
        } else {
            await db_guardarTermino(nuevoTermino);
            mostrarToast("Guardado con éxito");
        }
        
        cerrarModal(); // Cierra el modal automáticamente al terminar
    } catch (error) {
        mostrarToast("Error al guardar: " + error.message);
    } finally {
        // Desactivar Loading
        btnGuardar.disabled = false;
        btnGuardar.innerText = textoOriginal;
    }
});

// Renderizado de tarjetas
db_obtenerTerminos((datos) => {
    contenedor.innerHTML = '';
    if (datos) {
        for (let id in datos) {
            const refsString = encodeURIComponent(JSON.stringify(datos[id].referencias || []));
            contenedor.innerHTML += `
                <div class="tarjeta">
                    <h3>${datos[id].concepto}</h3>
                    <p>${datos[id].definicion}</p>
                    <button type="button" onclick="prepararEdicion('${id}','${datos[id].concepto.replace(/'/g, "\\'")}','${datos[id].definicion.replace(/'/g, "\\'")}', '${refsString}')">Editar</button>
                    <button type="button" onclick="eliminar('${id}')">Eliminar</button>
                </div>
            `;
        }
    }
});

// MODAL Y EDICIÓN
window.abrirModal = () => document.getElementById('modal-admin').style.display = 'flex';

window.cerrarModal = () => {
    document.getElementById('modal-admin').style.display = 'none';
    cancelarEdicion();
};

window.prepararEdicion = (id, concepto, definicion, refsString) => {
    document.getElementById('concepto').value = concepto;
    document.getElementById('definicion').value = definicion;
    const container = document.getElementById('referencias-container');
    container.innerHTML = '';
    const referencias = JSON.parse(decodeURIComponent(refsString));
    referencias.forEach(ref => agregarCampoReferencia(ref.nombre, ref.url));

    document.getElementById('btn-guardar').innerText = "Actualizar Cambios";
    document.getElementById('btn-cancelar').style.display = "inline-block";
    editandoId = id;
    abrirModal(); // Abre el modal automáticamente
}

window.cancelarEdicion = () => {
    formulario.reset();
    document.getElementById('referencias-container').innerHTML = '';
    document.getElementById('btn-guardar').innerText = "Guardar Término";
    document.getElementById('btn-cancelar').style.display = "none";
    editandoId = null;
};

window.eliminar = async (id) => {
    if (confirm("¿Estás seguro de eliminar este término?")) {
        try {
            await db_eliminarTermino(id);
            mostrarToast("Término eliminado");
        } catch (error) {
            mostrarToast("Error al eliminar.");
        }
    }
};

// --- UTILIDADES ---
function mostrarToast(mensaje) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.getElementById('admin-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.tarjeta').forEach(tarjeta => {
        tarjeta.style.display = tarjeta.innerText.toLowerCase().includes(query) ? 'block' : 'none';
    });
});