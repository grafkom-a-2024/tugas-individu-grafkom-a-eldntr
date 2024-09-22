const canvas = document.getElementById("glcanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const gl = canvas.getContext("webgl");

if (!gl) {
  alert("WebGL tidak didukung di browser Anda.");
}

let rotationSpeed = 0.5; 
let translateX = 0.0;
let translateY = 0.0;
let scaleValue = 1.0;
let rotateX = 0.0; 
let rotateY = 0.0; 

document.getElementById("rotationSpeed").addEventListener("input", (event) => {
  rotationSpeed = event.target.value / 100;
});

document.getElementById("translateX").addEventListener("input", (event) => {
  translateX = event.target.value / 50; 
});

document.getElementById("translateY").addEventListener("input", (event) => {
  translateY = event.target.value / 50;
});

document.getElementById("scale").addEventListener("input", (event) => {
  scaleValue = event.target.value / 50; 
});

document.getElementById("rotateX").addEventListener("input", (event) => {
  rotateX = (event.target.value * Math.PI) / 180; 
});

document.getElementById("rotateY").addEventListener("input", (event) => {
  rotateY = (event.target.value * Math.PI) / 180; 
});

let selectedShape = "cube";

document.getElementById("shapeSelect").addEventListener("change", (event) => {
  selectedShape = event.target.value;
  setupShapeBuffers();
});

let vertexBuffer = gl.createBuffer(), indexBuffer = gl.createBuffer();
let vertexData, indexData;

function setupShapeBuffers() {
  if (selectedShape === "cube") {
    vertexData = new Float32Array([
      // Depan
      -1.0, -1.0,  1.0, 1.0, 0.0, 0.0, 1.0,
       1.0, -1.0,  1.0, 0.0, 1.0, 0.0, 1.0,
       1.0,  1.0,  1.0, 0.0, 0.0, 1.0, 1.0,
      -1.0,  1.0,  1.0, 1.0, 1.0, 0.0, 1.0,

      // Belakang
      -1.0, -1.0, -1.0, 1.0, 0.0, 1.0, 1.0,
       1.0, -1.0, -1.0, 0.0, 1.0, 1.0, 1.0,
       1.0,  1.0, -1.0, 1.0, 1.0, 1.0, 1.0,
      -1.0,  1.0, -1.0, 0.5, 0.5, 0.5, 1.0,
    ]);

    indexData = new Uint16Array([
      0, 1, 2, 0, 2, 3,   // Depan
      4, 5, 6, 4, 6, 7,   // Belakang
      0, 3, 7, 0, 7, 4,   // Kiri
      1, 2, 6, 1, 6, 5,   // Kanan
      3, 2, 6, 3, 6, 7,   // Atas
      0, 1, 5, 0, 5, 4    // Bawah
    ]);
  } else if (selectedShape === "cone") {
    const coneVertex = [];
    const coneIndices = [];
    const radius = 1, height = 2;
    const slices = 32;

    // Puncak kerucut
    coneVertex.push(0, height / 2, 0, 1.0, 0.0, 0.0, 1.0); // Puncak kerucut
    
    // Vertex alas
    for (let i = 0; i <= slices; i++) {
      const theta = (i / slices) * 2 * Math.PI;
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      coneVertex.push(x, -height / 2, z, 0.0, 1.0, 0.0, 1.0); // Titik alas
    }

    // Indeks untuk sisi
    for (let i = 1; i <= slices; i++) {
      coneIndices.push(0, i, i + 1); // Dari puncak ke alas
    }

    // Tambahkan pusat alas
    const baseCenterIndex = coneVertex.length / 7; // Index dari titik pusat alas
    coneVertex.push(0, -height / 2, 0, 0.0, 1.0, 0.0, 1.0); // Pusat alas

    // Indeks untuk alas
    for (let i = 1; i <= slices; i++) {
      coneIndices.push(baseCenterIndex, i + 1, i); // Alas
    }

    vertexData = new Float32Array(coneVertex);
    indexData = new Uint16Array(coneIndices);

  } else if (selectedShape === "cylinder") {
    const cylinderVertex = [];
    const cylinderIndices = [];
    const radius = 1, height = 2;
    const slices = 32;

    // Vertex sisi silinder
    for (let i = 0; i <= slices; i++) {
      const theta = (i / slices) * 2 * Math.PI;
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      cylinderVertex.push(x, height / 2, z, 1.0, 0.0, 0.0, 1.0);  // Alas atas
      cylinderVertex.push(x, -height / 2, z, 0.0, 1.0, 0.0, 1.0); // Alas bawah
    }

    // Indeks untuk sisi
    for (let i = 0; i < slices * 2; i += 2) {
      cylinderIndices.push(i, i + 1, i + 3); // Sisi
      cylinderIndices.push(i, i + 3, i + 2); // Sisi
    }

    // Vertex untuk alas atas dan bawah
    const topCenterIndex = cylinderVertex.length / 7;
    cylinderVertex.push(0, height / 2, 0, 1.0, 0.0, 0.0, 1.0);  // Pusat alas atas
    const bottomCenterIndex = cylinderVertex.length / 7;
    cylinderVertex.push(0, -height / 2, 0, 0.0, 1.0, 0.0, 1.0); // Pusat alas bawah

    // Indeks untuk alas atas
    for (let i = 0; i < slices; i++) {
      cylinderIndices.push(topCenterIndex, i * 2, ((i + 1) % slices) * 2); // Alas atas
    }

    // Indeks untuk alas bawah
    for (let i = 0; i < slices; i++) {
      cylinderIndices.push(bottomCenterIndex, i * 2 + 1, ((i + 1) % slices) * 2 + 1); // Alas bawah
    }

    vertexData = new Float32Array(cylinderVertex);
    indexData = new Uint16Array(cylinderIndices);
  }

  // Update buffer vertex dan index
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
}

setupShapeBuffers();

// Fungsi utilitas untuk membuat shader
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shader: ", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const vertexShaderSource = `
  attribute vec4 aPosition;
  attribute vec4 aColor;
  uniform mat4 uMatrix;
  varying vec4 vColor;
  void main() {
    gl_Position = uMatrix * aPosition;
    vColor = aColor;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec4 vColor;
  void main() {
    gl_FragColor = vColor;
  }
`;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
  console.error("Error linking program: ", gl.getProgramInfoLog(shaderProgram));
}

gl.useProgram(shaderProgram);

const positionLocation = gl.getAttribLocation(shaderProgram, "aPosition");
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 7 * 4, 0);
gl.enableVertexAttribArray(positionLocation);

const colorLocation = gl.getAttribLocation(shaderProgram, "aColor");
gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 7 * 4, 3 * 4);
gl.enableVertexAttribArray(colorLocation);

function createMatrix() {
  const matrix = mat4.create();
  mat4.perspective(matrix, 45, canvas.width / canvas.height, 0.1, 100);
  mat4.translate(matrix, matrix, [translateX, translateY, -6]); 
  mat4.scale(matrix, matrix, [scaleValue, scaleValue, scaleValue]); 
  
  mat4.rotateX(matrix, matrix, rotateX); 
  mat4.rotateY(matrix, matrix, rotateY); 

  mat4.rotate(matrix, matrix, performance.now() / 1000 * rotationSpeed, [0, 1, 0]); 

  return matrix;
}

gl.viewport(0, 0, canvas.width, canvas.height);

function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const matrix = createMatrix();
  const matrixLocation = gl.getUniformLocation(shaderProgram, "uMatrix");
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(drawScene);
}

// Mulai rendering
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);
drawScene();