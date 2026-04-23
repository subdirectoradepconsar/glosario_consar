// Estado local para búsqueda rápida
let conceptosIndex = [];

// 1. Elementos del DOM
const inputBusqueda = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const glossaryContainer = document.getElementById('glossary-container');

// 2. Carga inicial del índice y el diccionario completo
async function cargarIndice() {
    try {
        db.ref('glosario').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Sincronizamos el índice para el buscador
                conceptosIndex = Object.keys(data).map(key => ({
                    id: key,
                    nombre: data[key].concepto
                }));

                // Pintamos el diccionario completo (A-Z) de fondo
                mostrarDiccionarioCompleto(conceptosIndex);
                console.log("Datos sincronizados con Firebase");
            }
        });
    } catch (error) {
        console.error("Error al cargar datos: ", error);
    }
}

// 3. Función para mostrar el diccionario completo (A-Z)
function mostrarDiccionarioCompleto(terminos) {
    if (!glossaryContainer) return;

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
                            <li onclick="cargarDefinicion('${t.id}')">${t.nombre}</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
    });
    glossaryContainer.innerHTML = htmlFinal;

    // --- NUEVA LÓGICA PARA EL ÍNDICE ---
    // Pinta de color gris en en nav de abecedario si no existen terminos que comiencen con esa letra
    const linksNavegacion = document.querySelectorAll('.lista_nav li a');

    linksNavegacion.forEach(link => {
        // Obtenemos la letra del enlace (ej: "A")
        const letraEnlace = link.innerText.toUpperCase();

        // Verificamos si esa letra existe en nuestros grupos de datos
        if (!grupos[letraEnlace]) {
            link.classList.add('letra-inactiva');
        } else {
            // Si la letra vuelve a tener datos (por si actualizas la base), quitamos la clase
            link.classList.remove('letra-inactiva');
        }
    });
}

// 4. Lógica del Buscador (Debounce)
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const ejecutarBusqueda = debounce((texto) => {
    const query = texto.toLowerCase().trim();

    if (query.length < 2) {
        if (searchResults) searchResults.innerHTML = "";
        return;
    }

    const resultados = conceptosIndex.filter(item =>
        item.nombre && item.nombre.toLowerCase().includes(query)
    );

    mostrarSugerencias(resultados);
}, 300);

// 5. Escuchar el evento de escritura
if (inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => ejecutarBusqueda(e.target.value));
}

// 6. Mostrar sugerencias flotantes
function mostrarSugerencias(lista) {
    if (!searchResults) return;

    if (lista.length === 0) {
        searchResults.innerHTML = "<div class='no-results'>No se encontraron términos.</div>";
        return;
    }

    searchResults.innerHTML = `
        <ul class="suggestions-list">
            ${lista.map(item => `
                <li onclick="seleccionarSugerencia('${item.id}')">${item.nombre}</li>
            `).join('')}
        </ul>
    `;
}

// Acción al hacer clic en una sugerencia del buscador
window.seleccionarSugerencia = (id) => {
    if (searchResults) searchResults.innerHTML = "";
    if (inputBusqueda) inputBusqueda.value = "";
    cargarDefinicion(id);
};

// 7. Carga de definición en Modal (Sin recargar ni borrar)
window.cargarDefinicion = (id) => {
    db.ref(`glosario/${id}`).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            let modal = document.getElementById('modal-termino');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-termino';
                document.body.appendChild(modal);
            }

            // --- LÓGICA PARA REFERENCIAS ---
            let htmlReferencias = "";
            if (data.referencias && data.referencias.length > 0) {
                htmlReferencias = `
                    <div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px;">
                        <p><strong>Referencias de consulta:</strong></p>
                        <ul style="padding-left: 20px;">
                            ${data.referencias.map(ref => `
                                <li style="margin-bottom: 5px;">
                                    <a href="${ref.url}" target="_blank" rel="noopener noreferrer" style="color: #611232; text-decoration: underline;">
                                        ${ref.nombre}
                                    </a>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }

            // ... dentro de tu función cargarDefinicion ...

            modal.innerHTML = `
                <div class="modal-overlay">
                    <div class="detalle-card">
                        <button class="btn-cerrar" onclick="document.getElementById('modal-termino').innerHTML=''">×</button>
                        
                        <div class="modal-header">
                            <h2>${data.concepto}</h2>
                        </div>
                        <hr>
                        <div class="modal-body">
                            <p>${data.definicion}</p>
                            ${htmlReferencias} 
                        </div>
                        
                    </div>
                </div>
            `;
            /* <button class="btn-footer" onclick="document.getElementById('modal-termino').innerHTML=''">Cerrar</button> */
        }
    });
};
// Iniciar proceso
cargarIndice();