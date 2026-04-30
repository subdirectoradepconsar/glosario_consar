const adminView = {
    formulario: document.getElementById('formulario-glosario'),
    contenedor: document.getElementById('contenedor-terminos'),
    loginSec: document.getElementById('login-section'),
    adminPanel: document.getElementById('admin-panel'),

    toggleAuthScreens: (user) => {
        if (user) {
            adminView.loginSec.style.display = 'none';
            adminView.adminPanel.style.display = 'block';
        } else {
            adminView.loginSec.style.display = 'block';
            adminView.adminPanel.style.display = 'none';
        }
    },

    getFormData: () => {
        const referencias = [];
        const grupos = document.querySelectorAll('.ref-input-group');
        
        grupos.forEach(grupo => {
            const nombreInput = grupo.querySelector('.ref-nombre');
            const urlInput = grupo.querySelector('.ref-url');
            
            if (nombreInput && nombreInput.value.trim() !== "") {
                referencias.push({ 
                    nombre: nombreInput.value.trim(), 
                    url: urlInput ? urlInput.value.trim() : "" 
                });
            }
        });

        return {
            concepto: document.getElementById('concepto').value.trim(),
            definicion: document.getElementById('definicion').value.trim(),
            referencias: referencias
        };
    },

    limpiarFormulario: () => {
        if(adminView.formulario) adminView.formulario.reset();
        const container = document.getElementById('referencias-container');
        if(container) container.innerHTML = '';
        document.getElementById('btn-guardar').innerText = "Guardar Término";
        document.getElementById('btn-cancelar').style.display = "none";
    },

    abrirModal: () => {
        const modal = document.getElementById('modal-admin');
        if(modal) modal.style.display = 'flex';
    },
    
    cerrarModal: () => {
        const modal = document.getElementById('modal-admin');
        if(modal) modal.style.display = 'none';
        adminView.limpiarFormulario();
    },

    mostrarToast: (mensaje) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = mensaje;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    renderizarTarjetas: (datos) => {
        if(!adminView.contenedor) return;
        adminView.contenedor.innerHTML = '';
        if (datos) {
            for (let id in datos) {
                const item = datos[id];
                const refsArray = item.referencias || [];
                const refsString = encodeURIComponent(JSON.stringify(refsArray));
                
                adminView.contenedor.innerHTML += `
                    <div class="tarjeta">
                        <h3>${item.concepto}</h3>
                        <p>${item.definicion}</p>
                        <button type="button" onclick="prepararEdicion('${id}','${item.concepto.replace(/'/g, "\\'")}','${item.definicion.replace(/'/g, "\\'")}', '${refsString}')">Editar</button>
                        <button type="button" onclick="eliminar('${id}')">Eliminar</button>
                    </div>
                `;
            }
        }
    }
};