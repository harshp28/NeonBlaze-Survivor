const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

// Function to resize the canvas
function resizeCanvas() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const scoreEl = document.querySelector('#scoreEl');
const startGameBtn = document.querySelector('#startGameBtn');
const modalEl = document.querySelector('#modalEl');
const bigScoreEl = document.querySelector('#bigScoreEl');
const backgroundMusic = document.querySelector('#backgroundMusic');
const timerEl = document.querySelector('#timerEl');  // Timer element
const healthBarEl = document.querySelector('#healthBar'); // Select the health bar element
backgroundMusic.loop = true;
const explosionSound = document.querySelector('#explosionSound');

let timer = 0;
let intervalId;
let enemySpawnInterval;
let enemyShootInterval;  // Variable for enemy shoot interval
const enemySpawnRate = 1300; // Fixed enemy spawn rate in milliseconds
const enemySpeed = 2.2; // Fixed enemy speed
let gameOver = false; // Flag to indicate game over state

let playerHealth = 100; // Initialize player health
const maxHealth = 100;   // Max health for the player

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 10, 'white');
let projectiles = [];
let enemies = [];
let particles = [];
let invaderProjectiles = [];  // Array to hold enemy projectiles
let animationId;
let score = 0;

// Function to initialize stars
function initStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {  // Adjust number of stars here
        const position = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        };
        const velocity = {
            x: 0,
            y: 0.2  // Adjust star speed here
        };
        const radius = Math.random() * 2 + 1;  // Vary star size
        stars.push(new Star({ position, velocity, radius }));
    }
}

function init() {
    player = new Player(x, y, 10, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    invaderProjectiles = [];  // Reset enemy projectiles
    playerHealth = maxHealth; // Reset player health
    updateHealthBar();        // Update health bar
    score = 0;
    scoreEl.innerHTML = `Score: ${score}`;
    bigScoreEl.innerHTML = score;
    gameOver = false; // Reset gameOver flag

    clearInterval(enemySpawnInterval);
    clearInterval(enemyShootInterval);  // Clear any existing shoot interval
    initStars();  // Initialize stars at the start of the game
}

function updateHealthBar() {
    const healthPercentage = (playerHealth / maxHealth) * 100;
    healthBarEl.style.width = `${healthPercentage}%`;
    if (healthPercentage <= 0) {
        modalEl.style.display = 'flex';
        bigScoreEl.innerHTML = score;
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
}

// Function to spawn enemies at a fixed rate
function spawnEnemies() {
    enemySpawnInterval = setInterval(() => {
        const radius = Math.random() * (30 - 4) + 4;
        let x, y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        const velocity = {
            x: 0,
            y: 0,
        };

        const enemy = new Enemy(x, y, radius, color, velocity);
        enemies.push(enemy);
    }, enemySpawnRate);
}

// Function to make enemies shoot every 3 seconds
function enemyShootTimer() {
    enemyShootInterval = setInterval(() => {
        enemies.forEach((enemy) => {
            enemy.shoot(invaderProjectiles);  // Make each enemy shoot at the player
        });
    }, 2000);  // Shoot every 2 seconds
}

// Animation loop
function animate() {
    if (gameOver) return;  // Stop the game when gameOver is true

    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    // Update and draw stars
    stars.forEach((star) => star.update());
    
    player.update(); // Update player position and draw

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    projectiles.forEach((projectile, index) => {
        projectile.update();

        // Remove projectiles that go off-screen
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        }
    });

    invaderProjectiles.forEach((invaderProjectile, index) => {
        invaderProjectile.update();

        // Check for collision with the player
        if (
            invaderProjectile.position.y + invaderProjectile.height >= player.y - player.radius &&
            invaderProjectile.position.y <= player.y + player.radius &&
            invaderProjectile.position.x >= player.x - player.radius &&
            invaderProjectile.position.x <= player.x + player.radius
        ){
            explosionSound.play();
            playerHealth -= 20;  // Decrease health by 20
            updateHealthBar();   // Update health bar
            if (playerHealth <= 0) {
                clearInterval(intervalId); // Stop the timer
                gameOver = true;
            }
            invaderProjectiles.splice(index, 1);
        }

        // Remove projectiles that go off-screen
        if (invaderProjectile.position.y > canvas.height) {
            invaderProjectiles.splice(index, 1);
        }
    });

    enemies.forEach((enemy, index) => {
        enemy.update(player);

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        // Check for collision with the player
        if (dist - enemy.radius - player.radius < 1) {
            explosionSound.play();
            playerHealth = 0;  // Set health to zero on collision
            updateHealthBar(); // Update health bar
            clearInterval(intervalId); // Stop the timer
            gameOver = true; // Set game over flag
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            // Check for collision with projectiles
            if (dist - enemy.radius - projectile.radius < 1) {
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(
                        new Particle(
                            projectile.x,
                            projectile.y,
                            Math.random() * 2,
                            enemy.color,
                            {
                                x: (Math.random() - 0.5) * (Math.random() * 6),
                                y: (Math.random() - 0.5) * (Math.random() * 6),
                            }
                        )
                    );
                }
                
                if (enemy.radius - 10 > 5) {
                    score += 100;
                    scoreEl.innerHTML = `Score: ${score}`;

                    gsap.to(enemy, {
                        radius: enemy.radius - 10,
                    });
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                } else {
                    score += 250;
                    scoreEl.innerHTML = `Score: ${score}`;

                    setTimeout(() => {
                        enemies.splice(index, 1); // Remove enemy
                        projectiles.splice(projectileIndex, 1); // Remove projectile
                    }, 0);
                }
            }
        });
    });
}

// Function to shoot projectiles
function shootProjectile(clientX, clientY) {
    const angle = Math.atan2(clientY - player.y, clientX - player.x);
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5,
    };
    projectiles.push(new Projectile(player.x, player.y, 5, 'white', velocity));
}

// Event listener for mouse click
addEventListener('click', (event) => {
    shootProjectile(event.clientX, event.clientY);
});

// Add touch event for mobile devices
addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    shootProjectile(touch.clientX, touch.clientY);
});

// Player movement controls
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w':
        case 'W':
            player.velocity.y = -player.speed; // Move up
            break;
        case 's':
        case 'S':
            player.velocity.y = player.speed; // Move down
            break;
        case 'a':
        case 'A':
            player.velocity.x = -player.speed; // Move left
            break;
        case 'd':
        case 'D':
            player.velocity.x = player.speed; // Move right
            break;
        case ' ':
            player.isBoosted = true; // Activate boost
            player.velocity.x *= player.boostedSpeed / player.speed; // Apply boost
            player.velocity.y *= player.boostedSpeed / player.speed; // Apply boost
            break;
    }
});

// Stop player movement on key up
window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case ' ':
            player.isBoosted = false; // Deactivate boost
            player.velocity.x = (player.velocity.x / player.boostedSpeed) * player.speed; // Reset speed
            player.velocity.y = (player.velocity.y / player.boostedSpeed) * player.speed; // Reset speed
            break;
        case 'w':
        case 'W':
        case 's':
        case 'S':
            player.velocity.y = 0; // Stop vertical movement
            break;
        case 'a':
        case 'A':
        case 'd':
        case 'D':
            player.velocity.x = 0; // Stop horizontal movement
            break;
    }
});

// Timer functions
function startTimer() {
    intervalId = setInterval(() => {
        timer++;
        timerEl.innerHTML = timer;

        // Add +1 to the score every 5 seconds
        if (timer % 5 === 0) {
            score += 1;
            scoreEl.innerHTML = `Score: ${score}`;
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(intervalId);
    timer = 0;
    timerEl.innerHTML = timer;
}

// Start game function
function startGame() {
    gameOver = false;
    init(); // Initialize the game state
    resetTimer();  // Reset the timer on game start
    startTimer();  // Start the timer
    animate();     // Start the animation loop
    spawnEnemies(); // Begin spawning enemies
    enemyShootTimer(); // Start the enemy shooting every 3 seconds
    modalEl.style.display = 'none'; // Hide the modal
    backgroundMusic.play(); // Play background music
}

// Event listener for starting the game
startGameBtn.addEventListener('click', startGame);
