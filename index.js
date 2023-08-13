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
 * The full song duration is 3 minutes 48 seconds = 228 seconds = 228000 ms
 *
 * TODO more interesting obstacle positioning, tied to music timing
 */
const obstacles = new Array(228).fill(0).map((_, i) => i + 2);

const animationFrame = () => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.beginPath();
  ctx.fillStyle = "darkgreen";
  ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fill();

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
   *
   * Let's assume an obstacle takes 2000ms to traverse 800px
   */
  obstacles
    // Anything more than 2s in the future is ignored
    .filter((t) => t - audioElement.currentTime < 2)
    // Anything more than 1s in the past is ignored
    .filter((t) => audioElement.currentTime - t < 1)
    // Map the current time offset to an X position
    .map((t) => ((t - audioElement.currentTime) * CANVAS_WIDTH) / 2)
    .forEach((position) => {
      ctx.beginPath();
      ctx.fillStyle = "red";
      ctx.rect(position, CANVAS_HEIGHT - 80, 20, 20);
      ctx.fill();
    });

  if (audioElement.paused) {
    ctx.beginPath();
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.fillText("Click or tap to start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }

  progressElement.value = audioElement.currentTime / audioElement.duration;

  // TODO handle audioElement.ended case

  requestAnimationFrame(animationFrame);
};

const handleJumpInput = () => {
  if (audioElement.paused) audioElement.play();
  if (isJumping()) return;
  jump_start_timestamp = audioElement.currentTime;
};
const handlePauseInput = () => {
  if (!audioElement.paused) audioElement.pause();
};

/**
 * We don't start anything until the song is ready.
 *
 * audioElement.duration is `NaN` before this.
 */
audioElement.addEventListener("loadedmetadata", () => {
  document.addEventListener("click", handleJumpInput);
  const jumpKeys = new Set(["Space", "ArrowUp"]);
  document.addEventListener("keyup", (e) =>
    jumpKeys.has(e.code)
      ? handleJumpInput()
      : e.code === "Escape"
      ? handlePauseInput()
      : null
  );
  requestAnimationFrame(animationFrame);
});
