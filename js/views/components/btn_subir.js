const btnArriba = document.querySelector('.btn-gob-neutral');
const footer = document.getElementById('main-footer');

if (btnArriba) {
    btnArriba.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

window.addEventListener('scroll', () => {
    if (!btnArriba) return;

    if (window.scrollY > 300) {
        btnArriba.style.display = "block";
    } else {
        btnArriba.style.display = "none";
    }

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