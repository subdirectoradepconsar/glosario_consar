const btnArriba = document.getElementById("btnVolverArriba");

btnArriba.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    btnArriba.style.display = "block";
  } else {
    btnArriba.style.display = "none";
  }
});
window.addEventListener('scroll', () => {
    const btn = document.querySelector('.btn-gob-neutral');
    const footer = document.getElementById('main-footer');
    
    if (!btn || !footer) return;

    const footerRect = footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Margen deseado entre el botón y el footer
    const margin = 20; 

    // Si el footer está dentro de la vista
    if (footerRect.top < windowHeight) {
        // Calculamos cuánto del footer es visible en la pantalla
        const overlap = windowHeight - footerRect.top;
        
        // Empujamos el botón hacia arriba sumando el margen
        btn.style.bottom = (overlap + margin) + 'px';
    } else {
        // Si el footer no está en vista, removemos el estilo inline
        // para que el CSS (media queries) tome el control de nuevo
        btn.style.bottom = ''; 
    }
});