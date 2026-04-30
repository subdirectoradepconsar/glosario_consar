// --- COMPONENTE: BOTÓN VOLVER ARRIBA ---

const btnArriba = document.querySelector('.btn-gob-neutral');
const footer = document.getElementById('main-footer');

// 1. Funcionalidad de Scroll al inicio
if (btnArriba) {
    btnArriba.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

// 2. Lógica de Visibilidad y Posición respecto al Footer
window.addEventListener('scroll', () => {
    if (!btnArriba) return;

    // Control de visibilidad
    if (window.scrollY > 300) {
        btnArriba.style.display = "block";
    } else {
        btnArriba.style.display = "none";
    }

    // Control de posición magnética sobre el footer
    if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const margin = 20; 

        if (footerRect.top < windowHeight) {
            const overlap = windowHeight - footerRect.top;
            btnArriba.style.bottom = (overlap + margin) + 'px';
        } else {
            btnArriba.style.bottom = ''; 
        }
    }
});