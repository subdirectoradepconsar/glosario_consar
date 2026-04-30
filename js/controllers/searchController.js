// --- CONTROLADOR: BÚSQUEDA Y NAVEGACIÓN ---

let conceptosIndex = [];
let selectedIndex = -1;

// Inicialización de datos para el índice público
db_obtenerTerminos((data) => {
    if (data) {
        conceptosIndex = Object.keys(data).map(key => ({
            id: key,
            nombre: data[key].concepto
        }));
        publicView.renderDiccionario(conceptosIndex);
    }
});

// Lógica de búsqueda con Debounce
const ejecutarBusqueda = debounce((texto) => {
    const query = texto.toLowerCase().trim();
    if (query.length < 2) {
        if (publicView.searchResults) publicView.searchResults.innerHTML = "";
        return;
    }
    const resultados = conceptosIndex.filter(item =>
        item.nombre && item.nombre.toLowerCase().includes(query)
    );
    publicView.mostrarSugerencias(resultados);
}, 300);

// Eventos del Input
const inputBusqueda = document.getElementById('search-input');
if (inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => ejecutarBusqueda(e.target.value));
    inputBusqueda.addEventListener('keydown', (e) => manejarTecladoBuscador(e));
}

// Función para cargar definición desde el Modelo y mandarla a la Vista
window.seleccionarTermino = (id) => {
    if (publicView.searchResults) publicView.searchResults.innerHTML = "";
    if (inputBusqueda) inputBusqueda.value = "";
    
    // Consultamos al Modelo (Firebase)
    db.ref(`glosario/${id}`).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) publicView.mostrarModalDefinicion(data);
    });
};

// Utilidades del controlador
function manejarTecladoBuscador(e) {
    const items = document.querySelectorAll('.suggestions-list li');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        actualizarEstiloSeleccion(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        actualizarEstiloSeleccion(items);
    } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && items[selectedIndex]) items[selectedIndex].click();
    } else if (e.key === 'Escape') {
        publicView.cerrarModal();
    }
}

function actualizarEstiloSeleccion(items) {
    items.forEach(li => li.classList.remove('selected'));
    if (selectedIndex >= 0) {
        items[selectedIndex].classList.add('selected');
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
}

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
