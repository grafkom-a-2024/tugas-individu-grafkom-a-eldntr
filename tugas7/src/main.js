import Scene from './Script';
import './style.css'

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById('app');
  const scene = new Scene({canvas});
});
