const formulario = document.getElementById('formulario-glosario');
const contenedor = document.getElementById('contenedor-terminos');

// Variable global para rastrear si estamos editando
let editandoId = null;

// Acciones al enviar el formumario
formulario.addEventListener('submit',async (e) => {
    e.preventDefault();

    const nuevoTermino = {
        concepto: document.getElementById('concepto').value,
        definicion: document.getElementById('definicion').value
    };
    try {
        if (editandoId) {
        await db_actualizarTermino(editandoId, nuevoTermino);
        alert("Término actualizado con éxito");

        // Resetear el estado del formulario
        editandoId = null;
        document.getElementById('btn-guardar').innerText = "Guardar Término";
        document.getElementById('btn-cancelar').style.display = "none"; // ocultamos a la terminal
        } else {
            // Si es null, gurdamos uno nuevo como antes
            await db_guardarTermino(nuevoTermino);
            alert("Guardado con éxito");
        }

        formulario.reset();
    } catch (error) {
        console.error("Error en la operación:", error);
        alert("Hubo un error, revisa lo ingresado.");
    }
});

// Al cargar se imprimen los datos en pantalla
db_obtenerTerminos((datos)=> {
    contenedor.innerHTML = '';
    if (datos) {
        for (let id in datos) {
            contenedor.innerHTML += `
                <div class="tarjeta">
                    <h3>${datos[id].concepto}</h3>
                    <p>${datos[id].definicion}</p>
                    <button onclick="prepararEdicion('${id}','${datos[id].concepto}','${datos[id].definicion}')">Editar</button>
                    <button onclick="eliminar('${id}')">Eliminar</button>
                </div>
            `;
        }
    }
});

// Funcion para cargar los datos al formulario
window.prepararEdicion = (id, concepto, definicion) => {
    // Llenar los inputs con la información actual
    document.getElementById('concepto').value = concepto;
    document.getElementById('definicion').value = definicion;
    // Cambiar el texto del boton para indicar que estamos editando
    document.getElementById('btn-guardar').innerText = "Actualizar Cambios";
    // Mostramos El boton de cancelar
    document.getElementById('btn-cancelar').style.display = "inline-block";
    // Guardar el ID del terminado que estamos editando
    editandoId = id;
    // Mover el foco al inicio como en css
    window.scrollTo(0,0);
}

window.cancelarEdicion = () => {
    // 1. Limpiar el texto de los campos
    formulario.reset();

    // 2. Regresar el botón a su estado original
    document.getElementById('btn-guardar').innerText = "Guardar Término";

    // 3. Ocultar el botón de cancelar
    document.getElementById('btn-cancelar').style.display = "none";

    // 4. Resetear la variable de edición para que no sobrescriba datos por error
    editandoId = null;

    console.log("Formulario reseteado correctamente.");
};

// Funcion para el botón eliminar
window.eliminar = async (id) => {
    if(confirm("¿Eliminar?")) {
        await db_eliminarTermino(id);
    }
};
