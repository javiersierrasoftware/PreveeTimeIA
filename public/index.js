const avatarContainer = document.getElementById('avatar');
const responseContainer = document.getElementById('response');

// Configurar la escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, avatarContainer.clientWidth / avatarContainer.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(avatarContainer.clientWidth, avatarContainer.clientHeight);
renderer.setClearColor(0xffffff, 1); // Establecer el fondo en color blanco
avatarContainer.appendChild(renderer.domElement);

// Añadir luz ambiental a la escena
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Luz ambiental para iluminar toda la escena
scene.add(ambientLight);

// Añadir luz direccional a la escena
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(2, 2, 1).normalize();
scene.add(directionalLight);

// Variables para almacenar el modelo del avatar y el mezclador de animaciones
let avatar, mixer, lipSyncAction, armMovementAction;

// Cargar el modelo GLTF con animaciones
const loader = new THREE.GLTFLoader();
loader.load('/avatar/robot.glb', function(gltf) {
    avatar = gltf.scene;
    avatar.position.set(0, 0, 0); // Ajusta la posición del avatar hacia abajo para centrar la cara
    scene.add(avatar);

    mixer = new THREE.AnimationMixer(avatar);
    const animations = gltf.animations;

    if (animations.length > 0) {
        // Supongamos que la primera animación es para los labios y la segunda es para los brazos
        lipSyncAction = mixer.clipAction(animations[0]);
        armMovementAction = mixer.clipAction(animations[1]);
        
        // Configurar las velocidades de reproducción
        lipSyncAction.setEffectiveTimeScale(1); // Ajusta la velocidad de la animación de los labios
        armMovementAction.setEffectiveTimeScale(1); // Ajusta la velocidad de la animación de los brazos

        // Activar la animación de movimiento de brazos
        armMovementAction.play();
    } else {
        console.error("No animations found in the GLTF model.");
    }

    animate();
}, undefined, function(error) {
    console.error("Error loading GLTF model:", error);
});

// Posicionar la cámara
camera.position.set(0, 2, 4); // Acercar la cámara ajustando el valor Z a 1.5

// Función de animación
const clock = new THREE.Clock();
const animate = function() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    renderer.render(scene, camera);
};

// Inicializar la animación
animate();

// Función para mover los labios al hablar
const moveLips = (shouldMove) => {
    if (lipSyncAction) {
        if (shouldMove) {
            lipSyncAction.play();
        } else {
            lipSyncAction.stop();
        }
    }
};

// Obtener la voz masculina latina
let maleVoice;
const setVoice = () => {
    const voices = speechSynthesis.getVoices();
    maleVoice = voices.find(voice => voice.lang === 'es-MX' && voice.name.includes('Male'));
    
    if (!maleVoice) {
        maleVoice = voices.find(voice => voice.lang === 'es-US' && voice.name.includes('Male'));
    }
    
    if (!maleVoice) {
        maleVoice = voices.find(voice => voice.lang === 'es-ES' && voice.name.includes('Male'));
    }
    
    if (!maleVoice) {
        maleVoice = voices.find(voice => voice.lang === 'es-MX');
    }

    if (!maleVoice) {
        maleVoice = voices.find(voice => voice.lang === 'es-US');
    }

    if (!maleVoice) {
        maleVoice = voices.find(voice => voice.lang === 'es-ES');
    }
    
    if (!maleVoice) {
        console.warn("No suitable male voice found. Using default voice.");
    }
};

// Asegurarse de que las voces estén cargadas antes de configurar la voz
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = setVoice;
} else {
    setVoice();
}

// Funciones de reconocimiento y síntesis de voz
const startListening = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'es-ES';
    recognition.start();

    // Borrar el texto anterior cuando se empieza a escuchar
    responseContainer.innerText = '';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Transcription:', transcript);
        sendToChatGPT(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event);
    };
};

const sendToChatGPT = (message) => {
    const prompt = `Simula que eres un chatboot virtual universitario, tu te llamas TIMEIA y fuiste creado por la 
    Universidad de Sucre. Puedes dar información confiable del clima, me puedes dar pronostico del tiempo de dos fuentes diferentes para ${message} el dia de hoy. 
    `;
    
    fetch('/api/chatgpt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('ChatGPT reply:', data.reply);
        responseContainer.innerText = data.reply; // Mostrar la respuesta en el contenedor de respuesta
        speakText(data.reply);
    })
    .catch((error) => {
        console.error('Error with ChatGPT API:', error);
    });
};

const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.voice = maleVoice; // Establecer la voz masculina latina

    // Mover los labios mientras se habla
    utterance.onstart = () => moveLips(true);
    utterance.onend = () => moveLips(false);

    speechSynthesis.speak(utterance);
};