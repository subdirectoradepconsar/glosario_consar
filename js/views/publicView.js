// --- VISTA PÚBLICA: RENDERIZADO DEL DICCIONARIO ---

const publicView = {
    glossaryContainer: document.getElementById('glossary-container'),
    searchResults: document.getElementById('search-results'),

    // Renderiza el diccionario A-Z
    renderDiccionario: (terminos) => {
        if (!publicView.glossaryContainer) return;
        
        // Ordenar alfabéticamente
        terminos.sort((a, b) => a.nombre.localeCompare(b.nombre));

        const grupos = {};
        terminos.forEach(item => {
            const letra = item.nombre.charAt(0).toUpperCase();
            if (!grupos[letra]) grupos[letra] = [];
            grupos[letra].push(item);
        });

        let htmlFinal = "";
        "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("").forEach(letra => {
            if (grupos[letra]) {
                htmlFinal += `
                    <div id="${letra}" class="letra-seccion">
                        <h2 class="letra-titulo">${letra}</h2>
                        <ul class="lista-terminos">
                            ${grupos[letra].map(t => `
                                <li onclick="seleccionarTermino('${t.id}')">${t.nombre}</li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
        });
        publicView.glossaryContainer.innerHTML = htmlFinal;
        publicView.actualizarNavAbecedario(grupos);
    },

    // Pinta de gris las letras sin términos en el menú
    actualizarNavAbecedario: (grupos) => {
        const linksNavegacion = document.querySelectorAll('.lista_nav li a');
        linksNavegacion.forEach(link => {
            const letraEnlace = link.innerText.toUpperCase();
            if (!grupos[letraEnlace]) {
                link.classList.add('letra-inactiva');
            } else {
                link.classList.remove('letra-inactiva');
            }
        });
    },

    // Muestra la lista flotante del buscador
    mostrarSugerencias: (lista) => {
        if (!publicView.searchResults) return;
        if (lista.length === 0) {
            publicView.searchResults.innerHTML = "<div class='no-results'>No se encontraron términos.</div>";
            return;
        }
        publicView.searchResults.innerHTML = `
            <ul class="suggestions-list">
                ${lista.map(item => `<li onclick="seleccionarTermino('${item.id}')">${item.nombre}</li>`).join('')}
            </ul>
        `;
    },

    // Renderiza el modal con la definición y referencias
    mostrarModalDefinicion: (data) => {
        let modal = document.getElementById('modal-termino');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-termino';
            document.body.appendChild(modal);
        }

        let htmlReferencias = "";
        if (data.referencias && data.referencias.length > 0) {
            htmlReferencias = `
                <div class="referencias-box">
                    <hr> <br>
                    <p><strong>Referencias de consulta:</strong></p>
                    <ul>
                        ${data.referencias.map(ref => `
                            <li><a href="${ref.url}" target="_blank">${ref.nombre}</a></li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="detalle-card">
                    <button class="btn-cerrar" onclick="publicView.cerrarModal()">×</button>
                    <div class="modal-header"><h2>${data.concepto}</h2></div>
                    <hr>
                    <div class="modal-body">
                        <p>${data.definicion}</p>
                        ${htmlReferencias} 
                    </div>
                </div>
            </div>
        `;
    },

    cerrarModal: () => {
        const modal = document.getElementById('modal-termino');
        if (modal) modal.innerHTML = '';
    }
};