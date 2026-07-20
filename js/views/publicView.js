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
                    <div id="${letra}" class="letra-seccion" style="padding: 15px !important; margin-bottom: 20px !important; box-sizing: border-box !important; width: 100% !important; overflow: hidden !important;">
                        <h2 class="letra-titulo notranslate">${letra}</h2>
                        <ul class="lista-terminos" style="display: flex !important; flex-wrap: wrap !important; gap: 10px !important; padding: 0 !important; margin: 0 !important; list-style: none !important;">
                            ${grupos[letra].map(t => {
                                // Parche de seguridad: si no existe nombre, agarra concepto
                                const textoTermino = t.nombre || t.concepto || "Sin nombre";
                                return `<li onclick="seleccionarTermino('${t.id}')" style="padding: 8px 15px !important; background-color: #f4f6f9 !important; color: #333333 !important; border: 1px solid #d1d5db !important; border-radius: 6px !important; cursor: pointer !important; display: inline-block !important; word-break: break-word !important; max-width: 100% !important; box-sizing: border-box !important;">${textoTermino}</li>`;
                            }).join('')}
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

        const btnSubir = document.getElementById('btnGlosarioSubir');
        const btnBajar = document.getElementById('btnGlosarioBajar');

        if (btnSubir) {
            btnSubir.onclick = () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            };
        }

        if (btnBajar) {
            btnBajar.onclick = () => {
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            };
        }
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
        if (data.referencias && Array.isArray(data.referencias) && data.referencias.length > 0) {
            htmlReferencias = `
                <div class="referencias-box">
                    <hr> <br>
                    <p><strong>Referencias de consulta:</strong></p>
                    <ul>
                        ${data.referencias.map(ref => {
                            if (!ref || !ref.url || !ref.nombre) return ''; // Evita elementos vacíos
                            return `<li><a href="${ref.url}" target="_blank">${ref.nombre}</a></li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        }

        const definicionSegura = data.definicion ? String(data.definicion) : "Sin definición disponible.";
        const relacionados = window.obtenerTerminosRelacionados ? window.obtenerTerminosRelacionados(data.definicion, data.concepto) : [];
        let htmlRelacionados = '';

        if (relacionados.length > 0) {
            htmlRelacionados = `
                <div class="referencias-automatizadas" style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee; text-align: left;">
                    <p style="font-weight: bold; margin-bottom: 10px; color: #555; font-size: 0.95em;">También te puede interesar:</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${relacionados.map(termino => `
                            <button 
                                onclick="seleccionarTermino('${termino.id}')" 
                                style="background-color: #f0f4f8; color: #1a56db; border: none; padding: 6px 14px; border-radius: 16px; cursor: pointer; font-size: 0.85em; font-weight: 500; transition: all 0.2s;"
                                onmouseover="this.style.backgroundColor='#e1e8f5'" 
                                onmouseout="this.style.backgroundColor='#f0f4f8'">
                                ${termino.nombre}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        modal.innerHTML = `
        <div class="modal-overlay" style="display: flex !important; align-items: center !important; justify-content: center !important;">
            <div class="detalle-card" style="max-width: 600px !important; width: 90% !important; max-height: 85vh !important; overflow-y: auto !important; padding: 20px !important; box-sizing: border-box !important;">
                <button class="btn-cerrar" onclick="publicView.cerrarModal()">×</button>
                <div class="modal-header"><h2>${data.concepto}</h2></div>
                    
                    <div style="display: flex; justify-content: flex-end; gap: 15px; margin-bottom: 20px;">
                        <button class="notranslate" onclick="cambiarTamanoTexto(-2)" style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; padding: 6px 15px !important; cursor: pointer !important; border: 1px solid #666 !important; border-radius: 4px !important; font-weight: bold !important; font-size: 14px !important; background-color: #f8f9fa !important; color: #333 !important;">a -</button>
                        <button class="notranslate" onclick="cambiarTamanoTexto(2)" style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; padding: 6px 15px !important; cursor: pointer !important; border: 1px solid #666 !important; border-radius: 4px !important; font-weight: bold !important; font-size: 18px !important; background-color: #f8f9fa !important; color: #333 !important;">A +</button>
                    </div>

<p id="texto-definicion" style="font-size: 20px !important; line-height: 1.6 !important; text-align: justify !important; padding: 10px 20px !important; word-break: break-word !important; overflow-wrap: break-word !important; white-space: pre-line !important; margin-bottom: 20px !important;">${definicionSegura}</p>                    
                    <div style="display: block !important; text-align: center !important; width: 100% !important; margin-top: 25px !important; margin-bottom: 15px !important;">
                        <button id="btn-escuchar" onclick="toggleLectura()" class="btn-gob-neutral" style="position: static !important; display: inline-block !important; margin: 0 auto !important; float: none !important; right: auto !important; transform: none !important; padding: 8px 12px; cursor: pointer; border: none; border-radius: 4px;">🗣️ Escuchar</button>
                    </div>

                    ${htmlRelacionados} 

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

const normalizarTerminoDesdeAdmin = (data, idOriginal) => {
    return {
        id: data.id || idOriginal,
        nombre: data.nombre || data.concepto || "Término sin nombre",
        concepto: data.concepto || data.nombre || "Término sin nombre",
        definicion: data.definicion || "Sin definición disponible.",
        referencias: Array.isArray(data.referencias) ? data.referencias : []
    };
};