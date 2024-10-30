import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 1, 1000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5); 

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
textureLoader.load('map/bryan-goff-IuyhXAia8EA-unsplash.jpg', (texture) => {
    const sphereGeometry = new THREE.SphereGeometry(500, 60, 40);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide // Menampilkan bagian dalam sphere
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
});

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const geoTexture = textureLoader.load('asset/texture.jpg');

const geometries = [
  { geometry: new THREE.BoxGeometry(), material: new THREE.MeshLambertMaterial({ map:geoTexture }), position: -4 },
  { geometry: new THREE.SphereGeometry(0.5, 32, 32), material: new THREE.MeshPhongMaterial({ color: 0xff0000, shininess: 100,  }), position: -2 },
  { geometry: new THREE.ConeGeometry(0.5, 1, 32), material: new THREE.MeshStandardMaterial({ color: 0x0000ff, metalness: 0.3, roughness: 0.5 }), position: 0 },
  { geometry: new THREE.TorusGeometry(0.5, 0.2, 16, 100), material: new THREE.MeshLambertMaterial({ color: 0xffff00 }), position: 2 },
  { geometry: new THREE.CylinderGeometry(0.5, 0.5, 1, 32), material: new THREE.MeshPhongMaterial({ color: 0xff00ff, shininess: 50 }), position: 4 }
];

geometries.forEach((obj) => {
  const mesh = new THREE.Mesh(obj.geometry, obj.material);
  mesh.position.x = obj.position;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  obj.mesh = mesh;
});

/* Buat alas atau plane */
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -1;
plane.receiveShadow = true;
scene.add(plane);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;

function animate() {
  requestAnimationFrame(animate);

  geometries.forEach((obj) => {
    obj.mesh.rotation.x += 0.01;
    obj.mesh.rotation.y += 0.01;
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});