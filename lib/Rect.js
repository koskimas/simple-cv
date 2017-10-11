'use strict';

class Rect {

  constructor(x = 0, y = 0, width = 0, height = 0) {
    if (typeof x === 'object') {
      this.x = x.x;
      this.y = x.y;
      this.width = x.width;
      this.height = x.height;
    } else {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
  }

  static create(...args) {
    return new Rect(...args);
  }

  get area() {
    return this.width * this.height;
  }

  get isEmpty() {
    return this.area === 0;
  }

  get right() {
    return this.x + this.width;
  }

  get bottom() {
    return this.y + this.height;
  }

  multipliedBy(xMul, yMul = xMul) {
    if (typeof xMul === 'object') {
      return this.multipliedBy(xMul.xMul, xMul.yMul);
    }

    return Rect.create({
      x: this.x * xMul,
      y: this.y * yMul,
      width: this.width * xMul,
      height: this.height * yMul
    });
  }

  scaledBy(xScale, yScale = xScale) {
    if (typeof xScale === 'object') {
      return this.scaledBy(xScale.xScale, xScale.yScale);
    }

    return Rect.create({
      x: this.x,
      y: this.y,
      width: this.width * xScale,
      height: this.height * yScale
    });
  }

  movedBy(x, y) {
    if (typeof x === 'object') {
      return this.movedBy(x.x, x.y);
    }

    return Rect.create({
      x: this.x + x,
      y: this.y + y,
      width: this.width,
      height: this.height
    });
  }

  intersection(rect) {
    if (!(rect instanceof Rect)) {
      rect = Rect.create(rect);
    }

    if (rect.x > this.right
      || rect.right < this.x
      || rect.y > this.bottom
      || rect.bottom < this.y) {
      return Rect.create(0, 0, 0, 0);
    }

    const x = [rect.x, rect.right, this.x, this.right].sort(compareNumbers);
    const y = [rect.y, rect.bottom, this.y, this.bottom].sort(compareNumbers);

    return Rect.create(x[1], y[1], x[2] - x[1], y[2] - y[1]);
  }

  union(rect) {
    if (!(rect instanceof Rect)) {
      rect = Rect.create(rect);
    }

    const x = Math.min(this.x, rect.x);
    const y = Math.min(this.y, rect.y);
    const right = Math.max(this.right, rect.right);
    const bottom = Math.max(this.bottom, rect.bottom);

    return Rect.create(x, y, right - x, bottom - y);
  }

  clone() {
    return Rect.create(this);
  }

  mapValues(mapper) {
    const clone = this.clone();
    Object.keys(clone).forEach(it => clone[it] = mapper(clone[it]));
    return clone;
  }
}

function compareNumbers(num1, num2) {
  return num1 - num2;
}

module.exports = {
  Rect
};