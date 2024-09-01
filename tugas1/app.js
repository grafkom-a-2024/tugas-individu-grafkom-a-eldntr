const canvas = document.getElementById('webglCanvas');
const gl = canvas.getContext('webgl');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

const vertexShaderSource = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;

    void main() {
        vec2 zeroToOne = a_position / u_resolution;
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

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

function createCircleVertices(centerX, centerY, radius, numSegments) {
    const positions = [];
    const angleStep = (Math.PI * 2) / numSegments;
    positions.push(centerX, centerY);
    for (let i = 0; i <= numSegments; i++) {
        const angle = i * angleStep;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        positions.push(x, y);
    }
    return positions;
}

const x = canvas.width / 2; 
const y = canvas.height / 2;
const radius = 100;
const numSegments = 50;

const positions = createCircleVertices(x, y, radius, numSegments);

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
gl.clear(gl.COLOR_BUFFER_BIT);

gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments + 2);