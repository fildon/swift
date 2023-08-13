/**
 * The canvas is locked at 800 wide and 360 high
 */
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 360;

/**
 * The actual image is 626x742
 *
 * This is the same ratio as: 312x371
 *
 * Which is roughly the same as:
 *
 * ~ 156x185
 * ~ 50x60 = 600x720
 */
const swifthead = new Image();
swifthead.src = "swifthead.png";

const audioElement = document.querySelector("audio");
const progressElement = document.querySelector("progress");
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

/**
 * We model jumping state by remembering the last time the user started a jump.
 */
let jump_start_timestamp = -Infinity;
const JUMP_DURATION = 0.5; // 0.5seconds
/**
 * We are jumping if the most recent jump was less than a full jump duration ago.
 */
const isJumping = () => {
  return audioElement.currentTime - jump_start_timestamp < JUMP_DURATION;
};

/**
 * Get the current player height.
 *
 * If we are not jumping, they are at a fixed height.
 *
 * If they are jumping we use a sine curve to model their position rising and falling over time.
 */
const getPlayerHeight = () => {
  if (!isJumping()) return CANVAS_HEIGHT / 3;
  // Milliseconds since the jump started
  const timeSinceJump = audioElement.currentTime - jump_start_timestamp;
  // 0 to 1 proportion of jump completed
  const jumpDurationComplete = timeSinceJump / JUMP_DURATION;
  // The positive first half of a sine curve.
  // Amplitude runs from HEIGHT/3 to 2*(HEIGHT/3).
  // Wavelength is JUMP_DURATION*2 (since we only use half the wave to represent a jump)
  return (
    CANVAS_HEIGHT / 3 +
    (CANVAS_HEIGHT / 3) * Math.sin(Math.PI * jumpDurationComplete)
  );
};

/**
 * Each obstacle is represented as a timestamp in the future that it will appear.
 *
 * These values were made by me! Playing along and recording when I pressed in time with the music.
 */
const obstacles = [
  5.147981, 6.027845, 6.954149, 7.83365, 8.759002, 9.685011, 10.567233,
  11.538412, 12.418095, 13.345192, 14.273038, 15.154943, 16.082766, 17.103696,
  18.031111, 18.909954, 19.83517, 20.80712, 21.73619, 22.614625, 23.496167,
  24.562947, 25.3517, 26.277414, 27.205147, 28.130975, 28.967188, 29.986099,
  30.863741, 31.83653, 32.807301, 33.686122, 34.612018, 35.540952, 36.465941,
  37.391746, 38.27263, 39.200204, 40.127596, 41.099138, 41.977551, 42.903605,
  43.783265, 44.708548, 45.68077, 46.513605, 47.487006, 48.506848, 49.340748,
  50.267709, 51.240793, 52.119795, 53.00238, 53.929614, 54.90619, 55.832879,
  56.761814, 57.689591, 58.615011, 59.498253, 60.424399, 61.349954, 62.226643,
  63.200702, 64.173038, 65.054013, 65.981224, 66.908526, 67.787777, 68.712199,
  69.685147, 70.564376, 71.490158, 72.417823, 73.344353, 74.272018, 75.198027,
  76.126099, 77.052585, 77.97882, 78.85848, 79.784444, 80.757551, 81.685238,
  82.6139, 83.540068, 84.422607, 85.394693, 86.273673, 87.200952, 88.123854,
  89.048775, 90.023424, 90.906009, 91.87678, 92.754761, 93.63585, 94.609274,
  95.536417, 96.415804, 97.342834, 98.317188, 99.243673, 100.121564, 101.09458,
  102.022358, 102.901428, 103.782789, 104.754376, 105.678253, 106.603854,
  107.529501, 108.457619, 109.333401, 110.307052, 111.232494, 112.160589,
  113.088231, 114.013197, 114.889841, 115.817437, 116.743741, 117.665963,
  118.594104, 119.566054, 120.492539, 121.375396, 122.302086, 123.273015,
  124.108208, 125.078185, 125.958662, 126.92907, 127.81068, 128.736462,
  129.710589, 130.591541, 131.47077, 132.395759, 133.413219, 134.295306,
  135.222539, 136.194217, 137.166938, 138.046553, 138.926757, 139.854399,
  140.734081, 141.659727, 142.585963, 143.556417, 144.4356, 145.316167,
  146.289705, 147.216009, 148.139501, 149.113129, 150.036802, 150.964557,
  151.93678, 152.769886, 153.696553, 154.579319, 155.551814, 156.477823,
  157.403061, 158.329659, 159.21068, 160.09, 161.016643, 161.986485, 162.911995,
  163.792675, 164.71882, 165.690793, 166.61687, 167.546145, 168.426689,
  169.400975, 170.281247, 171.160068, 172.086167, 173.059365, 174.030702,
  174.955374, 175.838049, 176.768208, 177.693741, 178.574036, 179.496394,
  180.421428, 181.393083, 182.321179, 183.294058, 184.219047, 185.101428,
  186.076213, 187.004149, 187.88356, 188.811428, 189.739637, 190.665283,
  191.543197, 192.467913, 193.346417, 194.273446, 195.246349, 196.17195,
  197.097596, 198.024875, 198.996031, 199.922426, 200.801451, 201.680793,
  202.607369, 203.531587, 204.458979, 205.386485, 206.311814, 207.237188,
  208.116757, 209.087709, 210.014331, 210.941111, 211.822585, 212.794376,
  213.719614, 214.646145, 215.527891, 216.454875, 217.380453, 218.307891,
  219.187936,
]
  // We add a little offset here so that the obstacles come just after the beat.
  // The idea is to have the player jump exactly on the musical beat,
  // and have the obstacle move under the player immediately after.
  .map((x) => x + JUMP_DURATION / 3);

const isCollision = () =>
  getPlayerHeight() < CANVAS_HEIGHT / 3 + 20 &&
  obstacles.some(
    (o) => Math.abs(100 - (o - audioElement.currentTime) * CANVAS_WIDTH) < 50
  );

const animationFrame = () => {
  console.log(gameState.stage);

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.beginPath();
  ctx.fillStyle = "darkgreen";
  ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fill();

  progressElement.value = audioElement.currentTime / audioElement.duration;

  if (["playing", "paused", "failed"].includes(gameState.stage)) {
    /**
     * We have to invert height here.
     *
     * Our game data model has "height" as going up.
     * But when drawing to canvas,
     * higher y values correspond to the downwards direction.
     */
    ctx.drawImage(swifthead, 100, CANVAS_HEIGHT - getPlayerHeight(), 50, 60);

    /**
     * Draw obstacles
     */
    obstacles
      // Anything more than 2s in the future is ignored
      .filter((t) => t - audioElement.currentTime < 2)
      // Anything more than 1s in the past is ignored
      .filter((t) => audioElement.currentTime - t < 1)
      // Map the current time offset to an X position
      .map((t) => (t - audioElement.currentTime) * CANVAS_WIDTH)
      .forEach((position) => {
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.rect(position, CANVAS_HEIGHT - 80, 20, 20);
        ctx.fill();
      });
  }

  if (gameState.stage === "playing") {
    if (isCollision()) {
      audioElement.pause();
      gameState.stage = "failed";
    }
  }

  if (["start", "paused"].includes(gameState.stage)) {
    ctx.beginPath();
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.fillText(
      `Click or tap to ${gameState.stage === "start" ? "start" : "resume"}`,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2
    );
  }

  if (audioElement.ended && gameState.stage === "playing") {
    gameState.stage = "succeeded";

    // We need this to reset the game.
    jump_start_timestamp = -Infinity;
  }

  if (gameState.stage === "succeeded") {
    // TODO display success screen
  }

  if (gameState.stage === "failed") {
    ctx.beginPath();
    ctx.font = "40px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.fillText(
      `FAILED! Click or tap to restart`,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH * 0.9
    );
  }

  requestAnimationFrame(animationFrame);
};

const handleMainActionInput = () => {
  if (["start", "paused", "succeeded", "failed"].includes(gameState.stage)) {
    // If we aren't resuming from pause,
    // then we should set the track back to the beginning
    if (gameState.stage !== "paused") {
      jump_start_timestamp = -Infinity;
      audioElement.currentTime = 0;
    }
    gameState.stage = "playing";
    return audioElement.play();
  }
  if (isJumping()) return;
  jump_start_timestamp = audioElement.currentTime;
};
const handleEscapeInput = () => {
  if (gameState.stage === "playing") {
    audioElement.pause();
    gameState.stage = "paused";
  }
};

const gameState = {
  /**
   * start, playing, paused, succeeded, failed
   */
  stage: "start",
};

/**
 * We don't start anything until the song is ready.
 *
 * audioElement.duration is `NaN` before this.
 */
audioElement.addEventListener("loadedmetadata", () => {
  document.addEventListener("click", handleMainActionInput);
  const jumpKeys = new Set(["Space", "ArrowUp"]);
  document.addEventListener("keyup", (e) =>
    jumpKeys.has(e.code)
      ? handleMainActionInput()
      : e.code === "Escape"
      ? handleEscapeInput()
      : null
  );
  requestAnimationFrame(animationFrame);
});
