// --- Variables Globales ---
let scene, camera, renderer;
let car, carBody, wheels = [];
let billboards = [];
let collectibles = []; // Array para los iconos de skills

// Estado del Juego
const gameState = {
    speed: 0,
    maxSpeed: 1.2,
    acceleration: 0.02,
    friction: 0.98,
    turnSpeed: 0.04,
    angle: 0,
    x: 0,
    z: 0
};

const keys = { w: false, a: false, s: false, d: false };

const portfolioData = [
    { title: "HOLA MUNDO", desc: "Soy Alex, Dev Creativo" },
    { title: "SKILLS", desc: "¡Atropella los iconos para aprender!" }, 
    { title: "EXPERIENCIA", desc: "5 Años construyendo la web" },
    { title: "PROYECTO 1", desc: "E-Commerce 3D Inmersivo" },
    { title: "PROYECTO 2", desc: "App de Finanzas con IA" },
    { title: "CONTACTO", desc: "alex@portfolio.dev" }
];

// Comprobador de WebGL en ámbito global (evita ReferenceError)
window.isWebGLAvailable = window.isWebGLAvailable || function() {
    try {
        const canvas = document.createElement('canvas');
        return !!window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
        return false;
    }
};

// Helper para cargar scripts dinámicamente
function loadScript(src, onload, onerror) {
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = onload;
    s.onerror = onerror;
    document.head.appendChild(s);
}

function init() {
    if (!isWebGLAvailable()) {
        const fallback = document.getElementById('webgl-fallback');
        if (fallback) fallback.style.display = 'block';
        console.warn('WebGL no disponible: mostrando fallback');
        return;
    } else {
        const fallback = document.getElementById('webgl-fallback');
        if (fallback) fallback.style.display = 'none';
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 20, 100);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, -10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras más suaves
    const rootEl = document.getElementById('three-root');
    if (rootEl) {
        rootEl.appendChild(renderer.domElement);
    } else {
        document.body.appendChild(renderer.domElement);
    }

    // Luces Globales
    const ambientLight = new THREE.AmbientLight(0x404080, 0.4); // Luz ambiente azulada nocturna
    scene.add(ambientLight);

    // Luz de luna direccional
    const dirLight = new THREE.DirectionalLight(0xaaccff, 0.3);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -150;
    scene.add(dirLight);

    createEnvironment();
    createTrackAndBillboards();
    createCentralHub(); // NUEVO: Crear el centro social
    createCar();

    // Snap camera to the car position immediately so user sees the scene right away
    try {
        const snapTargetX = car.position.x - Math.sin(gameState.angle) * 18;
        const snapTargetZ = car.position.z - Math.cos(gameState.angle) * 18;
        const snapTargetY = car.position.y + 9;
        camera.position.set(snapTargetX, snapTargetY, snapTargetZ);
        const lookX = car.position.x + Math.sin(gameState.angle) * 10;
        const lookZ = car.position.z + Math.cos(gameState.angle) * 10;
        camera.lookAt(lookX, car.position.y, lookZ);
        console.log('Camera snapped to initial car position:', camera.position);
    } catch (err) {
        console.warn('Error al snapear la cámara:', err);
    }

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', (e) => handleKey(e, true));
    document.addEventListener('keyup', (e) => handleKey(e, false));
    setupTouchControls();

    console.log('Three.js scene initialization complete. Car position:', car.position);
    animate();
}

// --- Generación de Texturas Procedurales ---

function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a330a'; 
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = Math.random() * 15 + 5;
        const angle = Math.random() * Math.PI * 2;
        const g = Math.floor(Math.random() * 100) + 50; 
        ctx.strokeStyle = `rgb(${g/2}, ${g}, ${g/3})`;
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50);
    return texture;
}

// Texturas para Redes Sociales (Procedurales)
function createSocialTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    let bg, text, symbol;
    
    switch(type) {
        case 'github': bg='#171515'; text='#ffffff'; symbol='GH'; break;
        case 'linkedin': bg='#0077b5'; text='#ffffff'; symbol='in'; break;
        case 'youtube': bg='#ff0000'; text='#ffffff'; symbol='YT'; break;
        case 'facebook': bg='#1877f2'; text='#ffffff'; symbol='f'; break;
        case 'tiktok': bg='#000000'; text='#00f2ea'; symbol='Tik'; break;
        default: bg='#333'; text='#fff'; symbol='?';
    }

    // Fondo
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);
    
    // Borde
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 236, 236);

    // Texto
    ctx.fillStyle = text;
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 128, 128);

    // Decoración TikTok (Efecto Glitch simple)
    if(type === 'tiktok') {
        ctx.fillStyle = '#ff0050';
        ctx.fillText(symbol, 132, 132);
    }

    return new THREE.CanvasTexture(canvas);
}

// --- Creación de Objetos ---

function createEnvironment() {
    const planeGeometry = new THREE.PlaneGeometry(800, 800);
    const grassTexture = createGrassTexture();
    const planeMaterial = new THREE.MeshStandardMaterial({ 
        map: grassTexture, roughness: 1, bumpMap: grassTexture, bumpScale: 0.5
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.5;
    plane.receiveShadow = true;
    scene.add(plane);

    const moonGeo = new THREE.SphereGeometry(15, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xeef5ff });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(50, 80, 50);
    scene.add(moon);
    
    const haloGeo = new THREE.SphereGeometry(22, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({ 
        color: 0xaaaaff, transparent: true, opacity: 0.2, side: THREE.BackSide
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(moon.position);
    scene.add(halo);
}

// --- NUEVO: Centro Social / Parking ---
function createCentralHub() {
    // 1. Suelo del Estacionamiento
    const hubGeo = new THREE.CylinderGeometry(25, 25, 0.2, 32);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.set(0, -0.4, 0);
    hub.receiveShadow = true;
    scene.add(hub);

    // 2. Líneas de Estacionamiento (Simples planos blancos)
    const lineGeo = new THREE.PlaneGeometry(0.5, 8);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
    
    const socials = [
        { id: 'github', name: 'GitHub', angle: -0.6 },
        { id: 'linkedin', name: 'LinkedIn', angle: -0.3 },
        { id: 'youtube', name: 'YouTube', angle: 0 },
        { id: 'facebook', name: 'Facebook', angle: 0.3 },
        { id: 'tiktok', name: 'TikTok', angle: 0.6 }
    ];

    socials.forEach(social => {
        const angle = social.angle + Math.PI; // Mirando hacia afuera
        const radius = 15;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        // Crear Monolito
        createSocialMonolith(x, z, angle, social.id, social.name);

        // Líneas de parking
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.rotation.z = -angle; // Alinear con el radio
        // Posicionar línea a la derecha del spot
        line.position.set(
            Math.sin(angle + 0.15) * (radius - 4), 
            -0.38, 
            Math.cos(angle + 0.15) * (radius - 4)
        );
        scene.add(line);
    });

    // 3. Carretera de Conexión (Desde el hueco en el anillo hacia el centro)
    // El hueco está aprox en el segmento 0-8. Ángulo 0. Pos (Radius, 0, 0).
    const roadGeo = new THREE.PlaneGeometry(14, 60);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const connector = new THREE.Mesh(roadGeo, roadMat);
    connector.rotation.x = -Math.PI / 2;
    connector.rotation.z = Math.PI / 2; // Horizontal
    // Posición: Desde el borde del hub (25) hasta el track (aprox 70)
    connector.position.set(45, -0.45, 0); 
    connector.receiveShadow = true;
    scene.add(connector);

    // Señal de Parking
    const signGroup = new THREE.Group();
    signGroup.position.set(65, 0, 8); // Entrada
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4), new THREE.MeshStandardMaterial({color:0x555}));
    pole.position.y = 2;
    signGroup.add(pole);
    const board = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.1), new THREE.MeshStandardMaterial({color:0x0000ff}));
    board.position.y = 3.5;
    signGroup.add(board);
    // P blanca
    // (Simplificado)
    scene.add(signGroup);
}

function createSocialMonolith(x, z, angle, type, name) {
    const group = new THREE.Group();
    group.position.set(x, 1.5, z);
    group.rotation.y = angle + Math.PI; // Mirando al centro

    // Base
    const baseGeo = new THREE.BoxGeometry(4, 3, 0.5);
    const tex = createSocialTexture(type);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.2, metalness: 0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111 });
    
    const mesh = new THREE.Mesh(baseGeo, [darkMat, darkMat, darkMat, darkMat, mat, darkMat]); // Front is face 4
    mesh.castShadow = true;
    group.add(mesh);

    // Poste soporte
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3), darkMat);
    leg.position.y = -1.5;
    group.add(leg);

    scene.add(group);

    // Agregar a la lista de "billboards" para que aparezca info al acercarse
    billboards.push({
        position: new THREE.Vector3(x, 0, z),
        info: {
            title: name,
            desc: "Sígueme en " + name
        }
    });
}

// --- Modificación de Pista: Crear Hueco ---
function createTrackAndBillboards() {
    const trackWidth = 14;
    const numSegments = 150;
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    
    const billboardInterval = Math.floor(numSegments / portfolioData.length);

    for (let i = 0; i < numSegments; i++) {
        const angle = (i / numSegments) * Math.PI * 2;
        const radius = 60 + Math.cos(angle * 3) * 20; 
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // --- ELEMENTOS DE PISTA ---

        // Barreras: HUECO DE ENTRADA en los primeros segmentos
        // Índices 0 a 8 aprox corresponden al ángulo 0 donde está el conector
        const isEntrance = (i < 8 || i > numSegments - 2); 

        if (!isEntrance) {
            createBarrier(x, z, angle, 0xff0000, 0.5); // Interior
        } else {
            // Opcional: poner conos o luces de suelo en la entrada
        }

        // Barrera exterior siempre presente
        const xOut = Math.cos(angle) * (radius + trackWidth);
        const zOut = Math.sin(angle) * (radius + trackWidth);
        createBarrier(xOut, zOut, angle, 0x00ffff, 0.3); // Exterior
        
        // Asfalto
        const roadPatch = new THREE.Mesh(new THREE.CircleGeometry(5, 8), roadMaterial);
        roadPatch.rotation.x = -Math.PI / 2;
        roadPatch.position.set((x+xOut)/2, -0.48, (z+zOut)/2);
        roadPatch.receiveShadow = true;
        scene.add(roadPatch);

        // --- FAROLAS ---
        if (i % 8 === 0) {
            const lampDist = radius + trackWidth + 2;
            const lx = Math.cos(angle) * lampDist;
            const lz = Math.sin(angle) * lampDist;
            const hasLight = (i % 32 === 0);
            createStreetLight(lx, lz, angle + Math.PI, hasLight);
        }

        // --- VEGETACIÓN ---
        if (Math.random() < 0.2) {
            const dist = radius + trackWidth + 8 + Math.random() * 25;
            const objX = Math.cos(angle) * dist;
            const objZ = Math.sin(angle) * dist;
            if (Math.random() > 0.5) createTree(objX, objZ, 0.8 + Math.random() * 0.5);
            else createRock(objX, objZ, 1 + Math.random());
        }

        // --- PANCARTAS ---
        if (i % billboardInterval === 0) {
            const dataIndex = Math.floor(i / billboardInterval) % portfolioData.length;
            const info = portfolioData[dataIndex];
            const billboardDist = radius + trackWidth + 12; 
            const bx = Math.cos(angle) * billboardDist;
            const bz = Math.sin(angle) * billboardDist;
            createBillboard(bx, bz, angle + Math.PI/2, info);

            if (dataIndex === 1) {
                const colors = ['#f7df1e', '#61dafb', '#3776ab', '#e34c26'];
                const texts = ['JS', 'RE', 'PY', 'H5'];
                for(let k=0; k<4; k++) {
                    const nextAngle = angle - (k+1) * 0.08; 
                    const midRadius = radius + trackWidth/2;
                    const laneOffset = (k % 2 === 0) ? -3 : 3; 
                    const ix = Math.cos(nextAngle) * (midRadius + laneOffset);
                    const iz = Math.sin(nextAngle) * (midRadius + laneOffset);
                    createSkillCollectible(ix, iz, texts[k], colors[k]);
                }
            }
        }
    }
}

// ... (resto de funciones: createBarrier, createTextTexture, createBillboard, createStreetLight, createTree, createRock, createSkillCollectible) ...
function createBarrier(x, z, angle, color, emissiveInt) {
    const geo = new THREE.BoxGeometry(1.5, 1, 3);
    const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: emissiveInt });
    const barrier = new THREE.Mesh(geo, mat);
    barrier.position.set(x, 0, z);
    barrier.rotation.y = -angle;
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    scene.add(barrier);
}

function createTextTexture(title, subtitle) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 512, 256);
    ctx.lineWidth = 10; ctx.strokeStyle = '#0ff';
    ctx.shadowColor = '#0ff'; ctx.shadowBlur = 15;
    ctx.strokeRect(10, 10, 492, 236); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center'; ctx.fillText(title, 256, 100);
    ctx.fillStyle = '#ccc'; ctx.font = '40px Arial'; ctx.fillText(subtitle, 256, 180);
    return new THREE.CanvasTexture(canvas);
}

function createBillboard(x, z, rotationY, info) {
    const group = new THREE.Group();
    group.position.set(x, 2.5, z);
    group.rotation.y = -rotationY; 
    const boardGeo = new THREE.BoxGeometry(16, 8, 0.5);
    const texture = createTextTexture(info.title, info.desc);
    const boardMat = new THREE.MeshBasicMaterial({ map: texture });
    const darkMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const board = new THREE.Mesh(boardGeo, [darkMat, darkMat, darkMat, darkMat, boardMat, darkMat]);
    board.castShadow = true;
    group.add(board);
    const poleGeo = new THREE.CylinderGeometry(0.4, 0.4, 7);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333 });
    const pole1 = new THREE.Mesh(poleGeo, poleMat);
    pole1.position.set(-6, -3.5, 0);
    const pole2 = new THREE.Mesh(poleGeo, poleMat);
    pole2.position.set(6, -3.5, 0);
    group.add(pole1); group.add(pole2);
    scene.add(group);
    billboards.push({ position: new THREE.Vector3(x, 0, z), info: info });
}

function createStreetLight(x, z, angle, addLightSource) {
    const group = new THREE.Group();
    group.position.set(x, 0, z); group.rotation.y = -angle;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x222, roughness: 0.5 }));
    pole.position.y = 4; pole.castShadow = true; group.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 3), new THREE.MeshStandardMaterial({ color: 0x222 }));
    arm.position.set(1, 7.5, 0); group.add(arm);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.4), new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffee, emissiveIntensity: 2 }));
    bulb.position.set(2.5, 7.1, 0); group.add(bulb);
    if (addLightSource) {
        const light = new THREE.PointLight(0xffaa00, 1, 30);
        light.position.set(2.5, 6, 0); group.add(light);
    }
    scene.add(group);
}

function createTree(x, z, scale = 1) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z); treeGroup.scale.set(scale, scale, scale);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 3, 6), new THREE.MeshStandardMaterial({ color: 0x3d2316 }));
    trunk.position.y = 1.5; trunk.castShadow = true; treeGroup.add(trunk);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.5, 6, 8), new THREE.MeshStandardMaterial({ color: 0x0a3d0d }));
    leaves.position.y = 4.5; leaves.castShadow = true; treeGroup.add(leaves);
    scene.add(treeGroup);
}

function createRock(x, z, scale = 1) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), new THREE.MeshStandardMaterial({ color: 0x555, roughness: 0.9 }));
    rock.position.set(x, 0.5, z); rock.scale.set(scale, scale * 0.6, scale);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true; rock.receiveShadow = true; scene.add(rock);
}

function createSkillCollectible(x, z, text, color) {
    const group = new THREE.Group();
    group.position.set(x, 1.5, z);
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color; ctx.fillRect(0, 0, 128, 128);
    ctx.lineWidth = 10; ctx.strokeStyle = '#fff'; ctx.strokeRect(5, 5, 118, 118);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 50px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), roughness: 0.2, metalness: 0.1, emissive: color, emissiveIntensity: 0.5 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat);
    box.castShadow = true; group.add(box); scene.add(group);
    collectibles.push({ mesh: group, hit: false, text: text, baseY: 1.5 });
}

// --- Funciones de Coche y Juego (Sin cambios mayores) ---

function createCar() {
    car = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0044aa, emissiveIntensity: 0.4, roughness: 0.2 });
    carBody = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 4), bodyMat);
    carBody.position.y = 0.6; carBody.castShadow = true; car.add(carBody);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2), new THREE.MeshStandardMaterial({ color: 0x000, roughness: 0.1 }));
    cabin.position.set(0, 1.3, -0.2); cabin.castShadow = true; car.add(cabin);
    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    tailLight.position.set(0, 0.8, 2.01); car.add(tailLight);
    
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111 });
    [{x:-1,y:0.4,z:1.2}, {x:1,y:0.4,z:1.2}, {x:-1,y:0.4,z:-1.2}, {x:1,y:0.4,z:-1.2}].forEach(pos => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI/2; w.position.set(pos.x, pos.y, pos.z); w.castShadow = true;
        car.add(w); wheels.push(w);
    });

    const spot = new THREE.SpotLight(0xffffff, 2.5, 60, 0.6, 0.5, 1);
    spot.position.set(0, 1, -1); spot.target.position.set(0, 0, -15);
    spot.castShadow = true; car.add(spot); car.add(spot.target);

    // Posición inicial (Un poco antes de la entrada al hub para que el usuario la vea)
    gameState.x = 80; gameState.z = 10;
    car.position.set(gameState.x, 0, gameState.z);
    scene.add(car);
}

function mapKeyToBtnId(key) {
    if (!key) return null;
    const k = (''+key).toLowerCase();
    switch (k) {
        case 'w': case 'arrowup': return 'btn-up';
        case 's': case 'arrowdown': return 'btn-down';
        case 'a': case 'arrowleft': return 'btn-left';
        case 'd': case 'arrowright': return 'btn-right';
        default: return null;
    }
}

function setControlButtonStateFromKey(key, pressed) {
    const id = mapKeyToBtnId(key);
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    if (pressed) {
        el.classList.add('active'); el.setAttribute('aria-pressed','true');
    } else {
        el.classList.remove('active'); el.setAttribute('aria-pressed','false');
    }
}

function handleKey(e, isDown) {
    // Visual feedback on controls (if mapping exists)
    setControlButtonStateFromKey(e.key, isDown);

    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') keys.w = isDown;
    if (k === 's' || k === 'arrowdown') keys.s = isDown;
    if (k === 'a' || k === 'arrowleft') keys.a = isDown;
    if (k === 'd' || k === 'arrowright') keys.d = isDown;
}

function setupTouchControls() {
    const addTouch = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        // Ensure ARIA state
        el.setAttribute('role','button');
        el.setAttribute('aria-pressed','false');
        el.tabIndex = 0;

        // Touch / mouse
        el.addEventListener('touchstart', (e)=>{e.preventDefault(); keys[key]=true; el.setAttribute('aria-pressed','true'); el.classList.add('active');});
        el.addEventListener('touchend', (e)=>{e.preventDefault(); keys[key]=false; el.setAttribute('aria-pressed','false'); el.classList.remove('active');});
        el.addEventListener('mousedown', (e)=>{ e.preventDefault(); keys[key]=true; el.setAttribute('aria-pressed','true'); el.classList.add('active'); });
        el.addEventListener('mouseup', (e)=>{ e.preventDefault(); keys[key]=false; el.setAttribute('aria-pressed','false'); el.classList.remove('active'); });
        el.addEventListener('mouseleave', ()=>{keys[key]=false; el.setAttribute('aria-pressed','false'); el.classList.remove('active');});

        // Click: simulate short press so a click triggers action for assistive tech
        el.addEventListener('click', (e)=>{ e.preventDefault(); keys[key]=true; el.setAttribute('aria-pressed','true'); el.classList.add('active'); setTimeout(()=>{ keys[key]=false; el.setAttribute('aria-pressed','false'); el.classList.remove('active'); }, 150); });

        // Keyboard activation: use e.code to detect Space / Enter robustly
        el.addEventListener('keydown', (e)=>{
            if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!keys[key]) { keys[key]=true; el.setAttribute('aria-pressed','true'); } }
        });
        el.addEventListener('keyup', (e)=>{
            if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); keys[key]=false; el.setAttribute('aria-pressed','false'); }
        });

    };
    addTouch('btn-up', 'w'); addTouch('btn-down', 's'); addTouch('btn-left', 'a'); addTouch('btn-right', 'd');
}

function updatePhysics() {
    if (!car) return;
    if (keys.w) gameState.speed += gameState.acceleration;
    if (keys.s) gameState.speed -= gameState.acceleration;
    gameState.speed *= gameState.friction;
    if (gameState.speed > gameState.maxSpeed) gameState.speed = gameState.maxSpeed;
    if (gameState.speed < -gameState.maxSpeed/2) gameState.speed = -gameState.maxSpeed/2;
    
    if (Math.abs(gameState.speed) > 0.01) {
        const dir = gameState.speed > 0 ? 1 : -1;
        if (keys.a) gameState.angle += gameState.turnSpeed * dir;
        if (keys.d) gameState.angle -= gameState.turnSpeed * dir;
    }
    
    gameState.x += Math.sin(gameState.angle) * gameState.speed;
    gameState.z += Math.cos(gameState.angle) * gameState.speed;
    car.position.set(gameState.x, 0, gameState.z);
    car.rotation.y = gameState.angle + Math.PI;

    wheels.forEach(w => w.rotation.x += gameState.speed);
    if(wheels.length >= 4) {
        const t = (keys.a ? 0.3 : 0) + (keys.d ? -0.3 : 0);
        wheels[2].rotation.y = t; wheels[3].rotation.y = t;
    }

    document.getElementById('speedometer').innerText = Math.abs(Math.round(gameState.speed * 150)) + " km/h";
}

function updateCamera() {
    if (!car) return;
    // Cámara un poco más relajada para ver mejor el entorno
    const targetX = car.position.x - Math.sin(gameState.angle) * 18;
    const targetZ = car.position.z - Math.cos(gameState.angle) * 18;
    const targetY = car.position.y + 9;
    camera.position.x += (targetX - camera.position.x) * 0.1;
    camera.position.z += (targetZ - camera.position.z) * 0.1;
    camera.position.y += (targetY - camera.position.y) * 0.1;
    
    const lookX = car.position.x + Math.sin(gameState.angle) * 10;
    const lookZ = car.position.z + Math.cos(gameState.angle) * 10;
    camera.lookAt(lookX, car.position.y, lookZ);
}

function checkBillboardsProximity() {
    if (!car) return;
    let closest = Infinity, info = null;
    billboards.forEach(b => {
        const d = car.position.distanceTo(b.position);
        if (d < closest) { closest = d; if (d < 30) info = b.info; }
    });
    
    const el = document.getElementById('neon-popup');
    if (info) {
        document.getElementById('neon-title').innerText = info.title;
        document.getElementById('neon-desc').innerText = info.desc;
        el.classList.add('active');
    } else {
        el.classList.remove('active');
    }
}

function updateCollectibles() {
    if(!car) return;
    collectibles.forEach(c => {
        if(c.hit) {
            c.mesh.position.y += 0.5; c.mesh.rotation.y += 0.2;
            c.mesh.scale.multiplyScalar(0.9);
            if(c.mesh.scale.x < 0.05) c.mesh.visible = false;
        } else {
            c.mesh.rotation.y += 0.02;
            c.mesh.position.y = c.baseY + Math.sin(Date.now()*0.003)*0.5;
            if(car.position.distanceTo(c.mesh.position) < 3.5) c.hit = true;
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    updatePhysics(); updateCamera();
    checkBillboardsProximity(); updateCollectibles();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// On window load we setup UI toggles and start the auto entrance + background loading
window.addEventListener('load', () => {
    setupControlsToggle();

    // Auto-start the entrance animation and background loading
    startDemo({ auto: true });

    // Attach overlay controls (cancel / manual load)
    const cancelBtn = document.getElementById('cancel-load');
    const manualBtn = document.getElementById('manual-load');
    if (cancelBtn) cancelBtn.addEventListener('click', cancelDemoLoad);
    if (manualBtn) manualBtn.addEventListener('click', () => { startDemo({ force: true }); });
});

let _demoStarted = false;
let _demoCanceled = false;
function showLoadingOverlay() {
    const o = document.getElementById('loading-overlay');
    if (!o) return;
    o.setAttribute('aria-hidden','false');
}
function hideLoadingOverlay() {
    const o = document.getElementById('loading-overlay');
    if (!o) return;
    o.setAttribute('aria-hidden','true');
}

let _threeLoaded = false;
let _loadStarted = false;
let _entranceDone = false;
let _entranceTimeout = null;
let _slowTimeout = null;
const ENTRANCE_DURATION = 900; // ms (matches CSS)
const SLOW_THRESHOLD = 2200; // ms before showing manual button

function cancelDemoLoad() {
    _demoCanceled = true;
    _demoStarted = false;
    _loadStarted = false;
    _threeLoaded = false;
    _entranceDone = false;
    clearTimeout(_entranceTimeout); _entranceTimeout = null;
    clearTimeout(_slowTimeout); _slowTimeout = null;
    hideLoadingOverlay();
    // hide manual load button
    const manualBtn = document.getElementById('manual-load'); if (manualBtn) manualBtn.style.display = 'none';
    console.log('Demo load canceled by user');
}

function startDemo(opts = {}) {
    const { auto = false, force = false } = opts;
    if (_demoStarted && !force) return;
    _demoStarted = true;
    _demoCanceled = false;

    // reset states
    _entranceDone = false; _threeLoaded = false;
    const manualBtn = document.getElementById('manual-load'); if (manualBtn) manualBtn.style.display = 'none';

    showLoadingOverlay();

    // entrance animation timer
    clearTimeout(_entranceTimeout);
    _entranceTimeout = setTimeout(()=>{
        _entranceDone = true;
        // if loaded already, proceed
        if (_threeLoaded && !_demoCanceled) {
            finalizeInit();
        }
    }, ENTRANCE_DURATION);

    // slow threshold: if not loaded after SLOW_THRESHOLD, show manual button
    clearTimeout(_slowTimeout);
    _slowTimeout = setTimeout(()=>{
        if (!_threeLoaded && !_demoCanceled) {
            const mb = document.getElementById('manual-load'); if (mb) mb.style.display = 'inline-flex';
        }
    }, SLOW_THRESHOLD);

    // Begin loading if not already
    if (!_loadStarted || force) {
        _loadStarted = true;
        // Try CDN then local fallback
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', () => {
            if (_demoCanceled) return cancelDemoLoad();
            _threeLoaded = true; console.log('three.js desde CDN cargado (lazy).');
            if (_entranceDone && !_demoCanceled) finalizeInit();
        }, () => {
            if (_demoCanceled) return cancelDemoLoad();
            console.warn('CDN falló; intentando fallback local...');
            loadScript('/js/three.min.js', () => { if (_demoCanceled) return cancelDemoLoad(); _threeLoaded = true; console.log('three.js local cargado (lazy).'); if (_entranceDone && !_demoCanceled) finalizeInit(); }, () => {
                if (_demoCanceled) return cancelDemoLoad();
                console.error('No se pudo cargar three.js para demo');
                const fb = document.getElementById('webgl-fallback'); if (fb) fb.style.display = 'block';
                hideLoadingOverlay();
            });
        });
    }
}

function finalizeInit() {
    // guard against double init or canceled
    if (_demoCanceled) return cancelDemoLoad();
    if (typeof THREE === 'undefined') {
        const fb = document.getElementById('webgl-fallback'); if (fb) fb.style.display = 'block';
        hideLoadingOverlay();
        return;
    }
    try {
        init();
        console.log('Demo iniciado por startDemo()');
    } finally {
        hideLoadingOverlay();
        // hide manual button when done
        const mb = document.getElementById('manual-load'); if (mb) mb.style.display = 'none';
    }
}

// Cancel button handler
const cancelBtn = document.getElementById && document.getElementById('cancel-load');
if (cancelBtn) cancelBtn.addEventListener('click', cancelDemoLoad);

function setupControlsToggle() {
    const btn = document.getElementById('toggle-controls');
    const body = document.body;
    const mobileControls = document.getElementById('mobile-controls');
    if (!btn) return;
    // load preference
    const pref = localStorage.getItem('showControls') === 'true';
    if (pref) { body.classList.add('show-controls-on-desktop'); btn.setAttribute('aria-pressed','true'); btn.classList.add('active'); btn.setAttribute('title','Ocultar controles en pantalla'); mobileControls && mobileControls.classList.add('visible'); }

    btn.addEventListener('click', ()=>{
        const enabled = body.classList.toggle('show-controls-on-desktop');
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        btn.classList.toggle('active', enabled);
        btn.setAttribute('title', enabled ? 'Ocultar controles en pantalla' : 'Mostrar controles en pantalla');
        localStorage.setItem('showControls', enabled ? 'true' : 'false');
        if (mobileControls) {
            if (enabled) {
                mobileControls.classList.add('visible');
            } else {
                mobileControls.classList.remove('visible');
            }
        }
    });

    btn.addEventListener('keydown', (e)=>{ if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); btn.click(); } });
}
