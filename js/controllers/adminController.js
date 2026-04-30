// --- CONTROLADOR: CEREBRO DE LA APLICACIÓN ---
let editandoId = null;

/**
 * 1. Observador de Autenticación
 * Controla qué sección ve el usuario basándose en el estado de Firebase.
 */
firebase.auth().onAuthStateChanged((user) => {
    adminView.toggleAuthScreens(user);
    if (user) {
        // Carga inicial de datos al estar logueado
        db_obtenerTerminos((datos) => {
            adminView.renderizarTarjetas(datos);
        });
    }
});

/**
 * 2. Funciones Globales para HTML (onclick)
 * Exponemos estas funciones al objeto window para que los "onclick" del HTML las encuentren.
 */
window.handleLogin = async () => {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;
    try {
        await auth_login(email, pass);
    } catch (error) {
        adminView.mostrarToast("Credenciales incorrectas o error de conexión.");
    }
};

window.handleLogout = () => {
    if (confirm("¿Deseas cerrar la sesión administrativa?")) {
        auth_logout();
    }
};

window.abrirModal = () => {
    editandoId = null; // Reset para asegurar que es un nuevo término
    adminView.limpiarFormulario();
    adminView.abrirModal();
};

window.cerrarModal = () => {
    adminView.cerrarModal();
};

/**
 * IMPORTANTE: Sincronizado con adminView.getFormData
 * Esta función crea la estructura que la vista necesita para recolectar datos.
 */
window.agregarCampoReferencia = (nombre = '', url = '') => {
    const container = document.getElementById('referencias-container');
    if (!container) return;

    const div = document.createElement('div');
    // CLAVE: "ref-input-group" es la clase que busca la vista
    div.className = 'ref-input-group'; 
    div.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
    
    div.innerHTML = `
        <input type="text" placeholder="Nombre (ej. DOF)" value="${nombre}" class="ref-nombre" style="flex: 1; padding: 5px;">
        <input type="url" placeholder="URL del enlace" value="${url}" class="ref-url" style="flex: 2; padding: 5px;">
        <button type="button" onclick="this.parentElement.remove()" style="background: #ff4d4d; color: white; border: none; cursor: pointer; padding: 5px 10px;">X</button>
    `;
    container.appendChild(div);
};

/**
 * 3. Manejo del Formulario (Guardar/Actualizar)
 */
adminView.formulario?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnGuardar = document.getElementById('btn-guardar');
    const textoOriginal = btnGuardar.innerText;

    btnGuardar.disabled = true;
    btnGuardar.innerText = "Procesando...";

    try {
        // Obtenemos los datos ya procesados por la vista (incluyendo el array de referencias)
        const datos = adminView.getFormData();
        
        if (editandoId) {
            await db_actualizarTermino(editandoId, datos);
            adminView.mostrarToast("Término actualizado correctamente.");
        } else {
            await db_guardarTermino(datos);
            adminView.mostrarToast("Término guardado con éxito.");
        }
        
        adminView.cerrarModal();
        editandoId = null;
    } catch (error) {
        adminView.mostrarToast("Error al procesar: " + error.message);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerText = textoOriginal;
    }
});

/**
 * 4. Funciones de Edición y Eliminación (Desde Tarjetas)
 */
window.prepararEdicion = (id, concepto, definicion, refsString) => {
    // Limpieza previa necesaria
    adminView.limpiarFormulario();

    document.getElementById('concepto').value = concepto;
    document.getElementById('definicion').value = definicion;
    
    // Poblar referencias dinámicamente
    try {
        const referencias = JSON.parse(decodeURIComponent(refsString));
        if (Array.isArray(referencias)) {
            referencias.forEach(ref => window.agregarCampoReferencia(ref.nombre, ref.url));
        }
    } catch (e) {
        console.error("Error al procesar referencias en edición:", e);
    }

    // Actualizar interfaz para modo edición
    const btnGuardar = document.getElementById('btn-guardar');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    if (btnGuardar) btnGuardar.innerText = "Actualizar Cambios";
    if (btnCancelar) btnCancelar.style.display = "inline-block";
    
    editandoId = id;
    adminView.abrirModal();
};

window.eliminar = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este término? Esta acción no se puede deshacer.")) {
        try {
            await db_eliminarTermino(id);
            adminView.mostrarToast("Término eliminado del glosario.");
        } catch (error) {
            adminView.mostrarToast("Error al eliminar.");
        }
    }
};

/**
 * 5. Utilidades (Buscador)
 */
document.getElementById('admin-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const tarjetas = document.querySelectorAll('.tarjeta');
    tarjetas.forEach(t => {
        const texto = t.innerText.toLowerCase();
        t.style.display = texto.includes(query) ? 'block' : 'none';
    });
});