const publicView = {
    glossaryContainer: document.getElementById('glossary-container'),
    searchResults: document.getElementById('search-results'),

    renderDiccionario: (terminos) => {
        if (!publicView.glossaryContainer) return;
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
                    
                    <div style="display: flex; justify-content: flex-end; gap: 15px; margin-bottom: 20px;">
                        
                        <button onclick="cambiarTamanoTexto(-2)" style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; padding: 6px 15px !important; cursor: pointer !important; border: 1px solid #666 !important; border-radius: 4px !important; font-weight: bold !important; font-size: 14px !important; background-color: #f8f9fa !important; color: #333 !important;">a -</button>
                        
                        <button onclick="cambiarTamanoTexto(2)" style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; padding: 6px 15px !important; cursor: pointer !important; border: 1px solid #666 !important; border-radius: 4px !important; font-weight: bold !important; font-size: 18px !important; background-color: #f8f9fa !important; color: #333 !important;">A +</button>
                    
                    </div>

                    <p id="texto-definicion">${data.definicion}</p>
                    
                    <div style="display: block !important; text-align: center !important; width: 100% !important; margin-top: 25px !important; margin-bottom: 15px !important;">
                        <button id="btn-escuchar" onclick="toggleLectura()" class="btn-gob-neutral" style="position: static !important; display: inline-block !important; margin: 0 auto !important; float: none !important; right: auto !important; transform: none !important; padding: 8px 12px; cursor: pointer; border: none; border-radius: 4px;">🔊 Escuchar</button>
                    </div>

                    ${htmlReferencias} 
                </div>
            </div>
        </div>
    `;
    },

    cerrarModal: () => {
        const modal = document.getElementById('modal-termino');
        if (modal) modal.innerHTML = '';
        if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    }
};