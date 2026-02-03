//make notes up here


// Vertex shader program
const vsSource = `
 attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
 uniform mat4 uModelViewMatrix;
 uniform mat4 uProjectionMatrix;
varying highp vec2 vTexCoord;
 void main(void) {
   gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vTexCoord = aTextureCoord;
 }
`;
// Fragment shader program
const fsSource = `
varying highp vec2 vTexCoord;
uniform sampler2D uSampler;
 void main(void) {
  gl_FragColor = texture2D(uSampler, vTexCoord);
 }
`;

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function initBuffers(gl) {
    // Cube vertices
    const positions = [
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,
        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,
        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,
        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Texture coordinates
    const textureCoordinates = [
        // Front
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Back
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Top
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Bottom
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Right
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Left
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
    // Indices
    const indices = [
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,    // top
        12, 13, 14, 12, 14, 15,    // bottom
        16, 17, 18, 16, 18, 19,    // right
        20, 21, 22, 20, 22, 23,    // left
    ];
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return {
        position: positionBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
    };
}

let drag = false, lastX = 0, lastY = 0, dragRotX = 0, dragRotY = 0;

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

let targetX = 0, targetY = 0;
let clickParticle = null;

// Particle system
const particles = [];
function spawnParticles(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 30 + Math.random() * 20
        });
    }
}
function drawParticles(ctx) {
    // Use actual canvas size for drawing
    for (let p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / 50);
        ctx.beginPath();
        ctx.arc(p.x * window.devicePixelRatio, p.y * window.devicePixelRatio, 4 * window.devicePixelRatio, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffcc00';
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life--;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}
function drawScene(gl, programInfo, buffers, texture, rotX, rotY) {
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, rotX, [1, 0, 0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, rotY, [0, 1, 0]);
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }
    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(
            programInfo.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.useProgram(programInfo.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);
    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}
// Matrix utility
const mat4 = {
    create: function () {
        return new Float32Array([1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1]);
    },
    perspective: function (out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) / (near - far);
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[14] = (2 * far * near) / (near - far);
        out[15] = 0;
    },
    translate: function (out, a, v) {
        out[12] = a[12] + v[0];
        out[13] = a[13] + v[1];
        out[14] = a[14] + v[2];
    },
    rotate: function (out, a, rad, axis) {
        let x = axis[0], y = axis[1], z = axis[2];
        let len = Math.hypot(x, y, z);
        if (len < 0.000001) return null;
        len = 1 / len;
        x *= len; y *= len; z *= len;
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const t = 1 - c;
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        // Construct the elements of the rotation matrix
        const b00 = x * x * t + c, b01 = y * x * t + z * s, b02 = z * x * t - y * s;
        const b10 = x * y * t - z * s, b11 = y * y * t + c, b12 = z * y * t + x * s;
        const b20 = x * z * t + y * s, b21 = y * z * t - x * s, b22 = z * z * t + c;
        // Perform rotation-specific matrix multiplication
        out[0] = a00 * b00 + a10 * b01 + a20 * b02;
        out[1] = a01 * b00 + a11 * b01 + a21 * b02;
        out[2] = a02 * b00 + a12 * b01 + a22 * b02;
        out[3] = a03 * b00 + a13 * b01 + a23 * b02;
        out[4] = a00 * b10 + a10 * b11 + a20 * b12;
        out[5] = a01 * b10 + a11 * b11 + a21 * b12;
        out[6] = a02 * b10 + a12 * b11 + a22 * b12;
        out[7] = a03 * b10 + a13 * b11 + a23 * b12;
        out[8] = a00 * b20 + a10 * b21 + a20 * b22;
        out[9] = a01 * b20 + a11 * b21 + a21 * b22;
        out[10] = a02 * b20 + a12 * b21 + a22 * b22;
        out[11] = a03 * b20 + a13 * b21 + a23 * b22;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    },
};
function resizeCanvasToDisplaySize(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * dpr);
    const height = Math.round(window.innerHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
}
function createPatternCanvas(size, variant) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (variant === 'waves') {
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(1, '#3498db');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            const y = (i / 12) * size;
            ctx.moveTo(0, y);
            for (let x = 0; x <= size; x += 16) {
                ctx.lineTo(x, y + Math.sin((x / size) * Math.PI * 2) * 8);
            }
            ctx.stroke();
        }
    } else if (variant === 'bokeh') {
        const gradient = ctx.createRadialGradient(size * 0.3, size * 0.3, 10, size * 0.5, size * 0.5, size * 0.7);
        gradient.addColorStop(0, '#f39c12');
        gradient.addColorStop(1, '#9b59b6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * size, 6 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (variant === 'moire-linear') {
        // Linear moire pattern
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        const spacing1 = 15;
        const spacing2 = 16;
        for (let i = 0; i < size * 2; i += spacing1) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i - size, size);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(100,200,255,0.4)';
        for (let i = 0; i < size * 2; i += spacing2) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i - size, size);
            ctx.stroke();
        }
    } else if (variant === 'moire-radial') {
        // Radial moire pattern
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = 'rgba(255,100,100,0.7)';
        const centerX = size / 2;
        const centerY = size / 2;
        for (let i = 10; i < size; i += 12) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, i, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(100,255,200,0.5)';
        ctx.lineWidth = 1;
        for (let i = 8; i < size; i += 13) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, i, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else if (variant === 'moire-diamond') {
        // Diamond moire pattern
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = 'rgba(255,200,100,0.6)';
        ctx.lineWidth = 1.5;
        const spacing = 18;
        for (let x = -size; x < size * 2; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, -size);
            ctx.lineTo(x + size, size);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(100,150,255,0.5)';
        for (let x = -size; x < size * 2; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, size);
            ctx.lineTo(x + size, -size);
            ctx.stroke();
        }
    } else if (variant === 'grid-moire') {
        // Grid moire pattern
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, size, size);

        // Create two slightly offset grids for moire effect
        ctx.strokeStyle = 'rgba(255,100,150,0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < size; i += 14) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(size, i);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(100,200,255,0.4)';
        for (let i = 0; i < size; i += 15) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(size, i);
            ctx.stroke();
        }
    }

    return canvas;
}

function createDynamicTexture(gl, patternA = 'waves', patternB = 'bokeh') {
    const texture = gl.createTexture();
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const imageA = createPatternCanvas(256, patternA);
    const imageB = createPatternCanvas(256, patternB);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return { texture, canvas, ctx, imageA, imageB };
}

function updateDynamicTexture(gl, textureData, timeSeconds, patternA = 'waves', patternB = 'bokeh', textureSpeed = 1.0) {
    const { texture, canvas, ctx } = textureData;
    const imageA = createPatternCanvas(256, patternA);
    const imageB = createPatternCanvas(256, patternB);
    const width = canvas.width;
    const height = canvas.height;

    // Calculate offset based on time and speed
    const offsetX = (timeSeconds * 20 * textureSpeed) % width;
    const offsetY = (timeSeconds * 15 * textureSpeed) % height;

    const fade = (Math.sin(timeSeconds * 0.7) + 1) * 0.5;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // Draw images with offset for scrolling effect
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.drawImage(imageA, -width, -height, width * 3, height * 3);
    ctx.restore();

    ctx.globalAlpha = fade;
    ctx.save();
    ctx.translate(-offsetX * 0.7, -offsetY * 0.7);
    ctx.drawImage(imageB, -width, -height, width * 3, height * 3);
    ctx.restore();
    ctx.globalAlpha = 1;

    const checkerSize = 32;
    const checkerMix = 0.25 + 0.15 * Math.sin(timeSeconds * 2.1);
    ctx.globalAlpha = checkerMix;
    for (let y = 0; y < height; y += checkerSize) {
        for (let x = 0; x < width; x += checkerSize) {
            const isDark = ((x / checkerSize) + (y / checkerSize)) % 2 === 0;
            ctx.fillStyle = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';
            ctx.fillRect(x, y, checkerSize, checkerSize);
        }
    }
    ctx.globalAlpha = 1;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
}

function main() {
    const canvas = document.getElementById('glcanvas');
    const particleCanvas = document.getElementById('particleCanvas');
    resizeCanvasToDisplaySize(canvas);
    resizeCanvasToDisplaySize(particleCanvas);
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    particleCanvas.style.width = '100vw';
    particleCanvas.style.height = '100vh';
    const ctx = particleCanvas.getContext('2d');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('WebGL not supported');
        return;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
        },
    };
    const buffers = initBuffers(gl);
    const dynamicTexture = createDynamicTexture(gl);
    let rotation = 0;
    let rotX = 0, rotY = 0;
    let dragVelX = 0, dragVelY = 0; // Velocity for momentum
    let textureSpeed = 1.0; // Texture movement speed

    // Texture pattern configuration
    const texturePatterns = {
        'waves-bokeh': { patternA: 'waves', patternB: 'bokeh' },
        'moire-linear': { patternA: 'moire-linear', patternB: 'moire-radial' },
        'moire-radial': { patternA: 'moire-radial', patternB: 'moire-linear' },
        'moire-diamond': { patternA: 'moire-diamond', patternB: 'grid-moire' },
        'grid-moire': { patternA: 'grid-moire', patternB: 'moire-diamond' },
    };

    let currentPatternKey = 'waves-bokeh';
    let currentPattern = texturePatterns[currentPatternKey];

    function render(now) {
        updateDynamicTexture(gl, dynamicTexture, now * 0.001, currentPattern.patternA, currentPattern.patternB, textureSpeed);
        resizeCanvasToDisplaySize(canvas);
        resizeCanvasToDisplaySize(particleCanvas);
        gl.viewport(0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        rotation = now * 0.001;

        // Apply momentum/inertia - velocity decays over time
        if (!drag) {
            dragVelX *= 0.95; // Friction coefficient
            dragVelY *= 0.95;
            dragRotX += dragVelX;
            dragRotY += dragVelY;
        }

        drawScene(gl, programInfo, buffers, dynamicTexture.texture, rotation + dragRotX, dragRotY);
        drawParticles(ctx);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // Texture panel event listeners
    document.querySelectorAll('.texture-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.texture-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPatternKey = this.dataset.texture;
            currentPattern = texturePatterns[currentPatternKey];
        });
    });

    // Speed slider event listener
    const speedSlider = document.getElementById('speed-slider');
    const speedDisplay = document.getElementById('speed-display');
    speedSlider.addEventListener('input', function () {
        textureSpeed = parseFloat(this.value);
        speedDisplay.textContent = textureSpeed.toFixed(1) + 'x';
    });

    // Mouse drag for cube rotation
    canvas.addEventListener('mousedown', function (e) {
        drag = true;
        lastX = e.clientX;
        lastY = e.clientY;
        dragVelX = 0;
        dragVelY = 0;
    });
    window.addEventListener('mousemove', function (e) {
        if (drag) {
            dragVelX = (e.clientX - lastX) * 0.01;
            dragVelY = (e.clientY - lastY) * 0.01;
            dragRotY += dragVelX;
            dragRotX += dragVelY;
            lastX = e.clientX;
            lastY = e.clientY;
        }
    });
    window.addEventListener('mouseup', function (e) {
        drag = false;
    });
    // Click for particle effect
    canvas.addEventListener('click', function (e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);
        //spawnParticles(x, y);
    });
}
window.onload = main;