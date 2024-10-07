// Enemy projectile class
class InvaderProjectile {
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 10;
        this.height = 3;
    }

    draw() {
        c.fillStyle = 'yellow';
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

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
        this.glowIntensity = 15; // Default glow intensity
    }

    draw() {
        c.save();  // Save current canvas state

        // Increase glow intensity when boosting
        if (this.isBoosted) {
            this.glowIntensity = 30; // Higher intensity when boosting
        } else {
            this.glowIntensity = 15; // Normal intensity
        }

        // Set up the glow effect for the player
        c.shadowBlur = this.glowIntensity;
        c.shadowColor = this.color; // Glow matches the player's color

        // Draw the player
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();

        c.restore();  // Restore canvas state
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Prevent the player from going out of bounds
        if (this.x - this.radius < 0) this.x = this.radius;
        if (this.x + this.radius > canvas.width) this.x = canvas.width - this.radius;
        if (this.y - this.radius < 0) this.y = this.radius;
        if (this.y + this.radius > canvas.height) this.y = canvas.height - this.radius;

        this.draw(); // Call draw method to render the player
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
        this.glowIntensity = Math.random() * 20 + 10;  // Random glow intensity
    }

    draw() {
        c.save();  // Save current canvas state

        // Set up the glow effect
        c.shadowBlur = this.glowIntensity;
        c.shadowColor = this.color;

        // Draw the enemy
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();

        c.restore();  // Restore the canvas state (removes the glow for other objects)
    }

    update(player) {
        // Move toward the player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.velocity.x = Math.cos(angle) * enemySpeed;
        this.velocity.y = Math.sin(angle) * enemySpeed;

        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Draw the enemy with the glow effect
        this.draw();
    }

    // Enemy shooting logic
    shoot(invaderProjectiles) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const velocity = {
            x: Math.cos(angle) * 3,
            y: Math.sin(angle) * 3
        };
        invaderProjectiles.push(new InvaderProjectile({
            position: { x: this.x, y: this.y },
            velocity: velocity
        }));
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

// Star particle class (using existing Particle class logic)
class Star {
    constructor({ position, velocity, radius }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.color = '#BAA0DE';
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.draw();

        // If star moves off screen, reset it to the top
        if (this.position.y > canvas.height) {
            this.position.x = Math.random() * canvas.width;
            this.position.y = -this.radius;
        }
    }
}
