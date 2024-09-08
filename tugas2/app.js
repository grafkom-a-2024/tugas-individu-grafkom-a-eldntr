
const canvas = document.getElementById('webglCanvas');
const gl = canvas.getContext('webgl');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

const vertexShaderSource = `
        attribute vec2 a_position;
        uniform vec2 u_resolution;
        uniform vec2 u_translation;
        uniform float u_rotation;
        uniform vec2 u_scale;

        void main() {
            vec2 centeredPosition = a_position - vec2(300.0, 300.0); // Pusatkan objek di titik (300, 300)
            vec2 scaledPosition = centeredPosition * u_scale;
            float cosRot = cos(u_rotation);
            float sinRot = sin(u_rotation);
            vec2 rotatedPosition = vec2(
                cosRot * scaledPosition.x - sinRot * scaledPosition.y,
                sinRot * scaledPosition.x + cosRot * scaledPosition.y
            );
            vec2 position = rotatedPosition + vec2(300.0, 300.0) + u_translation; // Kembalikan ke posisi asli dan tambahkan translasi
            vec2 zeroToOne = position / u_resolution;
            vec2 zeroToTwo = zeroToOne * 2.0;
            vec2 clipSpace = zeroToTwo - 1.0;
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        }
    `;

const fragmentShaderSource = `
        precision mediump float;

        void main() {
            gl_FragColor = vec4(1, 0, 0, 1);
        }
    `;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionLocation = gl.getAttribLocation(program, 'a_position');
const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
const translationLocation = gl.getUniformLocation(program, 'u_translation');
const rotationLocation = gl.getUniformLocation(program, 'u_rotation');
const scaleLocation = gl.getUniformLocation(program, 'u_scale');

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

function createCircleVertices(centerX, centerY, radius, numSegments, startAngle = 0, endAngle = 2 * Math.PI) {
  const positions = [];
  const angleStep = (endAngle - startAngle) / numSegments;
  positions.push(centerX, centerY);
  for (let i = 0; i <= numSegments; i++) {
    const angle = startAngle + i * angleStep;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    positions.push(x, y);
  }
  return positions;
}

function createbLetterVertices(centerX, centerY, outerRadius, numSegments) {
  let positions = [];
  const rightSemicircle = createCircleVertices(centerX - outerRadius + 10, centerY, outerRadius, numSegments, -Math.PI / 2, Math.PI / 2);
  positions = positions.concat(rightSemicircle);
  const topY = centerY + outerRadius;
  const bottomY = centerY - outerRadius * 2;  
  const lineWidth = 30;  

  positions.push(centerX - outerRadius, topY); 
  positions.push(centerX - outerRadius, bottomY); 
  positions.push(centerX - outerRadius + lineWidth, topY); 
  positions.push(centerX - outerRadius + lineWidth, bottomY); 

  return positions;
}


const x = 300;
const y = 300;
const outerRadius = 100;
const numSegments = 50;
const positions = createbLetterVertices(x, y, outerRadius, numSegments);

gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

gl.useProgram(program);

gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

gl.enableVertexAttribArray(positionLocation);

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const size = 2;
const type = gl.FLOAT;
const normalize = false;
const stride = 0;
const offset = 0;
gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

gl.clearColor(0, 0, 0, 1);

function drawScene(translation, rotation, scaleX, scaleY) {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2fv(translationLocation, translation);
  gl.uniform1f(rotationLocation, rotation);
  gl.uniform2f(scaleLocation, scaleX, scaleY);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments + 2);
  gl.drawArrays(gl.TRIANGLE_STRIP, numSegments + 2, 4);
}

const xSlider = document.getElementById('x-translation');
const ySlider = document.getElementById('y-translation');
const rotationSlider = document.getElementById('rotation');
const scaleXSlider = document.getElementById('scale-x');
const scaleYSlider = document.getElementById('scale-y');

let translation = [parseFloat(xSlider.value), parseFloat(ySlider.value)];
let rotation = parseFloat(rotationSlider.value) * Math.PI / 180;
let scaleX = parseFloat(scaleXSlider.value);
let scaleY = parseFloat(scaleYSlider.value);

drawScene(translation, rotation, scaleX, scaleY);

xSlider.addEventListener('input', (event) => {
  translation[0] = parseFloat(event.target.value);
  drawScene(translation, rotation, scaleX, scaleY);
});

ySlider.addEventListener('input', (event) => {
  translation[1] = parseFloat(event.target.value);
  drawScene(translation, rotation, scaleX, scaleY);
});

rotationSlider.addEventListener('input', (event) => {
  rotation = parseFloat(event.target.value) * Math.PI / 180;
  drawScene(translation, rotation, scaleX, scaleY);
});

scaleXSlider.addEventListener('input', (event) => {
  scaleX = parseFloat(event.target.value);
  drawScene(translation, rotation, scaleX, scaleY);
});

scaleYSlider.addEventListener('input', (event) => {
  scaleY = parseFloat(event.target.value);
  drawScene(translation, rotation, scaleX, scaleY);
});
