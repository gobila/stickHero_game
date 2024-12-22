
// Extend the base functionality of JavaScript
Array.prototype.last = function () {
  return this[this.length - 1];
};

// Game States
let phase = "waiting"; // waiting | stretching | turning | walking | transitioning
let lastTimestamp; // the lastTimestamp of the previous animation cycle

let heroX; // change when moving forward
let heroY; // Only change when falling
let sceneOffset; // Moves the whole game

let platforms = [];
let sticks = [];
let score = 0;

// Configuration
const canvasWidht = 375;
const canvasHeight = 375;
const platformHeight = 100;

const stretchingSpeed = 4; // Milliseconds it takes to draw a pixel
const turningSpeed = 4; // Milliseconds it takes to turn a degree
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;


const heroWidth = 20;
const heroHeight = 30;

// Getting the canvas element
const canvas = document.getElementById("game");

// Getting the drawing context
const ctx = canvas.getContext("2d");

// Further UI elements
const scoreElement = document.getElementById("score");
const restartButton = document.getElementById("restart");

// Start game
resetGame();

// Resets game state and layout
function resetGame() {
  // Reset game state
  phase = "waiting";
  lastTimestamp = undefined;
  // By how much should we shift the screen back
  sceneOffset = 0;
  // Score
  score = 0;

  // The first platform is always the same
  platforms = [{ x: 50, w: 50 }];
  generatePlatform();
  generatePlatform();
  generatePlatform();
  generatePlatform();

  // There`s always a stick, even if it appears to be invisible (length:0)
  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  // Initialize hero position
  heroX = platforms[0].x + platforms[0].w - 30; //Hero stands a bit before the edge
  heroY = 0;

  // Reset UI
  restartButton.style.display = "none"; // Hide reset button
  scoreElement.innerText = score; // Reset score display

  draw();
}

function generatePlatform() {
  const minimunGap = 40;
  const maximumGap = 200;
  const minimunWidth = 20;
  const maximumWidth = 100;

  // X coordinate of the right edge of the furthest platform
  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;

  const x =
    furthestX +
    minimunGap +
    Math.floor(Math.random() * (maximumGap - minimunGap));
  const w =
    minimunWidth + Math.floor(Math.random() * (maximumWidth - minimunWidth));

  platforms.push({ x, w });
}

// If space was pressed restart the game
window.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();
    resetGame();
    return;
  }
});

window.addEventListener("mousedown", function (e) {
  if (phase == "waiting") {
    phase = "stretching";
    lastTimestamp = undefined;
    window.requestAnimationFrame(animate);
  }
});

window.addEventListener("mouseup", function (e) {
  if (phase == "stretching") {
    phase = "turning";
  }
});

restartButton.addEventListener("click", function (e) {
  e.preventDefault()
  resetGame();
  restartButton.style.display = "none";
});

function animate(timestamp) {
  if (!lastTimestamp) {
    // first cycle
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  let timePassed = timestamp - lastTimestamp;

  switch (phase) {
    case "waiting":
      return; // Stop the loop
    case "stretching": {
      sticks[sticks.length - 1].length += timePassed / stretchingSpeed;
      break;
    }
    case "turning": {
      sticks.last().rotation += timePassed / turningSpeed;
      if (sticks.last().rotation >= 90) {
        sticks.last().rotation = 90;
        const nextPlatform = thePlatformTheStickHits()
        if(nextPlatform){
          score++;
          scoreElement.innerText =score;
          generatePlatform();
        }
        phase= "walking"
      }
      break;
    }
    case "walking": {
      heroX += timePassed / walkingSpeed;
      const nextPlatform = thePlatformTheStickHits();
      if(nextPlatform){
        // if the hero will reach anothe platform then limit its position at its edge
        const maxheroX = nextPlatform.x + nextPlatform.w - 30;
        if(heroX > maxheroX){
          heroX = maxheroX;
          phase = "transitioning"
        }
      }else{
        // If the hero won't reach another platform then limit its position at the end of the pole
        const  maxheroX = 
          sticks[sticks.length -1].x +
          sticks[sticks.length -1].length;
        if(heroX>maxheroX){
          heroX=maxheroX;
          phase = "falling"
        }

      }
      break;
    }
    case "transitioning": {
      sceneOffset += timePassed / transitioningSpeed;
      const nextPlatform = thePlatformTheStickHits();
      if(nextPlatform.x + nextPlatform.w - sceneOffset < 100){
        sticks.push({
          x: nextPlatform.x + nextPlatform.w,
          length: 0,
          rotation: 0,
        })
        phase = "waiting";
      }
      break;
    }
    case "falling": {
      heroY += timePassed / fallingSpeed;

      if(sticks.last().rotation < 180){
        sticks.last().rotation += timePassed/turningSpeed
      }
      const maxheroY = platformHeight+100;
      if(heroY>maxheroY){
        restartButton.style.display = "block";
        return;
      }
      break;
    }
    default:
      throw Error("Wrong phase");
  }

  draw();
  window.requestAnimationFrame(animate);
  lastTimestamp = timestamp;
}

function thePlatformTheStickHits(){
  const lastStick = sticks[sticks.length-1];
  const stickFarX = lastStick.x + lastStick.length

  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  return platformTheStickHits
}

function draw() {
  // Save the current transformation
  ctx.save();
  ctx.clearRect(0, 0, canvasWidht, canvasHeight);

  // Shifting the view
  ctx.translate(-sceneOffset, 0);

  // Draw
  drawPlatforms();
  drawHero();
  drawSticks();

  // Restore transformation to the last save
  ctx.restore();
}

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    // Draw platform
    ctx.fillStyle = "brack";
    ctx.fillRect(x, canvasHeight - platformHeight, w, platformHeight);
  });
}

function drawHero() {
  const heroWidth = 20;
  const heroHeight = 30;

  ctx.fillStyle = "red";
  ctx.fillRect(
    heroX,
    heroY + canvasHeight - platformHeight - heroHeight,
    heroWidth,
    heroHeight
  );
}
function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();

    // Move the anchor point to the start of the stick and rotate
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);

    // Draw stick

    ctx.lineWidht = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();

    //  Restore transformations
    ctx.restore();
  });
}


