// Ponte com o Firebase (carregado direto do servidor do Google, sem instalação)
export { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
export { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
export {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, setDoc, deleteDoc, onSnapshot, writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
