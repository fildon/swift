/**
 * The canvas is locked at 800 wide and 360 high
 */
const WIDTH = 800;
const HEIGHT = 360;

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

  ctx.beginPath();
  ctx.fillStyle = "red";
  ctx.arc(
    (timeParam % (WIDTH + 40)) - 20,
    (timeParam % (HEIGHT + 40)) - 20,
    20,
    0,
    2 * Math.PI
  );
  ctx.fill();

  requestAnimationFrame(animationFrame);
};

requestAnimationFrame(animationFrame);
