const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

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
backgroundMusic.loop = true;

let timer = 0;
let intervalId;
let difficultyLevel = 0; // Initial difficulty level
const difficultyIncreaseInterval = 5000; // Increase difficulty every 10 seconds

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = { x: 0, y: 0 }; // Initialize velocity
        this.speed = 3; // Normal speed
        this.boostedSpeed = 6; // Speed during boost
        this.isBoosted = false; // Track boost state
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        if (this.x - this.radius < 0) this.x = this.radius;
        if (this.x + this.radius > canvas.width) this.x = canvas.width - this.radius;
        if (this.y - this.radius < 0) this.y = this.radius;
        if (this.y + this.radius > canvas.height) this.y = canvas.height - this.radius;

        this.draw();
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.pursuing = false; // Flag to track if the enemy is pursuing
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update(player) {
        if (this.pursuing) {
            // Move toward the player
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.velocity.x = Math.cos(angle) * enemySpeed;
            this.velocity.y = Math.sin(angle) * enemySpeed;
        } else {
            // Random movement
            this.velocity.x += (Math.random() - 0.5) * 0.5; // Small random change in x
            this.velocity.y += (Math.random() - 0.5) * 0.5; // Small random change in y

            // Limit velocity to a maximum speed
            const magnitude = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            if (magnitude > enemySpeed) {
                this.velocity.x = (this.velocity.x / magnitude) * enemySpeed;
                this.velocity.y = (this.velocity.y / magnitude) * enemySpeed;
            }
        }

        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Draw the enemy
        this.draw();
    }
}

class FastEnemy extends Enemy {
    constructor(x, y) {
        const radius = 15;
        const color = 'red';
        const velocity = { x: Math.random() * 2 + 2, y: Math.random() * 2 + 2 }; // Faster speed
        super(x, y, radius, color, velocity);
    }
}

const friction = 0.99;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }
    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }
    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 10, 'white');
let projectiles = [];
let enemies = [];
let particles = [];
let animationId;
let score = 0;
let enemySpeed = 1; // Initial enemy speed

function init() {
    player = new Player(x, y, 10, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = `Score: ${score}`;
    bigScoreEl.innerHTML = score;
    enemySpeed = 1; // Reset enemy speed
    resetTimer();  // Reset timer on game start
    difficultyLevel = 0; // Reset difficulty level
}

function spawnEnemies() {
    setInterval(() => {
        const enemyType = Math.random() < 0.5 ? Enemy : FastEnemy; // 50% chance for each type
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

        const enemy = new enemyType(x, y, radius, color, velocity);
        enemy.pursuing = Math.random() < 0.5; // Randomly decide if it will pursue

        enemies.push(enemy);
    }, 1000);
}

// Increase difficulty over time
function increaseDifficulty() {
    setInterval(() => {
        difficultyLevel++;
        enemySpeed += 0.5; // Increase enemy speed
    }, difficultyIncreaseInterval);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    
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

    enemies.forEach((enemy, index) => {
        enemy.update(player);

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            clearInterval(intervalId); // Stop the timer
            modalEl.style.display = 'flex';
            bigScoreEl.innerHTML = score;
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

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
                        enemies.splice(index, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }
            }
        });
    });

    // Increase enemy speed every 1000 points
    if (score > 0 && score % 1000 === 0) {
        enemySpeed += 0.7; // Increase enemy speed
    }
}

function shootProjectile(clientX, clientY) {
    const angle = Math.atan2(clientY - player.y, clientX - player.x);
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5,
    };
    projectiles.push(new Projectile(player.x, player.y, 5, 'white', velocity));
}

addEventListener('click', (event) => {
    shootProjectile(event.clientX, event.clientY);
});

// Add touch event for mobile devices
addEventListener('touchstart', (event) => {
    event.preventDefault(); // Prevent scrolling
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

function startGame() {
    init();
    resetTimer();  // Reset the timer on game start
    startTimer();  // Start the timer
    animate();
    spawnEnemies();
    increaseDifficulty(); // Start increasing difficulty
    modalEl.style.display = 'none';
    backgroundMusic.play();
}

startGameBtn.addEventListener('click', startGame);
