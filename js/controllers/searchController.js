let fuse;
let conceptosIndex = [];
let selectedIndex = -1;

db_obtenerTerminos((data) => {
    if (data) {
        conceptosIndex = Object.keys(data).map(key => ({
            id: key,
            nombre: data[key].concepto
        }));
        publicView.renderDiccionario(conceptosIndex);

        const opcionesFuse = {
            keys: ['nombre'],  
            threshold: 0.4,   
            ignoreLocation: true, 
            getFn: (obj, path) => {
                return quitarAcentos(obj[path]);
            }
        };

        fuse = new Fuse(conceptosIndex, opcionesFuse);
    }
});

const quitarAcentos = (texto) => {
    if (!texto) return "";
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const ejecutarBusqueda = debounce((texto) => {
    const query = quitarAcentos(texto.toLowerCase().trim());
    
    if (query.length < 1) {
        if (publicView.searchResults) publicView.searchResults.innerHTML = "";
        return;
    }
    
    let resultados = [];
    if (fuse) {
        resultados = fuse.search(query).map(res => res.item);
    } else {
        resultados = conceptosIndex.filter(item =>
            item.nombre && quitarAcentos(item.nombre.toLowerCase()).includes(query)
        );
    }
    
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
    const terminoFormateado = normalizarTerminoDesdeAdmin(snapshot.val(), key);
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
}

window.cambiarTamanoTexto = (cambio) => {
    const textoEl = document.getElementById('texto-definicion');
    if (!textoEl) return;

    const estiloActual = window.getComputedStyle(textoEl, null).getPropertyValue('font-size');
    const tamanoActual = parseFloat(estiloActual);
    const nuevoTamano = tamanoActual + cambio;

    textoEl.style.setProperty('font-size', nuevoTamano + 'px', 'important');
    textoEl.style.setProperty('line-height', '1.6', 'important');
};

const normalizar = (texto) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

window.obtenerTerminosRelacionados = (textoDefinicion, conceptoActual) => {
    if (!textoDefinicion || conceptosIndex.length === 0) return [];
    
    const textoNormalizado = normalizar(textoDefinicion);
    const resultados = [];
    
    for (const item of conceptosIndex) {
        
        if (item.nombre === conceptoActual) continue;
        
        const nombreNormalizado = normalizar(item.nombre);
        if (nombreNormalizado.length <= 2) continue;

       
        if (textoNormalizado.includes(nombreNormalizado)) {
            resultados.push(item);
            continue;
        }

    
        const palabrasConcepto = nombreNormalizado.split(/\s+/);
        if (palabrasConcepto.length > 1) {
            const primeraPalabra = palabrasConcepto[0];
            
            
            const palabrasBasura = ['cuenta', 'monto', 'plazo', 'sobre', 'sistema', 'pago'];
            if (primeraPalabra.length > 4 && !palabrasBasura.includes(primeraPalabra)) {
                
                // \b asegura que busque la palabra completa (ej: "pension" y no "pensiones" o dentro de otra)
                const reglaPalabraExacta = new RegExp(`\\b${primeraPalabra}\\b`, 'i');
                if (reglaPalabraExacta.test(textoNormalizado)) {
                    resultados.push(item);
                }
            }
        }
    }

    
    const IDsUnicos = new Set();
    const resultadosFiltrados = resultados.filter(item => {
        if (!IDsUnicos.has(item.id)) {
            IDsUnicos.add(item.id);
            return true;
        }
        return false;
    });


    return resultadosFiltrados.slice(0, 3);

    const optimizarTraduccionDinamica = () => {
    const contenedorGlosario = document.getElementById('glossary-container');
    if (!contenedorGlosario) return;

    const observador = new MutationObserver(() => {

        if (document.querySelector('.goog-te-combo') && document.querySelector('.goog-te-combo').value === 'en') {
            const iframe = document.querySelector('.goog-te-banner-frame');
            if (iframe) {
            
                window.location.hash = window.location.hash; 
            }
        }
    });

    
};
}
