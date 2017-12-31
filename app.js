const mainState = {

  create: function () {
    game.stage.backgroundColor = '#2d2d2d';

    //Create the ship (player)
    this.ship = game.add.sprite(400, 550, 'ship');
    game.physics.enable(this.ship, Phaser.Physics.ARCADE);

    //Create aliens (enemy)
    this.aliens = game.add.group();
    this.aliens.enableBody = true;
    this.aliens.physicsBodyType = Phaser.Physics.ARCADE;

    for (let i = 0; i < 48; i++) {
      let c = this.aliens.create(100 + (i % 8) * 80, 80 + Math.floor(i / 8) * 60, 'enemy');
      c.body.immovable = true;
    }

    //Create the bullets that the player fires
    this.bullets = game.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;

    for (let i = 0; i < 20; i++) {
      let b = this.bullets.create(0, 0, 'bullet');
      b.exists = false;
      b.visible = false;
      b.checkWorldBounds = true;
      b.events.onOutOfBounds.add((bullet) => { bullet.kill(); });
      this.bullets.setAll('anchor.x', 0.5);
      this.bullets.setAll('anchor.y', -3);
    }

    //Create the enemy bullets
    this.enemyBullets = game.add.group();
    this.enemyBullets.enableBody = true;
    this.enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;

    for (let i = 0; i < 3; i++) {
      let e = this.enemyBullets.create(0, 0, 'enemyBullet');
      e.exists = false;
      e.visible = false;
      e.checkWorldBounds = true;
      e.events.onOutOfBounds.add((enemyBullet) => { enemyBullet.kill(); });
      this.enemyBullets.setAll('anchor.x', 0.5);
      this.enemyBullets.setAll('anchor.y', 1);
    }

    this.bulletTime = 0;

    //Creates the explosion that occurs when the player is hit by an alien ship
    this.explosion = this.game.add.sprite(0, 0, 'explode');
    this.explosion.exists = false;
    this.explosion.visible = false;
    this.explosion.anchor.x = 0.5;
    this.explosion.anchor.y = 0.5;
    this.explosion.animations.add('boom');

    //Creates the highscore board
    this.highScore = localStorage.getItem('invadershighscore');
    if (this.highScore === null) {
      localStorage.setItem('invadershighscore', 0);
      this.highScore = 0;
    }

    //Creates lives
    lives = game.add.group();
    //game.add.text(game.world.width - 100, 10, 'Lives : ', { font '34px Arial', fill: '#fff' });

    stateText = game.add.text(game.world.centerX, game.world.centerY, '', { font: '84px Arial', fill: '#fff' });
    stateText.anchor.setTo(0.5, 0.5);
    stateText.visible = false;

    for (let i = 0; i < 3; i++) {
      var ship = lives.create(game.world.width - 100 + (30 * i), 60, 'ship');
      ship.anchor.setTo(0.5, 0.5);
      ship.angle = 90;
      ship.alpha = 0.4;
    }

    this.score = 0;
    this.scoreDisplay = game.add.text(200, 20, `Score: ${this.score} \nHighScore: ${this.highScore}`, { font: '30px Arial', fill: '#ffffff' });

    //Creates the sound of the bullets being fired when the spacebar is pressed
    this.fireSound = game.add.audio('fire');

    //Game input
    this.cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
  },

  fire: function () {
    if (game.time.now > this.bulletTime) {
      this.fireSound.play();
      let bullet = this.bullets.getFirstExists(false);
      if (bullet) {
        bullet.reset(this.ship.x + (this.ship.width / 2), this.ship.y - (this.ship.height + 5));
        bullet.body.velocity.y = -300;
        this.bulletTime = game.time.now + 150;
      }
    }
  },

  gameOver: function () {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('invadershighscore', this.highScore);
    }
    game.state.start('gameover');
  },

  hit: function (bullet, enemy) {
    this.score = this.score + 10;
    bullet.kill();
    enemy.kill();
    if (this.aliens.countLiving() === 0) {
      this.score = this.score + 100;
      this.game.state.start('second');
    }
    this.scoreDisplay.text = `Score: ${this.score} \nHighScore: ${this.highScore}`;
  },

  preload: function () {
    game.load.image('ship', 'assets/ship.png');
    game.load.image('enemy', 'assets/enemy.png');
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('enemyBullet', 'assets/enemybullet.png')
    game.load.spritesheet('explode', 'assets/explode.png', 128, 128);
    game.load.audio('fire', 'assets/fire.mp3');
  },

  shipGotHit: function (alien, ship) {
    this.explosion.reset(this.ship.x + (this.ship.width / 2), this.ship.y + (this.ship.height / 2));
    this.ship.kill();
    this.explosion.animations.play('boom');
  },

  collisionHandler: function (bullet, ship) {
    bullet.kill();
    live = lives.getFirstAlive();

    if (live) {
      live.kill();
      this.ship.reset(this.game.rnd.integerInRange(0, this.game.width * 1), game.world.height * 0.92);
    } else {
      this.gameOver();
    }
  },

  enemyFires: function () {
    var livingEnemies = [];

    enemyBullet = this.enemyBullets.getFirstExists(false);

    livingEnemies.length = 0;

    this.aliens.forEachAlive(function(alien) {
      livingEnemies.push(alien);
    });

    if (enemyBullet && livingEnemies.length > 0)
    {
      let random = this.game.rnd.integerInRange(0, livingEnemies.length-1);
      let shooter = livingEnemies[random];
      enemyBullet.reset(shooter.body.x, shooter.body.y);

      game.physics.arcade.moveToObject(enemyBullet, this.ship, 120);

      firingTimer = this.game.time.now + 2000;
    }
  },

  update: function () {
    let firingTimer = 0;

    game.physics.arcade.overlap(this.bullets, this.aliens, this.hit, null, this);
    game.physics.arcade.overlap(this.aliens, this.ship, this.shipGotHit, null, this);
    game.physics.arcade.overlap(this.enemyBullets, this.ship, this.collisionHandler, null, this);

    this.ship.body.velocity.x = 0;
    this.aliens.forEach(
      (alien) => {
        alien.body.position.y = alien.body.position.y + 0.1;
        if (alien.y + alien.height > game.height) { this.gameOver(); }
      }
    );

    if (this.ship.alive) {
      this.ship.body.velocity.setTo(0, 0);

      if (this.cursors.left.isDown) {
        this.ship.body.velocity.x = -300;
      } else if (this.cursors.right.isDown) {
        this.ship.body.velocity.x = 300;
      }

      if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        this.fire();
      }

      if (this.game.time.now > firingTimer) {
        this.enemyFires();
      }
    }
  }
};

const secondState = {

  create: function () {
    game.stage.backgroundColor = '#2d2d2d';

    //Create the ship (player)
    this.ship = game.add.sprite(400, 550, 'ship');
    game.physics.enable(this.ship, Phaser.Physics.ARCADE);

    //Create aliens (enemy)
    this.aliens = game.add.group();
    this.aliens.enableBody = true;
    this.aliens.physicsBodyType = Phaser.Physics.ARCADE;

    for (let i = 0; i < 48; i++) {
      let c = this.aliens.create(100 + (i % 8) * 80, 80 + Math.floor(i / 8) * 60, 'enemy2');
      c.body.immovable = true;
    }

    //Create the bullets that the player fires
    this.bullets = game.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;

    for (let i = 0; i < 20; i++) {
      let b = this.bullets.create(0, 0, 'bullet');
      b.exists = false;
      b.visible = false;
      b.checkWorldBounds = true;
      b.events.onOutOfBounds.add((bullet) => { bullet.kill(); });
      this.bullets.setAll('anchor.x', 0.5);
      this.bullets.setAll('anchor.y', -3);
    }

    //Create the enemy bullets
    this.enemyBullets = game.add.group();
    this.enemyBullets.enableBody = true;
    this.enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;

    for (let i = 0; i < 3; i++) {
      let e = this.enemyBullets.create(0, 0, 'enemyBullet2');
      e.exists = false;
      e.visible = false;
      e.checkWorldBounds = true;
      e.events.onOutOfBounds.add((enemyBullet) => { enemyBullet.kill(); });
      this.enemyBullets.setAll('anchor.x', 0.5);
      this.enemyBullets.setAll('anchor.y', 1);
    }

    this.bulletTime = 0;

    //Creates the explosion that occurs when the player is hit by an alien ship
    this.explosion = this.game.add.sprite(0, 0, 'explode');
    this.explosion.exists = false;
    this.explosion.visible = false;
    this.explosion.anchor.x = 0.5;
    this.explosion.anchor.y = 0.5;
    this.explosion.animations.add('boom');

    //Creates the highscore board
    this.highScore = localStorage.getItem('invadershighscore');
    if (this.highScore === null) {
      localStorage.setItem('invadershighscore', 580);
      this.highScore = 580;
    }

    //Creates lives
    lives = game.add.group();
    //game.add.text(game.world.width - 100, 10, 'Lives : ', { font '34px Arial', fill: '#fff' });

    stateText = game.add.text(game.world.centerX, game.world.centerY, '', { font: '84px Arial', fill: '#fff' });
    stateText.anchor.setTo(0.5, 0.5);
    stateText.visible = false;

    for (let i = 0; i < 3; i++) {
      var ship = lives.create(game.world.width - 100 + (30 * i), 60, 'ship');
      ship.anchor.setTo(0.5, 0.5);
      ship.angle = 90;
      ship.alpha = 0.4;
    }

    this.score = 580;
    this.scoreDisplay = game.add.text(200, 20, `Score: ${this.score} \nHighScore: ${this.highScore}`, { font: '30px Arial', fill: '#ffffff' });

    //Creates the sound of the bullets being fired when the spacebar is pressed
    this.fireSound = game.add.audio('fire');

    //Game input
    this.cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
  },

  fire: function () {
    if (game.time.now > this.bulletTime) {
      this.fireSound.play();
      let bullet = this.bullets.getFirstExists(false);
      if (bullet) {
        bullet.reset(this.ship.x + (this.ship.width / 2), this.ship.y - (this.ship.height + 5));
        bullet.body.velocity.y = -300;
        this.bulletTime = game.time.now + 150;
      }
    }
  },

  gameOver: function () {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('invadershighscore', this.highScore);
    }
    game.state.start('gameover');
  },

  hit: function (bullet, enemy) {
    this.score = this.score + 10;
    bullet.kill();
    enemy.kill();
    if (this.aliens.countLiving() === 0) {
      this.score = this.score + 100;
      this.gameOver();
    }
    this.scoreDisplay.text = `Score: ${this.score} \nHighScore: ${this.highScore}`;
  },

  preload: function () {
    game.load.image('enemy2', 'assets/enemy2.png');
    game.load.image('enemyBullet2', 'assets/enemybullet2.png')
  },

  shipGotHit: function (alien, ship) {
    this.explosion.reset(this.ship.x + (this.ship.width / 2), this.ship.y + (this.ship.height / 2));
    this.ship.kill();
    this.explosion.animations.play('boom');
  },

  collisionHandler: function (bullet, ship) {
    bullet.kill();
    live = lives.getFirstAlive();

    if (live) {
      live.kill();
      this.ship.reset(this.game.rnd.integerInRange(0, this.game.width * 1), game.world.height * 0.92);
    } else {
      this.gameOver();
    }
  },

  enemyFires: function () {
    var livingEnemies = [];

    enemyBullet = this.enemyBullets.getFirstExists(false);

    livingEnemies.length = 0;

    this.aliens.forEachAlive(function(alien) {
      livingEnemies.push(alien);
    });

    if (enemyBullet && livingEnemies.length > 0)
    {
      let random = this.game.rnd.integerInRange(0, livingEnemies.length-1);
      let shooter = livingEnemies[random];
      enemyBullet.reset(shooter.body.x, shooter.body.y);

      game.physics.arcade.moveToObject(enemyBullet, this.ship, 120);

      firingTimer = this.game.time.now + 2000;
    }
  },

  update: function () {
    let firingTimer = 0;

    game.physics.arcade.overlap(this.bullets, this.aliens, this.hit, null, this);
    game.physics.arcade.overlap(this.aliens, this.ship, this.shipGotHit, null, this);
    game.physics.arcade.overlap(this.enemyBullets, this.ship, this.collisionHandler, null, this);

    this.ship.body.velocity.x = 0;
    this.aliens.forEach(
      (alien) => {
        alien.body.position.y = alien.body.position.y + 0.2;
        if (alien.y + alien.height > game.height) { this.gameOver(); }
      }
    );

    if (this.ship.alive) {
      this.ship.body.velocity.setTo(0, 0);

      if (this.cursors.left.isDown) {
        this.ship.body.velocity.x = -300;
      } else if (this.cursors.right.isDown) {
        this.ship.body.velocity.x = 300;
      }

      if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        this.fire();
      }

      if (this.game.time.now > firingTimer) {
        this.enemyFires();
      }
    }
  }
};


const gameoverState = {
  preload: function () {
    game.load.image('gameover', 'assets/gameover.jpg');
  },
  create: function () {
    const gameOverImg = game.cache.getImage('gameover');
    game.add.sprite(
      game.world.centerX - gameOverImg.width / 2,
      game.world.centerY - gameOverImg.height / 2,
      'gameover');
    game.input.onDown.add(() => { game.state.start('main'); });
  }
};

const game = new Phaser.Game(800, 600);
game.state.add('main', mainState);
game.state.add('second', secondState);
game.state.add('gameover', gameoverState);
game.state.start('main');
