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

// The player's X position
const PLAYER_X = 100;

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
 *
 * There are 171 beats
 */
const beats = [
  2.286802, 3.127959, 4.057596, 4.976621, 5.87721, 6.837777, 7.73136, 8.629229,
  9.508662, 10.488095, 11.408639, 12.31653, 16.896054, 17.817165, 18.782857,
  19.723174, 20.668911, 21.600408, 22.501927, 23.413514, 24.355963, 25.335124,
  26.293718, 27.146575, 31.72907, 32.619705, 33.581859, 34.494444, 35.441496,
  36.362517, 37.256643, 39.163219, 40.012902, 40.944535, 41.865714, 42.783832,
  43.715306, 44.63916, 46.500113, 47.412857, 48.377369, 49.293401, 50.190816,
  51.074988, 52.004965, 53.901065, 54.853197, 55.802222, 56.710907, 61.230045,
  62.154172, 63.099546, 64.019931, 64.969773, 65.900839, 66.838752, 67.697437,
  68.710226, 69.602063, 70.516235, 71.40297, 75.995646, 76.988299, 77.89229,
  78.726213, 79.683537, 80.625396, 81.53034, 83.463265, 84.316349, 85.248503,
  86.139886, 87.062789, 87.982063, 88.952539, 90.82848, 91.698276, 92.605578,
  93.540657, 98.226938, 99.103832, 100.040204, 100.923083, 118.566099,
  119.485124, 120.407256, 121.286349, 122.156371, 123.093582, 125.909024,
  126.875056, 127.740521, 128.65551, 129.591111, 130.460793, 135.166213,
  136.091111, 136.961428, 137.891972, 138.780385, 139.721836, 140.607823,
  142.516167, 143.436734, 144.305759, 145.223378, 146.14941, 147.078299,
  148.008027, 149.901882, 150.809478, 151.771496, 152.656371, 153.594875,
  154.51712, 157.254058, 158.162244, 159.08399, 159.960997, 162.794444,
  163.725147, 164.638594, 165.521519, 166.446417, 167.371541, 168.296507,
  169.252244, 170.178095, 171.101972, 172.020317, 172.9756, 173.886485,
  174.736349, 175.665215, 176.576893, 177.585102, 178.508775, 179.391678,
  180.334353, 181.254739, 182.135306, 183.092448, 183.970113, 184.940861,
  185.78195, 186.731201, 187.741133, 188.618662, 189.598866, 190.5239,
  191.460226, 192.331224, 193.224671, 196.158594, 197.07585, 197.961859,
  198.869909, 199.780158, 200.679682, 201.680929, 203.502879, 204.390204,
  208.023401, 208.950839, 209.828185, 210.703015, 211.623219, 216.400408,
  217.28356, 218.15814, 219.052222,
];

const obstacles = beats
  // We add a little offset here so that the obstacles come just after the beat.
  // The idea is to have the player jump exactly on the musical beat,
  // and have the obstacle move under the player immediately after.
  .map((x) => x + JUMP_DURATION / 2);

const isCollision = () =>
  getPlayerHeight() < CANVAS_HEIGHT / 3 + 20 &&
  obstacles
    .map(fromTimeToPosition)
    // We collide if we are within 50px of the player's X position
    .some((pos) => Math.abs(PLAYER_X - pos) < 50);

const fromTimeToPosition = (t) => (t - audioElement.currentTime) * CANVAS_WIDTH;

const animationFrame = () => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.beginPath();
  ctx.fillStyle = "darkgreen";
  ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fill();

  // audioElement.duration is NaN before the metadata has loaded
  progressElement.value = isNaN(audioElement.duration)
    ? 0
    : audioElement.currentTime / audioElement.duration;

  if (["playing", "paused"]) {
    ctx.beginPath();
    ctx.font = "20px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.fillText(
      `${gameState.score}`,
      CANVAS_WIDTH * 0.9,
      CANVAS_HEIGHT * 0.1,
      CANVAS_WIDTH * 0.9
    );
  }

  if (["playing", "paused", "failed"].includes(gameState.stage)) {
    ctx.drawImage(
      swifthead,
      PLAYER_X,
      /**
       * We have to invert height here.
       *
       * Our game data model has "height" as going up.
       * But when drawing to canvas,
       * higher y values correspond to the downwards direction.
       */
      CANVAS_HEIGHT - getPlayerHeight(),
      50,
      60
    );

    beats
      // Anything more than 2s in the future is ignored
      .filter((t) => t - audioElement.currentTime < 2)
      // Anything more than 1s in the past is ignored
      .filter((t) => audioElement.currentTime - t < 1)
      // Map the current time offset to an X position
      .map(fromTimeToPosition)
      .forEach((position) => {
        ctx.beginPath();
        ctx.fillStyle = "green";
        ctx.rect(position, CANVAS_HEIGHT - 65, 30, 5);
        ctx.fill();
      });

    /**
     * Draw obstacles
     */
    obstacles
      // Anything more than 2s in the future is ignored
      .filter((t) => t - audioElement.currentTime < 2)
      // Anything more than 1s in the past is ignored
      .filter((t) => audioElement.currentTime - t < 1)
      // Map the current time offset to an X position
      .map(fromTimeToPosition)
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

    // TODO persist and display high scores somewhere?

    // We need this to reset the game.
    jump_start_timestamp = -Infinity;
  }

  if (gameState.stage === "succeeded") {
    ctx.beginPath();
    ctx.font = "40px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.fillText(
      "SUCCESS! Click or tap to restart",
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT * (1 / 3),
      CANVAS_WIDTH * 0.9
    );
    ctx.fillText(
      `You scored: ${gameState.score}`,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT * (2 / 3),
      CANVAS_WIDTH * 0.9
    );
  }

  if (gameState.stage === "failed") {
    ctx.beginPath();
    ctx.font = "40px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.fillText(
      "FAILED! Click or tap to restart",
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH * 0.9
    );
  }

  requestAnimationFrame(animationFrame);
};

const getScoreForJump = () => {
  const closestBeat = beats
    // Map to distance from current audio time
    .map((t) => Math.abs(t - audioElement.currentTime))
    // Sort by shortest distance
    .sort((a, b) => a - b)[0];
  // Reject anything super far off a beat
  if (closestBeat > 0.2) return 0;
  // Award up to 100 points for being close to the beat
  return Math.ceil(500 * (0.2 - closestBeat));
};

window.jumps = [];
const handleMainActionInput = () => {
  if (["start", "paused", "succeeded", "failed"].includes(gameState.stage)) {
    // If we aren't resuming from pause,
    // then we should set the track back to the beginning
    if (gameState.stage !== "paused") {
      jump_start_timestamp = -Infinity;
      audioElement.currentTime = 0;
      gameState.score = 0;
    }
    gameState.stage = "playing";
    return audioElement.play();
  }
  if (isJumping()) return;

  // This is just for recording and logging purposes
  window.jumps.push(audioElement.currentTime);

  jump_start_timestamp = audioElement.currentTime;
  gameState.score += getScoreForJump();
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
  score: 0,
};

document.addEventListener("touchstart", handleMainActionInput);
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

/**
 * TODOS
 * - volume control
 * - Detect if the user's screen can't fit the canvas
 *   - portrait mode on many mobiles won't fit for example
 */
