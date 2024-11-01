function lerp(a, b, t) {
    return a + (b - a) * t;
}

const v2 = (function () {
    function add(a, ...args) {
        const n = a.slice();
        [...args].forEach(p => {
            n[0] += p[0];
            n[1] += p[1];
        });
        return n;
    }

    function sub(a, ...args) {
        const n = a.slice();
        [...args].forEach(p => {
            n[0] -= p[0];
            n[1] -= p[1];
        });
        return n;
    }

    function mult(a, s) {
        if (Array.isArray(s)) {
            let t = s;
            s = a;
            a = t;
        }
        if (Array.isArray(s)) {
            return [
                a[0] * s[0],
                a[1] * s[1],
            ];
        } else {
            return [a[0] * s, a[1] * s];
        }
    }

    function lerp(a, b, t) {
        return [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
        ];
    }

    function min(a, b) {
        return [
            Math.min(a[0], b[0]),
            Math.min(a[1], b[1]),
        ];
    }

    function max(a, b) {
        return [
            Math.max(a[0], b[0]),
            Math.max(a[1], b[1]),
        ];
    }

    function distanceToSegmentSq(p, v, w) {
        const l2 = distanceSq(v, w);
        if (l2 === 0) {
            return distanceSq(p, v);
        }
        let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
        t = Math.max(0, Math.min(1, t));
        return distanceSq(p, lerp(v, w, t));
    }

    function distanceSq(a, b) {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        return dx * dx + dy * dy;
    }

    return {
        add: add,
        sub: sub,
        max: max,
        min: min,
        mult: mult,
        lerp: lerp,
        distanceToSegmentSq: distanceToSegmentSq,
    };
}());

function lathePoints(points, startAngle, endAngle, numDivisions, capStart, capEnd) {
    const positions = [];
    const texcoords = [];
    const indices = [];

    const vOffset = capStart ? 1 : 0;
    const pointsPerColumn = points.length + vOffset + (capEnd ? 1 : 0);
    const quadsDown = pointsPerColumn - 1;

    for (let division = 0; division <= numDivisions; ++division) {
        const u = division / numDivisions;
        const angle = lerp(startAngle, endAngle, u);
        const mat = m4.yRotation(angle);

        if (capStart) {
            positions.push(0, points[0][1], 0);
            texcoords.push(u, 0);
        }

        points.forEach((p, ndx) => {
            const tp = m4.transformPoint(mat, [...p, 0]);
            positions.push(tp[0], tp[1], tp[2]);
            const v = (ndx + vOffset) / quadsDown;
            texcoords.push(u, v);
        });

        if (capEnd) {
            positions.push(0, points[points.length - 1][1], 0);
            texcoords.push(u, 1);
        }
    }

    // Generate indices
    for (let division = 0; division < numDivisions; ++division) {
        const column1Offset = division * pointsPerColumn;
        const column2Offset = column1Offset + pointsPerColumn;
        for (let quad = 0; quad < quadsDown; ++quad) {
            indices.push(column1Offset + quad, column1Offset + quad + 1, column2Offset + quad);
            indices.push(column1Offset + quad + 1, column2Offset + quad + 1, column2Offset + quad);
        }
    }

    return {
        position: positions,
        texcoord: texcoords,
        indices: indices,
    };
}

const svg = "m44,434c18,-33 19,-66 15,-111c-4,-45 -37,-104 -39,-132c-2,-28 11,-51 16,-81c5,-30 3,-63 -36,-63";

function main() {
    const curvePoints = parseSVGPath(svg);

    const canvas = document.querySelector("canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const data = {
        tolerance: 0.1,  
        distance: 0.3,  
        divisions: 60,   
        startAngle: 0,
        endAngle: Math.PI * 2,
        capStart: true,
        capEnd: true,
    };

    let translation = [0, 0]; 
    let scale = 1;
    let worldMatrix = m4.identity();

    let lightPosition = [10, 10, 5];
    let lightColor = [1, 1, 1];
    let lightIntensity = 1.0;

    document.getElementById('translateX').addEventListener('input', function (event) {
        translation[0] = parseFloat(event.target.value);
        render();
    });

    document.getElementById('translateY').addEventListener('input', function (event) {
        translation[1] = parseFloat(event.target.value);
        render();
    });

    document.getElementById('scale').addEventListener('input', function (event) {
        scale = parseFloat(event.target.value);
        render();
    });

    document.getElementById('lightX').addEventListener('input', function (event) {
        lightPosition[0] = parseFloat(event.target.value);
        render();
    });

    document.getElementById('lightY').addEventListener('input', function (event) {
        lightPosition[1] = parseFloat(event.target.value);
        render();
    });

    document.getElementById('lightZ').addEventListener('input', function (event) {
        lightPosition[2] = parseFloat(event.target.value);
        render();
    });


    document.getElementById('lightIntensity').addEventListener('input', function (event) {
        lightIntensity = parseFloat(event.target.value);
        render();
    });

    document.getElementById('lightColor').addEventListener('input', function (event) {
        const hexColor = event.target.value;
        lightColor = hexToRgb(hexColor);
        render();
    });

    function hexToRgb(hex) {
        var bigint = parseInt(hex.slice(1), 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        return [r / 255, g / 255, b / 255];
    }

    function generateMesh(bufferInfo) {
        const tempPoints = getPointsOnBezierCurves(curvePoints, data.tolerance);
        const points = simplifyPoints(tempPoints, 0, tempPoints.length, data.distance);
        const arrays = lathePoints(points, data.startAngle, data.endAngle, data.divisions, data.capStart, data.capEnd);

        if (!arrays.position || !arrays.indices) {
            console.error("Positions or indices are not generated correctly.");
            return;
        }

        arrays.normal = calculateNormals(arrays.position, arrays.indices);

        if (!bufferInfo) {
            bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.a_position.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrays.position), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.a_texcoord.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrays.texcoord), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.a_normal.buffer); 
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrays.normal), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrays.indices), gl.STATIC_DRAW);
            bufferInfo.numElements = arrays.indices.length;
        }

        return {
            bufferInfo: bufferInfo,
            extents: getExtents(arrays.position),
        };
    }

    const programInfo = webglUtils.createProgramInfo(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

    const texInfo = loadImageAndCreateTextureInfo("image.png", render);

    let projectionMatrix;
    let extents = { min: [0, 0, 0], max: [0, 0, 0] };
    let bufferInfo;
   
    let cameraType = "perspective"; 
    document.getElementById('perspectiveCamera').addEventListener('change', function (event) {
        if (event.target.checked) {
            cameraType = "perspective";
            render();
        }
    }); document.getElementById('orthographicCamera').addEventListener('change', function (event) {
        if (event.target.checked) {
            cameraType = "orthographic";
            render();
        }
    });

    function update() {
        const info = generateMesh(bufferInfo);
        extents = info.extents;
        bufferInfo = info.bufferInfo;
        render();
    }
    update();
    function render() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas, window.devicePixelRatio);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);   
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

        let projectionMatrix;
        if (cameraType === "perspective") {
            const fieldOfViewRadians = Math.PI * .25; // 45 derajat
            projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
        } else if (cameraType === "orthographic") {
            const left = -aspect * 10;
            const right = aspect * 10;
            const bottom = -10;
            const top = 10;
            const near = 0.1;
            const far = 2000;
            projectionMatrix = m4.orthographic(left, right, bottom, top, near, far);
        }

        const midY = lerp(extents.min[1], extents.max[1], .5);
        const sizeToFitOnScreen = (extents.max[1] - extents.min[1]) * .6;
        const distance = sizeToFitOnScreen / Math.tan(Math.PI * .25 * .5);
        const cameraPosition = [0, midY, distance];
        const target = [0, midY, 0];
        const up = [0, -1, 0];
        const cameraMatrix = m4.lookAt(cameraPosition, target, up);
        const viewMatrix = m4.inverse(cameraMatrix);
        const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        gl.useProgram(programInfo.program);

        if (!bufferInfo || !bufferInfo.attribs) {
            console.error('Buffer info is not properly initialized.');
            return;
        }
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        const translationMatrix = m4.translation(translation[0], translation[1], 0);
        const scalingMatrix = m4.scaling(scale, scale, scale);
        const finalWorldMatrix = m4.multiply(translationMatrix, m4.multiply(scalingMatrix, worldMatrix));
        const lightDirection = m4.normalize(m4.subtractVectors([0, 0, 0], lightPosition));

        webglUtils.setUniforms(programInfo, {
            u_matrix: m4.multiply(viewProjectionMatrix, finalWorldMatrix),
            u_world: finalWorldMatrix,
            u_texture: texInfo.texture,
            u_lightWorldPosition: lightPosition,
            u_lightColor: lightColor,
            u_ambientLight: [0.2, 0.2, 0.2],
            u_specularColor: [1, 1, 1],
            u_shininess: 50,
            u_viewWorldPosition: cameraPosition,
            u_lightIntensity: lightIntensity,
        });

        webglUtils.drawBufferInfo(gl, bufferInfo, gl.TRIANGLES);
    }

    function parseSVGPath(svg) {
        const points = [];
        let delta = false;
        let keepNext = false;
        let need = 0;
        let value = '';
        let values = [];
        let lastValues = [0, 0];
        let nextLastValues = [0, 0];

        function addValue() {
            if (value.length > 0) {
                values.push(parseFloat(value));
                if (values.length === 2) {
                    if (delta) {
                        values[0] += lastValues[0];
                        values[1] += lastValues[1];
                    }
                    points.push(values);
                    if (keepNext) {
                        nextLastValues = values.slice();
                    }
                    --need;
                    if (!need) {
                        lastValues = nextLastValues;
                    }
                    values = [];
                }
                value = '';
            }
        }

        svg.split('').forEach(c => {
            if ((c >= '0' && c <= '9') || c === '.') {
                value += c;
            } else if (c === '-') {
                addValue();
                value = '-';
            } else if (c === 'm') {
                addValue();
                keepNext = true;
                need = 1;
                delta = true;
            } else if (c === 'c') {
                addValue();
                keepNext = true;
                need = 3;
                delta = true;
            } else if (c === 'M') {
                addValue();
                keepNext = true;
                need = 1;
                delta = false;
            } else if (c === 'C') {
                addValue();
                keepNext = true;
                need = 3;
                delta = false;
            } else if (c === ',') {
                addValue();
            } else if (c === ' ') {
                addValue();
            }
        });
        addValue();
        let min = points[0].slice();
        let max = points[0].slice();
        for (let i = 1; i < points.length; ++i) {
            min = v2.min(min, points[i]);
            max = v2.max(max, points[i]);
        }
        let range = v2.sub(max, min);
        let halfRange = v2.mult(range, .5);
        for (let i = 0; i < points.length; ++i) {
            const p = points[i];
            p[0] = p[0] - min[0];
            p[1] = (p[1] - min[1]) - halfRange[1];
        }
        return points;
    }

    function getPointsOnBezierCurves(points, tolerance) {
        const newPoints = [];
        const numSegments = (points.length - 1) / 3;
        for (let i = 0; i < numSegments; ++i) {
            const offset = i * 3;
            getPointsOnBezierCurveWithSplitting(points, offset, tolerance, newPoints);
        }
        return newPoints;
    }

    function getPointsOnBezierCurveWithSplitting(points, offset, tolerance, newPoints) {
        const outPoints = newPoints || [];
        if (flatness(points, offset) < tolerance) {
            outPoints.push(points[offset + 0]);
            outPoints.push(points[offset + 3]);
        } else {
            const t = .5;
            const p1 = points[offset + 0];
            const p2 = points[offset + 1];
            const p3 = points[offset + 2];
            const p4 = points[offset + 3];

            const q1 = v2.lerp(p1, p2, t);
            const q2 = v2.lerp(p2, p3, t);
            const q3 = v2.lerp(p3, p4, t);

            const r1 = v2.lerp(q1, q2, t);
            const r2 = v2.lerp(q2, q3, t);

            const red = v2.lerp(r1, r2, t);

            getPointsOnBezierCurveWithSplitting([p1, q1, r1, red], 0, tolerance, outPoints);
            getPointsOnBezierCurveWithSplitting([red, r2, q3, p4], 0, tolerance, outPoints);
        }
        return outPoints;
    }

    function flatness(points, offset) {
        const p1 = points[offset + 0];
        const p2 = points[offset + 1];
        const p3 = points[offset + 2];
        const p4 = points[offset + 3];

        let ux = 3 * p2[0] - 2 * p1[0] - p4[0]; ux *= ux;
        let uy = 3 * p2[1] - 2 * p1[1] - p4[1]; uy *= uy;
        let vx = 3 * p3[0] - 2 * p4[0] - p1[0]; vx *= vx;
        let vy = 3 * p3[1] - 2 * p4[1] - p1[1]; vy *= vy;

        if (ux < vx) {
            ux = vx;
        }

        if (uy < vy) {
            uy = vy;
        }

        return ux + uy;
    }

    function simplifyPoints(points, start, end, epsilon, newPoints) {
        const outPoints = newPoints || [];

        const s = points[start];
        const e = points[end - 1];
        let maxDistSq = 0;
        let maxNdx = 1;
        for (let i = start + 1; i < end - 1; ++i) {
            const distSq = v2.distanceToSegmentSq(points[i], s, e);
            if (distSq > maxDistSq) {
                maxDistSq = distSq;
                maxNdx = i;
            }
        }

        if (Math.sqrt(maxDistSq) > epsilon) {
            simplifyPoints(points, start, maxNdx + 1, epsilon, outPoints);
            simplifyPoints(points, maxNdx, end, epsilon, outPoints);
        } else {
            outPoints.push(s, e);
        }

        return outPoints;
    }

    function getExtents(positions) {
        const min = positions.slice(0, 3);
        const max = positions.slice(0, 3);
        for (let i = 3; i < positions.length; i += 3) {
            min[0] = Math.min(positions[i + 0], min[0]);
            min[1] = Math.min(positions[i + 1], min[1]);
            min[2] = Math.min(positions[i + 2], min[2]);
            max[0] = Math.max(positions[i + 0], max[0]);
            max[1] = Math.max(positions[i + 1], max[1]);
            max[2] = Math.max(positions[i + 2], max[2]);
        }
        return { min: min, max: max };
    }

    function calculateNormals(positions, indices) {
        const normals = new Float32Array(positions.length);
        for (let i = 0; i < indices.length; i += 3) {
            const i0 = indices[i + 0];
            const i1 = indices[i + 1];
            const i2 = indices[i + 2];

            const p0 = [positions[i0 * 3], positions[i0 * 3 + 1], positions[i0 * 3 + 2]];
            const p1 = [positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]];
            const p2 = [positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]];

            const v0 = m4.subtractVectors(p1, p0);
            const v1 = m4.subtractVectors(p2, p0);
            const normal = m4.normalize(m4.cross(v0, v1));

            for (const index of [i0, i1, i2]) {
                normals[index * 3 + 0] += normal[0];
                normals[index * 3 + 1] += normal[1];
                normals[index * 3 + 2] += normal[2];
            }
        }

        for (let i = 0; i < normals.length; i += 3) {
            const n = [normals[i + 0], normals[i + 1], normals[i + 2]];
            const length = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
            normals[i + 0] /= length;
            normals[i + 1] /= length;
            normals[i + 2] /= length;
        }

        return normals;
    }

    // Add mouse and touch controls for camera rotation
    gl.canvas.addEventListener('mousedown', (e) => { e.preventDefault(); startRotateCamera(e); });
    window.addEventListener('mouseup', stopRotateCamera);
    window.addEventListener('mousemove', rotateCamera);
    gl.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startRotateCamera(e.touches[0]); });
    window.addEventListener('touchend', (e) => { stopRotateCamera(e.touches[0]); });
    window.addEventListener('touchmove', (e) => { rotateCamera(e.touches[0]); });

    let lastPos;
    let moving = false;

    function startRotateCamera(e) {
        lastPos = getRelativeMousePosition(gl.canvas, e);
        moving = true;
    }

    function rotateCamera(e) {
        if (moving) {
            const pos = getRelativeMousePosition(gl.canvas, e);
            const size = [4 / gl.canvas.width, 4 / gl.canvas.height];
            const delta = v2.mult(v2.sub(lastPos, pos), size);

            worldMatrix = m4.multiply(m4.xRotation(delta[1] * 5), worldMatrix);
            worldMatrix = m4.multiply(m4.yRotation(delta[0] * 5), worldMatrix);

            lastPos = pos;
            render();
        }
    }

    function stopRotateCamera(e) {
        moving = false;
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function getRelativeMousePosition(canvas, e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
        const y = (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
        return [
            (x - canvas.width / 2) / window.devicePixelRatio,
            (y - canvas.height / 2) / window.devicePixelRatio,
        ];
    }

    function loadImageAndCreateTextureInfo(url, callback) {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        var textureInfo = {
            width: 1,
            height: 1,
            texture: tex,
        };
        var img = new Image();
        img.crossOrigin = "anonymous";
        img.addEventListener('load', function () {
            textureInfo.width = img.width;
            textureInfo.height = img.height;
            gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

            if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }

            if (callback) {
                callback();
            }
        });
        img.src = url;

        return textureInfo;
    }

    function isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }
}

main();