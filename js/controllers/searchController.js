let conceptosIndex = [];
let selectedIndex = -1;

db_obtenerTerminos((data) => {
    if (data) {
        conceptosIndex = Object.keys(data).map(key => ({
            id: key,
            nombre: data[key].concepto
        }));
        publicView.renderDiccionario(conceptosIndex);
    }
});

const ejecutarBusqueda = debounce((texto) => {
    const query = texto.toLowerCase().trim();
    if (query.length < 1) {
        if (publicView.searchResults) publicView.searchResults.innerHTML = "";
        return;
    }
    const resultados = conceptosIndex.filter(item =>
        item.nombre && item.nombre.toLowerCase().includes(query)
    );
    publicView.mostrarSugerencias(resultados);
}, 200);

const inputBusqueda = document.getElementById('search-input');
if (inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => ejecutarBusqueda(e.target.value));
    inputBusqueda.addEventListener('keydown', (e) => manejarTecladoBuscador(e));
}

window.seleccionarTermino = (id) => {
    if (publicView.searchResults) publicView.searchResults.innerHTML = "";
    if (inputBusqueda) inputBusqueda.value = "";
    
    db.ref(`glosario/${id}`).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) publicView.mostrarModalDefinicion(data);
    });
};

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

window.toggleLectura = () => {
    const synth = window.speechSynthesis;
    const textoEl = document.getElementById('texto-definicion');
    const btnEscuchar = document.getElementById('btn-escuchar');

    if (!textoEl) return;

    if (synth.speaking) {
        if (synth.paused) {
            synth.resume();
            btnEscuchar.innerHTML = "⏸ Pausar";
        } else {
            synth.pause();
            btnEscuchar.innerHTML = "▶️ Reanudar";
        }
        return;
    }

    const utterance = new SpeechSynthesisUtterance(textoEl.innerText);
    utterance.lang = 'es-MX';
    utterance.rate = 1.0;

    const voces = synth.getVoices();
    const vozOptima = voces.find(v => v.lang === 'es-MX' && (v.name.includes('Google') || v.name.includes('Premium')))
                   || voces.find(v => v.lang === 'es-MX')
                   || voces.find(v => v.lang.startsWith('es'));

    if (vozOptima) {
        utterance.voice = vozOptima;
    }

    utterance.onend = () => {
        btnEscuchar.innerHTML = "🔊 Escuchar";
    };

    utterance.onerror = () => {
        btnEscuchar.innerHTML = "🔊 Escuchar";
    };

    synth.speak(utterance);
    btnEscuchar.innerHTML = "⏸ Pausar";
};

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };

window.cambiarTamanoTexto = (cambio) => {
    const textoEl = document.getElementById('texto-definicion');
    if (!textoEl) return;

    // Obtenemos el tamaño actual calculado por el navegador
    const estiloActual = window.getComputedStyle(textoEl, null).getPropertyValue('font-size');
    const tamanoActual = parseFloat(estiloActual);

    // Calculamos el nuevo tamaño
    const nuevoTamano = tamanoActual + cambio;

    // Aplicamos el nuevo tamaño y aseguramos la legibilidad del interlineado
    textoEl.style.setProperty('font-size', nuevoTamano + 'px', 'important');
    textoEl.style.setProperty('line-height', '1.6', 'important');
};

const normalizar = (texto) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

}

