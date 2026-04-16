// Estado local para búsqueda rápida
let conceptosIndex = [];

// 1. Carga inicial del índice (Solo conceptos)
async function cargarIndice() {
    try {
        db.ref('glosario').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                conceptosIndex = Object.keys(data).map(key => ({
                    id: key,
                    nombre: data[key].concepto
                }));
                console.log("Índice de términos sincronizado");
            }
        });
    } catch (error) {
        console.error("Error al cargar el índice: ", error);
    }
}

// 2. Debounce para optimizar rendimiento
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const inputBusqueda = document.getElementById('search-input');
const glossaryContainer = document.getElementById('glossary-container');

// 3. Lógica de búsqueda
const ejecutarBusqueda = debounce((texto) => {
    const query = texto.toLowerCase().trim();

    if (query.length < 2) {
        glossaryContainer.innerHTML = "";
        return;
    }

    const resultados = conceptosIndex.filter(item => 
        item.nombre && item.nombre.toLowerCase().includes(query)
    );

    mostrarSugerencias(resultados);
}, 300);

if (inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => ejecutarBusqueda(e.target.value));
}

// 4. Renderizado de sugerencias
function mostrarSugerencias(lista) {
    if (lista.length === 0) {
        glossaryContainer.innerHTML = "<p>No se encontraron términos.</p>";
        return;
    }

    glossaryContainer.innerHTML = `
        <ul class="results-list">
            ${lista.map(item => `
                <li onclick="cargarDefinicion('${item.id}')" style="cursor:pointer; padding:10px; border-bottom:1px solid #eee;">
                    ${item.nombre}
                </li>
            `).join('')}
        </ul>
    `;
}

// 5. Carga de definición completa (Lazy Loading)
window.cargarDefinicion = (id) => {
    db.ref(`glosario/${id}`).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            glossaryContainer.innerHTML = `
                <div class="detalle-termino">
                    <button onclick="location.reload()" style="margin-bottom:15px;">← Volver</button>
                    <h2>${data.concepto}</h2>
                    <hr>
                    <p>${data.definicion}</p>
                </div>
            `;
        }
    });
};

cargarIndice();