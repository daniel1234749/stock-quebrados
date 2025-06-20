import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { utils, writeFile } from "https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAN-DQn2MJNz81kNSAcuw5yp7HDCiwfAmk",
  authDomain: "stockquebradosemanuel.firebaseapp.com",
  projectId: "stockquebradosemanuel",
  storageBucket: "stockquebradosemanuel.appspot.com",
  messagingSenderId: "586968104925",
  appId: "1:586968104925:web:3aa49cf683d1002c280034"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let articulos = [];

async function mostrarArticulos(filtro = "") {
  const contenedor = document.getElementById("lista-articulos");
  contenedor.innerHTML = "";

  if (articulos.length === 0) {
    const q = query(collection(db, "articulos-quebrados"));
    const querySnapshot = await getDocs(q);
    articulos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  let filtrados = articulos;
  if (filtro) {
    const filtroNormalizado = filtro.trim().toLowerCase();
    filtrados = articulos.filter(a => 
      a.departamento && a.departamento.trim().toLowerCase() === filtroNormalizado
    );
  }

  if (filtrados.length === 0) {
    contenedor.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay artículos para mostrar</td></tr>`;
    return;
  }

  filtrados.forEach(data => {
    const fila = `
      <tr>
        <td>${data.codigo}</td>
        <td>${data.descripcion}</td>
        <td>${data.departamento}</td>
        <td>${new Date(data.fecha.toDate ? data.fecha.toDate() : data.fecha).toLocaleString()}</td>
      </tr>
    `;
    contenedor.innerHTML += fila;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-articulos");
  const filtroDepartamento = document.getElementById("filtro-departamento");
  const limpiarFiltroBtn = document.getElementById("limpiar-filtro");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "articulos-quebrados"), {
        codigo: form.codigo.value,
        descripcion: form.descripcion.value,
        departamento: form.departamento.value.trim(),
        fecha: new Date()
      });
      alert("Artículo cargado con éxito ✅");
      form.reset();
      articulos = []; // Forzar recarga
      mostrarArticulos(filtroDepartamento.value);
    } catch (error) {
      console.error("Error al guardar: ", error);
      alert("Hubo un error al guardar ❌");
    }
  });

  filtroDepartamento.addEventListener("change", () => {
    mostrarArticulos(filtroDepartamento.value);
  });

  limpiarFiltroBtn.addEventListener("click", () => {
    filtroDepartamento.value = "";
    mostrarArticulos();
  });

  // Exportar lo que se ve en la tabla
  document.getElementById("exportar-excel").addEventListener("click", () => {
    const tabla = document.querySelector("table");
    const wb = utils.book_new();
    const ws = utils.table_to_sheet(tabla);
    utils.book_append_sheet(wb, ws, "Articulos");
    writeFile(wb, "articulos_quebrados_visible.xlsx");
  });

  // Descargar TODO desde Firebase
  document.getElementById("descargar-firebase").addEventListener("click", async () => {
    const q = query(collection(db, "articulos-quebrados"));
    const querySnapshot = await getDocs(q);

    const datos = querySnapshot.docs.map(doc => ({
      Código: doc.data().codigo,
      Descripción: doc.data().descripcion,
      Departamento: doc.data().departamento,
      Fecha: new Date(doc.data().fecha.toDate ? doc.data().fecha.toDate() : doc.data().fecha).toLocaleString()
    }));

    const ws = utils.json_to_sheet(datos);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Artículos");
    writeFile(wb, "articulos_desde_firebase.xlsx");
  });

  mostrarArticulos();
});
