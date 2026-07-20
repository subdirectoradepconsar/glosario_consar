let editandoId = null;

firebase.auth().onAuthStateChanged((user) => {
    adminView.toggleAuthScreens(user);
    if (user) {
        db_obtenerTerminos((datos) => {
            adminView.renderizarTarjetas(datos);
        });
    }
});

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
    editandoId = null;
    adminView.limpiarFormulario();
    adminView.abrirModal();
};

window.cerrarModal = () => {
    adminView.cerrarModal();
};

window.agregarCampoReferencia = (nombre = '', url = '') => {
    const container = document.getElementById('referencias-container');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'ref-input-group'; 
    div.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
    
    div.innerHTML = `
        <input type="text" placeholder="Nombre (ej. DOF)" value="${nombre}" class="ref-nombre" style="flex: 1; padding: 5px;">
        <input type="url" placeholder="URL del enlace" value="${url}" class="ref-url" style="flex: 2; padding: 5px;">
        <button type="button" onclick="this.parentElement.remove()" style="background: #ff4d4d; color: white; border: none; cursor: pointer; padding: 5px 10px;">X</button>
    `;
    container.appendChild(div);
};

adminView.formulario?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnGuardar = document.getElementById('btn-guardar');
    const textoOriginal = btnGuardar.innerText;

    btnGuardar.disabled = true;
    btnGuardar.innerText = "Procesando...";

    try {
        const datosFormulario = adminView.getFormData();

        const datosValidados = {
            concepto: datosFormulario.concepto || datosFormulario.nombre || document.getElementById('concepto').value,
            nombre: datosFormulario.concepto || datosFormulario.nombre || document.getElementById('concepto').value,
            definicion: datosFormulario.definicion || document.getElementById('definicion').value,
            referencias: Array.isArray(datosFormulario.referencias) ? datosFormulario.referencias : []
        };
        
        if (editandoId) {
            await db_actualizarTermino(editandoId, datosValidados);
            adminView.mostrarToast("Término actualizado correctamente.");
        } else {
            await db_guardarTermino(datosValidados);
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

window.prepararEdicion = (id, conceptoEnc, definicionEnc, refsString) => {
    adminView.limpiarFormulario();

    let conceptoLimpio = "";
    let definicionLimpia = "";
    let referenciasFinales = [];

    // 1. Decodificamos de forma segura el concepto y la definición
    try {
        conceptoLimpio = decodeURIComponent(conceptoEnc);
    } catch (e) {
        conceptoLimpio = conceptoEnc || "";
    }

    try {
        definicionLimpia = decodeURIComponent(definicionEnc);
    } catch (e) {
        definicionLimpia = definicionEnc || "";
    }

    // 2. Comprobación secundaria vía dataset por si se prefiere leer la tarjeta directamente
    const tarjetaReal = document.querySelector(`[data-id="${id}"]`) || document.getElementById(`tarjeta-${id}`);
    if (tarjetaReal) {
        conceptoLimpio = tarjetaReal.dataset.concepto || tarjetaReal.dataset.nombre || conceptoLimpio;
        definicionLimpia = tarjetaReal.dataset.definicion || definicionLimpia;
        try {
            const dataRefs = tarjetaReal.dataset.referencias;
            if (dataRefs) referenciasFinales = JSON.parse(dataRefs);
        } catch(err) {
            console.log("Usando fallback de referencias");
        }
    }

    // 3. Procesamiento seguro de las referencias
    if (referenciasFinales.length === 0 && refsString) {
        try {
            referenciasFinales = JSON.parse(decodeURIComponent(refsString));
        } catch (e) {
            try {
                referenciasFinales = JSON.parse(refsString);
            } catch(err2) {
                console.error("Error al procesar referencias:", err2);
            }
        }
    }

    // 4. Inyección limpia de los textos en el formulario (conservando saltos de línea)
    document.getElementById('concepto').value = conceptoLimpio;
    document.getElementById('definicion').value = definicionLimpia;
    
    // 5. Carga de los campos de referencias
    if (Array.isArray(referenciasFinales)) {
        referenciasFinales.forEach(ref => {
            if (ref && ref.nombre && ref.url) {
                window.agregarCampoReferencia(ref.nombre, ref.url);
            }
        });
    }

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

document.getElementById('admin-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const tarjetas = document.querySelectorAll('.tarjeta');
    tarjetas.forEach(t => {
        const texto = t.innerText.toLowerCase();
        t.style.display = texto.includes(query) ? 'block' : 'none';
    });
});