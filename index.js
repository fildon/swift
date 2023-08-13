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

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

/**
 * We model jumping state by remembering the last time the user started a jump.
 */
let jump_start_timestamp = -Infinity;
const JUMP_DURATION = 1000; // 1000ms = 1seconds

/**
 * We are jumping if the most recent jump was less than a full jump duration ago.
 */
const isJumping = () =>
  performance.now() - jump_start_timestamp < JUMP_DURATION;

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
  const timeSinceJump = performance.now() - jump_start_timestamp;
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

  requestAnimationFrame(animationFrame);
};

const handleJumpInput = () => {
  if (isJumping()) return;
  jump_start_timestamp = performance.now();
};
document.addEventListener("click", handleJumpInput);
document.addEventListener("keyup", (e) =>
  e.code === "Space" ? handleJumpInput() : null
);

requestAnimationFrame(animationFrame);
