// --- 1. ELEMENTOS DEL DOM (Lo que manipulamos del HTML) ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreVal = document.getElementById("scoreVal");
const levelVal = document.getElementById("levelVal");
const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const finalScoreVal = document.getElementById("finalScoreVal");
const startOverlay = document.getElementById("startOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

// --- 2. CONFIGURACIÓN DEL JUEGO ---
const CONFIG = {
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 500,
  INITIAL_SPEED: 2.5,
  SPEED_INCREMENT: 0.1,
  COLORS: {
    BALL: "#ff2d55",
    BALL_GLOW: "rgba(255, 45, 85, 0.8)",
    CATCHER: "#00f2ff",
    CATCHER_GLOW: "rgba(0, 242, 255, 0.8)"
  }
};

// --- 3. ESTADO DEL JUEGO ---
let state = {
  active: false,
  score: 0,
  level: 1,
  progress: 0,
  mouseX: CONFIG.CANVAS_WIDTH / 2
};

// Objeto de la Pelota
let ball = {
  x: 0,
  y: 0,
  radius: 12,
  dx: 0,
  dy: 0,
  speed: CONFIG.INITIAL_SPEED
};

// Barra del Catcher 
let catcher = {
  width: 90,
  height: 12,
  x: 0,
  y: CONFIG.CANVAS_HEIGHT - 30,
  borderRadius: 6
};

// --- 4. LÓGICA DE CONTROL ---

// Ajustar el tamaño del lienzo
canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

// Capturar el movimiento del ratón
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  // Guardamos la posición X relativa al canvas
  state.mouseX = (e.clientX - rect.left) * scaleX;
});

//Inicia o reinicia los valores para una nueva partida
function initGame() {
  state.score = 0;
  state.level = 1;
  state.progress = 0;
  scoreVal.textContent = state.score;
  levelVal.textContent = state.level;
  progressPercent.textContent = "0%";
  progressFill.style.height = "0%";

  // Posición inicial de la pelota
  ball.speed = CONFIG.INITIAL_SPEED;
  ball.x = Math.random() * (canvas.width - ball.radius * 2) + ball.radius;
  ball.y = 50;

  // Dirección inicial aleatoria
  ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
  ball.dy = ball.speed;

  // Posición inicial del catcher
  catcher.width = 90;
  catcher.x = canvas.width / 2 - catcher.width / 2;

  // Manejo de la interfaz
  state.active = true;
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");

  // Iniciamos el bucle del juego
  requestAnimationFrame(gameLoop);
}

//Detiene el juego y muestra la puntuación final
function handleGameOver() {
  state.active = false;
  finalScoreVal.textContent = state.score;
  gameOverOverlay.classList.remove("hidden");
}

// --- 5. EL BUCLE PRINCIPAL ---

//Actualiza las posiciones y detecta colisiones
function update() {
  if (!state.active) return;

  // 1. Mover pelota
  ball.x += ball.dx;
  ball.y += ball.dy;

  // 2. Rebotar en paredes laterales
  if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
    ball.dx *= -1;
  }

  // 3. Rebotar en el techo
  if (ball.y - ball.radius < 0) {
    ball.dy *= -1;
  }

  // 4. Mover catcher suavemente (Lerp)
  const targetX = state.mouseX - catcher.width / 2;
  catcher.x += (targetX - catcher.x) * 0.2;

  // 5. Limitar catcher a los bordes
  catcher.x = Math.max(0, Math.min(canvas.width - catcher.width, catcher.x));

  // 6. Detección de colisión con el catcher
  const hitCatcher =
    ball.y + ball.radius >= catcher.y &&
    ball.y - ball.radius <= catcher.y + catcher.height &&
    ball.x >= catcher.x &&
    ball.x <= catcher.x + catcher.width;

  if (hitCatcher && ball.dy > 0) {
    ball.dy *= -1; // Rebote hacia arriba
    state.score++;
    state.progress++;
    scoreVal.textContent = state.score;

    // Llenar la barra de progreso
    const progressRatio = Math.min(100, state.progress);
    progressFill.style.height = `${progressRatio}%`;
    progressPercent.textContent = `${progressRatio}%`;

    if (state.progress >= 100) {
      state.level++;
      state.progress = 0;
      levelVal.textContent = state.level;
      progressFill.style.height = "0%";
      progressPercent.textContent = "0%";

      // Incrementar dificultad al subir de nivel
      ball.speed += CONFIG.SPEED_INCREMENT * 5;
      catcher.width = Math.max(55, catcher.width - 8);
    }

    // Aumentar dificultad constante por cada captura
    ball.speed += CONFIG.SPEED_INCREMENT;

    // Actualizar magnitud de velocidad manteniendo la dirección
    ball.dx = (ball.dx > 0 ? 1 : -1) * ball.speed;
    ball.dy = (ball.dy > 0 ? 1 : -1) * ball.speed;
  }

  // 7. Condición de derrota (La pelota cae al fondo)
  if (ball.y > canvas.height + ball.radius) {
    handleGameOver();
  }
}

// Dibuja los elementos en el lienzo
function draw() {
  // Limpiar lienzo
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar Catcher con resplandor
  ctx.shadowBlur = 15;
  ctx.shadowColor = CONFIG.COLORS.CATCHER_GLOW;
  ctx.fillStyle = CONFIG.COLORS.CATCHER;
  ctx.beginPath();
  ctx.roundRect(catcher.x, catcher.y, catcher.width, catcher.height, catcher.borderRadius);
  ctx.fill();

  // Dibujar Pelota con resplandor
  ctx.shadowBlur = 20;
  ctx.shadowColor = CONFIG.COLORS.BALL_GLOW;
  ctx.fillStyle = CONFIG.COLORS.BALL;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  // Limpiar sombras para no afectar otros dibujos
  ctx.shadowBlur = 0;
}

// Función que se ejecuta en cada frame
function gameLoop() {
  if (!state.active) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// --- 6. ASIGNACIÓN DE EVENTOS ---
startBtn.addEventListener("click", initGame);
restartBtn.addEventListener("click", initGame);

draw();
