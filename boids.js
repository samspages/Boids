
/* Boids Simulation
 *
 * All rights go to Dylan Moreno and Sam Page.
 *
 */

'use strict';

const STARTING_BOIDS = 100;

const SOLID = 0;
const WRAP  = 1;

const BOID = 2;
const HUNTER = 3;
// let h = $(window).height();
// let w = $(window).width();

/********** SETUP **********/

function setup() {
  this.w = windowHeight;
  this.h = windowHeight;

  this.canvas = createCanvas(windowWidth, windowHeight);

  this.maxSpeed = 5;
  this.maxForce = 0.5;

  this.align    = 1;
  this.cohese   = 1;
  this.separate = 1;
  this.speedMod = 1.5;

  this.boids    = [];
  this.hunters  = [];

  this.aSlider = new Slider(100, 650, 200, 30, 0, 2, "Alignment");
  this.cSlider = new Slider(325, 650, 200, 30, 0, 2, "Cohesion");
  this.sSlider = new Slider(550, 650, 200, 30, 0, 2, "Separation");
  this.speedSlider = new Slider(800, 650, 200, 30, 1, 2, "Speed Factor");

  this.borderStyleRB = new RadioButton(1050, 650, 200, 30, "Border Style", "Solid", "Wrap");
  this.borderStyle = SOLID; // default border style

  this.boidsSB = new StatusBar(1300, 668, 75, 12, "Boids:");
  this.huntersSB = new StatusBar(1300, 610, 75, 12, "Hunters:");

  // let h = $(window).height();
  // let w = $(window).width();

  this.shapeSize = 5;

  for (let i = 0; i < STARTING_BOIDS; i++) {
    let v = p5.Vector.random2D();
    let b = new Boid(createVector(random(0, w), random(0, h)), v);
    this.boids.push(b);
  }

}

/********** DRAW **********/

function draw() {
  eventInput();

  background(0);
  
  for (let i = 0; i < boids.length; i++) {
    this.boids[i].draw();
  }

  for (let i = 0; i < hunters.length; i++) {
    hunters[i].draw();
  }

  aSlider.draw();
  cSlider.draw();
  sSlider.draw();
  speedSlider.draw();
  borderStyleRB.draw();
  boidsSB.draw(boids.length);
  huntersSB.draw(hunters.length);
}

/********** INPUT **********/
function eventInput() {

  if (mouseIsPressed) {

    if (aSlider.checkPressed(mouseX, mouseY)) {
      align = aSlider.sliderVal;
    } else if (cSlider.checkPressed(mouseX, mouseY)) {
      cohese = cSlider.sliderVal;
    } else if (sSlider.checkPressed(mouseX, mouseY)) {
      separate = sSlider.sliderVal;
    } else if (speedSlider.checkPressed(mouseX, mouseY)) {
      speedMod = speedSlider.sliderVal;
    } else if (borderStyleRB.checkPressed(mouseX, mouseY)) {
      borderStyle = borderStyleRB.selected;
    } else {
      if (mouseButton == LEFT) {
        let b = new Boid(createVector(mouseX, mouseY), p5.Vector.random2D());
        boids.push(b);
      } else if (mouseButton == RIGHT) {

        if (hunters.length < 50) {
          let h = new Hunter(mouseX, mouseY);
          hunters.push(h);
        }

      }
    }

  }

}


/**********************************************/
/********** Boid ******************************/
/**********************************************/

class Boid {

  constructor(position, velocity) {
      this.position = position;
      this.velocity = velocity;
  }

  draw() {

      this.update();

      this.drawBoid(this.position.x, this.position.y, this.velocity.heading(), BOID);
  }

  update() {
      
      this.handleBounds();

      let c = this.cohese();
      let s = this.separate();
      let a = this.align();

      this.velocity.add(c);
      this.velocity.add(s);
      this.velocity.add(a);
      this.velocity.mult(speedMod);
      this.position.add(this.velocity);

      this.velocity.limit(maxSpeed);
  }

  drawBoid(x, y, heading, type) {
    push();
      translate(x, y);
      rotate(heading);
      beginShape();
      strokeWeight(1.5);
      stroke(0xff);
      if (type == BOID) {
        fill(10, 200, 255);
      } else if (type == HUNTER) {
        fill(255, 75, 0);
      }
      vertex(shapeSize * 4, 0);
      vertex(-shapeSize, shapeSize * 2);
      vertex(0, 0);
      vertex(-shapeSize, -shapeSize * 2);
      endShape(CLOSE);
      pop();
  }

  handleBounds() {
    if (borderStyle == SOLID) {
      this.boundPosition();
    } else if (borderStyle == WRAP) {
      this.wrap();
    }
  }

  boundPosition() {
    if (this.position.x < 10)
      this.velocity.x += 5;
    else if (this.position.x > w - 10)
      this.velocity.x -= 5;

    if (this.position.y > h - 10)
      this.velocity.y -= 5;
    else if (this.position.y < 10)
      this.velocity.y += 5;
  }
  
  wrap() {

    if (this.position.x < -5) {
      this.position.x = w + 5;
    } else if (this.position.x >= w + 5) {
      this.position.x = -5;
    }
  
    if (this.position.y < -5) {
      this.position.y = h + 5;
    } else if (this.position.y >= h + 5) {
      this.position.y = -5;
    }

  }

  cohese() {
      let target = createVector();
      let neighborCount = 0;
      
      for (let i = 0; i < boids.length; i++) {
        if (boids[i] != this && this.position.dist(boids[i].position) < 10 * cohese) {
          neighborCount++;
          target.add(boids[i].position);
        }
      }
      
      if (neighborCount == 0) {
        return target;
      }
      
      target.div(neighborCount);
      let sub = p5.Vector.sub(target, this.position);
      target = p5.Vector.div(sub, 8);
      target.normalize();
      
      return target;
  }

  separate() {
      let target = createVector();
      
      for (let i = 0; i < boids.length; i++) {
        if (boids[i] != this) {
          let dist = boids[i].position.dist(this.position);
          if (dist < 40 * separate) {
            target = target.sub(p5.Vector.sub(boids[i].position, this.position));
          }
        }
      }
      
      target.normalize();
      
      return target;
  }

  align() {
      let target = createVector();
      let neighborCount = 0;
      
      for (let i = 0; i < boids.length; i++) {
        let dist = this.position.dist(boids[i].position);
        if (boids[i] != this && dist < 50 * align) {
          neighborCount++;
          target.add(boids[i].velocity);
        }
      }
      
      if (neighborCount == 0) {
        return target;
      }
      
      target.div(neighborCount);
      target.sub(this.velocity);
      target.div(10);
      target.normalize();
      
      return target;
  }
}

/**********************************************/
/********** Hunter ****************************/
/**********************************************/

class Hunter extends Boid {

  constructor(mx, my) {
    super(createVector(mx, my), p5.Vector.random2D());
  }

  draw() {
    this.update();

    super.draw();
  }

  update() {
    this.handleBounds();

    let h = this.hunt();

    this.velocity.add(h);
    this.velocity.mult(speedMod * 0.45); // extra 0.6 mult to make hunters
                                        // slower than boids
    this.position.add(this.velocity);

    this.handleCollision();
  }

  drawBoid(x, y, heading) {
    super.drawBoid(x, y, heading, HUNTER);
  }

  hunt() {
    let target = createVector();
    let neighborCount = 0;

    for (let i = 0; i < boids.length; i++) {
      if (this.position.dist(boids[i].position) < 300) {
        neighborCount++;
        target.add(boids[i].position);
      }
    }

    if (neighborCount == 0) {
      return target;
    }

    target.div(neighborCount);
    target.sub(this.position);
    target.div(8);
    target.normalize();

    for (let i = 0; i < hunters.length; i++) {
      if (hunters[i] != this) {
        let dist = hunters[i].position.dist(this.position);
        if (dist < 20 * separate) {
          target = target.sub(p5.Vector.sub(hunters[i].position, this.position));
        }
      }
    }

    target.normalize();

    return target;
  }

  handleCollision() {
    for (let i = 0; i < boids.length; i++) {
      let dist = this.position.dist(boids[i].position);
      if (dist < 4) {
        let index = boids.indexOf(boids[i]);
        boids.splice(index, 1);
        return;
      }
    }
  }
}

/**********************************************/
/********** Slider ****************************/
/**********************************************/

class Slider {

  constructor(x, y, w, h, min, max, label) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.min = min;
    this.max = max;
    this.label = label;

    this.sliderX = (x + w / 2);
    this.sliderVal = map(this.sliderX, x, x + w, min, max);
  }

  draw() {
    fill(100);
    rect(this.x - 10, this.y - 20, this.w + 20, this.h + 40);
    fill(0);
    textSize(12);
    textAlign(LEFT);
    text(int(this.min), this.x, this.y + this.h + 15);
    textAlign(RIGHT);
    text(int(this.max), this.x + this.w - 10, this.y + this.h + 15);
    textAlign(CENTER);
    textSize(14)
    text(this.label, this.x + (this.w / 2), this.y + this.h + 15);

    fill(300);
    rect(this.x, this.y, this.w, this.h);

    fill(360);
    rect(this.sliderX - 2, this.y - 3, 4, this.h + 6);
    text(int(this.sliderVal), this.sliderX + 2, this.y - 4);

  }

  checkPressed(mx, my) {
    let isChanged = false;

    if (mx >= this.x && mx <= this.x + this.w && my > this.y && my < this.y + this.h) {
      isChanged = true;
      this.sliderX = mx;
      this.sliderVal = map(this.sliderX, this.x, this.x + this.w, this.min, this.max);
    }

    return isChanged;
  }

}


/**********************************************/
/********** RadioButton ***********************/
/**********************************************/

class RadioButton {

  constructor(x, y, w, h, title, label1, label2) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.title = title;
    this.label1 = label1;
    this.label2 = label2;

    this.selected = 0;

    this.RADIUS = w / 8.0;
  }

  draw() {
    fill(100);

    rect(this.x - 10, this.y - 20, this.w + 20, this.h + 40);

    fill(0xff);

    ellipse(this.x + this.w / 4, this.y + this.h / 2, this.RADIUS, this.RADIUS);       // button 0
    ellipse(this.x + this.w * 3 / 4, this.y + this.h / 2, this.RADIUS, this.RADIUS);   // button 1

    fill(0);

    textAlign(CENTER);
    textSize(14);
    text(this.title, this.x + this.w / 2, this.y + this.h - 30);
    textSize(12);
    text(this.label1, this.x + this.w / 4, this.y + this.h + 15);
    text(this.label2, this.x + this.w * 3 / 4, this.y + this.h + 15);

    this.drawSelected();
  }

  drawSelected() {
    fill(0);

    if (this.selected == 0) {
      ellipse(this.x + this.w / 4, this.y + this.h / 2, this.RADIUS * 0.675, this.RADIUS * 0.675);
      fill(0xff);
      ellipse(this.x + this.w * 3 / 4, this.y + this.h / 2, this.RADIUS, this.RADIUS);
    } else if (this.selected == 1) {
      ellipse(this.x + this.w * 3 / 4, this.y + this.h / 2, this.RADIUS * 0.675, this.RADIUS * 0.675);
      fill(0xff);
      ellipse(this.x + this.w / 4, this.y + this.h / 2, this.RADIUS, this.RADIUS);
    }
  }

  checkPressed(mx, my) {
    if (mx >= this.x && mx <= this.x + this.w 
      && my > this.y && my < this.y + this.h) {
      
      if (mx <= this.x + this.w / 2) {
        this.selected = 0;
      } else {
        this.selected = 1;
      }

      return true;
    }

    return false;
  }
}


/**********************************************/
/********** StatusBar *************************/
/**********************************************/

class StatusBar {

  constructor(x, y, w, h, label) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
  }

  draw(num) {
    fill(100);

    rect(this.x - 10, this.y - 20, this.w + 20, this.h + 40);

    fill(0);

    textSize(14);
    textAlign(LEFT);
    text(this.label, this.x, this.y);
    text(" " + num, this.x, this.y + 20);
  }

}