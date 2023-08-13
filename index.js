/**
 * The canvas is locked at 800 wide and 360 high
 */
const WIDTH = 800;
const HEIGHT = 360;

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

const animationFrame = (timestamp) => {
  const SPEED = 0.1;
  const timeParam = SPEED * timestamp;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.beginPath();
  ctx.fillStyle = "black";
  ctx.rect(0, 0, WIDTH, HEIGHT);
  ctx.fill();

  ctx.drawImage(swifthead, 100, timeParam % HEIGHT, 50, 60);

  requestAnimationFrame(animationFrame);
};

requestAnimationFrame(animationFrame);
