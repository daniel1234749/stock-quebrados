import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let articulos = [];

async function mostrarArticulos(filtro = "", textoBusqueda = "") {
  const contenedor = document.getElementById("lista-articulos");
  contenedor.innerHTML = "";

  const q = query(collection(db, "articulos-quebrados"));
  const querySnapshot = await getDocs(q);
  articulos = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  let filtrados = articulos;

  if (filtro) {
    const filtroNormalizado = filtro.trim().toLowerCase();
    filtrados = filtrados.filter(a =>
      a.departamento && a.departamento.trim().toLowerCase() === filtroNormalizado
    );
  }

  const texto = textoBusqueda.trim().toLowerCase();
  if (texto) {
    filtrados = filtrados.filter(a =>
      a.codigo.toLowerCase().includes(texto) ||
      a.descripcion.toLowerCase().includes(texto)
    );
  }

  if (filtrados.length === 0) {
    contenedor.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay artículos para mostrar</td></tr>`;
    return;
  }

  filtrados.forEach(data => {
    const fila = `
      <tr>
        <td>${data.codigo}</td>
        <td>${data.descripcion}</td>
        <td>${data.departamento}</td>
        <td>${data.cantidad ?? "-"}</td>
        <td>${data.tipo ?? "-"}</td>
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
  const buscador = document.getElementById("buscador");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nuevoCodigo = form.codigo.value.trim();

    const q = query(
      collection(db, "articulos-quebrados"),
      where("codigo", "==", nuevoCodigo)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      alert("⚠️ Este código ya está ingresado en Base de datos.");
      return;
    }

    try {
      await addDoc(collection(db, "articulos-quebrados"), {
        codigo: nuevoCodigo,
        descripcion: form.descripcion.value.trim(),
        departamento: form.departamento.value.trim(),
        cantidad: parseInt(form.cantidad.value),
        tipo: form.tipo.value,
        fecha: new Date()
      });
      alert("Artículo cargado con éxito ✅");
      form.reset();
      mostrarArticulos(filtroDepartamento.value, buscador.value);
    } catch (error) {
      console.error("Error al guardar: ", error);
      alert("Hubo un error al guardar ❌");
    }
  });

  filtroDepartamento.addEventListener("change", () => {
    mostrarArticulos(filtroDepartamento.value, buscador.value);
  });

  limpiarFiltroBtn.addEventListener("click", () => {
    filtroDepartamento.value = "";
    mostrarArticulos("", buscador.value);
  });

  buscador.addEventListener("input", () => {
    mostrarArticulos(filtroDepartamento.value, buscador.value);
  });

  document.getElementById("exportar-excel").addEventListener("click", () => {
    const tabla = document.querySelector("table");
    const wb = utils.book_new();
    const ws = utils.table_to_sheet(tabla);
    utils.book_append_sheet(wb, ws, "Articulos");
    writeFile(wb, "articulos_quebrados_visible.xlsx");
  });

  document.getElementById("descargar-firebase").addEventListener("click", async () => {
    const q = query(collection(db, "articulos-quebrados"));
    const querySnapshot = await getDocs(q);

    const datos = querySnapshot.docs.map(doc => ({
      Código: doc.data().codigo,
      Descripción: doc.data().descripcion,
      Departamento: doc.data().departamento,
      Cantidad: doc.data().cantidad ?? "",
      Tipo: doc.data().tipo ?? "",
      Fecha: new Date(doc.data().fecha.toDate ? doc.data().fecha.toDate() : doc.data().fecha).toLocaleString()
    }));

    const ws = utils.json_to_sheet(datos);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Artículos");
    writeFile(wb, "articulos_desde_firebase.xlsx");
  });

  mostrarArticulos();
});
